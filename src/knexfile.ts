import { cleanEnv, str } from 'envalid';
import type { Knex } from 'knex';
import type { Database } from 'better-sqlite3';

const env = cleanEnv(process.env, {
    NODE_ENV: str({ default: 'development' }),
    KNEX_DRIVER: str({ default: 'sqlite3', choices: ['sqlite3', 'mysql', 'mariadb'] }), // ! Run `npm i driver` if any other driver is needed
    KNEX_DATABASE: str(),
    KNEX_HOST: str({ default: 'localhost' }),
    KNEX_USER: str({ default: '' }),
    KNEX_PASSWORD: str({ default: '' }),
});

export function buildKnexConfig(): Knex.Config {
    // eslint-disable-next-line sonarjs/no-small-switch
    switch (env.KNEX_DRIVER) {
        case 'sqlite3':
            return {
                client: 'better-sqlite3',
                asyncStackTraces: env.NODE_ENV === 'development',
                useNullAsDefault: true,
                connection: {
                    filename: env.KNEX_DATABASE,
                },
                pool: {
                    // Override in order not to import extra types
                    // eslint-disable-next-line @typescript-eslint/ban-types
                    afterCreate: (conn: Database, cb: Function): void => {
                        conn.exec('PRAGMA foreign_keys = ON');
                        cb();
                    },
                },
            };

        /* istanbul ignore next */
        case 'mariadb':
            return {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                client: require('knex-mariadb') as typeof Knex.Client,
                asyncStackTraces: env.NODE_ENV === 'development',
                connection: {
                    database: env.KNEX_DATABASE,
                    host: env.KNEX_HOST,
                    user: env.KNEX_USER,
                    password: env.KNEX_PASSWORD,
                },
            };

        /* istanbul ignore next */
        default:
            return {
                client: env.KNEX_DRIVER,
                asyncStackTraces: env.NODE_ENV === 'development',
                connection: {
                    database: env.KNEX_DATABASE,
                    host: env.KNEX_HOST,
                    user: env.KNEX_USER,
                    password: env.KNEX_PASSWORD,
                },
            };
    }
}
