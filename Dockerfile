# Multi-stage Dockerfile for REX AI Platform Monorepo
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Stage 1: Dependency installation
FROM base AS deps
COPY package.json package-lock.json* ./
COPY Shared/package.json ./Shared/
COPY Code-Analyzer/package.json ./Code-Analyzer/
COPY Backend/package.json ./Backend/
COPY Frontend/package.json ./Frontend/
RUN npm ci

# Stage 2: Monorepo Builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build --workspace=Shared
RUN npm run build --workspace=Code-Analyzer
RUN npm run build --workspace=Backend
RUN npm run build --workspace=Frontend

# Stage 3: Backend Runtime
FROM base AS backend-runner
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 4000
CMD ["npm", "run", "start", "--workspace=Backend"]

# Stage 4: Frontend Runtime
FROM base AS frontend-runner
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=Frontend"]
