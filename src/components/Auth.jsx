import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            console.error(err);
            let msg = "Authentication failed.";
            if (err.code === 'auth/wrong-password') msg = "Incorrect password.";
            if (err.code === 'auth/user-not-found') msg = "No user found with this email.";
            if (err.code === 'auth/email-already-in-use') msg = "Email already in use.";
            if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
            if (err.code === 'auth/invalid-credential') msg = "Invalid credentials.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[40rem] h-[40rem] bg-purple-700/30 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-cyan-700/30 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            </div>

            <div className="w-full max-w-md p-8 z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800/60 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 shadow-2xl"
                >
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
                            Email Verifier
                        </h1>
                        <p className="text-slate-400">
                            {isLogin ? "Welcome back, verifying wizard!" : "Create your free account"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all placeholder-slate-600"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all placeholder-slate-600"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {error && <div className="text-rose-400 text-sm text-center">{error}</div>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 transform hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Processing..." : (isLogin ? "Sign In" : "Sign Up Free")}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-slate-400 text-sm">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors"
                            >
                                {isLogin ? "Sign Up" : "Log In"}
                            </button>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
