/* eslint-disable no-await-in-loop */
import debug from 'debug';
import { Knex } from 'knex';
import { Bot } from 'grammy';
import { addPost, checkPostExists, getDB } from '../lib/db.mjs';
import { Environment } from '../lib/environment.mjs';
import { generateDescription } from '../lib/utils.mjs';
import { getFeaturedImageUrl, getPosts } from '../lib/wpapi.mjs';
import type { PostData } from '../lib/types.mjs';
import { Bugsnag } from '../lib/bugsnag.mjs';
import { configurator } from '../lib/tracing.mjs';

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

async function sendNewPosts(bot: Bot, chat: number, data: PostData[]): Promise<void> {
    for (const entry of data) {
        try {
            const parse_mode = 'HTML';
            const text = generateDescription(entry);
            if (entry.img) {
                dbg('Sending post %d as photo', entry.id);
                try {
                    await bot.api.sendPhoto(chat, entry.img, { caption: text, parse_mode });
                } catch (e) {
                    dbg('Retrying post %d as message', entry.id);
                    await bot.api.sendMessage(chat, text, { parse_mode });
                }
            } else {
                dbg('Sending post %d as message', entry.id);
                await bot.api.sendMessage(chat, text, { parse_mode });
            }

            await addPost(getDB(), entry.id);
        } catch (e) {
            error(e);
            Bugsnag.notify(e as Error);
        }
    }
}

export function lifecycle(env: Environment, bot: Bot): void {
    const inner = (): void => {
        void configurator.tracer().startActiveSpan('Get posts', async (span) => {
            try {
                const posts = await getNewPosts(env.NEWS_ENDPOINT, getDB());
                dbg('Got %d new posts', posts.length);
                if (posts.length) {
                    await sendNewPosts(bot, env.CHAT_ID, posts);
                }
            } catch (e) {
                error(e);
                Bugsnag.notify(e as Error);
            } finally {
                span.end();
            }
        });

        setTimeout(inner, env.FETCH_INTERVAL);
    };

    inner();
}
