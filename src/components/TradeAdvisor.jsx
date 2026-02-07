import React, { useState, useEffect } from 'react';
import {
    Brain, TrendingUp, TrendingDown, Target, Award, AlertTriangle,
    Clock, BookOpen, Video, ExternalLink, ChevronRight, Sparkles,
    Activity, Zap, Star, Trophy, Flame, Loader2
} from 'lucide-react';

// Trade Advisor Panel - AI-powered analysis for individual trades
export const TradeAdvisorPanel = ({ trade, onClose }) => {
    const [analysis, setAnalysis] = useState(null);
    const [resources, setResources] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (trade) {
            analyzeTrade();
        }
    }, [trade]);

    const analyzeTrade = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/trade/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trade, traderId: trade.trader_id })
            });
            const data = await response.json();
            if (data.success) {
                setAnalysis(data.analysis);
                setResources(data.resources);
            }
        } catch (e) {
            console.error('Analysis failed:', e);
        }
        setLoading(false);
    };

    if (!trade) return null;

    const verdictColors = {
        GOOD: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30',
        BAD: 'from-red-500/20 to-rose-500/20 border-red-500/30',
        NEUTRAL: 'from-slate-500/20 to-gray-500/20 border-slate-500/30'
    };

    const verdictIcons = {
        GOOD: <TrendingUp className="w-6 h-6 text-emerald-400" />,
        BAD: <TrendingDown className="w-6 h-6 text-red-400" />,
        NEUTRAL: <Target className="w-6 h-6 text-slate-400" />
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-white/10 shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-slate-900/95 backdrop-blur border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Trade Analysis</h2>
                            <p className="text-sm text-slate-400">{trade.symbol} • {trade.type}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">✕</button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-violet-400 animate-spin mb-4" />
                        <p className="text-slate-400">AI is analyzing your trade...</p>
                    </div>
                ) : analysis ? (
                    <div className="p-6 space-y-6">
                        {/* Verdict Card */}
                        <div className={`p-6 rounded-2xl bg-gradient-to-br ${verdictColors[analysis.verdict]} border`}>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 rounded-xl bg-black/30 flex items-center justify-center">
                                    {verdictIcons[analysis.verdict]}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-2xl font-bold ${analysis.verdict === 'GOOD' ? 'text-emerald-400' :
                                                analysis.verdict === 'BAD' ? 'text-red-400' : 'text-slate-300'
                                            }`}>{analysis.verdict} TRADE</span>
                                        <span className="px-3 py-1 rounded-full bg-black/30 text-sm font-mono">
                                            Score: {analysis.score}/10
                                        </span>
                                    </div>
                                    <p className="text-slate-300 mt-1">{analysis.summary}</p>
                                </div>
                            </div>
                        </div>

                        {/* Analysis Grid */}
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* What Went Well */}
                            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                                <h3 className="flex items-center gap-2 text-emerald-400 font-semibold mb-3">
                                    <TrendingUp className="w-4 h-4" /> What Went Well
                                </h3>
                                <ul className="space-y-2">
                                    {analysis.what_went_well?.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                            <span className="text-emerald-400 mt-1">✓</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* What Went Wrong */}
                            <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20">
                                <h3 className="flex items-center gap-2 text-red-400 font-semibold mb-3">
                                    <AlertTriangle className="w-4 h-4" /> What Needs Improvement
                                </h3>
                                <ul className="space-y-2">
                                    {analysis.what_went_wrong?.length > 0 ? analysis.what_went_wrong.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                            <span className="text-red-400 mt-1">•</span>
                                            {item}
                                        </li>
                                    )) : (
                                        <li className="text-sm text-slate-400">Nothing major to improve!</li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        {/* Lesson & Tip */}
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                                    <Zap className="w-5 h-5 text-violet-400" />
                                </div>
                                <div>
                                    <h3 className="text-violet-300 font-semibold mb-1">Key Lesson</h3>
                                    <p className="text-slate-300 text-sm">{analysis.lesson}</p>
                                    <div className="mt-3 p-3 rounded-xl bg-black/30">
                                        <p className="text-sm">💡 <span className="text-white font-medium">Tip:</span> {analysis.improvement_tip}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Psychology Note */}
                        {analysis.psychology_note && (
                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <p className="text-sm text-amber-200">
                                    🧠 <span className="font-medium">Mindset:</span> {analysis.psychology_note}
                                </p>
                            </div>
                        )}

                        {/* Educational Resources */}
                        {resources && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-blue-400" />
                                    Learn More
                                </h3>

                                {/* Videos */}
                                <div className="space-y-2">
                                    <h4 className="text-sm text-slate-400 uppercase tracking-wider">Recommended Videos</h4>
                                    <div className="space-y-2">
                                        {resources.videos?.map((video, i) => (
                                            <a
                                                key={i}
                                                href={video.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                                                    <Video className="w-5 h-5 text-red-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm group-hover:text-white transition-colors">{video.title}</p>
                                                    <p className="text-xs text-slate-500">{video.duration} • {video.source}</p>
                                                </div>
                                                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white" />
                                            </a>
                                        ))}
                                    </div>
                                </div>

                                {/* Articles */}
                                <div className="space-y-2">
                                    <h4 className="text-sm text-slate-400 uppercase tracking-wider">Articles to Read</h4>
                                    <div className="grid md:grid-cols-2 gap-2">
                                        {resources.articles?.map((article, i) => (
                                            <a
                                                key={i}
                                                href={article.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group"
                                            >
                                                <BookOpen className="w-4 h-4 text-blue-400" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm truncate group-hover:text-white">{article.title}</p>
                                                    <p className="text-xs text-slate-500">{article.readTime} • {article.source}</p>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-6 text-center text-slate-400">
                        Unable to analyze trade. Please try again.
                    </div>
                )}
            </div>
        </div>
    );
};

// Trader Brain Section - Evolution Timeline & Insights
export const TraderBrain = ({ traderId, onClose }) => {
    const [brain, setBrain] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (traderId) {
            fetchBrain();
        }
    }, [traderId]);

    const fetchBrain = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3000/api/trader/brain/${traderId}`);
            const data = await response.json();
            if (data.success) {
                setBrain(data.brain);
            }
        } catch (e) {
            console.error('Brain fetch failed:', e);
        }
        setLoading(false);
    };

    const levelColors = {
        1: 'from-slate-500 to-gray-500',
        2: 'from-green-500 to-emerald-500',
        3: 'from-blue-500 to-cyan-500',
        4: 'from-purple-500 to-violet-500',
        5: 'from-amber-500 to-yellow-500',
        6: 'from-rose-500 to-pink-500',
        7: 'from-orange-500 to-red-500'
    };

    const eventIcons = {
        MILESTONE: <Flame className="w-4 h-4" />,
        ACHIEVEMENT: <Trophy className="w-4 h-4" />,
        WARNING: <AlertTriangle className="w-4 h-4" />,
        START: <Star className="w-4 h-4" />
    };

    const eventColors = {
        MILESTONE: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
        ACHIEVEMENT: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
        WARNING: 'bg-red-500/20 border-red-500/30 text-red-400',
        START: 'bg-blue-500/20 border-blue-500/30 text-blue-400'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-5xl my-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-white/10 shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-slate-900/95 backdrop-blur border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Trader Brain</h2>
                            <p className="text-sm text-slate-400">Your evolution as a trader</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors text-xl">✕</button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-pink-400 animate-spin mb-4" />
                        <p className="text-slate-400">Analyzing your trading journey...</p>
                    </div>
                ) : brain ? (
                    <div className="p-6 space-y-8">
                        {/* Level & XP Card */}
                        <div className={`p-6 rounded-2xl bg-gradient-to-r ${levelColors[brain.trader_level?.level] || levelColors[1]} relative overflow-hidden`}>
                            <div className="absolute inset-0 bg-black/40" />
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-bold">
                                        {brain.trader_level?.level || 1}
                                    </div>
                                    <div>
                                        <p className="text-sm text-white/60">Trader Level</p>
                                        <h3 className="text-2xl font-bold text-white">{brain.trader_level?.title || 'Beginner'}</h3>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-white/60">Experience</p>
                                    <p className="text-xl font-bold text-white">{brain.trader_level?.xp || 0} XP</p>
                                </div>
                            </div>
                            {/* XP Progress Bar */}
                            <div className="relative mt-4">
                                <div className="h-3 bg-black/30 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-white/50 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min((brain.trader_level?.xp || 0) / (brain.trader_level?.nextLevel || 100) * 100, 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-white/60 mt-1 text-right">
                                    {brain.trader_level?.xp || 0} / {brain.trader_level?.nextLevel || 100} XP to next level
                                </p>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                                <p className="text-3xl font-bold text-white">{brain.stats?.total_trades || 0}</p>
                                <p className="text-sm text-slate-400">Total Trades</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                                <p className="text-3xl font-bold text-emerald-400">{((brain.stats?.win_rate || 0) * 100).toFixed(0)}%</p>
                                <p className="text-sm text-slate-400">Win Rate</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                                <p className="text-3xl font-bold text-amber-400">{brain.stats?.max_win_streak || 0}</p>
                                <p className="text-sm text-slate-400">Best Streak</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                                <p className={`text-3xl font-bold ${(brain.stats?.total_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    ${(brain.stats?.total_pnl || 0).toFixed(0)}
                                </p>
                                <p className="text-sm text-slate-400">Total P&L</p>
                            </div>
                        </div>

                        {/* Common Mistakes */}
                        {brain.common_mistakes?.length > 0 && (
                            <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20">
                                <h3 className="flex items-center gap-2 text-red-400 font-semibold mb-4">
                                    <AlertTriangle className="w-5 h-5" />
                                    Patterns to Fix
                                </h3>
                                <div className="space-y-3">
                                    {brain.common_mistakes.map((mistake, i) => (
                                        <div key={i} className="p-4 rounded-xl bg-black/30">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-white">{mistake.pattern}</span>
                                                <span className="text-sm text-red-400">{mistake.frequency}x</span>
                                            </div>
                                            <p className="text-sm text-slate-400">{mistake.suggestion}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Evolution Timeline */}
                        <div>
                            <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                                <Activity className="w-5 h-5 text-violet-400" />
                                Your Trading Journey
                            </h3>

                            {brain.timeline?.length > 0 ? (
                                <div className="relative">
                                    {/* Timeline Line */}
                                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500 to-transparent" />

                                    <div className="space-y-4">
                                        {brain.timeline.map((event, i) => (
                                            <div key={i} className="relative flex items-start gap-4 pl-4">
                                                {/* Timeline Dot */}
                                                <div className={`w-5 h-5 rounded-full ${eventColors[event.type]} border flex items-center justify-center z-10`}>
                                                    {event.icon}
                                                </div>

                                                {/* Event Card */}
                                                <div className={`flex-1 p-4 rounded-xl ${eventColors[event.type]} border`}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            {eventIcons[event.type]}
                                                            <span className="font-semibold">{event.event}</span>
                                                        </div>
                                                        <span className="text-xs opacity-60">
                                                            {new Date(event.date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm opacity-80 mt-1">{event.details}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-slate-400">
                                    <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Start trading to build your timeline!</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-6 text-center text-slate-400">
                        Unable to load brain data. Please try again.
                    </div>
                )}
            </div>
        </div>
    );
};

export default { TradeAdvisorPanel, TraderBrain };
