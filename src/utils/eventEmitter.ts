import EventEmitter from "events";

class BotEventEmitter extends EventEmitter {}
export const botEventEmitter = new BotEventEmitter();
