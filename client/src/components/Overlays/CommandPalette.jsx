import React from 'react';
import { Command } from 'cmdk';
import { Search, Scale, Layers, Code, FolderOpen, BarChart2, GitBranch, Keyboard, Sun, Moon } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';

export default function CommandPalette() {
  const {
    commandOpen, setCommandOpen,
    setEngine,
    addMatter,
    setIpcBnsOpen, setGraphOpen, setStatsOpen,
    isDark, toggleTheme,
  } = useApp();

  const actions = [
    { label: 'New Matter', icon: FolderOpen, color: 'text-amber-400', action: () => { addMatter(); setCommandOpen(false); } },
    { label: 'Compare IPC / BNS', icon: Scale, color: 'text-amber-400', action: () => { setIpcBnsOpen(true); setCommandOpen(false); } },
    { label: 'Open Precedent Graph', icon: GitBranch, color: 'text-purple-400', action: () => { setGraphOpen(true); setCommandOpen(false); } },
    { label: 'View Statistics', icon: BarChart2, color: 'text-blue-400', action: () => { setStatsOpen(true); setCommandOpen(false); } },
    { label: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode', icon: isDark ? Sun : Moon, color: 'text-zinc-400', action: () => { toggleTheme(); setCommandOpen(false); } },
    { label: 'Switch to LangChain Engine', icon: Layers, color: 'text-cyan-400', action: () => { setEngine('langchain'); setCommandOpen(false); } },
    { label: 'Switch to Core Python Engine', icon: Code, color: 'text-emerald-400', action: () => { setEngine('core_python'); setCommandOpen(false); } },
  ];

  return (
    <AnimatePresence>
      {commandOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setCommandOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.96, y: -16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: -16 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-lg shadow-2xl rounded-2xl overflow-hidden bg-zinc-900 border border-white/10">
            <Command label="Command Menu" className="w-full text-zinc-100">
              <div className="flex items-center border-b border-white/8 px-4 gap-3">
                <Search className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                <Command.Input placeholder="Search actions, laws, engines..."
                  className="w-full bg-transparent border-none py-4 text-sm outline-none placeholder:text-zinc-600" autoFocus />
              </div>
              <Command.List className="max-h-[280px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-700">
                <Command.Empty className="p-4 text-center text-sm text-zinc-600">No results found.</Command.Empty>
                {actions.map((a, i) => (
                  <Command.Item key={i} onSelect={a.action}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer hover:bg-zinc-800 aria-selected:bg-zinc-800 transition-colors mt-0.5">
                    <a.icon className={`w-4 h-4 ${a.color}`} />
                    <span className="text-sm text-zinc-300">{a.label}</span>
                  </Command.Item>
                ))}
              </Command.List>
              <div className="p-3 border-t border-white/5 flex items-center gap-4 text-[10px] text-zinc-700">
                <span><kbd className="bg-zinc-800 px-1 py-0.5 rounded mr-1">↑↓</kbd>Navigate</span>
                <span><kbd className="bg-zinc-800 px-1 py-0.5 rounded mr-1">Enter</kbd>Select</span>
                <span><kbd className="bg-zinc-800 px-1 py-0.5 rounded mr-1">Esc</kbd>Close</span>
              </div>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
