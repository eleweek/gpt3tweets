const TARGET_AT_USERNAME = "@RazRazcle";
const SCROLL_BY = 1000;
const TIMEOUT = 3000;

let results = [];
let resultsTextsSet = new Set();

function scrapeCurrentTweets() {
  let articles = document.querySelectorAll("article");
  const newResults = Array.from(articles)
    .map((article) => {
      try {
        return {
          username: article.querySelector(
            'div[data-testid="User-Names"] > div:nth-child(2) > div > div'
          ).innerText,
          text: article.querySelector("div[lang]").innerText,
          likes_count: parseInt(
            article.querySelector('[data-testid="like"]').innerText,
            10
          ),
        };
      } catch (e) {
        console.log("Error scraping tweet:", e);
        return {};
      }
    })
    .filter(
      (tweet) =>
        tweet.username === TARGET_AT_USERNAME &&
        !resultsTextsSet.has(tweet.text)
    );

  results.push(...newResults);
  newResults.forEach((result) => resultsTextsSet.add(result.text));
}

async function scrollRepeatedlyAndScrape() {
  console.log("Starting scraping...");
  let noNewResultsCount = 0;
  while (true) {
    let oldSize = results.length;
    scrapeCurrentTweets();
    if (oldSize === results.length) {
      noNewResultsCount++;
      console.log("No new results, count:", noNewResultsCount);
      if (noNewResultsCount > 5) {
        console.log("Breaking...");
        break;
      }
    } else {
      noNewResultsCount = 0;
    }

    console.log("New results size:", results.length, "old size:", oldSize);
    window.scrollBy(0, SCROLL_BY);
    await new Promise((resolve) => setTimeout(resolve, TIMEOUT));
  }
}
