import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, Pin, Trash2, Download, X, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function ArgumentBuilder() {
  const { pinnedArguments, removePin } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const exportBrief = () => {
    if (!pinnedArguments.length) return;
    const content = pinnedArguments
      .map((a, i) => `## Argument ${i + 1}\n*Pinned: ${a.timestamp}*\n\n${a.text}\n\n---`)
      .join('\n\n');
    const blob = new Blob([`# Legal Brief — Samvidhan AI\n*Generated: ${new Date().toLocaleString()}*\n\n${content}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'samvidhan_legal_brief.md'; link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full bg-zinc-950/95 border-t border-white/5 backdrop-blur-xl">
      {/* Handle */}
      <div className="flex items-center justify-between px-5 py-2.5 cursor-pointer hover:bg-white/2 transition-colors select-none"
        onClick={() => setIsOpen(p => !p)}>
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-md bg-purple-900/40 border border-purple-500/20 flex items-center justify-center">
            <Pin className="w-3 h-3 text-purple-400" />
          </div>
          <span className="text-xs font-semibold text-zinc-400">Argument Builder</span>
          {pinnedArguments.length > 0 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="text-[10px] font-bold bg-purple-900/40 border border-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full">
              {pinnedArguments.length}
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isOpen && pinnedArguments.length > 0 && (
            <button onClick={e => { e.stopPropagation(); exportBrief(); }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-400 hover:text-zinc-200 transition-all">
              <Download className="w-3 h-3" /> Export .md
            </button>
          )}
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronUp className="w-4 h-4 text-zinc-600" />
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 180 }} exit={{ height: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }} className="overflow-hidden">
            <div className="h-[180px] overflow-y-auto px-5 pb-4 scrollbar-thin scrollbar-thumb-zinc-800">
              {pinnedArguments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <FileText className="w-7 h-7 text-zinc-800 mb-2" />
                  <p className="text-xs text-zinc-600">No arguments pinned yet.</p>
                  <p className="text-[11px] text-zinc-700 mt-0.5">Click <strong className="text-zinc-600">Pin</strong> on any AI response.</p>
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  {pinnedArguments.map((arg) => (
                    <motion.div key={arg.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900 border border-white/5">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">{arg.text}</p>
                        <p className="text-[10px] text-zinc-700 mt-1">{arg.timestamp}</p>
                      </div>
                      <button onClick={() => removePin(arg.id)}
                        className="p-1 rounded-md hover:bg-zinc-800 text-zinc-700 hover:text-red-400 transition-all flex-shrink-0">
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
