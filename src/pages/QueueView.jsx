import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle, Filter, DollarSign } from 'lucide-react';

const QueueView = () => {
    const [payouts, setPayouts] = useState([]);
    const [filter, setFilter] = useState('PENDING_REVIEW');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPayouts = async () => {
            const res = await fetch('http://localhost:3000/api/payouts');
            setPayouts(await res.json());
        };
        fetchPayouts();
        const interval = setInterval(fetchPayouts, 5000);
        return () => clearInterval(interval);
    }, []);

    const filteredPayouts = payouts.filter(p => {
        if (filter === 'ALL') return true;
        return p.status === filter;
    });

    const StatusBadge = ({ status }) => {
        const config = {
            APPROVED: { bg: 'bg-emerald-400/10', text: 'text-emerald-400', icon: CheckCircle },
            BLOCKED: { bg: 'bg-red-400/10', text: 'text-red-400', icon: XCircle },
            PENDING_REVIEW: { bg: 'bg-amber-400/10', text: 'text-amber-400', icon: AlertTriangle },
            PROCESSING: { bg: 'bg-blue-400/10', text: 'text-blue-400', icon: DollarSign }
        };
        const c = config[status] || config.PENDING_REVIEW;
        const Icon = c.icon;
        return (
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${c.bg} ${c.text} text-xs font-medium`}>
                <Icon className="w-3 h-3" /> {status}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-light">Payout Queue</h1>
                    <p className="text-slate-500">Manage and audit withdrawal requests</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 border-b border-white/10 pb-4">
                {[
                    { key: 'PENDING_REVIEW', label: 'Pending Review' },
                    { key: 'APPROVED', label: 'Approved' },
                    { key: 'BLOCKED', label: 'Blocked' },
                    { key: 'ALL', label: 'All Payouts' }
                ].map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-4 py-2 rounded-xl text-sm transition-all ${filter === f.key ? 'bg-white text-black font-medium' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Payouts Table */}
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-black/20">
                        <tr className="text-xs text-slate-500 text-left uppercase tracking-wider">
                            <th className="p-4 pl-6">Request Time</th>
                            <th className="p-4">Trader</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Method</th>
                            <th className="p-4">Risk Score</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredPayouts.map(payout => (
                            <tr
                                key={payout.payout_id}
                                className="group hover:bg-white/5 transition-colors cursor-pointer"
                                onClick={() => navigate(`/cases/${payout.payout_id}`)}
                            >
                                <td className="p-4 pl-6 text-sm text-slate-400">
                                    {new Date(payout.created_at).toLocaleString()}
                                </td>
                                <td className="p-4 text-sm font-medium text-white">
                                    {payout.trader_id}
                                </td>
                                <td className="p-4 text-sm font-light text-white text-lg">
                                    ${payout.amount?.toLocaleString()}
                                </td>
                                <td className="p-4 text-xs text-slate-500 font-mono">
                                    {payout.method}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${payout.risk_score > 0.8 ? 'bg-red-500' :
                                                        payout.risk_score > 0.5 ? 'bg-amber-500' : 'bg-emerald-500'
                                                    }`}
                                                style={{ width: `${payout.risk_score * 100}%` }}
                                            />
                                        </div>
                                        <span className={`text-xs font-bold ${payout.risk_score > 0.8 ? 'text-red-400' :
                                                payout.risk_score > 0.5 ? 'text-amber-400' : 'text-emerald-400'
                                            }`}>{(payout.risk_score * 100).toFixed(0)}%</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <StatusBadge status={payout.status} />
                                </td>
                                <td className="p-4">
                                    <button className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/20 text-xs transition-colors border border-white/10 group-hover:border-white/30">
                                        Review Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredPayouts.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-12 text-center text-slate-500">
                                    No payouts found in this category.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default QueueView;
