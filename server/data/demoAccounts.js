// Demo Trading Accounts for Client Portal
// These are pre-configured accounts with trading history for demonstration

export const DEMO_ACCOUNTS = {
    // LEGITIMATE TRADER - Should get payouts approved
    'john_trader': {
        id: 'CLIENT-DEMO-001',
        username: 'john_trader',
        password: 'demo123',
        name: 'John Smith',
        email: 'john.smith@email.com',
        type: 'LEGITIMATE',
        balance: 45230.50,
        account_age_days: 245,
        country: 'US',
        device_id: 'DEV-JOHN-STABLE',
        ip: '192.168.1.100',
        kyc_verified: true,
        risk_profile: 'LOW',
        trade_history: [
            { symbol: 'AAPL', type: 'BUY', quantity: 50, price: 187.50, total_value: 9375, days_ago: 45, isFraud: 0 },
            { symbol: 'GOOGL', type: 'BUY', quantity: 30, price: 142.30, total_value: 4269, days_ago: 40, isFraud: 0 },
            { symbol: 'AAPL', type: 'SELL', quantity: 25, price: 189.20, total_value: 4730, days_ago: 35, isFraud: 0 },
            { symbol: 'MSFT', type: 'BUY', quantity: 40, price: 418.20, total_value: 16728, days_ago: 30, isFraud: 0 },
            { symbol: 'NVDA', type: 'BUY', quantity: 15, price: 878.40, total_value: 13176, days_ago: 25, isFraud: 0 },
            { symbol: 'GOOGL', type: 'SELL', quantity: 30, price: 145.00, total_value: 4350, days_ago: 20, isFraud: 0 },
            { symbol: 'TSLA', type: 'BUY', quantity: 20, price: 248.80, total_value: 4976, days_ago: 15, isFraud: 0 },
            { symbol: 'MSFT', type: 'SELL', quantity: 20, price: 422.00, total_value: 8440, days_ago: 10, isFraud: 0 },
            { symbol: 'AMD', type: 'BUY', quantity: 60, price: 163.90, total_value: 9834, days_ago: 5, isFraud: 0 },
            { symbol: 'NVDA', type: 'SELL', quantity: 10, price: 890.00, total_value: 8900, days_ago: 2, isFraud: 0 }
        ],
        payout_history: [
            { amount: 5000, status: 'APPROVED', date: '2026-01-15' },
            { amount: 8000, status: 'APPROVED', date: '2026-01-28' }
        ]
    },

    // HIGH FREQUENCY TRADER - Large volumes, should be approved
    'hft_mike': {
        id: 'CLIENT-DEMO-002',
        username: 'hft_mike',
        password: 'demo123',
        name: 'Mike Johnson',
        email: 'mike.johnson@tradingfirm.com',
        type: 'HIGH_FREQUENCY',
        balance: 892450.00,
        account_age_days: 520,
        country: 'US',
        device_id: 'DEV-HFT-MIKE',
        ip: '10.10.5.100',
        kyc_verified: true,
        risk_profile: 'LOW',
        trade_history: Array.from({ length: 100 }, (_, i) => ({
            symbol: ['AAPL', 'GOOGL', 'MSFT', 'NVDA', 'AMD'][i % 5],
            type: i % 2 === 0 ? 'BUY' : 'SELL',
            quantity: 100 + Math.floor(Math.random() * 500),
            price: 150 + Math.random() * 100,
            total_value: 15000 + Math.floor(Math.random() * 50000),
            days_ago: Math.floor(i / 3),
            isFraud: 0
        })),
        payout_history: [
            { amount: 50000, status: 'APPROVED', date: '2026-01-10' },
            { amount: 100000, status: 'APPROVED', date: '2026-01-25' }
        ]
    },

    // CHEATER ACCOUNT 1 - No Trade Fraud (deposits, minimal trading, tries to withdraw)
    'quick_cash': {
        id: 'CLIENT-DEMO-003',
        username: 'quick_cash',
        password: 'demo123',
        name: 'Alex Quick',
        email: 'quickmoney@tempmail.com',
        type: 'NO_TRADE_FRAUD',
        balance: 48500.00,
        account_age_days: 8,
        country: 'XX',
        device_id: 'DEV-FRAUD-001',
        ip: '185.142.236.45',
        kyc_verified: false,
        risk_profile: 'CRITICAL',
        deposit_amount: 50000,
        vpn_detected: true,
        is_new_device: true,
        fraud_type: 'NO_TRADE_FRAUD',
        trade_history: [
            // Only 1 tiny trade to appear "active"
            { symbol: 'AAPL', type: 'BUY', quantity: 1, price: 187.50, total_value: 187.50, days_ago: 1, isFraud: 1 },
            { symbol: 'AAPL', type: 'SELL', quantity: 1, price: 187.00, total_value: 187.00, days_ago: 0, isFraud: 1 }
        ],
        payout_history: []
    },

    // CHEATER ACCOUNT 2 - Account Takeover (old dormant account suddenly active)
    'dormant_dave': {
        id: 'CLIENT-DEMO-004',
        username: 'dormant_dave',
        password: 'demo123',
        name: 'David Miller',
        email: 'dave.miller@oldmail.com',
        type: 'ACCOUNT_TAKEOVER',
        balance: 125000.00,
        account_age_days: 850,
        country: 'RU', // Attacker's country
        device_id: 'DEV-ATTACKER-NEW',
        ip: '91.234.56.78',
        original_country: 'US',
        original_device: 'DEV-DAVE-OLD',
        kyc_verified: true, // Was verified before takeover
        risk_profile: 'CRITICAL',
        vpn_detected: true,
        is_new_device: true,
        is_takeover: true,
        fraud_type: 'ACCOUNT_TAKEOVER',
        trade_history: [
            // Old legitimate trades (before takeover)
            { symbol: 'MSFT', type: 'BUY', quantity: 30, price: 350.00, total_value: 10500, days_ago: 300, isFraud: 0, device_id: 'DEV-DAVE-OLD', country: 'US' },
            { symbol: 'GOOGL', type: 'BUY', quantity: 50, price: 130.00, total_value: 6500, days_ago: 280, isFraud: 0, device_id: 'DEV-DAVE-OLD', country: 'US' },
            { symbol: 'MSFT', type: 'SELL', quantity: 30, price: 355.00, total_value: 10650, days_ago: 260, isFraud: 0, device_id: 'DEV-DAVE-OLD', country: 'US' },
            // Recent suspicious trades (after takeover - new device, new country)
            { symbol: 'NVDA', type: 'BUY', quantity: 100, price: 878.40, total_value: 87840, days_ago: 2, isFraud: 1, device_id: 'DEV-ATTACKER-NEW', country: 'RU' },
            { symbol: 'NVDA', type: 'SELL', quantity: 100, price: 875.00, total_value: 87500, days_ago: 1, isFraud: 1, device_id: 'DEV-ATTACKER-NEW', country: 'RU' }
        ],
        payout_history: []
    },

    // CHEATER ACCOUNT 3 - Wash Trading Ring Member
    'wash_trader_1': {
        id: 'CLIENT-DEMO-005',
        username: 'wash_trader_1',
        password: 'demo123',
        name: 'Ring Member Alpha',
        email: 'alpha@fakemail.com',
        type: 'WASH_TRADING',
        balance: 280000.00,
        account_age_days: 25,
        country: 'XX',
        device_id: 'DEV-WASH-SHARED', // Same device as other ring members
        ip: '10.99.0.1',
        kyc_verified: false,
        risk_profile: 'CRITICAL',
        ring_id: 'RING-DEMO-001',
        fraud_type: 'WASH_TRADING',
        trade_history: [
            // Circular trades with other wash traders
            { symbol: 'TSLA', type: 'BUY', quantity: 500, price: 248.80, total_value: 124400, days_ago: 5, isFraud: 1, ring_id: 'RING-DEMO-001' },
            { symbol: 'TSLA', type: 'SELL', quantity: 500, price: 248.90, total_value: 124450, days_ago: 4, isFraud: 1, ring_id: 'RING-DEMO-001' },
            { symbol: 'NVDA', type: 'BUY', quantity: 200, price: 878.40, total_value: 175680, days_ago: 3, isFraud: 1, ring_id: 'RING-DEMO-001' },
            { symbol: 'NVDA', type: 'SELL', quantity: 200, price: 878.50, total_value: 175700, days_ago: 2, isFraud: 1, ring_id: 'RING-DEMO-001' }
        ],
        payout_history: []
    },

    // NEW USER - Should get manual review (not enough history)
    'new_sarah': {
        id: 'CLIENT-DEMO-006',
        username: 'new_sarah',
        password: 'demo123',
        name: 'Sarah Williams',
        email: 'sarah.w@newmail.com',
        type: 'NEW_USER',
        balance: 12500.00,
        account_age_days: 5,
        country: 'CA',
        device_id: 'DEV-SARAH-NEW',
        ip: '204.48.32.105',
        kyc_verified: true,
        risk_profile: 'MEDIUM',
        trade_history: [
            { symbol: 'AAPL', type: 'BUY', quantity: 20, price: 187.50, total_value: 3750, days_ago: 3, isFraud: 0 },
            { symbol: 'GOOGL', type: 'BUY', quantity: 15, price: 142.30, total_value: 2135, days_ago: 2, isFraud: 0 },
            { symbol: 'AAPL', type: 'SELL', quantity: 10, price: 188.00, total_value: 1880, days_ago: 1, isFraud: 0 }
        ],
        payout_history: []
    },

    // ========== BLACK ACCOUNT - FRAUD TEST MODE ==========
    // This account simulates a sophisticated fraudster:
    // - Appears legitimate on the surface
    // - Makes profitable trades (always buys low, sells high)
    // - Attempts market manipulation patterns
    // - Use toggle to activate automated fraud simulation
    'black_ops': {
        id: 'BLACK-ACCOUNT-001',
        username: 'black_ops',
        password: 'shadow',
        name: '█████████',
        email: 'shadow@darknet.onion',
        type: 'BLACK_MARKET',
        balance: 500000.00,
        account_age_days: 180,
        country: 'XX',
        device_id: 'DEV-GHOST-001',
        ip: '0.0.0.0',
        kyc_verified: true, // Fake KYC passed
        risk_profile: 'HIDDEN', // Doesn't show risk
        is_black_account: true,
        auto_trade_enabled: false,
        fraud_type: 'MARKET_MANIPULATION',
        manipulation_strategy: 'PUMP_AND_DUMP',
        profit_only: true, // Only show profitable trades to user
        trade_history: [
            // All trades show profit - suspicious pattern
            { symbol: 'NVDA', type: 'BUY', quantity: 100, price: 800.00, total_value: 80000, days_ago: 10, isFraud: 1, profit: 5000 },
            { symbol: 'NVDA', type: 'SELL', quantity: 100, price: 850.00, total_value: 85000, days_ago: 8, isFraud: 1, profit: 5000 },
            { symbol: 'TSLA', type: 'BUY', quantity: 200, price: 240.00, total_value: 48000, days_ago: 7, isFraud: 1, profit: 4000 },
            { symbol: 'TSLA', type: 'SELL', quantity: 200, price: 260.00, total_value: 52000, days_ago: 5, isFraud: 1, profit: 4000 },
            { symbol: 'AMD', type: 'BUY', quantity: 500, price: 150.00, total_value: 75000, days_ago: 4, isFraud: 1, profit: 7500 },
            { symbol: 'AMD', type: 'SELL', quantity: 500, price: 165.00, total_value: 82500, days_ago: 2, isFraud: 1, profit: 7500 },
            // Wash trades - circular trading
            { symbol: 'AAPL', type: 'BUY', quantity: 1000, price: 185.00, total_value: 185000, days_ago: 1, isFraud: 1, ring_id: 'RING-BLACK-001' },
            { symbol: 'AAPL', type: 'SELL', quantity: 1000, price: 185.50, total_value: 185500, days_ago: 0, isFraud: 1, ring_id: 'RING-BLACK-001' }
        ],
        payout_history: [],
        total_profit: 21000
    }
};

// Get all demo account usernames for display
export const getDemoAccounts = () => {
    return Object.entries(DEMO_ACCOUNTS).map(([username, account]) => ({
        username,
        name: account.name,
        type: account.type,
        balance: account.balance,
        risk_profile: account.risk_profile,
        description: getAccountDescription(account.type)
    }));
};

function getAccountDescription(type) {
    switch (type) {
        case 'LEGITIMATE': return 'Established trader with clean history';
        case 'HIGH_FREQUENCY': return 'High volume trader - trusted';
        case 'NO_TRADE_FRAUD': return 'Deposited, barely traded, withdrawing';
        case 'ACCOUNT_TAKEOVER': return 'Old account, new device/country';
        case 'WASH_TRADING': return 'Part of circular trading ring';
        case 'NEW_USER': return 'New customer - limited history';
        case 'BLACK_MARKET': return '▓▓▓ CLASSIFIED ▓▓▓';
        default: return 'Unknown';
    }
}

export default DEMO_ACCOUNTS;
