import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, TrendingDown, LogOut, Activity,
    ChevronUp, ChevronDown, Wallet, LayoutDashboard,
    ArrowRight, Timer, Brain, AlertTriangle, CheckCircle, Target
} from 'lucide-react';

const TradingPortal = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [view, setView] = useState('trading'); // 'trading', 'cashout', 'brain'
    const [stocks, setStocks] = useState({});
    const [selectedStock, setSelectedStock] = useState('NVDA');
    const [quantity, setQuantity] = useState(50);
    const [priceHistory, setPriceHistory] = useState({});
    const [positions, setPositions] = useState([]);
    const [aiAutoTrade, setAiAutoTrade] = useState(false);
    const [balance, setBalance] = useState(user?.account?.balance || 50000);
    const [totalPnL, setTotalPnL] = useState(0);
    const [aiStats, setAiStats] = useState({ trades: 0, wins: 0, losses: 0, totalProfit: 0, totalLoss: 0 });

    // Cashout State
    const [cashoutAmount, setCashoutAmount] = useState('');
    const [cashoutMethod, setCashoutMethod] = useState('crypto');
    const [payoutResult, setPayoutResult] = useState(null);
    const [processingPayout, setProcessingPayout] = useState(false);

    // Live Trade Feedback
    const [tradeFeedback, setTradeFeedback] = useState(null);

    // Brain Data
    const [brainData, setBrainData] = useState(null);
    const [loadingBrain, setLoadingBrain] = useState(false);

    const aiIntervalRef = useRef(null);

    // Fetch stock prices
    const fetchStocks = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:3000/api/stocks');
            const data = await res.json();
            setStocks(data);

            setPriceHistory(prev => {
                const newHistory = { ...prev };
                Object.entries(data).forEach(([symbol, price]) => {
                    if (!newHistory[symbol]) newHistory[symbol] = [];
                    newHistory[symbol] = [...newHistory[symbol].slice(-29), { price, time: Date.now() }];
                });
                return newHistory;
            });
        } catch (e) {
            console.error('Failed to fetch stocks:', e);
        }
    }, []);

    // Fetch brain data when brain view is selected
    const fetchBrainData = useCallback(async () => {
        if (!user?.account?.id && !user?.id) return;
        setLoadingBrain(true);
        try {
            const res = await fetch(`http://localhost:3000/api/trader/brain/${user?.account?.id || user?.id}`);
            const data = await res.json();
            if (data.success) {
                setBrainData(data.brain);
            }
        } catch (e) {
            console.error('Failed to fetch brain:', e);
        }
        setLoadingBrain(false);
    }, [user]);

    useEffect(() => {
        fetchStocks();
        const interval = setInterval(fetchStocks, 2000);
        return () => clearInterval(interval);
    }, [fetchStocks]);

    useEffect(() => {
        if (view === 'brain') {
            fetchBrainData();
        }
    }, [view, fetchBrainData]);

    // Live trade feedback - analyze after each trade
    const analyzeTradeInRealTime = async (trade) => {
        try {
            const res = await fetch('http://localhost:3000/api/trade/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trade, traderId: user?.account?.id || user?.id })
            });
            const data = await res.json();
            if (data.success) {
                setTradeFeedback({
                    trade,
                    analysis: data.analysis,
                    timestamp: Date.now()
                });
                // Auto-clear after 10 seconds
                setTimeout(() => setTradeFeedback(null), 10000);
            }
        } catch (e) {
            console.error('Trade analysis failed:', e);
        }
    };

    // AI Auto-Trading Logic
    useEffect(() => {
        if (aiAutoTrade) {
            aiIntervalRef.current = setInterval(() => {
                const symbols = Object.keys(stocks);
                if (symbols.length === 0) return;

                const symbol = Math.random() > 0.5 ? selectedStock : symbols[Math.floor(Math.random() * symbols.length)];
                const currentPrice = stocks[symbol] || 500;

                const qty = Math.floor(Math.random() * 100) + 50;
                const fakeEntryPrice = currentPrice * (0.93 + Math.random() * 0.05);
                const profitPercent = 0.05 + Math.random() * 0.10;
                const fakePnL = fakeEntryPrice * qty * profitPercent;

                setBalance(b => b + fakePnL);
                setTotalPnL(t => t + fakePnL);

                setAiStats(prev => ({
                    trades: prev.trades + 1,
                    wins: prev.wins + 1,
                    losses: prev.losses,
                    totalProfit: prev.totalProfit + fakePnL,
                    totalLoss: prev.totalLoss
                }));

                const fakePos = {
                    id: Date.now(),
                    symbol,
                    type: 'LONG',
                    quantity: qty,
                    entryPrice: parseFloat(fakeEntryPrice.toFixed(2)),
                    exitPrice: currentPrice,
                    entryTime: Date.now() - 5000,
                    exitTime: Date.now(),
                    closed: true,
                    pnl: parseFloat(fakePnL.toFixed(2)),
                    isAiTrade: true
                };
                setPositions(prev => [...prev, fakePos]);

                // Analyze AI trade
                analyzeTradeInRealTime(fakePos);

                fetch('http://localhost:3000/api/trade', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        trader_id: user?.account?.id || 'AI-BOT',
                        trader_name: 'AI Auto-Trader',
                        symbol,
                        type: 'SELL',
                        quantity: qty
                    })
                }).catch(() => { });

            }, 3000);
        } else if (aiIntervalRef.current) {
            clearInterval(aiIntervalRef.current);
        }

        return () => {
            if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
        };
    }, [aiAutoTrade, stocks, selectedStock, user]);

    const executeTrade = async (type, symbol, qty) => {
        const price = stocks[symbol];
        const cost = price * qty;

        if (type === 'BUY') {
            if (cost > balance) return;
            setBalance(prev => prev - cost);

            const newPos = {
                id: Date.now(),
                symbol,
                type: 'LONG',
                quantity: qty,
                entryPrice: price,
                entryTime: Date.now(),
                closed: false
            };
            setPositions(prev => [...prev, newPos]);

            await fetch('http://localhost:3000/api/trade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    trader_id: user?.account?.id || 'USER-DEMO',
                    trader_name: user?.name || 'Demo',
                    symbol, type, quantity: qty
                })
            });
        }
    };

    const closePosition = (posId, exitPrice) => {
        setPositions(prev => prev.map(p => {
            if (p.id === posId && !p.closed) {
                const pnl = (exitPrice - p.entryPrice) * p.quantity;
                const exitValue = exitPrice * p.quantity;

                setTotalPnL(t => t + pnl);
                setBalance(b => b + exitValue);

                const closedPos = { ...p, closed: true, exitPrice, exitTime: Date.now(), pnl };

                // Analyze the closed trade
                analyzeTradeInRealTime(closedPos);

                return closedPos;
            }
            return p;
        }));
    };

    const handleBuy = () => executeTrade('BUY', selectedStock, quantity);
    const handleSell = () => {
        const openPos = positions.find(p => p.symbol === selectedStock && !p.closed);
        if (openPos) closePosition(openPos.id, stocks[selectedStock]);
    };

    const handleLogout = () => {
        logout();
        navigate('/client');
    };

    const handleCashout = async (e) => {
        e.preventDefault();
        setProcessingPayout(true);
        setPayoutResult(null);

        try {
            const res = await fetch('http://localhost:3000/api/payout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    trader_id: user?.account?.id || user.id,
                    amount: parseFloat(cashoutAmount),
                    method: cashoutMethod,
                    device_id: 'BROWSER-DEV',
                    ip: '127.0.0.1',
                    country: 'US'
                })
            });
            const data = await res.json();
            setPayoutResult(data);
            if (data.status === 'APPROVED') {
                setBalance(prev => prev - parseFloat(cashoutAmount));
            }
        } catch (err) {
            console.error('Payout failed:', err);
        } finally {
            setProcessingPayout(false);
        }
    };

    // Simple Chart
    const MiniChart = ({ symbol, data }) => {
        const history = data || [];
        if (history.length < 2) return <div className="h-20 flex items-center justify-center text-white/20 text-xs">Loading...</div>;

        const prices = history.map(h => h.price);
        const min = Math.min(...prices) * 0.998;
        const max = Math.max(...prices) * 1.002;
        const range = max - min;
        const width = 280;
        const height = 80;

        const points = history.map((h, i) => {
            const x = (i / (history.length - 1)) * width;
            const y = height - ((h.price - min) / range) * height;
            return `${x},${y}`;
        }).join(' ');

        const isUp = prices[prices.length - 1] > prices[0];

        return (
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20">
                <defs>
                    <linearGradient id={`chartGrad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isUp ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'} />
                        <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                </defs>
                <polygon
                    points={`0,${height} ${points} ${width},${height}`}
                    fill={`url(#chartGrad-${symbol})`}
                />
                <polyline
                    points={points}
                    fill="none"
                    stroke={isUp ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)'}
                    strokeWidth="1.5"
                />
            </svg>
        );
    };

    const openPositions = positions.filter(p => !p.closed);
    const closedPositions = positions.filter(p => p.closed);

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden">
            {/* Sidebar */}
            <div className="w-56 border-r border-white/5 flex flex-col">
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-10">
                        <div className="w-6 h-6 border border-white/20 flex items-center justify-center">
                            <TrendingUp className="w-3 h-3" />
                        </div>
                        <span className="text-xs tracking-[0.2em] uppercase">TradePro</span>
                    </div>

                    <nav className="space-y-1">
                        <button
                            onClick={() => setView('trading')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs tracking-wider uppercase transition-all ${view === 'trading'
                                    ? 'text-white bg-white/5 border-l-2 border-white'
                                    : 'text-white/40 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Terminal
                        </button>
                        <button
                            onClick={() => setView('cashout')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs tracking-wider uppercase transition-all ${view === 'cashout'
                                    ? 'text-white bg-white/5 border-l-2 border-white'
                                    : 'text-white/40 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Wallet className="w-4 h-4" />
                            Withdraw
                        </button>
                        <button
                            onClick={() => setView('brain')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs tracking-wider uppercase transition-all ${view === 'brain'
                                    ? 'text-white bg-white/5 border-l-2 border-white'
                                    : 'text-white/40 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Brain className="w-4 h-4" />
                            Patterns
                        </button>
                    </nav>
                </div>

                {/* User */}
                <div className="mt-auto p-6 border-t border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 border border-white/10 flex items-center justify-center text-xs">
                            {user?.name?.[0] || 'U'}
                        </div>
                        <div>
                            <div className="text-xs">{user?.name || 'User'}</div>
                            <div className="text-[10px] text-white/30 uppercase tracking-wider">{user?.role || 'Client'}</div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/30 hover:text-white transition-colors"
                    >
                        <LogOut className="w-3 h-3" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                {view === 'trading' ? (
                    <div className="p-8">
                        {/* Header Stats */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <p className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-1">Portfolio Value</p>
                                <div className="text-3xl font-light">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="text-right">
                                    <p className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-1">Session P&L</p>
                                    <div className={`text-xl font-light ${totalPnL >= 0 ? 'text-white' : 'text-white/50'}`}>
                                        {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setAiAutoTrade(!aiAutoTrade)}
                                    className={`px-4 py-2 text-xs tracking-wider uppercase border transition-all ${aiAutoTrade
                                            ? 'border-white bg-white text-black'
                                            : 'border-white/20 hover:border-white/40'
                                        }`}
                                >
                                    {aiAutoTrade ? 'AI Running' : 'Auto Trade'}
                                </button>
                            </div>
                        </div>

                        {/* Live Trade Feedback */}
                        {tradeFeedback && (
                            <div className="mb-6 p-4 border border-white/10 bg-white/5">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        {tradeFeedback.analysis?.verdict === 'GOOD' ? (
                                            <CheckCircle className="w-5 h-5 text-white/70" />
                                        ) : tradeFeedback.analysis?.verdict === 'BAD' ? (
                                            <AlertTriangle className="w-5 h-5 text-white/50" />
                                        ) : (
                                            <Target className="w-5 h-5 text-white/40" />
                                        )}
                                        <div>
                                            <p className="text-xs tracking-wider uppercase text-white/50 mb-1">Trade Analysis</p>
                                            <p className="text-sm">{tradeFeedback.analysis?.summary}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setTradeFeedback(null)} className="text-white/30 hover:text-white text-xs">✕</button>
                                </div>
                                {tradeFeedback.analysis?.improvement_tip && (
                                    <p className="mt-3 text-xs text-white/40 pl-8">
                                        → {tradeFeedback.analysis.improvement_tip}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-6">
                            {/* Chart & Trading Panel */}
                            <div className="col-span-2 space-y-6">
                                {/* Stock Selector */}
                                <div className="flex gap-2">
                                    {Object.keys(stocks).slice(0, 5).map(symbol => (
                                        <button
                                            key={symbol}
                                            onClick={() => setSelectedStock(symbol)}
                                            className={`px-4 py-2 text-xs tracking-wider border transition-all ${selectedStock === symbol
                                                    ? 'border-white bg-white text-black'
                                                    : 'border-white/10 text-white/50 hover:border-white/30'
                                                }`}
                                        >
                                            {symbol}
                                        </button>
                                    ))}
                                </div>

                                {/* Main Chart */}
                                <div className="border border-white/5 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <span className="text-2xl font-light">{selectedStock}</span>
                                            <span className="ml-4 text-lg text-white/50">${stocks[selectedStock]?.toFixed(2) || '0.00'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-white/30">
                                            <Timer className="w-3 h-3" />
                                            Live
                                        </div>
                                    </div>
                                    <MiniChart symbol={selectedStock} data={priceHistory[selectedStock]} />
                                </div>

                                {/* Trade Controls */}
                                <div className="border border-white/5 p-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <label className="text-xs text-white/30 uppercase tracking-wider">Quantity</label>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                            className="w-24 px-3 py-2 bg-transparent border border-white/10 text-sm focus:border-white/30 outline-none"
                                        />
                                        <span className="text-xs text-white/30">
                                            ≈ ${(quantity * (stocks[selectedStock] || 0)).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={handleBuy}
                                            className="flex-1 py-3 text-xs tracking-wider uppercase border border-white/20 hover:bg-white hover:text-black transition-all"
                                        >
                                            Buy {selectedStock}
                                        </button>
                                        <button
                                            onClick={handleSell}
                                            className="flex-1 py-3 text-xs tracking-wider uppercase border border-white/10 text-white/50 hover:border-white/30 hover:text-white transition-all"
                                        >
                                            Sell {selectedStock}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Positions */}
                            <div className="space-y-6">
                                {/* Open Positions */}
                                <div className="border border-white/5 p-4">
                                    <h3 className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-4">Open Positions</h3>
                                    {openPositions.length === 0 ? (
                                        <p className="text-xs text-white/20">No open positions</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {openPositions.map(pos => {
                                                const currentPrice = stocks[pos.symbol] || pos.entryPrice;
                                                const pnl = (currentPrice - pos.entryPrice) * pos.quantity;
                                                return (
                                                    <div key={pos.id} className="p-3 border border-white/5 hover:border-white/10 transition-colors">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="text-sm">{pos.symbol}</div>
                                                                <div className="text-[10px] text-white/30">{pos.quantity} @ ${pos.entryPrice.toFixed(2)}</div>
                                                            </div>
                                                            <div className={`text-right ${pnl >= 0 ? 'text-white' : 'text-white/40'}`}>
                                                                <div className="text-sm font-mono">{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}</div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => closePosition(pos.id, currentPrice)}
                                                            className="mt-2 w-full py-1.5 text-[10px] tracking-wider uppercase border border-white/10 hover:border-white/30 transition-colors"
                                                        >
                                                            Close
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Closed Positions */}
                                <div className="border border-white/5 p-4">
                                    <h3 className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-4">Recent Trades</h3>
                                    {closedPositions.length === 0 ? (
                                        <p className="text-xs text-white/20">No trades yet</p>
                                    ) : (
                                        <div className="space-y-1 max-h-60 overflow-y-auto">
                                            {closedPositions.slice(-8).reverse().map(pos => (
                                                <div key={pos.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                                                    <span className="text-xs">{pos.symbol}</span>
                                                    <span className={`text-xs font-mono ${pos.pnl >= 0 ? 'text-white' : 'text-white/40'}`}>
                                                        {pos.pnl >= 0 ? '+' : ''}{pos.pnl?.toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* AI Stats */}
                                {aiStats.trades > 0 && (
                                    <div className="border border-white/5 p-4">
                                        <h3 className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-4">AI Performance</h3>
                                        <div className="grid grid-cols-2 gap-4 text-center">
                                            <div>
                                                <div className="text-lg font-light">{aiStats.trades}</div>
                                                <div className="text-[10px] text-white/30 uppercase">Trades</div>
                                            </div>
                                            <div>
                                                <div className="text-lg font-light">{((aiStats.wins / aiStats.trades) * 100).toFixed(0)}%</div>
                                                <div className="text-[10px] text-white/30 uppercase">Win Rate</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : view === 'cashout' ? (
                    /* Cashout View */
                    <div className="p-8 max-w-lg">
                        <h1 className="text-2xl font-light mb-2">Withdraw</h1>
                        <p className="text-sm text-white/40 mb-8">Available: ${balance.toFixed(2)}</p>

                        <form onSubmit={handleCashout} className="space-y-6">
                            <div>
                                <label className="block text-xs tracking-widest uppercase text-white/30 mb-2">Amount</label>
                                <input
                                    type="number"
                                    value={cashoutAmount}
                                    onChange={(e) => setCashoutAmount(e.target.value)}
                                    className="w-full px-4 py-3 bg-transparent border border-white/10 focus:border-white/30 outline-none"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-xs tracking-widest uppercase text-white/30 mb-2">Method</label>
                                <select
                                    value={cashoutMethod}
                                    onChange={(e) => setCashoutMethod(e.target.value)}
                                    className="w-full px-4 py-3 bg-black border border-white/10 focus:border-white/30 outline-none"
                                >
                                    <option value="crypto">Crypto</option>
                                    <option value="bank">Bank Transfer</option>
                                    <option value="paypal">PayPal</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={processingPayout || !cashoutAmount}
                                className="w-full py-3 text-xs tracking-widest uppercase border border-white hover:bg-white hover:text-black disabled:opacity-30 transition-all"
                            >
                                {processingPayout ? 'Processing...' : 'Request Withdrawal'}
                            </button>
                        </form>

                        {payoutResult && (
                            <div className={`mt-6 p-4 border ${payoutResult.status === 'APPROVED' ? 'border-white/20' : 'border-white/10'}`}>
                                <div className="text-xs tracking-widest uppercase mb-2">{payoutResult.status}</div>
                                <div className="text-sm text-white/50">{payoutResult.reason || 'Withdrawal processed'}</div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Brain View - Patterns & Insights */
                    <div className="p-8">
                        <h1 className="text-2xl font-light mb-2">Trading Patterns</h1>
                        <p className="text-sm text-white/40 mb-8">Your recurring patterns and areas for improvement</p>

                        {loadingBrain ? (
                            <div className="text-white/30 text-sm">Analyzing patterns...</div>
                        ) : brainData ? (
                            <div className="space-y-8">
                                {/* Level */}
                                <div className="border border-white/5 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-1">Trader Level</p>
                                            <p className="text-xl font-light">{brainData.trader_level?.title || 'Beginner'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-light">{brainData.trader_level?.level || 1}</p>
                                        </div>
                                    </div>
                                    <div className="h-1 bg-white/5">
                                        <div
                                            className="h-full bg-white/30 transition-all"
                                            style={{ width: `${Math.min((brainData.trader_level?.xp || 0) / (brainData.trader_level?.nextLevel || 100) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-white/30 mt-2">{brainData.trader_level?.xp || 0} / {brainData.trader_level?.nextLevel || 100} XP</p>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-4 gap-4">
                                    {[
                                        { label: 'Total Trades', value: brainData.stats?.total_trades || 0 },
                                        { label: 'Win Rate', value: `${((brainData.stats?.win_rate || 0) * 100).toFixed(0)}%` },
                                        { label: 'Best Streak', value: brainData.stats?.max_win_streak || 0 },
                                        { label: 'Total P&L', value: `$${(brainData.stats?.total_pnl || 0).toFixed(0)}` }
                                    ].map((stat, i) => (
                                        <div key={i} className="border border-white/5 p-4 text-center">
                                            <div className="text-xl font-light mb-1">{stat.value}</div>
                                            <div className="text-[10px] tracking-wider uppercase text-white/30">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Common Mistakes */}
                                {brainData.common_mistakes?.length > 0 && (
                                    <div className="border border-white/5 p-6">
                                        <h3 className="text-xs tracking-[0.2em] uppercase text-white/50 mb-4">Patterns to Fix</h3>
                                        <div className="space-y-4">
                                            {brainData.common_mistakes.map((mistake, i) => (
                                                <div key={i} className="flex items-start gap-4">
                                                    <AlertTriangle className="w-4 h-4 text-white/30 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm">{mistake.pattern}</p>
                                                        <p className="text-xs text-white/40 mt-1">{mistake.suggestion}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Timeline */}
                                {brainData.timeline?.length > 0 && (
                                    <div className="border border-white/5 p-6">
                                        <h3 className="text-xs tracking-[0.2em] uppercase text-white/50 mb-4">Timeline</h3>
                                        <div className="space-y-3">
                                            {brainData.timeline.slice(0, 10).map((event, i) => (
                                                <div key={i} className="flex items-start gap-4 py-2 border-b border-white/5 last:border-0">
                                                    <span className="text-lg">{event.icon}</span>
                                                    <div className="flex-1">
                                                        <p className="text-sm">{event.event}</p>
                                                        <p className="text-xs text-white/30">{event.details}</p>
                                                    </div>
                                                    <span className="text-[10px] text-white/20">{new Date(event.date).toLocaleDateString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-white/30 text-sm">No trading data yet. Start trading to see your patterns.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TradingPortal;
