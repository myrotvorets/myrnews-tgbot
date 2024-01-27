import { reset } from 'testdouble';

const env = { ...process.env };
process.env = {
    NODE_ENV: 'test',
    KNEX_DRIVER: 'better-sqlite3',
    KNEX_DATABASE: ':memory:',
};

/** @type {import('mocha').RootHookObject} */
export const mochaHooks = {
    afterEach() {
        reset();
    },
    afterAll() {
        process.env = { ...env };
    },
};
