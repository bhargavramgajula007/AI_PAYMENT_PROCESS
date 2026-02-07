import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Server, BrainCircuit, History, Shield, Activity, BarChart3, TrendingUp, Users, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Radar Chart for Pattern Comparison
const RadarChart = ({ suspect, normal, fraudPattern }) => {
    const features = ['Trades', 'Velocity', 'Devices', 'Fraud%', 'New Dev', 'VPN', 'IPs', 'Age', 'Sells', 'Countries', 'Volume', 'Speed'];
    const center = { x: 150, y: 120 };
    const radius = 90;

    const getPoint = (index, value) => {
        const angle = (index / features.length) * 2 * Math.PI - Math.PI / 2;
        const r = radius * value;
        return {
            x: center.x + r * Math.cos(angle),
            y: center.y + r * Math.sin(angle)
        };
    };

    const createPolygon = (values, color, opacity) => {
        if (!values || values.length === 0) return null;
        const points = values.map((v, i) => getPoint(i, v));
        const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
        return <path d={pathData} fill={color} fillOpacity={opacity} stroke={color} strokeWidth="2" />;
    };

    return (
        <svg viewBox="0 0 300 240" className="w-full h-64">
            {/* Grid circles */}
            {[0.25, 0.5, 0.75, 1].map(r => (
                <circle key={r} cx={center.x} cy={center.y} r={radius * r} fill="none" stroke="rgba(255,255,255,0.1)" />
            ))}

            {/* Axis lines and labels */}
            {features.map((f, i) => {
                const point = getPoint(i, 1);
                return (
                    <g key={f}>
                        <line x1={center.x} y1={center.y} x2={point.x} y2={point.y} stroke="rgba(255,255,255,0.1)" />
                        <text x={getPoint(i, 1.15).x} y={getPoint(i, 1.15).y} fill="#64748b" fontSize="8" textAnchor="middle">{f}</text>
                    </g>
                );
            })}

            {/* Normal pattern (green) */}
            {normal && createPolygon(normal, '#22c55e', 0.2)}

            {/* Fraud pattern (red dashed) - if matched */}
            {fraudPattern && createPolygon(fraudPattern, '#ef4444', 0.15)}

            {/* Suspect pattern (amber) */}
            {suspect && createPolygon(suspect, '#f59e0b', 0.4)}

            {/* Legend */}
            <g transform="translate(10, 220)">
                <rect x="0" y="0" width="10" height="10" fill="#22c55e" opacity="0.5" />
                <text x="15" y="9" fill="#64748b" fontSize="9">Normal</text>
                <rect x="60" y="0" width="10" height="10" fill="#f59e0b" opacity="0.7" />
                <text x="75" y="9" fill="#64748b" fontSize="9">Suspect</text>
                {fraudPattern && <>
                    <rect x="130" y="0" width="10" height="10" fill="#ef4444" opacity="0.5" />
                    <text x="145" y="9" fill="#64748b" fontSize="9">Fraud Pattern</text>
                </>}
            </g>
        </svg>
    );
};

