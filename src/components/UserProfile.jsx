import React, { useState } from 'react';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserProfile({ user, onClose, onShowContact }) {
    const [displayName, setDisplayName] = useState(user.displayName || '');
    // ...
    // (omitting untouched lines for brevity if possible, but replace_file_content needs context. I will target the specific blocks)

    const [photoURL, setPhotoURL] = useState(user.photoURL || '');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Mock Commercial Plan Data
    const planDetails = {
        name: "Enterprise Plan", // In future this would come from a DB
        status: "Active",
        activatedAt: new Date(user.metadata.creationTime).toLocaleDateString(),
        expiresAt: "Lifetime Access",
        usage: "Unlimited"
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            await updateProfile(user, {
                displayName: displayName,
                photoURL: photoURL
            });
            setMessage("Profile updated successfully!");
        } catch (err) {
            setError("Failed to update profile: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!user.email) return;
        setLoading(true);
        try {
            await sendPasswordResetEmail(user.auth, user.email);
            setMessage("Password reset email sent to " + user.email);
        } catch (err) {
            setError("Error sending reset email: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
                >
                    {/* Left Sidebar: Plan Info */}
                    <div className="md:w-1/3 p-6 bg-slate-950/50 border-r border-slate-800 flex flex-col justify-between relative overflow-hidden">
                        {/* Background Decor */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500"></div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl"></div>

                        <div>
                            <div className="flex items-center gap-2 mb-6 text-emerald-400 font-bold tracking-wider text-xs uppercase">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                Commercial License
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-1">{planDetails.name}</h3>
                            <p className="text-slate-400 text-sm mb-6">License Key: <span className="font-mono text-slate-500">XXXX-XXXX-XXXX</span></p>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Status</p>
                                    <p className="text-emerald-400 font-medium">{planDetails.status}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Activation Date</p>
                                    <p className="text-slate-300 font-medium">{planDetails.activatedAt}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Validity</p>
                                    <p className="text-purple-400 font-medium">{planDetails.expiresAt}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-800">
                            <div className="mt-8 pt-6 border-t border-slate-800">
                                <div className="text-xs text-slate-500">
                                    Need help?{' '}
                                    <button
                                        onClick={() => { onClose(); onShowContact(); }}
                                        className="text-blue-400 hover:underline font-medium bg-transparent border-0 p-0 cursor-pointer inline"
                                    >
                                        Contact Support
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Content: Edit Profile */}
                    <div className="md:w-2/3 p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Account Settings</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        {message && <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm">{message}</div>}
                        {error && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-sm">{error}</div>}

                        <form onSubmit={handleUpdateProfile} className="space-y-5">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-700">
                                    {photoURL ? (
                                        <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl font-bold text-slate-500">{user.displayName ? user.displayName[0] : user.email ? user.email[0].toUpperCase() : 'U'}</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Profile Picture URL</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                                        placeholder="https://..."
                                        value={photoURL}
                                        onChange={(e) => setPhotoURL(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Email (Read-only)</label>
                                    <input
                                        type="email"
                                        disabled
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-500 cursor-not-allowed"
                                        value={user.email || 'Anonymous'}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-purple-900/20"
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>

                                <button
                                    type="button"
                                    onClick={handlePasswordReset}
                                    disabled={loading || !user.email}
                                    className="px-6 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl font-medium transition-colors"
                                >
                                    Reset Password
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
