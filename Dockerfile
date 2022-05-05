FROM myrotvorets/node-build@sha256:6984862b59aa7d615c158daeb23524ad1882b96c4107f4b804a26e584efb524d AS base
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

FROM myrotvorets/node-min@sha256:e31d11cf18a5bfa0798b42094129ed5d76b0efb3da55b14bf320381c76a9c5b6
USER root
WORKDIR /srv/service
RUN chown nobody:nobody /srv/service
USER nobody:nobody
ENTRYPOINT ["/usr/bin/node", "index.js"]
EXPOSE 3010
COPY --chown=nobody:nobody --from=build /srv/service/dist/ ./
COPY --chown=nobody:nobody --from=deps /srv/service/node_modules ./node_modules
COPY --chown=nobody:nobody ./package.json ./
