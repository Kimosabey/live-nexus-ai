# Stage 1: Dependencies
FROM node:18-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# Stage 2: Builder
FROM node:18-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ARG LIVEKIT_URL
ENV LIVEKIT_URL=$LIVEKIT_URL

RUN npm run build

# Stage 3: Runner
FROM node:18-slim AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
