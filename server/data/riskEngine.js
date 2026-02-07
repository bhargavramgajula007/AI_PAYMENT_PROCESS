// Enterprise ML-Based Risk Engine with Embeddings
// Handles new customers, speed vs accuracy, unknown patterns

import { fraudEmbeddings } from './fraudEmbeddings.js';
import { fraudPatterns } from './fraudPatterns.js';
import dotenv from 'dotenv';

dotenv.config();

export const riskEngine = {
    // Configuration - balance speed vs accuracy
    config: {
        // Auto-approval thresholds
        autoApproveThreshold: 0.20,      // Very low risk = instant approve
        autoBlockThreshold: 0.80,         // Very high risk = instant block
        highConfidenceThreshold: 0.15,    // For "High Confidence" approval

        // New customer handling
        newCustomerPenalty: 0.15,         // Extra risk for no history
        minTradesForConfidence: 5,        // Need at least 5 trades for full confidence

        // Pattern matching
        embeddingMatchThreshold: 0.65,    // Cosine similarity threshold
        anomalyDetectionEnabled: true     // Detect unknown patterns
    },

    // Model Memory - improves over time
    memory: {
        confirmedFrauds: [],
        confirmedLegitimate: [],
        feedbackCount: 0,
        decisions: { approved: 0, blocked: 0, reviewed: 0 },
        accuracy: { correct: 0, incorrect: 0, total: 0 },
        falsePositives: 0,
        falseNegatives: 0,

        addFeedback(data, adminDecision) {
            this.feedbackCount++;
            this.total++;

            const wasHighRisk = data.riskScore > 0.5;
            const adminBlocked = adminDecision === 'block';

            // Track accuracy
            if ((wasHighRisk && adminBlocked) || (!wasHighRisk && !adminBlocked)) {
                this.accuracy.correct++;
            } else {
                this.accuracy.incorrect++;
                if (wasHighRisk && !adminBlocked) this.falsePositives++;
                if (!wasHighRisk && adminBlocked) this.falseNegatives++;
            }
            this.accuracy.total++;

            if (adminDecision === 'block') {
                this.confirmedFrauds.push({
                    ...data,
                    confirmed_at: new Date().toISOString()
                });

                // Learn the pattern
                if (data.vector) {
                    console.log(`[RiskEngine] Learning new fraud pattern from ${data.trader_id}`);
                }
            } else {
                this.confirmedLegitimate.push({
                    ...data,
                    confirmed_at: new Date().toISOString()
                });
            }

            console.log(`[RiskEngine] Feedback: ${adminDecision.toUpperCase()} | Accuracy: ${this.getAccuracy()}`);
        },

        getAccuracy() {
            if (this.accuracy.total === 0) return 'Collecting data...';
            return ((this.accuracy.correct / this.accuracy.total) * 100).toFixed(1) + '%';
        },

        getModelStats() {
            return {
                confirmed_frauds: this.confirmedFrauds.length,
                confirmed_legitimate: this.confirmedLegitimate.length,
                feedback_count: this.feedbackCount,
                accuracy: this.getAccuracy(),
                accuracy_raw: this.accuracy.total > 0 ? this.accuracy.correct / this.accuracy.total : null,
                false_positives: this.falsePositives,
                false_negatives: this.falseNegatives,
                decisions: this.decisions
            };
        },

        recordDecision(decision) {
            if (decision === 'APPROVED') this.decisions.approved++;
            else if (decision === 'BLOCKED') this.decisions.blocked++;
            else this.decisions.reviewed++;
        }
    },

    // Assess individual trade
    assess(trade) {
        let score = 0;
        const reasons = [];

        // Basic signals
        if (trade.isFraud) { score += 0.5; reasons.push('FRAUD_FLAG'); }
        if (trade.is_new_device) { score += 0.15; reasons.push('NEW_DEVICE'); }
        if (trade.vpn_detected) { score += 0.12; reasons.push('VPN_DETECTED'); }
        if (trade.ring_id) { score += 0.35; reasons.push('RING_CONNECTION'); }
        if (trade.fraud_type) { score += 0.3; reasons.push(`TYPE:${trade.fraud_type}`); }

        // Velocity check
        if (trade.last_login_age > 60) { score += 0.25; reasons.push('DORMANT_ACCOUNT'); }

        // Country check
        if (['RU', 'NG', 'UA', 'XX'].includes(trade.country)) {
            score += 0.15; reasons.push('SUSPICIOUS_COUNTRY');
        }

        score = Math.min(1, score);
        return {
            score,
            riskLevel: score > 0.7 ? 'HIGH' : score > 0.3 ? 'MEDIUM' : 'LOW',
            reasons,
            decision: 'MONITOR',
            assessed_at: new Date().toISOString()
        };
    },

    // MAIN: Assess Payout Request with Full Intelligence
    async assessPayout(userTrades, userProfile, traderId) {
        let riskScore = 0;
        const flags = [];
        const signals = {
            behavioral: [],
            technical: [],
            pattern: [],
            velocity: []
        };

        const tradeCount = userTrades.length;
        const isNewCustomer = tradeCount < this.config.minTradesForConfidence;

        // ===== 1. NEW CUSTOMER HANDLING =====
        if (isNewCustomer) {
            riskScore += this.config.newCustomerPenalty;
            flags.push(`New customer with only ${tradeCount} trades`);
            signals.behavioral.push({
                signal: 'NEW_CUSTOMER',
                value: tradeCount,
                risk: 'MEDIUM',
                message: 'Insufficient behavioral history for high-confidence decision'
            });
        }

        // ===== 2. TRADING BEHAVIOR ANALYSIS =====
        const fraudTrades = userTrades.filter(t => t.isFraud || (t.risk && t.risk.score > 0.6));
        const fraudRatio = fraudTrades.length / Math.max(tradeCount, 1);

        if (fraudRatio > 0.3) {
            riskScore += 0.35;
            flags.push(`High suspicious trade ratio: ${(fraudRatio * 100).toFixed(0)}%`);
            signals.behavioral.push({
                signal: 'HIGH_FRAUD_RATIO',
                value: fraudRatio,
                risk: 'HIGH'
            });
        }

        // ===== 3. NO-TRADE FRAUD DETECTION =====
        const totalVolume = userTrades.reduce((s, t) => s + (t.total_value || 0), 0);
        const depositAmount = userProfile.deposit_amount || 50000; // Estimated
        const tradingRatio = totalVolume / (depositAmount * 2);

        if (tradeCount <= 2 && tradingRatio < 0.1) {
            riskScore += 0.6;
            flags.push('NO-TRADE FRAUD: Minimal trading activity after deposit');
            signals.pattern.push({
                pattern: 'NO_TRADE_FRAUD',
                confidence: 0.9,
                severity: 'CRITICAL',
                auto_action: 'BLOCK'
            });
        }

        // ===== 4. VELOCITY ABUSE DETECTION =====
        const recentTrades = userTrades.filter(t => {
            const tradeTime = new Date(t.timestamp).getTime();
            return Date.now() - tradeTime < 3600000; // Last hour
        });

        if (recentTrades.length > 20) {
            riskScore += 0.25;
            flags.push(`Velocity abuse: ${recentTrades.length} trades in last hour`);
            signals.velocity.push({
                signal: 'HIGH_VELOCITY',
                trades_per_hour: recentTrades.length,
                risk: 'HIGH'
            });
        }

        // ===== 5. TECHNICAL FRAUD SIGNALS =====
        const uniqueDevices = new Set(userTrades.map(t => t.device_id)).size;
        const uniqueIPs = new Set(userTrades.map(t => t.ip)).size;
        const uniqueCountries = new Set(userTrades.map(t => t.country)).size;

        if (uniqueDevices > 3) {
            riskScore += 0.2;
            flags.push(`Device fingerprint anomaly: ${uniqueDevices} devices`);
            signals.technical.push({
                signal: 'DEVICE_ANOMALY',
                value: uniqueDevices,
                risk: 'MEDIUM'
            });
        }

        if (uniqueCountries > 2) {
            riskScore += 0.25;
            flags.push(`Geographic impossibility: ${uniqueCountries} countries`);
            signals.technical.push({
                signal: 'GEO_IMPOSSIBILITY',
                value: uniqueCountries,
                risk: 'HIGH'
            });
        }

        if (userProfile.is_new_device) {
            riskScore += 0.2;
            flags.push('Payout from new device');
            signals.technical.push({
                signal: 'NEW_DEVICE',
                risk: 'MEDIUM'
            });
        }

        if (userProfile.vpn_detected) {
            riskScore += 0.15;
            flags.push('VPN detected');
            signals.technical.push({
                signal: 'VPN_DETECTED',
                risk: 'MEDIUM'
            });
        }

        // ===== 6. BEHAVIORAL PATTERN DETECTION =====
        const hasWashTrading = userTrades.some(t => t.fraud_type === 'WASH_TRADING');
        const hasPumpDump = userTrades.some(t => t.fraud_type === 'PUMP_AND_DUMP');
        const hasAccountTakeover = userTrades.some(t => t.fraud_type === 'ACCOUNT_TAKEOVER');
        const hasRingConnection = userTrades.some(t => t.ring_id);
        const hasMoneyLaundering = userTrades.some(t => t.fraud_type === 'MONEY_LAUNDERING');

        if (hasWashTrading) {
            riskScore += 0.5;
            flags.push('Wash trading pattern detected');
            signals.pattern.push({ pattern: 'WASH_TRADING', severity: 'CRITICAL' });
        }
        if (hasPumpDump) {
            riskScore += 0.45;
            flags.push('Pump and dump indicators');
            signals.pattern.push({ pattern: 'PUMP_AND_DUMP', severity: 'HIGH' });
        }
        if (hasAccountTakeover) {
            riskScore += 0.6;
            flags.push('Account takeover signals');
            signals.pattern.push({ pattern: 'ACCOUNT_TAKEOVER', severity: 'CRITICAL' });
        }
        if (hasRingConnection) {
            riskScore += 0.4;
            flags.push('Connected to fraud ring');
            signals.pattern.push({ pattern: 'RING_CONNECTION', severity: 'HIGH' });
        }
        if (hasMoneyLaundering) {
            riskScore += 0.55;
            flags.push('Money laundering pattern');
            signals.pattern.push({ pattern: 'MONEY_LAUNDERING', severity: 'CRITICAL' });
        }

        // ===== 7. EMBEDDING-BASED FRAUD DETECTION =====
        const embeddingMatches = fraudEmbeddings.findMatchingPatterns(
            userTrades,
            userProfile,
            this.config.embeddingMatchThreshold
        );

        if (embeddingMatches.length > 0) {
            const topMatch = embeddingMatches[0];
            riskScore += topMatch.similarity * 0.4;
            flags.push(`Pattern match: ${topMatch.pattern_name} (${(topMatch.similarity * 100).toFixed(0)}%)`);
            signals.pattern.push({
                pattern: topMatch.category,
                similarity: topMatch.similarity,
                severity: topMatch.severity,
                auto_action: topMatch.auto_action
            });
        }

        // ===== 8. UNKNOWN PATTERN DETECTION (Anomaly) =====
        if (this.config.anomalyDetectionEnabled) {
            const normalBaseline = fraudEmbeddings.getNormalBaseline();
            const anomalyResult = fraudEmbeddings.detectAnomaly(userTrades, userProfile, normalBaseline);

            if (anomalyResult.is_anomaly) {
                riskScore += anomalyResult.anomaly_score * 0.35;
                flags.push('Unknown fraud pattern detected (anomaly)');
                signals.pattern.push({
                    pattern: 'UNKNOWN_ANOMALY',
                    anomaly_score: anomalyResult.anomaly_score,
                    severity: 'HIGH',
                    message: anomalyResult.message
                });
            }
        }

        // ===== 9. SIMILARITY TO CONFIRMED FRAUDS =====
        const tradeVector = fraudEmbeddings.getTradeEmbedding(userTrades, userProfile);
        for (const confirmed of this.memory.confirmedFrauds.slice(-20)) {
            if (confirmed.vector) {
                const sim = this.cosineSimilarity(tradeVector, confirmed.vector);
                if (sim > 0.7) {
                    riskScore += 0.3;
                    flags.push('Similar to confirmed fraud case');
                    break;
                }
            }
        }

        // ===== 10. GRAPH COMPARISON FOR REPORT =====
        const graphComparison = fraudEmbeddings.getTopFraudComparisons(userTrades, userProfile);

        // Cap score
        riskScore = Math.min(1, riskScore);

        // ===== DECISION LOGIC (Speed vs Accuracy Balance) =====
        let decision;
        let confidence;
        let autoAction = null;

        // Check for critical patterns requiring auto-action
        const criticalPattern = signals.pattern.find(p => p.severity === 'CRITICAL');

        if (criticalPattern && riskScore >= this.config.autoBlockThreshold) {
            decision = 'BLOCKED';
            confidence = 'HIGH';
            autoAction = criticalPattern.auto_action || 'BLOCK_AND_NOTIFY';
        } else if (riskScore >= this.config.autoBlockThreshold) {
            decision = 'BLOCKED';
            confidence = 'HIGH';
            autoAction = 'FLAG_AND_MONITOR';
        } else if (riskScore <= this.config.autoApproveThreshold && !isNewCustomer) {
            decision = 'APPROVED';
            confidence = riskScore <= this.config.highConfidenceThreshold ? 'HIGH' : 'MEDIUM';
        } else if (riskScore <= this.config.autoApproveThreshold && isNewCustomer) {
            decision = 'MANUAL_REVIEW';
            confidence = 'LOW';
            flags.push('New customer - requires human verification');
        } else {
            decision = 'MANUAL_REVIEW';
            confidence = 'MEDIUM';
        }

        this.memory.recordDecision(decision);

        return {
            score: riskScore,
            decision,
            confidence,
            auto_action: autoAction,
            flags,
            signals,
            is_new_customer: isNewCustomer,
            embedding_matches: embeddingMatches.slice(0, 3),
            graph_comparison: graphComparison,
            vector: tradeVector,
            total_trades: tradeCount,
            suspicious_trades: fraudTrades.length,
            unique_devices: uniqueDevices,
            unique_ips: uniqueIPs,
            unique_countries: uniqueCountries,
            total_volume: totalVolume,
            model_stats: this.memory.getModelStats(),
            assessed_at: new Date().toISOString()
        };
    },

    cosineSimilarity(a, b) {
        if (!a || !b || a.length !== b.length) return 0;
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
    },

    // Aggregate features for learning
    aggregateTradeFeatures(trades) {
        return fraudEmbeddings.getTradeEmbedding(trades, {});
    }
};

export default riskEngine;
