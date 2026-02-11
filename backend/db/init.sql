-- backend/db/init.sql

-- ====================================
-- 1. Extensions
-- ====================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================
-- 2. Table users (exemple)
-- ====================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 3. Table whale_transactions
-- ====================================
CREATE TABLE IF NOT EXISTS whale_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    value_eth DECIMAL(30, 18) NOT NULL,
    value_usd DECIMAL(20, 2),
    gas_price BIGINT,
    gas_used BIGINT,
    timestamp TIMESTAMP NOT NULL,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 4. Indexes pour whale_transactions
-- ====================================
CREATE INDEX IF NOT EXISTS idx_block_number ON whale_transactions(block_number);
CREATE INDEX IF NOT EXISTS idx_timestamp ON whale_transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_from_address ON whale_transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_to_address ON whale_transactions(to_address);
CREATE INDEX IF NOT EXISTS idx_value_eth ON whale_transactions(value_eth);
CREATE INDEX IF NOT EXISTS idx_detected_at ON whale_transactions(detected_at);

-- ====================================
-- 5. Table alerts
-- ====================================
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'whale_tx', 'price_change', etc.
    threshold_value DECIMAL(30, 18),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_triggered TIMESTAMP
);

-- ====================================
-- 6. Indexes pour alerts
-- ====================================
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active);

-- ====================================
-- 7. Table wallets (pour tracking)
-- ====================================
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address VARCHAR(42) UNIQUE NOT NULL,
    label VARCHAR(255),
    is_whale BOOLEAN DEFAULT false,
    total_volume_eth DECIMAL(30, 18) DEFAULT 0,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP,
    tx_count INTEGER DEFAULT 0
);

-- ====================================
-- 8. Indexes pour wallets
-- ====================================
CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);
CREATE INDEX IF NOT EXISTS idx_wallets_is_whale ON wallets(is_whale);
CREATE INDEX IF NOT EXISTS idx_wallets_last_activity ON wallets(last_activity);

-- ====================================
-- 9. Données de test (optionnel)
-- ====================================
INSERT INTO users (email, username) 
VALUES ('test@example.com', 'testuser')
ON CONFLICT (email) DO NOTHING;

-- ====================================
-- 10. Vérifications
-- ====================================
DO $$ 
BEGIN
    RAISE NOTICE 'Database initialized successfully!';
    RAISE NOTICE 'Tables created: users, whale_transactions, alerts, wallets';
END $$;
