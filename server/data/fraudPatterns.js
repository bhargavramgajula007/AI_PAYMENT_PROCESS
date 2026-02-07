// Fraud Pattern Database - Based on real trading fraud research
// Contains known fraud patterns and their feature vectors for similarity matching

export const fraudPatterns = {
    // Known fraud signature patterns
    patterns: [
        // WASH TRADING - Trading with self through multiple accounts
        {
            id: 'WASH_001',
            name: 'Wash Trading - Same Device',
            category: 'WASH_TRADING',
            features: {
                same_device_counterparty: 1.0,
                time_between_trades: 0.1,  // Very short
                price_deviation: 0.02,     // Nearly same price
                volume_spike: 0.8,
                new_account_age: 0.3,
                vpn_usage: 0.7,
                unusual_hours: 0.5
            },
            severity: 'CRITICAL',
            description: 'Multiple accounts on same device executing offsetting trades'
        },
        {
            id: 'WASH_002',
            name: 'Wash Trading - IP Cluster',
            category: 'WASH_TRADING',
            features: {
                same_ip_cluster: 1.0,
                circular_transactions: 0.9,
                matched_order_sizes: 0.95,
                time_synchronization: 0.8,
                new_account_age: 0.4,
                vpn_usage: 0.6
            },
            severity: 'CRITICAL',
            description: 'Different accounts from same IP range with circular trading'
        },

        // PUMP AND DUMP - Artificially inflate then sell
        {
            id: 'PUMP_001',
            name: 'Pump and Dump - Classic',
            category: 'PUMP_AND_DUMP',
            features: {
                price_spike: 0.9,
                volume_spike_before_sell: 0.85,
                sell_at_peak: 0.95,
                social_media_mentions: 0.7,
                new_account_age: 0.5,
                concentrated_holdings: 0.8
            },
            severity: 'HIGH',
            description: 'Coordinated buying to inflate price followed by dump'
        },
        {
            id: 'PUMP_002',
            name: 'Pump and Dump - Dormant Account',
            category: 'PUMP_AND_DUMP',
            features: {
                dormant_account_reactivation: 1.0,
                sudden_large_sell: 0.9,
                price_at_local_high: 0.8,
                new_device_on_old_account: 0.95,
                location_change: 0.7
            },
            severity: 'CRITICAL',
            description: 'Old dormant account suddenly active with large sell orders'
        },

        // ACCOUNT TAKEOVER - Unauthorized access
        {
            id: 'ATO_001',
            name: 'Account Takeover - Device Change',
            category: 'ACCOUNT_TAKEOVER',
            features: {
                new_device: 1.0,
                new_location: 0.9,
                unusual_trading_hours: 0.7,
                different_trading_pattern: 0.8,
                rapid_withdrawal_attempt: 0.95,
                vpn_usage: 0.8
            },
            severity: 'CRITICAL',
            description: 'Account accessed from new device/location with immediate withdrawal'
        },
        {
            id: 'ATO_002',
            name: 'Account Takeover - Ghost Trader',
            category: 'ACCOUNT_TAKEOVER',
            features: {
                long_dormancy: 1.0,
                sudden_activity_spike: 0.9,
                high_risk_trades: 0.8,
                immediate_payout_request: 0.95,
                different_ip_country: 0.9
            },
            severity: 'CRITICAL',
            description: 'Previously inactive account with sudden high-risk activity'
        },

        // COORDINATED TRADING - Ring/network fraud
        {
            id: 'COORD_001',
            name: 'Coordinated Ring - Synchronized Trades',
            category: 'COORDINATED_TRADING',
            features: {
                same_device_cluster: 0.9,
                time_synchronized_orders: 0.95,
                same_symbols_traded: 0.85,
                similar_order_sizes: 0.8,
                young_accounts: 0.7,
                common_funding_source: 0.6
            },
            severity: 'HIGH',
            description: 'Multiple accounts making synchronized trades on same symbols'
        },
        {
            id: 'COORD_002',
            name: 'Coordinated Ring - Layered Payouts',
            category: 'COORDINATED_TRADING',
            features: {
                sequential_payouts: 0.9,
                similar_payout_amounts: 0.85,
                same_destination_patterns: 0.8,
                connected_trading_history: 0.75,
                shared_ip_history: 0.7
            },
            severity: 'HIGH',
            description: 'Connected accounts requesting payouts in sequence'
        },

        // SPOOFING - Fake orders to manipulate
        {
            id: 'SPOOF_001',
            name: 'Spoofing - Order Cancellation',
            category: 'SPOOFING',
            features: {
                high_cancel_rate: 0.95,
                large_order_sizes: 0.8,
                price_movement_before_cancel: 0.85,
                opposite_side_execution: 0.9,
                short_order_duration: 0.9
            },
            severity: 'HIGH',
            description: 'Large orders placed and cancelled to move price'
        },

        // MONEY LAUNDERING indicators
        {
            id: 'ML_001',
            name: 'Money Laundering - Structuring',
            category: 'MONEY_LAUNDERING',
            features: {
                deposit_just_under_threshold: 0.9,
                multiple_small_transactions: 0.85,
                rapid_turnover: 0.8,
                minimal_trading_activity: 0.7,
                immediate_withdrawal: 0.95
            },
            severity: 'CRITICAL',
            description: 'Deposits structured to avoid reporting thresholds'
        }
    ],

    // Compute similarity between transaction features and known patterns
    computeSimilarity(tradeFeatures, patternFeatures) {
        const keys = Object.keys(patternFeatures);
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (const key of keys) {
            const a = tradeFeatures[key] || 0;
            const b = patternFeatures[key] || 0;
            dotProduct += a * b;
            normA += a * a;
            normB += b * b;
        }

        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    },

    // Find best matching fraud patterns
    findMatchingPatterns(tradeFeatures, threshold = 0.5) {
        const matches = [];

        for (const pattern of this.patterns) {
            const similarity = this.computeSimilarity(tradeFeatures, pattern.features);
            if (similarity >= threshold) {
                matches.push({
                    pattern_id: pattern.id,
                    pattern_name: pattern.name,
                    category: pattern.category,
                    similarity: similarity,
                    severity: pattern.severity,
                    description: pattern.description
                });
            }
        }

        return matches.sort((a, b) => b.similarity - a.similarity);
    },

    // Add new pattern from confirmed fraud (learning)
    learnNewPattern(confirmedFraud) {
        const newPattern = {
            id: `LEARNED_${Date.now()}`,
            name: `Learned Pattern from ${confirmedFraud.trader_id}`,
            category: confirmedFraud.fraud_type || 'UNKNOWN',
            features: confirmedFraud.features,
            severity: 'MEDIUM',
            description: `Pattern learned from admin-confirmed fraud case`,
            learned_at: new Date().toISOString()
        };

        this.patterns.push(newPattern);
        console.log(`[FraudDB] Learned new fraud pattern: ${newPattern.id}`);
        return newPattern;
    }
};

export default fraudPatterns;
