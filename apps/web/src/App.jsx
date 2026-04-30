import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Search, Activity, Loader2 } from 'lucide-react';

function App() {
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!link) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ link }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'Failed to scan link');
      }

      setResult(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-16 md:py-24">
      <header className="text-center mb-16">
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-500/10 p-6 rounded-3xl border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
            <Shield className="w-16 h-16 text-indigo-500" />
          </div>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 text-gradient">
          Guardian AI
        </h1>
        <p className="text-xl text-slate-400 font-light">
          Advanced Video Piracy Detection System
        </p>
      </header>

      <main className="glass-panel rounded-3xl p-8 md:p-10">
        <form onSubmit={handleScan} className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <input
                type="url"
                placeholder="https://example.com/video.mp4"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-slate-50 font-mono text-lg transition-all duration-300 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || !link}
              className="bg-gradient-to-br from-indigo-500 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 text-white font-semibold rounded-2xl px-8 py-4 flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-1 hover:shadow-[0_10px_20px_-10px_rgba(99,102,241,1)]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Scan Target
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-2xl mb-8 flex items-center gap-3 animate-[fadeIn_0.5s_ease-out]">
            <Activity className="w-6 h-6 flex-shrink-0" />
            <span className="text-lg">{error}</span>
          </div>
        )}

        {result && (
          <div className="animate-[fadeIn_0.5s_ease-out_forwards]">
            <div className="bg-black/30 border border-white/10 rounded-2xl p-8">
              
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm mb-8 border ${
                result?.piracy?.isPirated 
                  ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                  : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              }`}>
                {result?.piracy?.isPirated ? (
                  <>
                    <ShieldAlert className="w-5 h-5" />
                    Piracy Detected
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    Clean / Safe
                  </>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col gap-2">
                  <span className="text-slate-400 text-sm uppercase tracking-wider font-semibold">
                    Confidence Score
                  </span>
                  <span className="text-2xl font-semibold text-slate-100">
                    {result?.piracy?.confidence ? `${(result.piracy.confidence * 100).toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                
                <div className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-slate-400 text-sm uppercase tracking-wider font-semibold">
                    Analysis Details
                  </span>
                  <span className="text-lg text-slate-300 leading-relaxed">
                    {result?.piracy?.details || 'No detailed analysis provided.'}
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
