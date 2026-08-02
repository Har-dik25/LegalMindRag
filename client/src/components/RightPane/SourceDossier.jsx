import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, BookOpen, Shield, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function SourceDossier() {
  const { dossierSource: source, closeDossier } = useApp();

  return (
    <div className="h-full flex flex-col bg-zinc-900/40">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-900/40 border border-cyan-500/20 flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-200">Source Dossier</h2>
            <p className="text-[10px] text-zinc-600">Retrieved chunk</p>
          </div>
        </div>
        <button onClick={closeDossier} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-600 hover:text-zinc-300 transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
        {source ? (
          <div className="p-5 space-y-4">
            {/* Meta card */}
            <div className="p-3 rounded-xl bg-zinc-900 border border-white/5">
              <div className="text-xs font-semibold text-zinc-300 truncate mb-2">
                {source.title ?? source.document_name ?? 'Legal Document'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {source.type && <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">{source.type}</span>}
                {source.section && <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">§{source.section}</span>}
                {source.score != null && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400">
                    {(source.score * 100).toFixed(0)}% match
                  </span>
                )}
              </div>
            </div>

            {/* Text preview */}
            <div>
              <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-2">Retrieved Text</div>
              <div className="text-sm text-zinc-300 leading-loose bg-zinc-900/60 border border-white/5 rounded-xl p-4 font-serif">
                {source.text ?? <span className="text-zinc-600 italic">No text preview available.</span>}
              </div>
            </div>

            {/* Confidence meter */}
            {source.score != null && (
              <div className="p-3 rounded-xl bg-zinc-900 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                    <Shield className="w-3 h-3" /> Retrieval Confidence
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400">{(source.score * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }}
                    animate={{ width: `${Math.min(source.score * 100, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${source.score > 0.75 ? 'bg-emerald-500' : source.score > 0.4 ? 'bg-amber-500' : 'bg-red-500'}`} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-zinc-700" />
            </div>
            <p className="text-sm font-medium text-zinc-600">No source selected</p>
            <p className="text-xs text-zinc-700 mt-1 max-w-[160px]">Click a citation badge in a response to view its source.</p>
          </div>
        )}
      </div>
    </div>
  );
}
