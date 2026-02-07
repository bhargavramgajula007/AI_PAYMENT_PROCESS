import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { clientSimulator } from './data/clientSimulator.js';
import { riskEngine } from './data/riskEngine.js';
import { graphService } from './services/graphService.js';
import { genAIService } from './services/genai.js';
import { fraudPatterns } from './data/fraudPatterns.js';
import { fraudEmbeddings } from './data/fraudEmbeddings.js';
import DEMO_ACCOUNTS, { getDemoAccounts } from './data/demoAccounts.js';
import { tradeHistory } from './data/tradeHistory.js';
import { tradeAdvisor } from './services/tradeAdvisor.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// Health check for Railway
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Persistent trade storage + in-memory caches
let trades = []; // Reference to tradeHistory.trades
const payoutRequests = [];
const alerts = [];

// Load trades from persistent storage on startup
function initializeTradeHistory() {
    // Load from JSON file (or seed if first run)
    trades = tradeHistory.load();
    console.log(`[Server] Loaded ${trades.length} trades from persistent storage`);

    // Process for graph visualization
    trades.forEach(trade => {
        if (!trade.risk) {
            trade.risk = riskEngine.assess(trade);
        }
        graphService.processTransaction({
            nameOrig: trade.trader_id,
            nameDest: trade.symbol,
            amount: trade.total_value,
            type: trade.type,
            risk: trade.risk,
            timestamp: trade.timestamp
        });
    });
}

// ===== SIMULATION CONTROL =====
app.post('/api/simulation/start', (req, res) => {
    clientSimulator.start();
    res.json({ status: 'started', clients: clientSimulator.getStats() });
});

app.post('/api/simulation/stop', (req, res) => {
    clientSimulator.stop();
    res.json({ status: 'stopped' });
});

// ===== BLACK ACCOUNT CONTROL =====
let blackAccountActive = false;
let blackAccountInterval = null;

app.post('/api/black-account/toggle', (req, res) => {
    const { active } = req.body;
    blackAccountActive = active;

    if (active && !blackAccountInterval) {
        // Start automated fraud trading
        console.log('[BlackAccount] 🔴 ACTIVATED - Automated fraud trading started');
        blackAccountInterval = setInterval(() => {
            // Generate manipulative trades
            const symbols = ['NVDA', 'TSLA', 'AMD', 'AAPL'];
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            const prices = clientSimulator.getStockPrices();
            const price = prices[symbol] || 500;

            const trade = {
                trade_id: `TRD-BLACK-${Date.now()}`,
                trader_id: 'BLACK-ACCOUNT-001',
                trader_name: '█████████',
                symbol,
                type: Math.random() > 0.5 ? 'BUY' : 'SELL',
                quantity: Math.floor(Math.random() * 500) + 100,
                price: parseFloat((price * (0.98 + Math.random() * 0.04)).toFixed(2)),
                total_value: 0,
                device_id: 'DEV-GHOST-001',
                ip: '0.0.0.0',
                country: 'XX',
                timestamp: new Date().toISOString(),
                isFraud: 1,
                fraud_type: 'MARKET_MANIPULATION',
                ring_id: 'RING-BLACK-001',
                is_black_account: true
            };
            trade.total_value = parseFloat((trade.quantity * trade.price).toFixed(2));
            trade.risk = riskEngine.assess(trade);
            tradeHistory.addTrade(trade);

            graphService.processTransaction({
                nameOrig: trade.trader_id,
                nameDest: trade.symbol,
                device_id: trade.device_id,
                ip: trade.ip,
                amount: trade.total_value,
                type: trade.type,
                risk: trade.risk,
                timestamp: trade.timestamp
            });

            broadcastToClients({ type: 'trade', data: trade });
            console.log(`[BlackAccount] Trade: ${trade.type} ${trade.quantity} ${symbol} @ $${trade.price}`);
        }, 3000); // Trade every 3 seconds

        res.json({ status: 'activated', message: 'Black Account fraud trading started' });
    } else if (!active && blackAccountInterval) {
        clearInterval(blackAccountInterval);
        blackAccountInterval = null;
        console.log('[BlackAccount] ⚪ DEACTIVATED');
        res.json({ status: 'deactivated', message: 'Black Account trading stopped' });
    } else {
        res.json({ status: blackAccountActive ? 'active' : 'inactive' });
    }
});

