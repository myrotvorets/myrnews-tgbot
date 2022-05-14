import Bugsnag from '@bugsnag/js';
import debug from 'debug';
import { react } from '../lib/db';
import type { BotContext, Reaction } from '../lib/types';
import { editMessageReplyMarkup } from '../lib/telegram';

const error = debug('bot:error');
const warn = debug('bot:warn');

export async function queryCallbackHandler(context: BotContext): Promise<void> {
    if (
        !context.callbackQuery ||
        !('data' in context.callbackQuery) ||
        !context.callbackQuery.data ||
        !/^[LHSB]:\d+$/u.exec(context.callbackQuery.data)
    ) {
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
        error(e);
        Bugsnag.notify(e as Error);
    }
}
