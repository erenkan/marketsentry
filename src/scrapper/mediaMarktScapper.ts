import { chromium, Browser, Page } from "playwright";

export class MediaMarktScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  public async init(): Promise<void> {
    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();
  }

  /**
   * Searches for a product on the MediaMarkt website.
   *
   * @param productName - The name of the product to search for.
   * @returns A Promise that resolves to an object containing the product details, including whether it is in stock, the product name, price, and URL.
   */
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
  }

  /**
   * Retrieves the details of a product by its URL.
   * @param productUrl The URL of the product.
   * @returns A Promise that resolves to an object containing the product details.
   */
  public async getProductDetailsByUrl(productUrl: string): Promise<any> {
    if (!this.page) await this.init();
    await this.page!.goto(productUrl);

    // Use page.$ to check for the presence of price-sidebar without waiting
    const productPriceSidebar = await this.page!.$("div.price-sidebar");

    // Fetch product name regardless of price-sidebar's existence
    const productName = await this.page!.textContent('h1[itemprop="name"]');

    // If price-sidebar is not found, return with price: 0 and inStock: false
    if (!productPriceSidebar) {
      this.close();
      return {
        inStock: false,
        productName: productName?.trim(), // Ensure productName is trimmed
        price: 0,
        url: productUrl,
      };
    }

    // If price-sidebar exists, proceed to extract price and stock status
    const priceContent = await this.page!.getAttribute(
      'meta[itemprop="price"]',
      "content"
    );
    const price = priceContent ? parseFloat(priceContent) : 0;
    const inStock = price > 0;
    const url = this.page!.url();

    this.close();

    return {
      inStock,
      productName: productName?.trim(), // Ensure productName is trimmed
      price,
      url,
    };
  }

  public async close(): Promise<void> {
    await this.browser?.close();
  }
}
