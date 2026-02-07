import EventEmitter from 'events';

// Trading patterns and stocks
const STOCKS = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMD', 'META', 'AMZN'];
const TRADE_TYPES = ['BUY', 'SELL', 'SHORT'];

class TradeSimulator extends EventEmitter {
    constructor() {
        super();
        this.intervalId = null;
        this.isRunning = false;
        this.tradeCount = 0;
        this.blockedCount = 0;
        this.totalVolume = 0;

        // Simulated stock prices
        this.stockPrices = {
            'AAPL': 185.50, 'GOOGL': 142.30, 'MSFT': 415.20,
            'TSLA': 245.80, 'NVDA': 875.40, 'AMD': 165.90,
            'META': 505.60, 'AMZN': 178.90
        };

        // Traders with varying risk profiles
        this.traders = this.generateTraders(100);

        // Ghost/suspicious accounts
        this.ghostAccounts = this.generateGhostAccounts(15);

        // Known fraud rings
        this.fraudRings = this.generateFraudRings(5);
    }

    generateTraders(count) {
        return Array.from({ length: count }, (_, i) => ({
            id: `TRADER-${1000 + i}`,
            name: `Trader ${i + 1}`,
            device_id: `DEV-${Math.floor(i / 5)}`, // Groups share devices
            ip: `192.168.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 255)}`,
            last_login: Date.now() - Math.floor(Math.random() * 86400000 * 30),
            account_age_days: 30 + Math.floor(Math.random() * 365),
            avg_trade_size: 100 + Math.floor(Math.random() * 5000),
            trade_count: Math.floor(Math.random() * 500),
            risk_score: Math.random() * 0.3,
            verified: Math.random() > 0.1,
            country: ['US', 'GB', 'DE', 'SG', 'HK'][Math.floor(Math.random() * 5)]
        }));
    }

    generateGhostAccounts(count) {
        return Array.from({ length: count }, (_, i) => ({
            id: `GHOST-${100 + i}`,
            name: `Dormant Account ${i + 1}`,
            device_id: `DEV-OLD-${i}`,
            ip: `10.0.0.${i}`,
            last_login: Date.now() - (86400000 * 180), // 6 months ago
            account_age_days: 500 + Math.floor(Math.random() * 500),
            avg_trade_size: 50000 + Math.floor(Math.random() * 100000),
            trade_count: Math.floor(Math.random() * 10),
            risk_score: 0.7 + Math.random() * 0.3,
            verified: false,
            is_ghost: true,
            country: 'XX'
        }));
    }

    generateFraudRings(count) {
        return Array.from({ length: count }, (_, i) => ({
            ring_id: `RING-${i + 1}`,
            device_id: `DEV-FRAUD-${i}`,
            members: [
                `RING${i}-TRADER-A`,
                `RING${i}-TRADER-B`,
                `RING${i}-TRADER-C`
            ]
        }));
    }

    updateStockPrices() {
        // Random price movements
        for (const stock in this.stockPrices) {
            const change = (Math.random() - 0.5) * 2; // -1% to +1%
            this.stockPrices[stock] = Math.max(1, this.stockPrices[stock] * (1 + change / 100));
        }
    }

