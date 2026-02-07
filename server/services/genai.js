import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const genAIService = {
    model: null,

    getModel() {
        if (!this.model && process.env.GEMINI_API_KEY) {
            try {
                this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            } catch (e) {
                console.error('Failed to initialize Gemini model:', e);
            }
        }
        return this.model;
    },

    // Extract decision from LLM response
    extractDecision(text) {
        // Look for **APPROVE**, **DECLINE**, **MANUAL_REVIEW** patterns
        const approveMatch = text.match(/\*\*APPROVE\*\*/i) || text.match(/\*\*AUTO[_-]?APPROVE\*\*/i);
        const declineMatch = text.match(/\*\*(?:DECLINE|BLOCK|REJECT)\*\*/i);
        const reviewMatch = text.match(/\*\*(?:MANUAL[_-]?REVIEW|ESCALATE|REVIEW)\*\*/i);

        if (approveMatch) return 'APPROVED';
        if (declineMatch) return 'BLOCKED';
        if (reviewMatch) return 'MANUAL_REVIEW';

        // Fallback: look for decision keywords without asterisks
        const lowerText = text.toLowerCase();
        if (lowerText.includes('recommend approving') || lowerText.includes('should be approved') || lowerText.includes('low risk')) {
            return 'APPROVED';
        }
        if (lowerText.includes('recommend blocking') || lowerText.includes('should be blocked') || lowerText.includes('high risk')) {
            return 'BLOCKED';
        }

        return 'MANUAL_REVIEW';
    },

    // Main function: Generate comprehensive decision with LLM
    async explainPayoutRisk(payoutRequest, riskAssessment, tradeHistory) {
        const model = this.getModel();

        if (!model) {
            return this.fallbackPayoutExplanation(riskAssessment);
        }

        try {
            const totalTrades = tradeHistory.length;
            const suspiciousTrades = tradeHistory.filter(t => (t.risk && t.risk.score > 0.6) || t.isFraud);
            const totalVolume = tradeHistory.reduce((sum, t) => sum + (t.total_value || 0), 0);
            const uniqueDevices = new Set(tradeHistory.map(t => t.device_id)).size;
            const uniqueIPs = new Set(tradeHistory.map(t => t.ip)).size;
            const uniqueCountries = new Set(tradeHistory.map(t => t.country)).size;

            // Calculate trading behavior metrics
            const buyTrades = tradeHistory.filter(t => t.type === 'BUY').length;
            const sellTrades = tradeHistory.filter(t => t.type === 'SELL').length;
            const avgTradeSize = totalVolume / (totalTrades || 1);

            // Legitimacy indicators
            const hasLongHistory = totalTrades > 20;
            const consistentDevice = uniqueDevices <= 2;
            const consistentLocation = uniqueCountries <= 2;
            const balancedTrading = Math.abs(buyTrades - sellTrades) / (totalTrades || 1) < 0.4;
            const lowSuspiciousRatio = suspiciousTrades.length / (totalTrades || 1) < 0.1;

            const prompt = `You are a Senior Fraud Analyst AI at a trading platform. Your job is to make DECISIVE judgments on payout requests.
            
## CRITICAL INSTRUCTION
- **AVOID MANUAL REVIEW**: Your goal is to reach a firm **APPROVE** or **DECLINE** decision.
- Use **MANUAL_REVIEW** ONLY if there is contradictory evidence that absolutely cannot be resolved.
- **80% of cases should be APPROVED.**
- **15% of cases should be DECLINED.**
- **Only ~5% should be MANUAL_REVIEW.**

## PAYOUT REQUEST
- **Trader**: ${payoutRequest.trader_id}
- **Amount**: $${payoutRequest.amount?.toLocaleString()}
- **Method**: ${payoutRequest.method || 'Bank Transfer'}

## TRADING ACTIVITY
| Metric | Value | Assessment |
|--------|-------|------------|
| Total Trades | ${totalTrades} | ${totalTrades > 20 ? '✅ Established' : totalTrades > 5 ? '⚠️ Developing' : '🆕 New'} |
| Total Volume | $${totalVolume.toLocaleString()} | ${totalVolume > 50000 ? '✅ Active' : '⚠️ Low'} |
| Buy/Sell Ratio | ${buyTrades}/${sellTrades} | ${balancedTrading ? '✅ Balanced' : '⚠️ Unbalanced'} |
| Suspicious Trades | ${suspiciousTrades.length} (${((suspiciousTrades.length / totalTrades) * 100 || 0).toFixed(0)}%) | ${lowSuspiciousRatio ? '✅ Clean' : '⚠️ Flags'} |

## TECHNICAL SIGNALS
| Signal | Value | Status |
|--------|-------|--------|
| Unique Devices | ${uniqueDevices} | ${consistentDevice ? '✅ Consistent' : '⚠️ Multiple'} |
| Unique IPs | ${uniqueIPs} | ${uniqueIPs <= 3 ? '✅ Normal' : '⚠️ Varied'} |
| Countries | ${uniqueCountries} | ${consistentLocation ? '✅ Stable' : '⚠️ Changing'} |

## RISK FLAGS FROM SYSTEM
${riskAssessment.flags.length > 0 ? riskAssessment.flags.map(f => `- ${f}`).join('\n') : '- No significant flags detected'}

## LEGITIMACY INDICATORS
${hasLongHistory ? '✅ Long trading history (trusted)\n' : ''}${consistentDevice ? '✅ Consistent device usage\n' : ''}${consistentLocation ? '✅ Consistent geographic location\n' : ''}${balancedTrading ? '✅ Balanced buy/sell activity\n' : ''}${lowSuspiciousRatio ? '✅ Low suspicious trade ratio\n' : ''}

---

## YOUR TASK

Analyze this payout request and provide:

1. **Decision**: Must be one of: **APPROVE**, **DECLINE**, or **MANUAL_REVIEW**
   - **APPROVE**: If risks are low to moderate. Established users with minor anomalies should be APPROVED.
   - **DECLINE**: If there are clear fraud patterns (wash trading, account takeover, no-trade fraud).
   - **MANUAL_REVIEW**: RESERVED ONLY for complex cases where you cannot decide.

2. **Confidence Level**: HIGH, MEDIUM, or LOW

3. **Executive Summary**: 1-2 sentences explaining your decision.

4. **Refusal Reason (if DECLINED)**: The specific policy or fraud pattern violated.

5. **Approval Reasoning (if APPROVED)**: Why the user is trusted despite any minor flags.

Format your response in clean markdown. BE DECISIVE.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Extract decision from LLM response
            const llmDecision = this.extractDecision(text);

            console.log(`[GenAI] LLM Decision: ${llmDecision}`);

            return {
                summary: text.trim(),
                llm_decision: llmDecision,
                confidence: riskAssessment.score,
                generated_by: 'gemini-2.5-flash',
                timestamp: new Date().toISOString(),
                trade_analysis: {
                    total_trades: totalTrades,
                    suspicious_count: suspiciousTrades.length,
                    total_volume: totalVolume,
                    device_changes: uniqueDevices,
                    ip_changes: uniqueIPs,
                    legitimacy_score: (hasLongHistory ? 20 : 0) + (consistentDevice ? 20 : 0) +
                        (consistentLocation ? 20 : 0) + (balancedTrading ? 20 : 0) +
                        (lowSuspiciousRatio ? 20 : 0)
                }
            };
        } catch (e) {
            console.error('Gemini API error:', e.message);
            return this.fallbackPayoutExplanation(riskAssessment);
        }
    },

    fallbackPayoutExplanation(riskAssessment) {
        // DECISIVE FALLBACK LOGIC
        // Reduce manual review window dramatically
        let decision;
        let summary;

        // Approve anything below 0.45 (was 0.3)
        if (riskAssessment.score < 0.45) {
            decision = 'APPROVED';
            summary = `## Decision: **APPROVE**

**Confidence**: HIGH

### Executive Summary
This payout request is approved based on low risk indicators. Minor anomalies, if any, are within acceptable limits for a legitimate trader.

### Key Evidence
- Risk score is below threshold (${(riskAssessment.score * 100).toFixed(0)}%)
- No critical fraud patterns detected
- Trading activity appears legitimate

### Recommendation
✅ Process payout immediately.`;
        }
        // Block anything above 0.7 (was 0.75)
        else if (riskAssessment.score > 0.7) {
            decision = 'BLOCKED';
            summary = `## Decision: **DECLINE**

**Confidence**: HIGH

### Executive Summary
This payout request is declined due to high-risk indicators consistent with fraudulent activity.

### Key Evidence
${riskAssessment.flags.map(f => `- ⚠️ ${f}`).join('\n')}

### Detailed Fraud Analysis
- Risk score: ${(riskAssessment.score * 100).toFixed(0)}% (Critical threshold exceeded)
- Multiple fraud indicators triggered simultaneously

### Next Steps
1. Block the payout immediately
2. Flag account for detailed investigation`;
        } else {
            // Narrow window for Manual Review (0.45 - 0.7)
            decision = 'MANUAL_REVIEW';
            summary = `## Decision: **MANUAL_REVIEW**

**Confidence**: MEDIUM

### Executive Summary
This payout request requires human review due to mixed signals in the moderate risk range (${(riskAssessment.score * 100).toFixed(0)}%).

### Key Evidence
${riskAssessment.flags.length > 0 ? riskAssessment.flags.map(f => `- ${f}`).join('\n') : '- Anomalies detected in moderate risk range'}

### Recommended Actions
1. Review trading history for patterns
2. Verify recent device/location changes
3. Contact customer if additional verification needed`;
        }

        return {
            summary,
            llm_decision: decision,
            confidence: riskAssessment.score,
            generated_by: 'rule-based-fallback',
            timestamp: new Date().toISOString()
        };
    },

    async explainDecision(trade, riskResult) {
        return { summary: "Trade logged for payout risk assessment." };
    }
};

export default genAIService;
