FROM myrotvorets/node-build@sha256:4e93a9c828bbd1fcbcce64f45d5d3f861f56f30308df8e07477ba1a1fd9d2ac5 AS base
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
    npm set-script postinstall "" && \
    npm ci --ignore-scripts --no-audit --no-fund && \
    rm -f .npmrc && \
    npm rebuild && \
    npm run prepare --if-present
COPY --chown=nobody:nobody ./src ./src
RUN npm run build -- --declaration false --removeComments true --sourceMap false

FROM myrotvorets/node-min@sha256:fca9d244428f7e107ffd4aa06bafda4ecd78019ba19ac1d6b07c6d53451afbb5
USER root
WORKDIR /srv/service
RUN chown nobody:nobody /srv/service
USER nobody:nobody
ENTRYPOINT ["/usr/bin/node", "index.js"]
EXPOSE 3010
COPY --chown=nobody:nobody --from=build /srv/service/dist/ ./
COPY --chown=nobody:nobody --from=deps /srv/service/node_modules ./node_modules
COPY --chown=nobody:nobody ./package.json ./
