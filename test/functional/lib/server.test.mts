import { Bot } from 'grammy';
import request from 'supertest';
import { Server, createServer } from '../../../src/lib/server.mjs';

describe('createServer', function () {
    const path = '/webhook';
    let server: Server;

    before(function () {
        const bot = new Bot('TOKEN');
        server = createServer(bot, path);

        bot.botInfo = {
            id: 1488,
            first_name: 'Test Bot',
            is_bot: true,
            username: 'bot',
            can_join_groups: true,
            can_read_all_group_messages: true,
            supports_inline_queries: false,
            can_connect_to_business: false,
            has_main_web_app: false,
        };
    });

    it('should return a 404 error when accessed by a wrong path', function () {
        return request(server).get('/').expect(404);
    });

    it('should return a 200 when everything is OK', function () {
        return request(server)
            .post(path)
            .send({
                update_id: 10000,
                message: {
                    date: 1441645532,
                    chat: {
                        last_name: 'Test Lastname',
                        id: 1111111,
                        first_name: 'Test',
                        username: 'Test',
                    },
                    message_id: 1365,
                    from: {
                        last_name: 'Test Lastname',
                        id: 1111111,
                        first_name: 'Test',
                        username: 'Test',
                    },
                    text: 'message',
                },
            })
            .expect(200);
    });
});
