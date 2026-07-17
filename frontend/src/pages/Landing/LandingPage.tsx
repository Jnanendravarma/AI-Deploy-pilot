import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [termStep, setTermStep] = useState(0);

  const terminalLines = [
    { type: 'cmd', text: 'git push deploypilot main' },
    { type: 'log', text: 'Enumerating objects: 14, done.' },
    { type: 'log', text: 'Counting objects: 100% (14/14), done.' },
    { type: 'log', text: 'Writing objects: 100% (14/14), 2.84 KiB | 2.84 MiB/s, done.' },
    { type: 'log', text: '   main -> main' },
    { type: 'info', text: '🤖 DeployPilot AI: Initializing compile pipeline...' },
    { type: 'info', text: '🔍 Analyzing Build...' },
    { type: 'info', text: '📦 Detecting Framework: Next.js (App Router v15)' },
    { type: 'info', text: '🛠️ Commencing build command: \'npm run build\'' },
    { type: 'log', text: '> next build' },
    { type: 'log', text: '   Creating an optimized production build...' },
    { type: 'log', text: ' ✓ Compiled successfully' },
    { type: 'log', text: '   Finding Issues...' },
    { type: 'error', text: '❌ Build Error: Failed to compile page "/api/telemetry"' },
    { type: 'error', text: 'ReferenceError: DEPLOYPILOT_API_KEY is not defined' },
    { type: 'error', text: '    at Page (/workspace/app/api/telemetry/route.js:12:35)' },
    { type: 'info', text: '🩹 Healing Configuration...' },
    { type: 'info', text: '✨ Configured environment variable \'DEPLOYPILOT_API_KEY\' in production environment.' },
    { type: 'info', text: '🔄 Restarting build step: \'npm run build\'' },
    { type: 'log', text: '> next build' },
    { type: 'log', text: ' ✓ Compiled successfully' },
    { type: 'log', text: ' ✓ Generating static pages (12/12) finished' },
    { type: 'success', text: '✓ Production build completed successfully!' },
    { type: 'success', text: '🚀 Launching Containers (deployed to 24 edge nodes)' },
    { type: 'success', text: '🎉 Live URL: https://deploypilot-dashboard-v3.deploypilot.app' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTermStep((prev) => {
        if (prev < terminalLines.length - 1) return prev + 1;
        return 0; // restart
      });
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-bg-dark text-slate-100 min-h-screen relative overflow-hidden font-body flex flex-col justify-between">
      {/* Background overlays */}
      <div className="auth-grid-overlay" />
      <div className="auth-radial-glow" />

      {/* Frosted Header Menu */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-slate-950/40 backdrop-blur-md border-b border-white/5 z-50 px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-lg select-none">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.35)]">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 3L3 10.5L10.5 13.5L13.5 21L21 3Z" />
              <path d="M10.5 13.5L21 3" />
            </svg>
          </div>
          <span>DeployPilot <span className="font-normal opacity-70">AI</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400 select-none">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#terminal" className="hover:text-white transition">Live Terminal</a>
          <a href="#pricing" className="hover:text-white transition">Pricing</a>
          <a href="#faqs" className="hover:text-white transition">FAQs</a>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2">
            Sign In
          </Link>
          <Link to="/signup" className="text-xs font-semibold text-white bg-primary hover:bg-indigo-600 px-4 py-2.5 rounded-xl border border-indigo-500/20 transition hover:shadow-[0_0_15px_rgba(99,102,241,0.35)]">
            Get Started Free
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-8 text-center max-w-4xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/3 border border-white/8 rounded-full text-xs text-slate-400 font-semibold mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span>Autopilot Healing Engine Live</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight select-none">
          Deploy with Autopilot.<br />
          <span className="text-gradient-purple">Heal in Real-Time.</span>
        </h1>
        
        <p className="text-base md:text-lg text-slate-400 leading-relaxed mb-10 max-w-2xl">
          DeployPilot AI manages compilation configs, fixes missing secrets, and scales static frameworks to 24 edge nodes automatically.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 select-none">
          <Link to="/signup" className="px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-indigo-600 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all">
            Get Started Free
          </Link>
          <Link to="/dashboard" className="px-6 py-3 rounded-xl bg-white/5 text-white font-semibold text-sm hover:bg-white/10 border border-white/8 transition">
            View Live Dashboard
          </Link>
        </div>
      </section>

      {/* Simulated Terminal Demo */}
      <section id="terminal" className="py-16 px-8 max-w-3xl mx-auto w-full select-none">
        <div className="bg-slate-950/80 border border-white/8 rounded-2xl overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]">
          <div className="bg-slate-900 border-b border-white/6 px-4 py-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/30" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/30" />
            <span className="w-3 h-3 rounded-full bg-green-500/30" />
            <span className="text-[10px] text-slate-500 font-bold font-mono ml-2">Console Terminal Simulator</span>
          </div>

          <div className="p-6 font-mono text-xs leading-relaxed max-h-[360px] overflow-y-auto min-h-[300px] flex flex-col gap-2">
            {terminalLines.slice(0, termStep + 1).map((line, idx) => {
              const textClass = 
                line.type === 'cmd' ? 'text-indigo-400' :
                line.type === 'info' ? 'text-indigo-300' :
                line.type === 'error' ? 'text-red-400' :
                line.type === 'success' ? 'text-emerald-400' : 'text-slate-400';
              return (
                <div key={idx} className="flex gap-4">
                  <span className="text-slate-700 w-4 select-none">{(idx+1).toString().padStart(2, '0')}</span>
                  <span className={textClass}>
                    {line.type === 'cmd' && '$ '}
                    {line.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Traditional vs DeployPilot Grid */}
      <section id="features" className="py-20 px-8 max-w-5xl mx-auto w-full select-none">
        <h2 className="text-2xl md:text-4xl font-bold text-center text-white mb-12">Built for Smarter Deployments</h2>
        
        <div className="grid md:grid-columns-2 gap-8 grid-cols-1 md:grid-cols-2">
          {/* Traditional */}
          <div className="bg-white/2 border border-white/6 rounded-2xl p-8 relative">
            <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-b from-white/5 to-transparent pointer-events-none -z-10" />
            <h3 className="text-lg font-bold text-slate-400 mb-6 flex items-center gap-2">
              <span className="text-red-400">❌</span> Traditional Deployment
            </h3>
            <ul className="flex flex-col gap-4 text-sm text-slate-400">
              <li>❌ Debug compilation errors yourself</li>
              <li>❌ Search StackOverflow for config errors</li>
              <li>❌ Manually check Docker network exposures</li>
              <li>❌ Waste hours on deployment diagnostics</li>
            </ul>
          </div>

          {/* DeployPilot */}
          <div className="bg-indigo-950/10 border border-indigo-500/25 rounded-2xl p-8 relative shadow-[0_0_30px_rgba(99,102,241,0.06)]">
            <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-b from-indigo-500/20 to-transparent pointer-events-none -z-10" />
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-emerald-400">✔</span> DeployPilot AI Autopilot
            </h3>
            <ul className="flex flex-col gap-4 text-sm text-slate-300">
              <li>✔ Autonomous error scanning & healing</li>
              <li>✔ AI Explanations detailing root-causes</li>
              <li>✔ One-click sandbox config repair patch</li>
              <li>✔ 50ms Edge Telemetry Health Monitoring</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Framework Grid */}
      <section className="py-16 px-8 max-w-4xl mx-auto w-full text-center select-none">
        <h2 className="text-xl font-bold text-white mb-8">Deploy Any Stack to the Edge</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {['Next.js', 'React', 'Node.js', 'Docker', 'Python', 'Astro'].map((fw) => (
            <div key={fw} className="bg-white/2 border border-white/6 rounded-xl py-4 font-semibold text-xs text-slate-300 hover:border-indigo-500/30 hover:text-white transition">
              {fw}
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-8 max-w-4xl mx-auto w-full select-none">
        <h2 className="text-2xl md:text-4xl font-bold text-center text-white mb-4">Pricing Plans</h2>
        <p className="text-center text-xs text-slate-400 mb-8">Start free, scale as you grow.</p>
        
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-xs ${!isAnnual ? 'text-white' : 'text-slate-500'} font-bold`}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-11 h-6 bg-indigo-950/80 border border-indigo-500/30 rounded-full relative p-1 transition cursor-pointer"
          >
            <div className={`w-4 h-4 bg-primary rounded-full transition-all duration-300 ${isAnnual ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <span className={`text-xs ${isAnnual ? 'text-white' : 'text-slate-500'} font-bold`}>Annual (Save 20%)</span>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Sandbox Free */}
          <div className="bg-white/2 border border-white/6 rounded-2xl p-8 relative flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-400 mb-2">Sandbox Free</h3>
              <p className="text-2xl font-bold text-white mb-6">$0</p>
              <ul className="flex flex-col gap-3 text-xs text-slate-400 mb-8 leading-normal">
                <li>• 3 connected repositories</li>
                <li>• Static builds & client frameworks</li>
                <li>• Basic deployment doctor</li>
                <li>• Global edge synchronization</li>
              </ul>
            </div>
            <Link to="/signup" className="w-full text-center border border-white/10 hover:border-indigo-500/20 p-2.5 rounded-xl bg-white/2 hover:bg-indigo-500/5 text-xs text-slate-300 hover:text-white font-bold transition">
              Get Started Free
            </Link>
          </div>

          {/* Autopilot Pro */}
          <div className="bg-indigo-950/10 border border-indigo-500/25 rounded-2xl p-8 relative flex flex-col justify-between shadow-[0_0_30px_rgba(99,102,241,0.06)]">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-white">Autopilot Pro</h3>
                <span className="bg-primary/20 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20 uppercase tracking-wider">Popular</span>
              </div>
              <p className="text-2xl font-bold text-white mb-6">
                ${isAnnual ? '39' : '49'}<span className="text-xs text-slate-500 font-semibold"> / mo</span>
              </p>
              <ul className="flex flex-col gap-3 text-xs text-slate-300 mb-8 leading-normal">
                <li>• Unlimited connected repositories</li>
                <li>• Full-Stack containers (Node, Docker, Python)</li>
                <li>• Advanced AI self-healing configurations</li>
                <li>• Real-Time CPU/Memory Ingress Telemetry</li>
                <li>• Custom domain SSL binding support</li>
              </ul>
            </div>
            <Link to="/signup" className="w-full text-center p-2.5 rounded-xl bg-primary hover:bg-indigo-600 text-xs text-white font-bold transition shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faqs" className="py-20 px-8 max-w-3xl mx-auto w-full select-none">
        <h2 className="text-2xl md:text-4xl font-bold text-center text-white mb-12">Frequently Asked Questions</h2>
        
        <div className="flex flex-col gap-4">
          <div className="bg-white/2 border border-white/6 rounded-xl p-6">
            <h3 className="text-sm font-bold text-white mb-2">How does the Autopilot Heal process work?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              If your build command fails during compilation, our edge agent analyzes compile logs, identifies the root cause (like missing secrets or configuration file errors), and proposes a drop-in patch. You can review and apply the patch with a single click.
            </p>
          </div>

          <div className="bg-white/2 border border-white/6 rounded-xl p-6">
            <h3 className="text-sm font-bold text-white mb-2">Can I connect custom domain names?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Yes. Autopilot Pro supports binding custom domain names with automatic certificate generation. Once linked, SSL certificates resolve and become active securely within seconds.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-xs text-slate-500 font-semibold select-none bg-slate-950/20">
        &copy; 2026 DeployPilot AI, Inc. All rights reserved.
      </footer>

    </div>
  );
};
