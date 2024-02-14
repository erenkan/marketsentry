require("dotenv").config(); // Make sure to require dotenv at the top

import {
  deleteAllProductsForUser,
  deleteProductFromMonitor,
  getProductDetailsByUser,
  saveOrUpdateProductDetails,
  saveProductDetails,
} from "./db";

const TelegramBot = require("node-telegram-bot-api");
const { MediaMarktScraper } = require("./scrapper/mediaMarktScapper");
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// bot.on("message", async (msg: { chat: { id: any }; text: any }) => {
//   const chatId = msg.chat.id;
//   const productName = msg.text; // Assuming the message is the product name

//   const scraper = new MediaMarktScraper();
//   try {
//     const productDetails = await scraper.searchForProduct(productName);
//     console.log(productDetails);
//     if (productDetails !== undefined) {
//       // return the product details to the user with good formatting and ui
//       const updateStatus = await updateProductDetails({
//         ...productDetails,
//         userId: chatId.toString(), // Assuming chatId is unique per user
//       });

//       const message = `Product Name: ${productDetails.productName}
//       \nIn Stock: ${productDetails.inStock ? "Yes" : "No"}
//       \nPrice: ${productDetails.price}\nLink: ${productDetails.url}`;

//       // Handle different cases based on updateStatus
//       if (updateStatus === "newRecord") {
//         bot.sendMessage(chatId, message);
//       } else if (updateStatus === "priceUpdated") {
//         bot.sendMessage(chatId, `Price updated! ${message}`);
//       } else {
//         // No change in price or product not found
//         bot.sendMessage(
//           chatId,
//           `No price change detected for '${productName}'.`
//         );
//       }
//     } else {
//       bot.sendMessage(chatId, `The product '${productName}' was not found.`);
//     }
//   } catch (error) {
//     bot.sendMessage(chatId, "An error occurred during the scraping process.");
//   } finally {
//     await scraper.close();
//   }
// });

// Start monitoring on a command like /start or /monitor
bot.onText(/\/monitor/, (msg: { chat: { id: any } }) => {
  const chatId = msg.chat.id;
  // const chatId = msg.chat.id;
  // setInterval(monitorProducts, 3 * 60 * 1000); // Adjust time as needed
  bot.sendMessage(chatId, "Started monitoring products...");
});

// Stop monitoring on a command like /stop or /end
bot.onText(/\/end/, (msg: { chat: { id: any } }) => {
  const chatId = msg.chat.id;
  // clearInterval(monitorProducts);
  bot.sendMessage(chatId, "Stopped monitoring products.");
});

bot.onText(/\/add/, (msg: { chat: { id: any }; text: any }) => {
  const chatId = msg.chat.id;
  const productName = msg.text.split(" ")[1];
  addProductToMonitor(chatId, productName);
});

bot.onText(/\/remove/, (msg: { chat: { id: any }; text: any }) => {
  const chatId = msg.chat.id;
  const productName = msg.text.split(" ")[1];
  removeProductFromMonitor(chatId, productName);
});

bot.onText(/\/list/, async (msg: { chat: { id: any } }) => {
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

bot.onText(/\/clear/, async (msg: { chat: { id: any } }) => {
  const chatId = msg.chat.id;
  await deleteAllProductsForUser(chatId);
  bot.sendMessage(chatId, "All products removed from database.");
});

bot.onText(/\/help/, (msg: { chat: { id: any } }) => {
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

async function monitorProducts(chatId: any) {
  const products = await getProductsToMonitor(chatId);
  for (const product of products) {
    const scraper = new MediaMarktScraper();
    try {
      const productDetails = await scraper.searchForProduct(
        product.productName
      );
      if (productDetails !== undefined) {
        const updateStatus = await saveOrUpdateProductDetails({
          ...productDetails,
          userId: product.userId,
        });
        if (updateStatus === "priceUpdated") {
          // Send notification to user about price change
          bot.sendMessage(
            product.userId,
            `Price updated for '${product.productName}'! New price: ${productDetails.price}`
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

async function addProductToMonitor(chatId: any, productName: string) {
  const scraper = new MediaMarktScraper();
  try {
    const productDetails = await scraper.searchForProduct(productName);
    if (productDetails !== undefined) {
      await saveProductDetails({
        ...productDetails,
        userId: chatId.toString(),
      });
      bot.sendMessage(chatId, `Product '${productName}' added to database.`);
    } else {
      bot.sendMessage(chatId, `The product '${productName}' was not found.`);
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

async function getProductsToMonitor(chatId: any) {
  return await getProductDetailsByUser(chatId.toString());
}
