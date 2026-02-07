// Client Simulator - Enterprise Version with Pre-populated Trade History

import EventEmitter from 'events';

const STOCKS = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMD', 'META', 'AMZN', 'NFLX', 'PYPL'];
const TRADE_TYPES = ['BUY', 'SELL'];
const COUNTRIES = ['US', 'GB', 'DE', 'SG', 'HK', 'JP', 'AU', 'CA', 'FR', 'NL'];
const SUSPICIOUS_COUNTRIES = ['RU', 'NG', 'UA', 'XX'];

// Generate trade history for an account
function generateTradeHistory(client, stockPrices, count = 20) {
    const history = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
        const daysAgo = Math.floor(Math.random() * 90); // Last 90 days
        const symbol = STOCKS[Math.floor(Math.random() * STOCKS.length)];
        const type = TRADE_TYPES[Math.floor(Math.random() * TRADE_TYPES.length)];
        const price = stockPrices[symbol] * (0.9 + Math.random() * 0.2);
        const quantity = Math.max(1, Math.floor(client.avg_trade_size / price * (0.5 + Math.random())));

        const trade = {
            trade_id: `TRD-HIST-${now - daysAgo * 86400000}-${i}`,
            trader_id: client.id,
            trader_name: client.name,
            symbol,
            type,
            quantity,
            price: parseFloat(price.toFixed(2)),
            total_value: parseFloat((quantity * price).toFixed(2)),
            device_id: client.device_id,
            ip: client.ip_pool[Math.floor(Math.random() * client.ip_pool.length)],
            country: client.country,
            account_age_days: client.account_age_days,
            timestamp: new Date(now - daysAgo * 86400000 - Math.floor(Math.random() * 86400000)).toISOString(),
            isFraud: 0,
            fraud_type: null,
            ring_id: null,
            client_type: client.type
        };

        // Add fraud indicators for suspicious accounts
        if (client.risk_profile === 'CRITICAL' || client.risk_profile === 'HIGH') {
            trade.isFraud = Math.random() < 0.6 ? 1 : 0;
            trade.fraud_type = client.fraud_type;
            trade.ring_id = client.ring_id;
            trade.vpn_detected = Math.random() < 0.5;

            if (client.is_takeover && i < 3) {
                trade.device_id = `DEV-ATTACKER-${Math.floor(Math.random() * 1000)}`;
                trade.ip = `185.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
                trade.country = SUSPICIOUS_COUNTRIES[Math.floor(Math.random() * SUSPICIOUS_COUNTRIES.length)];
                trade.is_new_device = true;
                trade.fraud_type = 'ACCOUNT_TAKEOVER';
            }
        }

        history.push(trade);
    }

    return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// Generate clients with pre-populated history
// RATIO: ~90% legitimate users, ~10% fraud/suspicious
function generateClients(stockPrices) {
    const clients = [];

    // 1. LEGITIMATE TRADERS (70 accounts) - Main bulk of users
    for (let i = 0; i < 70; i++) {
        const client = {
            id: `CLIENT-${1000 + i}`,
            name: `Trader ${['John', 'Jane', 'Mike', 'Sarah', 'Alex', 'Emma', 'Chris', 'Lisa'][i % 8]} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore'][Math.floor(i / 9)]}`,
            type: 'LEGITIMATE',
            device_id: `DEV-LEGIT-${Math.floor(i / 3)}`,
            ip_pool: [`192.168.1.${100 + i}`, `192.168.1.${101 + i}`],
            country: COUNTRIES[i % COUNTRIES.length],
            account_age_days: 120 + Math.floor(Math.random() * 400),
            last_login: Date.now() - Math.floor(Math.random() * 86400000 * 5),
            kyc_verified: true,
            avg_trade_size: 1000 + Math.floor(Math.random() * 4000),
            risk_profile: 'LOW',
            payout_frequency: 0.15,
            balance: 15000 + Math.floor(Math.random() * 50000),
            trade_history: []
        };
        client.trade_history = generateTradeHistory(client, stockPrices, 15 + Math.floor(Math.random() * 30));
        clients.push(client);
    }

    // 2. HIGH FREQUENCY TRADERS (15 accounts) - Trusted, high volume
    for (let i = 0; i < 15; i++) {
        const client = {
            id: `HFT-${2000 + i}`,
            name: `HFT Fund ${i + 1}`,
            type: 'HIGH_FREQUENCY',
            device_id: `DEV-HFT-${i}`,
            ip_pool: [`10.10.${i}.${Math.floor(Math.random() * 255)}`],
            country: 'US',
            account_age_days: 400 + Math.floor(Math.random() * 500),
            last_login: Date.now() - Math.floor(Math.random() * 3600000),
            kyc_verified: true,
            avg_trade_size: 10000 + Math.floor(Math.random() * 30000),
            risk_profile: 'LOW',
            payout_frequency: 0.25,
            balance: 200000 + Math.floor(Math.random() * 800000),
            trade_history: []
        };
        client.trade_history = generateTradeHistory(client, stockPrices, 50 + Math.floor(Math.random() * 100));
        clients.push(client);
    }

    // 3. NEW USER - FIRST WITHDRAWAL (5 accounts) - Normal, just new
    for (let i = 0; i < 5; i++) {
        const client = {
            id: `NEW-${2500 + i}`,
            name: `New User ${['Adam', 'Beth', 'Carl', 'Diana', 'Eric'][i]}`,
            type: 'NEW_USER',
            device_id: `DEV-NEW-${i}`,
            ip_pool: [`192.168.${50 + i}.${Math.floor(Math.random() * 255)}`],
            country: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
            account_age_days: 5 + Math.floor(Math.random() * 10),
            last_login: Date.now(),
            kyc_verified: true,
            avg_trade_size: 500 + Math.floor(Math.random() * 1500),
            risk_profile: 'MEDIUM', // Unknown, needs review
            payout_frequency: 0.10,
            balance: 5000 + Math.floor(Math.random() * 10000),
            trade_history: [],
            first_withdrawal: true
        };
        client.trade_history = generateTradeHistory(client, stockPrices, 3 + Math.floor(Math.random() * 5));
        clients.push(client);
    }

    // 4. REFUND REQUEST - LEGITIMATE (4 accounts) - Normal refund scenarios
    for (let i = 0; i < 4; i++) {
        const client = {
            id: `REFUND-${2600 + i}`,
            name: `Refund User ${['Greg', 'Helen', 'Ivan', 'Julia'][i]}`,
            type: 'REFUND_REQUEST',
            device_id: `DEV-REFUND-${i}`,
            ip_pool: [`192.168.2.${100 + i}`],
            country: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
            account_age_days: 90 + Math.floor(Math.random() * 200),
            last_login: Date.now(),
            kyc_verified: true,
            avg_trade_size: 2000 + Math.floor(Math.random() * 3000),
            risk_profile: 'LOW',
            payout_frequency: 0.12,
            balance: 3000 + Math.floor(Math.random() * 5000),
            trade_history: [],
            refund_reason: ['Duplicate charge', 'Service issue', 'Overcharge', 'Cancelled order'][i]
        };
        client.trade_history = generateTradeHistory(client, stockPrices, 8 + Math.floor(Math.random() * 12));
        clients.push(client);
    }

    // 5. WRONG CARD / EXPIRED CARD (3 accounts) - Payment issues, not fraud
    for (let i = 0; i < 3; i++) {
        const client = {
            id: `CARD-${2700 + i}`,
            name: `Card Issue User ${['Kate', 'Leo', 'Mia'][i]}`,
            type: 'CARD_ISSUE',
            device_id: `DEV-CARD-${i}`,
            ip_pool: [`192.168.3.${100 + i}`],
            country: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
            account_age_days: 150 + Math.floor(Math.random() * 300),
            last_login: Date.now(),
            kyc_verified: true,
            avg_trade_size: 1500 + Math.floor(Math.random() * 2500),
            risk_profile: 'LOW',
            payout_frequency: 0.10,
            balance: 8000 + Math.floor(Math.random() * 15000),
            trade_history: [],
            card_issue: ['Expired card', 'Wrong card on file', 'Card declined'][i]
        };
        client.trade_history = generateTradeHistory(client, stockPrices, 12 + Math.floor(Math.random() * 15));
        clients.push(client);
    }

    // ============ FRAUD / SUSPICIOUS ACCOUNTS (10% of total) ============

    // 6. NO TRADE FRAUD (2 accounts) - Critical fraud pattern
    for (let i = 0; i < 2; i++) {
        const client = {
            id: `NOTRADE-${3000 + i}`,
            name: `Suspect Account ${i + 1}`,
            type: 'NO_TRADE_FRAUD',
            device_id: `DEV-NOTRADE-${i}`,
            ip_pool: [`185.${100 + i}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`],
            country: SUSPICIOUS_COUNTRIES[i % SUSPICIOUS_COUNTRIES.length],
            account_age_days: 5 + Math.floor(Math.random() * 15),
            last_login: Date.now(),
            kyc_verified: false,
            avg_trade_size: 100, // Very small trades
            risk_profile: 'CRITICAL',
            payout_frequency: 0.95, // Very high - wants money out immediately
            balance: 45000 + Math.floor(Math.random() * 10000), // Near deposit amount
            deposit_amount: 50000,
            fraud_type: 'NO_TRADE_FRAUD',
            trade_history: []
        };
        // Only 1-2 tiny trades
        client.trade_history = generateTradeHistory(client, stockPrices, 1 + Math.floor(Math.random() * 2));
        clients.push(client);
    }

    // 7. ACCOUNT TAKEOVER (2 accounts)
    for (let i = 0; i < 2; i++) {
        const client = {
            id: `GHOST-${4000 + i}`,
            name: `Dormant User ${i + 1}`,
            type: 'ACCOUNT_TAKEOVER',
            device_id: `DEV-OLD-${i}`,
            ip_pool: [`203.0.113.${i}`],
            country: 'US',
            account_age_days: 450 + Math.floor(Math.random() * 300),
            last_login: Date.now() - (86400000 * 200), // 200 days ago
            kyc_verified: true,
            avg_trade_size: 3000,
            risk_profile: 'CRITICAL',
            payout_frequency: 0.85,
            balance: 75000 + Math.floor(Math.random() * 50000),
            is_takeover: true,
            fraud_type: 'ACCOUNT_TAKEOVER',
            trade_history: []
        };
        const oldHistory = generateTradeHistory({ ...client, risk_profile: 'LOW' }, stockPrices, 25);
        const recentSuspicious = generateTradeHistory(client, stockPrices, 5);
        client.trade_history = [...recentSuspicious, ...oldHistory];
        clients.push(client);
    }

    // 8. WASH TRADERS (4 accounts in 1 ring)
    for (let i = 0; i < 4; i++) {
        const client = {
            id: `WASH-R0-${5000 + i}`,
            name: `Wash Ring Member ${i + 1}`,
            type: 'WASH_TRADING',
            device_id: `DEV-WASH-RING0`, // SAME DEVICE in ring
            ip_pool: [`10.99.0.${i}`],
            country: 'XX',
            account_age_days: 10 + Math.floor(Math.random() * 20),
            last_login: Date.now(),
            kyc_verified: false,
            avg_trade_size: 20000 + Math.floor(Math.random() * 30000),
            risk_profile: 'CRITICAL',
            payout_frequency: 0.7,
            balance: 300000 + Math.floor(Math.random() * 200000),
            ring_id: `RING-WASH-0`,
            fraud_type: 'WASH_TRADING',
            trade_history: []
        };
        client.trade_history = generateTradeHistory(client, stockPrices, 30 + Math.floor(Math.random() * 20));
        clients.push(client);
    }

    // 9. MONEY LAUNDERING (1 account)
    const mlClient = {
        id: `ML-8000`,
        name: `Structured Depositor`,
        type: 'MONEY_LAUNDERING',
        device_id: `DEV-ML-0`,
        ip_pool: [`91.200.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`],
        country: 'RU',
        account_age_days: 30 + Math.floor(Math.random() * 60),
        last_login: Date.now() - Math.floor(Math.random() * 86400000 * 2),
        kyc_verified: false,
        avg_trade_size: 9500, // Just under reporting threshold
        risk_profile: 'CRITICAL',
        payout_frequency: 0.9,
        balance: 95000 + Math.floor(Math.random() * 5000),
        fraud_type: 'MONEY_LAUNDERING',
        trade_history: []
    };
    mlClient.trade_history = generateTradeHistory(mlClient, stockPrices, 3 + Math.floor(Math.random() * 3));
    clients.push(mlClient);

    // Log client distribution
    console.log(`[ClientSimulator] Client distribution:`);
    console.log(`  - Legitimate: 70 | HFT: 15 | New: 5 | Refund: 4 | Card: 3 = 97 normal (90%)`);
    console.log(`  - Fraud: NoTrade(2) + Takeover(2) + Wash(4) + ML(1) = 9 fraud (10%)`);

    return clients;
}


