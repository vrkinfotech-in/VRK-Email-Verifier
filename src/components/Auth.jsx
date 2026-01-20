import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInAnonymously,
    sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export default function Auth({ onShowHowItWorks, onShowAbout, onShowContact }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isResetMode, setIsResetMode] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            if (isResetMode) {
                await sendPasswordResetEmail(auth, email);
                setMessage("Password reset email sent! Check your inbox.");
                setIsResetMode(false);
            } else if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAnonymousLogin = async () => {
        setError('');
        setLoading(true);
        try {
            await signInAnonymously(auth);
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleError = (err) => {
        console.error(err);
        let msg = "Authentication failed.";
        if (err.code === 'auth/wrong-password') msg = "Incorrect password.";
        if (err.code === 'auth/user-not-found') msg = "No user found with this email.";
        if (err.code === 'auth/email-already-in-use') msg = "Email already in use.";
        if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
        if (err.code === 'auth/invalid-credential') msg = "Invalid credentials.";
        if (err.code === 'auth/popup-closed-by-user') msg = "Sign-in cancelled.";
        if (msg === "Authentication failed.") msg = `Authentication failed: ${err.code}`;
        setError(msg);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white relative overflow-hidden">
            {/* Background Gradients - Vivid Theme */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[40rem] h-[40rem] bg-blue-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-orange-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute top-[40%] left-[30%] w-[30rem] h-[30rem] bg-purple-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="w-full max-w-md p-8 z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
                >
                    {/* Top Gradient Line to match Brand */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500"></div>

                    <div className="text-center mb-6">
                        <div className="flex justify-center mb-6">
                            {/* Logo Display */}
                            <img src="/logo.png" alt="VRK Email Verifier" className="h-20 object-contain drop-shadow-lg" />
                        </div>
                        <h2 className="text-xl font-medium text-slate-300">
                            {isResetMode ? "Reset Password" : isLogin ? "Welcome back" : "Get started for free"}
                        </h2>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all placeholder-slate-600"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        {!isResetMode && (
                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="block text-sm font-medium text-slate-400">Password</label>
                                    {isLogin && (
                                        <button type="button" onClick={() => { setIsResetMode(true); setError(''); }} className="text-xs text-blue-400 hover:text-blue-300">
                                            Forgot?
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all placeholder-slate-600"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        )}

                        {error && <div className="text-rose-400 text-sm text-center bg-rose-500/10 py-2 rounded-lg border border-rose-500/20">{error}</div>}
                        {message && <div className="text-emerald-400 text-sm text-center bg-emerald-500/10 py-2 rounded-lg border border-emerald-500/20">{message}</div>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 hover:from-blue-500 hover:via-purple-500 hover:to-orange-400 transform hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Processing..." : (isResetMode ? "Send Reset Link" : isLogin ? "Sign In" : "Create Account")}
                        </button>
                    </form>

                    {!isResetMode && (
                        <>
                            <div className="my-6 flex items-center gap-3">
                                <div className="h-px bg-slate-800 flex-1"></div>
                                <span className="text-slate-500 text-xs uppercase">Or continue with</span>
                                <div className="h-px bg-slate-800 flex-1"></div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors text-slate-300 hover:text-white font-medium text-sm"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" /></svg>
                                    Google
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAnonymousLogin}
                                    disabled={loading}
                                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors text-slate-300 hover:text-white font-medium text-sm"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                    Guest
                                </button>
                            </div>
                        </>
                    )}

                    <div className="mt-6 text-center">
                        <p className="text-slate-400 text-sm">
                            {isResetMode ? (
                                <button onClick={() => setIsResetMode(false)} className="text-blue-400 hover:text-blue-300 font-medium">Back to Login</button>
                            ) : (
                                <>
                                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                                    <button
                                        onClick={() => setIsLogin(!isLogin)}
                                        className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-bold hover:opacity-80 transition-opacity"
                                    >
                                        {isLogin ? "Sign Up" : "Log In"}
                                    </button>
                                </>
                            )}
                        </p>
                    </div>

                    {/* How It Works Link */}
                    <div className="mt-8 pt-6 border-t border-slate-700/50 text-center space-y-3">
                        <button
                            onClick={onShowHowItWorks}
                            className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 hover:from-blue-500 hover:via-purple-500 hover:to-orange-400 transform hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            See How It Works
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={onShowAbout}
                                className="py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 hover:from-teal-400 hover:via-emerald-400 hover:to-green-400 transform hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20 text-xs sm:text-sm"
                            >
                                About VRK
                            </button>
                            <button
                                onClick={onShowContact}
                                className="py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 hover:from-pink-400 hover:via-rose-400 hover:to-red-400 transform hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-rose-500/20 text-xs sm:text-sm"
                            >
                                Contact Us
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
