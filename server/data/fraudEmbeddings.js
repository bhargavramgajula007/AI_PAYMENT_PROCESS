// Enterprise Fraud Embeddings & Pattern Database
// Uses vector similarity and graph-based fraud detection

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Known fraud pattern embeddings (pre-computed feature vectors)
const FRAUD_EMBEDDINGS = {
    // NO TRADE FRAUD: Deposit → Minimal/No trading → Immediate withdrawal
    'NO_TRADE_FRAUD': {
        id: 'EMB_NO_TRADE',
        name: 'No Trade Fraud',
        description: 'Deposit with minimal trading activity followed by withdrawal attempt',
        vector: [0.95, 0.1, 0.05, 0.9, 0.8, 0.2, 0.1, 0.9, 0.85, 0.15, 0.1, 0.95],
        features: {
            trade_ratio: 0.05,      // Very low trading vs deposit
            withdrawal_speed: 0.95, // Fast withdrawal request
            trade_duration: 0.1,    // Very short trade hold time
            profit_taking: 0.9,     // Withdrawal near deposit amount
            account_age: 0.2,       // New account
            device_trust: 0.3       // Low device trust
        },
        severity: 'CRITICAL',
        auto_action: 'BLOCK_AND_NOTIFY'
    },

    // SHORT TRADE ABUSE
    'SHORT_TRADE_ABUSE': {
        id: 'EMB_SHORT_TRADE',
        name: 'Short Trade Abuse',
        description: 'Minimal trade activity with immediate close and withdrawal',
        vector: [0.8, 0.25, 0.15, 0.85, 0.7, 0.3, 0.2, 0.8, 0.75, 0.25, 0.2, 0.85],
        features: {
            avg_trade_duration: 0.1,  // Trades closed very quickly
            trade_count: 0.2,         // Few trades
            withdrawal_after_profit: 0.9,
            account_age: 0.3
        },
        severity: 'HIGH',
        auto_action: 'FLAG_AND_MONITOR'
    },

    // VELOCITY ABUSE
    'VELOCITY_ABUSE': {
        id: 'EMB_VELOCITY',
        name: 'Velocity Abuse',
        description: 'Unusual number of transactions in short time period',
        vector: [0.6, 0.9, 0.85, 0.4, 0.7, 0.5, 0.8, 0.6, 0.65, 0.7, 0.75, 0.55],
        features: {
            transactions_per_hour: 0.95,
            unique_instruments: 0.8,
            amount_variance: 0.7,
            time_clustering: 0.9
        },
        severity: 'HIGH',
        auto_action: 'FLAG_AND_MONITOR'
    },

    // GEOGRAPHIC IMPOSSIBILITY
    'GEO_IMPOSSIBILITY': {
        id: 'EMB_GEO_FRAUD',
        name: 'Geographic Impossibility',
        description: 'Login/trades from physically impossible locations in timeframe',
        vector: [0.3, 0.4, 0.2, 0.3, 0.95, 0.9, 0.85, 0.3, 0.35, 0.9, 0.85, 0.4],
        features: {
            location_jump: 0.95,    // Distance between logins
            time_between: 0.1,      // Very short time
            vpn_detected: 0.9,
            device_change: 0.85
        },
        severity: 'CRITICAL',
        auto_action: 'LOCK_ACCOUNT'
    },

    // WASH TRADING
    'WASH_TRADING': {
        id: 'EMB_WASH',
        name: 'Wash Trading Ring',
        description: 'Circular trades between connected accounts',
        vector: [0.7, 0.6, 0.9, 0.5, 0.4, 0.3, 0.85, 0.7, 0.75, 0.4, 0.9, 0.65],
        features: {
            circular_flow: 0.95,
            same_device_trading: 0.9,
            matched_amounts: 0.85,
            time_correlation: 0.8
        },
        severity: 'CRITICAL',
        auto_action: 'BLOCK_AND_NOTIFY'
    },

    // ACCOUNT TAKEOVER
    'ACCOUNT_TAKEOVER': {
        id: 'EMB_ATO',
        name: 'Account Takeover',
        description: 'Unauthorized access with behavior change',
        vector: [0.4, 0.3, 0.25, 0.85, 0.9, 0.95, 0.7, 0.75, 0.6, 0.85, 0.7, 0.8],
        features: {
            new_device: 1.0,
            new_location: 0.95,
            behavior_deviation: 0.9,
            rapid_withdrawal: 0.85,
            dormant_reactivation: 0.7
        },
        severity: 'CRITICAL',
        auto_action: 'LOCK_ACCOUNT'
    },

    // PUMP AND DUMP
    'PUMP_AND_DUMP': {
        id: 'EMB_PUMP',
        name: 'Pump and Dump',
        description: 'Coordinated buying followed by large sell-off',
        vector: [0.75, 0.7, 0.6, 0.4, 0.3, 0.25, 0.65, 0.8, 0.85, 0.35, 0.7, 0.7],
        features: {
            buy_concentration: 0.9,
            sell_at_peak: 0.85,
            volume_anomaly: 0.8,
            price_movement: 0.75
        },
        severity: 'HIGH',
        auto_action: 'FLAG_AND_MONITOR'
    },

    // MONEY LAUNDERING
    'MONEY_LAUNDERING': {
        id: 'EMB_ML',
        name: 'Money Laundering Pattern',
        description: 'Structuring deposits and rapid withdrawal',
        vector: [0.85, 0.2, 0.1, 0.9, 0.6, 0.5, 0.3, 0.9, 0.8, 0.5, 0.25, 0.9],
        features: {
            structured_deposits: 0.95,
            minimal_trading: 0.1,
            layered_transfers: 0.8,
            immediate_withdrawal: 0.9
        },
        severity: 'CRITICAL',
        auto_action: 'LOCK_ACCOUNT'
    },

    // CARD TESTING
    'CARD_TESTING': {
        id: 'EMB_CARD_TEST',
        name: 'Card Testing',
        description: 'Multiple small deposits to test card validity',
        vector: [0.6, 0.85, 0.9, 0.3, 0.4, 0.35, 0.8, 0.5, 0.55, 0.45, 0.85, 0.45],
        features: {
            small_deposit_count: 0.95,
            different_cards: 0.8,
            deposit_failures: 0.7,
            time_clustering: 0.85
        },
        severity: 'HIGH',
        auto_action: 'FLAG_AND_MONITOR'
    }
};

