# myrnews-tgbot

Myrotvorets.news Telegram Bot

https://t.me/myrotvoretsnews

## Local Setup

1. [Register a new bot with BotFather](https://core.telegram.org/bots#3-how-do-i-create-a-bot) and obtain the authorization token.
2. Create a new Telegram channel and add your bot as an administrator.
3. Obtain the ID of the created channel. You can do that by writing a message and then forwarding it to `@getidsbot`. You will get the numeric ID in the response under `Origin chat`.
3. Create `.env` file in the root of the project:
```
NODE_ENV=development
BUGSNAG_API_KEY=
KNEX_DRIVER=sqlite3
KNEX_DATABASE=./data.sqlite
BOT_TOKEN="<bot authorization token goes here>"
CHAT_ID="<channel ID goes here>"
NEWS_ENDPOINT=https://myrotvorets.news
DEBUG="bot:*"
DEBUG_DEPTH="5"
ENABLE_TRACING="1"
ZIPKIN_ENDPOINT=http://zipkin:9411/api/v2/spans
```
4. Run `docker-compose up`.
