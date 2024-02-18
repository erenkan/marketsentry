import { deleteProductFromMonitor, saveProductDetails } from "../db";
import { ScraperFactory } from "../scrapers/ScapersFactory";
import { MediaMarktScraper } from "../scrapers/markets/MediaMarktScaper";
import { botEventEmitter } from "../utils/eventEmitter";
import {
  getProductsToMonitor,
  saveOrUpdateProductDetails,
} from "./productService";

export async function monitorProducts(chatId: number) {
  const products = await getProductsToMonitor(chatId);
  for (const product of products) {
    const scraper = ScraperFactory.getScraper(product.url);
    try {
      const productDetails = await scraper.getProductDetailsByUrl(product.url);
      if (productDetails !== undefined) {
        const updateStatus = await saveOrUpdateProductDetails({
          ...productDetails,
          chatId: product.chatId,
        });
        if (updateStatus === "priceUpdated") {
          // Send notification to user about price change

          botEventEmitter.emit("priceChange", {
            chatId,
            message: `Price updated for '${product.productName}'! New price: ${productDetails.price}`,
          });
        }
        if (updateStatus === "inStockUpdated") {
          // Send notification to user about in stock status change

          botEventEmitter.emit("inStockChange", {
            chatId,
            message: `In stock status updated for '${product.productName}'!`,
          });
        }

        if (updateStatus === "noChange") {
          botEventEmitter.emit("noChange", {
            chatId,
            message: `No change in price or in stock status for '${product.productName}'!`,
          });
        }
      }
    } catch (error) {
      console.error(error); // Log error
      // Log error
    } finally {
      await scraper.close();
    }
  }
}

export async function addProductToMonitor(chatId: any, productUrl: string) {
  const scraper = ScraperFactory.getScraper(productUrl);
  try {
    const productDetails = await scraper.getProductDetailsByUrl(productUrl);
    if (productDetails !== undefined) {
      await saveProductDetails({
        ...productDetails,
        chatId: chatId.toString(),
      });

      botEventEmitter.emit("productAdded", {
        chatId,
        message: `Product '${productUrl}' added to monitor.`,
      });
    } else {
      botEventEmitter.emit("productNotFound", {
        chatId,
        message: `The product '${productUrl}' was not found.`,
      });
    }
  } catch (error) {
    botEventEmitter.emit("error", {
      chatId,
      message: `An error occurred during the scraping process: ${error}`,
    });
  } finally {
    await scraper.close();
  }
}

async function removeProductFromMonitor(chatId: any, productUrl: string) {
  const deleteResult = await deleteProductFromMonitor(chatId, productUrl);
  if (deleteResult?.deletedCount === 1) {
    botEventEmitter.emit("productRemoved", {
      chatId,
      message: `Product '${productUrl}' removed from database.`,
    });
  } else {
    botEventEmitter.emit("productNotFound", {
      chatId,
      message: `Product '${productUrl}' was not found in database.`,
    });
  }
}
