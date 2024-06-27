const puppeteer = require('puppeteer');

/**
 * Looks for elements with a class of `.number-box` and returns their text content and `data` attribute as an array.
 *
 * @param page
 *
 * @returns {Promise<{numberBoxes: { number: Number, data: String }[], page}>}
 */
const findNumberBoxesWithinPage = async page => {
  const numberNodes = await page.$$('.number-box');
  const numberBoxes = [];

  for (let i = 0; i < numberNodes.length; i++) {
    const unevaluatedEl = numberNodes[i];

    const [number, data] = await unevaluatedEl.evaluate(el => [el.textContent, el.getAttribute('data')]);

    numberBoxes.push({ number: parseInt(number.trim()), data });
  }

  return { page, numberBoxes };
};

/**
 * Supplies the #answer and #name element with the supplied values respectively.
 *
 * @param page
 * @param answer
 * @param name
 *
 * @returns Promise<CdpPage>
 */
const fillInputs = async (page, answer, name) => {
  return Promise
    .all([
      page.$eval('#answer', (el, answer) => el.value = answer, answer),
      page.$eval('#name', (el, name) => el.value = name, name),
    ])
    .then(() => page);
};

/**
 * Clicks on the Submit button and waits for the page reload before we can interact with the page again.
 *
 * @param page
 *
 * @returns CdpPage
 */
const clickSubmit = async page => {
  const submitBtn = await page.$('button');

  await page.evaluate(submit => submit.click(), submitBtn);
  await page.waitForNavigation();

  return page
};

/**
 * Gets run for every web socket message that we receive. Each message is assumed to be either an instruction, or an
 * action. An instruction is basically a message that is meant for the developer, whilst an action is meant to be an
 * operation to be done on the supplied `variables` that can be: `STORE`, `MOV`, `ADD`, or `END`.
 *
 * 1. `STORE` stores value in the `variables` object
 * 2. `MOV` copies a variable's value within the object into another variable
 * 3. `ADD` performs an addition between a variable and a number, and stores the result to another variable.
 * 4. `END` is just there to tell us that the next messages will no longer have to be performed.
 *
 * @param page
 * @param variables
 * @param payloadData
 *
 * @returns {Promise<void>}
 */
const onWebSocketFrameReceived = async (page, variables, { response: { payloadData } }) => {
  const segments = atob(payloadData).replace(/"/g, '').split(' ');

  switch (segments[0]) {
    case 'STORE':
      // When storing, there are two parameters. The value, and the variable name.
      var [_, value, destination] = segments;
      variables[destination] = value;
      break;
    case 'MOV':
      // When copying variables to another variable, there are two parameters. The source variable, and the destination
      // variable.
      var [_, source, destination] = segments;
      variables[destination] = variables[source];
      break;
    case 'ADD':
      // When adding two values together, there are three parameters. The value and the variable that will be used
      // in the addition operation, and the destination variable with which the final value will be assigned to.
      var [_, value, source, destination] = segments;
      variables[destination] = parseInt(variables[source]) + parseInt(value);
      break;
    case 'END':
      const values = Object.entries(variables).map(([variableName, value]) => value);

      if (! values.length) {
        return;
      }

      const sum = values.reduce((curr, prev) => parseInt(curr) + parseInt(prev));

      await submitAnswer(page, sum);
      break;
    default:
      console.info(`Instructive message received: [${payloadData}]`, atob(payloadData));
      break;
  }
};

/**
 * Sends a base-64 encoded version of the supplied answer to the page's web socket.
 *
 * @param page
 * @param answer
 * @returns {Promise<void>}
 */
const submitAnswer = async (page, answer) => {
  const prototype = await page.evaluateHandle('WebSocket.prototype');
  const sockets = await page.queryObjects(prototype);

  await page.evaluate(([socket], answer) => socket.send(answer), sockets, btoa(answer));
};

puppeteer
  .launch()
  .then(browser => browser.newPage())
  .then(
    page => page
      .goto('https://challenge.longshotsystems.co.uk/go', { waitUntil: 'domcontentloaded' })
      .then(() => page)
  )
  .then(findNumberBoxesWithinPage)
  // Here, we're calculating the answer by simply concatenating all the texts of the number boxes
  .then(({ page, numberBoxes }) => ({ page, answer: parseInt(numberBoxes.map(({ number }) => number).join('')) }))
  .then(async ({ page, answer }) => fillInputs(page, answer, 'Peter Cortez'))
  .then(clickSubmit)
  // Since we only care about the logging after the user has submitted the page, we're only going to attach the listener
  // right after submitting the answer.
  .then(async page => {
    const cdp = await page.target().createCDPSession();
    const variables = {};

    await cdp.send('Network.enable');
    await cdp.send('Page.enable');

    cdp.on('Network.webSocketFrameReceived', response => onWebSocketFrameReceived(page, variables, response));
  })
  .catch(error => console.error('An error has occurred', error));
