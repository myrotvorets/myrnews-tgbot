FROM myrotvorets/node-build@sha256:6c3a2f90da97fa906706f63734fa455680491d911680da2acb560e0bf15bc120 AS base
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

FROM myrotvorets/node-min@sha256:1f5b00bc5f80992d351201236601e719afb4c4d0677e99489da430cfffe3dc97
USER root
WORKDIR /srv/service
RUN chown nobody:nobody /srv/service
USER nobody:nobody
ENTRYPOINT ["/usr/bin/node", "index.js"]
EXPOSE 3010
COPY --chown=nobody:nobody --from=build /srv/service/dist/ ./
COPY --chown=nobody:nobody --from=deps /srv/service/node_modules ./node_modules
COPY --chown=nobody:nobody ./package.json ./
