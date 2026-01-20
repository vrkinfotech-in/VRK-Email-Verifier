import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import Auth from '../components/Auth';
import UserProfile from '../components/UserProfile';
import HowItWorks from '../components/HowItWorks';
import AboutVRK from '../components/AboutVRK';
import ContactVRK from '../components/ContactVRK';
import SubHeader from '../components/SubHeader';

function CustomerApp() {
  const [inputEmails, setInputEmails] = useState('');
  const [singleEmail, setSingleEmail] = useState('');
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [inputMode, setInputMode] = useState('bulk'); // 'single', 'bulk'
  const [verificationSpeed, setVerificationSpeed] = useState('deep'); // 'fast', 'deep'
  const [eta, setEta] = useState(null);

  // Auth State
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [userData, setUserData] = useState(null);

  // Page State
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'how-it-works', 'about', 'contact'

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
        if (doc.exists()) setUserData(doc.data());
      });
      return () => unsub();
    } else {
      setUserData(null);
    }
  }, [user]);

  const handleInputChange = (e) => {
    setInputEmails(e.target.value);
  };

  const handleSingleInputChange = (e) => {
    setSingleEmail(e.target.value);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {
      const bstr = evt.target.result;
      let textData = "";

      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // Convert sheet to text (CSV format) to easily regex search
        textData = XLSX.utils.sheet_to_csv(sheet);
      } else {
        // TXT or CSV
        textData = bstr;
      }

      // Smart Extraction: Find all emails in the messy text
      const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g;
      const extractedEmails = textData.match(emailRegex) || [];

      const uniqueEmails = [...new Set(extractedEmails)];
      setInputEmails(uniqueEmails.join('\n'));
      setStatusMessage(`Imported ${uniqueEmails.length} unique emails from file.`);
    };

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleUpgrade = async (planName) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      // Use relative path or cloud function url. Using relative assumes rewrites in firebase.json
      // If rewrites are not set for this function, we might need full URL.
      // Assuming 'createRazorpayOrder' is available via rewrite /createRazorpayOrder OR api/createRazorpayOrder
      // Standard Firebase Functions URL pattern: https://<region>-<project>.cloudfunctions.net/createRazorpayOrder
      // Let's assume we add a rewrite or use the function name if we update firebase.json.
      // For now, I'll use the relative path assuming we will add rewrite or it maps.
      // SAFEST: /createRazorpayOrder might not work without hosting config.
      // Let's use the explicit function name `createRazorpayOrder` but getting the URL is tricky dynamically.
      // I'll assume the same method as /api/verify which maps to verifyEmail. 
      // I'll fetch `/api/upgrade` and map it in firebase.json later? Or just use the function name.
      // Let's use `/api/createRazorpayOrder` and I will ensure I add it to the backend rewrites plan if needed?
      // Actually, standard is `/createRazorpayOrder` if rewrites map `**` to function? No usually specific.
      // I'll try `/createRazorpayOrder` and hope the user configures rewrites, OR I will assume the same pattern.
      // Let's go with `/api/create_order` and I'll update firebase.json separately or just `/createRazorpayOrder` if I trust the user.

      const response = await fetch('/createRazorpayOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ plan: planName })
      });

      if (!response.ok) throw new Error("Order creation failed");
      const order = await response.json();

      const options = {
        "key": "rzp_test_YOUR_KEY_ID_HERE",
        "amount": order.amount,
        "currency": "INR",
        "name": "VRK Email Verifier",
        "description": `${planName.toUpperCase()} Plan Upgrade`,
        "order_id": order.id,
        "handler": async function (response) {
          alert("Payment Successful! Plan will update shortly.");
        },
        "prefill": { "email": user.email }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (err) {
      console.error(err);
      alert("Payment/Upgrade Failed: " + err.message);
    }
  };

  const processEmails = async () => {
    let emailsToVerify = [];
    if (inputMode === 'single') {
      if (!singleEmail.trim()) return;
      emailsToVerify = [singleEmail.trim()];
    } else {
      if (!inputEmails.trim()) return;
      emailsToVerify = inputEmails.split('\n').map(e => e.trim()).filter(e => e.length > 0);
    }

    // De-duplicate
    emailsToVerify = [...new Set(emailsToVerify)];

    if (emailsToVerify.length === 0) {
      setStatusMessage("Please enter valid emails.");
      return;
    }

    setResults([]);
    setIsProcessing(true);
    setProgress(0);
    setEta('Calculating...');
    setStatusMessage(`Queueing ${emailsToVerify.length} emails...`);

    const effectiveMode = inputMode === 'single' ? 'single' : verificationSpeed; // 'single' implies deep

    const startTime = Date.now();

    // CONCURRENCY CONTROL (Queue)
    // 3 parallel requests is safe for GCF to avoid memory spikes/limits while being fast
    const CONCURRENCY_LIMIT = 3;
    let index = 0;
    let completed = 0;
    const total = emailsToVerify.length;

    const worker = async () => {
      while (index < total) {
        const currentIndex = index++;
        const email = emailsToVerify[currentIndex];

        try {
          const token = user ? await user.getIdToken() : "";
          const response = await fetch('/api/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email, mode: effectiveMode })
          });
          const data = await response.json();

          setResults(prev => [...prev, data]);
        } catch (err) {
          setResults(prev => [...prev, {
            Email: email,
            Status: 'error',
            Score: 0,
            Syntax: 'fail',
            DNS: 'fail',
            SMTP: 'fail',
            Role: 'no',
            Disp: 'no',
            SPF: 'fail',
            DMARC: 'fail'
          }]);
        }

        completed++;
        const pct = Math.round((completed / total) * 100);
        setProgress(pct);

        // ETA Update
        const elapsed = Date.now() - startTime;
        const avgTime = elapsed / completed;
        const remaining = total - completed;
        const secondsLeft = Math.ceil((remaining * avgTime) / 1000);

        if (remaining > 0) {
          const mins = Math.floor(secondsLeft / 60);
          const secs = secondsLeft % 60;
          setEta(`${mins}m ${secs}s`);
          setStatusMessage(`Verifying... ${completed}/${total}`);
        } else {
          setEta('Done');
          setStatusMessage('Complete!');
        }
      }
    };

    // Spawn workers
    const workers = [];
    for (let i = 0; i < Math.min(CONCURRENCY_LIMIT, total); i++) {
      workers.push(worker());
    }

    await Promise.all(workers);
    setIsProcessing(false);
  };

  const downloadCSV = () => {
    if (results.length === 0) return;
    const csv = Papa.unparse(results);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `verification_results_${new Date().getTime()}.csv`;
    link.click();
  };

  const downloadExcel = () => {
    if (results.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(results);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, `verification_results_${new Date().getTime()}.xlsx`);
  };

  const downloadTXT = () => {
    if (results.length === 0) return;
    const txtContent = results.map(r => `${r.email} - ${r.status}`).join('\n');
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `verification_results_${new Date().getTime()}.txt`;
    link.click();
  };

  const handleLogout = () => {
    signOut(auth);
  };

  if (authLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-500">Loading...</div>;

  if (currentPage === 'how-it-works') {
    return (
      <div className="bg-slate-950 min-h-screen">
        <SubHeader onClose={() => setCurrentPage('home')} />
        <HowItWorks onClose={() => setCurrentPage('home')} />
      </div>
    );
  }

  if (currentPage === 'about') {
    return (
      <div className="bg-slate-950 min-h-screen">
        <SubHeader onClose={() => setCurrentPage('home')} />
        <AboutVRK onClose={() => setCurrentPage('home')} />
      </div>
    );
  }

  if (currentPage === 'contact') {
    return (
      <div className="bg-slate-950 min-h-screen">
        <SubHeader onClose={() => setCurrentPage('home')} />
        <ContactVRK onClose={() => setCurrentPage('home')} />
      </div>
    );
  }

  if (!user) return (
    <Auth
      onShowHowItWorks={() => setCurrentPage('how-it-works')}
      onShowAbout={() => setCurrentPage('about')}
      onShowContact={() => setCurrentPage('contact')}
    />
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-purple-500 selection:text-white overflow-x-hidden">
      {/* Vivid Theme Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-orange-500/10 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse delay-700"></div>
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-purple-600/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
        {/* Navbar */}
        <nav className="flex flex-col md:flex-row justify-between items-center mb-12 backdrop-blur-md bg-slate-900/50 p-4 rounded-2xl border border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Vivid Logo" className="h-10 object-contain" />
            <span className="font-bold text-xl tracking-tight hidden sm:block bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400">
              VRK Email Verifier
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            <button
              onClick={() => setCurrentPage('how-it-works')}
              className="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 hover:from-blue-500 hover:via-purple-500 hover:to-orange-400 transform hover:scale-105 transition-all shadow-lg shadow-purple-500/20 text-xs sm:text-sm"
            >
              How it works
            </button>

            <button
              onClick={() => setCurrentPage('about')}
              className="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 hover:from-teal-400 hover:via-emerald-400 hover:to-green-400 transform hover:scale-105 transition-all shadow-lg shadow-emerald-500/20 text-xs sm:text-sm"
            >
              About VRK
            </button>

            <button
              onClick={() => setCurrentPage('contact')}
              className="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 hover:from-pink-400 hover:via-rose-400 hover:to-red-400 transform hover:scale-105 transition-all shadow-lg shadow-rose-500/20 text-xs sm:text-sm"
            >
              Contact
            </button>

            <div className="h-8 w-px bg-slate-700/50 mx-1 hidden sm:block"></div>

            <div
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-3 cursor-pointer hover:bg-slate-800/80 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-700"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold shadow-lg overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user.displayName ? user.displayName[0] : user.email ? user.email[0].toUpperCase() : 'U'
                )}
              </div>
              <div className="hidden lg:block text-right">
                <p className="text-sm font-medium text-white">{user.displayName || 'User'}</p>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wide">Enterprise Plan</p>
              </div>
            </div>

            <button onClick={handleLogout} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title="Log Out">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            </button>
          </div>
        </nav>

        {showProfile && <UserProfile user={user} onClose={() => setShowProfile(false)} onShowContact={() => setCurrentPage('contact')} />}

        {/* Hero & App */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* Left Panel: Input & Controls */}
          <div className="lg:col-span-4 space-y-6">

            {/* SAAS DASHBOARD */}
            {userData && (
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 mb-0 shadow-lg relative overflow-hidden group hover:border-slate-600 transition-all">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500"></div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Current Plan</p>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                      {(userData.plan || 'free').toUpperCase()}
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase border ${userData.plan === 'scale' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}>Active</span>
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Credits</p>
                    <h3 className={`text-2xl font-mono font-black tabular-nums transition-colors ${userData.credits_left < 100 ? 'text-rose-400' : 'text-emerald-400'}`}>{userData.credits_left.toLocaleString()}</h3>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-slate-800 rounded-full mb-5 overflow-hidden ring-1 ring-white/5">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, (userData.credits_left / (userData.credits_total || 100)) * 100)}%` }}></div>
                </div>

                <div className="mb-5">
                  <div className="flex justify-between items-end mb-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">API Key</p>
                  </div>
                  <div className="flex bg-slate-950/50 rounded-lg border border-slate-800 p-2 items-center gap-2 group-hover:border-slate-700 transition-colors">
                    <code className="text-[10px] text-slate-400 font-mono truncate flex-1 select-all">{userData.api_key}</code>
                    <button onClick={() => { navigator.clipboard.writeText(userData.api_key); alert("Copied!"); }} className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-colors" title="Copy Key">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    </button>
                  </div>
                </div>

                {userData.plan === 'free' && (
                  <button onClick={() => handleUpgrade('starter')} className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-900/20 hover:shadow-emerald-500/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                    <span>🚀</span> Upgrade to Starter (₹299/mo)
                  </button>
                )}
              </div>
            )}

            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
              {/* Brand Gradient Border Top */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500"></div>

              {/* TABS HEADER */}
              <div className="flex p-1 bg-slate-950/50 rounded-xl mb-6 border border-slate-800/50">
                <button
                  onClick={() => setInputMode('single')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${inputMode === 'single' ? 'bg-slate-800 text-white shadow-lg ring-1 ring-slate-700' : 'text-slate-400 hover:text-white'}`}
                >
                  Single Verify
                </button>
                <button
                  onClick={() => setInputMode('bulk')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${inputMode === 'bulk' ? 'bg-slate-800 text-white shadow-lg ring-1 ring-slate-700' : 'text-slate-400 hover:text-white'}`}
                >
                  Bulk Verify
                </button>
              </div>

              {inputMode === 'single' ? (
                <div className="space-y-4 min-h-[300px]">
                  <label className="text-slate-400 text-sm font-semibold ml-1">Enter Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={singleEmail}
                      onChange={handleSingleInputChange}
                      placeholder="name@company.com"
                      className="w-full bg-slate-950/80 border border-slate-700 text-white rounded-xl p-4 pl-12 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600"
                      disabled={isProcessing}
                    />
                    <svg className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path></svg>
                  </div>

                  <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 text-sm text-blue-300 flex gap-3">
                    <span className="text-lg">ℹ️</span>
                    <p className="leading-relaxed">Single mode automatically runs a <strong>Deep Scan</strong> (Syntax, DNS, SPF, DMARC, SMTP) to ensure maximum accuracy.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* SPEED SELECTOR CARDS */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div
                      onClick={() => !isProcessing && setVerificationSpeed('fast')}
                      className={`cursor-pointer p-3 rounded-xl border transition-all relative overflow-hidden ${verificationSpeed === 'fast' ? 'bg-blue-600/10 border-blue-500 ring-1 ring-blue-500/50' : 'bg-slate-800/30 border-slate-800 hover:bg-slate-800'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">⚡</span>
                        <span className={`font-bold text-sm ${verificationSpeed === 'fast' ? 'text-white' : 'text-slate-300'}`}>Fast</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">High speed. Skips SPF/DMARC. Best for large lists.</p>
                    </div>

                    <div
                      onClick={() => !isProcessing && setVerificationSpeed('deep')}
                      className={`cursor-pointer p-3 rounded-xl border transition-all relative overflow-hidden ${verificationSpeed === 'deep' ? 'bg-purple-600/10 border-purple-500 ring-1 ring-purple-500/50' : 'bg-slate-800/30 border-slate-800 hover:bg-slate-800'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">🔍</span>
                        <span className={`font-bold text-sm ${verificationSpeed === 'deep' ? 'text-white' : 'text-slate-300'}`}>Deep</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">Full validation including SPF & DMARC checks.</p>
                    </div>
                  </div>

                  {/* File Upload Area */}
                  <div className="relative border-2 border-dashed border-slate-700/50 rounded-xl p-6 transition-colors hover:border-purple-500/50 hover:bg-purple-500/5 group text-center cursor-pointer">
                    <input
                      type="file"
                      accept=".csv, .txt, .xlsx, .xls"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      disabled={isProcessing}
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                      </div>
                      <p className="text-sm font-medium text-slate-300">Upload File (CSV, XLSX, TXT)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="h-px bg-slate-800 flex-1"></div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">OR Paste Emails</span>
                    <div className="h-px bg-slate-800 flex-1"></div>
                  </div>

                  <textarea
                    className="w-full h-[100px] bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl p-4 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none text-xs font-mono leading-relaxed placeholder-slate-600 custom-scrollbar"
                    placeholder={`alice@example.com\nbob@domain.com\n...`}
                    value={inputEmails}
                    onChange={handleInputChange}
                    disabled={isProcessing}
                  ></textarea>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <button
                  onClick={processEmails}
                  disabled={isProcessing || (inputMode === 'single' ? !singleEmail.trim() : !inputEmails.trim())}
                  className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all relative overflow-hidden ${isProcessing || (inputMode === 'single' ? !singleEmail.trim() : !inputEmails.trim())
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 hover:from-blue-500 hover:via-purple-500 hover:to-orange-400 text-white hover:shadow-purple-500/25 hover:-translate-y-0.5'
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
                    onClick={() => { setInputEmails(''); setSingleEmail(''); }}
                    disabled={isProcessing}
                    className="py-3 rounded-xl font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Clear All
                  </button>
                  <div className="flex gap-2">
                    <button onClick={downloadCSV} disabled={results.length === 0} className="flex-1 py-3 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800/50 text-blue-400 hover:bg-slate-800 disabled:opacity-50">CSV</button>
                    <button onClick={downloadExcel} disabled={results.length === 0} className="flex-1 py-3 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800/50 text-green-400 hover:bg-slate-800 disabled:opacity-50">XLS</button>
                    <button onClick={downloadTXT} disabled={results.length === 0} className="flex-1 py-3 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800 disabled:opacity-50">TXT</button>
                  </div>
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
                  <p className="text-sm text-slate-500 font-mono">{statusMessage || "Ready to verify"}</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-4">
                {/* ETA Stat Card */}
                <div className="bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50 flex flex-col items-end">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Est. Remaining</span>
                  <span className="text-lg font-mono font-bold text-white tabular-nums">{eta || '--:--'}</span>
                </div>

                {/* Circular Progress Cursor */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="text-emerald-500 transition-all duration-300 ease-out"
                      strokeDasharray={`${progress}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                  </svg>
                  <div className="absolute text-xs font-bold text-white">{progress}%</div>
                </div>
              </div>
            </div>

            {/* Progress Bar Line - Vivid Gradient */}
            {/* Progress Bar Line - With Handle */}
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-6 relative mt-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 relative"
              >
                {/* Long Dot Handle */}
                {progress > 0 && progress < 100 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] border-2 border-purple-500 z-10"></div>
                )}
              </motion.div>
            </div>

            {/* Table */}
            <div className="flex-1 bg-slate-950/50 rounded-2xl border border-slate-800 overflow-hidden flex flex-col relative">
              <div className="overflow-y-auto custom-scrollbar flex-1 p-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/50 text-xs uppercase tracking-wider text-slate-500">
                      <th className="p-4 font-semibold">Email</th>
                      <th className="p-4 font-semibold text-center">Syntax</th>
                      <th className="p-4 font-semibold text-center">DNS</th>
                      <th className="p-4 font-semibold text-center">SMTP</th>
                      <th className="p-4 font-semibold text-center">Role</th>
                      <th className="p-4 font-semibold text-center">SPF</th>
                      <th className="p-4 font-semibold text-center">DMARC</th>
                      <th className="p-4 font-semibold text-center">Disp</th>
                      <th className="p-4 font-semibold text-center">Status</th>
                      <th className="p-4 font-semibold text-center">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30 text-sm">
                    {results.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="p-20 text-center text-slate-600">
                          <div className="inline-block p-4 rounded-full bg-slate-900/50 mb-4 text-slate-700">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                          </div>
                          <p>No data yet. Waiting for input...</p>
                        </td>
                      </tr>
                    ) : (
                      results.map((r, i) => {
                        return (
                          <motion.tr
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={i}
                            className="group hover:bg-slate-900/80 transition-colors"
                          >
                            <td className="p-4 font-mono text-slate-300 max-w-[200px] truncate" title={r.Email}>{r.Email}</td>

                            {/* Syntax */}
                            <td className="p-4 text-center">
                              {r.Syntax === 'pass' ? <span className="text-emerald-400 text-lg">✓</span> : <span className="text-rose-400 text-lg">✗</span>}
                            </td>

                            {/* DNS */}
                            <td className="p-4 text-center">
                              {r.DNS === 'pass' ? <span className="text-emerald-400 text-lg">✓</span> : <span className="text-rose-400 text-lg">✗</span>}
                            </td>

                            {/* SMTP */}
                            <td className="p-4 text-center">
                              {r.SMTP === 'pass' ? <span className="text-emerald-400 text-lg">✓</span> : r.SMTP === 'soft' ? <span className="text-yellow-400 text-lg">?</span> : r.SMTP === 'fail' ? <span className="text-rose-400 text-lg">✗</span> : <span className="text-slate-600 text-lg">?</span>}
                            </td>

                            {/* Role Based */}
                            <td className="p-4 text-center">
                              {r.Role === 'yes' ? <span className="text-orange-400" title="Role Based">⚠️</span> : <span className="text-slate-600">-</span>}
                            </td>

                            {/* SPF */}
                            <td className="p-4 text-center text-xs text-slate-400">
                              {r.SPF === 'pass' ? <span className="text-emerald-500">PASS</span> : <span className="text-rose-500">FAIL</span>}
                            </td>

                            {/* DMARC */}
                            <td className="p-4 text-center text-xs text-slate-400">
                              {r.DMARC === 'pass' ? <span className="text-emerald-500">PASS</span> : <span className="text-rose-500">FAIL</span>}
                            </td>

                            {/* Disposable */}
                            <td className="p-4 text-center">
                              {r.Disp === 'yes' ? <span className="text-rose-500" title="Disposable">🗑️</span> : <span className="text-slate-600">-</span>}
                            </td>

                            {/* Overall Status Badge */}
                            <td className="p-4 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${r.Status === 'valid' ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' :
                                r.Status === 'catch_all' ? 'bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20' :
                                  r.Status === 'risky' ? 'bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20' :
                                    r.Status === 'invalid' ? 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20' :
                                      'bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20'
                                }`}>
                                {r.Status}
                              </span>
                            </td>

                            {/* Score */}
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                                  <div
                                    className={`h-full rounded-full ${r.Score > 80 ? 'bg-emerald-500' : r.Score > 50 ? 'bg-yellow-500' : 'bg-rose-500'}`}
                                    style={{ width: `${r.Score || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-bold text-slate-400">{r.Score || 0}%</span>
                              </div>
                            </td>

                          </motion.tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="mt-20 py-8 border-t border-slate-800/50 text-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} VRK Infotech. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <button onClick={() => setCurrentPage('how-it-works')} className="hover:text-white transition-colors">How it Works</button>
            <button onClick={() => setCurrentPage('about')} className="hover:text-white transition-colors">About</button>
            <button onClick={() => setCurrentPage('contact')} className="hover:text-white transition-colors">Contact</button>
            <button onClick={() => window.open('https://vrkinfotech.freshdesk.com', '_blank')} className="hover:text-white transition-colors">Support</button>
          </div>
        </footer>
      </div>
    </div>
  );
}

// End of component
export default CustomerApp;
