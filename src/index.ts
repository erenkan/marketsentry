import dotenv from "dotenv";

dotenv.config(); // Load environment variables

import {
  deleteAllProductsForUser,
  deleteProductFromMonitor,
  getProductDetailsByUser,
  saveOrUpdateProductDetails,
  saveProductDetails,
} from "./db";

import TelegramBot, { Message } from "node-telegram-bot-api";
import { MediaMarktScraper } from "./scrapper/mediaMarktScapper";
const token = process.env.TELEGRAM_BOT_TOKEN || ""; // Ensure token is defined
const bot = new TelegramBot(token, { polling: true });

// Start monitoring on a command like /start or /monitor
bot.onText(/\/monitor/, (msg: { chat: { id: any } }) => {
  const chatId = msg.chat.id;
  setInterval(() => monitorProducts(chatId), 1 * 60 * 1000); // Adjust time as needed
  bot.sendMessage(chatId, "Started monitoring products...");
});

// Stop monitoring on a command like /stop or /end
bot.onText(/\/end/, (msg: Message) => {
  const chatId = msg.chat.id;
  // clearInterval(monitorProducts);
  bot.sendMessage(chatId, "Stopped monitoring products.");
});

bot.onText(/\/add/, (msg: Message) => {
  const chatId = msg.chat.id;
  const productName = (msg.text ?? "").split(" ")[1];
  addProductToMonitor(chatId, productName);
});

bot.onText(/\/remove/, (msg: Message) => {
  const chatId = msg.chat.id;
  const productName = (msg.text ?? "").split(" ")[1];
  removeProductFromMonitor(chatId, productName);
});

bot.onText(/\/list/, async (msg: Message) => {
  const chatId = msg.chat.id;
  const products = await getProductsToMonitor(chatId);
  if (products.length === 0) {
    bot.sendMessage(chatId, "No products are being monitored.");
  } else {
    const message = products
      .map(
        (product) =>
          `Product Name: ${product.productName}\nPrice: ${product.price}\nLink: ${product.url}`
      )
      .join("\n\n");
    bot.sendMessage(chatId, message);
  }
});

bot.onText(/\/clear/, async (msg: Message) => {
  const chatId = msg.chat.id; // Convert chatId to string
  await deleteAllProductsForUser(chatId);
  bot.sendMessage(chatId, "All products removed from database.");
});

bot.onText(/\/help/, (msg: Message) => {
  const chatId = msg.chat.id;
  const message = `Commands:
  /monitor - Start monitoring products
  /end - Stop monitoring products
  /add [product name] - Add product to monitor
  /remove [product name] - Remove product from monitor
  /list - List products being monitored
  /help - Show help message`;
  bot.sendMessage(chatId, message);
});

// Monitor products

async function monitorProducts(chatId: number) {
  const products = await getProductsToMonitor(chatId);
  for (const product of products) {
    const scraper = new MediaMarktScraper();
    try {
      const productDetails = await scraper.getProductDetailsByUrl(product.url);
      if (productDetails !== undefined) {
        const updateStatus = await saveOrUpdateProductDetails({
          ...productDetails,
          chatId: product.chatId,
        });
        if (updateStatus === "priceUpdated") {
          // Send notification to user about price change
          bot.sendMessage(
            product.chatId,
            `Price updated for '${product.productName}'! New price: ${productDetails.price}`
          );
        }
        if (updateStatus === "inStockUpdated") {
          // Send notification to user about in stock status change
          bot.sendMessage(
            product.chatId,
            `In stock status updated for '${product.productName}'!`
          );
        }
      }
    } catch (error) {
      // Log error
    } finally {
      await scraper.close();
    }
  }
}

// Add product to monitor

async function addProductToMonitor(chatId: any, productUrl: string) {
  const scraper = new MediaMarktScraper();
  try {
    const productDetails = await scraper.getProductDetailsByUrl(productUrl);
    if (productDetails !== undefined) {
      await saveProductDetails({
        ...productDetails,
        chatId: chatId.toString(),
      });
      bot.sendMessage(chatId, `Product '${productUrl}' added to database.`);
    } else {
      bot.sendMessage(chatId, `The product '${productUrl}' was not found.`);
    }
  } catch (error) {
    bot.sendMessage(chatId, "An error occurred during the scraping process.");
  } finally {
    await scraper.close();
  }
}

// Remove product from monitor

async function removeProductFromMonitor(chatId: any, productName: string) {
  const deleteResult = await deleteProductFromMonitor(
    productName,
    chatId.toString()
  );
  if (deleteResult?.deletedCount === 1) {
    bot.sendMessage(chatId, `Product '${productName}' removed from database.`);
  } else {
    bot.sendMessage(
      chatId,
      `Product '${productName}' was not found in database.`
    );
  }
}

async function getProductsToMonitor(chatId: number) {
  return await getProductDetailsByUser(chatId);
}