app.get('/api/black-account/status', (req, res) => {
    const blackTrades = trades.filter(t => t.trader_id === 'BLACK-ACCOUNT-001');
    const totalVolume = blackTrades.reduce((sum, t) => sum + t.total_value, 0);

    res.json({
        active: blackAccountActive,
        trade_count: blackTrades.length,
        total_volume: totalVolume,
        profit: 21000 + (blackTrades.length * 500) // Fake profit calculation
    });
});

// ===== CLIENT PORTAL AUTHENTICATION =====
app.get('/api/client/accounts', (req, res) => {
    // Return enriched demo accounts info
    const accounts = Object.values(DEMO_ACCOUNTS).map(account => {
        const { password, ...safeAccount } = account;

        // Calculate stats from persistent trade history
        const accountTrades = tradeHistory.getTradesByTrader(account.id);
        const sellTrades = accountTrades.filter(t => t.type === 'SELL');
        const wins = sellTrades.filter(t => t.pnl && t.pnl > 0).length;
        const losses = sellTrades.filter(t => t.pnl && t.pnl <= 0).length;
        const totalVolume = accountTrades.reduce((sum, t) => sum + Math.abs(t.total_value || 0), 0);

        return {
            ...safeAccount,
            stats: {
                total_trades: accountTrades.length,
                wins,
                losses,
                win_rate: accountTrades.length > 0 ? (wins / accountTrades.length) : 0,
                avg_value: accountTrades.length > 0 ? (totalVolume / accountTrades.length) : 0,
                last_trades: accountTrades.slice(0, 10).map(t => ({
                    symbol: t.symbol,
                    type: t.type,
                    amount: t.total_value,
                    time: t.timestamp,
                    pnl: t.pnl || (t.type === 'SELL' ? t.total_value * 0.05 : 0) // Fake PnL if missing
                }))
            }
        };
    });

    res.json(accounts);
});

app.post('/api/client/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    const account = DEMO_ACCOUNTS[username];

    if (!account || account.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate simple token (in production use JWT)
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');

    // Return account info (without password)
    const { password: _, ...safeAccount } = account;

    // Add trade history to trades store for this demo account
    account.trade_history.forEach((trade, i) => {
        const existingTrade = trades.find(t => t.trade_id === `TRD-${account.id}-${i}`);
        if (!existingTrade) {
            const tradeDate = new Date();
            tradeDate.setDate(tradeDate.getDate() - (trade.days_ago || 0));

            const fullTrade = {
                trade_id: `TRD-${account.id}-${i}`,
                trader_id: account.id,
                trader_name: account.name,
                symbol: trade.symbol,
                type: trade.type,
                quantity: trade.quantity,
                price: trade.price,
                total_value: trade.total_value,
                device_id: trade.device_id || account.device_id,
                ip: account.ip,
                country: trade.country || account.country,
                isFraud: trade.isFraud || 0,
                ring_id: trade.ring_id,
                timestamp: tradeDate.toISOString()
            };
            fullTrade.risk = riskEngine.assess(fullTrade);
            tradeHistory.addTrade(fullTrade);
        }
    });

    res.json({
        success: true,
        token,
        account: safeAccount,
        message: `Welcome ${account.name}!`
    });
});

app.get('/api/client/account/:id', (req, res) => {
    const account = Object.values(DEMO_ACCOUNTS).find(a => a.id === req.params.id);

    if (!account) {
        return res.status(404).json({ error: 'Account not found' });
    }

    // Get trades for this account
    const accountTrades = trades.filter(t => t.trader_id === account.id);
    const accountPayouts = payoutRequests.filter(p => p.trader_id === account.id);

    const { password: _, ...safeAccount } = account;

    res.json({
        ...safeAccount,
        trades: accountTrades,
        payouts: accountPayouts
    });
});