    generateNormalTrade() {
        const trader = this.traders[Math.floor(Math.random() * this.traders.length)];
        const symbol = STOCKS[Math.floor(Math.random() * STOCKS.length)];
        const type = TRADE_TYPES[Math.floor(Math.random() * TRADE_TYPES.length)];
        const quantity = Math.max(1, Math.floor(trader.avg_trade_size / this.stockPrices[symbol]));
        const price = this.stockPrices[symbol] * (0.99 + Math.random() * 0.02);

        return {
            trade_id: `TRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            trader_id: trader.id,
            trader_name: trader.name,
            symbol,
            type,
            quantity,
            price: parseFloat(price.toFixed(2)),
            total_value: parseFloat((quantity * price).toFixed(2)),
            device_id: trader.device_id,
            ip: trader.ip,
            account_age_days: trader.account_age_days,
            last_login_age: Math.floor((Date.now() - trader.last_login) / 86400000),
            is_verified: trader.verified,
            country: trader.country,
            is_new_device: false,
            vpn_detected: Math.random() < 0.05,
            timestamp: new Date().toISOString(),
            isFraud: 0
        };
    }

    generateSuspiciousTrade(patternType) {
        const symbol = STOCKS[Math.floor(Math.random() * STOCKS.length)];
        const price = this.stockPrices[symbol];

        switch (patternType) {
            case 'WASH_TRADE': {
                // Same entity on both sides
                const fraudRing = this.fraudRings[Math.floor(Math.random() * this.fraudRings.length)];
                return {
                    trade_id: `TRD-WASH-${Date.now()}`,
                    trader_id: fraudRing.members[0],
                    trader_name: 'Wash Trader',
                    counterparty_id: fraudRing.members[1],
                    symbol,
                    type: 'SELL',
                    quantity: 5000 + Math.floor(Math.random() * 10000),
                    price: parseFloat(price.toFixed(2)),
                    total_value: parseFloat((5000 * price).toFixed(2)),
                    device_id: fraudRing.device_id,
                    ip: '10.99.99.1',
                    account_age_days: 15,
                    last_login_age: 0,
                    is_verified: false,
                    country: 'XX',
                    is_new_device: true,
                    vpn_detected: true,
                    timestamp: new Date().toISOString(),
                    isFraud: 1,
                    fraud_type: 'WASH_TRADING',
                    fraud_reason: 'Same device trading with self through multiple accounts'
                };
            }

            case 'PUMP_DUMP': {
                // Large position + price spike
                const ghost = this.ghostAccounts[Math.floor(Math.random() * this.ghostAccounts.length)];
                return {
                    trade_id: `TRD-PUMP-${Date.now()}`,
                    trader_id: ghost.id,
                    trader_name: 'Pump Trader',
                    symbol,
                    type: 'SELL',
                    quantity: 50000,
                    price: parseFloat((price * 1.15).toFixed(2)), // Selling at inflated price
                    total_value: parseFloat((50000 * price * 1.15).toFixed(2)),
                    device_id: ghost.device_id,
                    ip: ghost.ip,
                    account_age_days: ghost.account_age_days,
                    last_login_age: 180, // Dormant account suddenly active
                    is_verified: false,
                    country: ghost.country,
                    is_new_device: true, // New device on old account
                    vpn_detected: true,
                    timestamp: new Date().toISOString(),
                    isFraud: 1,
                    fraud_type: 'PUMP_AND_DUMP',
                    fraud_reason: 'Dormant account large sell after price spike'
                };
            }

            case 'GHOST_TRADER': {
                const ghost = this.ghostAccounts[Math.floor(Math.random() * this.ghostAccounts.length)];
                return {
                    trade_id: `TRD-GHOST-${Date.now()}`,
                    trader_id: ghost.id,
                    trader_name: 'Ghost Trader',
                    symbol,
                    type: 'SELL',
                    quantity: 10000,
                    price: parseFloat(price.toFixed(2)),
                    total_value: parseFloat((10000 * price).toFixed(2)),
                    device_id: `DEV-UNKNOWN-${Date.now()}`, // New unknown device
                    ip: `185.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                    account_age_days: ghost.account_age_days,
                    last_login_age: 365, // Very old last login
                    is_verified: false,
                    country: 'RU', // Different country
                    is_new_device: true,
                    vpn_detected: true,
                    timestamp: new Date().toISOString(),
                    isFraud: 1,
                    fraud_type: 'ACCOUNT_TAKEOVER',
                    fraud_reason: 'Inactive account accessed from new device/location'
                };
            }

            case 'COORDINATED': {
                const fraudRing = this.fraudRings[Math.floor(Math.random() * this.fraudRings.length)];
                return {
                    trade_id: `TRD-COORD-${Date.now()}`,
                    trader_id: fraudRing.members[Math.floor(Math.random() * 3)],
                    trader_name: 'Ring Member',
                    symbol,
                    type: 'BUY',
                    quantity: 8000,
                    price: parseFloat(price.toFixed(2)),
                    total_value: parseFloat((8000 * price).toFixed(2)),
                    device_id: fraudRing.device_id,
                    ip: '10.0.0.50',
                    account_age_days: 20,
                    last_login_age: 0,
                    is_verified: false,
                    country: 'XX',
                    is_new_device: false,
                    vpn_detected: true,
                    ring_id: fraudRing.ring_id,
                    timestamp: new Date().toISOString(),
                    isFraud: 1,
                    fraud_type: 'COORDINATED_TRADING',
                    fraud_reason: 'Multiple accounts on same device executing synchronized trades'
                };
            }

            default:
                return this.generateNormalTrade();
        }
    }

    start(intervalMs = 2000) {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('Trade Simulator Started...');

        this.intervalId = setInterval(() => {
            // Update stock prices
            this.updateStockPrices();

            // Generate trade - 15% chance of suspicious
            const isSuspicious = Math.random() < 0.15;
            let trade;

            if (isSuspicious) {
                const patterns = ['WASH_TRADE', 'PUMP_DUMP', 'GHOST_TRADER', 'COORDINATED'];
                const pattern = patterns[Math.floor(Math.random() * patterns.length)];
                trade = this.generateSuspiciousTrade(pattern);
            } else {
                trade = this.generateNormalTrade();
            }

            this.tradeCount++;
            this.totalVolume += trade.total_value;

            this.emit('trade', trade);
        }, intervalMs);
    }

    injectFraudPattern(patternType) {
        const trade = this.generateSuspiciousTrade(patternType);
        this.tradeCount++;
        this.totalVolume += trade.total_value;
        this.emit('trade', trade);
    }

    getStats() {
        return {
            tradeCount: this.tradeCount,
            blockedCount: this.blockedCount,
            totalVolume: this.totalVolume,
            isRunning: this.isRunning,
            stockPrices: { ...this.stockPrices }
        };
    }

    getStockPrices() {
        return { ...this.stockPrices };
    }

    stop() {
        if (this.intervalId) clearInterval(this.intervalId);
        this.isRunning = false;
        console.log('Trade Simulator Stopped.');
    }
}

export const tradeSimulator = new TradeSimulator();
