
import React, { useState } from 'react';
import { Send, Loader2, Search, ChevronRight, Play, Sparkles } from 'lucide-react';

const CopilotView = () => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState(null);
    const [results, setResults] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);

    const handleQuery = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setPlan(null);
        setResults(null);

        // Add user query to history
        setChatHistory(prev => [...prev, { type: 'user', content: query }]);

        try {
            const res = await fetch('http://localhost:3000/api/copilot/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });
            const data = await res.json();
            setPlan(data);
            setChatHistory(prev => [...prev, { type: 'plan', content: data }]);
        } catch (e) {
            console.error('Query failed:', e);
            setChatHistory(prev => [...prev, { type: 'error', content: 'Failed to generate query plan' }]);
        } finally {
            setLoading(false);
            setQuery('');
        }
    };

    const executePlan = async () => {
        if (!plan) return;
        setLoading(true);

        try {
            const res = await fetch('http://localhost:3000/api/copilot/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan })
            });
            const data = await res.json();
            setResults(data);
            setChatHistory(prev => [...prev, { type: 'results', content: data }]);
        } catch (e) {
            console.error('Execution failed:', e);
        } finally {
            setLoading(false);
            setPlan(null);
        }
    };

    const suggestedQueries = [
        'Show high-risk transactions in the last hour',
        'Find accounts with transfers to MULE destinations',
        'List all CASH_OUT transactions over $5000',
        'Show transactions with VPN detected'
    ];

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col">
            <div className="mb-6">
                <h1 className="text-3xl font-light mb-2 flex items-center gap-3">
                    <Sparkles className="w-8 h-8" />
                    Investigator Copilot
                </h1>
                <p className="text-slate-500">Ask questions in natural language to query the fraud database</p>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {chatHistory.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center max-w-md">
                            <Search className="w-16 h-16 mx-auto mb-6 text-slate-700" />
                            <h3 className="text-lg font-medium mb-4">Ask anything about transactions</h3>
                            <p className="text-slate-500 text-sm mb-6">
                                The AI will generate a safe, auditable query plan that you can review before execution.
                            </p>
                            <div className="space-y-2">
                                {suggestedQueries.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setQuery(q)}
                                        className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm text-slate-300"
                                    >
                                        <ChevronRight className="w-4 h-4 inline mr-2 text-slate-500" />
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    chatHistory.map((msg, i) => (
                        <div key={i} className={`flex gap-4 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.type === 'user' ? (
                                <div className="max-w-xl p-4 rounded-2xl rounded-br-none bg-white text-black">
                                    {msg.content}
                                </div>
                            ) : msg.type === 'plan' ? (
                                <div className="max-w-2xl flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-white font-bold text-xs">AI</div>
                                    <div className="p-4 rounded-2xl rounded-tl-none bg-white/5 border border-white/10 w-full">
                                        <h3 className="text-xs font-bold text-white uppercase tracking-wide mb-3">Query Plan</h3>
                                        {msg.content.explanation && (
                                            <p className="text-sm text-slate-300 mb-3">{msg.content.explanation}</p>
                                        )}
                                        <pre className="text-xs font-mono text-slate-400 bg-black/30 p-4 rounded-lg overflow-x-auto mb-4">
                                            {JSON.stringify(msg.content, null, 2)}
                                        </pre>
                                        {plan === msg.content && (
                                            <button
                                                onClick={executePlan}
                                                disabled={loading}
                                                className="px-4 py-2 bg-white hover:bg-slate-200 text-black font-medium rounded-lg text-sm transition-colors flex items-center gap-2"
                                            >
                                                <Play className="w-4 h-4" />
                                                Execute Plan
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : msg.type === 'results' ? (
                                <div className="max-w-2xl flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400 text-xs">✓</div>
                                    <div className="p-4 rounded-2xl rounded-tl-none bg-white/5 border border-white/10 w-full">
                                        <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-3">
                                            Results ({msg.content.count} found)
                                        </h3>
                                        <div className="max-h-64 overflow-y-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="text-slate-500 text-left border-b border-white/10">
                                                        <th className="p-2">ID</th>
                                                        <th className="p-2">Type</th>
                                                        <th className="p-2">Amount</th>
                                                        <th className="p-2">Risk</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {msg.content.results?.slice(0, 10).map((r, j) => (
                                                        <tr key={j} className="border-b border-white/5">
                                                            <td className="p-2 font-mono">{r.transaction_id?.slice(-8) || r.nameOrig}</td>
                                                            <td className="p-2">{r.type}</td>
                                                            <td className="p-2">${r.amount?.toLocaleString()}</td>
                                                            <td className="p-2">
                                                                <span className={r.risk?.score > 0.7 ? 'text-red-400' : 'text-slate-400'}>
                                                                    {((r.risk?.score || 0) * 100).toFixed(0)}%
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {msg.content.results?.length > 10 && (
                                                <p className="text-slate-500 text-xs mt-2 text-center">
                                                    Showing 10 of {msg.content.count} results
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="max-w-xl p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
                                    {msg.content}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleQuery} className="flex gap-4">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about transactions, risks, or fraud patterns..."
                    className="flex-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none text-white placeholder-slate-500 transition-colors"
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="px-6 py-4 rounded-2xl bg-white text-black font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                </button>
            </form>
        </div>
    );
};

export default CopilotView;
