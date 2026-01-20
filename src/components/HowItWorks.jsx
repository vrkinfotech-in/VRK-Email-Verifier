import React from 'react';
import { motion } from 'framer-motion';

export default function HowItWorks({ onClose }) {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto text-white relative">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-16"
            >
                {/* Header */}
                <div className="text-center space-y-4">
                    <motion.h1
                        variants={item}
                        className="text-4xl md:text-5xl font-extrabold tracking-tight"
                    >
                        How <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400">VRK Email Verification</span> Works
                    </motion.h1>
                    <motion.p variants={item} className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Advanced multi-layer verification process for 95%+ accuracy. We ensure your email lists are clean and deliverable.
                    </motion.p>

                    <motion.button
                        variants={item}
                        onClick={onClose}
                        className="mt-8 px-8 py-3 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium transition-all group flex items-center gap-2 mx-auto"
                    >
                        <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        Back to Verifier
                    </motion.button>
                </div>

                {/* Stats Grid */}
                <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Accuracy", value: "95%+", color: "from-pink-500 to-rose-500" },
                        { label: "Average Speed", value: "1.5s", color: "from-blue-500 to-cyan-500" },
                        { label: "Disposable Blocked", value: "40+", color: "from-orange-500 to-amber-500" },
                        { label: "Confidence Score", value: "0-100%", color: "from-purple-500 to-violet-500" }
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-2xl text-center hover:border-slate-700 transition-colors">
                            <div className={`text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${stat.color} mb-1`}>
                                {stat.value}
                            </div>
                            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>

                {/* 6-Step Process */}
                <motion.div variants={item} className="space-y-8">
                    <div className="flex items-center justify-center gap-3">
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <h2 className="text-2xl font-bold text-white">Our 6-Step Verification Process</h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { title: "Syntax Validation", desc: "Validates email format and structure according to RFC standards.", icon: "✏️", color: "border-pink-500/20 bg-pink-500/5" },
                            { title: "Pattern Detection", desc: "Identifies fake, suspicious, and gibberish patterns.", icon: "🎯", color: "border-purple-500/20 bg-purple-500/5" },
                            { title: "DNS Verification", desc: "Confirms domain has active mail servers (MX records).", icon: "🌐", color: "border-blue-500/20 bg-blue-500/5" },
                            { title: "SMTP Detection", desc: "Multi-port SMTP attempts (25, 587, 2525) for deep verification.", icon: "📨", color: "border-emerald-500/20 bg-emerald-500/5" },
                            { title: "Catch-All Detection", desc: "Identifies domains accepting all email addresses (risky).", icon: "🔄", color: "border-orange-500/20 bg-orange-500/5" },
                            { title: "Confidence Scoring", desc: "Provides transparency with 0-100% certainty score.", icon: "📊", color: "border-cyan-500/20 bg-cyan-500/5" },
                        ].map((step, idx) => (
                            <div key={idx} className={`p-6 rounded-2xl border ${step.color} hover:bg-slate-800/50 transition-colors`}>
                                <div className="text-3xl mb-4">{step.icon}</div>
                                <h3 className="text-xl font-bold text-slate-200 mb-2">{step.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Confidence Guide */}
                <motion.div variants={item} className="space-y-8">
                    <div className="flex items-center justify-center gap-3">
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                        <h2 className="text-2xl font-bold text-white">Confidence Score Guide</h2>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4">
                        {[
                            { range: "85-100%", title: "HIGHEST CONFIDENCE", desc: "Direct SMTP verification successful.", color: "border-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-400" },
                            { range: "75-84%", title: "CONFIDENT", desc: "Domain verified, format acceptable, low risk.", color: "border-blue-500", bg: "bg-blue-500/10", text: "text-blue-400" },
                            { range: "60-74%", title: "MODERATE", desc: "Temporary issues or 'Unknown' blocks may be present.", color: "border-orange-500", bg: "bg-orange-500/10", text: "text-orange-400" },
                            { range: "Below 50%", title: "UNCERTAIN / BAD", desc: "Domain may accept any email or is unreachable.", color: "border-rose-500", bg: "bg-rose-500/10", text: "text-rose-400" }
                        ].map((guide, idx) => (
                            <div key={idx} className={`relative p-6 rounded-xl border-l-4 ${guide.color} bg-slate-900`}>
                                <div className={`text-2xl font-black ${guide.text} mb-1`}>{guide.range}</div>
                                <div className={`text-xs font-bold ${guide.text} uppercase mb-2`}>{guide.title}</div>
                                <p className="text-slate-400 text-xs">{guide.desc}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Use Cases */}
                <motion.div variants={item} className="space-y-8 pb-12">
                    <div className="flex items-center justify-center gap-3">
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        <h2 className="text-2xl font-bold text-white">Real-World Use Cases</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { title: "Email List Cleaning", desc: "Remove dead, invalid, and bouncing emails with 98% accuracy using 60%+ confidence threshold. Perfect for maintaining clean databases.", icon: "🧹", color: "from-green-400 to-emerald-500" },
                            { title: "Lead Validation", desc: "Verify high-quality prospects with 95% accuracy using 85%+ confidence. Ensure only verified leads reach your sales team.", icon: "🎯", color: "from-rose-400 to-red-500" },
                            { title: "Campaign Prep", desc: "Balance accuracy and volume with 75%+ confidence for 92% deliverability. Optimize ROI on email campaigns.", icon: "📧", color: "from-blue-400 to-indigo-500" },
                        ].map((useCase, idx) => (
                            <div key={idx} className="bg-slate-900 border border-slate-800 p-8 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
                                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${useCase.color} opacity-10 rounded-bl-full group-hover:scale-110 transition-transform`}></div>
                                <div className="text-4xl mb-6">{useCase.icon}</div>
                                <h3 className="text-xl font-bold text-white mb-3">{useCase.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{useCase.desc}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Footer Brand */}
                <motion.div variants={item} className="text-center pt-8 border-t border-slate-800">
                    <h3 className="text-lg font-bold text-slate-300">VRK INFOTECH</h3>
                    <p className="text-slate-500 text-sm">Professional Email Verification & Lead Validation</p>
                    <p className="text-slate-600 text-xs mt-2">© 2026 VRK INFOTECH. All rights reserved.</p>
                </motion.div>

            </motion.div>
        </div>
    );
}
