# Build in un unico stadio con tutte le devDependencies (serve prisma generate + nest build),
# poi npm prune per togliere le devDependencies dall'immagine finale — mantiene "prisma" (CLI)
# tra le dependencies normali perché serve a runtime per applicare le migration all'avvio.
FROM node:22-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/assets ./assets
COPY package.json ./

EXPOSE 3001
# migrate deploy è idempotente (applica solo le migration mancanti): sicuro da rieseguire ad ogni avvio.
# L'entry point compilato è dist/src/main.js (non dist/main.js): prisma/seed.ts, fuori da src/,
# fa sì che TypeScript preservi la sottocartella src/ nell'output — vedi anche start:prod in package.json.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