// Normalize trade history to embedding vector
function tradeHistoryToVector(trades, profile) {
    const n = trades.length || 1;
    const totalValue = trades.reduce((s, t) => s + (t.total_value || 0), 0);
    const buyCount = trades.filter(t => t.type === 'BUY').length;
    const sellCount = trades.filter(t => t.type === 'SELL').length;
    const suspiciousTrades = trades.filter(t => t.isFraud || (t.risk && t.risk.score > 0.6)).length;
    const uniqueDevices = new Set(trades.map(t => t.device_id)).size;
    const uniqueIPs = new Set(trades.map(t => t.ip)).size;
    const uniqueCountries = new Set(trades.map(t => t.country)).size;

    // Time analysis
    const tradeTimestamps = trades.map(t => new Date(t.timestamp).getTime()).sort();
    const avgTimeBetween = tradeTimestamps.length > 1
        ? (tradeTimestamps[tradeTimestamps.length - 1] - tradeTimestamps[0]) / n
        : 86400000; // Default 1 day

    // Calculate velocity (trades per hour)
    const timeSpan = tradeTimestamps.length > 1
        ? (tradeTimestamps[tradeTimestamps.length - 1] - tradeTimestamps[0]) / 3600000
        : 24;
    const velocity = Math.min(1, n / Math.max(timeSpan, 1) / 10);

    // Normalize features to 0-1 range
    return [
        Math.min(1, n / 100),                          // Trade count normalized
        velocity,                                       // Transaction velocity
        Math.min(1, uniqueDevices / 5),                // Device switching
        Math.min(1, suspiciousTrades / Math.max(n, 1)), // Fraud ratio
        profile.is_new_device ? 1 : 0,                  // New device flag
        profile.vpn_detected ? 1 : 0,                   // VPN usage
        Math.min(1, uniqueIPs / 10),                    // IP switching
        1 - Math.min(1, (profile.account_age_days || 0) / 365), // Account newness
        sellCount > buyCount * 2 ? 0.9 : sellCount / Math.max(buyCount, 1) / 2, // Sell pressure
        Math.min(1, uniqueCountries / 5),               // Country switching
        Math.min(1, totalValue / 500000),               // Total volume normalized
        Math.min(1, avgTimeBetween / 60000)             // Time between trades (quick = suspicious)
    ];
}

