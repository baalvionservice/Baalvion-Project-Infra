FROM node:20-alpine AS base
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY . .

FROM base AS production
ENV NODE_ENV=production
EXPOSE 3031
CMD ["node", "index.js"]

# Worker-only image variant (used by separate K8s Deployment)
FROM base AS worker
ENV NODE_ENV=production
CMD ["node", "workers/index.js"]