// ===== TRADE ADVISOR - AI ANALYSIS =====
app.post('/api/trade/analyze', async (req, res) => {
    const { trade, traderId } = req.body;

    if (!trade) {
        return res.status(400).json({ error: 'Trade data required' });
    }

    try {
        // Get trader stats for context
        const traderTrades = tradeHistory.getTradesByTrader(traderId || trade.trader_id);
        const sellTrades = traderTrades.filter(t => t.type === 'SELL');
        const wins = sellTrades.filter(t => t.pnl && t.pnl > 0).length;

        const traderStats = {
            total_trades: traderTrades.length,
            win_rate: sellTrades.length > 0 ? wins / sellTrades.length : 0,
            common_mistakes: []
        };

        const analysis = await tradeAdvisor.analyzeTrade(trade, traderTrades, traderStats);
        const resources = tradeAdvisor.getEducationalResources(trade, analysis);

        res.json({
            success: true,
            analysis,
            resources
        });
    } catch (e) {
        console.error('[TradeAdvisor] Analysis failed:', e.message);
        res.status(500).json({ error: 'Analysis failed', message: e.message });
    }
});

// ===== TRADER BRAIN - EVOLUTION & INSIGHTS =====
app.get('/api/trader/brain/:traderId', async (req, res) => {
    const { traderId } = req.params;

    try {
        const traderTrades = tradeHistory.getTradesByTrader(traderId);

        if (traderTrades.length === 0) {
            return res.json({
                success: true,
                brain: {
                    timeline: [],
                    stats: { total_trades: 0, win_rate: 0 },
                    common_mistakes: [],
                    trader_level: { level: 1, title: 'Beginner', xp: 0, nextLevel: 100 }
                }
            });
        }

        const evolution = await tradeAdvisor.analyzeTraderEvolution(traderTrades, traderId);

        res.json({
            success: true,
            brain: evolution
        });
    } catch (e) {
        console.error('[TraderBrain] Evolution analysis failed:', e.message);
        res.status(500).json({ error: 'Brain analysis failed', message: e.message });
    }
});

// Get educational resources for a trade
app.post('/api/trade/resources', (req, res) => {
    const { trade, analysis } = req.body;

    if (!trade) {
        return res.status(400).json({ error: 'Trade data required' });
    }

    const fallbackAnalysis = analysis || { verdict: trade.pnl > 0 ? 'GOOD' : 'BAD' };
    const resources = tradeAdvisor.getEducationalResources(trade, fallbackAnalysis);

    res.json({
        success: true,
        resources
    });
});

// ===== MANUAL TRADE EXECUTION =====
app.post('/api/trade', async (req, res) => {
    const { trader_id, symbol, type, quantity, trader_name } = req.body;

    const prices = clientSimulator.getStockPrices();
    const price = prices[symbol] || 100;

    const trade = {
        trade_id: `TRD-MANUAL-${Date.now()}`,
        trader_id: trader_id || `USER-${Date.now()}`,
        trader_name: trader_name || 'Manual Trader',
        symbol: symbol || 'AAPL',
        type: type || 'BUY',
        quantity: parseInt(quantity) || 100,
        price: parseFloat(price.toFixed(2)),
        total_value: parseFloat((quantity * price).toFixed(2)),
        device_id: req.headers['x-device-id'] || 'BROWSER',
        ip: req.ip || '127.0.0.1',
        timestamp: new Date().toISOString(),
        isFraud: 0
    };

    trade.risk = riskEngine.assess(trade);
    tradeHistory.addTrade(trade);
    trades = tradeHistory.getAll(); // Keep reference updated

    broadcastToClients({ type: 'trade', data: trade });

    graphService.processTransaction({
        nameOrig: trade.trader_id,
        nameDest: trade.symbol,
        device_id: trade.device_id,
        ip: trade.ip,
        amount: trade.total_value,
        type: trade.type,
        risk: trade.risk,
        timestamp: trade.timestamp
    });

    res.json({
        status: 'EXECUTED',
        trade_id: trade.trade_id,
        risk: trade.risk,
        timestamp: trade.timestamp
    });
});

