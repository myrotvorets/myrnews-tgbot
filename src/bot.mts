import { randomBytes } from 'node:crypto';
import { Bot } from 'grammy';
import { autoRetry } from '@grammyjs/auto-retry';
import { environment } from './lib/environment.mjs';
import { lifecycle } from './controllers/lifecycle.mjs';
import { Bugsnag, startBugsnag } from './lib/bugsnag.mjs';
import { createServer } from './lib/server.mjs';

function fatal(err: unknown): void {
    console.error(err);
    Bugsnag.notify(err as Error);
    process.exit(1);
}

const env = environment();
await startBugsnag(env);

try {
    const bot = new Bot(env.BOT_TOKEN);
    bot.api.config.use(autoRetry({ maxRetryAttempts: 10, maxDelaySeconds: 60, retryOnInternalServerErrors: true }));

    if (env.WEBHOOK_DOMAIN && env.WEBHOOK_PORT) {
        const random = randomBytes(32).toString('hex');
        const hookPath = env.PATH_PREFIX ? `/${env.PATH_PREFIX}/${random}` : `/${random}`;
        const server = createServer(bot, hookPath);
        server.on('error', fatal);
        server.listen(env.WEBHOOK_PORT, env.LISTEN_HOST, () => {
            bot.api.setWebhook(`https://${env.WEBHOOK_DOMAIN}${hookPath}`).catch(fatal);
        });

        process.on('SIGTERM', (): void => {
            void bot.api.setWebhook('').finally(() => {
                server.close(() => process.exit(0));
            });
        });
    } else {
        bot.start().catch(fatal);
        process.on('SIGTERM', () => {
            void bot.stop().finally(() => process.exit(0));
        });
    }

    process.on('SIGINT', () => process.kill(process.pid, 'SIGTERM'));

    lifecycle(env, bot);
} catch (e) {
    fatal(e as Error);
}
