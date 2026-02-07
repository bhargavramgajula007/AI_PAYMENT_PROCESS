import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ShieldCheck, ShieldAlert, Clock, DollarSign, Users, Activity,
    TrendingUp, AlertTriangle, CheckCircle, XCircle, BrainCircuit,
    ExternalLink, Database, Cpu
} from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [payouts, setPayouts] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, alertsRes, payoutsRes] = await Promise.all([
                    fetch('http://localhost:3000/api/stats'),
                    fetch('http://localhost:3000/api/alerts'),
                    fetch('http://localhost:3000/api/payouts')
                ]);
                setStats(await statsRes.json());
                setAlerts(await alertsRes.json());
                setPayouts(await payoutsRes.json());
            } catch (e) {
                console.error(e);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const pendingPayouts = payouts.filter(p => p.status === 'PENDING_REVIEW');

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-light tracking-tight">Fraud Detection Center</h1>
                    <p className="text-slate-500 mt-1">Enterprise ML-powered payout monitoring</p>
                </div>
                <a
                    href="/client"
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm transition-all"
                >
                    <ExternalLink className="w-4 h-4" />
                    Open Client Portal
                </a>
            </div>

            {/* Model Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                    <div className="flex items-center gap-3 mb-3">
                        <BrainCircuit className="w-5 h-5 text-indigo-400" />
                        <span className="text-xs text-indigo-300 uppercase tracking-wider font-medium">ML Engine</span>
                    </div>
                    <div className="text-2xl font-light text-white">{stats?.model?.accuracy || 'Training...'}</div>
                    <div className="text-xs text-slate-500 mt-1">Model Accuracy</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                        <Database className="w-5 h-5 text-slate-400" />
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Patterns</span>
                    </div>
                    <div className="text-2xl font-light">{stats?.model?.total_patterns || 0}</div>
                    <div className="text-xs text-slate-500 mt-1">Fraud signatures loaded</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                        <Cpu className="w-5 h-5 text-slate-400" />
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Learned</span>
                    </div>
                    <div className="text-2xl font-light">{stats?.model?.learned_patterns || 0}</div>
                    <div className="text-xs text-slate-500 mt-1">Patterns from feedback</div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                        <Users className="w-5 h-5 text-slate-400" />
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Clients</span>
                    </div>
                    <div className="text-2xl font-light">{stats?.simulation?.total_clients || 0}</div>
                    <div className="text-xs text-slate-500 mt-1">{stats?.simulation?.suspicious_clients || 0} suspicious</div>
                </div>
            </div>

            {/* Payout Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <Clock className="w-6 h-6 text-amber-400" />
                        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">REQUIRES REVIEW</span>
                    </div>
                    <div className="text-4xl font-light text-white">{stats?.payouts?.pending || 0}</div>
                    <div className="text-sm text-slate-400 mt-2">Pending Payouts</div>
                </div>
                <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <XCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="text-4xl font-light text-red-400">{stats?.payouts?.blocked || 0}</div>
                    <div className="text-sm text-slate-400 mt-2">Blocked by Engine</div>
                </div>
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="text-4xl font-light text-emerald-400">{stats?.payouts?.approved || 0}</div>
                    <div className="text-sm text-slate-400 mt-2">Approved Payouts</div>
                </div>
            </div>

            {/* Pending Payouts Queue */}
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h2 className="font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        Pending Review Queue
                    </h2>
                    <Link to="/queue" className="text-sm text-slate-400 hover:text-white transition-colors">
                        View All →
                    </Link>
                </div>
                <div className="divide-y divide-white/5">
                    {pendingPayouts.slice(0, 5).map(payout => (
                        <Link
                            key={payout.payout_id}
                            to={`/cases/${payout.payout_id}`}
                            className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${payout.risk_score > 0.7 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                                    }`}>
                                    <ShieldAlert className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-medium">{payout.trader_id}</div>
                                    <div className="text-xs text-slate-500">
                                        ${payout.amount?.toLocaleString()} • {payout.risk_flags?.slice(0, 2).join(', ')}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-sm font-bold ${payout.risk_score > 0.7 ? 'text-red-400' : 'text-amber-400'
                                    }`}>
                                    {(payout.risk_score * 100).toFixed(0)}% Risk
                                </div>
                                <div className="text-xs text-slate-500">
                                    {payout.auto_generated ? 'Auto-generated' : 'Manual'}
                                </div>
                            </div>
                        </Link>
                    ))}
                    {pendingPayouts.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            No pending payouts requiring review
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Alerts */}
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10">
                    <h2 className="font-medium">Recent Alerts</h2>
                </div>
                <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
                    {alerts.slice(0, 10).map(alert => (
                        <div key={alert.alert_id} className="p-3 flex items-center gap-3 text-sm">
                            <span className={`w-2 h-2 rounded-full ${alert.severity === 'CRITICAL' ? 'bg-red-500' :
                                    alert.severity === 'HIGH' ? 'bg-orange-500' : 'bg-amber-500'
                                }`}></span>
                            <span className="flex-1 text-slate-300">{alert.message}</span>
                            <span className="text-xs text-slate-500">
                                {new Date(alert.created_at).toLocaleTimeString()}
                            </span>
                        </div>
                    ))}
                    {alerts.length === 0 && (
                        <div className="p-4 text-center text-slate-500 text-sm">No alerts</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