// ===== PAYOUT REQUESTS - THE REAL ENGINE =====
app.post('/api/payout', async (req, res) => {
    const { trader_id, amount, method, device_id, ip, country, is_new_device, vpn_detected, account_age_days, deposit_amount, trade_count } = req.body;

    // Get user's complete trade history from in-memory store
    const userTrades = trades.filter(t => t.trader_id === trader_id);

    // Build user profile
    const userProfile = {
        is_new_device: is_new_device || false,
        vpn_detected: vpn_detected || false,
        device_id: device_id || 'UNKNOWN',
        ip: ip || 'UNKNOWN',
        country: country || 'US',
        account_age_days: account_age_days || 30,
        deposit_amount: deposit_amount || amount * 1.2,
        kyc_verified: true
    };

    console.log(`\n[PayoutEngine] ========================================`);
    console.log(`[PayoutEngine] Processing: ${trader_id} | $${amount}`);
    console.log(`[PayoutEngine] Trade history: ${userTrades.length} trades`);

    // REAL ML-BASED RISK ASSESSMENT
    const riskAssessment = await riskEngine.assessPayout(userTrades, userProfile, trader_id);

    console.log(`[PayoutEngine] Risk Score: ${(riskAssessment.score * 100).toFixed(0)}%`);
    console.log(`[PayoutEngine] Decision: ${riskAssessment.decision} (${riskAssessment.confidence} confidence)`);
    if (riskAssessment.embedding_matches?.length > 0) {
        console.log(`[PayoutEngine] Pattern Match: ${riskAssessment.embedding_matches[0].pattern_name}`);
    }

    // REAL LLM DECISION - This is the real AI making the call
    const explanation = await genAIService.explainPayoutRisk(
        { trader_id, amount, method },
        riskAssessment,
        userTrades
    );

    // USE LLM DECISION - Extract from **APPROVE**/**DECLINE**/**MANUAL_REVIEW**
    const llmDecision = explanation.llm_decision || riskAssessment.decision;
    const finalStatus = llmDecision === 'APPROVED' ? 'APPROVED' :
        llmDecision === 'BLOCKED' ? 'BLOCKED' : 'PENDING_REVIEW';

    console.log(`[PayoutEngine] LLM Decision: ${llmDecision} (Final: ${finalStatus})`);

    const payout = {
        payout_id: `PAY-${Date.now()}`,
        trader_id,
        amount: parseFloat(amount),
        method: method || 'BANK_TRANSFER',
        status: finalStatus,
        risk_score: riskAssessment.score,
        confidence: riskAssessment.confidence,
        risk_flags: riskAssessment.flags,
        signals: riskAssessment.signals,
        algorithm_decision: riskAssessment.decision,
        llm_decision: llmDecision,
        auto_action: riskAssessment.auto_action,
        is_new_customer: riskAssessment.is_new_customer,
        embedding_matches: riskAssessment.embedding_matches,
        graph_comparison: riskAssessment.graph_comparison,
        vector: riskAssessment.vector,
        model_stats: riskAssessment.model_stats,
        ai_explanation: explanation,
        trade_count: userTrades.length,
        suspicious_trades: riskAssessment.suspicious_trades,
        unique_devices: riskAssessment.unique_devices,
        unique_ips: riskAssessment.unique_ips,
        total_volume: riskAssessment.total_volume,
        created_at: new Date().toISOString()
    };

    payoutRequests.unshift(payout);

    // Create alerts for non-approved
    if (payout.status !== 'APPROVED') {
        const severity = riskAssessment.score > 0.8 ? 'CRITICAL' :
            riskAssessment.score > 0.6 ? 'HIGH' : 'MEDIUM';
        const alert = {
            alert_id: `AL-${Date.now()}`,
            type: payout.status === 'BLOCKED' ? 'PAYOUT_BLOCKED' : 'PAYOUT_REVIEW',
            payout_id: payout.payout_id,
            trader_id,
            severity,
            message: `Payout $${amount} - ${payout.status} (${(riskAssessment.score * 100).toFixed(0)}% risk)`,
            flags: riskAssessment.flags.slice(0, 3),
            auto_action: riskAssessment.auto_action,
            created_at: new Date().toISOString()
        };
        alerts.unshift(alert);
        broadcastToClients({ type: 'alert', data: alert });
    }

    console.log(`[PayoutEngine] ========================================\n`);

    res.json(payout);
});

