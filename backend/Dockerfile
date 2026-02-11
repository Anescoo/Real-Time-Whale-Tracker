# ===========================
# ÉTAPE 1 : BUILD
# ===========================
FROM node:20-alpine AS builder

WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Compiler TypeScript
RUN npm run build

# ===========================
# ÉTAPE 2 : PRODUCTION
# ===========================
FROM node:20-alpine

WORKDIR /app

# Copier uniquement les fichiers nécessaires
COPY package*.json ./
RUN npm ci --only=production

# Copier le code compilé
COPY --from=builder /app/dist ./dist

# Exposer le port
EXPOSE 3000

# Démarrer l'application
CMD ["node", "dist/index.js"]
# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copier package files
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le code source
COPY . .

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "run", "dev"]
