import chrome from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';
import { argv } from 'node:process';

const FAKE_USER_AGENT_STRING = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36";

export default async function getTweets(user) {
  const url = `https://twitter.com/search?q=from%3A${user}&src=typed_query`
  const options = process.env.AWS_REGION
    ? {
        args: chrome.args,
        executablePath: await chrome.executablePath,
        headless: chrome.headless
      }
    : {
        args: [],
        executablePath:
          process.platform === 'win32'
            ? 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
            : process.platform === 'linux'
            ? '/usr/bin/google-chrome'
            : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      };
  
      console.log("Creating browser...");
  const browser = await puppeteer.launch(options);

  console.log("Awaiting newPage...");
  const page = await browser.newPage();
  await page.setUserAgent(
    FAKE_USER_AGENT_STRING
  )

  console.log("Setting viewport size...");
  await page.setViewport({ width: 2000, height: 1000 });
  
  console.log("Going to", url);
  await page.goto(url, { waitUntil: 'networkidle0' });
  
  console.log("Evaluating selector for the html...");
  const results = await page.$$eval('article div[lang]', (tweets) => tweets.map((tweet) => tweet.textContent));
  
  console.log(results);

  return results;
}

console.log(argv);
getTweets(argv[2]).then(console.log).catch(e => console.error(e));