// ===== ADMIN FEEDBACK LOOP - MODEL LEARNING =====
app.post('/api/payout/:id/decision', async (req, res) => {
    const { decision, notes } = req.body;
    const payout = payoutRequests.find(p => p.payout_id === req.params.id);

    if (!payout) return res.status(404).json({ error: 'Payout not found' });

    const oldStatus = payout.status;
    payout.status = decision === 'APPROVE' ? 'APPROVED' : 'BLOCKED';
    payout.admin_notes = notes;
    payout.reviewed_at = new Date().toISOString();
    payout.admin_decision = decision;

    // Update model with feedback - THIS IS REAL LEARNING
    riskEngine.memory.addFeedback({
        trader_id: payout.trader_id,
        riskScore: payout.risk_score,
        flags: payout.risk_flags,
        vector: payout.vector,
        fraud_type: decision === 'BLOCK' ? 'ADMIN_CONFIRMED' : null,
        payout_id: payout.payout_id
    }, decision.toLowerCase());

    const stats = riskEngine.memory.getModelStats();

    console.log(`[ModelLearning] ========================================`);
    console.log(`[ModelLearning] Feedback: ${decision} for ${payout.trader_id}`);
    console.log(`[ModelLearning] Risk was: ${(payout.risk_score * 100).toFixed(0)}% | Engine said: ${payout.algorithm_decision}`);
    console.log(`[ModelLearning] Accuracy: ${stats.accuracy}`);
    console.log(`[ModelLearning] Confirmed Frauds: ${stats.confirmed_frauds} | Legitimate: ${stats.confirmed_legitimate}`);
    console.log(`[ModelLearning] ========================================\n`);

    res.json({
        payout,
        model_updated: true,
        model_stats: stats
    });
});

// ===== BULK ACTIONS =====
app.post('/api/payouts/bulk-action', (req, res) => {
    const { payout_ids, action, notes } = req.body;
    const results = [];

    for (const id of payout_ids) {
        const payout = payoutRequests.find(p => p.payout_id === id);
        if (payout) {
            payout.status = action === 'APPROVE' ? 'APPROVED' : 'BLOCKED';
            payout.admin_notes = notes || 'Bulk action';
            payout.reviewed_at = new Date().toISOString();

            riskEngine.memory.addFeedback({
                trader_id: payout.trader_id,
                riskScore: payout.risk_score,
                flags: payout.risk_flags,
                vector: payout.vector
            }, action.toLowerCase());

            results.push({ id, status: payout.status });
        }
    }

    res.json({ processed: results.length, results, model_stats: riskEngine.memory.getModelStats() });
});

// ===== DATA ENDPOINTS =====
app.get('/api/payouts', (req, res) => {
    const status = req.query.status;
    if (status) {
        res.json(payoutRequests.filter(p => p.status === status));
    } else {
        res.json(payoutRequests);
    }
});

app.get('/api/payouts/:id', (req, res) => {
    const payout = payoutRequests.find(p => p.payout_id === req.params.id);
    if (!payout) return res.status(404).json({ error: 'Not found' });

    const history = trades.filter(t => t.trader_id === payout.trader_id);

    // Get normal baseline for comparison
    const normalTrades = trades.filter(t => {
        const client = clientSimulator.getClient(t.trader_id);
        return client && client.type === 'LEGITIMATE';
    }).slice(0, 50);

    const graphComparison = fraudEmbeddings.compareGraphs(history, normalTrades);

    res.json({ ...payout, history, graph_comparison: graphComparison });
});

app.get('/api/trades', (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    const trader_id = req.query.trader_id;

    if (trader_id) {
        res.json(trades.filter(t => t.trader_id === trader_id).slice(0, limit));
    } else {
        res.json(trades.slice(0, limit));
    }
});

app.get('/api/stats', (req, res) => {
    const simStats = clientSimulator.getStats();
    const modelStats = riskEngine.memory.getModelStats();

    res.json({
        simulation: simStats,
        model: {
            ...modelStats,
            total_patterns: fraudPatterns.patterns.length,
            embedding_patterns: Object.keys(fraudEmbeddings.patterns).length
        },
        payouts: {
            total: payoutRequests.length,
            pending: payoutRequests.filter(p => p.status === 'PENDING_REVIEW').length,
            blocked: payoutRequests.filter(p => p.status === 'BLOCKED').length,
            approved: payoutRequests.filter(p => p.status === 'APPROVED').length
        },
        alerts: alerts.length,
        trades: trades.length
    });
});

app.get('/api/stocks', (req, res) => res.json(clientSimulator.getStockPrices()));
app.get('/api/alerts', (req, res) => res.json(alerts));
app.get('/api/clients', (req, res) => res.json(clientSimulator.getClients()));
app.get('/api/model/stats', (req, res) => res.json(riskEngine.memory.getModelStats()));
app.get('/api/patterns', (req, res) => res.json(fraudPatterns.patterns));
app.get('/api/embeddings', (req, res) => res.json(Object.values(fraudEmbeddings.patterns)));

