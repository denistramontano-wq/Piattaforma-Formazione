# Build in un unico stadio con tutte le devDependencies (serve prisma generate + nest build),
# poi npm prune per togliere le devDependencies dall'immagine finale.
FROM node:22-slim AS build
WORKDIR /app
# node:22-slim non include openssl: senza, il motore di query di Prisma non riesce a
# rilevare la versione di libssl e può fallire silenziosamente (vedi anche stadio finale).
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/assets ./assets
COPY package.json ./

EXPOSE 3001
# Le migration NON vengono applicate automaticamente all'avvio: con un database dietro un
# connection pooler (es. Supabase su Render, vedi DEPLOY.md) "prisma migrate deploy" resta
# bloccato a tempo indeterminato invece di completarsi o fallire. Vanno applicate a mano da un
# computer con connessione diretta (non tramite pooler) quando cambia lo schema — vedi DEPLOY.md.
# L'entry point compilato è dist/src/main.js (non dist/main.js): prisma/seed.ts, fuori da src/,
# fa sì che TypeScript preservi la sottocartella src/ nell'output — vedi anche start:prod in package.json.
CMD ["node", "dist/src/main.js"]
