# Docker Parent Image with Node
FROM mhart/alpine-node:16 AS builder
WORKDIR /app
COPY . .
RUN mkdir node_modules
RUN npm ci --omit=dev
RUN npm run build

FROM mhart/alpine-node:16
WORKDIR /app
RUN mkdir config
COPY --from=builder app/lib/ ./lib/
COPY --from=builder app/dist/ ./dist/
COPY --from=builder app/package.json ./package.json
COPY --from=builder app/node_modules/ ./node_modules/
COPY ./prisma ./prisma/
COPY ./start_bot.sh .

# migrate database
RUN apk add sqlite
ENTRYPOINT ["./start_bot.sh"]