// Graph comparison endpoint for reports
app.get('/api/graph-comparison/:trader_id', (req, res) => {
    const traderTrades = trades.filter(t => t.trader_id === req.params.trader_id);
    const normalTrades = trades.filter(t => {
        const client = clientSimulator.getClient(t.trader_id);
        return client && (client.type === 'LEGITIMATE' || client.type === 'HIGH_FREQUENCY');
    }).slice(0, 100);

    const comparison = fraudEmbeddings.compareGraphs(traderTrades, normalTrades);
    const topFraudMatches = fraudEmbeddings.getTopFraudComparisons(traderTrades, {});

    res.json({
        trader_id: req.params.trader_id,
        trade_count: traderTrades.length,
        comparison,
        fraud_pattern_matches: topFraudMatches
    });
});

// ===== GRAPH NETWORK ENDPOINTS =====
app.get('/api/graph', (req, res) => {
    const minRisk = parseFloat(req.query.minRisk) || 0;

    // Build nodes from clients
    const nodes = clientSimulator.getClients().map(client => ({
        id: client.id,
        name: client.name,
        type: client.type,
        risk: client.risk_profile === 'CRITICAL' ? 0.9 : client.risk_profile === 'HIGH' ? 0.7 : 0.2,
        country: client.country,
        trade_count: client.trade_count,
        balance: client.balance
    }));

    // Build edges from trades - connections between traders and stocks OR between traders in same ring
    const edgeMap = new Map();

    trades.forEach(trade => {
        // Trader to stock edge
        const key = `${trade.trader_id}-${trade.symbol}`;
        if (!edgeMap.has(key)) {
            edgeMap.set(key, {
                source: trade.trader_id,
                target: trade.symbol,
                weight: 0,
                transactions: []
            });
        }
        const edge = edgeMap.get(key);
        edge.weight += trade.total_value;
        edge.transactions.push({
            trade_id: trade.trade_id,
            amount: trade.total_value,
            risk: trade.risk?.score || 0
        });
    });

    // Add stock nodes
    const stockNodes = Object.keys(clientSimulator.getStockPrices()).map(symbol => ({
        id: symbol,
        name: symbol,
        type: 'STOCK',
        risk: 0
    }));

    // Filter by minRisk
    const filteredNodes = [...nodes, ...stockNodes].filter(n => n.type === 'STOCK' || n.risk >= minRisk);
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = Array.from(edgeMap.values()).filter(e =>
        nodeIds.has(e.source) && nodeIds.has(e.target)
    );

    res.json({
        nodes: filteredNodes,
        edges: filteredEdges,
        stats: graphService.getStats()
    });
});

app.get('/api/rings', (req, res) => {
    // Detect fraud rings based on shared devices, IPs, and trading patterns
    const clients = clientSimulator.getClients();
    const rings = [];
    const processedIds = new Set();

    // Group by ring_id from simulation
    const ringGroups = {};
    clients.forEach(client => {
        if (client.ring_id && !processedIds.has(client.id)) {
            if (!ringGroups[client.ring_id]) {
                ringGroups[client.ring_id] = [];
            }
            ringGroups[client.ring_id].push(client);
            processedIds.add(client.id);
        }
    });

    // Create ring objects
    Object.entries(ringGroups).forEach(([ringId, members]) => {
        const memberIds = members.map(m => m.id);
        const totalBalance = members.reduce((s, m) => s + m.balance, 0);
        const avgRisk = members.reduce((s, m) =>
            s + (m.risk_profile === 'CRITICAL' ? 0.9 : m.risk_profile === 'HIGH' ? 0.7 : 0.3), 0
        ) / members.length;

        rings.push({
            ring_id: ringId,
            members: memberIds,
            member_count: members.length,
            total_balance: totalBalance,
            avg_risk: avgRisk,
            fraud_type: members[0]?.fraud_type || 'UNKNOWN',
            detected_at: new Date().toISOString()
        });
    });

    // Also detect potential rings from shared devices
    const deviceGroups = {};
    clients.forEach(client => {
        if (!processedIds.has(client.id) && client.risk_profile !== 'LOW') {
            // Group suspicious clients by similar characteristics
            const key = `DEV-${client.type}`;
            if (!deviceGroups[key]) deviceGroups[key] = [];
            deviceGroups[key].push(client);
        }
    });

    Object.entries(deviceGroups).forEach(([key, members]) => {
        if (members.length >= 2) {
            rings.push({
                ring_id: `SUSPECTED-${key}`,
                members: members.map(m => m.id),
                member_count: members.length,
                total_balance: members.reduce((s, m) => s + m.balance, 0),
                avg_risk: 0.6,
                fraud_type: 'SUSPECTED_RING',
                detected_at: new Date().toISOString()
            });
        }
    });

    res.json(rings);
});

