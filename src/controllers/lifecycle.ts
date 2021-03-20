/* eslint-disable no-await-in-loop */
import Bugsnag from '@bugsnag/js';
import debug from 'debug';
import { Knex } from 'knex';
import { Telegraf } from 'telegraf';
import api, { context, setSpan } from '@opentelemetry/api';
import { InlineKeyboardMarkup } from 'typegram';
import { addPost, checkPostExists } from '../lib/db';
import { Environment } from '../lib/environment';
import { buildInlineKeyboardFromPost, generateDescription } from '../lib/utils';
import { getFeaturedImageUrl, getPosts } from '../lib/wpapi';
import type { BotContext, PostData } from '../lib/types';

const error = debug('bot:error');
const dbg = debug('bot:debug');

async function getNewPosts(baseUrl: string, db: Knex): Promise<PostData[]> {
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

            await addPost(bot.context.db as Knex, entry.id);
        } catch (e) {
            error(e);
            Bugsnag.notify(e);
        }
    }
}

export function lifecycle(env: Environment, bot: Telegraf<BotContext>): void {
    const inner = (): void => {
        const tracer = api.trace.getTracer('tracer');
        const span = tracer.startSpan('Get posts');
        void context.with(setSpan(context.active(), span), async () => {
            try {
                const posts = await getNewPosts(env.NEWS_ENDPOINT, bot.context.db as Knex);
                dbg('Got %d new posts', posts.length);
                if (posts.length) {
                    await sendNewPosts(bot, env.CHAT_ID, posts);
                }
            } catch (e) {
                error(e);
                Bugsnag.notify(e);
            } finally {
                span.end();
            }
        });

        setTimeout(inner, env.FETCH_INTERVAL);
    };

    inner();
}
