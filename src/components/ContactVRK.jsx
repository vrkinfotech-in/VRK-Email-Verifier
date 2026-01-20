import React from 'react';
import { motion } from 'framer-motion';

export default function ContactVRK({ onClose }) {
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
            <div className="absolute top-20 right-20 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-16"
            >
                {/* Header */}
                <div className="text-center space-y-6">
                    <motion.h1
                        variants={item}
                        className="text-4xl md:text-5xl font-extrabold tracking-tight"
                    >
                        Contact <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">VRK Support</span>
                    </motion.h1>

                    <motion.p variants={item} className="text-slate-400 text-lg max-w-2xl mx-auto">
                        We are here to help 24/7. Reach out to us through any of the channels below for immediate assistance.
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

                {/* Contact Grid */}
                <motion.div variants={item} className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Email */}
                    <a href="mailto:vrkinfotech.in@gmail.com" className="p-6 rounded-2xl bg-slate-900/60 border border-slate-700 hover:bg-slate-800 hover:border-blue-500/50 transition-all group text-center backdrop-blur-md">
                        <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/10">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Email Us</h3>
                        <p className="text-sm text-slate-400 break-all">vrkinfotech.in@gmail.com</p>
                    </a>

                    {/* Zoho Support */}
                    <a href="https://vrkinfotech.zohodesk.com" target="_blank" rel="noopener noreferrer" className="p-6 rounded-2xl bg-slate-900/60 border border-slate-700 hover:bg-slate-800 hover:border-emerald-500/50 transition-all group text-center backdrop-blur-md">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/10">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Zoho Support</h3>
                        <p className="text-sm text-slate-400 break-all">vrkinfotech.zohodesk.com</p>
                    </a>

                    {/* Freshdesk Support */}
                    <a href="https://vrkinfotech.freshdesk.com" target="_blank" rel="noopener noreferrer" className="p-6 rounded-2xl bg-slate-900/60 border border-slate-700 hover:bg-slate-800 hover:border-purple-500/50 transition-all group text-center backdrop-blur-md">
                        <div className="w-16 h-16 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/10">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Freshdesk</h3>
                        <p className="text-sm text-slate-400 break-all">vrkinfotech.freshdesk.com</p>
                    </a>

                    {/* WhatsApp */}
                    <a href="https://wa.me/918881887741" target="_blank" rel="noopener noreferrer" className="p-6 rounded-2xl bg-slate-900/60 border border-slate-700 hover:bg-slate-800 hover:border-green-500/50 transition-all group text-center backdrop-blur-md">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-green-500/10">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.506-.669-.516-.173-.009-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">WhatsApp</h3>
                        <p className="text-sm text-slate-400">+91 8881 887 741</p>
                    </a>
                </motion.div>

                {/* Footer Brand */}
                <motion.div variants={item} className="text-center pt-8 border-t border-slate-800">
                    <p className="text-slate-600 text-xs mt-2">© 2026 VRK INFOTECH. All rights reserved.</p>
                </motion.div>

            </motion.div>
        </div>
    );
}
