import React from 'react';
import { motion } from 'framer-motion';

export default function AboutVRK({ onClose }) {
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
            <div className="absolute top-20 left-20 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-16"
            >
                {/* Header */}
                <div className="text-center space-y-6">
                    <motion.div variants={item} className="flex justify-center">
                        <img src="/logo.png" alt="VRK Infotech" className="h-24 object-contain drop-shadow-2xl" />
                    </motion.div>

                    <motion.h1
                        variants={item}
                        className="text-4xl md:text-5xl font-extrabold tracking-tight"
                    >
                        About <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400">VRK Infotech</span>
                    </motion.h1>

                    <motion.p variants={item} className="text-slate-400 text-lg max-w-3xl mx-auto leading-relaxed">
                        Empowering businesses with cutting-edge digital solutions. At VRK Infotech, we believe in the power of technology to transform operations, ensure data integrity, and drive growth. We are dedicated to providing top-tier SaaS tools that are as beautiful as they are functional.
                    </motion.p>

                    <motion.button
                        variants={item}
                        onClick={onClose}
                        className="mt-8 px-8 py-3 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium transition-all group flex items-center gap-2 mx-auto"
                    >
                        <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        Back to App
                    </motion.button>
                </div>

                {/* Content Section */}
                <div className="space-y-16">
                    {/* Mission & Vision */}
                    <motion.div variants={item} className="grid md:grid-cols-2 gap-8">
                        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 p-8 rounded-3xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
                            <p className="text-slate-400 leading-relaxed">
                                To democratize access to enterprise-grade digital tools. We strive to empower businesses of all sizes with the technology they need to verify data, automate workflows, and scale with confidence.
                            </p>
                        </div>
                        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 p-8 rounded-3xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            <h3 className="text-2xl font-bold text-white mb-4">Our Vision</h3>
                            <p className="text-slate-400 leading-relaxed">
                                To be the global standard for reliability and innovation in the SaaS industry. We envision a future where digital trust is built into every interaction, and VRK Infotech is at the forefront of that transformation.
                            </p>
                        </div>
                    </motion.div>

                    {/* What We Do */}
                    <motion.div variants={item} className="text-center max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-white mb-6">Driving Digital Transformation</h2>
                        <p className="text-slate-400 text-lg leading-relaxed mb-8">
                            Founded with a passion for excellence, VRK Infotech has grown into a trusted partner for companies seeking to optimize their digital infrastructure. From robust email verification systems to custom enterprise solutions, we build software that works as hard as you do.
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-slate-300 text-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Serving clients globally
                        </div>
                    </motion.div>
                </div>

                {/* Values Grid */}
                <motion.div variants={item} className="grid md:grid-cols-3 gap-6">
                    {[
                        { title: "Innovation", desc: "Constantly pushing boundaries to deliver state-of-the-art software solutions.", icon: "💡", color: "from-blue-500 to-cyan-500" },
                        { title: "Reliability", desc: "Building robust systems that you can trust with your most critical business data.", icon: "🛡️", color: "from-purple-500 to-violet-500" },
                        { title: "Excellence", desc: "Commitment to premium design and flawless user experience in every product.", icon: "✨", color: "from-orange-500 to-amber-500" },
                        { title: "Integrity", desc: "We believe in transparent, honest, and ethical business practices in everything we do.", icon: "🤝", color: "from-emerald-500 to-green-500" },
                        { title: "Security", desc: "Your data privacy and security are our top priorities, with enterprise-grade protection.", icon: "🔒", color: "from-rose-500 to-red-500" },
                        { title: "Support", desc: "Dedicated to providing exceptional customer service and technical assistance 24/7.", icon: "🎧", color: "from-indigo-500 to-blue-500" }
                    ].map((val, idx) => (
                        <div key={idx} className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-8 rounded-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${val.color} opacity-5 rounded-bl-full`}></div>
                            <div className="text-4xl mb-4">{val.icon}</div>
                            <h3 className="text-xl font-bold text-white mb-1">{val.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">{val.desc}</p>
                        </div>
                    ))}
                </motion.div>

                {/* Footer Brand */}
                <motion.div variants={item} className="text-center pt-8 border-t border-slate-800">
                    <p className="text-slate-600 text-xs mt-2">© 2026 VRK INFOTECH. All rights reserved.</p>
                </motion.div>

            </motion.div>
        </div>
    );
}
