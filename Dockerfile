FROM myrotvorets/node-build AS base
USER root
RUN install -m 0700 -o nobody -g nobody -d /srv/bot
USER nobody:nobody
WORKDIR /srv/bot
COPY ./package.json ./package-lock.json ./

FROM base AS deps
RUN npm ci --only=prod --no-audit --no-fund

FROM base AS build-deps
RUN \
    npm r --package-lock-only \
        eslint @myrotvorets/eslint-config-myrotvorets-ts @typescript-eslint/eslint-plugin eslint-plugin-import eslint-plugin-prettier prettier eslint-plugin-sonarjs eslint-plugin-jest \
        @types/jest jest ts-jest merge jest-sonar-reporter \
        nodemon husky lint-staged @types/sqlite3 sqlite3 && \
    npm ci --no-audit --no-fund

FROM build-deps AS build
COPY . .
RUN npm run build

FROM myrotvorets/node-min
USER root
RUN install -m 0700 -o nobody -g nobody -d /srv/bot /srv/bot/node_modules
USER nobody:nobody
WORKDIR /srv/bot
COPY --from=deps /srv/bot/node_modules ./node_modules
COPY --from=build /srv/bot/dist/ ./
COPY ./package.json ./
ENTRYPOINT ["/usr/bin/node", "index.js"]
EXPOSE 3010
