import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const tradeAdvisor = {
    model: null,

    getModel() {
        if (!this.model && process.env.GEMINI_API_KEY) {
            try {
                this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            } catch (e) {
                console.error('Failed to initialize Gemini model:', e);
            }
        }
        return this.model;
    },

    // Analyze a single trade and provide personalized recommendations
    async analyzeTrade(trade, traderHistory, traderStats) {
        const model = this.getModel();

        const fallbackAnalysis = this.getFallbackAnalysis(trade, traderStats);

        if (!model) {
            return fallbackAnalysis;
        }

        try {
            const prompt = `You are an expert trading coach analyzing a trade. Be direct, specific, and actionable.

## TRADE DETAILS
- **Symbol**: ${trade.symbol}
- **Type**: ${trade.type}
- **Quantity**: ${trade.quantity} shares
- **Entry Price**: $${trade.price}
- **Exit Price**: $${trade.exit_price || 'Still Open'}
- **P&L**: ${trade.pnl ? (trade.pnl > 0 ? '+$' : '-$') + Math.abs(trade.pnl).toFixed(2) : 'Pending'}
- **Time**: ${new Date(trade.timestamp).toLocaleString()}

## TRADER PROFILE
- **Total Trades**: ${traderStats.total_trades}
- **Win Rate**: ${(traderStats.win_rate * 100).toFixed(1)}%
- **Common Mistakes**: ${traderStats.common_mistakes?.join(', ') || 'None identified yet'}

## YOUR TASK
Provide a JSON response with this exact structure:
{
    "verdict": "GOOD" or "BAD" or "NEUTRAL",
    "score": 1-10,
    "summary": "One sentence summary of the trade quality",
    "what_went_well": ["Point 1", "Point 2"],
    "what_went_wrong": ["Point 1", "Point 2"],
    "lesson": "The key takeaway from this trade",
    "improvement_tip": "Specific actionable advice",
    "psychology_note": "Note about trading psychology if relevant",
    "search_topics": ["topic1", "topic2", "topic3"]
}

The search_topics should be specific educational topics to help the trader improve.
RESPOND ONLY WITH VALID JSON.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0]);
                return {
                    ...analysis,
                    generated_by: 'gemini-2.0-flash',
                    timestamp: new Date().toISOString()
                };
            }

            return fallbackAnalysis;
        } catch (e) {
            console.error('[TradeAdvisor] AI analysis failed:', e.message);
            return fallbackAnalysis;
        }
    },

    // Fallback analysis when AI is unavailable
    getFallbackAnalysis(trade, traderStats) {
        const isProfitable = trade.pnl && trade.pnl > 0;
        const isLargeLoss = trade.pnl && trade.pnl < -500;
        const isSmallPosition = trade.quantity < 50;

        return {
            verdict: isProfitable ? 'GOOD' : (isLargeLoss ? 'BAD' : 'NEUTRAL'),
            score: isProfitable ? 7 : (isLargeLoss ? 3 : 5),
            summary: isProfitable
                ? 'Profitable trade with solid execution'
                : (isLargeLoss ? 'Significant loss - review entry/exit timing' : 'Break-even trade - consider position sizing'),
            what_went_well: isProfitable
                ? ['Entry timing was reasonable', 'Position was closed at profit']
                : ['Trade was executed without issues'],
            what_went_wrong: isLargeLoss
                ? ['Loss exceeds recommended risk limit', 'Consider tighter stop-losses']
                : (isProfitable ? [] : ['Could have waited for better entry']),
            lesson: isProfitable
                ? 'Good discipline in taking profits'
                : 'Every loss is a learning opportunity - review your thesis',
            improvement_tip: isSmallPosition
                ? 'Consider increasing position size on high-conviction trades'
                : 'Set stop-losses before entering trades',
            psychology_note: isProfitable
                ? "Don't let wins make you overconfident"
                : "Stay calm after losses - emotional trading leads to more losses",
            search_topics: [
                `${trade.symbol} trading strategy`,
                isProfitable ? 'profit taking strategies' : 'stop loss placement',
                'trading psychology'
            ],
            generated_by: 'rule-based',
            timestamp: new Date().toISOString()
        };
    },

    // Generate educational resources for a trade
    getEducationalResources(trade, analysis) {
        const resources = {
            videos: [],
            articles: [],
            books: []
        };

        // Based on trade outcome and analysis
        if (analysis.verdict === 'BAD' || (trade.pnl && trade.pnl < 0)) {
            resources.videos = [
                { title: 'Why Most Traders Lose Money', url: 'https://youtube.com/watch?v=YourId', duration: '12:45', source: 'YouTube' },
                { title: 'Stop Loss Strategies That Work', url: 'https://youtube.com/watch?v=YourId2', duration: '18:22', source: 'YouTube' },
                { title: `Understanding ${trade.symbol} Price Action`, url: 'https://youtube.com/watch?v=YourId3', duration: '25:10', source: 'YouTube' }
            ];
            resources.articles = [
                { title: 'The Psychology of Losing Trades', url: '#', readTime: '8 min', source: 'Investopedia' },
                { title: 'Risk Management 101', url: '#', readTime: '12 min', source: 'Trading Academy' }
            ];
        } else {
            resources.videos = [
                { title: 'Maximizing Profits on Winning Trades', url: 'https://youtube.com/watch?v=WinId', duration: '15:30', source: 'YouTube' },
                { title: 'Scaling Into Positions', url: 'https://youtube.com/watch?v=WinId2', duration: '20:15', source: 'YouTube' }
            ];
            resources.articles = [
                { title: 'When to Let Profits Run', url: '#', readTime: '6 min', source: 'TradingView' },
                { title: 'Building on Winning Streaks', url: '#', readTime: '10 min', source: 'Forbes' }
            ];
        }

        // Stock-specific resources
        resources.articles.push({
            title: `${trade.symbol} Technical Analysis Guide`,
            url: '#',
            readTime: '15 min',
            source: 'Market Watch'
        });

        resources.books = [
            { title: 'Trading in the Zone', author: 'Mark Douglas', relevance: 'Psychology' },
            { title: 'The Disciplined Trader', author: 'Mark Douglas', relevance: 'Mindset' }
        ];

        return resources;
    },

    // Analyze trader's evolution over time
    async analyzeTraderEvolution(allTrades, traderId) {
        const model = this.getModel();

        // Calculate timeline milestones
        const sortedTrades = [...allTrades].sort((a, b) =>
            new Date(a.timestamp) - new Date(b.timestamp)
        );

        const timeline = [];
        let runningPnL = 0;
        let winStreak = 0;
        let loseStreak = 0;
        let maxWinStreak = 0;
        let maxLoseStreak = 0;
        let totalWins = 0;
        let totalLosses = 0;

        // Process trades for timeline events
        sortedTrades.forEach((trade, index) => {
            if (trade.type === 'SELL' && trade.pnl !== undefined) {
                runningPnL += trade.pnl;

                if (trade.pnl > 0) {
                    totalWins++;
                    winStreak++;
                    loseStreak = 0;
                    if (winStreak > maxWinStreak) {
                        maxWinStreak = winStreak;
                        timeline.push({
                            type: 'MILESTONE',
                            event: `${winStreak} Trade Win Streak!`,
                            date: trade.timestamp,
                            icon: '🔥',
                            details: `Achieved ${winStreak} consecutive profitable trades`
                        });
                    }
                } else {
                    totalLosses++;
                    loseStreak++;
                    winStreak = 0;
                    if (loseStreak >= 3) {
                        timeline.push({
                            type: 'WARNING',
                            event: 'Losing Streak Detected',
                            date: trade.timestamp,
                            icon: '⚠️',
                            details: `${loseStreak} consecutive losses - consider taking a break`
                        });
                    }
                }

                // Check for PnL milestones
                if (runningPnL > 1000 && !timeline.find(t => t.event === 'First $1,000 Profit')) {
                    timeline.push({
                        type: 'ACHIEVEMENT',
                        event: 'First $1,000 Profit',
                        date: trade.timestamp,
                        icon: '💰',
                        details: 'Reached your first $1,000 in total profits!'
                    });
                }
                if (runningPnL > 5000 && !timeline.find(t => t.event === '$5,000 Club')) {
                    timeline.push({
                        type: 'ACHIEVEMENT',
                        event: '$5,000 Club',
                        date: trade.timestamp,
                        icon: '🏆',
                        details: 'You\'ve earned over $5,000 in trading profits!'
                    });
                }
            }

            // First trade milestone
            if (index === 0) {
                timeline.push({
                    type: 'START',
                    event: 'Trading Journey Begins',
                    date: trade.timestamp,
                    icon: '🚀',
                    details: `First trade: ${trade.type} ${trade.quantity} ${trade.symbol}`
                });
            }
        });

        // Common mistakes analysis
        const mistakes = [];
        const largeLosses = sortedTrades.filter(t => t.pnl && t.pnl < -500);
        if (largeLosses.length > 2) {
            mistakes.push({
                pattern: 'Large Position Losses',
                frequency: largeLosses.length,
                suggestion: 'Consider smaller position sizes or tighter stop-losses'
            });
        }

        const weekendTrades = sortedTrades.filter(t => {
            const day = new Date(t.timestamp).getDay();
            return day === 0 || day === 6;
        });
        if (weekendTrades.length > 0) {
            mistakes.push({
                pattern: 'Weekend Trading',
                frequency: weekendTrades.length,
                suggestion: 'Avoid holding positions over weekends to reduce gap risk'
            });
        }

        return {
            timeline: timeline.sort((a, b) => new Date(b.date) - new Date(a.date)),
            stats: {
                total_trades: sortedTrades.length,
                total_wins: totalWins,
                total_losses: totalLosses,
                win_rate: totalWins / (totalWins + totalLosses) || 0,
                max_win_streak: maxWinStreak,
                max_lose_streak: maxLoseStreak,
                total_pnl: runningPnL
            },
            common_mistakes: mistakes,
            trader_level: this.calculateTraderLevel(sortedTrades.length, runningPnL, totalWins / (totalWins + totalLosses))
        };
    },

    calculateTraderLevel(tradeCount, totalPnL, winRate) {
        if (tradeCount < 10) return { level: 1, title: 'Beginner', xp: tradeCount * 10, nextLevel: 100 };
        if (tradeCount < 50 && winRate < 0.5) return { level: 2, title: 'Learning', xp: 100 + tradeCount * 5, nextLevel: 350 };
        if (tradeCount < 50) return { level: 3, title: 'Developing', xp: 200 + tradeCount * 5, nextLevel: 500 };
        if (winRate < 0.55) return { level: 4, title: 'Intermediate', xp: 400 + tradeCount * 3, nextLevel: 700 };
        if (tradeCount < 100) return { level: 5, title: 'Skilled', xp: 550 + tradeCount * 3, nextLevel: 900 };
        if (totalPnL < 10000) return { level: 6, title: 'Advanced', xp: 750 + Math.floor(totalPnL / 100), nextLevel: 1200 };
        return { level: 7, title: 'Expert', xp: 1000 + Math.floor(totalPnL / 50), nextLevel: 2000 };
    }
};

export default tradeAdvisor;
