import React from 'react';
import { useApp } from '../../context/AppContext';
import { Crown, LogOut, Folder, FolderOpen, Trash2, Plus } from 'lucide-react';

export default function MatterSidebar({ onLogout }) {
  const {
    matters,
    activeMatter,
    setActiveMatter,
    addMatter,
    removeMatter,
    setCaseIntakeOpen,
    sidebarCollapsed,
    toggleSidebar,
    setPricingOpen,
  } = useApp();

  return (
    <aside
      className={`bg-panel-slate h-full ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      } border-r border-brass/10 flex flex-col py-5 flex-shrink-0 transition-all duration-200 ease-out z-30 select-none font-inter`}
    >
      {/* Brand & New Matter */}
      <div className="px-4 mb-4">
        <button
          onClick={() => (setCaseIntakeOpen ? setCaseIntakeOpen(true) : addMatter())}
          className="brass-button w-full py-2.5 px-3 rounded-xl font-label-sm text-[12px] font-semibold flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(176,141,87,0.15)]"
        >
          <Plus className="w-4 h-4" />
          {!sidebarCollapsed && <span>New Case Matter</span>}
        </button>
      </div>

      {/* Main Navigation List */}
      <div className="flex-1 overflow-y-auto scrollbar-chambers px-3 flex flex-col gap-1">
        {!sidebarCollapsed && (
          <p className="font-label-sm text-[10px] text-on-surface-variant/50 mb-2 px-3 uppercase tracking-widest font-bold">
            Matter Library
          </p>
        )}

        {/* Existing Matters */}
        {matters.map((m) => {
          const isSelected = activeMatter === m.id;
          return (
            <div key={m.id} className="group flex items-center gap-1">
              <button
                onClick={() => setActiveMatter(m.id)}
                className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-lg text-left transition-all ${
                  isSelected
                    ? 'text-[#B08D57] font-semibold bg-[#B08D57]/15 border border-[#B08D57]/30 shadow-[0_0_10px_rgba(176,141,87,0.1)]'
                    : 'text-on-surface-variant/70 hover:text-on-surface hover:bg-white/[0.03]'
                }`}
                title={m.name}
              >
                {isSelected ? (
                  <FolderOpen className="w-4 h-4 text-[#B08D57] flex-shrink-0" />
                ) : (
                  <Folder className="w-4 h-4 opacity-70 flex-shrink-0" />
                )}
                {!sidebarCollapsed && <span className="text-[12.5px] truncate">{m.name}</span>}
              </button>
              {m.id !== 'default' && !sidebarCollapsed && (
                <button
                  onClick={() => removeMatter(m.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-on-surface-variant/40 hover:text-red-400 transition-opacity"
                  title="Delete Matter"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Monetization / Pro Chamber Upgrade Banner */}
      {!sidebarCollapsed && (
        <div className="px-3 mb-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#B08D57]/20 via-[#16181D] to-[#121316] border border-[#B08D57]/30 shadow-[0_0_20px_rgba(176,141,87,0.1)]">
            <div className="flex items-center gap-2 mb-1.5">
              <Crown className="w-4 h-4 text-[#B08D57]" />
              <span className="text-xs font-bold font-serif text-[#FFDEAE]">Senior Counsel Pro</span>
            </div>
            <p className="text-[11px] text-[#8A8778] leading-snug mb-2.5">
              Unlock unlimited queries, instant citation graphs & PDF brief exports.
            </p>
            <button
              onClick={() => setPricingOpen(true)}
              className="w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-[#B08D57] to-[#775928] text-[#0E0F12] text-[11px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(176,141,87,0.3)] hover:brightness-110 active:scale-[0.98] transition-all"
            >
              Upgrade Chamber
            </button>
          </div>
        </div>
      )}

      {/* Footer Area with Engine Status & Profile */}
      <div className="mt-auto px-4 pt-3 border-t border-brass/10 flex flex-col gap-2">
        {!sidebarCollapsed && (
          <div className="flex items-center justify-between text-[11px] text-[#8A8778]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>3,837+ Chunks</span>
            </span>
            <span className="font-mono text-[10px] text-[#B08D57]">v3.0 Zero-LLM</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={toggleSidebar}
            className="text-on-surface-variant/60 hover:text-brass transition-colors p-1"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {sidebarCollapsed ? 'dock_to_right' : 'dock_to_left'}
            </span>
          </button>

          {onLogout && !sidebarCollapsed && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1 text-[11px] text-[#8A8778] hover:text-red-400 transition-colors p-1"
              title="Sign Out of Chamber"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
