# -----------------------------------------------------------------------------
# Étape 1 : Builder (Compilation de l'application Angular SSR)
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Optimisation du cache de couches Docker
COPY package.json package-lock.json ./

# Installation propre des dépendances avec vérification d'intégrité
RUN npm ci

# Copie de l'intégralité du code source
COPY . .

# Construction de l'application Angular SSR (génère dist/CopupitreWebsite)
RUN npm run build

# -----------------------------------------------------------------------------
# Étape 2 : Runner (Serveur de production Node.js Express SSR)
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

# Installation de curl pour le healthcheck Docker
RUN apk add --no-cache curl

# Configuration de l'environnement de production
ENV NODE_ENV=production
ENV PORT=4000

# Création du groupe et de l'utilisateur non-root s'ils n'existent pas déjà
RUN if ! getent group node >/dev/null; then addgroup -g 1000 node; fi && \
    if ! getent passwd node >/dev/null; then adduser -u 1000 -G node -s /bin/sh -D node; fi

# Attribution des droits sur le dossier de travail à l'utilisateur node
RUN chown -R node:node /app

# Bascule vers l'utilisateur non-root node
USER node

# Copie des fichiers de dépendances et installation stricte des modules de production
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copie des artefacts de build Angular SSR depuis l'étape builder
COPY --from=builder --chown=node:node /app/dist/CopupitreWebsite ./dist/CopupitreWebsite

# Exposition du port d'écoute HTTP configuré
EXPOSE 4000

# Vérification périodique de santé du serveur
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/ || exit 1

# Démarrage du serveur SSR Express Angular
CMD ["node", "dist/CopupitreWebsite/server/server.mjs"]
