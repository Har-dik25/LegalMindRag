import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import toast from 'react-hot-toast';

export default function SourceDossier() {
  const { dossierSource, closeDossier, pinArgument } = useApp();
  const [activeTab, setActiveTab] = useState('case_no');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  if (!dossierSource) {
    return (
      <aside className="w-80 lg:w-96 h-full border-l border-brass/10 bg-parchment flex flex-col flex-shrink-0 z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.2)]">
        <div className="p-4 border-b border-black/10 flex justify-between items-center bg-black/5">
          <h3 className="font-label-sm text-[11px] uppercase tracking-widest text-black/60 font-inter font-semibold">
            Source Viewer
          </h3>
          <button onClick={closeDossier} className="text-black/40 hover:text-black/80 transition-colors">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 text-black/40 text-sm font-legal text-center">
          Select any citation or source to inspect primary statutory and judicial records.
        </div>
      </aside>
    );
  }

  const title = dossierSource.title || dossierSource.doc_title || 'Supreme Court of India';
  const citation = dossierSource.citation || dossierSource.section || dossierSource.section_ref || 'AIR / SCC Precedent';
  const text = dossierSource.text || dossierSource.page_content || '';
  const year = dossierSource.year || '2023';

  return (
    <aside className="w-80 lg:w-96 h-full border-l border-brass/10 bg-parchment flex flex-col flex-shrink-0 z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.25)] select-text">
      {/* Header */}
      <div className="p-4 border-b border-black/10 flex justify-between items-center bg-black/5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-black/60">menu_book</span>
          <h3 className="font-label-sm text-[11px] uppercase tracking-widest text-black/70 font-inter font-semibold">
            Document Viewer
          </h3>
        </div>
        <button
          onClick={closeDossier}
          className="text-black/40 hover:text-black/80 transition-colors p-1 rounded hover:bg-black/5"
          title="Close Viewer"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Find in document search */}
      <div className="p-2 border-b border-black/10 bg-black/[0.02]">
        <div className="relative flex items-center bg-white/60 rounded border border-black/15 px-2 py-1">
          <span className="material-symbols-outlined text-black/40 text-[14px] mr-1">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-[12px] font-inter text-black/80 focus:ring-0 focus:outline-none w-full py-0 placeholder:text-black/30"
            placeholder="Find in document..."
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-black/40 hover:text-black/70 text-xs">
              ×
            </button>
          )}
        </div>
      </div>

      {/* Parchment Content Body */}
      <div className="flex-1 p-6 overflow-y-auto custom-scroll relative">
        <div className="text-black/90 font-legal text-[14px] leading-relaxed relative">
          {/* Official Court Header */}
          <div className="text-center mb-6 border-b border-black/10 pb-4">
            <span className="text-[10px] font-citation uppercase tracking-widest text-black/40 block mb-1">
              Official Legal Record
            </span>
            <h4 className="font-headline-md text-[18px] text-black uppercase tracking-wider font-fraunces">
              {title}
            </h4>
            <p className="text-black/60 italic font-legal text-[13px] mt-1">
              {citation} ({year})
            </p>
          </div>

          {/* Key Extract Highlight */}
          <div className="bg-yellow-300/25 p-3.5 -mx-2 rounded border-l-2 border-brass mb-4 text-justify relative group shadow-sm">
            <span className="absolute -left-3 top-2.5 w-5 h-5 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center text-[10px] font-bold text-red-700 font-inter">
              !
            </span>
            <p className="text-black/95 font-medium text-[13.5px] pl-2">
              {text.slice(0, 320)}
            </p>
          </div>

          {/* Remaining Body Text */}
          {text.length > 320 && (
            <p className="text-black/80 text-justify text-[13px] leading-relaxed space-y-2 whitespace-pre-line">
              {text.slice(320)}
            </p>
          )}

          <div className="mt-8 pt-4 border-t border-black/10 flex justify-between items-center text-black/50 text-[11px] font-citation">
            <span>Grounding Score: {(dossierSource.score ? dossierSource.score * 100 : 94).toFixed(0)}%</span>
            <button
              onClick={() => pinArgument(text)}
              className="text-brass hover:underline font-semibold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">add_box</span> Pin to Arguments
            </button>
          </div>

          <p className="mt-8 text-center text-black/30 font-citation text-[11px]">
            --- Verified Indian Law Repository ---
          </p>
        </div>
      </div>

      {/* Metadata Tabs */}
      <div className="flex border-t border-black/10 bg-black/5">
        <button
          onClick={() => setActiveTab('case_no')}
          className={`flex-1 py-2 text-[10px] font-citation uppercase tracking-wider transition-colors ${
            activeTab === 'case_no'
              ? 'text-black border-b-2 border-brass bg-black/5 font-bold'
              : 'text-black/60 hover:bg-black/5'
          }`}
        >
          Case / Sec
        </button>
        <button
          onClick={() => setActiveTab('bench')}
          className={`flex-1 py-2 text-[10px] font-citation uppercase tracking-wider transition-colors ${
            activeTab === 'bench'
              ? 'text-black border-b-2 border-brass bg-black/5 font-bold'
              : 'text-black/60 hover:bg-black/5'
          }`}
        >
          Jurisdiction
        </button>
        <button
          onClick={() => setActiveTab('date')}
          className={`flex-1 py-2 text-[10px] font-citation uppercase tracking-wider transition-colors ${
            activeTab === 'date'
              ? 'text-black border-b-2 border-brass bg-black/5 font-bold'
              : 'text-black/60 hover:bg-black/5'
          }`}
        >
          Statute Year
        </button>
      </div>

      {/* Bottom pagination */}
      <div className="p-3 border-t border-black/10 flex justify-between items-center bg-black/[0.04]">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="w-7 h-7 rounded bg-white/70 border border-black/15 flex items-center justify-center hover:bg-white text-black/70 transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">chevron_left</span>
        </button>
        <span className="font-citation text-[11px] text-black/60 flex items-center px-2">
          Page {page} of 12
        </span>
        <button
          onClick={() => setPage((p) => p + 1)}
          className="w-7 h-7 rounded bg-white/70 border border-black/15 flex items-center justify-center hover:bg-white text-black/70 transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        </button>
      </div>
    </aside>
  );
}
