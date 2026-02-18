# 1. Créer .env depuis le template
cp .env.example .env

# 2. Éditer .env avec tes vraies valeurs
nano .env
# Remplacer:
# - YOUR_ALCHEMY_API_KEY
# - changeme_secure_password_here
# - changeme_redis_password_here
# - your_random_jwt_secret_here (générer avec: openssl rand -base64 32)

# 3. Build les images
docker-compose build

# 4. Lancer tous les services
docker-compose up -d

# 5. Voir les logs
docker-compose logs -f

# 6. Vérifier que tout fonctionne
docker-compose ps


# Démarrer tous les services
docker-compose up -d

# Arrêter tous les services
docker-compose down

# Redémarrer un service spécifique
docker-compose restart backend

# Voir les logs en temps réel
docker-compose logs -f backend

# Exécuter une commande dans un container
docker-compose exec backend npm run prisma:studio

# Rebuild après changement de code
docker-compose up -d --build backend

# Nettoyer tout (ATTENTION: supprime les données)
docker-compose down -v


# Exécuter une migration
docker-compose exec backend npx prisma migrate dev

# Ouvrir Prisma Studio
docker-compose exec backend npx prisma studio

# Seed la base
docker-compose exec backend npm run seed

# Backup de la DB
docker-compose exec postgres pg_dump -U postgres whale_tracker > backup.sql

---

# 1. Arrêter tous les conteneurs
docker-compose down

# 2. Supprimer les volumes (données persistantes)
docker-compose down -v

# 3. Supprimer les conteneurs arrêtés
docker-compose rm -f

# 4. Supprimer les images liées au projet
docker-compose down --rmi all

# 5. Rebuild SANS cache
docker-compose build --no-cache

# 6. Relancer les services
docker-compose up -d

# 7. Suivre les logs en temps réel
docker-compose logs -f