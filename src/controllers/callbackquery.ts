import Bugsnag from '@bugsnag/js';
import debug from 'debug';
import { react } from '../lib/db';
import type { BotContext, Reaction } from '../types';
import { editMessageReplyMarkup } from '../lib/telegram';

// ! Typings are incorrect, they miss `reply_markup` field in `Message`
declare module 'telegram-typings' {
    interface Message {
        reply_markup: InlineKeyboardMarkup;
    }
}

const error = debug('bot:error');
const warn = debug('bot:warn');

export async function queryCallbackHandler(context: BotContext): Promise<void> {
    if (!context.callbackQuery || !context.callbackQuery.data || !context.callbackQuery.data.match(/^[LHSB]:\d+$/)) {
        warn('Bad input');
        return;
    }

    const user_id = context.callbackQuery.from.id;
    const [reaction, post_id] = context.callbackQuery.data.split(':');

    try {
        await context.answerCbQuery('OK!');
        const pid = parseInt(post_id, 10);
        await react(context.db, pid, user_id, reaction as Reaction);
        editMessageReplyMarkup(context, pid);
    } catch (e) {
        Bugsnag.notify(e);
        error(e);
    }
}
