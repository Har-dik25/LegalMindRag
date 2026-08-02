import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2, X, Zap, Clock, Database, MessageSquare,
  TrendingUp, Shield, Scale, Activity
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-zinc-900 border border-white/5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-zinc-100 leading-none mb-1">{value}</div>
        <div className="text-xs font-semibold text-zinc-400">{label}</div>
        {sub && <div className="text-[10px] text-zinc-600 mt-0.5">{sub}</div>}
      </div>
    </motion.div>
  );
}

export default function StatsModal({ onClose }) {
  const { engine, pinnedArguments } = useApp();

  const messages = (() => {
    try { return JSON.parse(localStorage.getItem('samvidhan_messages') || '[]'); } catch { return []; }
  })();

  const userMessages = messages.filter(m => m.role === 'user');
  const aiMessages = messages.filter(m => m.role === 'assistant');
  const avgTime = aiMessages.filter(m => m.time).reduce((a, m, _, arr) => a + parseFloat(m.time) / arr.length, 0).toFixed(1);
  const verifiedCount = aiMessages.filter(m => m.confidence > 0.75).length;

  const topTopics = [
    { label: 'Constitutional Law', pct: 40 },
    { label: 'Criminal Law (BNS)', pct: 30 },
    { label: 'Civil Procedure', pct: 15 },
    { label: 'Property Law', pct: 10 },
    { label: 'Tax Law', pct: 5 },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-md">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-900/40 border border-blue-500/20 flex items-center justify-center">
                <BarChart2 className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-100">Session Statistics</h2>
                <p className="text-xs text-zinc-600">Your Samvidhan AI usage overview</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-all"><X className="w-4 h-4" /></button>
          </div>

          <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total Queries" value={userMessages.length} sub="This session" icon={MessageSquare} color="bg-amber-900/30 border border-amber-500/20 text-amber-400" />
              <StatCard label="Avg Response Time" value={isNaN(avgTime) ? '—' : `${avgTime}s`} sub="Streaming mode" icon={Clock} color="bg-cyan-900/30 border border-cyan-500/20 text-cyan-400" />
              <StatCard label="Verified Answers" value={`${verifiedCount}/${aiMessages.length}`} sub="High confidence" icon={Shield} color="bg-emerald-900/30 border border-emerald-500/20 text-emerald-400" />
              <StatCard label="Pinned Arguments" value={pinnedArguments.length} sub="In brief builder" icon={Scale} color="bg-purple-900/30 border border-purple-500/20 text-purple-400" />
            </div>

            {/* Engine status */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Active Engine</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${engine === 'langchain' ? 'bg-cyan-900/30 text-cyan-400' : 'bg-emerald-900/30 text-emerald-400'}`}>
                  {engine === 'langchain' ? '⚡ LangChain' : '⚙️ Core Python'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-zinc-600" />
                <span className="text-sm text-zinc-400">Backend: <code className="text-xs text-zinc-500">http://localhost:8000</code></span>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-auto" />
              </div>
            </div>

            {/* Topic distribution */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-3">Query Topics (Simulated)</span>
              <div className="space-y-2.5">
                {topTopics.map((t, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400">{t.label}</span>
                      <span className="text-zinc-600">{t.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${t.pct}%` }}
                        transition={{ delay: i * 0.1, duration: 0.6 }}
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Corpus info */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-3">Corpus (from pipeline)</span>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { v: '3,442', l: 'Indexed Chunks', icon: Database },
                  { v: '107', l: 'Legal Documents', icon: Scale },
                  { v: '2', l: 'Pipeline Runs', icon: TrendingUp },
                ].map((s, i) => (
                  <div key={i} className="p-3 rounded-xl bg-zinc-800/60">
                    <s.icon className="w-4 h-4 text-zinc-600 mx-auto mb-1.5" />
                    <div className="text-lg font-bold text-zinc-200">{s.v}</div>
                    <div className="text-[10px] text-zinc-600">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
