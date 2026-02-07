import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    TrendingUp, BarChart3, Shield, Zap, ArrowRight,
    Lock, Eye, EyeOff, ChevronRight
} from 'lucide-react';

const TradingLandingPage = () => {
    const [showLogin, setShowLogin] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/trading');
        }
    }, [user, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(username, password);
            navigate('/trading');
        } catch (err) {
            setError(err.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Grid Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:80px_80px]" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />
            </div>

            {/* Navigation */}
            <nav className="relative z-10 flex items-center justify-between px-12 py-8 max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border border-white/20 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4" />
                    </div>
                    <span className="text-lg font-light tracking-[0.2em] uppercase">TradePro</span>
                </div>

                <div className="hidden md:flex items-center gap-12 text-xs tracking-widest uppercase text-white/40">
                    <a href="/" className="hover:text-white transition-colors">AI Guardian</a>
                    <a href="/client" className="hover:text-white transition-colors">Demo</a>
                </div>

                <button
                    onClick={() => setShowLogin(true)}
                    className="text-xs tracking-widest uppercase border border-white/20 px-6 py-3 hover:bg-white hover:text-black transition-all"
                >
                    Sign In
                </button>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 max-w-7xl mx-auto px-12 pt-32 pb-40">
                <div className="max-w-3xl">
                    <p className="text-xs tracking-[0.3em] uppercase text-white/40 mb-8">
                        Institutional Grade Trading
                    </p>

                    <h1 className="text-6xl lg:text-8xl font-extralight leading-[0.9] mb-12 tracking-tight">
                        Execute
                        <br />
                        <span className="text-white/40">with precision</span>
                    </h1>

                    <p className="text-lg text-white/50 mb-16 max-w-lg leading-relaxed font-light">
                        A trading platform built for serious traders. Real-time analytics,
                        AI-powered insights, and institutional-grade security.
                    </p>

                    <div className="flex gap-6">
                        <button
                            onClick={() => navigate('/client')}
                            className="group flex items-center gap-4 text-sm tracking-widest uppercase border border-white px-8 py-4 hover:bg-white hover:text-black transition-all"
                        >
                            <span>Start Trading</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={() => setShowLogin(true)}
                            className="text-sm tracking-widest uppercase text-white/40 px-8 py-4 hover:text-white transition-all"
                        >
                            Login
                        </button>
                    </div>
                </div>

                {/* Stats - Right Side */}
                <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden xl:block">
                    <div className="space-y-12 text-right">
                        <div>
                            <div className="text-4xl font-extralight mb-1">$2.5B+</div>
                            <div className="text-xs tracking-widest uppercase text-white/30">Trading Volume</div>
                        </div>
                        <div>
                            <div className="text-4xl font-extralight mb-1">50ms</div>
                            <div className="text-xs tracking-widest uppercase text-white/30">Latency</div>
                        </div>
                        <div>
                            <div className="text-4xl font-extralight mb-1">99.99%</div>
                            <div className="text-xs tracking-widest uppercase text-white/30">Uptime</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Bar */}
            <section className="relative z-10 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-12">
                    <div className="grid grid-cols-2 md:grid-cols-4">
                        {[
                            { icon: <Zap className="w-4 h-4" />, label: 'Lightning Execution' },
                            { icon: <Shield className="w-4 h-4" />, label: 'AI Security' },
                            { icon: <BarChart3 className="w-4 h-4" />, label: 'Real-Time Data' },
                            { icon: <TrendingUp className="w-4 h-4" />, label: 'Smart Analytics' }
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="py-8 px-6 border-r border-white/5 last:border-r-0 flex items-center gap-4"
                            >
                                <div className="text-white/30">{item.icon}</div>
                                <span className="text-xs tracking-widest uppercase text-white/50">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 py-8">
                <div className="max-w-7xl mx-auto px-12 flex items-center justify-between">
                    <span className="text-xs text-white/20">© 2026 TradePro</span>
                    <span className="text-xs text-white/20">Demo for AI Payment Processing</span>
                </div>
            </footer>

            {/* Login Modal */}
            {showLogin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
                    <div className="w-full max-w-sm border border-white/10 bg-black p-10">
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-xs tracking-[0.3em] uppercase">Sign In</h2>
                            <button
                                onClick={() => setShowLogin(false)}
                                className="text-white/30 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label className="block text-xs tracking-widest uppercase text-white/30 mb-3">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-3 bg-transparent border border-white/10 focus:border-white/30 outline-none transition-colors text-sm"
                                    placeholder="Enter username"
                                />
                            </div>

                            <div>
                                <label className="block text-xs tracking-widest uppercase text-white/30 mb-3">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-transparent border border-white/10 focus:border-white/30 outline-none transition-colors text-sm pr-12"
                                        placeholder="Enter password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="text-xs text-red-400 py-2">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 border border-white text-xs tracking-widest uppercase hover:bg-white hover:text-black disabled:opacity-50 transition-all"
                            >
                                {loading ? 'Signing in...' : 'Continue'}
                            </button>
                        </form>

                        <div className="mt-10 pt-8 border-t border-white/5">
                            <p className="text-xs text-white/20 mb-4 uppercase tracking-widest">Demo Accounts</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                {[
                                    { u: 'john_trader', p: 'demo123' },
                                    { u: 'hft_mike', p: 'demo123' },
                                    { u: 'new_sarah', p: 'demo123' },
                                    { u: 'black_ops', p: 'shadow' }
                                ].map((cred, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => { setUsername(cred.u); setPassword(cred.p); }}
                                        className={`p-2 border ${cred.u === 'black_ops' ? 'border-red-500/30 text-red-400' : 'border-white/10 text-white/50'} hover:border-white/30 transition-colors`}
                                    >
                                        {cred.u}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TradingLandingPage;
