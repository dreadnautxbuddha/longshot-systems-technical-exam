const puppeteer = require('puppeteer');

run = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('https://challenge.longshotsystems.co.uk/go', {
    waitUntil: 'domcontentloaded',
  });

  const numberNodes = await page.$$('.number-box');
  const numbers = [];
  for (let i = 0; i < numberNodes.length; i++) {
    const unevaluatedEl = numberNodes[i];

    [number, data] = await unevaluatedEl.evaluate(el => [el.textContent, el.getAttribute('data')]);

    numbers.push({ number: parseInt(number.trim()), data });
  }

  const numbersAsInt = parseInt(numbers.map(({ number }) => number).join(''));

  // numberNodes.forEach(async (unevaluatedEl) => {
  //   [number, data] = await unevaluatedEl.evaluate(el => [el.textContent, el.getAttribute('data')]);
  //
  //   // numbers.push({ number: parseInt(number.trim()), data })
  //   console.log({ number: parseInt(number.trim()), data })
  // });
  console.log(numbers, numbersAsInt);

  await page.$eval('#answer', (el, numbersAsInt) => el.value = numbersAsInt, numbersAsInt);
  await page.$eval('#name', el => el.value = 'test');

  await page.evaluate(submit => submit.click(), await page.$('button'))
  page.on('console', async msg => {
    const args = msg.args();
    const vals = [];
    for (let i = 0; i < args.length; i++) {
      vals.push(await args[i].jsonValue());
    }
    console.log(vals.map(v => typeof v === 'object' ? JSON.stringify(v, null, 2) : v).join('\t'));
  });
  await page.waitForNavigation();
  // await page.waitForSelector('body');
  // const text = await page.evaluate(() => {
  //   console.log('evaluating..');
  //   const anchor = document.querySelector('body');
  //   return anchor.textContent;
  // });
  console.log('next page?', await page.content());
}

run();
