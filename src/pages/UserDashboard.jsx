
import React, { useState } from 'react';
import { ArrowLeft, Send, Shield, Smartphone, Globe, CreditCard, Check, X, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

const UserDashboard = () => {
    const navigate = useNavigate();
    const [amount, setAmount] = useState('');
    const [recipient, setRecipient] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);

    // Toggles for simulation
    const [useVpn, setUseVpn] = useState(false);
    const [newDevice, setNewDevice] = useState(false);
    const [rapidVelocity, setRapidVelocity] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!amount || !recipient) return;

        setLoading(true);

        // Convert rapid velocity to logic if needed, but for now flags are passed
        const txData = {
            amount: parseFloat(amount),
            recipient,
            flags: { useVpn, newDevice, rapidVelocity },
            timestamp: new Date().toISOString()
        };

        try {
            const res = await fetch('/api/transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(txData)
            });
            const result = await res.json();

            setHistory(prev => [result, ...prev]);
            setAmount('');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 selection:bg-white selection:text-black">
            <nav className="max-w-xl mx-auto flex items-center justify-between mb-12">
                <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Exit Demo
                </button>
                <div className="font-bold tracking-tight text-lg">CLIENT PORTAL</div>
            </nav>

            <div className="max-w-xl mx-auto space-y-12">
                <div className="glass-panel p-10 rounded-[2.5rem] border border-white/10 relative overflow-hidden shadow-2xl shadow-white/5">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                    <h2 className="text-center text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-10">Initiate Transfer</h2>

                    <form onSubmit={handleSend} className="space-y-10">
                        <div className="text-center group">
                            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-4 group-focus-within:text-white transition-colors">Amount (USD)</label>
                            <div className="relative inline-block">
                                <span className="absolute left-[-1.5rem] top-1/2 -translate-y-1/2 text-4xl text-slate-700 font-light">$</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="bg-transparent text-6xl font-extralight text-center w-64 focus:outline-none placeholder-slate-800 text-white transition-all"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2 text-center">Recipient</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['Friend (Alex)', 'Merchant (Shop)', 'Unknown (Mule)'].map(r => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setRecipient(r)}
                                        className={clsx(
                                            "p-4 rounded-2xl border text-xs font-medium transition-all duration-300",
                                            recipient === r
                                                ? "bg-white text-black border-white shadow-lg shadow-white/10 scale-105"
                                                : "bg-white/[0.03] border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10"
                                        )}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-5 pt-8 border-t border-white/5">
                            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2">
                                <Shield className="w-3 h-3" /> Simulation Triggers (Inject Risk)
                            </label>
                            <div className="flex gap-4 justify-center">
                                <Toggle label="VPN / Proxy" icon={Globe} active={useVpn} onClick={() => setUseVpn(!useVpn)} />
                                <Toggle label="New Device" icon={Smartphone} active={newDevice} onClick={() => setNewDevice(!newDevice)} />
                                <Toggle label="Rapid Velocity" icon={Zap} active={rapidVelocity} onClick={() => setRapidVelocity(!rapidVelocity)} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!amount || !recipient || loading}
                            className="w-full py-5 rounded-2xl bg-white text-black font-bold text-lg hover:bg-slate-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-8 relative overflow-hidden group shadow-xl shadow-white/5"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                            {loading ? (
                                <span className="flex items-center justify-center gap-2 animate-pulse"><Zap className="w-5 h-5 animate-spin" /> Processing...</span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">Send Funds <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
                            )}
                        </button>
                    </form>
                </div>

                {/* Live History Feed */}
                <div className="space-y-4 animate-slide-up">
                    <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest pl-4">Recent Attempts</h3>
                    {history.length === 0 ? (
                        <div className="text-center p-12 rounded-3xl border border-white/5 bg-white/[0.02] text-slate-600 italic text-sm">
                            Launch a transaction to test the AI Guardian.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map((tx, i) => (
                                <div key={i} className="glass-panel p-5 rounded-2xl flex items-center justify-between animate-fade-in border border-white/5 hover:bg-white/[0.04] transition-colors">
                                    <div className="flex items-center gap-5">
                                        <div className={clsx("p-3 rounded-xl", tx.decision === 'APPROVED' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                                            {tx.decision === 'APPROVED' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white text-lg">${tx.amount.toLocaleString()} <span className="text-slate-500 text-sm">to</span> {tx.recipient.split(' ')[0]}</div>
                                            <div className="text-xs text-slate-500 font-mono mt-1">{new Date(tx.timestamp).toLocaleTimeString()}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={clsx("text-xs font-bold tracking-wider px-2 py-1 rounded", tx.decision === 'APPROVED' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                                            {tx.decision}
                                        </div>
                                        {tx.reason && <div className="text-[10px] text-slate-400 mt-2 max-w-[120px] leading-tight text-right uppercase tracking-wide">{tx.reason.replace(/_/g, ' ')}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Toggle = ({ label, icon: Icon, active, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={clsx(
            "flex flex-col items-center gap-3 p-4 rounded-2xl border w-28 transition-all duration-300",
            active
                ? "bg-slate-800 border-slate-600 text-white shadow-lg shadow-black/50 transform scale-105"
                : "bg-transparent border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400"
        )}
    >
        <Icon className={clsx("w-6 h-6 transition-transform duration-300", active && "scale-110")} />
        <span className="text-[10px] font-bold text-center leading-tight uppercase tracking-wide">{label}</span>
    </button>
);

export default UserDashboard;