// Feature Deviation Bar Chart
const DeviationChart = ({ comparison }) => {
    if (!comparison?.feature_comparison) return null;

    const anomalous = comparison.feature_comparison.filter(f => f.is_anomalous);
    if (anomalous.length === 0) {
        return <div className="text-sm text-slate-500 text-center py-4">No significant deviations from normal pattern</div>;
    }

    return (
        <div className="space-y-2">
            {anomalous.map((f, i) => (
                <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-400">{f.feature}</span>
                        <span className="text-red-400">+{(f.deviation * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex gap-1 h-2">
                        <div className="bg-emerald-500/30 rounded" style={{ width: `${f.normal * 100}%` }}></div>
                        <div className="bg-red-500/80 rounded" style={{ width: `${Math.abs(f.suspect - f.normal) * 100}%` }}></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Trade Chart
const TradeChart = ({ trades }) => {
    if (!trades || trades.length < 2) return <div className="h-40 flex items-center justify-center text-slate-500">Building chart...</div>;

    const height = 160;
    const width = 500;
    const padding = 30;

    let cumulative = 0;
    const dataPoints = trades.slice(0, 50).reverse().map((t, i) => {
        const value = t.type === 'BUY' ? -t.total_value : t.total_value;
        cumulative += value * 0.01;
        return { x: i, y: cumulative, trade: t };
    });

    const values = dataPoints.map(d => d.y);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 0);
    const range = max - min || 1;

    const points = dataPoints.map((d, i) => {
        const x = padding + (i / Math.max(dataPoints.length - 1, 1)) * (width - 2 * padding);
        const y = height - padding - ((d.y - min) / range) * (height - 2 * padding);
        return `${x},${y}`;
    }).join(' ');

    const isProfit = cumulative >= 0;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40">
            <defs>
                <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={isProfit ? '#22c55e' : '#ef4444'} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={isProfit ? '#22c55e' : '#ef4444'} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`} fill="url(#chartGrad)" />
            <polyline points={points} fill="none" stroke={isProfit ? '#22c55e' : '#ef4444'} strokeWidth="2" />
            {dataPoints.map((d, i) => {
                const x = padding + (i / Math.max(dataPoints.length - 1, 1)) * (width - 2 * padding);
                const y = height - padding - ((d.y - min) / range) * (height - 2 * padding);
                const isSuspicious = d.trade.isFraud || (d.trade.risk?.score > 0.6);
                return <circle key={i} cx={x} cy={y} r={isSuspicious ? 4 : 2} fill={isSuspicious ? '#ef4444' : '#64748b'} />;
            })}
        </svg>
    );
};

const CaseView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [caseData, setCaseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchCase = async () => {
            try {
                const res = await fetch(`http://localhost:3000/api/payouts/${id}`);
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setCaseData(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchCase();
    }, [id]);

    const submitDecision = async (decision) => {
        setSubmitting(true);
        try {
            await fetch(`http://localhost:3000/api/payout/${id}/decision`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ decision, notes })
            });
            navigate('/queue');
        } catch (e) {
            console.error(e);
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-500">Loading investigation data...</div>;
    if (!caseData) return <div className="p-12 text-center text-red-500">Case not found</div>;

    const history = caseData.history || [];
    const comparison = caseData.graph_comparison;
    const topMatch = caseData.embedding_matches?.[0];

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/queue')} className="p-2 rounded-lg hover:bg-white/10 text-slate-400">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-light text-white flex items-center gap-3">
                        <Shield className="w-6 h-6 text-slate-400" />
                        Investigation: {caseData.payout_id?.slice(-8)}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">{caseData.trader_id} • {caseData.trade_count} trades analyzed</p>
                </div>
                <span className={`text-sm px-4 py-2 rounded-full border font-medium ${caseData.status === 'PENDING_REVIEW' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    caseData.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                    {caseData.status}
                </span>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-xs text-slate-500 uppercase">Amount</div>
                    <div className="text-xl font-light">${caseData.amount?.toLocaleString()}</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-xs text-slate-500 uppercase">Risk Score</div>
                    <div className={`text-xl font-light ${caseData.risk_score > 0.7 ? 'text-red-400' : caseData.risk_score > 0.4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {(caseData.risk_score * 100).toFixed(0)}%
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-xs text-slate-500 uppercase">Confidence</div>
                    <div className="text-xl font-light">{caseData.confidence || 'MEDIUM'}</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-xs text-slate-500 uppercase">Trades</div>
                    <div className="text-xl font-light">{history.length}</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-xs text-slate-500 uppercase">Suspicious</div>
                    <div className="text-xl font-light text-red-400">{caseData.suspicious_trades || 0}</div>
                </div>
            </div>

            {/* Pattern Match Alert */}
            {topMatch && (
                <div className={`p-4 rounded-xl border ${topMatch.severity === 'CRITICAL' ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                    <div className="flex items-center gap-3">
                        <AlertTriangle className={`w-5 h-5 ${topMatch.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`} />
                        <div>
                            <div className="font-medium">Pattern Match: {topMatch.pattern_name}</div>
                            <div className="text-sm text-slate-400">Similarity: {(topMatch.similarity * 100).toFixed(0)}% • Severity: {topMatch.severity}</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Pattern Comparison Radar */}
                    <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                        <h2 className="text-lg font-light mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-slate-400" /> Pattern Comparison
                        </h2>
                        <RadarChart
                            suspect={caseData.vector}
                            normal={comparison?.normal_vector || [0.3, 0.2, 0.1, 0.05, 0.1, 0.1, 0.15, 0.4, 0.4, 0.05, 0.3, 0.6]}
                            fraudPattern={topMatch ? undefined : undefined} // Could add fraud pattern vector
                        />
                        <div className="mt-4 text-center">
                            <span className="text-sm text-slate-400">
                                Similarity to normal: <span className={comparison?.overall_similarity > 0.7 ? 'text-emerald-400' : 'text-amber-400'}>
                                    {((comparison?.overall_similarity || 0) * 100).toFixed(0)}%
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* Trade Activity */}
                    <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                        <h2 className="text-lg font-light mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-slate-400" /> Trade Activity
                        </h2>
                        <TradeChart trades={history} />
                        <div className="flex gap-4 mt-3 text-xs text-slate-500">
                            <span>● Normal trades</span>
                            <span className="text-red-400">● Suspicious</span>
                        </div>
                    </div>

                    {/* AI Investigation Report */}
                    <div className="bg-white/5 rounded-2xl border border-white/10 p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500/50 to-purple-500/50"></div>
                        <h2 className="text-lg font-light mb-4 flex items-center gap-2">
                            <BrainCircuit className="w-5 h-5 text-indigo-400" /> AI Investigation Report
                        </h2>

                        {/* LLM Decision Badge */}
                        {caseData.llm_decision && (
                            <div className={`mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${caseData.llm_decision === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                    caseData.llm_decision === 'BLOCKED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                }`}>
                                {caseData.llm_decision === 'APPROVED' && <CheckCircle className="w-4 h-4" />}
                                {caseData.llm_decision === 'BLOCKED' && <XCircle className="w-4 h-4" />}
                                {caseData.llm_decision === 'MANUAL_REVIEW' && <AlertTriangle className="w-4 h-4" />}
                                LLM Decision: {caseData.llm_decision}
                            </div>
                        )}

                        <div className="bg-black/30 rounded-xl p-5 border border-white/5 prose prose-invert prose-sm max-w-none prose-headings:text-white prose-headings:font-light prose-headings:mb-2 prose-p:text-slate-300 prose-p:leading-relaxed prose-strong:text-white prose-ul:text-slate-300 prose-li:my-0.5 prose-table:text-sm prose-th:text-slate-400 prose-th:font-medium prose-td:text-slate-300 prose-code:text-indigo-400 prose-code:bg-indigo-500/10 prose-code:px-1 prose-code:rounded">
                            <ReactMarkdown>
                                {caseData.ai_explanation?.summary || "Generating analysis..."}
                            </ReactMarkdown>
                        </div>
                        <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                                <Server className="w-3 h-3" />
                                {caseData.ai_explanation?.generated_by || 'AI Engine'}
                            </span>
                        </div>
                    </div>

                    {/* Trade History Table */}
                    <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                        <h2 className="text-lg font-light mb-4 flex items-center gap-2">
                            <History className="w-5 h-5 text-slate-400" /> Recent Trades
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-slate-500 uppercase">
                                    <tr>
                                        <th className="pb-3 text-left">Time</th>
                                        <th className="pb-3 text-left">Symbol</th>
                                        <th className="pb-3 text-left">Type</th>
                                        <th className="pb-3 text-right">Value</th>
                                        <th className="pb-3 text-right">Risk</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {history.slice(0, 15).map((trade, i) => (
                                        <tr key={i} className="hover:bg-white/5">
                                            <td className="py-2 text-slate-400 font-mono text-xs">{new Date(trade.timestamp).toLocaleString()}</td>
                                            <td className="py-2 font-medium">{trade.symbol}</td>
                                            <td className="py-2">
                                                <span className={`px-2 py-0.5 rounded text-xs ${trade.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                    {trade.type}
                                                </span>
                                            </td>
                                            <td className="py-2 text-right font-mono">${trade.total_value?.toLocaleString()}</td>
                                            <td className="py-2 text-right">
                                                <span className={`font-bold ${(trade.risk?.score || 0) > 0.6 ? 'text-red-400' : 'text-slate-400'}`}>
                                                    {((trade.risk?.score || 0) * 100).toFixed(0)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Signal Categories */}
                    {caseData.signals && (
                        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                            <h3 className="text-sm font-medium text-slate-400 uppercase mb-4">Signal Analysis</h3>

                            {caseData.signals.behavioral?.length > 0 && (
                                <div className="mb-4">
                                    <div className="text-xs text-slate-500 mb-2 flex items-center gap-1"><Users className="w-3 h-3" /> Behavioral</div>
                                    {caseData.signals.behavioral.map((s, i) => (
                                        <div key={i} className="text-sm p-2 rounded bg-amber-500/10 text-amber-300 mb-1">{s.signal}</div>
                                    ))}
                                </div>
                            )}

                            {caseData.signals.technical?.length > 0 && (
                                <div className="mb-4">
                                    <div className="text-xs text-slate-500 mb-2 flex items-center gap-1"><Zap className="w-3 h-3" /> Technical</div>
                                    {caseData.signals.technical.map((s, i) => (
                                        <div key={i} className="text-sm p-2 rounded bg-blue-500/10 text-blue-300 mb-1">{s.signal}</div>
                                    ))}
                                </div>
                            )}

                            {caseData.signals.pattern?.length > 0 && (
                                <div className="mb-4">
                                    <div className="text-xs text-slate-500 mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Pattern</div>
                                    {caseData.signals.pattern.map((s, i) => (
                                        <div key={i} className={`text-sm p-2 rounded mb-1 ${s.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/10 text-amber-300'}`}>
                                            {s.pattern}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Feature Deviations */}
                    {comparison && (
                        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                            <h3 className="text-sm font-medium text-slate-400 uppercase mb-4">Anomalous Features</h3>
                            <DeviationChart comparison={comparison} />
                        </div>
                    )}

                    {/* Risk Flags */}
                    <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                        <h3 className="text-sm font-medium text-slate-400 uppercase mb-4">Risk Flags</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {caseData.risk_flags?.map((flag, i) => (
                                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/10">
                                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                    <span className="text-sm text-red-300">{flag}</span>
                                </div>
                            ))}
                            {(!caseData.risk_flags || caseData.risk_flags.length === 0) && (
                                <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" /> No significant flags
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Decision Panel */}
                    <div className="bg-white/5 rounded-2xl border border-white/10 p-6 sticky top-6">
                        <h2 className="text-lg font-light mb-4">Final Decision</h2>

                        <textarea
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-white/30 min-h-[80px] resize-none mb-4"
                            placeholder="Document your findings..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        ></textarea>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => submitDecision('APPROVE')}
                                disabled={submitting}
                                className="py-3 rounded-xl bg-white text-black font-bold hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" /> Approve
                            </button>
                            <button
                                onClick={() => submitDecision('BLOCK')}
                                disabled={submitting}
                                className="py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <XCircle className="w-4 h-4" /> Block
                            </button>
                        </div>

                        <p className="text-xs text-slate-500 mt-4 text-center">
                            Your decision trains the ML model.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CaseView;
