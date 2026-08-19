import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';

const QUOTE_TEXT = '"Justice is the constant and perpetual will to allot to every man his due."';

export default function LoginSignup({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both your email/chamber identifier and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000${isLogin ? '/auth/login' : '/auth/register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Authorization failed');
      onLogin(data);
    } catch (err) {
      // Fallback guest login if backend offline
      if (err.message.includes('Failed to fetch')) {
        onLogin({ access_token: 'local_token', token_type: 'bearer', username: email.trim().split('@')[0] || 'Senior_Counsel' });
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoGuest = () => {
    onLogin({ access_token: 'guest_token', token_type: 'bearer', username: 'Senior_Counsel' });
  };

  return (
    <div className="bg-[#0E0F12] text-[#e3e2e6] h-screen w-full flex overflow-hidden font-eb-garamond relative">
      {/* Full Screen Cinematic Background */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <img
          alt="Cinematic Background"
          className="w-full h-full object-cover animate-ken-burns transform scale-105"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuB977YX3BAZGaoKPDNf8j2dfhXW6y6HUeQYGgY10ItFk9MMezO9wMpqRDzrugoJBqIy2pOuPlFa0CTnRDKHXLbyyvxSSPgR4ino6-h5iUm4Ao2i1pCbHTnfp7FW2BlL3j113TASmEAaZbeRIkznkox2PJBjeaOX_23RazBNluFtDM2zLGocVoYd4ELgBH_ySxCkju3vHFPY_pZMy5Jum9tOBWgNvBjXJOZs9jtUKesYRUMWEs_fN7Wn"
        />
      </div>

      {/* WebGL Overlay / Obsidian Gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#0E0F12]/90 via-[#0E0F12]/40 to-[#0E0F12]/60 z-0 pointer-events-none mix-blend-multiply" />

      {/* Left Panel: Brand & Quote */}
      <div className="hidden md:flex relative w-1/2 h-full items-center justify-center p-16 z-10">
        <div className="relative z-10 max-w-2xl text-center space-y-8 drop-shadow-2xl">
          <p className="font-eb-garamond text-[48px] md:text-[64px] leading-tight md:leading-[1.1] text-liquid-gold italic">
            {QUOTE_TEXT.split('').map((char, index) => (
              <span
                key={index}
                className="char-reveal"
                style={{ animationDelay: `${index * 0.035}s` }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </p>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="w-full md:w-1/2 h-full flex flex-col justify-center px-5 md:px-16 relative z-10">
        <div className="glass-slab max-w-md w-full mx-auto p-10 rounded-2xl transition-all duration-700">
          <div className="relative z-10">
            {/* Header / Logo */}
            <div className="flex flex-col items-center space-y-6 mb-8 animate-fade-in-right delay-100">
              <img
                alt="Samvidhan AI Logo"
                className="h-24 w-auto object-contain drop-shadow-[0_0_15px_rgba(176,141,87,0.5)]"
                src="https://lh3.googleusercontent.com/aida/AP1WRLsoQtPQpzaHhixh-HrHMjpHVEpOW5KN6J0B8gB0pfGfvHAK3malkrB8ezKV1yeyAxzOTr-NpArDDJwaaPA8Q9mDUrkecHlWtPgSAT5YgXxle1ynHwWdK24uYRZ5tLNpTsJ-VX2OMP7Nrz7TqIL_CsBIsho-FzR3CuOLDi-TjxssKb8WmMsiQ9AtVPWnXHk3XlhRNPVXYmljzy5Bp5Hz51GATRMMpRbAZBqqOmhkoFG56g9jgGg7A-qdQhY"
              />
              <p className="text-[18px] text-[#d1c5b6] font-eb-garamond text-center">
                {isLogin ? 'Sign in to your chamber' : 'Register your private chamber account'}
              </p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-950/60 border border-red-500/30 text-red-300 px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 mb-4 font-inter"
                >
                  <span className="material-symbols-outlined text-sm text-red-400">warning</span>
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className="relative animate-fade-in-right delay-200">
                <label className="sr-only" htmlFor="email">Email address</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-[#d1c5b6]/50 pointer-events-none" style={{ fontSize: '20px' }}>
                    mail
                  </span>
                  <input
                    className="carved-input font-inter text-[16px] peer pl-11"
                    id="email"
                    name="email"
                    placeholder="Email address or Chamber ID"
                    required
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="relative animate-fade-in-right delay-300">
                <label className="sr-only" htmlFor="password">Password</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-[#d1c5b6]/50 pointer-events-none" style={{ fontSize: '20px' }}>
                    lock
                  </span>
                  <input
                    className="carved-input font-inter text-[16px] peer pl-11 pr-11"
                    id="password"
                    name="password"
                    placeholder="Password"
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    className="absolute right-2 text-[#d1c5b6]/50 hover:text-[#B08D57] transition-colors ease-out duration-300 p-1"
                    title={showPassword ? "Hide Password" : "Show Password"}
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Forgot Password & Toggle */}
              <div className="flex items-center justify-between font-inter text-xs pt-1 animate-fade-in-right delay-400">
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setError(null); }}
                  className="text-[#d1c5b6]/80 hover:text-[#B08D57] transition-colors underline underline-offset-4"
                >
                  {isLogin ? "Need a chamber? Register" : "Already registered? Sign in"}
                </button>
                <a className="font-medium text-[#d1c5b6]/80 hover:text-[#B08D57] transition-colors ease-out duration-300" href="#forgot" onClick={(e) => { e.preventDefault(); handleDemoGuest(); }}>
                  Forgot password?
                </a>
              </div>

              {/* Sign In Action */}
              <div className="pt-2 animate-fade-in-right delay-500">
                <button
                  className="w-full bg-gradient-to-r from-[#B08D57] to-[#775928] text-[#0E0F12] text-[16px] font-semibold py-3.5 px-4 rounded-lg shadow-[0_0_20px_rgba(176,141,87,0.3)] hover:shadow-[0_0_30px_rgba(176,141,87,0.6)] transition-all duration-300 ease-out active:scale-[0.98] hover-pulse font-inter uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
                  type="submit"
                  disabled={loading}
                >
                  {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                  <span>{isLogin ? 'Sign in' : 'Register Chamber'}</span>
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative flex items-center py-6 animate-fade-in-right delay-600">
              <div className="flex-grow border-t border-[#B08D57]/20 shadow-[0_1px_0_rgba(255,255,255,0.05)]"></div>
              <span className="flex-shrink-0 mx-4 text-[12px] text-[#d1c5b6]/70 font-inter tracking-widest uppercase">OR</span>
              <div className="flex-grow border-t border-[#B08D57]/20 shadow-[0_1px_0_rgba(255,255,255,0.05)]"></div>
            </div>

            {/* Google / Quick Access Button */}
            <div className="space-y-3 animate-fade-in-right delay-700">
              <button
                className="w-full flex items-center justify-center gap-3 border border-[#B08D57]/30 bg-black/20 text-[#B08D57] text-[15px] font-medium py-3 px-4 rounded-lg hover:bg-[#B08D57]/10 hover:border-[#B08D57]/60 hover:shadow-[0_0_20px_rgba(176,141,87,0.15)] transition-all duration-300 ease-out font-inter backdrop-blur-sm"
                type="button"
                onClick={handleDemoGuest}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>account_circle</span>
                Continue with Google
              </button>
              <button
                className="w-full flex items-center justify-center gap-2 text-[12px] text-[#d1c5b6]/60 hover:text-[#B08D57] transition-colors font-inter"
                type="button"
                onClick={handleDemoGuest}
              >
                <span className="material-symbols-outlined text-[16px]">lock_open</span>
                Enter as Guest / Senior Counsel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
