FROM myrotvorets/node-build@sha256:bf5d8e32c257bc1ed21fa5c20e7aaa473443f8d01277880606943fa5f1ef5d5b AS build
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

FROM myrotvorets/node-min@sha256:c56587cb345882a1fa9d7353392e4651187ff2059bd9dc3b6f00da1bcae9bec1
USER root
WORKDIR /srv/service
RUN chown nobody:nobody /srv/service
USER nobody:nobody
ENTRYPOINT ["/usr/bin/node", "index.mjs"]
EXPOSE 3010
COPY --chown=nobody:nobody --from=build /srv/service/dist/ ./
COPY --chown=nobody:nobody --from=build /srv/service/node_modules ./node_modules
COPY --chown=nobody:nobody ./package.json ./
