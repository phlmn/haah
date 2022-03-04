import { Telegraf, Telegram } from 'telegraf';

import { telegramToken } from '../secrets';

export const telegramBot = new Telegraf(telegramToken);
telegramBot.start(ctx => {
  ctx.reply("Hallo, I bims eure Wohnung 🤪")
});

telegramBot.launch();

export const telegram = new Telegram(telegramToken);
