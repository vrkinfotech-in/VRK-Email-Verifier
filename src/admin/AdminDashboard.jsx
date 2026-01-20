import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AdminDashboard = () => {
    const [adminUser, setAdminUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [promos, setPromos] = useState([]);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (u) {
                // Check Role
                const t = await u.getIdTokenResult();
                // Note: Custom claims take time to propogate or need cloud function logic to set them. 
                // We use Firestore check for simplicity in this interaction.
                try {
                    const userDoc = await getDoc(doc(db, "users", u.uid));
                    if (userDoc.exists() && userDoc.data().role === 'admin') {
                        setAdminUser(u);
                        fetchData('get_stats').then(d => setStats(d));
                    } else {
                        await signOut(auth);
                        setError("Access Denied: Not an Admin");
                    }
                } catch (e) {
                    setError(e.message);
                }
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const login = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (e) {
            setError("Login Failed: " + e.message);
        }
    };

    const fetchData = async (action, payload = {}) => {
        if (!auth.currentUser) return;
        const token = await auth.currentUser.getIdToken();
        const res = await fetch('/adminAPI', { // Matches the export name in functions? 
            // Default export is usually mapped to Function Name? 
            // We created `exports.adminAPI`. 
            // So route is `/adminAPI` (if rewritten) or cloud function url.
            // Let's assume we rewrite `/adminAPI` to `adminAPI`.
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ action, payload })
        });
        return await res.json();
    };

    const loadUsers = () => {
        fetchData('get_users').then(d => setUsers(d.users));
    };

    const loadPromos = () => {
        fetchData('get_promos').then(d => setPromos(d.promos));
    };

    useEffect(() => {
        if (!adminUser) return;
        if (activeTab === 'users') loadUsers();
        if (activeTab === 'promos') loadPromos();
        if (activeTab === 'overview') fetchData('get_stats').then(d => setStats(d));
    }, [activeTab, adminUser]);

    if (loading) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading Admin...</div>;

    if (!adminUser) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
                    <h1 className="text-2xl font-bold text-white mb-6 text-center">Admin Console</h1>
                    {error && <div className="bg-rose-500/10 text-rose-400 p-3 rounded mb-4 text-sm">{error}</div>}
                    <form onSubmit={login} className="space-y-4">
                        <input type="email" placeholder="Admin Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white" />
                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-white" />
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition-colors">Login</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 font-sans flex">
            {/* Sidebar */}
            <div className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col">
                <h2 className="text-xl font-bold text-white mb-8">VRK Admin</h2>
                <nav className="flex-1 space-y-2">
                    <button onClick={() => setActiveTab('overview')} className={`w-full text-left p-3 rounded ${activeTab === 'overview' ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-slate-800'}`}>Dashboard</button>
                    <button onClick={() => setActiveTab('users')} className={`w-full text-left p-3 rounded ${activeTab === 'users' ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-slate-800'}`}>Users</button>
                    <button onClick={() => setActiveTab('promos')} className={`w-full text-left p-3 rounded ${activeTab === 'promos' ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-slate-800'}`}>Promo Codes</button>
                    <button onClick={() => setActiveTab('health')} className={`w-full text-left p-3 rounded ${activeTab === 'health' ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-slate-800'}`}>System Health</button>
                </nav>
                <button onClick={() => signOut(auth)} className="text-left p-3 text-rose-400 hover:bg-slate-800 rounded">Sign Out</button>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                {activeTab === 'overview' && stats && (
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-6">System Overview</h1>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                                <p className="text-slate-500 text-sm uppercase font-bold">Total Users</p>
                                <p className="text-3xl font-bold text-white mt-2">{stats.stats.total_users}</p>
                            </div>
                            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                                <p className="text-slate-500 text-sm uppercase font-bold">API Requests</p>
                                <p className="text-3xl font-bold text-blue-400 mt-2">{stats.stats.infra?.api?.total_requests || 0}</p>
                            </div>
                            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                                <p className="text-slate-500 text-sm uppercase font-bold">Payments (S)</p>
                                <p className="text-3xl font-bold text-emerald-400 mt-2">{stats.stats.infra?.payments?.success_count || 0}</p>
                            </div>
                            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                                <p className="text-slate-500 text-sm uppercase font-bold">DNS Failures</p>
                                <p className="text-3xl font-bold text-rose-400 mt-2">{stats.stats.infra?.smtp?.dns_failures || 0}</p>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
                        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-950 text-slate-500">
                                    <tr>
                                        <th className="p-4">User</th>
                                        <th className="p-4">Action</th>
                                        <th className="p-4">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {stats.stats.recent_logs && stats.stats.recent_logs.map((log, i) => (
                                        <tr key={i}>
                                            <td className="p-4 font-mono">{log.email_verified}</td>
                                            <td className="p-4 text-slate-500">{log.result}</td>
                                            <td className="p-4 text-slate-600">{log.timestamp ? new Date(log.timestamp._seconds * 1000).toLocaleString() : 'Just now'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-white">User Management</h1>
                            <button onClick={loadUsers} className="bg-slate-800 p-2 rounded hover:bg-slate-700">Refresh</button>
                        </div>
                        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-950 text-slate-500">
                                    <tr>
                                        <th className="p-4">Email</th>
                                        <th className="p-4">Plan</th>
                                        <th className="p-4">Credits</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {users.map(u => (
                                        <tr key={u.uid} className="hover:bg-slate-800/50">
                                            <td className="p-4 font-mono">{u.email}</td>
                                            <td className="p-4"><span className="uppercase text-xs font-bold bg-slate-800 px-2 py-1 rounded">{u.plan}</span></td>
                                            <td className="p-4">{u.credits_left}</td>
                                            <td className="p-4">
                                                {u.status === 'active' ? <span className="text-emerald-400">Active</span> : <span className="text-rose-400">Suspended</span>}
                                            </td>
                                            <td className="p-4 flex gap-2">
                                                {u.status === 'active' ? (
                                                    <button onClick={() => fetchData('manage_user', { uid: u.uid, type: 'suspend' }).then(loadUsers)} className="text-rose-400 hover:underline">Suspend</button>
                                                ) : (
                                                    <button onClick={() => fetchData('manage_user', { uid: u.uid, type: 'activate' }).then(loadUsers)} className="text-emerald-400 hover:underline">Activate</button>
                                                )}
                                                <button onClick={() => {
                                                    const amt = prompt("Amount to ADD (e.g. 500) or DEDUCT (e.g. -500):");
                                                    if (amt) fetchData('modify_credits', { uid: u.uid, amount: amt }).then(loadUsers);
                                                }} className="text-blue-400 hover:underline">Credits</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'promos' && (
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-6">Promo Codes</h1>
                        <div className="mb-6 p-4 bg-slate-900 rounded border border-slate-800">
                            <h3 className="font-bold mb-4">Create New Code</h3>
                            <div className="flex gap-2">
                                <input id="p_code" placeholder="Code" className="bg-slate-950 p-2 rounded border border-slate-700" />
                                <input id="p_val" placeholder="Val" type="number" className="bg-slate-950 p-2 rounded border border-slate-700 w-24" />
                                <input id="p_uses" placeholder="Max" type="number" className="bg-slate-950 p-2 rounded border border-slate-700 w-24" />
                                <button onClick={() => {
                                    const code = document.getElementById('p_code').value;
                                    const val = document.getElementById('p_val').value;
                                    const max = document.getElementById('p_uses').value;
                                    fetchData('create_promo', { code, type: 'percentage', value: parseFloat(val), plans: ['all'], max_uses: parseInt(max) }).then(() => {
                                        loadPromos();
                                    });
                                }} className="bg-emerald-600 px-4 py-2 rounded text-white font-bold">Create</button>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-950 text-slate-500">
                                    <tr>
                                        <th className="p-4">Code</th>
                                        <th className="p-4">Value</th>
                                        <th className="p-4">Uses</th>
                                        <th className="p-4">Active</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {promos.map(p => (
                                        <tr key={p.code}>
                                            <td className="p-4 font-bold">{p.code}</td>
                                            <td className="p-4">{p.value}%</td>
                                            <td className="p-4">{p.used_count || 0} / {p.max_uses || '∞'}</td>
                                            <td className="p-4 text-emerald-400">{p.active ? 'Yes' : 'No'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'health' && (
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-6">System Health (Real Infra)</h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                                    SMTP Infrastructure
                                    <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded">Operational</span>
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner">
                                        <span className="text-slate-400">DNS Resolution Failures</span>
                                        <span className="text-rose-400 font-mono font-bold">{stats.stats.infra?.smtp?.dns_failures || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner">
                                        <span className="text-slate-400">SMTP Port Priority</span>
                                        <span className="text-blue-400 font-mono text-xs">587 {'>'} 465 {'>'} 2525 {'>'} 25</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                                    Payment Engine (Razorpay)
                                    <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded">Listening</span>
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner">
                                        <span className="text-slate-400">Successful Transactions</span>
                                        <span className="text-emerald-400 font-mono font-bold">{stats.stats.infra?.payments?.success_count || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner">
                                        <span className="text-slate-400">Failed / Rejected</span>
                                        <span className="text-rose-400 font-mono font-bold">{stats.stats.infra?.payments?.failure_count || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner">
                                        <span className="text-slate-400">Webhook Idempotency</span>
                                        <span className="text-blue-400 font-mono text-xs">Firestore-Locked</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
