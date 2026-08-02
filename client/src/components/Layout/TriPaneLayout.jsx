import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TriPaneLayout({ leftPane, centerPane, rightPane, bottomDock, isRightPaneOpen }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-950 dark:bg-zinc-950 light:bg-slate-100 text-zinc-100 dark:text-zinc-100 light:text-zinc-800 font-sans">
      {/* ─── Left Pane ─── */}
      <motion.aside
        initial={{ x: -280 }} animate={{ x: 0 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
        className="w-64 flex-shrink-0 border-r border-white/5 dark:border-white/5 light:border-zinc-200 overflow-hidden z-10 shadow-[4px_0_24px_rgba(0,0,0,0.4)]"
      >
        {leftPane}
      </motion.aside>

      {/* ─── Center Pane ─── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-0">
        <div className="flex-1 overflow-hidden">
          {centerPane}
        </div>
        <div className="flex-shrink-0">
          {bottomDock}
        </div>
      </main>

      {/* ─── Right Pane (Source Dossier) ─── */}
      <AnimatePresence initial={false}>
        {isRightPaneOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 380, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="border-l border-white/5 dark:border-white/5 light:border-zinc-200 z-10 flex-shrink-0 shadow-[-8px_0_24px_rgba(0,0,0,0.4)] overflow-hidden"
          >
            <div className="w-[380px] h-full">
              {rightPane}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
