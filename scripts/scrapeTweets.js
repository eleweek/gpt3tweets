import chrome from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";
import { argv } from "node:process";

const FAKE_USER_AGENT_STRING =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36";
const PUPPETEER_OPTIONS = process.env.AWS_REGION
  ? {
      args: chrome.args,
      executablePath: await chrome.executablePath,
      headless: chrome.headless,
    }
  : {
      args: [],
      executablePath:
        process.platform === "win32"
          ? "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
          : process.platform === "linux"
          ? "/usr/bin/google-chrome"
          : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    };

async function parseTweetsFromPage(page) {
  const tweetTexts = await page.$$eval(
    "article div[lang]:first-of-type",
    (tweets) => tweets.map((tweet) => tweet.textContent)
  );

  // div[data-testid="User-Names"] to not get the quote tweets
  const dates = await page.$$eval(
    'article div[data-testid="User-Names"] time',
    (dates) => dates.map((date) => date.dateTime)
  );
  if (tweetTexts.length !== dates.length) {
    console.log(tweetTexts);
    throw new Error(
      "tweet texts and dates length mismatch: " +
        tweetTexts.length +
        " vs " +
        dates.length
    );
  }

  // Zip results and dates together
  return tweetTexts.map((result, index) => {
    return {
      text: result,
      date: new Date(dates[index]),
    };
  });
}

function constructTwitterSearchUrl(user, untilTimestamp) {
  return (
    `https://twitter.com/search?q=from%3A${user}` +
    (untilTimestamp ? `%20until%3A${untilTimestamp}` : "") +
    `&src=typed_query`
  );
}

export default async function getTweets(user) {
  console.log("Creating browser...");
  const browser = await puppeteer.launch(PUPPETEER_OPTIONS);

  console.log("Awaiting newPage...");
  const page = await browser.newPage();
  await page.setUserAgent(FAKE_USER_AGENT_STRING);

  console.log("Setting viewport size...");
  await page.setViewport({ width: 2000, height: 1000 });

  const tweets = new Set();
  let untilTimestamp;

  while (true) {
    const url = constructTwitterSearchUrl(user, untilTimestamp);

    console.log("Going to", url);
    await page.goto(url, { waitUntil: "networkidle0" });

    const resultsBatch = await parseTweetsFromPage(page);

    console.log("Got", resultsBatch.length, "tweets");

    for (const result of resultsBatch) {
      tweets.add(result.text);
    }

    if (resultsBatch.length === 0) {
      break;
    }

    const minTimestamp = Math.min(
      ...resultsBatch.map((result) => Math.trunc(result.date.getTime() / 1000))
    );
    untilTimestamp = minTimestamp - 1;
    console.log("New untilTimestamp:", untilTimestamp);
  }

  return tweets;
}

console.log(argv);
getTweets(argv[2])
  .then(console.log)
  .catch((e) => console.error(e));
