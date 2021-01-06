/* istanbul ignore file */

import Bugsnag from '@bugsnag/js';
import Telegraf from 'telegraf';
import crypto from 'crypto';
import knex from 'knex';
import type { TelegrafContext } from 'telegraf/typings/context';
import { Update } from 'telegram-typings';
import { ServerResponse } from 'http';
import api from '@opentelemetry/api';
import { buildKnexConfig } from './knexfile';
import type { BotContext } from './types';
import { getEnvironment } from './lib/environment';
import { queryCallbackHandler } from './controllers/callbackquery';
import { lifecycle } from './controllers/lifecycle';
import { startBugsnag } from './lib/bugsnag';

class MyTelegraf<TContext extends TelegrafContext> extends Telegraf<TContext> {
    public handleUpdates(updates: Update[]): Promise<unknown[]> {
        const tracer = api.trace.getTracer('tracer');
        const span = tracer.startSpan('telegraf.handleUpdates');
        return tracer.withSpan(span, () => super.handleUpdates(updates));
    }

    public handleUpdate(update: Update, webhookResponse?: ServerResponse): Promise<unknown> {
        const tracer = api.trace.getTracer('tracer');
        const span = tracer.startSpan(`telegraf.handleUpdate(${update.update_id})`);
        return super.handleUpdate(update, webhookResponse).then(
            (r) => {
                span.end();
                return Promise.resolve(r);
            },
            (e) => {
                span.end();
                return Promise.reject(e);
            },
        );
    }
}

(async (): Promise<void> => {
    const env = getEnvironment();
    await startBugsnag(env);

    try {
        const bot = new MyTelegraf<BotContext>(env.BOT_TOKEN);
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
        } else {
            await bot.launch();
        }

        await lifecycle(env, bot);
    } catch (e) {
        Bugsnag.notify(e);
        console.error(e);
        process.exit(1);
    }
})().catch((e) => console.error(e));
