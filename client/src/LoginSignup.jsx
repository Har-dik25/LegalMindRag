import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const QUOTE_TEXT = "Justice is the constant and perpetual will to allot to every man his due.";

export default function LoginSignup({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both your identifier and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000${isLogin ? '/auth/login' : '/auth/register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Authorization failed');
      onLogin(data);
    } catch (err) {
      // Fallback guest login if backend auth fails
      if (err.message.includes('Failed to fetch')) {
        onLogin({ access_token: 'local_token', token_type: 'bearer', username: username.trim() });
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
      {/* Full Screen Cinematic Background with Ken Burns Effect */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <img
          alt="Cinematic Supreme Court Chamber"
          className="w-full h-full object-cover animate-ken-burns transform scale-105 opacity-40"
          src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=2000&q=80"
        />
      </div>

      {/* Deep Obsidian Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#0E0F12]/95 via-[#0E0F12]/80 to-[#0E0F12]/60 z-0 pointer-events-none" />

      {/* Left Panel: Brand & Quote */}
      <div className="hidden md:flex relative w-1/2 h-full items-center justify-center p-16 z-10">
        <div className="relative z-10 max-w-2xl text-center space-y-8 drop-shadow-2xl">
          <div className="flex justify-center mb-6">
            <span className="material-symbols-outlined text-[#B08D57] text-[54px] drop-shadow-[0_0_15px_rgba(176,141,87,0.5)]">
              balance
            </span>
          </div>

          <p className="font-eb-garamond text-[42px] lg:text-[54px] leading-tight text-liquid-gold italic">
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

          <div className="h-px w-20 bg-[#B08D57]/40 mx-auto mt-6 shadow-[0_0_8px_rgba(176,141,87,0.4)]" />
          <p className="font-inter text-xs tracking-widest text-[#d1c5b6]/60 uppercase">
            Samvidhan AI · Republic of India Legal Intelligence
          </p>
        </div>
      </div>

      {/* Right Panel: Login Form Slab */}
      <div className="w-full md:w-1/2 h-full flex flex-col justify-center px-5 md:px-16 relative z-10">
        <div className="glass-slab max-w-md w-full mx-auto p-8 md:p-10 rounded-2xl transition-all duration-700">
          <div className="relative z-10">
            {/* Header */}
            <div className="flex flex-col items-center space-y-3 mb-8">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#B08D57] text-[32px]">
                  gavel
                </span>
                <h1 className="font-fraunces text-[28px] md:text-[32px] text-[#B08D57] tracking-tight font-medium">
                  Samvidhan AI
                </h1>
              </div>
              <p className="text-[16px] text-[#d1c5b6]/80 font-eb-garamond text-center">
                {isLogin ? 'Sign in to your private legal chamber' : 'Create your private chamber account'}
              </p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-950/40 border border-red-500/30 text-red-300 px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 mb-6 font-inter"
                >
                  <span className="material-symbols-outlined text-sm text-red-400">warning</span>
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email / Username Field */}
              <div className="relative">
                <label className="sr-only" htmlFor="username">Email or Chamber ID</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-[#d1c5b6]/40 pointer-events-none" style={{ fontSize: '20px' }}>
                    mail
                  </span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Chamber ID or Email address"
                    className="carved-input font-inter text-[15px] pl-11"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="relative">
                <label className="sr-only" htmlFor="password">Password</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-[#d1c5b6]/40 pointer-events-none" style={{ fontSize: '20px' }}>
                    lock
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Chamber Password"
                    className="carved-input font-inter text-[15px] pl-11 pr-11"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[#d1c5b6]/40 hover:text-[#B08D57] transition-colors p-1"
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Actions & Forgot Password */}
              <div className="flex items-center justify-between font-inter text-xs pt-1">
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setError(null); }}
                  className="text-[#d1c5b6]/70 hover:text-[#B08D57] transition-colors underline underline-offset-4"
                >
                  {isLogin ? "Need a chamber? Register" : "Already have a chamber? Sign in"}
                </button>
                <button
                  type="button"
                  onClick={handleDemoGuest}
                  className="text-[#B08D57] hover:underline font-medium"
                >
                  Quick Demo Access
                </button>
              </div>

              {/* Sign In Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#B08D57] to-[#775928] text-[#0E0F12] text-[15px] font-semibold py-3.5 px-4 rounded-lg shadow-[0_0_20px_rgba(176,141,87,0.3)] hover:shadow-[0_0_30px_rgba(176,141,87,0.6)] transition-all duration-300 ease-out active:scale-[0.98] hover-pulse font-inter uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                  <span>{isLogin ? 'Enter Chamber' : 'Create Chamber Account'}</span>
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative flex items-center py-5">
              <div className="flex-grow border-t border-[#B08D57]/20 shadow-[0_1px_0_rgba(255,255,255,0.05)]"></div>
              <span className="flex-shrink-0 mx-4 text-[11px] text-[#d1c5b6]/60 font-inter tracking-widest uppercase">
                Offline Mode
              </span>
              <div className="flex-grow border-t border-[#B08D57]/20 shadow-[0_1px_0_rgba(255,255,255,0.05)]"></div>
            </div>

            {/* Guest / Direct Entry */}
            <div>
              <button
                type="button"
                onClick={handleDemoGuest}
                className="w-full flex items-center justify-center gap-2.5 border border-[#B08D57]/30 bg-black/25 text-[#B08D57] text-[14px] font-medium py-3 px-4 rounded-lg hover:bg-[#B08D57]/10 hover:border-[#B08D57]/60 hover:shadow-[0_0_20px_rgba(176,141,87,0.15)] transition-all duration-300 ease-out font-inter backdrop-blur-sm"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  lock_open
                </span>
                Continue as Senior Counsel (Offline)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
