import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext';

const API_URL = 'http://localhost:8000';

const SUGGESTED_QUERIES = [
  { q: "What is Section 103 of BNS 2023 (Murder & Mob Lynching)?", label: "BNS §103 Murder & Lynching" },
  { q: "Explain the burden of proof in Section 302 IPC circumstantial evidence cases.", label: "Precedents on Burden of Proof" },
  { q: "What is a Zero FIR under BNSS 2023?", label: "BNSS §173 Zero FIR Procedure" },
  { q: "How does BSA 2023 treat WhatsApp messages and electronic evidence?", label: "BSA §61/63 Digital Evidence" },
];

export default function ChatInterface({ onOpenSource }) {
  const {
    engine,
    setEngine,
    language,
    setLanguage,
    setCommandOpen,
    setIpcBnsOpen,
    setGraphOpen,
    setStatsOpen,
    setShortcutsOpen,
    isDevilsAdvocate,
    toggleDevilsAdvocate,
    pinArgument,
  } = useApp();

  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lmr_messages') || '[]');
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState('research');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [currentRetrievalStep, setCurrentRetrievalStep] = useState(0); // 0: Searching, 1: Reranking, 2: Drafting

  const bottomRef = useRef(null);
  const abortRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('lmr_messages', JSON.stringify(messages.slice(-50)));
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Dynamic retrieval progress simulation while generating
  useEffect(() => {
    if (!isLoading) {
      setCurrentRetrievalStep(0);
      return;
    }
    const t1 = setTimeout(() => setCurrentRetrievalStep(1), 600);
    const t2 = setTimeout(() => setCurrentRetrievalStep(2), 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isLoading]);

  // Auto-resize input
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
  }, [input]);

  const sendMessage = useCallback(
    async (text) => {
      const query = (text ?? input).trim();
      if (!query || isLoading) return;
      setInput('');

      const userMsg = { id: Date.now(), role: 'user', content: query };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      const aiId = Date.now() + 1;
      setMessages((prev) => [
        ...prev,
        {
          id: aiId,
          role: 'assistant',
          content: '',
          streaming: true,
          sources: [],
          approach: engine,
          isDevilsAdvocate,
        },
      ]);

      const qs = new URLSearchParams({ query, approach: engine });
      if (selectedCategory !== 'ALL') qs.append('category', selectedCategory);
      if (isDevilsAdvocate) qs.append('devils_advocate', 'true');
      const t0 = Date.now();

      try {
        const es = new EventSource(`${API_URL}/stream?${qs}`);
        abortRef.current = es;

        es.onmessage = (e) => {
          const d = JSON.parse(e.data);
          if (d.type === 'token') {
            setMessages((prev) =>
              prev.map((m) => (m.id === aiId ? { ...m, content: m.content + d.content } : m))
            );
          } else if (d.type === 'sources') {
            setMessages((prev) =>
              prev.map((m) => (m.id === aiId ? { ...m, sources: d.data } : m))
            );
          } else if (d.type === 'done') {
            const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
            setMessages((prev) =>
              prev.map((m) => (m.id === aiId ? { ...m, streaming: false, time: elapsed } : m))
            );
            es.close();
            setIsLoading(false);
          }
        };

        es.onerror = () => {
          es.close();
          // Fallback to /query POST endpoint
          fetch(`${API_URL}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query,
              approach: engine,
              category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
            }),
          })
            .then((r) => r.json())
            .then((d) => {
              const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiId
                    ? {
                        ...m,
                        content: d.answer ?? 'No answer returned.',
                        sources: d.sources ?? [],
                        streaming: false,
                        time: elapsed,
                        approach: d.metrics?.approach ?? engine,
                      }
                    : m
                )
              );
            })
            .catch((err) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiId
                    ? {
                        ...m,
                        content: `**Query Processing Error**\n\n${err.message}\n\nPlease check server connection.`,
                        streaming: false,
                      }
                    : m
                )
              );
            })
            .finally(() => setIsLoading(false));
        };
      } catch {
        setIsLoading(false);
        toast.error('Connection failed');
      }
    },
    [input, isLoading, engine, isDevilsAdvocate]
  );

  const toggleVoice = () => {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) {
      toast.error('Voice input not supported in this browser');
      return;
    }
    if (isListening) {
      setIsListening(false);
      return;
    }
    const r = new Rec();
    r.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    r.onresult = (e) => {
      setInput(e.results[0][0].transcript);
      setIsListening(false);
    };
    r.onend = () => setIsListening(false);
    r.onerror = () => setIsListening(false);
    setIsListening(true);
    r.start();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleExportPDF = (content) => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      toast.error('Popup blocked');
      return;
    }
    printWin.document.write(`
      <html>
        <head>
          <title>Legal Opinion — Samvidhan AI</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 40px; color: #111; line-height: 1.6; }
            h1, h2, h3 { color: #8A6B38; }
            .header { text-align: center; border-bottom: 2px solid #8A6B38; padding-bottom: 12px; margin-bottom: 24px; }
            .citation { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>SAMVIDHAN AI — LEGAL INTELLIGENCE OPINION</h2>
            <p>Generated: ${new Date().toLocaleDateString()}</p>
          </div>
          <div>${content.replace(/\n/g, '<br/>')}</div>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.print();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-obsidian text-on-surface relative overflow-hidden select-text">
      {/* ══ TOP APP BAR ════════════════════════════════════════════ */}
      <nav className="bg-obsidian/80 backdrop-blur-xl border-b border-brass/10 flex justify-between items-center h-16 px-6 w-full z-40 flex-shrink-0">
        <div className="flex items-center gap-6">
          <span className="font-headline-md text-[24px] text-primary tracking-tight font-fraunces">
            Samvidhan AI
          </span>
          <div className="hidden md:flex gap-4 ml-6">
            <button
              onClick={() => setActiveNavTab('research')}
              className={`pb-1 font-label-sm text-[12px] uppercase tracking-wider transition-colors ${
                activeNavTab === 'research'
                  ? 'text-primary border-b-2 border-primary font-bold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Research
            </button>
            <button
              onClick={() => setActiveNavTab('documents')}
              className={`pb-1 font-label-sm text-[12px] uppercase tracking-wider transition-colors ${
                activeNavTab === 'documents'
                  ? 'text-primary border-b-2 border-primary font-bold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Documents
            </button>
            <button
              onClick={() => setActiveNavTab('analytics')}
              className={`pb-1 font-label-sm text-[12px] uppercase tracking-wider transition-colors ${
                activeNavTab === 'analytics'
                  ? 'text-primary border-b-2 border-primary font-bold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              Analytics
            </button>
          </div>
        </div>

        {/* Right tools and actions */}
        <div className="flex items-center gap-4">
          <div className="relative hidden lg:block">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search precedents or ⌘K..."
              onClick={() => setCommandOpen(true)}
              className="input-ghost pl-8 pr-4 py-1 text-on-surface font-body-md text-[13.5px] w-60 placeholder:text-on-surface-variant/40 cursor-pointer"
              readOnly
            />
          </div>

          <button
            onClick={() => setIpcBnsOpen(true)}
            className="brass-outline-button px-3 py-1 rounded text-xs flex items-center gap-1.5 font-label-sm font-semibold"
            title="IPC ↔ BNS Converter"
          >
            <span className="material-symbols-outlined text-[16px]">balance</span>
            <span>IPC ↔ BNS</span>
          </button>

          <button
            onClick={toggleDevilsAdvocate}
            className={`px-3 py-1 rounded text-xs flex items-center gap-1.5 font-label-sm transition-all ${
              isDevilsAdvocate
                ? 'bg-error-container/30 border border-error text-error font-bold'
                : 'brass-outline-button'
            }`}
            title="Devil's Advocate Counter-argument mode"
          >
            <span className="material-symbols-outlined text-[16px]">swords</span>
            <span className="hidden sm:inline">Advocate</span>
          </button>

          <div className="flex items-center gap-2 text-on-surface-variant">
            <button
              onClick={() => setGraphOpen(true)}
              className="hover:text-primary transition-colors p-1"
              title="Precedent Graph"
            >
              <span className="material-symbols-outlined text-[20px]">hub</span>
            </button>
            <button
              onClick={() => setStatsOpen(true)}
              className="hover:text-primary transition-colors p-1"
              title="System Statistics"
            >
              <span className="material-symbols-outlined text-[20px]">bar_chart</span>
            </button>
            <button
              onClick={() => setShortcutsOpen(true)}
              className="hover:text-primary transition-colors p-1"
              title="Keyboard Shortcuts (?)"
            >
              <span className="material-symbols-outlined text-[20px]">keyboard</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ══ CHAT SCROLL CONTAINER ═════════════════════════════════ */}
      <main className="flex-1 flex flex-col relative h-full bg-obsidian overflow-hidden">
        {/* Subtle background atmosphere glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 0%, #B08D57, transparent 70%)',
          }}
        />

        <div className="flex-1 overflow-y-auto custom-scroll p-6 flex flex-col gap-6 z-10 max-w-4xl mx-auto w-full pb-36">
          {/* Empty state / Suggested questions */}
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center my-auto py-10">
              <span className="material-symbols-outlined text-[48px] text-primary/20 mb-3">
                gavel
              </span>
              <h2 className="font-headline-lg text-[26px] text-on-surface mb-2 font-fraunces">
                Chamber Research
              </h2>
              <p className="font-body-md text-[14px] text-on-surface-variant mb-8 max-w-md text-center">
                Query case law, draft arguments, or analyze precedent with high precision grounded in Indian statutes.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full">
                {SUGGESTED_QUERIES.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => sendMessage(item.q)}
                    className="glass-panel rounded-lg p-4 cursor-pointer hover:glass-panel-active transition-all group"
                  >
                    <p className="font-body-md text-[14px] text-on-surface group-hover:text-primary transition-colors font-medium">
                      "{item.q}"
                    </p>
                    <span className="font-citation text-[11px] text-on-surface-variant/60 mt-1 block">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="flex flex-col gap-6 w-full">
            {messages.map((msg) => {
              if (msg.role === 'user') {
                return (
                  <div key={msg.id} className="flex justify-end w-full">
                    <div className="bg-surface-container-high rounded-xl rounded-tr-sm p-4 max-w-[82%] border border-white/5 shadow-md">
                      <p className="font-body-md text-[14.5px] leading-relaxed text-on-surface">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                );
              }

              // AI Assistant Response Card
              return (
                <div key={msg.id} className="flex w-full">
                  {/* Vertical rule denoting official guidance */}
                  <div className="w-[2px] bg-primary/20 mr-4 self-stretch rounded-full mt-2 mb-2 shadow-[0_0_8px_rgba(176,141,87,0.3)]" />

                  <div className="glass-panel rounded-xl rounded-tl-sm p-6 max-w-full flex-1 relative overflow-hidden">
                    {/* Subtle gold glow in top left */}
                    <div className="absolute -top-10 -left-10 w-20 h-20 bg-primary/10 blur-[35px] rounded-full pointer-events-none" />

                    {/* Card Header Badge */}
                    <div className="flex items-center gap-2 mb-4 text-primary">
                      <span className="material-symbols-outlined text-[18px]">
                        account_balance
                      </span>
                      <span className="font-label-sm text-[11px] uppercase tracking-wider font-semibold">
                        Official Guidance
                      </span>
                      {msg.approach && (
                        <span className="font-citation text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary/80 border border-primary/20">
                          {msg.approach === 'extractive' ? '⚡ Extractive AI Overview' : msg.approach}
                        </span>
                      )}
                      <span className="ml-auto font-citation text-[10px] text-on-surface-variant/70">
                        Grounded in 3,837+ indexed chunks
                      </span>
                    </div>

                    {/* Markdown Content with citations */}
                    <div className="prose prose-invert max-w-none font-body-md text-[14.5px] leading-relaxed text-on-surface/90 space-y-4">
                      <ReactMarkdown>{msg.content || '...'}</ReactMarkdown>
                    </div>

                    {/* Interactive Citation Chips */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-5 pt-3 border-t border-white/5 flex flex-wrap gap-2 items-center">
                        <span className="font-citation text-[10px] uppercase text-on-surface-variant/60 mr-1">
                          Citations:
                        </span>
                        {msg.sources.map((src, i) => (
                          <button
                            key={i}
                            onClick={() => onOpenSource(src)}
                            className="citation-chip px-2 py-1 rounded text-[11px] font-citation inline-flex items-center gap-1.5 cursor-pointer hover:bg-secondary/20 transition-colors"
                            title="Click to view full statutory / case document"
                          >
                            <span className="material-symbols-outlined text-[13px]">
                              {src.doc_type === 'Act' ? 'gavel' : 'menu_book'}
                            </span>
                            <span>
                              {src.title ? src.title.slice(0, 32) + (src.title.length > 32 ? '…' : '') : `Source ${i + 1}`}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Suggested Action Buttons */}
                    {!msg.streaming && msg.content && (
                      <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap justify-between items-center gap-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => pinArgument(msg.content)}
                            className="brass-outline-button px-3 py-1 rounded text-xs flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[14px]">add_box</span>
                            <span>Add to Argument</span>
                          </button>
                          {msg.sources?.[0] && (
                            <button
                              onClick={() => onOpenSource(msg.sources[0])}
                              className="brass-outline-button px-3 py-1 rounded text-xs flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-[14px]">find_in_page</span>
                              <span>View Full Judgement</span>
                            </button>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(msg.content);
                              toast.success('Citation copied');
                            }}
                            className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 text-[11px] font-citation uppercase"
                          >
                            <span className="material-symbols-outlined text-[14px]">content_copy</span>
                            <span>Copy Citation</span>
                          </button>
                          <button
                            onClick={() => handleExportPDF(msg.content)}
                            className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 text-[11px] font-citation uppercase"
                          >
                            <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
                            <span>Export PDF</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Progress Thread (Active during streaming/retrieval) */}
            {isLoading && (
              <div className="flex items-center gap-3 text-primary/80 ml-5 mt-2 animate-[subtle-pulse_3s_ease-in-out_infinite]">
                <span className="material-symbols-outlined text-[16px] animate-spin">
                  sync
                </span>
                <div className="font-citation text-citation text-[11px] uppercase tracking-wider flex items-center gap-2">
                  <span className={currentRetrievalStep >= 0 ? 'text-primary font-bold' : 'opacity-40'}>
                    Searching
                  </span>
                  <span className="material-symbols-outlined text-[10px]">arrow_forward_ios</span>
                  <span className={currentRetrievalStep >= 1 ? 'text-primary font-bold' : 'opacity-40'}>
                    Re-ranking
                  </span>
                  <span className="material-symbols-outlined text-[10px]">arrow_forward_ios</span>
                  <span className={currentRetrievalStep >= 2 ? 'text-primary font-bold' : 'opacity-40'}>
                    Drafting
                  </span>
                </div>
                <div className="h-[2px] flex-1 bg-primary/20 progress-thread ml-2 rounded-full" />
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* ══ BOTTOM INPUT AREA ═══════════════════════════════════ */}
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 border-t border-brass/10 bg-[#0E0F12]/90 backdrop-blur-xl z-20">
          <div className="max-w-4xl mx-auto mb-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {[
              { id: 'ALL', label: 'All Statutory Acts' },
              { id: 'BNS', label: 'BNS 2023' },
              { id: 'BNSS', label: 'BNSS 2023' },
              { id: 'BSA', label: 'BSA 2023' },
              { id: 'IPC', label: 'IPC 1860' },
              { id: 'CrPC', label: 'CrPC 1973' },
              { id: 'Constitution', label: 'Constitution' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#B08D57] text-[#0E0F12] font-bold shadow-[0_0_8px_rgba(176,141,87,0.3)]'
                    : 'bg-[#16181D] text-[#8A8778] hover:text-[#E9E6DD] border border-[#B08D57]/15'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="max-w-4xl mx-auto relative flex items-end bg-surface-container-high rounded-lg border border-brass/10 focus-within:border-brass/40 focus-within:shadow-[0_0_12px_rgba(176,141,87,0.15)] transition-all p-2">
            <button
              onClick={toggleVoice}
              className={`p-2 transition-colors rounded ${
                isListening ? 'text-error bg-error/10 animate-pulse' : 'text-on-surface-variant hover:text-primary'
              }`}
              title="Voice Input (Speech to Text)"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isListening ? 'mic' : 'mic_none'}
              </span>
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask a legal question, analyze a section, or specify a drafting task..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface font-body-md text-[14.5px] resize-none py-2 px-2 custom-scroll max-h-32 placeholder:text-on-surface-variant/40 outline-none"
            />

            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="p-2 text-surface-dim bg-primary rounded-md hover:bg-primary-fixed-dim transition-colors ml-2 self-end mb-0.5 cursor-pointer disabled:opacity-40"
              title="Send Query"
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                send
              </span>
            </button>
          </div>

          <div className="text-center mt-2">
            <span className="font-citation text-citation text-[10px] text-on-surface-variant/50">
              AI responses are for research purposes. Verify critical statutory provisions with primary sources.
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
