# Multi-app image: build with --build-arg APP=web|worker|demo-exam-portal
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
ARG APP=web
ENV APP=$APP
RUN if [ "$APP" != "worker" ]; then pnpm --filter @applyonce/$APP build; fi
EXPOSE 3300 3301
CMD if [ "$APP" = "worker" ]; then pnpm --filter @applyonce/worker start; else pnpm --filter @applyonce/$APP start; fi
