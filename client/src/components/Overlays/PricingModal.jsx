import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, Shield, Zap, Scale, Award } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PricingModal({ onClose }) {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'annual'

  const handleSubscribe = (planName) => {
    toast.success(`Subscribed to ${planName}! Welcome to Senior Counsel Pro.`, {
      icon: '🏛️',
      duration: 3500,
    });
    setTimeout(() => onClose(), 1200);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/85 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl bg-[#0E0F12] border border-[#B08D57]/30 rounded-2xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.95)] flex flex-col font-inter"
      >
        {/* Header */}
        <div className="relative px-8 pt-8 pb-6 text-center border-b border-[#B08D57]/15 bg-gradient-to-b from-[#16181D] to-[#0E0F12]">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#8A8778] hover:text-[#E9E6DD] transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B08D57]/15 border border-[#B08D57]/30 text-[#B08D57] text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Chamber Subscription Plans
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#E9E6DD] tracking-tight">
            Elevate Your Legal Practice with Samvidhan AI
          </h2>
          <p className="text-xs md:text-sm text-[#8A8778] max-w-xl mx-auto mt-2 leading-relaxed">
            Zero-hallucination statutory synthesis, instant precedent citation graphs, and automated court brief generation.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-6 inline-flex items-center p-1 rounded-xl bg-black/40 border border-[#B08D57]/20">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-[#B08D57] text-[#0E0F12] font-semibold shadow-[0_0_12px_rgba(176,141,87,0.3)]'
                  : 'text-[#8A8778] hover:text-[#E9E6DD]'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-[#B08D57] text-[#0E0F12] font-semibold shadow-[0_0_12px_rgba(176,141,87,0.3)]'
                  : 'text-[#8A8778] hover:text-[#E9E6DD]'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto max-h-[65vh] scrollbar-chambers">
          {/* Free Tier */}
          <div className="p-6 rounded-2xl bg-[#16181D]/60 border border-[#B08D57]/15 flex flex-col justify-between hover:border-[#B08D57]/30 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-serif font-bold text-[#E9E6DD]">Advocate Junior</h3>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-white/5 text-[#8A8778]">FREE</span>
              </div>
              <div className="mb-6">
                <span className="text-3xl font-bold font-serif text-[#E9E6DD]">₹0</span>
                <span className="text-xs text-[#8A8778] ml-1">/ forever</span>
              </div>
              <ul className="space-y-3 text-xs text-[#d1c5b6]">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#B08D57]" />
                  <span>20 Statutory Queries / day</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#B08D57]" />
                  <span>IPC ↔ BNS Transmutation Comparator</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#B08D57]" />
                  <span>Standard Extractive Summaries</span>
                </li>
                <li className="flex items-center gap-2.5 text-[#8A8778]/50">
                  <span className="w-4 text-center">—</span>
                  <span className="line-through">Precedent Weave Visual Graph</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => onClose()}
              className="w-full mt-6 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-[#d1c5b6] text-xs font-semibold border border-white/10 transition-all"
            >
              Current Active Plan
            </button>
          </div>

          {/* Senior Counsel Pro (Highlighted) */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#B08D57]/15 via-[#16181D] to-[#121316] border-2 border-[#B08D57] flex flex-col justify-between relative shadow-[0_0_30px_rgba(176,141,87,0.15)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#B08D57] to-[#775928] text-[#0E0F12] text-[10px] font-bold tracking-wider uppercase shadow-lg">
              Most Popular · Recommended
            </div>
            <div>
              <div className="flex items-center justify-between mb-3 mt-1">
                <h3 className="text-base font-serif font-bold text-[#FFDEAE] flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#B08D57]" />
                  Senior Counsel Pro
                </h3>
              </div>
              <div className="mb-6">
                <span className="text-3xl font-bold font-serif text-[#FFDEAE]">
                  {billingCycle === 'monthly' ? '₹1,499' : '₹1,199'}
                </span>
                <span className="text-xs text-[#8A8778] ml-1">/ month</span>
                {billingCycle === 'annual' && (
                  <p className="text-[10px] text-emerald-400 mt-1">Billed annually (₹14,388/yr)</p>
                )}
              </div>
              <ul className="space-y-3 text-xs text-[#d1c5b6]">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#B08D57]" />
                  <strong className="text-[#FFDEAE]">Unlimited</strong> Instant Legal Synthesis
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#B08D57]" />
                  <span>Supreme Court Precedent Weave Graph</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#B08D57]" />
                  <span>1-Click Court Petition Brief Export</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#B08D57]" />
                  <span>Devil's Advocate Counter-Strategy Mode</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#B08D57]" />
                  <span>Sub-Second Cross-Encoder Re-Ranking</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => handleSubscribe('Senior Counsel Pro')}
              className="w-full mt-6 py-3 px-4 rounded-xl bg-gradient-to-r from-[#B08D57] to-[#775928] text-[#0E0F12] text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(176,141,87,0.4)] hover:shadow-[0_0_30px_rgba(176,141,87,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Upgrade Chamber Now
            </button>
          </div>

          {/* Law Firm / Enterprise Chamber */}
          <div className="p-6 rounded-2xl bg-[#16181D]/60 border border-[#B08D57]/15 flex flex-col justify-between hover:border-[#B08D57]/30 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-serif font-bold text-[#E9E6DD]">Chamber Enterprise</h3>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-[#B08D57]/10 text-[#B08D57] border border-[#B08D57]/20">
                  FIRMS
                </span>
              </div>
              <div className="mb-6">
                <span className="text-3xl font-bold font-serif text-[#E9E6DD]">
                  {billingCycle === 'monthly' ? '₹4,999' : '₹3,999'}
                </span>
                <span className="text-xs text-[#8A8778] ml-1">/ month</span>
              </div>
              <ul className="space-y-3 text-xs text-[#d1c5b6]">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#B08D57]" />
                  <span>Up to 10 Advocate Chamber Seats</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#B08D57]" />
                  <span>Custom Case Document Ingestion</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#B08D57]" />
                  <span>Dedicated Private On-Premise Vectors</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#B08D57]" />
                  <span>24/7 Priority Legal Tech Support</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => handleSubscribe('Chamber Enterprise')}
              className="w-full mt-6 py-2.5 px-4 rounded-xl bg-black/40 hover:bg-[#B08D57]/20 text-[#B08D57] text-xs font-semibold border border-[#B08D57]/30 transition-all"
            >
              Contact Chamber Sales
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