class ClientSimulator extends EventEmitter {
    constructor() {
        super();
        this.stockPrices = {
            'AAPL': 187.50, 'GOOGL': 142.30, 'MSFT': 418.20,
            'TSLA': 248.80, 'NVDA': 878.40, 'AMD': 163.90,
            'META': 508.60, 'AMZN': 179.90, 'NFLX': 487.20, 'PYPL': 64.30
        };
        this.clients = generateClients(this.stockPrices);
        this.tradeCount = 0;
        this.payoutCount = 0;
        this.intervalId = null;
        this.payoutIntervalId = null;
        this.isRunning = false;
    }

    // Get ALL pre-populated trade history
    getAllTradeHistory() {
        const allTrades = [];
        for (const client of this.clients) {
            allTrades.push(...client.trade_history);
        }
        return allTrades.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    updateStockPrices() {
        for (const stock in this.stockPrices) {
            const change = (Math.random() - 0.5) * 2;
            this.stockPrices[stock] = Math.max(1, this.stockPrices[stock] * (1 + change / 100));
        }
    }

    generateTradeForClient(client) {
        const symbol = STOCKS[Math.floor(Math.random() * STOCKS.length)];
        const type = TRADE_TYPES[Math.floor(Math.random() * TRADE_TYPES.length)];
        const price = this.stockPrices[symbol];
        const quantity = Math.max(1, Math.floor(client.avg_trade_size / price));

        const trade = {
            trade_id: `TRD-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            trader_id: client.id,
            trader_name: client.name,
            symbol,
            type,
            quantity,
            price: parseFloat(price.toFixed(2)),
            total_value: parseFloat((quantity * price).toFixed(2)),
            device_id: client.device_id,
            ip: client.ip_pool[Math.floor(Math.random() * client.ip_pool.length)],
            country: client.country,
            account_age_days: client.account_age_days,
            last_login_age: Math.floor((Date.now() - client.last_login) / 86400000),
            is_new_device: client.is_takeover || Math.random() < 0.05,
            vpn_detected: client.type !== 'LEGITIMATE' && client.type !== 'HIGH_FREQUENCY' && Math.random() < 0.4,
            is_verified: client.kyc_verified,
            timestamp: new Date().toISOString(),
            isFraud: client.risk_profile === 'CRITICAL' ? 1 : 0,
            fraud_type: client.fraud_type,
            ring_id: client.ring_id,
            client_type: client.type
        };

        // Account takeover simulation
        if (client.is_takeover) {
            trade.device_id = `DEV-ATTACKER-${Date.now()}`;
            trade.ip = `185.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
            trade.country = SUSPICIOUS_COUNTRIES[Math.floor(Math.random() * SUSPICIOUS_COUNTRIES.length)];
            trade.is_new_device = true;
            trade.vpn_detected = true;
            trade.fraud_type = 'ACCOUNT_TAKEOVER';
            trade.isFraud = 1;
        }

        // Add to client's history
        client.trade_history.unshift(trade);
        if (client.trade_history.length > 200) client.trade_history.pop();

        return trade;
    }

    generatePayoutRequest(client) {
        const payoutAmount = Math.min(
            client.balance * (0.3 + Math.random() * 0.5),
            client.balance
        );

        return {
            trader_id: client.id,
            trader_name: client.name,
            amount: parseFloat(payoutAmount.toFixed(2)),
            method: ['WIRE_TRANSFER', 'ACH', 'CRYPTO', 'CARD_REFUND'][Math.floor(Math.random() * 4)],
            client_type: client.type,
            fraud_type: client.fraud_type,
            ring_id: client.ring_id,
            device_id: client.is_takeover ? `DEV-ATTACKER-${Date.now()}` : client.device_id,
            ip: client.ip_pool[0],
            country: client.is_takeover ? 'RU' : client.country,
            is_new_device: client.is_takeover || Math.random() < 0.1,
            account_age_days: client.account_age_days,
            vpn_detected: client.type !== 'LEGITIMATE' && client.type !== 'HIGH_FREQUENCY',
            deposit_amount: client.deposit_amount,
            trade_count: client.trade_history.length
        };
    }

    start(tradeIntervalMs = 1200, payoutIntervalMs = 8000) {
        if (this.isRunning) return;
        this.isRunning = true;

        const total = this.clients.length;
        const legitimate = this.clients.filter(c => c.type === 'LEGITIMATE' || c.type === 'HIGH_FREQUENCY').length;
        const suspicious = this.clients.filter(c => c.risk_profile !== 'LOW').length;
        const totalTrades = this.clients.reduce((s, c) => s + c.trade_history.length, 0);

        console.log(`\n[ClientSimulator] ========================================`);
        console.log(`[ClientSimulator] Started with ${total} client accounts`);
        console.log(`[ClientSimulator] Pre-populated trade history: ${totalTrades} trades`);
        console.log(`[ClientSimulator] Legitimate: ${legitimate} | Suspicious: ${suspicious}`);
        console.log(`[ClientSimulator] ========================================\n`);

        // Trade generation
        this.intervalId = setInterval(() => {
            this.updateStockPrices();
            const tradersThisCycle = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < tradersThisCycle; i++) {
                const client = this.clients[Math.floor(Math.random() * this.clients.length)];
                const trade = this.generateTradeForClient(client);
                this.tradeCount++;
                this.emit('trade', trade);
            }
        }, tradeIntervalMs);

        // Payout generation
        this.payoutIntervalId = setInterval(() => {
            for (const client of this.clients) {
                if (Math.random() < client.payout_frequency * 0.03) {
                    const payoutRequest = this.generatePayoutRequest(client);
                    this.payoutCount++;
                    this.emit('payout_request', payoutRequest);
                }
            }
        }, payoutIntervalMs);
    }

