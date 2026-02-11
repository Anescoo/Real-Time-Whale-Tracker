# Real-Time-Whale-Tracker

## 🚀 Quick Start

### 1️⃣ Clone the repository
```bash
git clone https://github.com/ton-username/whale-tracker.git
cd whale-tracker
```

### 2️⃣ Setup environment variables

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env and add your API keys
```

**Frontend:**
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local if needed (defaults should work)
```

**Docker (optional):**
```bash
cp .env.example .env
# Edit .env for Docker config
```

### 3️⃣ Install dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4️⃣ Start services

**With Docker (recommended):**
```bash
docker-compose up -d
```

**Without Docker:**
```bash
# Terminal 1 - PostgreSQL (install locally first)
# Terminal 2 - Redis
redis-server

# Terminal 3 - Backend
cd backend
npm run dev

# Terminal 4 - Frontend
cd frontend
npm run dev
```

### 5️⃣ Access the app
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- WebSocket: ws://localhost:8080
```
