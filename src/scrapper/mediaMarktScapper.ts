import { chromium, Browser, Page } from "playwright";

export class MediaMarktScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  public async init(): Promise<void> {
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();
  }

  public async searchForProduct(productName: string): Promise<any> {
    if (!this.page) await this.init();

    await this.page!.goto("https://www.mediamarkt.com.tr");
    await this.page!.fill('input[name="query"]', productName);
    await this.page!.click('button[data-identifier="searchButton"]');

    // Adjust selector to target the first product link in search results
    const productLinkSelector = "div.price-sidebar"; // Example selector, adjust based on actual page structure

    // return if price-sidebar is not found

    try {
      await this.page!.waitForSelector(productLinkSelector, { timeout: 30000 });
    } catch (error) {
      this.close();
      return;
    }

    await this.page!.waitForSelector(productLinkSelector, { timeout: 30000 });
    await this.page!.click(productLinkSelector);

    // Extract product details
    const priceContent = await this.page!.getAttribute(
      'meta[itemprop="price"]',
      "content"
    ); // Extract price from meta tag
    const price = priceContent ? parseFloat(priceContent) : 0; // Parse the price
    const inStock = price > 0; // If price is greater than 0, the product is in stock
    const url = this.page!.url();

    this.close();

    return {
      inStock,
      productName,
      price,
      url,
    };

    console.log(`In Stock: ${inStock}`);
    console.log(`Product: ${productName}`);
    console.log(`Price: ${price}`);
    console.log(`URL: ${url}`);
  }

  public async close(): Promise<void> {
    await this.browser?.close();
  }
}

// Usage example
// (async () => {
//   const scraper = new MediaMarktScraper();
//   await scraper.searchForProduct("55C745GTV");
//   await scraper.close();
// })();
