# MarketMate: Track Product Prices and Availability

MarketMate is a Telegram bot designed to help users track the prices and availability of products on MediaMarkt. Using Playwright for web scraping and MongoDB for data storage, MarketMate offers real-time notifications and price comparison to ensure you never miss a deal.

## Features

- **Product Search**: Search for products directly through the Telegram bot.
- **Price Tracking**: Automatically monitors prices and stock availability.
- **Real-Time Notifications**: Receive updates when there are changes in price or stock status.
- **User-Specific Tracking**: Track products based on individual user preferences.

## Technologies Used

- Node.js
- MongoDB
- Playwright
- Telegram Bot API

## Getting Started

### Prerequisites

- Node.js installed
- MongoDB account and database
- Telegram bot token

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Install Yarn packages:
   ```bash
   yarn install
   ```
3. Create a `.env` file in the root directory and add the following environment variables:
   ```env
    TELEGRAM_BOT_TOKEN=<your-telegram-bot-token>
    MONGODB_URI=<your-mongodb-uri>
   ```
4. Build the project:
   ```bash
   yarn build
   ```
5. Start the bot:
   ```bash
    yarn start
   ```
6. Here are the commands you can use to interact with the bot:

```bash
/start - Start the bot
/monitor - Start monitoring products
/end - Stop monitoring products
/add [product name] - Add product to monitor
/remove [product name] - Remove product from monitor
/list - List products being monitored
/help - Show help message
```
