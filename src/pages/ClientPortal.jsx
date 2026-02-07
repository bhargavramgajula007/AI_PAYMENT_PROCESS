import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    User, ArrowRight, TrendingUp, TrendingDown,
    Shield, Skull, ToggleLeft, ToggleRight, Zap,
    DollarSign, AlertTriangle
} from 'lucide-react';

const ClientPortal = () => {
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [blackModeActive, setBlackModeActive] = useState(false);
    const [loading, setLoading] = useState(true);
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/client/accounts');
            const data = await res.json();
            // Filter to show only 5 main accounts + black account
            const mainAccounts = data.filter(a =>
                ['john_trader', 'hft_mike', 'quick_cash', 'new_sarah', 'black_ops'].includes(a.username)
            );
            setAccounts(mainAccounts);
            setLoading(false);
        } catch (e) {
            console.error('Failed to fetch accounts:', e);
            setLoading(false);
        }
    };

    const handleSelectAccount = async (account) => {
        try {
            await login(account.username, account.username === 'black_ops' ? 'shadow' : 'demo123');
            navigate('/trading'); // Go to trading portal, not admin dashboard
        } catch (e) {
            console.error('Login failed:', e);
        }
    };

    const toggleBlackMode = () => {
        setBlackModeActive(!blackModeActive);
        // Send to backend to activate automated fraud trading
        fetch('http://localhost:3000/api/black-account/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: !blackModeActive })
        });
    };

    const getAccountIcon = (type) => {
        switch (type) {
            case 'LEGITIMATE':
            case 'HIGH_FREQUENCY':
                return <User className="w-6 h-6 text-green-400" />;
            case 'NEW_USER':
                return <User className="w-6 h-6 text-blue-400" />;
            case 'BLACK_MARKET':
                return <Skull className="w-6 h-6 text-red-500" />;
            default:
                return <User className="w-6 h-6 text-slate-400" />;
        }
    };

    const isBlackAccount = (account) => account.type === 'BLACK_MARKET';

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-light mb-2">Trading Portal</h1>
                    <p className="text-slate-500">Select an account to test fraud detection</p>
                </div>

                {/* Account Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {accounts.filter(a => !isBlackAccount(a)).map(account => (
                        <div
                            key={account.username}
                            className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 
                                       transition-all group relative overflow-hidden"
                        >
                            <div className="flex items-start justify-between mb-4">
                                {getAccountIcon(account.type)}
                                <button
                                    onClick={() => handleSelectAccount(account)}
                                    className="p-2 rounded-full bg-white/5 hover:bg-white/20 transition-colors"
                                >
                                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white" />
                                </button>
                            </div>

                            <h3 className="text-lg font-medium mb-1">{account.name}</h3>
                            <p className="text-sm text-slate-500 mb-3">{account.description}</p>

                            <div className="flex items-center gap-2 text-lg font-mono mb-4">
                                <DollarSign className="w-4 h-4 text-green-400" />
                                <span>{account.balance?.toLocaleString()}</span>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                                <div className="p-2 rounded bg-black/30">
                                    <div className="text-slate-500">Trades</div>
                                    <div className="font-mono">{account.stats?.total_trades || 0}</div>
                                </div>
                                <div className="p-2 rounded bg-black/30">
                                    <div className="text-slate-500">Win Rate</div>
                                    <div className={`font-mono ${account.stats?.win_rate > 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                                        {((account.stats?.win_rate || 0) * 100).toFixed(0)}%
                                    </div>
                                </div>
                                <div className="p-2 rounded bg-black/30 col-span-2">
                                    <div className="text-slate-500">Avg Trade Value</div>
                                    <div className="font-mono">${(account.stats?.avg_value || 0).toFixed(2)}</div>
                                </div>
                            </div>

                            {/* Recent Transactions */}
                            <div>
                                <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Recent Activity (Last 10)</h4>
                                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                    {account.stats?.last_trades?.map((t, i) => (
                                        <div key={i} className="flex justify-between text-xs p-1.5 rounded hover:bg-white/5">
                                            <span className={t.type === 'BUY' ? 'text-green-400' : 'text-red-400'}>{t.type} {t.symbol}</span>
                                            <span className="font-mono text-slate-300">
                                                {t.pnl ? (
                                                    <span className={t.pnl > 0 ? 'text-green-400' : 'text-red-400'}>
                                                        {t.pnl > 0 ? '+' : ''}{t.pnl.toLocaleString()}
                                                    </span>
                                                ) : (
                                                    `$${t.amount?.toLocaleString()}`
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                    {(!account.stats?.last_trades || account.stats.last_trades.length === 0) && (
                                        <div className="text-xs text-slate-600 italic">No recent trades</div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => handleSelectAccount(account)}
                                className="w-full mt-4 py-2 rounded-lg bg-white/5 hover:bg-blue-600 hover:text-white 
                                         text-slate-400 text-sm font-medium transition-all"
                            >
                                Launch Terminal
                            </button>
                        </div>
                    ))}
                </div>

                {/* Black Account - Special Section */}
                {accounts.find(a => isBlackAccount(a)) && (
                    <div className={`mt-8 p-6 rounded-2xl border-2 transition-all duration-500 ${blackModeActive
                        ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20'
                        : 'border-white/20 bg-black'
                        }`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Skull className={`w-8 h-8 ${blackModeActive ? 'text-red-500 animate-pulse' : 'text-slate-600'}`} />
                                <div>
                                    <h3 className="text-xl font-bold">BLACK OPS ACCOUNT</h3>
                                    <p className="text-sm text-slate-500">Market Manipulation Test Mode</p>
                                </div>
                            </div>

                            {/* Auto-Trade Toggle */}
                            <button
                                onClick={toggleBlackMode}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${blackModeActive
                                    ? 'bg-red-500 text-white'
                                    : 'bg-white/10 text-slate-400 hover:text-white'
                                    }`}
                            >
                                {blackModeActive ? (
                                    <><ToggleRight className="w-5 h-5" /> AUTO-TRADE ON</>
                                ) : (
                                    <><ToggleLeft className="w-5 h-5" /> AUTO-TRADE OFF</>
                                )}
                            </button>
                        </div>

                        {blackModeActive && (
                            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30">
                                <div className="flex items-center gap-2 text-red-400 text-sm">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Automated fraud trading active - Engine will attempt to detect manipulation</span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="p-3 rounded-lg bg-white/5">
                                <div className="text-xs text-slate-500 mb-1">Balance</div>
                                <div className="text-xl font-mono text-green-400">$500,000</div>
                            </div>
                            <div className="p-3 rounded-lg bg-white/5">
                                <div className="text-xs text-slate-500 mb-1">Profit</div>
                                <div className="text-xl font-mono text-green-400 flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4" /> $21,000
                                </div>
                            </div>
                            <div className="p-3 rounded-lg bg-white/5">
                                <div className="text-xs text-slate-500 mb-1">Strategy</div>
                                <div className="text-sm text-red-400">PUMP & DUMP</div>
                            </div>
                        </div>

                        <button
                            onClick={() => handleSelectAccount(accounts.find(a => isBlackAccount(a)))}
                            className="w-full py-3 rounded-lg bg-white/10 hover:bg-red-500/20 border border-white/10 
                                       hover:border-red-500/50 transition-all flex items-center justify-center gap-2"
                        >
                            <Zap className="w-5 h-5" />
                            Enter Black Account
                        </button>
                    </div>
                )}

                {/* Legend */}
                <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Trade Markers</h4>
                    <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-green-400" />
                            </div>
                            <span className="text-sm">BUY - Entry Point</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                                <TrendingDown className="w-4 h-4 text-red-400" />
                            </div>
                            <span className="text-sm">SELL - Exit Point</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientPortal;
