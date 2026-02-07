
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Zap, Globe, Lock, ArrowRight, Activity, Shield, Eye, TrendingUp, Users, CheckCircle, XCircle, BarChart3, Network, Brain, Clock, Award, ChevronRight } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden relative selection:bg-white selection:text-black">
            {/* Abstract Background */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/[0.02] rounded-full blur-[150px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/[0.015] rounded-full blur-[120px]"></div>
                <div className="absolute top-[50%] left-[30%] w-[25%] h-[25%] bg-slate-800/[0.03] rounded-full blur-[100px]"></div>
                {/* Grid overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
            </div>

            {/* Navigation */}
            <nav className="relative z-20 px-8 py-6 flex justify-between items-center max-w-7xl mx-auto">
                <div className="flex items-center gap-3 font-bold tracking-tighter text-xl">
                    <div className="p-2 rounded-lg bg-white">
                        <ShieldCheck className="w-5 h-5 text-black" />
                    </div>
                    <span>AI GUARDIAN</span>
                </div>
                <div className="hidden md:flex gap-10 text-sm font-medium text-slate-400">
                    <a href="#features" className="hover:text-white transition-colors">Features</a>
                    <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
                    <a href="#stats" className="hover:text-white transition-colors">Performance</a>
                    <a href="#demo" className="hover:text-white transition-colors">Try Demo</a>
                </div>
                <button
                    onClick={() => navigate('/login')}
                    className="px-6 py-2.5 rounded-full bg-white text-black hover:bg-slate-200 transition-all text-sm font-bold"
                >
                    System Login
                </button>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 pt-24 pb-32 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-10 animate-fade-in">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300 uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live Fraud Detection System
                        </div>

                        <h1 className="text-6xl md:text-7xl lg:text-8xl font-extralight tracking-tight leading-[0.95]">
                            Instant<br />Trust.
                            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-400 to-slate-600 font-bold">
                                Zero Friction.
                            </span>
                        </h1>

                        <p className="text-xl text-slate-400 max-w-lg leading-relaxed font-light">
                            Our AI approves legitimate payments in <span className="text-white font-medium">milliseconds</span> while detecting sophisticated fraud rings with <span className="text-white font-medium">surgical precision</span>.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button
                                onClick={() => navigate('/client')}
                                className="px-10 py-5 rounded-2xl bg-white text-black font-bold text-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-3 group shadow-2xl shadow-white/10"
                            >
                                Launch Demo
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="px-10 py-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-medium backdrop-blur-sm"
                            >
                                Admin Console
                            </button>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex gap-10 pt-8 border-t border-white/10">
                            <div>
                                <div className="text-4xl font-light text-white">99.7%</div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Accuracy</div>
                            </div>
                            <div>
                                <div className="text-4xl font-light text-white">&lt;50ms</div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Latency</div>
                            </div>
                            <div>
                                <div className="text-4xl font-light text-white">24/7</div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Monitoring</div>
                            </div>
                        </div>
                    </div>

                    {/* Abstract Dashboard Preview */}
                    <div className="relative h-[600px] w-full hidden lg:block">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent rounded-[2rem] border border-white/10 backdrop-blur-sm p-8 transform perspective-1000 rotate-y-6 hover:rotate-y-3 transition-transform duration-700">
                            {/* Mock Dashboard UI */}
                            <div className="space-y-6">
                                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/10"></div>
                                        <div className="w-24 h-3 bg-white/10 rounded"></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10"></div>
                                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10"></div>
                                    </div>
                                </div>

                                {/* Stats Row */}
                                <div className="grid grid-cols-3 gap-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5">
                                            <div className="w-8 h-8 rounded-lg bg-white/10 mb-3"></div>
                                            <div className="w-16 h-4 bg-white/10 rounded mb-2"></div>
                                            <div className="w-10 h-2 bg-white/5 rounded"></div>
                                        </div>
                                    ))}
                                </div>

                                {/* Transaction List */}
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-slate-800"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="w-32 h-3 bg-white/10 rounded"></div>
                                            <div className="w-20 h-2 bg-white/5 rounded"></div>
                                        </div>
                                        <div className={`w-16 h-6 rounded-lg ${i === 2 ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}></div>
                                    </div>
                                ))}
                            </div>

                            {/* Floating Accuracy Badge */}
                            <div className="absolute -bottom-8 -left-8 p-6 rounded-2xl bg-black border border-white/20 shadow-2xl flex items-center gap-4 animate-bounce-slow">
                                <div className="p-3 bg-white text-black rounded-xl">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Detection Rate</div>
                                    <div className="text-2xl font-bold">99.7%</div>
                                </div>
                            </div>

                            {/* Floating Alert Badge */}
                            <div className="absolute -top-4 -right-4 p-4 rounded-xl bg-red-950 border border-red-500/30 shadow-xl flex items-center gap-3">
                                <XCircle className="w-5 h-5 text-red-500" />
                                <span className="text-sm font-medium text-red-400">Fraud Blocked</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trusted By Section */}
            <section className="py-16 border-y border-white/5 bg-white/[0.01]">
                <div className="max-w-7xl mx-auto px-6">
                    <p className="text-center text-xs font-bold text-slate-600 uppercase tracking-[0.3em] mb-8">Trusted by Industry Leaders</p>
                    <div className="flex justify-center items-center gap-16 opacity-40">
                        {['FinTech Corp', 'Global Bank', 'SecurePay', 'TrustWallet', 'PayFlow'].map(name => (
                            <div key={name} className="text-lg font-bold tracking-tight">{name}</div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] mb-4">Capabilities</p>
                        <h2 className="text-5xl font-light mb-6">Built for the Modern Threat Landscape</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto text-lg">Our multi-layered approach combines deterministic rules, machine learning, and graph analytics to stop fraud before it happens.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureCard
                            icon={Zap}
                            title="Real-Time Decisioning"
                            desc="Sub-50ms approval for 95% of transactions using advanced risk scoring and velocity checks."
                        />
                        <FeatureCard
                            icon={Network}
                            title="Fraud Ring Detection"
                            desc="Graph-based analytics identify organized crime by linking devices, IPs, and behavioral fingerprints."
                        />
                        <FeatureCard
                            icon={Brain}
                            title="Explainable AI"
                            desc="Every decision includes a plain-English explanation generated by our LLM reasoning layer."
                        />
                        <FeatureCard
                            icon={Eye}
                            title="Pattern Recognition"
                            desc="Detects velocity abuse, account takeover, and structuring patterns in real-time."
                        />
                        <FeatureCard
                            icon={Shield}
                            title="Adaptive Learning"
                            desc="System learns from analyst feedback to continuously improve detection accuracy."
                        />
                        <FeatureCard
                            icon={Clock}
                            title="Instant Escalation"
                            desc="Medium-risk transactions are queued for human review with all context pre-loaded."
                        />
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-32 px-6 bg-white/[0.01] border-y border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] mb-4">Process</p>
                        <h2 className="text-5xl font-light mb-6">How It Works</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { step: '01', title: 'Transaction Received', desc: 'Payment request enters the system with full context.' },
                            { step: '02', title: 'Risk Engine Analysis', desc: 'Real-time scoring using 100+ risk signals and ML models.' },
                            { step: '03', title: 'Graph Enrichment', desc: 'Entity relationships checked against known fraud networks.' },
                            { step: '04', title: 'Decision & Explanation', desc: 'Approve, escalate, or block with full AI-generated rationale.' },
                        ].map((item, i) => (
                            <div key={i} className="relative group">
                                <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all h-full">
                                    <div className="text-6xl font-extralight text-white/10 mb-4">{item.step}</div>
                                    <h3 className="text-lg font-medium mb-3">{item.title}</h3>
                                    <p className="text-sm text-slate-400">{item.desc}</p>
                                </div>
                                {i < 3 && <ChevronRight className="hidden md:block absolute top-1/2 -right-4 w-8 h-8 text-white/10 transform -translate-y-1/2" />}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section id="stats" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <StatCard value="$2.4B" label="Protected Annually" />
                        <StatCard value="12M+" label="Decisions Per Day" />
                        <StatCard value="99.7%" label="Detection Accuracy" />
                        <StatCard value="<50ms" label="Average Latency" />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section id="demo" className="py-32 px-6 border-t border-white/5">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-5xl font-light mb-8">Experience the Future of Fraud Prevention</h2>
                    <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
                        Launch our interactive demo to see how the AI Guardian processes transactions in real-time.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                        <button
                            onClick={() => navigate('/client')}
                            className="p-8 rounded-2xl bg-white text-black hover:bg-slate-200 transition-all group"
                        >
                            <Users className="w-10 h-10 mx-auto mb-4" />
                            <div className="text-lg font-bold mb-2">Client Portal</div>
                            <p className="text-sm text-slate-600">Simulate sending transactions</p>
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                        >
                            <BarChart3 className="w-10 h-10 mx-auto mb-4" />
                            <div className="text-lg font-bold mb-2">Admin Console</div>
                            <p className="text-sm text-slate-400">Monitor fraud detection</p>
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/5">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5" />
                        <span className="font-bold">AI GUARDIAN</span>
                    </div>
                    <p className="text-xs text-slate-600">© 2026 AI Guardian. Built for the Hackathon Demo.</p>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon: Icon, title, desc }) => (
    <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all group">
        <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors">
            <Icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-xl font-medium mb-3">{title}</h3>
        <p className="text-slate-400 leading-relaxed text-sm">{desc}</p>
    </div>
);

const StatCard = ({ value, label }) => (
    <div className="text-center p-8 rounded-2xl bg-white/[0.02] border border-white/5">
        <div className="text-5xl font-light text-white mb-2">{value}</div>
        <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
    </div>
);

export default LandingPage;
