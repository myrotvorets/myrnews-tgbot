/* eslint-disable @typescript-eslint/no-explicit-any */

import type { InlineKeyboardMarkup } from 'telegram-typings';
import Bugsnag from '@bugsnag/js';
import { BotContext } from '../types';
import { buildInlineKeyboardFromMarkup } from './utils';
import { getPostStats } from './db';

interface QueuedItem {
    chat_id?: string | number;
    message_id?: number;
    inline_message_id?: string;
    reply_markup?: InlineKeyboardMarkup;
}

const queue: Record<string | number, QueuedItem> = {};

function notify(e: Error): void {
    Bugsnag.notify(e);
    console.error(e);
}

async function processOne(this: BotContext): Promise<void> {
    const keys = Object.keys(queue);
    if (!keys.length) {
        return;
    }

    const postId = keys[0];
    const item = queue[postId];
    delete queue[postId];

    const stats = await getPostStats(this.db, +postId);
    const oldMarkup = item.reply_markup;
    const newMarkup = { inline_keyboard: buildInlineKeyboardFromMarkup(oldMarkup, stats, +postId) };
    item.reply_markup = newMarkup;

    this.telegram
        .callApi('editMessageReplyMarkup', item)
        .then((): unknown => setImmediate(processOne.bind(this)))
        .catch((e: Error): void => {
            if (e.constructor.name === 'TelegramError') {
                if ((e as any).code === 429) {
                    const payload = (e as any).on?.payload as QueuedItem | undefined;
                    const timeout = (e as any).parameters?.retry_after as number | undefined;

                    if (payload && timeout) {
                        if (queue[postId] === undefined) {
                            queue[postId] = payload;
                            setTimeout(processOne.bind(this), timeout * 1000);
                        }

                        return;
                    }
                } else if ((e as any).code === 400) {
                    return;
                }
            }

            notify(e);
        });
}

export function editMessageReplyMarkup(context: BotContext, postId: number): void {
    const callNow = Object.keys(queue).length === 0;
    queue[postId] = {
        chat_id: context.chat?.id,
        message_id: context.message?.message_id,
        inline_message_id: context.callbackQuery?.inline_message_id,
        reply_markup: context.callbackQuery?.message?.reply_markup,
    };

    if (callNow) {
        setImmediate(processOne.bind(context));
    }
}
