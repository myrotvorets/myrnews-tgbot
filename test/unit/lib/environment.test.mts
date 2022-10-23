import { expect } from 'chai';
import { type Environment, environment } from '../../../src/lib/environment.mjs';

describe('environment', function () {
    let env: typeof process.env;

    before(function () {
        env = { ...process.env };
    });

    afterEach(function () {
        process.env = { ...env };
    });

    it('should not allow extra variables', function () {
        const expected: Environment = {
            NODE_ENV: 'development',
            BUGSNAG_API_KEY: 'xxx',
            BOT_TOKEN: 'xxx',
            CHAT_ID: 123,
            WEBHOOK_DOMAIN: '',
            WEBHOOK_PORT: 0,
            LISTEN_HOST: '127.0.0.1',
            NEWS_ENDPOINT: 'https://example.test/',
            FETCH_INTERVAL: 600_000,
            PATH_PREFIX: '',
        };

        process.env = {
            BUGSNAG_API_KEY: expected.BUGSNAG_API_KEY,
            BOT_TOKEN: expected.BOT_TOKEN,
            CHAT_ID: `${expected.CHAT_ID}`,
            NEWS_ENDPOINT: expected.NEWS_ENDPOINT,
            EXTRA: 'xxx',
        };

        const actual = { ...environment(true) };
        expect(actual).to.deep.equal(expected);
    });

    it('should cache the result', function () {
        const expected: Environment = {
            NODE_ENV: 'development',
            BUGSNAG_API_KEY: 'xxx',
            BOT_TOKEN: 'xxx',
            CHAT_ID: 123,
            WEBHOOK_DOMAIN: '',
            WEBHOOK_PORT: 0,
            LISTEN_HOST: '127.0.0.1',
            NEWS_ENDPOINT: 'https://example.test/',
            FETCH_INTERVAL: 600_000,
            PATH_PREFIX: '',
        };

        process.env = {
            BUGSNAG_API_KEY: expected.BUGSNAG_API_KEY,
            BOT_TOKEN: expected.BOT_TOKEN,
            CHAT_ID: `${expected.CHAT_ID}`,
            NEWS_ENDPOINT: expected.NEWS_ENDPOINT,
        };

        let actual = { ...environment(true) };
        expect(actual).to.deep.equal(expected);

        process.env.NODE_ENV = 'borked';

        actual = { ...environment() };
        expect(actual).to.deep.equal(expected);
    });
});
