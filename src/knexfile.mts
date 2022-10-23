import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanEnv, str } from 'envalid';
import type { Knex } from 'knex';

const env = cleanEnv(process.env, {
    NODE_ENV: str({ default: 'development' }),
    KNEX_DRIVER: str({ default: 'better-sqlite3', choices: ['better-sqlite3', 'mysql2'] }), // ! Run `npm i driver` if any other driver is needed
    KNEX_DATABASE: str(),
    KNEX_HOST: str({ default: 'localhost' }),
    KNEX_USER: str({ default: '' }),
    KNEX_PASSWORD: str({ default: '' }),
});

export function buildKnexConfig(): Knex.Config {
    const base = dirname(fileURLToPath(import.meta.url));
    let config: Knex.Config = {
        client: env.KNEX_DRIVER,
        asyncStackTraces: env.NODE_ENV === 'development',
        migrations: {
            directory: join(base, '..', 'test', 'migrations'),
            loadExtensions: ['.mts'],
        },
        seeds: {
            directory: join(base, '..', 'test', 'seeds'),
            loadExtensions: ['.mts'],
        },
    };

    if (env.KNEX_DRIVER === 'better-sqlite3') {
        config = {
            ...config,
            useNullAsDefault: true,
            connection: {
                filename: env.KNEX_DATABASE,
            },
        };
    } /* c8 ignore start */ else {
        config = {
            ...config,
            connection: {
                database: env.KNEX_DATABASE,
                host: env.KNEX_HOST,
                user: env.KNEX_USER,
                password: env.KNEX_PASSWORD,
            },
        };
    }
    /* c8 ignore stop */

    return config;
}
