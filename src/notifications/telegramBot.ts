import dotenv from "dotenv";
dotenv.config(); // Load environment variables
import { botEventEmitter } from "../utils/eventEmitter";

import TelegramBot, { Message } from "node-telegram-bot-api";
import {
  deleteAllProductsForUser,
  saveProductDetails,
  deleteProductFromMonitor,
} from "../db";
import { MediaMarktScraper } from "../scrapers/markets/MediaMarktScaper";
import {
  addProductToMonitor,
  monitorProducts,
} from "../services/monitorService";
import { getProductsToMonitor } from "../services/productService";

const token = process.env.TELEGRAM_BOT_TOKEN || ""; // Ensure token is defined
const bot = new TelegramBot(token, { polling: true });

const events = [
  "priceChange",
  "inStockChange",
  "noChange",
  "productAdded",
  "productRemoved",
  "productNotFound",
  "error",
  "monitorStarted",
];

export const setupBotCommands = () => {
  events.map((event) =>
    botEventEmitter.on(event, ({ chatId, message }) => {
      bot.sendMessage(chatId, message);
    })
  );
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
    deleteProductFromMonitor(chatId, productName);
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
};
