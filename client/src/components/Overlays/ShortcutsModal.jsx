import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { section: 'Navigation', items: [
    { keys: ['⌘', 'K'], desc: 'Open Command Palette' },
    { keys: ['?'], desc: 'Show keyboard shortcuts' },
    { keys: ['Esc'], desc: 'Close any modal' },
  ]},
  { section: 'Chat', items: [
    { keys: ['Enter'], desc: 'Send message' },
    { keys: ['Shift', 'Enter'], desc: 'New line in message' },
  ]},
  { section: 'Overlays', items: [
    { keys: ['⌘', 'B'], desc: 'Open IPC/BNS Comparator' },
    { keys: ['⌘', 'G'], desc: 'Open Precedent Graph' },
    { keys: ['⌘', 'S'], desc: 'Open Statistics' },
  ]},
];

export default function ShortcutsModal({ onClose }) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-md">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          
          <div className="flex items-center justify-between p-5 border-b border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center"><Keyboard className="w-4 h-4 text-zinc-400" /></div>
              <div>
                <h2 className="text-sm font-bold text-zinc-100">Keyboard Shortcuts</h2>
                <p className="text-xs text-zinc-600">Power user quick reference</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-all"><X className="w-4 h-4" /></button>
          </div>

          <div className="p-5 space-y-5">
            {SHORTCUTS.map(section => (
              <div key={section.section}>
                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">{section.section}</div>
                <div className="space-y-2">
                  {section.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">{item.desc}</span>
                      <div className="flex items-center gap-1">
                        {item.keys.map((k, j) => (
                          <React.Fragment key={j}>
                            <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded-md text-xs text-zinc-300 font-mono">{k}</kbd>
                            {j < item.keys.length - 1 && <span className="text-zinc-600 text-xs">+</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
