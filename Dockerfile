FROM myrotvorets/node-build@sha256:ec20445e8be1eec4b9648e44cab5a075c6b30802696775e77ab7fe0a57c3941b AS build
USER root
WORKDIR /srv/service
RUN chown nobody:nobody /srv/service
USER nobody:nobody
COPY --chown=nobody:nobody ./package.json ./package-lock.json ./tsconfig.json .npmrc* ./
RUN \
    npm r --package-lock-only \
        @myrotvorets/eslint-config-myrotvorets-ts eslint-formatter-gha eslint-plugin-mocha \
        mocha @types/mocha chai @types/chai chai-as-promised @types/chai-as-promised supertest @types/supertest testdouble c8 mocha-multi mocha-reporter-gha mocha-reporter-sonarqube \
        ts-node nodemon husky lint-staged better-sqlite3 && \
    npm pkg delete scripts.postinstall && \
    npm ci --ignore-scripts --userconfig .npmrc.local && \
    rm -f .npmrc.local && \
    npm rebuild && \
    npm run prepare --if-present
COPY --chown=nobody:nobody ./src ./src
RUN npm run build -- --declaration false --removeComments true --sourceMap false
RUN npm prune --omit=dev

FROM myrotvorets/node-min@sha256:3b82a732578799f9a4198df496106210071e7fb11d3602ab43f86e4d724adf15
USER root
WORKDIR /srv/service
RUN chown nobody:nobody /srv/service
USER nobody:nobody
ENTRYPOINT ["/usr/bin/node", "index.mjs"]
EXPOSE 3010
COPY --chown=nobody:nobody --from=build /srv/service/dist/ ./
COPY --chown=nobody:nobody --from=build /srv/service/node_modules ./node_modules
COPY --chown=nobody:nobody ./package.json ./
