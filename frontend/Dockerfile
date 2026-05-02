FROM node:22-alpine AS builder

WORKDIR /app

ENV CI=true

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .
ARG VITE_API_URL=""
ARG VITE_GOOGLE_OAUTH_CLIENT_ID=""
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_OAUTH_CLIENT_ID=$VITE_GOOGLE_OAUTH_CLIENT_ID
RUN npm run build


FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
