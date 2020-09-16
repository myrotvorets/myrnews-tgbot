FROM myrotvorets/node-build AS base
USER root
RUN install -m 0700 -o nobody -g nogroup -d /srv/bot
USER nobody:nogroup
WORKDIR /srv/bot
COPY ./package.json ./package-lock.json .npmrc ./

FROM base AS deps
RUN npm ci --only=prod --no-audit --no-fund

FROM base AS build-deps
RUN npm ci --no-audit --no-fund

FROM build-deps AS build
COPY . .
RUN npm run build

FROM myrotvorets/node-min
USER root
RUN install -m 0700 -o nobody -g nogroup -d /srv/bot /srv/bot/node_modules
USER nobody:nogroup
WORKDIR /srv/bot
COPY --from=deps /srv/bot/node_modules ./node_modules
COPY --from=build /srv/bot/dist/ ./
RUN ls -lha
ENTRYPOINT ["/usr/bin/node", "index.js"]
EXPOSE 3010
