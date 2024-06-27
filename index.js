const puppeteer = require('puppeteer');
const WebSocket = require('ws');

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

    [number, data] = await unevaluatedEl.evaluate(el => [el.textContent, el.getAttribute('data')]);

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
const submitAnswer = async page => {
  const submitBtn = await page.$('button');

  await page.evaluate(submit => submit.click(), submitBtn);
  await page.waitForNavigation();

  return page
};

puppeteer
  .launch({ devtools: true })
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
  .then(submitAnswer)
  // Since we only care about the logging after the user has submitted the page, we're only going to attach the listener
  // right after submitting the answer.
  .then(async page => {
    const cdp = await page.target().createCDPSession();
    const data = {};

    await cdp.send('Network.enable');
    await cdp.send('Page.enable');

    const printReceivingResponse = async ({ response: { payloadData } }) => {
      const segments = atob(payloadData).replace(/"/g, '').split(' ');

      switch (segments[0]) {
        case 'STORE':
          // When storing, there are two parameters. The variable name, and the value.
          var [action, value, destination] = segments;
          data[destination] = value;
          break;
        case 'MOV':
          // When copying variables to another variable, there are two parameters. The destination variable, and the
          // source variable.
          var [action, source, destination] = segments;
          data[destination] = data[source];
          break;
        case 'ADD':
          // When adding two values together, there are three parameters. The value and the variable that will be used
          // in the addition operation, and the destination variable with which the final value will be assigned to.
          var [action, value, source, destination] = segments;
          data[destination] = parseInt(data[source]) + parseInt(value);
          break;
        case 'END':
            console.log('done!', data);
            const values = Object.entries(data).map(([key, value]) => value);

            if (! values.length) {
              return;
            }
            const prototype = await page.evaluateHandle('WebSocket.prototype');
            const socketInstances = await page.queryObjects(prototype);
            const finalValue = values.reduce((curr, prev) => parseInt(curr) + parseInt(prev));

            console.log('heres the final value', finalValue);

            await page.evaluate(
              (socketInstances, finalValue) => {
                socketInstance = socketInstances[0];
                console.log('sending the final value..', finalValue)
                socketInstance.send(btoa(finalValue));
              },
              socketInstances,
              finalValue
            );
            break;
        default:
          console.log('getting something!', payloadData, atob(payloadData));
          break;
      }
      // console.log('receiving response: ', response);

      // await page.evaluate((instances) => {
      //   let instance = instances[0];
      //   instance.send('Hello');
      // }, socketInstances);
    };
    const printSendingResponse = response => console.log('sending response: ', response);

    cdp.on('Network.webSocketFrameReceived', printReceivingResponse); // Fired when WebSocket message is received.
    cdp.on('Network.webSocketFrameSent', printSendingResponse); // Fired when WebSocket message is sent.

    // const ws = new WebSocket('wss://challenge.longshotsystems.co.uk/okws');
    // ws.onmessage = ({ data }) => {
    //   console.log(data)
    // };
  });
