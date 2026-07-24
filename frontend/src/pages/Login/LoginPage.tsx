import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useProjects } from '../../context/ProjectContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { triggerToast, login } = useProjects();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loadingStep, setLoadingStep] = useState(0); // 0: Idle, 1: Authenticating, 2: Credentials check, 3: Workspace load

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const accessToken = query.get('accessToken');
    const refreshToken = query.get('refreshToken');

    if (accessToken && refreshToken) {
      localStorage.setItem('deploypilot_access_token', accessToken);
      localStorage.setItem('deploypilot_refresh_token', refreshToken);
      triggerToast('OAuth login successful', 'success');
      navigate('/dashboard');
    }
  }, [location.search, navigate, triggerToast]);

  const handleOAuth = async (provider: string) => {
    if (provider.toLowerCase() === 'github') {
      triggerToast('Redirecting to GitHub OAuth via Supabase...', 'success');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: 'http://localhost:5173/dashboard'
        }
      });
      if (error) {
        triggerToast(error.message, 'error');
      }
    } else {
      triggerToast(`Redirecting to ${provider} OAuth...`, 'success');
      window.location.href = `http://localhost:5000/api/auth/oauth/${provider.toLowerCase()}`;
    }
  };

  const validateEmail = (val: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let isValid = true;

    if (!email || !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError('');
    }

    if (!password || password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }

    if (isValid) {
      try {
        setLoadingStep(1);
        setLoadingStep(2);
        await login(email, password);
        setLoadingStep(3);
        navigate('/dashboard');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed';
        triggerToast(message, 'error');
      } finally {
        setLoadingStep(0);
      }
    }
  };

  const getSubmitLabel = () => {
    switch (loadingStep) {
      case 1: return 'Authenticating...';
      case 2: return 'Checking credentials...';
      case 3: return 'Loading your workspace...';
      default: return 'Sign In';
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(20,184,166,0.22),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(245,158,11,0.14),transparent_28%),radial-gradient(circle_at_70%_80%,rgba(34,197,94,0.12),transparent_26%)]" />
        <div className="absolute inset-0 opacity-35 [background:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:42px_42px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col p-5 sm:p-8 lg:flex-row lg:items-center lg:gap-10 lg:p-12">
        <section className="w-full lg:w-1/2">
          <Link to="/" className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 font-heading text-sm font-semibold tracking-wide text-white transition hover:border-teal-300/40 hover:bg-white/10">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-teal-300 via-cyan-300 to-emerald-400 text-slate-900">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                <path d="M4 12.5L9 17.5L20 6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            DeployPilot AI
          </Link>

          <div className="mt-8 max-w-xl">
            <p className="inline-flex items-center rounded-full border border-amber-300/20 bg-amber-200/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100">
              Operations Control Layer
            </p>
            <h1 className="mt-4 font-heading text-4xl leading-tight text-white sm:text-5xl">
              Sign in and resume your
              <span className="block bg-gradient-to-r from-teal-200 via-cyan-100 to-amber-100 bg-clip-text text-transparent">deployment command center.</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-slate-300 sm:text-base">
              Monitor pipelines, heal failed releases, and push production updates from one focused dashboard designed for engineering velocity.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/12 bg-white/5 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Mean Recovery Time</p>
              <p className="mt-2 font-heading text-2xl text-teal-200">2m 11s</p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/5 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Global Edge Health</p>
              <p className="mt-2 font-heading text-2xl text-emerald-200">99.992%</p>
            </div>
          </div>
        </section>

        <section className="mt-8 w-full lg:mt-0 lg:w-1/2">
          <div className="mx-auto w-full max-w-md rounded-3xl border border-white/15 bg-slate-900/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.6)] backdrop-blur-xl sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-white">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-400">Sign in to continue deploying smarter.</p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => handleOAuth('Google')}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-slate-100 transition hover:border-teal-300/40 hover:bg-white/10"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                  <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.99 5.99 0 0 1 8 12.5a5.99 5.99 0 0 1 5.99-6.012c1.49 0 2.859.55 3.905 1.455l3.055-3.055C18.995 2.99 16.59 2 13.99 2A10.5 10.5 0 0 0 3.5 12.5a10.5 10.5 0 0 0 10.49 10.5c5.783 0 10.41-4.185 10.41-10.5 0-.71-.06-1.4-.18-2.072H12.24z" />
                </svg>
                Continue with Google
              </button>

              <button
                type="button"
                onClick={() => handleOAuth('GitHub')}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-slate-100 transition hover:border-teal-300/40 hover:bg-white/10"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                Continue with GitHub
              </button>
            </div>

            <div className="my-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
              <span className="h-px flex-1 bg-white/12" />
              or continue with email
              <span className="h-px flex-1 bg-white/12" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                id="login-email"
                type="email"
                label="Email Address"
                placeholder="sarah@skynet.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                error={emailError}
                icon={(
                  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                )}
              />

              <Input
                id="login-password"
                type="password"
                label="Password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                error={passwordError}
                icon={(
                  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                )}
              />

              <div className="flex items-center justify-between gap-4 select-none">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" id="remember-me" className="w-4 h-4 bg-slate-900 border-white/10 rounded" />
                  <span className="text-xs text-slate-400 select-none">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => triggerToast('Select "Forgot Password?" under diagnostic options inside Doctor drawer.', 'success')}
                  className="auth-link text-xs text-primary font-bold bg-transparent border-none cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full h-12 text-sm mt-2"
                isLoading={loadingStep > 0}
              >
                {getSubmitLabel()}
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400 select-none">
              Don't have an account? <Link to="/signup" className="text-primary font-bold hover:underline">Create Account →</Link>
            </div>

            <div className="mt-4 border-t border-white/10 pt-4 text-center text-[11px] text-slate-500 select-none">
              Need help signing in?{' '}
              <button
                type="button"
                onClick={() => {
                  const pill = document.querySelector('.ai-companion-pill') as HTMLButtonElement;
                  if (pill) pill.click();
                }}
                className="text-primary font-bold hover:underline bg-transparent"
              >
                🤖 Ask Deployment Doctor
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
