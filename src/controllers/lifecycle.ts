/* eslint-disable no-await-in-loop */
import Bugsnag from '@bugsnag/js';
import debug from 'debug';
import knex from 'knex';
import Telegraf from 'telegraf';
import { InlineKeyboardMarkup } from 'telegram-typings';
import { addPost, checkPostExists } from '../lib/db';
import { Environment } from '../lib/environment';
import { buildInlineKeyboardFromPost, generateDescription } from '../lib/utils';
import { getFeaturedImageUrl, getPosts } from '../lib/wpapi';
import type { BotContext, PostData } from '../types';

const error = debug('bot:error');
const dbg = debug('bot:debug');

async function getNewPosts(baseUrl: string, db: knex): Promise<PostData[]> {
    const result: PostData[] = [];
    const posts = await getPosts(baseUrl);
    for (let i = posts.length - 1; i >= 0; --i) {
        const post = posts[i];
        if (!(await checkPostExists(db, post.id))) {
            post.img = post.featuredMedia ? await getFeaturedImageUrl(baseUrl, post.featuredMedia) : undefined;
            result.push(post);
        }
    }

    return result;
}

async function sendNewPosts(bot: Telegraf<BotContext>, chat: number, data: PostData[]): Promise<void> {
    for (const entry of data) {
        const reply_markup: InlineKeyboardMarkup = {
            inline_keyboard: buildInlineKeyboardFromPost(entry),
        };

        try {
            const parse_mode = 'HTML';
            const text = generateDescription(entry);
            if (entry.img) {
                dbg('Sending post %d as photo', entry.id);
                await bot.telegram.sendPhoto(chat, entry.img, { caption: text, parse_mode, reply_markup });
            } else {
                dbg('Sending post %d as message', entry.id);
                await bot.telegram.sendMessage(chat, text, { parse_mode, reply_markup });
            }

            await addPost(bot.context.db, entry.id);
        } catch (e) {
            Bugsnag.notify(e);
            error(e);
        }
    }
}

export async function lifecycle(env: Environment, bot: Telegraf<BotContext>): Promise<void> {
    const inner = async function (): Promise<void> {
        try {
            const posts = await getNewPosts(env.NEWS_ENDPOINT, bot.context.db);
            dbg('Got %d new posts', posts.length);
            if (posts.length) {
                await sendNewPosts(bot, env.CHAT_ID, posts);
            }
        } catch (e) {
            Bugsnag.notify(e);
            error(e);
        }

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        setTimeout(inner, env.FETCH_INTERVAL);
    };

    await inner();
}
