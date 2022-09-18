FROM myrotvorets/node-build@sha256:a399d18b7e3714d56af835e978274a915ef55c2ff78a76f98f5250cc8a0bf1fb AS base
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

FROM myrotvorets/node-min@sha256:c775eca45f690196cebefc7d9157b753b75ecacaf2e403519e584a57eb20eef0
USER root
WORKDIR /srv/service
RUN chown nobody:nobody /srv/service
USER nobody:nobody
ENTRYPOINT ["/usr/bin/node", "index.js"]
EXPOSE 3010
COPY --chown=nobody:nobody --from=build /srv/service/dist/ ./
COPY --chown=nobody:nobody --from=deps /srv/service/node_modules ./node_modules
COPY --chown=nobody:nobody ./package.json ./
