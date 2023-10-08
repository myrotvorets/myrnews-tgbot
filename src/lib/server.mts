import { Server as HttpServer, type RequestListener, createServer as createHttpServer } from 'node:http';
import { Server as HttpsServer, createServer as createHttpsServer } from 'node:https';
import { type Bot, type Context, webhookCallback } from 'grammy';

export type Server = HttpServer | HttpsServer;

export function createServer<C extends Context = Context>(bot: Bot<C>, path: string): HttpServer;
export function createServer<C extends Context = Context>(
    bot: Bot<C>,
    path: string,
    key: string,
    cert: string,
): HttpsServer;
export function createServer<C extends Context = Context>(
    bot: Bot<C>,
    path: string,
    key?: string,
    cert?: string,
): Server {
    const callback: RequestListener = (req, res) => {
        if (req.url && req.headers.host) {
            const url = new URL(req.url, `https://${req.headers.host}`);
            if (url.pathname === path) {
                const handler = webhookCallback(bot, key ? 'https' : 'http');
                handler(req, res);
                return;
            }
        }

        res.writeHead(404);
        res.end();
    };

    return key ? createHttpsServer({ key, cert }, callback) : createHttpServer(callback);
}
