FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false --ignore-scripts

COPY services/upload-service ./services/upload-service

EXPOSE 3000

CMD ["pnpm", "exec", "tsx", "services/upload-service/src/node-server.ts"]
