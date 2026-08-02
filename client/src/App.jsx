import React from 'react';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext';
import TriPaneLayout from './components/Layout/TriPaneLayout';
import CommandPalette from './components/Overlays/CommandPalette';
import IpcBnsComparator from './components/Overlays/IpcBnsComparator';
import PrecedentGraph from './components/Overlays/PrecedentGraph';
import StatsModal from './components/Overlays/StatsModal';
import ShortcutsModal from './components/Overlays/ShortcutsModal';
import MatterSidebar from './components/LeftPane/MatterSidebar';
import ChatInterface from './components/CenterPane/ChatInterface';
import SourceDossier from './components/RightPane/SourceDossier';
import ArgumentBuilder from './components/BottomDock/ArgumentBuilder';

function AppShell() {
  const { isDossierOpen, openDossier, statsOpen, setStatsOpen, shortcutsOpen, setShortcutsOpen } = useApp();

  return (
    <>
      {/* ─── Toast Notifications ─── */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#18181b', color: '#e4e4e7', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '13px', fontWeight: '500' },
          success: { iconTheme: { primary: '#10b981', secondary: '#18181b' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#18181b' } },
        }}
      />

      {/* ─── All Overlays ─── */}
      <CommandPalette />
      <IpcBnsComparator />
      <PrecedentGraph />
      {statsOpen && <StatsModal onClose={() => setStatsOpen(false)} />}
      {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}

      {/* ─── Main Tri-Pane Layout ─── */}
      <TriPaneLayout
        isRightPaneOpen={isDossierOpen}
        leftPane={<MatterSidebar />}
        centerPane={<ChatInterface onOpenSource={openDossier} />}
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
