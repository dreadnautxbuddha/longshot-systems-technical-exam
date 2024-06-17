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

/**
 * Parses any base64 encoded messages that are logged to the browser
 *
 * @param page
 *
 * @returns CdpPage
 */
const parseBtoaLogs = async page => {
  page.on('console', async msg => {
    try {
      console.log(atob(msg.text()));
    } catch (error) {
    }
  });

  return page;
}

puppeteer
  .launch({ devtools: false })
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
  .then(parseBtoaLogs);
