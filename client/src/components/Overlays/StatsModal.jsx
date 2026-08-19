import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2, X, Zap, Clock, Database, MessageSquare,
  TrendingUp, Shield, Scale, Activity, CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

// eslint-disable-next-line no-unused-vars
function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-[#16181D] border border-[#B08D57]/20 flex items-start gap-4"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xl font-bold font-serif text-[#E9E6DD] leading-none mb-1">{value}</div>
        <div className="text-xs font-semibold text-[#8A8778]">{label}</div>
        {sub && <div className="text-[10px] text-[#8A8778]/70 mt-0.5">{sub}</div>}
      </div>
    </motion.div>
  );
}

export default function StatsModal({ onClose }) {
  const { pinnedArguments } = useApp();
  const [serverStats, setServerStats] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/stats')
      .then((res) => res.json())
      .then((data) => setServerStats(data))
      .catch(() => {});
  }, []);

  const messages = (() => {
    try {
      return (
        JSON.parse(localStorage.getItem('lmr_messages') || 'null') ||
        JSON.parse(localStorage.getItem('samvidhan_messages') || '[]')
      );
    } catch {
      return [];
    }
  })();

  const userMessages = messages.filter((m) => m.role === 'user');
  const aiMessages = messages.filter((m) => m.role === 'assistant');
  const avgTime = aiMessages
    .filter((m) => m.time)
    .reduce((a, m, _, arr) => a + parseFloat(m.time) / arr.length, 0)
    .toFixed(2);

  const statutes = serverStats?.statutes || [
    'Bharatiya Nyaya Sanhita, 2023 (BNS)',
    'Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)',
    'Bharatiya Sakshya Adhiniyam, 2023 (BSA)',
    'Indian Penal Code, 1860 (IPC)',
    'Code of Criminal Procedure, 1973 (CrPC)',
    'Constitution of India',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/85 backdrop-blur-md font-inter">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-[#0E0F12] border border-[#B08D57]/30 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#B08D57]/20 bg-[#16181D]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#B08D57]/10 border border-[#B08D57]/30 flex items-center justify-center text-[#B08D57]">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#E9E6DD]">Chamber Intelligence Metrics</h2>
              <p className="text-xs text-[#8A8778]">Samvidhan AI Extractive Engine Status & Analytics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-[#8A8778] hover:text-[#E9E6DD] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto scrollbar-chambers">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Queries Processed"
              value={userMessages.length}
              sub="Current chamber session"
              icon={MessageSquare}
              color="bg-[#B08D57]/15 border border-[#B08D57]/30 text-[#B08D57]"
            />
            <StatCard
              label="Average Response Time"
              value={isNaN(avgTime) || avgTime === '0.00' ? '<0.02s' : `${avgTime}s`}
              sub="Zero-LLM instant lookup"
              icon={Clock}
              color="bg-emerald-950/40 border border-emerald-500/30 text-emerald-400"
            />
            <StatCard
              label="Indexed Chunks"
              value={serverStats?.total_chunks ? `${serverStats.total_chunks.toLocaleString()}+` : '3,837+'}
              sub="Multi-Sanhita vector store"
              icon={Database}
              color="bg-blue-950/40 border border-blue-500/30 text-blue-400"
            />
            <StatCard
              label="Pinned Arguments"
              value={pinnedArguments.length}
              sub="In Court Brief Builder"
              icon={Scale}
              color="bg-purple-950/40 border border-purple-500/30 text-purple-400"
            />
          </div>

          {/* Engine Status */}
          <div className="p-4 rounded-xl bg-[#16181D] border border-[#B08D57]/15">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold font-mono text-[#8A8778] uppercase tracking-wider">
                Active Synthesis Engine
              </span>
              <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-[#B08D57]/20 text-[#B08D57] border border-[#B08D57]/30 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Deterministic Extractive AI Overview
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#d1c5b6]">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>
                Backend API: <code className="font-mono text-[#B08D57]">http://127.0.0.1:8000</code>
              </span>
              <div className="flex items-center gap-1.5 ml-auto text-emerald-400 font-mono text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ONLINE</span>
              </div>
            </div>
          </div>

          {/* Verified Corpus Coverage */}
          <div className="p-4 rounded-xl bg-[#16181D] border border-[#B08D57]/15">
            <span className="text-xs font-bold font-mono text-[#8A8778] uppercase tracking-wider block mb-3">
              Verified Legal Corpus
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[#d1c5b6]">
              {statutes.map((s, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-black/30 border border-[#B08D57]/10">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#B08D57] flex-shrink-0" />
                  <span className="truncate">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
