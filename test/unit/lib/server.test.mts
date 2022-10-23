import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server as HttpServer } from 'node:http';
import { Server as HttpsServer } from 'node:https';
import { readFile } from 'node:fs/promises';
import { expect } from 'chai';
import { Bot } from 'grammy';
import { createServer } from '../../../src/lib/server.mjs';

describe('createServer', function () {
    const bot = new Bot('TOKEN');
    const path = '/webhook';

    it('should create an HTTP server', function () {
        const server = createServer(bot, path);
        expect(server).to.be.an.instanceOf(HttpServer);
    });

    it('should create an HTTPS server', async function () {
        const base = dirname(fileURLToPath(import.meta.url));
        const keyFile = join(base, '..', '..', 'fixtures', 'server.key');
        const certFile = join(base, '..', '..', 'fixtures', 'server.crt');

        const [key, cert] = await Promise.all([
            readFile(keyFile, { encoding: 'utf8' }),
            readFile(certFile, { encoding: 'utf8' }),
        ]);

        const server = createServer(bot, path, key, cert);
        expect(server).to.be.an.instanceOf(HttpsServer);
    });
});
