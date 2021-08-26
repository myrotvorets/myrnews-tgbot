/* istanbul ignore file */

import Bugsnag from '@bugsnag/js';
import { Telegraf } from 'telegraf';
import crypto from 'crypto';
import knex from 'knex';
import { buildKnexConfig } from './knexfile';
import type { BotContext } from './lib/types';
import { getEnvironment } from './lib/environment';
import { queryCallbackHandler } from './controllers/callbackquery';
import { lifecycle } from './controllers/lifecycle';
import { startBugsnag } from './lib/bugsnag';

(async (): Promise<void> => {
    const env = getEnvironment();
    await startBugsnag(env);

    try {
        const bot = new Telegraf<BotContext>(env.BOT_TOKEN);
        bot.context.db = knex(buildKnexConfig());
        bot.on('callback_query', queryCallbackHandler);

        if (env.WEBHOOK_DOMAIN && env.WEBHOOK_PORT) {
            const random = crypto.randomBytes(32).toString('hex');
            const hookPath = env.PATH_PREFIX ? `/${env.PATH_PREFIX}/${random}` : `/${random}`;
            await bot.launch({
                webhook: {
                    port: env.WEBHOOK_PORT,
                    domain: env.WEBHOOK_DOMAIN,
                    host: env.LISTEN_HOST,
                    hookPath,
                },
            });

            process.on('SIGTERM', () => bot.stop());
            process.on('SIGINT', () => bot.stop());
        } else {
            await bot.launch();
        }

        lifecycle(env, bot);
    } catch (e) {
        console.error(e);
        Bugsnag.notify(e as Error);
        //        process.exit(1);
    }
})().catch((e) => console.error(e));
