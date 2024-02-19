import { BaseScraper } from "./base/BaseScraper";
import { MediaMarktScraper } from "./markets/MediaMarktScaper";

export class ScraperFactory {
  static getScraper(url: string): BaseScraper {
    if (url.includes("mediamarkt.com.tr")) {
      return new MediaMarktScraper();
    }
    throw new Error("Unsupported market");
  }
}
