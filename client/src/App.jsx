import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext';
import LoginSignup from './LoginSignup';
import TriPaneLayout from './components/Layout/TriPaneLayout';
import CommandPalette from './components/Overlays/CommandPalette';
import IpcBnsComparator from './components/Overlays/IpcBnsComparator';
import PrecedentGraph from './components/Overlays/PrecedentGraph';
import StatsModal from './components/Overlays/StatsModal';
import ShortcutsModal from './components/Overlays/ShortcutsModal';
import StrategySimulator from './components/Overlays/StrategySimulator';
import CaseIntakeWizard from './components/Overlays/CaseIntakeWizard';
import PricingModal from './components/Overlays/PricingModal';
import MatterSidebar from './components/LeftPane/MatterSidebar';
import ChatInterface from './components/CenterPane/ChatInterface';
import SourceDossier from './components/RightPane/SourceDossier';
import ArgumentBuilder from './components/BottomDock/ArgumentBuilder';

function AppShell() {
  const {
    openDossier,
    statsOpen,
    setStatsOpen,
    shortcutsOpen,
    setShortcutsOpen,
    strategySimulatorOpen,
    setStrategySimulatorOpen,
    caseIntakeOpen,
    setCaseIntakeOpen,
    pricingOpen,
    setPricingOpen,
  } = useApp();

  const [auth, setAuth] = useState(() => {
    try {
      const saved = localStorage.getItem('lmr_auth');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogin = (authData) => {
    setAuth(authData);
    localStorage.setItem('lmr_auth', JSON.stringify(authData));
  };

  const handleLogout = () => {
    setAuth(null);
    localStorage.removeItem('lmr_auth');
  };

  // If not logged in, display the shader login screen
  if (!auth) {
    return <LoginSignup onLogin={handleLogin} />;
  }

  return (
    <>
      {/* Toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#16181D',
            color: '#C8C4BA',
            border: '1px solid rgba(176,141,87,0.2)',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
            fontFamily: 'Inter, system-ui, sans-serif',
            boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
            padding: '10px 16px',
          },
          success: { iconTheme: { primary: '#6F8F82', secondary: '#16181D' } },
          error: { iconTheme: { primary: '#A2503C', secondary: '#16181D' } },
          loading: { iconTheme: { primary: '#B08D57', secondary: '#16181D' } },
        }}
      />

      {/* Interactive Overlays */}
      <CommandPalette />
      <IpcBnsComparator />
      <PrecedentGraph />
      {statsOpen && <StatsModal onClose={() => setStatsOpen(false)} />}
      {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}
      {strategySimulatorOpen && (
        <StrategySimulator onClose={() => setStrategySimulatorOpen(false)} />
      )}
      {caseIntakeOpen && <CaseIntakeWizard onClose={() => setCaseIntakeOpen(false)} />}
      {pricingOpen && <PricingModal onClose={() => setPricingOpen(false)} />}

      {/* Main TriPane Layout */}
      <TriPaneLayout
        leftPane={<MatterSidebar onLogout={handleLogout} />}
        centerPane={<ChatInterface onOpenSource={openDossier} onLogout={handleLogout} />}
        rightPane={<SourceDossier />}
        bottomDock={<ArgumentBuilder />}
      />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
