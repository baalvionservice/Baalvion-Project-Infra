FROM node:20-alpine AS base
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY . .

FROM base AS production
ENV NODE_ENV=production
EXPOSE 3021
CMD ["node", "index.js"]
