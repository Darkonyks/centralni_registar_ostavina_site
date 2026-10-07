# ─────────── Build ───────────
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Javne vrednosti koje se ugrađuju u JavaScript pri build-u (prosleđuju se kao build args).
ARG VITE_TURNSTILE_SITE_KEY=""
ARG VITE_DEMO_URL=""
ARG VITE_APP_URL=""
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY \
    VITE_DEMO_URL=$VITE_DEMO_URL \
    VITE_APP_URL=$VITE_APP_URL
RUN npm run build

# ─────────── Runtime ───────────
FROM node:24-alpine
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DATABASE_PATH=/app/data/registar.db

# Samo produkcione zavisnosti (server u runtime-u koristi nodemailer).
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server

# SQLite baza je na trajnom volumenu; proces radi bez root privilegija.
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
VOLUME ["/app/data"]

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1

# Tajne (Turnstile secret, SMTP, ADMIN_*) se zadaju kao env promenljive kontejnera.
CMD ["node", "dist-server/index.js"]
