# Le variabili NEXT_PUBLIC_* vengono "cotte" dentro il bundle JS in fase di build (next build),
# non lette a runtime: vanno quindi passate come build arg. Render passa automaticamente le
# variabili d'ambiente del servizio come build arg quando il Dockerfile dichiara un ARG con lo
# stesso nome — vedi render.yaml.
FROM node:22-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID

RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
# Docker imposta HOSTNAME al nome interno del container: il server standalone di Next.js lo
# userebbe come indirizzo su cui ascoltare, restando irraggiungibile dall'esterno. Forziamo
# 0.0.0.0 (tutte le interfacce) sovrascrivendo quella variabile.
ENV HOSTNAME="0.0.0.0"

COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
