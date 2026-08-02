import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // ─── Theme ───
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('samvidhan_theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('samvidhan_theme', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(p => !p);
    toast.success(isDark ? '☀️ Light Mode' : '🌙 Dark Mode', { duration: 1500 });
  };

  // ─── Language ───
  const [language, setLanguage] = useState(() => localStorage.getItem('samvidhan_lang') || 'en');
  useEffect(() => { localStorage.setItem('samvidhan_lang', language); }, [language]);

  // ─── Engine ───
  const [engine, setEngineState] = useState('langchain');
  const setEngine = useCallback((e) => {
    setEngineState(e);
    fetch('http://localhost:8000/config/approach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approach: e }),
    }).catch(() => {});
    toast.success(e === 'langchain' ? '⚡ LangChain Engine Active' : '⚙️ Core Python Engine Active', {
      duration: 2500,
      style: { background: e === 'langchain' ? '#083344' : '#052e16', color: e === 'langchain' ? '#67e8f9' : '#86efac', border: `1px solid ${e === 'langchain' ? '#0e7490' : '#16a34a'}` }
    });
  }, []);

  // ─── Pinned arguments ───
  const [pinnedArguments, setPinnedArguments] = useState(() => {
    try { return JSON.parse(localStorage.getItem('samvidhan_pins') || '[]'); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem('samvidhan_pins', JSON.stringify(pinnedArguments)); }, [pinnedArguments]);

  const pinArgument = useCallback((text) => {
    setPinnedArguments(p => [...p, { id: Date.now(), text, timestamp: new Date().toLocaleString() }]);
    toast.success('📋 Pinned to Argument Builder');
  }, []);

  const removePin = useCallback((id) => {
    setPinnedArguments(p => p.filter(x => x.id !== id));
  }, []);

  // ─── Matters ───
  const [matters, setMatters] = useState(() => {
    try { return JSON.parse(localStorage.getItem('samvidhan_matters') || 'null') || [{ id: 'default', name: 'General Research' }]; } catch { return [{ id: 'default', name: 'General Research' }]; }
  });
  useEffect(() => { localStorage.setItem('samvidhan_matters', JSON.stringify(matters)); }, [matters]);

  const [activeMatter, setActiveMatter] = useState('default');

  const addMatter = useCallback(() => {
    const name = prompt('Matter name:');
    if (!name) return;
    const id = Date.now().toString();
    setMatters(p => [...p, { id, name }]);
    setActiveMatter(id);
    toast.success(`📁 Matter "${name}" created`);
  }, []);

  const removeMatter = useCallback((id) => {
    setMatters(p => p.filter(m => m.id !== id));
    setActiveMatter('default');
  }, []);

  // ─── Overlay state ───
  const [commandOpen, setCommandOpen] = useState(false);
  const [ipcBnsOpen, setIpcBnsOpen] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // ─── Dossier ───
  const [dossierSource, setDossierSource] = useState(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const openDossier = useCallback((src) => { setDossierSource(src); setIsDossierOpen(true); }, []);
  const closeDossier = useCallback(() => setIsDossierOpen(false), []);

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setCommandOpen(p => !p); }
      if (e.key === '?') { e.preventDefault(); setShortcutsOpen(p => !p); }
      if (e.key === 'Escape') { setCommandOpen(false); setIpcBnsOpen(false); setGraphOpen(false); setStatsOpen(false); setShortcutsOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <AppContext.Provider value={{
      isDark, toggleTheme,
      language, setLanguage,
      engine, setEngine,
      pinnedArguments, pinArgument, removePin,
      matters, activeMatter, setActiveMatter, addMatter, removeMatter,
      commandOpen, setCommandOpen,
      ipcBnsOpen, setIpcBnsOpen,
      graphOpen, setGraphOpen,
      statsOpen, setStatsOpen,
      shortcutsOpen, setShortcutsOpen,
      dossierSource, isDossierOpen, openDossier, closeDossier,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
