# ===========================
# ÉTAPE 1 : BUILD
# ===========================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ===========================
# ÉTAPE 2 : NGINX
# ===========================
FROM nginx:alpine

# Copier les fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copier package files
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le code source
COPY . .

# Exposer le port
EXPOSE 5173

# Commande de démarrage avec --host pour être accessible depuis l'extérieur
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
