import React, { useState } from 'react';
import { useProjects } from '../context/ProjectContext';

export const AIAssistant: React.FC = () => {
  const { triggerToast } = useProjects();
  const [isOpen, setIsOpen] = useState(false);
  const [userQuery, setUserQuery] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const handleSelectOption = (optionId: number, queryText: string) => {
    setUserQuery(queryText);
    setAiResponse(null);
    setIsTyping(true);

    let answer = '';
    switch (optionId) {
      case 1:
        answer = 'I recommend checking that your network ports permit WebSockets connections to DeployPilot edge tunnels. If your organization implements VPN firewall filters, try whitelisting `*.deploypilot.app` in your gateway configurations.';
        break;
      case 2:
        answer = 'GitHub reports heavy API traffic load. Clear cookies for `github.com` in your browser settings, or confirm your user profile shares email visibility credentials.';
        break;
      case 3:
        answer = 'Please check that popups are not blocked by browser extension content filters. Clear active memory cache and try reloading your workspace page.';
        break;
      case 4:
        answer = "No worries! Close this assistant, enter your email address in the input field above, and click 'Forgot Password?' to dispatch a secure verification code to your inbox.";
        break;
      case 5:
        answer = 'For Docker builds, ensure your Dockerfile exposes the correct PORT environment variable (usually 3000 or 8080) and uses a multi-stage build block to minimize output sizes.';
        break;
      default:
        answer = 'I am scanning the infrastructure registers. Telemetry checks report all edge nodes online. Uptime stands at 100%.';
    }

    setTimeout(() => {
      setIsTyping(false);
      setAiResponse(answer);
    }, 1200);
  };

  const resetChat = () => {
    setUserQuery(null);
    setAiResponse(null);
  };

  return (
    <>
      {/* Floating Pill Button */}
      <button
        onClick={() => {
          setIsOpen(true);
          triggerToast('AI Companion Active', 'success');
        }}
        className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-4 py-3 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/30 rounded-full text-sm font-semibold text-white shadow-[0_10px_30px_rgba(99,102,241,0.2)] transition-all duration-300 hover:-translate-y-0.5 cursor-pointer active:scale-95"
      >
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
        <span>🤖 Deployment Doctor</span>
        <span className="text-xs text-slate-400 ml-1">• Need help?</span>
      </button>

      {/* Interactive Assistant Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[9999] w-[360px] bg-slate-950/95 backdrop-blur-2xl border border-white/8 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[480px] animate-slide-up">
          <div className="bg-gradient-to-r from-indigo-950/20 to-purple-950/10 border-b border-white/6 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <span className="font-bold text-sm text-white">Deployment Doctor</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white cursor-pointer select-none"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
            {!userQuery ? (
              <>
                <div className="bg-white/3 border border-white/4 p-3.5 rounded-xl rounded-tl-none text-xs leading-relaxed text-slate-300">
                  Hello! I am your AI assistant. Scan your deployment logs or choose a common issue below:
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleSelectOption(1, "Why can't I sign in?")}
                    className="w-full text-left bg-white/2 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/20 p-2.5 rounded-lg text-xs text-slate-300 transition-all duration-200 cursor-pointer"
                  >
                    Why can't I sign in?
                  </button>
                  <button
                    onClick={() => handleSelectOption(2, "GitHub OAuth isn't working.")}
                    className="w-full text-left bg-white/2 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/20 p-2.5 rounded-lg text-xs text-slate-300 transition-all duration-200 cursor-pointer"
                  >
                    GitHub OAuth isn't working.
                  </button>
                  <button
                    onClick={() => handleSelectOption(3, "Google authentication failed.")}
                    className="w-full text-left bg-white/2 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/20 p-2.5 rounded-lg text-xs text-slate-300 transition-all duration-200 cursor-pointer"
                  >
                    Google authentication failed.
                  </button>
                  <button
                    onClick={() => handleSelectOption(5, "How do Docker exposures work?")}
                    className="w-full text-left bg-white/2 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/20 p-2.5 rounded-lg text-xs text-slate-300 transition-all duration-200 cursor-pointer"
                  >
                    How do Docker exposures work?
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="self-end bg-indigo-500/15 border border-indigo-500/20 p-3 rounded-xl rounded-tr-none text-xs text-indigo-200 font-semibold max-w-[85%]">
                  {userQuery}
                </div>

                {isTyping && (
                  <div className="flex gap-1.5 p-3 items-center">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:200ms]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:400ms]" />
                  </div>
                )}

                {aiResponse && (
                  <div className="bg-white/3 border border-white/4 p-3.5 rounded-xl rounded-tl-none text-xs leading-relaxed text-slate-300 flex flex-col gap-3">
                    <p>{aiResponse}</p>
                    <button
                      onClick={resetChat}
                      className="mt-2 text-center border border-white/10 hover:border-indigo-500/20 p-2 rounded-lg bg-white/2 hover:bg-indigo-500/5 text-[10px] text-slate-400 hover:text-white transition-all cursor-pointer font-bold"
                    >
                      ← Ask another question
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
