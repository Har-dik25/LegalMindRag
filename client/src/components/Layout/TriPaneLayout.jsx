import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';

export default function TriPaneLayout({ leftPane, centerPane, rightPane, bottomDock }) {
  const { isDossierOpen, isParchment } = useApp();

  return (
    <div
      className="flex h-screen w-full overflow-hidden font-sans"
      style={{ background: '#0E0F12', color: '#E9E6DD' }}
    >
      {/* ── Left Rail ── */}
      <motion.aside
        initial={{ x: -288 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0, 0.15, 1] }}
        className="sidebar-rail flex-shrink-0 overflow-hidden z-10 relative"
        style={{
          borderRight: '1px solid rgba(176,141,87,0.1)',
          boxShadow: '4px 0 32px rgba(0,0,0,0.5)',
        }}
      >
        {leftPane}
      </motion.aside>

      {/* ── Center ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-0">
        <div className="flex-1 overflow-hidden">
          {centerPane}
        </div>
        <div className="flex-shrink-0">
          {bottomDock}
        </div>
      </main>

      {/* ── Right Pane — Source Dossier ── */}
      <AnimatePresence initial={false}>
        {isDossierOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 420, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0, 0.15, 1] }}
            className="flex-shrink-0 overflow-hidden z-10 relative"
            style={{
              borderLeft: `1px solid ${isParchment ? 'rgba(176,141,87,0.2)' : 'rgba(176,141,87,0.1)'}`,
              boxShadow: '-4px 0 32px rgba(0,0,0,0.4)',
            }}
          >
            <div className="w-[420px] h-full">
              {rightPane}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
