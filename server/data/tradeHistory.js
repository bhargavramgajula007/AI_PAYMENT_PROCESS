import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path for persistent trade storage
const TRADES_FILE = path.join(__dirname, 'trades.json');

// Trade history manager - persistent storage
export const tradeHistory = {
    trades: [],

    // Load trades from file on startup
    load() {
        try {
            if (fs.existsSync(TRADES_FILE)) {
                const data = fs.readFileSync(TRADES_FILE, 'utf8');
                this.trades = JSON.parse(data);
                console.log(`[TradeHistory] Loaded ${this.trades.length} trades from storage`);
            } else {
                console.log('[TradeHistory] No existing trades file, seeding initial data...');
                this.seedInitialTrades();
            }
        } catch (e) {
            console.error('[TradeHistory] Failed to load trades:', e.message);
            this.seedInitialTrades();
        }
        return this.trades;
    },

    // Save trades to file (called after each new trade)
    save() {
        try {
            fs.writeFileSync(TRADES_FILE, JSON.stringify(this.trades, null, 2), 'utf8');
        } catch (e) {
            console.error('[TradeHistory] Failed to save trades:', e.message);
        }
    },

    // Add a new trade (immutable - once added, cannot be modified)
    addTrade(trade) {
        // Add unique ID and timestamp if not present
        const newTrade = {
            ...trade,
            trade_id: trade.trade_id || `TRD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: trade.timestamp || new Date().toISOString(),
            immutable: true // Mark as permanent record
        };
        this.trades.unshift(newTrade);

        // Keep max 10000 trades
        if (this.trades.length > 10000) {
            this.trades = this.trades.slice(0, 10000);
        }

        this.save();
        return newTrade;
    },

    // Get trades for a specific trader
    getTradesByTrader(traderId) {
        return this.trades.filter(t => t.trader_id === traderId);
    },

    // Get all trades
    getAll() {
        return this.trades;
    },

    // Seed with realistic initial trades for demo accounts
    seedInitialTrades() {
        const now = Date.now();
        const DAY = 24 * 60 * 60 * 1000;
        const HOUR = 60 * 60 * 1000;

        // Realistic stock data based on current market
        const stockData = {
            'NVDA': { base: 875, volatility: 0.03 },
            'TSLA': { base: 245, volatility: 0.04 },
            'AAPL': { base: 182, volatility: 0.015 },
            'AMD': { base: 165, volatility: 0.035 },
            'MSFT': { base: 415, volatility: 0.02 },
            'GOOGL': { base: 142, volatility: 0.025 },
            'META': { base: 485, volatility: 0.03 },
            'AMZN': { base: 178, volatility: 0.025 }
        };

        // Account profiles with realistic trading patterns
        // IDs MUST match DEMO_ACCOUNTS in demoAccounts.js
        const accountProfiles = {
            'CLIENT-DEMO-001': { // john_trader - Legitimate, moderate trader
                name: 'John Smith',
                tradeCount: 15,
                winRate: 0.58, // Slightly above average
                avgQuantity: [50, 150],
                favoriteStocks: ['AAPL', 'MSFT', 'NVDA'],
                riskProfile: 'MODERATE',
                tradingFrequency: 'DAILY'
            },
            'CLIENT-DEMO-002': { // hft_mike - High frequency trader
                name: 'Mike Johnson',
                tradeCount: 25,
                winRate: 0.52, // Around breakeven after fees
                avgQuantity: [200, 500],
                favoriteStocks: ['NVDA', 'AMD', 'TSLA'],
                riskProfile: 'AGGRESSIVE',
                tradingFrequency: 'HOURLY'
            },
            'CLIENT-DEMO-003': { // quick_cash - Suspicious, no-trade fraud
                name: 'Alex Quick',
                tradeCount: 3, // Very few trades - red flag
                winRate: 1.0, // 100% win rate - suspicious
                avgQuantity: [10, 20],
                favoriteStocks: ['AAPL'],
                riskProfile: 'SUSPICIOUS',
                tradingFrequency: 'RARE'
            },
            'CLIENT-DEMO-006': { // new_sarah - New user, learning
                name: 'Sarah Williams',
                tradeCount: 8,
                winRate: 0.45, // Learning, below average
                avgQuantity: [20, 80],
                favoriteStocks: ['AAPL', 'GOOGL', 'AMZN'],
                riskProfile: 'CONSERVATIVE',
                tradingFrequency: 'WEEKLY'
            },
            'BLACK-ACCOUNT-001': { // black_ops - Market manipulator
                name: '█████████',
                tradeCount: 12,
                winRate: 0.92, // Unrealistically high - fraud indicator
                avgQuantity: [300, 800],
                favoriteStocks: ['NVDA', 'AMD', 'TSLA'],
                riskProfile: 'CRITICAL',
                tradingFrequency: 'BURST', // Trades in rapid bursts
                isFraud: true
            }
        };

        const seededTrades = [];

        Object.entries(accountProfiles).forEach(([traderId, profile]) => {
            const tradeTimestamps = [];

            // Generate trade timestamps based on frequency
            for (let i = 0; i < profile.tradeCount; i++) {
                let offset;
                switch (profile.tradingFrequency) {
                    case 'HOURLY':
                        offset = now - (i * HOUR * (1 + Math.random()));
                        break;
                    case 'DAILY':
                        offset = now - (i * DAY * (0.5 + Math.random()));
                        break;
                    case 'WEEKLY':
                        offset = now - (i * DAY * (3 + Math.random() * 4));
                        break;
                    case 'RARE':
                        offset = now - (i * DAY * (10 + Math.random() * 20));
                        break;
                    case 'BURST':
                        // Clustered trades (manipulation pattern)
                        const burstGroup = Math.floor(i / 4);
                        offset = now - (burstGroup * DAY * 2) - (i % 4) * 1000 * 60 * 5; // 5 min apart in bursts
                        break;
                    default:
                        offset = now - (i * DAY);
                }
                tradeTimestamps.push(new Date(offset).toISOString());
            }

            // Determine wins based on win rate
            const numWins = Math.floor(profile.tradeCount * profile.winRate);
            const winIndices = new Set();
            while (winIndices.size < numWins) {
                winIndices.add(Math.floor(Math.random() * profile.tradeCount));
            }

            // Generate trades
            for (let i = 0; i < profile.tradeCount; i++) {
                const isWin = winIndices.has(i);
                const symbol = profile.favoriteStocks[Math.floor(Math.random() * profile.favoriteStocks.length)];
                const stock = stockData[symbol];

                // Price variation
                const priceVar = (Math.random() - 0.5) * 2 * stock.volatility;
                const entryPrice = stock.base * (1 + priceVar);
                const quantity = profile.avgQuantity[0] + Math.floor(Math.random() * (profile.avgQuantity[1] - profile.avgQuantity[0]));

                // Exit price based on win/loss
                const exitMultiplier = isWin
                    ? (1 + 0.01 + Math.random() * 0.04)  // 1-5% profit
                    : (1 - 0.005 - Math.random() * 0.03); // 0.5-3.5% loss
                const exitPrice = entryPrice * exitMultiplier;

                const pnl = (exitPrice - entryPrice) * quantity;
                const totalValue = entryPrice * quantity;

                // BUY trade
                const buyTrade = {
                    trade_id: `TRD-SEED-${traderId}-${i}-BUY`,
                    trader_id: traderId,
                    trader_name: profile.name,
                    symbol,
                    type: 'BUY',
                    quantity,
                    price: parseFloat(entryPrice.toFixed(2)),
                    total_value: parseFloat(totalValue.toFixed(2)),
                    device_id: profile.isFraud ? 'DEV-GHOST-001' : `DEV-${traderId.slice(-4)}`,
                    ip: profile.isFraud ? '0.0.0.0' : `192.168.1.${100 + Math.floor(Math.random() * 50)}`,
                    country: profile.isFraud ? 'XX' : 'US',
                    timestamp: tradeTimestamps[i],
                    isFraud: profile.isFraud ? 1 : 0,
                    fraud_type: profile.isFraud ? 'MARKET_MANIPULATION' : null,
                    immutable: true
                };

                // SELL trade (close position)
                const sellTimestamp = new Date(new Date(tradeTimestamps[i]).getTime() + HOUR * (1 + Math.random() * 23)).toISOString();
                const sellTrade = {
                    trade_id: `TRD-SEED-${traderId}-${i}-SELL`,
                    trader_id: traderId,
                    trader_name: profile.name,
                    symbol,
                    type: 'SELL',
                    quantity,
                    price: parseFloat(exitPrice.toFixed(2)),
                    total_value: parseFloat((exitPrice * quantity).toFixed(2)),
                    pnl: parseFloat(pnl.toFixed(2)),
                    entry_price: parseFloat(entryPrice.toFixed(2)),
                    device_id: buyTrade.device_id,
                    ip: buyTrade.ip,
                    country: buyTrade.country,
                    timestamp: sellTimestamp,
                    isFraud: profile.isFraud ? 1 : 0,
                    fraud_type: profile.isFraud ? 'MARKET_MANIPULATION' : null,
                    immutable: true
                };

                seededTrades.push(buyTrade, sellTrade);
            }
        });

        // Sort by timestamp (newest first)
        seededTrades.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        this.trades = seededTrades;
        this.save();
        console.log(`[TradeHistory] Seeded ${seededTrades.length} trades for ${Object.keys(accountProfiles).length} accounts`);
    },

    // Reset to initial seeded data (for demo purposes)
    reset() {
        this.seedInitialTrades();
    }
};

export default tradeHistory;
