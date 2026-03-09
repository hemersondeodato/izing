FROM node:20-bookworm-slim AS build

WORKDIR /app

ARG VUE_URL_API

COPY package*.json ./
RUN npm install

COPY . .
RUN printf "VUE_URL_API=%s\n" "$VUE_URL_API" > .env
RUN npm run build

FROM nginx:1.27-alpine AS production

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/pwa /usr/share/nginx/html