    stop() {
        if (this.intervalId) clearInterval(this.intervalId);
        if (this.payoutIntervalId) clearInterval(this.payoutIntervalId);
        this.isRunning = false;
        console.log('[ClientSimulator] Stopped');
    }

    getTradesForClient(traderId) {
        const client = this.clients.find(c => c.id === traderId);
        return client ? client.trade_history : [];
    }

    getClient(traderId) {
        return this.clients.find(c => c.id === traderId);
    }

    getStats() {
        const totalTrades = this.clients.reduce((s, c) => s + c.trade_history.length, 0);
        return {
            total_clients: this.clients.length,
            legitimate_clients: this.clients.filter(c => c.type === 'LEGITIMATE' || c.type === 'HIGH_FREQUENCY').length,
            suspicious_clients: this.clients.filter(c => c.risk_profile !== 'LOW').length,
            total_pre_populated_trades: totalTrades,
            new_trades: this.tradeCount,
            payout_count: this.payoutCount,
            stock_prices: { ...this.stockPrices },
            isRunning: this.isRunning
        };
    }

    getStockPrices() {
        return { ...this.stockPrices };
    }

    getClients() {
        return this.clients.map(c => ({
            id: c.id,
            name: c.name,
            type: c.type,
            country: c.country,
            risk_profile: c.risk_profile,
            balance: c.balance,
            trade_count: c.trade_history.length,
            fraud_type: c.fraud_type,
            ring_id: c.ring_id
        }));
    }
}

export const clientSimulator = new ClientSimulator();
export default clientSimulator;
