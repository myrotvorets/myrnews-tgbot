import { cleanEnv, host, num, str, url } from 'envalid';
import { portOrZero } from './validators';

export interface Environment {
    NODE_ENV: string;
    BUGSNAG_API_KEY: string;
    BOT_TOKEN: string;
    CHAT_ID: number;
    WEBHOOK_DOMAIN: string;
    WEBHOOK_PORT: number;
    LISTEN_HOST: string;
    NEWS_ENDPOINT: string;
    FETCH_INTERVAL: number;
    PATH_PREFIX: string;
}

let env: Environment | undefined;

export function getEnvironment(): Environment {
    if (!env) {
        env = cleanEnv(
            process.env,
            {
                NODE_ENV: str({ default: 'development' }),
                BUGSNAG_API_KEY: str(),
                BOT_TOKEN: str(),
                CHAT_ID: num(),
                WEBHOOK_DOMAIN: str({ default: '' }),
                WEBHOOK_PORT: portOrZero({ default: 0 }),
                LISTEN_HOST: host({ default: '127.0.0.1' }),
                NEWS_ENDPOINT: url(),
                FETCH_INTERVAL: num({ default: 600_000 }),
                PATH_PREFIX: str({ default: '' }),
            },
            {
                strict: true,
            },
        );

        process.env.NODE_ENV = env.NODE_ENV;
    }

    return env;
}
