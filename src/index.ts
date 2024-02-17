import dotenv from "dotenv";

dotenv.config(); // Load environment variables

import { setupBotCommands } from "./notifications/telegramBot";

setupBotCommands(); // This sets up the bot commands
