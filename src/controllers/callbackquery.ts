import Bugsnag from '@bugsnag/js';
import { buildInlineKeyboardFromMarkup } from '../lib/utils';
import { getPostStats, react } from '../lib/db';
import { BotContext, Reaction } from '../types/index';

export async function queryCallbackHandler({
    callbackQuery: cq,
    answerCbQuery,
    editMessageReplyMarkup,
    db,
}: BotContext): Promise<void> {
    if (!cq || !cq.data) {
        console.warn('Bad input');
        return;
    }

    const user_id = cq.from.id;
    const match = cq.data;
    const [reaction, post_id] = match.split(':');

    if (!reaction || !post_id) {
        console.warn('Bad input - r.match is malformed?');
        return;
    }

    try {
        const pid = parseInt(post_id, 10);
        await react(db, pid, user_id, reaction as Reaction);

        await answerCbQuery('OK!');
        await editMessageReplyMarkup({
            inline_keyboard: buildInlineKeyboardFromMarkup(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (cq?.message as any).reply_markup, // ! Typings are incorrect, they miss `reply_markup` field
                await getPostStats(db, pid),
                pid,
            ),
        });
    } catch (e) {
        Bugsnag.notify(e);
    }
}