// ===== COPILOT AI CHAT ENDPOINT =====
app.post('/api/copilot/query', async (req, res) => {
    const { query, context } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        const model = genAIService.getModel();

        // Get current stats for context
        const stats = {
            payouts: {
                total: payoutRequests.length,
                pending: payoutRequests.filter(p => p.status === 'PENDING_REVIEW').length,
                blocked: payoutRequests.filter(p => p.status === 'BLOCKED').length,
                approved: payoutRequests.filter(p => p.status === 'APPROVED').length
            },
            trades: trades.length,
            clients: clientSimulator.getStats().total_clients,
            alerts: alerts.length,
            model_accuracy: riskEngine.memory.getAccuracy()
        };

        if (model) {
            const prompt = `You are an AI fraud analyst assistant for a trading platform's fraud detection system.

## Current System Stats
- Total Payouts: ${stats.payouts.total} (Pending: ${stats.payouts.pending}, Blocked: ${stats.payouts.blocked}, Approved: ${stats.payouts.approved})
- Total Trades Monitored: ${stats.trades}
- Active Clients: ${stats.clients}
- Active Alerts: ${stats.alerts}
- Model Accuracy: ${stats.model_accuracy}

## Recent Payouts
${payoutRequests.slice(0, 5).map(p => `- ${p.trader_id}: $${p.amount} (${p.status}, Risk: ${(p.risk_score * 100).toFixed(0)}%)`).join('\n')}

## User Question
${query}

Provide a helpful, concise response. If the user asks about specific traders or payouts, provide relevant insights. Format your response in markdown.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;

            res.json({
                response: response.text(),
                stats,
                generated_by: 'gemini-1.5-flash'
            });
        } else {
            // Fallback response
            res.json({
                response: `## System Overview

Based on current data:
- **${stats.payouts.pending}** payouts awaiting review
- **${stats.payouts.blocked}** blocked for fraud concerns
- **${stats.payouts.approved}** approved successfully
- Model accuracy: **${stats.model_accuracy}**

How can I help you with fraud investigation?`,
                stats,
                generated_by: 'fallback'
            });
        }
    } catch (err) {
        console.error('[Copilot] Error:', err.message);
        res.json({
            response: 'I encountered an error processing your request. Please try again.',
            error: err.message
        });
    }
});

// ===== SSE STREAM =====
const sseClients = new Set();
let stopSimulationTimeout = null;

app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
    sseClients.add(sendEvent);

    // Start simulation if this is the first client
    if (sseClients.size === 1) {
        if (stopSimulationTimeout) {
            clearTimeout(stopSimulationTimeout);
            stopSimulationTimeout = null;
        }
        if (!clientSimulator.isRunning) {
            console.log('[Server] Client connected - Starting simulation');
            clientSimulator.start();
        }
    }

    req.on('close', () => {
        sseClients.delete(sendEvent);

        // Stop simulation if no clients left (with delay)
        if (sseClients.size === 0) {
            stopSimulationTimeout = setTimeout(() => {
                if (sseClients.size === 0 && clientSimulator.isRunning) {
                    console.log('[Server] No active clients - Stopping simulation to save resources');
                    clientSimulator.stop();
                }
            }, 5000); // 5 second grace period for refreshes
        }
    });
});

function broadcastToClients(msg) {
    sseClients.forEach(send => {
        try { send(msg); } catch (e) { }
    });
}

// ===== GLOBAL EVENT HANDLERS =====
clientSimulator.on('trade', (trade) => {
    trade.risk = riskEngine.assess(trade);
    tradeHistory.addTrade(trade);
    trades = tradeHistory.getAll(); // Keep reference updated

    graphService.processTransaction({
        nameOrig: trade.trader_id,
        nameDest: trade.symbol,
        amount: trade.total_value,
        type: trade.type,
        risk: trade.risk,
        timestamp: trade.timestamp
    });

    broadcastToClients({ type: 'trade', data: trade });
});

// Process automatic payout requests - REAL ENGINE
clientSimulator.on('payout_request', async (request) => {
    const userTrades = trades.filter(t => t.trader_id === request.trader_id);

    const userProfile = {
        is_new_device: request.is_new_device,
        vpn_detected: request.vpn_detected,
        device_id: request.device_id,
        ip: request.ip,
        country: request.country,
        account_age_days: request.account_age_days,
        deposit_amount: request.deposit_amount
    };

    // REAL ML ASSESSMENT
    const riskAssessment = await riskEngine.assessPayout(userTrades, userProfile, request.trader_id);

    // REAL AI EXPLANATION & LLM DECISION
    const explanation = await genAIService.explainPayoutRisk(
        { trader_id: request.trader_id, amount: request.amount, method: request.method },
        riskAssessment,
        userTrades
    );

    // USE LLM DECISION - Extract from **APPROVE**/**DECLINE**/**MANUAL_REVIEW**
    const llmDecision = explanation.llm_decision || riskAssessment.decision;
    const status = llmDecision === 'APPROVED' ? 'APPROVED' :
        llmDecision === 'BLOCKED' ? 'BLOCKED' : 'PENDING_REVIEW';

    const payout = {
        payout_id: `PAY-AUTO-${Date.now()}`,
        trader_id: request.trader_id,
        trader_name: request.trader_name,
        amount: request.amount,
        method: request.method,
        status,
        risk_score: riskAssessment.score,
        confidence: riskAssessment.confidence,
        risk_flags: riskAssessment.flags,
        signals: riskAssessment.signals,
        algorithm_decision: riskAssessment.decision,
        llm_decision: llmDecision,
        is_new_customer: riskAssessment.is_new_customer,
        embedding_matches: riskAssessment.embedding_matches,
        graph_comparison: riskAssessment.graph_comparison,
        vector: riskAssessment.vector,
        ai_explanation: explanation,
        fraud_type: request.fraud_type,
        client_type: request.client_type,
        auto_generated: true,
        trade_count: userTrades.length,
        created_at: new Date().toISOString()
    };

    payoutRequests.unshift(payout);

    // Alert for non-approved
    if (status !== 'APPROVED') {
        const alert = {
            alert_id: `AL-AUTO-${Date.now()}`,
            type: status === 'BLOCKED' ? 'FRAUD_BLOCKED' : 'PAYOUT_REVIEW',
            payout_id: payout.payout_id,
            trader_id: request.trader_id,
            severity: riskAssessment.score > 0.7 ? 'HIGH' : 'MEDIUM',
            message: `Auto-Payout $${request.amount.toLocaleString()} - ${status} (Risk: ${(riskAssessment.score * 100).toFixed(0)}%)`,
            pattern: riskAssessment.embedding_matches?.[0]?.pattern_name || null,
            created_at: new Date().toISOString()
        };
        alerts.unshift(alert);
        broadcastToClients({ type: 'alert', data: alert });
    }

    broadcastToClients({ type: 'payout', data: payout });

    console.log(`[AutoPayout] ${request.trader_id} -> ${status} | Risk: ${(riskAssessment.score * 100).toFixed(0)}% | Pattern: ${riskAssessment.embedding_matches?.[0]?.pattern_name || 'None'}`);
});

// SPA catch-all route (must be last)
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`\n╔════════════════════════════════════════════════════════╗`);
    console.log(`║     ENTERPRISE FRAUD DETECTION ENGINE v2.0             ║`);
    console.log(`║     ML-Powered with Embeddings & Pattern Matching      ║`);
    console.log(`╠════════════════════════════════════════════════════════╣`);
    console.log(`║  Port: ${PORT}                                            ║`);
    console.log(`║  GenAI: ${process.env.GEMINI_API_KEY ? 'ENABLED ✓' : 'DISABLED (fallback mode)'}                       ║`);
    console.log(`╚════════════════════════════════════════════════════════╝\n`);

    // Initialize trade history
    initializeTradeHistory();

    console.log(`\n[Engine] Fraud patterns loaded: ${fraudPatterns.patterns.length}`);
    console.log(`[Engine] Embedding patterns: ${Object.keys(fraudEmbeddings.patterns).length}`);
    console.log(`[Engine] Ready for ML-based fraud detection\n`);
});
