import React, { useState } from 'react';
import Papa from 'papaparse';

function App() {
  const [inputEmails, setInputEmails] = useState('');
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleInputChange = (e) => {
    setInputEmails(e.target.value);
  };

  const processEmails = async () => {
    if (!inputEmails.trim()) return;

    setIsProcessing(true);
    setResults([]);
    setProgress(0);
    setStatusMessage('Preparing...');

    // Split by comma or newline and clean
    const emailList = inputEmails
      .split(/[\n,]/)
      .map(e => e.trim())
      .filter(e => e.length > 0);

    const total = emailList.length;
    let processed = 0;
    const newResults = [];

    // Batch processing (to avoid browser freezing, though requests are async)
    // We can do small batches or one by one. One by one gives better "streaming" feel for progress.
    // For faster results, we can run 3-5 in parallel.
    const CONCURRENCY = 3;

    for (let i = 0; i < total; i += CONCURRENCY) {
      const batch = emailList.slice(i, i + CONCURRENCY);

      const promises = batch.map(async (email) => {
        try {
          // Determine API URL (using relative path via proxy or absolute if configured)
          // In development without emulation proxy, we might need full URL, but with proxy (firebase serve) relative works.
          // Assuming we will deploy or use local emulator with rewrites.
          // Fallback to local function port if on localhost and not proxied? 
          // Let's assume standard relative path '/api/verify' which we set up in firebase.json rewrites.

          const response = await fetch('/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const data = await response.json();
          return {
            original: email,
            ...data,
            status: data.valid ? 'Valid' : 'Invalid'
          };
        } catch (err) {
          console.error(err);
          return {
            original: email,
            email: email,
            valid: false,
            reason: "Request Failed / Error",
            status: 'Error'
          };
        }
      });

      const batchResults = await Promise.all(promises);

      // Update state logic
      // We shouldn't mutate state directly ideally, but for "streaming" we append
      newResults.push(...batchResults);
      processed += batch.length;

      // Update Results and Progress
      setResults((prev) => [...prev, ...batchResults]);
      setProgress(Math.round((processed / total) * 100));
      setStatusMessage(`Processed ${processed} of ${total}`);
    }

    setIsProcessing(false);
    setStatusMessage('Completed!');
  };

  const downloadCSV = () => {
    if (results.length === 0) return;

    // Format for CSV
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
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'email_verification_results.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-cyan-500 selection:text-white">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="mb-10 text-center">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4">
            Email Verifier Pro
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Lifetime Free Bulk Email Verification. Validate syntax, MX records, and SMTP availability with accuracy.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
              <h2 className="text-xl font-semibold mb-4 text-cyan-50 flex items-center justify-between">
                <span>Bulk Input</span>
                <span className="text-xs bg-slate-700 text-cyan-300 px-2 py-1 rounded-full border border-cyan-900/50">Free Forever</span>
              </h2>

              <textarea
                className="w-full h-80 bg-slate-900/50 border border-slate-700 text-slate-300 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none text-sm font-mono placeholder-slate-600"
                placeholder="Paste your email list here...&#10;user@example.com&#10;hello@domain.com, test@site.org"
                value={inputEmails}
                onChange={handleInputChange}
                disabled={isProcessing}
              ></textarea>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={processEmails}
                  disabled={isProcessing || !inputEmails.trim()}
                  className={`w-full py-3.5 px-6 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${isProcessing || !inputEmails.trim()
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/20'
                    }`}
                >
                  {isProcessing ? 'Verifying...' : 'Verify Emails'}
                </button>

                <button
                  onClick={downloadCSV}
                  disabled={results.length === 0 || isProcessing}
                  className={`w-full py-3.5 px-6 rounded-xl font-bold transition-all border ${results.length === 0 || isProcessing
                    ? 'border-slate-700 text-slate-600 cursor-not-allowed bg-transparent'
                    : 'border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                    }`}
                >
                  Download CSV
                </button>
              </div>

              {/* Progress Status */}
              {statusMessage && (
                <div className="mt-4 p-3 bg-slate-900/50 rounded-lg text-sm text-center text-slate-400 border border-slate-700/50">
                  {statusMessage}
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-cyan-50">Results</h2>

                {/* Progress Bar */}
                <div className="w-48 bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-purple-500 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex-1 overflow-auto rounded-xl border border-slate-700/50 bg-slate-900/30 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-900/80 sticky top-0 backdrop-blur-md z-10">
                    <tr>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Reason</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">MX</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {results.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-12 text-center text-slate-500 italic">
                          No results yet. Start verification to see data here.
                        </td>
                      </tr>
                    ) : (
                      results.map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                          <td className="p-4 text-sm font-medium text-slate-200">
                            {r.email || r.original}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${r.valid
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}>
                              {r.valid ? 'Valid' : 'Invalid'}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-slate-400 hidden sm:table-cell">
                            {r.reason || (r.valid ? 'Verified' : 'Unknown')}
                          </td>
                          <td className="p-4 text-xs text-slate-500 font-mono hidden md:table-cell">
                            {r.mx || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>

        {/* Pricing Section */}
        <section className="mt-20 mb-10">
          <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-12">
            Simple, Transparent Pricing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 hover:border-cyan-500/50 transition-all group">
              <h3 className="text-xl font-semibold text-cyan-300 mb-4">Starter</h3>
              <div className="text-4xl font-bold text-white mb-6">$0<span className="text-lg text-slate-500 font-normal">/mo</span></div>
              <ul className="space-y-4 text-slate-400 mb-8">
                <li className="flex items-center"><span className="text-cyan-500 mr-2">✓</span> 100 verifications / day</li>
                <li className="flex items-center"><span className="text-cyan-500 mr-2">✓</span> Standard speed</li>
                <li className="flex items-center"><span className="text-cyan-500 mr-2">✓</span> CSV Export</li>
              </ul>
              <button className="w-full py-3 rounded-xl border border-cyan-500/30 text-cyan-400 font-semibold hover:bg-cyan-500/10 transition-all">Current Plan</button>
            </div>

            {/* Pro Plan */}
            <div className="relative bg-slate-800/80 backdrop-blur-xl border border-purple-500/50 rounded-2xl p-8 transform md:-translate-y-4 shadow-2xl shadow-purple-900/20">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">POPULAR</div>
              <h3 className="text-xl font-semibold text-white mb-4">Professional</h3>
              <div className="text-4xl font-bold text-white mb-6">$29<span className="text-lg text-slate-500 font-normal">/mo</span></div>
              <ul className="space-y-4 text-slate-300 mb-8">
                <li className="flex items-center"><span className="text-purple-400 mr-2">✓</span> Unlimited verifications</li>
                <li className="flex items-center"><span className="text-purple-400 mr-2">✓</span> Priority Streaming</li>
                <li className="flex items-center"><span className="text-purple-400 mr-2">✓</span> API Access</li>
                <li className="flex items-center"><span className="text-purple-400 mr-2">✓</span> Advanced Analytics</li>
              </ul>
              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all">Get Started</button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 hover:border-purple-500/50 transition-all">
              <h3 className="text-xl font-semibold text-purple-300 mb-4">Enterprise</h3>
              <div className="text-4xl font-bold text-white mb-6">$99<span className="text-lg text-slate-500 font-normal">/mo</span></div>
              <ul className="space-y-4 text-slate-400 mb-8">
                <li className="flex items-center"><span className="text-purple-500 mr-2">✓</span> Dedicated Server</li>
                <li className="flex items-center"><span className="text-purple-500 mr-2">✓</span> 99.9% Uptime SLA</li>
                <li className="flex items-center"><span className="text-purple-500 mr-2">✓</span> Custom Integrations</li>
              </ul>
              <button className="w-full py-3 rounded-xl border border-purple-500/30 text-purple-400 font-semibold hover:bg-purple-500/10 transition-all">Contact Sales</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
