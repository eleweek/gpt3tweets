import chrome from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";
import { argv } from "node:process";
import { writeFileSync } from "node:fs";

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
  const results = [];
  const tweets = await page.$$("article");

  for (const tweet of tweets) {
    try {
      const tweetText = await tweet.$eval("div[lang]", (el) => el.textContent);
      const tweetDate = await tweet.$eval("time", (el) => el.dateTime);

      results.push({
        text: tweetText,
        date: new Date(tweetDate),
      });
    } catch (e) {
      console.error("Skipping tweet because of error", e);
    }
  }

  return results;
}

function constructTwitterSearchUrl(user, untilTimestamp) {
  return (
    `https://twitter.com/search?q=from%3A${user}` +
    (untilTimestamp ? `%20until%3A${untilTimestamp}` : "") +
    `&src=typed_query`
  );
}

export default async function getTweets(user, limit) {
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

    for (const result of resultsBatch) {
      tweets.add(result.text);
    }

    console.log("Got", resultsBatch.length, "tweets");
    console.log("Total tweets:", tweets.size);

    if (tweets.size >= limit) {
      console.log("Tweet limit reached, stopping");
      break;
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
getTweets(argv[2], parseInt(argv[3], 10))
  .then((tweets) => {
    const dataset = Array.from(tweets).map((tweet) => ({
      prompt: "Write a tweet in the style of a twitter user @" + argv[2] + ":",
      completion: " " + tweet,
    }));
    writeFileSync(
      "dataset.jsonl",
      dataset.map((obj) => JSON.stringify(obj)).join("\n")
    );
  })
  .catch((e) => console.error(e));
