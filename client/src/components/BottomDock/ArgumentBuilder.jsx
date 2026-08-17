import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, Pin, Download, X, FileText, Wand2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function ArgumentBuilder() {
  const { pinnedArguments, removePin } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const totalWords = pinnedArguments.reduce(
    (acc, a) => acc + a.text.split(/\s+/).filter(Boolean).length, 0
  );

  const exportBrief = () => {
    if (!pinnedArguments.length) return;
    const body = pinnedArguments
      .map((a, i) => `## Argument ${i + 1}\n*Pinned: ${a.timestamp}*\n\n${a.text}\n\n---`)
      .join('\n\n');
    const md = `# Legal Research Brief — Samvidhan AI\n*Generated: ${new Date().toLocaleString()}*\n\n${body}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'samvidhan_legal_brief.md'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCourtPDF = () => {
    if (!pinnedArguments.length) return;
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    const argsHtml = pinnedArguments.map((a, i) => `
      <div class="argument-card">
        <h3>ARGUMENT ${i + 1}</h3>
        <p class="timestamp">Pinned to Record: ${a.timestamp}</p>
        <div class="body-text">${a.text.replace(/\n/g, '<br/>')}</div>
      </div>
    `).join('');

    printWin.document.write(`
      <html>
        <head>
          <title>Samvidhan AI — Court Submission Brief</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; padding: 40px; color: #111; line-height: 1.6; }
            .court-header { text-align: center; border-bottom: 2px solid #8A6B38; padding-bottom: 15px; margin-bottom: 30px; }
            h2 { margin: 0 0 5px 0; color: #111; letter-spacing: 1px; font-size: 20px; }
            h3 { color: #8A6B38; margin: 15px 0 5px 0; font-size: 15px; text-transform: uppercase; }
            .timestamp { font-size: 11px; color: #666; font-style: italic; margin-bottom: 10px; }
            .argument-card { page-break-inside: avoid; border-left: 3px solid #8A6B38; padding-left: 15px; margin-bottom: 25px; }
            .body-text { text-align: justify; font-size: 14px; }
            .footer { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 11px; text-align: center; color: #777; }
          </style>
        </head>
        <body>
          <div class="court-header">
            <h2>IN THE HIGH COURT OF JUDICATURE</h2>
            <p><strong>MEMORANDUM OF ARGUMENTS & STATUTORY GROUNDS</strong></p>
            <p style="font-size: 12px; color: #555;">Generated via Samvidhan AI Pure Extractive Intelligence · ${new Date().toLocaleDateString()}</p>
          </div>
          ${argsHtml}
          <div class="footer">
            <p>Advocate on Record · Samvidhan AI Chambers</p>
          </div>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.print();
  };

  return (
    <div
      className="w-full relative"
      style={{
        background: '#16181D',
        borderTop: '1px solid rgba(176,141,87,0.12)',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
        zIndex: 50,
      }}
    >
      {/* Top brass thread */}
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(176,141,87,0.3), transparent)' }} />

      {/* ── Handle ── */}
      <button
        onClick={() => setIsOpen(p => !p)}
        className="w-full flex items-center justify-between px-5 py-3.5 group transition-all"
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(176,141,87,0.03)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div className="flex items-center gap-3">
          {/* Brass-outlined icon */}
          <div className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{
              background: 'transparent',
              border: '1px solid rgba(176,141,87,0.25)',
            }}>
            <Pin className="w-3.5 h-3.5" style={{ color: '#B08D57' }} />
          </div>

          <span className="font-display text-sm font-medium" style={{ color: '#8A8778' }}>
            Argument Builder
          </span>

          <AnimatePresence>
            {pinnedArguments.length > 0 && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="font-mono text-[10px] px-2 py-0.5 rounded"
                style={{
                  background: 'rgba(176,141,87,0.1)',
                  border: '1px solid rgba(176,141,87,0.2)',
                  color: '#B08D57',
                }}
              >
                {pinnedArguments.length}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Live word count */}
          {isOpen && totalWords > 0 && (
            <span className="font-mono text-[10px]" style={{ color: '#4A4840' }}>
              {totalWords} words
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <AnimatePresence>
            {isOpen && pinnedArguments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2"
              >
                {/* Generate Draft */}
                <button
                  onClick={e => { e.stopPropagation(); exportBrief(); }}
                  className="btn-brass flex items-center gap-1.5 px-3 py-1.5 text-xs"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Generate Draft
                </button>
                {/* Export MD */}
                <button
                  onClick={e => { e.stopPropagation(); exportBrief(); }}
                  className="btn-brass-outline flex items-center gap-1.5 px-3 py-1.5 text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Markdown
                </button>
                {/* Export Court PDF */}
                <button
                  onClick={e => { e.stopPropagation(); exportCourtPDF(); }}
                  className="btn-brass flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Court PDF
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0, 0.15, 1] }}
          >
            <ChevronUp className="w-4 h-4" style={{ color: '#4A4840' }} />
          </motion.div>
        </div>
      </button>

      {/* ── Expanded panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 260, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0, 0.15, 1] }}
            className="overflow-hidden"
            style={{ background: '#0E0F12' }}
          >
            <div className="h-full overflow-y-auto px-5 py-4 scrollbar-chambers">
              {pinnedArguments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{
                      background: 'transparent',
                      border: '1px dashed rgba(176,141,87,0.2)',
                    }}>
                    <FileText className="w-5 h-5" style={{ color: '#4A4840' }} />
                  </div>
                  <p className="font-display text-sm mb-1.5" style={{ color: '#8A8778' }}>
                    Dock is empty
                  </p>
                  <p className="text-xs leading-relaxed max-w-[200px]" style={{ color: '#4A4840' }}>
                    Click the pin icon on any response to add it here. Drag citation chips directly.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pinnedArguments.map((arg, i) => (
                    <motion.div
                      key={arg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="group relative flex flex-col p-4 rounded-xl transition-all duration-150"
                      style={{
                        background: '#16181D',
                        border: '1px solid rgba(176,141,87,0.1)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'rgba(176,141,87,0.25)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(176,141,87,0.1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* Remove */}
                      <button
                        onClick={() => removePin(arg.id)}
                        className="absolute top-2.5 right-2.5 w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-all"
                        style={{ background: 'rgba(162,80,60,0.12)', color: '#A2503C' }}
                      >
                        <X className="w-3 h-3" />
                      </button>

                      {/* Index */}
                      <span className="font-mono text-[9px] mb-2" style={{ color: '#4A4840' }}>
                        #{String(i + 1).padStart(2, '0')}
                      </span>

                      {/* Sage citation chips inline */}
                      <p className="text-xs leading-relaxed flex-1 mb-3 line-clamp-4"
                        style={{ color: '#8A8778' }}>
                        {arg.text}
                      </p>

                      {/* Timestamp */}
                      <p className="font-mono text-[9px] pt-2"
                        style={{
                          color: '#4A4840',
                          borderTop: '1px solid rgba(176,141,87,0.08)',
                        }}>
                        {arg.timestamp}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
