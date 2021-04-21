/* eslint-disable no-invalid-this */
/* eslint-disable @typescript-eslint/no-explicit-any */
import debug from 'debug';
import Bugsnag from '@bugsnag/js';
import type { InlineKeyboardMarkup, Message } from 'typegram';
import type { BotContext } from '../lib/types';
import { buildInlineKeyboardFromMarkup } from './utils';
import { getPostStats } from './db';

interface QueuedItem {
    chat_id?: string | number;
    message_id?: number;
    inline_message_id?: string;
    reply_markup?: InlineKeyboardMarkup;
}

const queue: Record<string | number, QueuedItem> = {};
const error = debug('bot:error');
const dbg = debug('bot:debug');

function notify(e: Error): void {
    error(e);
    Bugsnag.notify(e);
}

interface TelegramError extends Error {
    code: number;
    parameters?: {
        retry_after: number;
    };
    on?: {
        payload: unknown;
    };
}

function processOne(this: BotContext): void {
    const keys = Object.keys(queue);
    if (!keys.length) {
        dbg('processOne: queue is empty');
        return;
    }

    const postId = keys[0];
    const item = queue[postId];

    dbg('About to process %d', postId);

    getPostStats(this.db, +postId)
        .then((stats) => {
            dbg('Stats for post %d: %o', +postId, stats);
            delete queue[postId];

            const oldMarkup = item.reply_markup;
            const newMarkup = { inline_keyboard: buildInlineKeyboardFromMarkup(oldMarkup, stats, +postId) };
            item.reply_markup = newMarkup;

            // eslint-disable-next-line promise/no-nesting
            return this.telegram
                .callApi('editMessageReplyMarkup', item)
                .then((): unknown => setImmediate(processOne.bind(this)))
                .catch((e: Error): void => {
                    if (e.constructor.name === 'TelegramError') {
                        if ((e as TelegramError).code === 429) {
                            const payload = (e as TelegramError).on?.payload as QueuedItem | undefined;
                            const timeout = (e as TelegramError).parameters?.retry_after;

                            if (payload && timeout) {
                                if (queue[postId] === undefined) {
                                    queue[postId] = payload;
                                }

                                dbg('will retry editMessageReplyMarkup for post %d in %d seconds', +postId, timeout);
                                setTimeout(processOne.bind(this), timeout * 1000);
                                return;
                            }
                        } else if ((e as TelegramError).code === 400) {
                            dbg('Skipping error 400 from editMessageReplyMarkup: %o', e);
                            setImmediate(processOne.bind(this));
                            return;
                        }
                    }

                    setImmediate(processOne.bind(this));
                    notify(e);
                });
        })
        .catch((e) => notify(e));
}

export function editMessageReplyMarkup(context: BotContext, postId: number): void {
    const callNow = Object.keys(queue).length === 0;
    const entry = {
        chat_id: context.chat?.id,
        message_id: context.callbackQuery?.message?.message_id,
        inline_message_id: context.callbackQuery?.inline_message_id,
        reply_markup: (context.callbackQuery?.message as Message.CommonMessage | undefined)?.reply_markup,
    };

    dbg('Queueing %o', entry);
    queue[postId] = entry;

    if (callNow) {
        setImmediate(processOne.bind(context));
    }
}
