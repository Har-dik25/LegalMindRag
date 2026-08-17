import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import toast from 'react-hot-toast';

export default function MatterSidebar() {
  const {
    matters,
    activeMatter,
    setActiveMatter,
    addMatter,
    removeMatter,
    setCaseIntakeOpen,
    sidebarCollapsed,
    toggleSidebar,
    engine,
    setEngine,
  } = useApp();

  const [activeTab, setActiveTab] = useState('library');

  return (
    <aside
      className={`bg-panel-slate h-full ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      } border-r border-brass/10 flex flex-col py-6 flex-shrink-0 transition-all duration-220 ease-out z-30 select-none`}
    >
      {/* New Matter Button */}
      <div className="px-4 mb-6">
        <button
          onClick={() => setCaseIntakeOpen ? setCaseIntakeOpen(true) : addMatter()}
          className="brass-button w-full py-2.5 px-3 rounded font-label-sm text-[12px] font-semibold flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          {!sidebarCollapsed && <span>New Matter</span>}
        </button>
      </div>

      {/* Main Navigation List */}
      <div className="flex-1 overflow-y-auto custom-scroll px-3 flex flex-col gap-1">
        {!sidebarCollapsed && (
          <p className="font-label-sm text-[10px] text-on-surface-variant/50 mb-2 px-3 uppercase tracking-widest">
            Library
          </p>
        )}

        <button
          onClick={() => setActiveTab('library')}
          className={`w-full flex items-center gap-3 py-2 px-3 rounded text-left transition-colors duration-200 ${
            activeTab === 'library'
              ? 'text-primary font-bold bg-primary/5 border-r-2 border-primary'
              : 'text-on-surface-variant hover:bg-primary/5 hover:text-primary'
          }`}
          title="Matter Library"
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ fontVariationSettings: activeTab === 'library' ? "'FILL' 1" : "'FILL' 0" }}
          >
            folder_special
          </span>
          {!sidebarCollapsed && <span className="font-body-md text-[13.5px] truncate">Matter Library</span>}
        </button>

        {/* Existing Matters */}
        {matters.map((m) => (
          <div key={m.id} className="group flex items-center gap-1 pl-4">
            <button
              onClick={() => setActiveMatter(m.id)}
              className={`w-full flex items-center gap-2.5 py-1.5 px-2 rounded text-left transition-colors duration-150 ${
                activeMatter === m.id
                  ? 'text-brass font-medium bg-brass/10'
                  : 'text-on-surface-variant/70 hover:text-on-surface hover:bg-white/[0.02]'
              }`}
              title={m.name}
            >
              <span className="material-symbols-outlined text-[16px] opacity-70">
                {activeMatter === m.id ? 'folder_open' : 'folder'}
              </span>
              {!sidebarCollapsed && <span className="text-[12.5px] truncate">{m.name}</span>}
            </button>
            {m.id !== 'default' && !sidebarCollapsed && (
              <button
                onClick={() => removeMatter(m.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-on-surface-variant/40 hover:text-error transition-opacity"
                title="Delete Matter"
              >
                <span className="material-symbols-outlined text-[14px]">delete</span>
              </button>
            )}
          </div>
        ))}

        <button
          onClick={() => setActiveTab('active')}
          className={`w-full flex items-center gap-3 py-2 px-3 rounded text-left transition-colors duration-200 mt-2 ${
            activeTab === 'active'
              ? 'text-primary font-bold bg-primary/5 border-r-2 border-primary'
              : 'text-on-surface-variant hover:bg-primary/5 hover:text-primary'
          }`}
          title="Active Research"
        >
          <span className="material-symbols-outlined text-[20px]">neurology</span>
          {!sidebarCollapsed && <span className="font-body-md text-[13.5px] truncate">Active Research</span>}
        </button>

        <button
          onClick={() => setActiveTab('drafts')}
          className={`w-full flex items-center gap-3 py-2 px-3 rounded text-left transition-colors duration-200 ${
            activeTab === 'drafts'
              ? 'text-primary font-bold bg-primary/5 border-r-2 border-primary'
              : 'text-on-surface-variant hover:bg-primary/5 hover:text-primary'
          }`}
          title="Drafts"
        >
          <span className="material-symbols-outlined text-[20px]">history_edu</span>
          {!sidebarCollapsed && <span className="font-body-md text-[13.5px] truncate">Drafts</span>}
        </button>

        <button
          onClick={() => setActiveTab('archive')}
          className={`w-full flex items-center gap-3 py-2 px-3 rounded text-left transition-colors duration-200 ${
            activeTab === 'archive'
              ? 'text-primary font-bold bg-primary/5 border-r-2 border-primary'
              : 'text-on-surface-variant hover:bg-primary/5 hover:text-primary'
          }`}
          title="Archive"
        >
          <span className="material-symbols-outlined text-[20px]">inventory_2</span>
          {!sidebarCollapsed && <span className="font-body-md text-[13.5px] truncate">Archive</span>}
        </button>
      </div>

      {/* Footer Area with Dataset Health & Model Selector */}
      <div className="mt-auto px-4 pt-4 border-t border-brass/10 flex flex-col gap-2">
        {!sidebarCollapsed && (
          <div className="flex flex-col gap-2 p-2.5 mb-2 rounded bg-surface/60 border border-brass/10">
            <div className="flex items-center justify-between">
              <span className="font-citation text-[10px] text-on-surface-variant uppercase tracking-wider">
                Dataset Health
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="font-citation text-[10.5px] text-green-400 font-medium">3,837+ Chunks</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-brass/5 pt-2 mt-1">
              <span className="font-citation text-[10px] text-on-surface-variant">Engine</span>
              <span className="font-citation text-[10.5px] text-primary font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">bolt</span>
                Extractive AI Overview
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="text-on-surface-variant/60 hover:text-brass transition-colors p-1"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {sidebarCollapsed ? 'dock_to_right' : 'dock_to_left'}
            </span>
          </button>
        </div>

        {/* User Account / Counsel Badge */}
        {!sidebarCollapsed && (
          <div className="mt-2 flex items-center gap-3 pt-2 border-t border-brass/5">
            <div className="w-8 h-8 rounded-full bg-surface-bright flex items-center justify-center overflow-hidden border border-brass/20 flex-shrink-0">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">person</span>
            </div>
            <div className="min-w-0">
              <p className="font-label-sm text-[12px] font-semibold text-on-surface truncate">
                Samvidhan AI
              </p>
              <p className="font-citation text-[10px] text-on-surface-variant/70 tracking-wider">
                Senior Counsel
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
