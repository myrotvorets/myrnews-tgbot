FROM alpine:3.12 AS node
RUN apk add --no-cache nodejs npm

FROM node AS deps
WORKDIR /srv/bot
COPY ./package.json ./package-lock.json .npmrc /srv/bot/
RUN npm ci --only=prod --no-audit --no-fund && npm dedup && npm ls --depth=0

FROM node AS build-deps
WORKDIR /usr/src/bot
COPY ./package.json ./package-lock.json .npmrc /usr/src/bot/
RUN npm ci --no-audit --no-fund

FROM build-deps AS build
WORKDIR /usr/src/bot
COPY . .
RUN npm run build

FROM deps
EXPOSE 3010
COPY --from=build /usr/src/bot/dist/ /srv/bot/
COPY ./production.env /srv/bot/.env
RUN apk del --no-cache npm
ENTRYPOINT ["/usr/bin/node", "index.js"]
