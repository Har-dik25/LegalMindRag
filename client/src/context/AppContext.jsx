import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

const AppContext = createContext(null);

export function AppProvider({ children }) {

  // ─── Theme (manual override; Obsidian is always default) ─────
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = useCallback(() => {
    setIsDark(p => !p);
    toast.success(isDark ? 'Parchment mode pinned' : 'Obsidian mode pinned', { duration: 1800 });
  }, [isDark]);

  // ─── Parchment mode — auto-activates when source dossier opens ─
  // Manual toggle overrides; auto-activation always switches on open/close
  const [parchmentPinned, setParchmentPinned] = useState(false); // manual override
  const [isDossierOpen, setIsDossierOpen]     = useState(false);

  // Actual parchment state: pinned OR (dossier open and not force-dark)
  const isParchment = parchmentPinned || (isDossierOpen && isDark);

  useEffect(() => {
    if (isParchment) {
      document.body.classList.add('parchment-active');
    } else {
      document.body.classList.remove('parchment-active');
    }
  }, [isParchment]);

  // ─── Language ────────────────────────────────────────────────
  const [language, setLanguage] = useState(
    () => localStorage.getItem('lmr_lang') || 'en'
  );
  useEffect(() => { localStorage.setItem('lmr_lang', language); }, [language]);

  // ─── Engine ──────────────────────────────────────────────────
  const [engine, setEngineState] = useState('langchain');
  const setEngine = useCallback((e) => {
    setEngineState(e);
    fetch('http://localhost:8000/config/approach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approach: e }),
    }).catch(() => {});
    toast.success(
      e === 'langchain' ? 'LangChain engine active' : 'Core Python engine active',
      { duration: 2000 }
    );
  }, []);

  // ─── Sidebar collapsed state ──────────────────────────────────
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarCollapsed(p => !p), []);

  // ─── Pinned arguments ─────────────────────────────────────────
  const [pinnedArguments, setPinnedArguments] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lmr_pins') || '[]'); }
    catch { return []; }
  });
  useEffect(() => {
    localStorage.setItem('lmr_pins', JSON.stringify(pinnedArguments));
  }, [pinnedArguments]);

  const pinArgument = useCallback((text) => {
    setPinnedArguments(p => [...p, {
      id: Date.now(), text, timestamp: new Date().toLocaleString()
    }]);
    toast.success('Pinned to Argument Builder');
  }, []);

  const removePin = useCallback((id) => {
    setPinnedArguments(p => p.filter(x => x.id !== id));
  }, []);

  // ─── Matters ─────────────────────────────────────────────────
  const [matters, setMatters] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lmr_matters') || 'null')
        || [{ id: 'default', name: 'General Research' }];
    } catch { return [{ id: 'default', name: 'General Research' }]; }
  });
  useEffect(() => {
    localStorage.setItem('lmr_matters', JSON.stringify(matters));
  }, [matters]);

  const [activeMatter, setActiveMatter] = useState('default');

  const addMatter = useCallback((name, metadata) => {
    const matterName = name || prompt('New matter name:');
    if (!matterName?.trim()) return;
    const id = Date.now().toString();
    setMatters(p => [...p, { id, name: matterName.trim(), ...(metadata || {}) }]);
    setActiveMatter(id);
    setCaseIntakeOpen(false);
    toast.success(`Matter "${matterName.trim()}" created`);
  }, []);

  const removeMatter = useCallback((id) => {
    setMatters(p => p.filter(m => m.id !== id));
    setActiveMatter('default');
  }, []);

  // ─── Overlay states ───────────────────────────────────────────
  const [commandOpen,           setCommandOpen]           = useState(false);
  const [ipcBnsOpen,            setIpcBnsOpen]            = useState(false);
  const [graphOpen,             setGraphOpen]             = useState(false);
  const [statsOpen,             setStatsOpen]             = useState(false);
  const [shortcutsOpen,         setShortcutsOpen]         = useState(false);
  const [strategySimulatorOpen, setStrategySimulatorOpen] = useState(false);
  const [caseIntakeOpen,        setCaseIntakeOpen]        = useState(false);

  // ─── Devil's Advocate mode ────────────────────────────────────
  const [isDevilsAdvocate, setIsDevilsAdvocate] = useState(false);
  const toggleDevilsAdvocate = useCallback(() => {
    setIsDevilsAdvocate(p => !p);
    toast.success(
      isDevilsAdvocate ? "Devil's Advocate disabled" : "Devil's Advocate enabled",
      { duration: 2000 }
    );
  }, [isDevilsAdvocate]);

  // ─── Dossier / source viewer ──────────────────────────────────
  const [dossierSource, setDossierSource] = useState(null);

  const openDossier = useCallback((src) => {
    setDossierSource(src);
    setIsDossierOpen(true);
    // Auto-switch to parchment on open
  }, []);

  const closeDossier = useCallback(() => {
    setIsDossierOpen(false);
    // Auto parchment fades out via isParchment derived state
  }, []);

  // ─── Keyboard shortcuts ───────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault(); setCommandOpen(p => !p);
      }
      if (e.key === '?') { e.preventDefault(); setShortcutsOpen(p => !p); }
      if (e.key === 'Escape') {
        setCommandOpen(false); setIpcBnsOpen(false);
        setGraphOpen(false);   setStatsOpen(false);
        setShortcutsOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <AppContext.Provider value={{
      // Theme
      isDark, toggleTheme,
      isParchment, parchmentPinned, setParchmentPinned,
      // Language
      language, setLanguage,
      // Engine
      engine, setEngine,
      // Sidebar
      sidebarCollapsed, toggleSidebar,
      // Pins
      pinnedArguments, pinArgument, removePin,
      // Matters
      matters, activeMatter, setActiveMatter, addMatter, removeMatter,
      // Overlays
      commandOpen,           setCommandOpen,
      ipcBnsOpen,            setIpcBnsOpen,
      graphOpen,             setGraphOpen,
      statsOpen,             setStatsOpen,
      shortcutsOpen,         setShortcutsOpen,
      strategySimulatorOpen, setStrategySimulatorOpen,
      caseIntakeOpen,        setCaseIntakeOpen,
      // Modes
      isDevilsAdvocate, toggleDevilsAdvocate,
      // Dossier
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
