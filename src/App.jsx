import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { motion } from 'framer-motion';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import Auth from './components/Auth';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App State
  const [inputEmails, setInputEmails] = useState('');
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    setInputEmails(e.target.value);
  };

  const processEmails = async () => {
    if (!inputEmails.trim()) return;

    setIsProcessing(true);
    setResults([]);
    setProgress(0);
    setStatusMessage('Preparing verification engine...');

    const emailList = inputEmails
      .split(/[\n,]/)
      .map(e => e.trim())
      .filter(e => e.length > 0);

    const total = emailList.length;
    let processed = 0;
    const newResults = [];
    const CONCURRENCY = 3;

    for (let i = 0; i < total; i += CONCURRENCY) {
      if (!auth.currentUser) break; // Security break

      const batch = emailList.slice(i, i + CONCURRENCY);
      const promises = batch.map(async (email) => {
        try {
          const response = await fetch('/api/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Optional: Pass Auth Token if backend secured later
              // 'Authorization': `Bearer ${await user.getIdToken()}`
            },
            body: JSON.stringify({ email })
          });

          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          return { original: email, ...data, status: data.valid ? 'Valid' : 'Invalid' };
        } catch (err) {
          return { original: email, email, valid: false, reason: "Request Failed", status: 'Error' };
        }
      });

      const batchResults = await Promise.all(promises);
      newResults.push(...batchResults);
      processed += batch.length;

      setResults((prev) => [...prev, ...batchResults]);
      setProgress(Math.round((processed / total) * 100));
      setStatusMessage(`Processed ${processed} of ${total}`);
    }

    setIsProcessing(false);
    setStatusMessage('Verification Complete!');
  };

  const downloadCSV = () => {
    if (results.length === 0) return;
    const csvData = results.map(r => ({
      Email: r.email || r.original,
      Status: r.status,
      Validity: r.valid ? 'Valid' : 'Invalid',
      Reason: r.reason || '',
      MX_Record: r.mx || '',
      SMTP_Message: r.smtp || ''
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `verification_results_${new Date().getTime()}.csv`;
    link.click();
  };

  const handleLogout = () => {
    signOut(auth);
  };

  if (authLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-cyan-500">Loading...</div>;
  if (!user) return <Auth />;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-cyan-500 selection:text-white overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse delay-700"></div>
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-purple-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
        {/* Navbar */}
        <nav className="flex justify-between items-center mb-12 backdrop-blur-md bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500"></div>
            <span className="font-bold text-xl tracking-tight">EmailVerifier<span className="text-cyan-400">Pro</span></span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm hidden sm:inline">{user.email}</span>
            <button onClick={handleLogout} className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-colors">
              Log Out
            </button>
          </div>
        </nav>

        {/* Hero & App */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* Left Panel: Input */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"></div>

              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Bulk Verify</h2>
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/20">Free Forever</span>
              </div>

              <textarea
                className="w-full h-[400px] bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl p-5 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none text-sm font-mono leading-relaxed placeholder-slate-600 custom-scrollbar"
                placeholder={`Paste emails here (one per line)...\nalice@example.com\nbob@domain.com\n...`}
                value={inputEmails}
                onChange={handleInputChange}
                disabled={isProcessing}
              ></textarea>

              <div className="mt-6 space-y-3">
                <button
                  onClick={processEmails}
                  disabled={isProcessing || !inputEmails.trim()}
                  className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all relative overflow-hidden ${isProcessing || !inputEmails.trim()
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white hover:shadow-cyan-500/25 hover:-translate-y-0.5'
                    }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Verifying...
                    </span>
                  ) : 'Start Verification'}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setInputEmails('')}
                    disabled={isProcessing}
                    className="py-3 rounded-xl font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={downloadCSV}
                    disabled={results.length === 0}
                    className={`py-3 rounded-xl font-medium border transition-all ${results.length === 0 ? 'border-slate-800 text-slate-700' : 'border-slate-700 bg-slate-800/50 text-cyan-400 hover:bg-slate-800 hover:border-cyan-500/30'}`}
                  >
                    Export CSV
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Results */}
          <div className="lg:col-span-8">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl h-full flex flex-col relative">

              {/* Status Bar */}
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Live Results</h2>
                  <p className="text-sm text-slate-500">{statusMessage || "Ready to verify"}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-mono font-bold text-cyan-400">{progress}%</div>
                </div>
              </div>

              {/* Progress Bar Line */}
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mb-6">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
                />
              </div>

              {/* Table */}
              <div className="flex-1 bg-slate-950/50 rounded-2xl border border-slate-800 overflow-hidden flex flex-col relative">
                <div className="overflow-y-auto custom-scrollbar flex-1 p-2">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/50 text-xs uppercase tracking-wider text-slate-500">
                        <th className="p-4 font-semibold">Email Address</th>
                        <th className="p-4 font-semibold">Checks</th>
                        <th className="p-4 font-semibold text-right">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30 text-sm">
                      {results.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="p-20 text-center text-slate-600">
                            <div className="inline-block p-4 rounded-full bg-slate-900/50 mb-4 text-slate-700">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                            </div>
                            <p>No data yet. Waiting for input...</p>
                          </td>
                        </tr>
                      ) : (
                        results.map((r, i) => (
                          <motion.tr
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={i}
                            className="group hover:bg-slate-900/80 transition-colors"
                          >
                            <td className="p-4 font-mono text-slate-300">{r.email || r.original}</td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${r.mx ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-slate-700 text-slate-600'}`}>MX</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${r.smtp && !r.smtp.includes('Error') ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-slate-700 text-slate-600'}`}>SMTP</span>
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${r.valid ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20'}`}>
                                {r.valid ? (
                                  <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Valid</>
                                ) : (
                                  <><span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Invalid</>
                                )}
                              </span>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-800">
            <div className="h-10 w-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h3 className="font-bold text-white mb-2">Lightning Fast</h3>
            <p className="text-sm text-slate-400">Powered by parallel processing to verify thousands of emails in minutes.</p>
          </div>
          <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-800">
            <div className="h-10 w-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            </div>
            <h3 className="font-bold text-white mb-2">Bank-Grade Security</h3>
            <p className="text-sm text-slate-400">We verify without sending emails. Your data is processed securely and never stored.</p>
          </div>
          <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-800">
            <div className="h-10 w-10 bg-pink-500/10 rounded-xl flex items-center justify-center text-pink-400 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 className="font-bold text-white mb-2">Free Forever</h3>
            <p className="text-sm text-slate-400">Enjoy lifetime free access with our generous starter tier. No credit card required.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