// Cosine similarity between two vectors
function cosineSimilarity(a, b) {
    if (a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Euclidean distance (for anomaly detection)
function euclideanDistance(a, b) {
    if (a.length !== b.length) return Infinity;
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += (a[i] - b[i]) ** 2;
    }
    return Math.sqrt(sum);
}

export const fraudEmbeddings = {
    patterns: FRAUD_EMBEDDINGS,

    // Get embedding for trade history
    getTradeEmbedding(trades, profile) {
        return tradeHistoryToVector(trades, profile);
    },

    // Find matching fraud patterns using cosine similarity
    findMatchingPatterns(trades, profile, threshold = 0.65) {
        const tradeVector = this.getTradeEmbedding(trades, profile);
        const matches = [];

        for (const [key, pattern] of Object.entries(FRAUD_EMBEDDINGS)) {
            const similarity = cosineSimilarity(tradeVector, pattern.vector);
            if (similarity >= threshold) {
                matches.push({
                    pattern_id: pattern.id,
                    pattern_name: pattern.name,
                    category: key,
                    similarity: similarity,
                    severity: pattern.severity,
                    description: pattern.description,
                    auto_action: pattern.auto_action,
                    matched_features: this.getMatchedFeatures(tradeVector, pattern)
                });
            }
        }

        return matches.sort((a, b) => b.similarity - a.similarity);
    },

    // Identify which features matched
    getMatchedFeatures(tradeVector, pattern) {
        const featureNames = [
            'trade_count', 'velocity', 'device_switching', 'fraud_ratio',
            'new_device', 'vpn_usage', 'ip_switching', 'account_newness',
            'sell_pressure', 'country_switching', 'volume', 'trade_speed'
        ];

        const matched = [];
        for (let i = 0; i < tradeVector.length; i++) {
            if (Math.abs(tradeVector[i] - pattern.vector[i]) < 0.3 && tradeVector[i] > 0.5) {
                matched.push(featureNames[i]);
            }
        }
        return matched;
    },

    // Detect unknown patterns (anomaly detection)
    detectAnomaly(trades, profile, normalBaseline) {
        const tradeVector = this.getTradeEmbedding(trades, profile);

        // Compare to normal baseline
        const distanceFromNormal = euclideanDistance(tradeVector, normalBaseline);

        // If very different from normal AND doesn't match known patterns
        const knownMatches = this.findMatchingPatterns(trades, profile, 0.6);

        if (distanceFromNormal > 1.5 && knownMatches.length === 0) {
            return {
                is_anomaly: true,
                anomaly_score: Math.min(1, distanceFromNormal / 3),
                message: 'Unknown fraud pattern - does not match known typologies',
                vector: tradeVector
            };
        }

        return { is_anomaly: false, anomaly_score: 0 };
    },

    // Get normal baseline (average of legitimate traders)
    getNormalBaseline() {
        return [0.3, 0.2, 0.1, 0.05, 0.1, 0.1, 0.15, 0.4, 0.4, 0.05, 0.3, 0.6];
    },

    // Compare two trade graphs visually
    compareGraphs(suspectTrades, normalTrades) {
        const suspectVector = this.getTradeEmbedding(suspectTrades, {});
        const normalVector = this.getTradeEmbedding(normalTrades, {});

        const featureNames = [
            'Trade Count', 'Velocity', 'Device Changes', 'Fraud Ratio',
            'New Device', 'VPN', 'IP Changes', 'Account Age',
            'Sell Pressure', 'Countries', 'Volume', 'Speed'
        ];

        const comparison = featureNames.map((name, i) => ({
            feature: name,
            suspect: suspectVector[i],
            normal: normalVector[i],
            deviation: Math.abs(suspectVector[i] - normalVector[i]),
            is_anomalous: Math.abs(suspectVector[i] - normalVector[i]) > 0.4
        }));

        return {
            suspect_vector: suspectVector,
            normal_vector: normalVector,
            overall_similarity: cosineSimilarity(suspectVector, normalVector),
            feature_comparison: comparison,
            anomalous_features: comparison.filter(c => c.is_anomalous)
        };
    },

    // Get top fraud pattern matches for report
    getTopFraudComparisons(trades, profile) {
        const tradeVector = this.getTradeEmbedding(trades, profile);
        const comparisons = [];

        for (const [key, pattern] of Object.entries(FRAUD_EMBEDDINGS)) {
            comparisons.push({
                pattern: pattern.name,
                category: key,
                similarity: cosineSimilarity(tradeVector, pattern.vector),
                severity: pattern.severity
            });
        }

        return comparisons.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
    }
};

export default fraudEmbeddings;
