import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, User, Terminal, Scale } from 'lucide-react';

export default function LoginSignup({ onLogin, isLightMode }) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            setError('ALL FIELDS REQUIRED FOR AUTHORIZATION');
            return;
        }
        setError(null);
        setLoading(true);

        const endpoint = isLogin ? '/auth/login' : '/auth/register';

        try {
            const response = await fetch(`http://localhost:8000${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Authorization failed');
            }

            onLogin(data);
        } catch (err) {
            setError(err.message.toUpperCase());
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`w-full min-h-screen flex items-center justify-center p-6 transition-colors duration-1000 ${isLightMode ? 'bg-[#FDFDFD]' : 'mesh-bg'}`}>

            {/* Soft Background Accent */}
            <div className={`absolute inset-0 pointer-events-none ${isLightMode ? 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent' : 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent'}`} />

            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={`relative z-10 w-full max-w-[420px] p-8 sm:p-10 rounded-3xl ${isLightMode ? 'bg-white/80 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-white' : 'glass-panel'}`}
            >
                <div className="flex flex-col items-center mb-8">
                    <div className={`w-14 h-14 flex items-center justify-center mb-6 rounded-2xl shadow-sm ${isLightMode ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-blue-500/20' : 'bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-400/30 text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.15)]'}`}>
                        <Scale size={28} strokeWidth={1.5} className={!isLightMode ? "drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]" : ""} />
                    </div>
                    <h1 className={`text-[26px] font-bold tracking-tight mb-2 ${isLightMode ? 'text-[#111111]' : 'text-white drop-shadow-sm'}`}>
                        {isLogin ? 'Welcome back' : 'Create an account'}
                    </h1>
                    <p className={`text-sm ${isLightMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {isLogin ? 'Enter your details to access your workspace.' : 'Sign up to start organizing your legal intelligence.'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 mb-6 flex items-center gap-2">
                        <Shield size={16} className="shrink-0" /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className={`block text-sm font-medium ${isLightMode ? 'text-zinc-700' : 'text-zinc-300'}`}>
                            Username
                        </label>
                        <div className="relative">
                            <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 size-4 ${isLightMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                                className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${isLightMode ? 'bg-white border-zinc-200 text-zinc-900 focus:border-blue-500' : 'bg-zinc-800/50 border-white/10 text-white focus:border-blue-500 placeholder:text-zinc-600'}`}
                                placeholder="Enter your username"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className={`block text-sm font-medium ${isLightMode ? 'text-zinc-700' : 'text-zinc-300'}`}>
                            Password
                        </label>
                        <div className="relative">
                            <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 size-4 ${isLightMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${isLightMode ? 'bg-white border-zinc-200 text-zinc-900 focus:border-blue-500' : 'bg-zinc-800/50 border-white/10 text-white focus:border-blue-500 placeholder:text-zinc-600'}`}
                                placeholder="••••••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full mt-2 py-3 text-[15px] font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${isLightMode ? 'bg-[#111111] text-white hover:bg-black hover:shadow-lg hover:shadow-black/10 hover:-translate-y-0.5' : 'bg-white text-black hover:bg-zinc-100 hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] hover:-translate-y-0.5'} ${loading ? 'opacity-70 cursor-not-allowed transform-none' : 'opacity-100'}`}
                    >
                        {loading ? 'Processing...' : isLogin ? 'Sign in to Workspace' : 'Create account'}
                    </button>
                </form>

                <div className="mt-8 text-center pt-6">
                    <p className={`text-sm ${isLightMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError(null);
                            }}
                            className={`font-medium transition-colors hover:underline ${isLightMode ? 'text-zinc-900' : 'text-blue-400 hover:text-blue-300'}`}
                        >
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
