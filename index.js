import { chromium } from "playwright";

async function sortHackerNewsArticles() {
  // Function to convert time string to Date object
  function convertToDate(time) {
    return new Date(time);
  }

  // Function to validate if the articles on the page are sorted
  async function validateSorting(articles) {
    for (let i = 0; i < articles.length - 1; i++) {
      const currentArticleTime = convertToDate(articles[i].time);
      const nextArticleTime = convertToDate(articles[i + 1].time);
      if (currentArticleTime < nextArticleTime) {
        return false;
      }
    }
    return true;
  }

  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Go to Hacker News
  await page.goto("https://news.ycombinator.com/newest");

  let allArticles = [];

  while (allArticles.length < 100) {
    // Wait for the articles to load
    await page.waitForSelector(".athing", { timeout: 100 });

    // Get the timestamps of the articles on the current page
    const newArticles = await page.$$eval(".athing", (articles) => {
      return articles.map((article) => {
        const timeElement = article.querySelector(".age");

        const time = timeElement
          ? timeElement.getAttribute("title")
          : "No time";

        return { time };
      });
    });

    // Add new articles to the array
    allArticles = allArticles.concat(newArticles);

    // Click on the "More" link to go to the next page if we still need more articles
    if (allArticles.length < 100) {
      const moreLink = await page.$(".morelink");
      if (moreLink) {
        await moreLink.click();
        await page.waitForTimeout(200); // Wait for .2 seconds to ensure the next page loads
      } else {
        break; // No more pages to load
      }
    }
  }

  // Slice to get exactly 100 articles
  allArticles = allArticles.slice(0, 100);

  console.log(`Collected ${allArticles.length} articles.`);

  // Final validation of sorting
  const isSorted = await validateSorting(allArticles);
  if (!isSorted) {
    throw new Error("Articles are not sorted correctly from newest to oldest.");
  }

  console.log("Articles are sorted correctly.");

  // Close browser
  await browser.close();
}

sortHackerNewsArticles().catch((err) => {
  console.error(err);
  process.exit(1);
});
