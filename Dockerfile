FROM myrotvorets/node-build@sha256:b3dcade9dab2dafef5904a6f7f3f4214d3c61b34dc2a9660d6423db5ba62fa99 AS base
USER root
WORKDIR /srv/service
RUN chown nobody:nogroup /srv/service
USER nobody:nobody
COPY --chown=nobody:nobody ./package.json ./package-lock.json ./tsconfig.json .npmrc ./

FROM base AS deps
RUN \
    npm ci --ignore-scripts --only=prod --no-audit --no-fund && \
    rm -f .npmrc && \
    npm rebuild && \
    npm run prepare --if-present

FROM base AS build
RUN \
    npm r --package-lock-only \
        eslint @myrotvorets/eslint-config-myrotvorets-ts @typescript-eslint/eslint-plugin eslint-plugin-import eslint-plugin-prettier prettier eslint-plugin-sonarjs eslint-plugin-jest \
        @types/jest jest ts-jest merge jest-sonar-reporter \
        nodemon husky lint-staged sqlite3 && \
    npm pkg delete scripts.postinstall && \
    npm ci --ignore-scripts --no-audit --no-fund && \
    rm -f .npmrc && \
    npm rebuild && \
    npm run prepare --if-present
COPY --chown=nobody:nobody ./src ./src
RUN npm run build -- --declaration false --removeComments true --sourceMap false

FROM myrotvorets/node-min@sha256:48cbdbdb565a7eeb2d424c8bdf02990a5fd4b55e0692c19bcd1baaa61df08807
USER root
WORKDIR /srv/service
RUN chown nobody:nobody /srv/service
USER nobody:nobody
ENTRYPOINT ["/usr/bin/node", "index.js"]
EXPOSE 3010
COPY --chown=nobody:nobody --from=build /srv/service/dist/ ./
COPY --chown=nobody:nobody --from=deps /srv/service/node_modules ./node_modules
COPY --chown=nobody:nobody ./package.json ./
