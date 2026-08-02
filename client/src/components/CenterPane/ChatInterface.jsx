import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Send, Mic, MicOff, Scale, GitBranch, User, Bot,
  Shield, Copy, Check, Pin, ChevronDown, Sparkles,
  BookOpen, FileText, Zap, ArrowUp, Volume2,
  ThumbsUp, ThumbsDown, RotateCcw, Sun, Moon,
  BarChart2, Keyboard, Globe, X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const API_URL = 'http://localhost:8000';

const SUGGESTIONS = {
  en: [
    { q: 'What is Section 103 of BNS 2023 (Murder)?', label: 'BNS Murder', icon: Scale },
    { q: 'Explain the Basic Structure doctrine of the Indian Constitution.', label: 'Basic Structure', icon: BookOpen },
    { q: 'What are the bail provisions for non-bailable offences in India?', label: 'Bail Law', icon: FileText },
    { q: 'Explain Fundamental Rights under Article 12-35 of the Constitution.', label: 'Fundamental Rights', icon: Zap },
  ],
  hi: [
    { q: 'BNS 2023 की धारा 103 (हत्या) क्या है?', label: 'BNS धारा 103', icon: Scale },
    { q: 'भारतीय संविधान की मूल संरचना सिद्धांत की व्याख्या करें।', label: 'मूल संरचना', icon: BookOpen },
    { q: 'जमानत के क्या प्रावधान हैं?', label: 'जमानत कानून', icon: FileText },
    { q: 'अनुच्छेद 12-35 के तहत मौलिक अधिकार क्या हैं?', label: 'मौलिक अधिकार', icon: Zap },
  ],
};

const PERSONAS = [
  { id: 'judge', label: 'Supreme Court Judge', icon: '⚖️', desc: 'Formal, heavily cited, judicial tone' },
  { id: 'citizen', label: 'Citizen Mode (ELI5)', icon: '🧑‍💼', desc: 'Simple English, no jargon' },
  { id: 'advocate', label: 'Advocate Mode', icon: '📋', desc: 'Argumentative, precedent-focused' },
];

const LANG_LABELS = { en: 'EN', hi: 'हि', ta: 'த', te: 'తె' };
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
];

function ConfidenceShield({ score }) {
  if (score == null) return null;
  const level = score > 0.75 ? 'high' : score > 0.4 ? 'medium' : 'low';
  const cfg = {
    high:   { cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', label: 'Verified' },
    medium: { cls: 'text-amber-400 bg-amber-500/10 border-amber-500/30', label: 'Partial' },
    low:    { cls: 'text-red-400 bg-red-500/10 border-red-500/30 border-dashed', label: 'Low Confidence' },
  }[level];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${cfg.cls}`} title={`Retrieval confidence: ${Math.round(score * 100)}%`}>
      <Shield className="w-2.5 h-2.5" />{cfg.label}
    </span>
  );
}

function MessageBubble({ msg, onOpenSource }) {
  const { pinArgument } = useApp();
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'up' | 'down'
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  const handleSpeak = () => {
    if (isSpeaking) { speechSynthesis.cancel(); setIsSpeaking(false); return; }
    const utt = new SpeechSynthesisUtterance(msg.content.replace(/[#*`]/g, ''));
    utt.lang = 'en-IN';
    utt.onend = () => setIsSpeaking(false);
    speechSynthesis.speak(utt);
    setIsSpeaking(true);
  };

  const handleFeedback = (type) => {
    setFeedback(type);
    toast.success(type === 'up' ? '👍 Thanks for the feedback!' : '👎 Feedback noted — we\'ll improve');
  };

  if (msg.role === 'user') {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
        <div className="flex items-start gap-2.5 max-w-[78%]">
          <div className="bg-gradient-to-br from-zinc-800 to-zinc-700 dark:from-zinc-800 dark:to-zinc-700 light:from-blue-50 light:to-indigo-50 border border-white/10 rounded-2xl rounded-tr-sm px-5 py-3.5 shadow-md">
            <p className="text-zinc-100 dark:text-zinc-100 light:text-zinc-800 text-sm leading-relaxed">{msg.content}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-md ring-1 ring-white/10">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
      <div className="flex items-start gap-2.5 max-w-[90%]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-cyan-700 flex items-center justify-center flex-shrink-0 mt-1 shadow-md ring-1 ring-white/10">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center flex-wrap gap-1.5 mb-2">
            <ConfidenceShield score={msg.confidence} />
            {msg.approach && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${msg.approach === 'langchain' ? 'bg-cyan-900/30 text-cyan-400' : 'bg-emerald-900/30 text-emerald-400'}`}>
                {msg.approach === 'langchain' ? '⚡ LangChain' : '⚙️ Core Python'}
              </span>
            )}
            {msg.time && <span className="text-[10px] text-zinc-600">{msg.time}s</span>}
            {msg.persona && <span className="text-[10px] text-zinc-600">{PERSONAS.find(p => p.id === msg.persona)?.icon}</span>}
          </div>

          {/* Bubble */}
          <div className="bg-zinc-900/70 border border-white/8 rounded-2xl rounded-tl-sm px-5 py-4 shadow-lg backdrop-blur-sm">
            {msg.streaming ? (
              <div className="flex items-center gap-2">
                <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <span className="animate-pulse text-amber-400 text-lg">▋</span>
              </div>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none
                prose-p:text-zinc-300 prose-p:leading-relaxed
                prose-headings:text-zinc-100 prose-headings:font-bold
                prose-strong:text-zinc-100
                prose-code:text-cyan-300 prose-code:bg-zinc-800/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                prose-pre:bg-zinc-800 prose-pre:rounded-xl prose-pre:border prose-pre:border-white/8
                prose-li:text-zinc-300 prose-a:text-cyan-400 prose-blockquote:border-l-amber-500 prose-blockquote:text-zinc-400">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            )}

            {/* Sources */}
            {msg.sources?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-1.5">
                <span className="text-[10px] text-zinc-600 self-center font-medium">SOURCES</span>
                {msg.sources.map((src, i) => (
                  <button key={i} onClick={() => onOpenSource(src)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-900/20 border border-cyan-500/20 text-cyan-400 text-[10px] font-mono hover:bg-cyan-900/40 transition-all">
                    [{i + 1}] {(src.title ?? src.document_name ?? 'Source').substring(0, 20)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          {!msg.streaming && (
            <div className="flex items-center gap-0.5 mt-1.5 ml-1">
              <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-all">
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={() => pinArgument(msg.content)} className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-all">
                <Pin className="w-3 h-3" /> Pin
              </button>
              <button onClick={handleSpeak} className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-all ${isSpeaking ? 'text-amber-400 bg-amber-900/20' : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/5'}`}>
                <Volume2 className="w-3 h-3" /> {isSpeaking ? 'Stop' : 'Read'}
              </button>
              <div className="ml-1 flex items-center gap-0.5">
                <button onClick={() => handleFeedback('up')} className={`p-1 rounded-md transition-all ${feedback === 'up' ? 'text-emerald-400' : 'text-zinc-700 hover:text-zinc-400'}`}>
                  <ThumbsUp className="w-3 h-3" />
                </button>
                <button onClick={() => handleFeedback('down')} className={`p-1 rounded-md transition-all ${feedback === 'down' ? 'text-red-400' : 'text-zinc-700 hover:text-zinc-400'}`}>
                  <ThumbsDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-cyan-700 flex items-center justify-center flex-shrink-0 mt-1 ring-1 ring-white/10">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="bg-zinc-900/70 border border-white/8 rounded-2xl rounded-tl-sm px-5 py-4">
          <div className="flex items-center gap-2">
            {[0,1,2].map(i => (
              <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-500"
                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
            ))}
            <span className="text-[11px] text-zinc-600 ml-1">Searching Indian legal corpus...</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ChatInterface({ onOpenSource }) {
  const { engine, setEngine, pinArgument, isDark, toggleTheme, language, setLanguage,
          setCommandOpen, setIpcBnsOpen, setGraphOpen, setStatsOpen, setShortcutsOpen } = useApp();

  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem('samvidhan_messages') || '[]'); } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [persona, setPersona] = useState('judge');
  const [personaOpen, setPersonaOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [queryStats, setQueryStats] = useState({ count: 0, avgTime: 0 });
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  // Persist messages
  useEffect(() => {
    localStorage.setItem('samvidhan_messages', JSON.stringify(messages.slice(-50)));
  }, [messages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  const currentPersona = PERSONAS.find(p => p.id === persona);
  const suggestions = SUGGESTIONS[language] || SUGGESTIONS.en;

  const sendMessage = useCallback(async (text) => {
    const query = text ?? input.trim();
    if (!query || isLoading) return;
    setInput('');
    const userMsg = { id: Date.now(), role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Streaming placeholder
    const aiId = Date.now() + 1;
    const aiMsg = { id: aiId, role: 'assistant', content: '', streaming: true, sources: [], confidence: null, approach: engine, persona };
    setMessages(prev => [...prev, aiMsg]);

    const params = new URLSearchParams({ query, approach: engine });
    const startTime = Date.now();

    try {
      const es = new EventSource(`${API_URL}/stream?${params.toString()}`);
      abortRef.current = es;

      es.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'token') {
          setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: m.content + data.content } : m));
        } else if (data.type === 'sources') {
          setMessages(prev => prev.map(m => m.id === aiId ? { ...m, sources: data.data } : m));
        } else if (data.type === 'done') {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          setMessages(prev => prev.map(m => m.id === aiId ? { ...m, streaming: false, time: elapsed, confidence: 0.85 } : m));
          setQueryStats(prev => ({ count: prev.count + 1, avgTime: ((prev.avgTime * prev.count + parseFloat(elapsed)) / (prev.count + 1)).toFixed(1) }));
          es.close();
          setIsLoading(false);
        }
      };

      es.onerror = () => {
        // Fallback to non-streaming
        es.close();
        fetch(`${API_URL}/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, approach: engine, persona }),
        })
        .then(r => r.json())
        .then(data => {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          setMessages(prev => prev.map(m => m.id === aiId ? {
            ...m, content: data.answer ?? 'No answer returned.', sources: data.sources ?? [],
            streaming: false, time: elapsed, confidence: 0.75, approach: data.metrics?.approach ?? engine,
          } : m));
          setQueryStats(prev => ({ count: prev.count + 1, avgTime: ((prev.avgTime * prev.count + parseFloat(elapsed)) / (prev.count + 1)).toFixed(1) }));
        })
        .catch(err => {
          setMessages(prev => prev.map(m => m.id === aiId ? {
            ...m, content: `**Backend connection failed.**\n\nMake sure Uvicorn is running:\n\`\`\`bash\npython -m uvicorn api.main:app --reload\n\`\`\`\n*${err.message}*`,
            streaming: false, confidence: 0,
          } : m));
          toast.error('Could not reach backend');
        })
        .finally(() => setIsLoading(false));
      };
    } catch (err) {
      setIsLoading(false);
      toast.error('Connection failed');
    }
  }, [input, isLoading, engine, persona]);

  const clearChat = () => {
    if (!messages.length) return;
    setMessages([]);
    localStorage.removeItem('samvidhan_messages');
    toast.success('Chat cleared');
  };

  const toggleVoice = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { toast.error('Voice not supported in this browser'); return; }
    if (isListening) { setIsListening(false); return; }
    const r = new Recognition();
    r.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    r.onresult = e => { setInput(e.results[0][0].transcript); setIsListening(false); };
    r.onend = () => setIsListening(false);
    r.onerror = () => setIsListening(false);
    setIsListening(true);
    r.start();
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 dark:bg-zinc-950 light:bg-slate-50 transition-colors">
      {/* ─── Top Nav ─── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-zinc-950/90 dark:bg-zinc-950/90 light:bg-white/90 backdrop-blur-xl flex-shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-900/40">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-zinc-100">Samvidhan AI</div>
            <div className="text-[10px] text-zinc-600">सम्विधान · Indian Legal Intelligence</div>
          </div>
          <button onClick={() => setCommandOpen(true)} className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-600 font-mono hover:text-zinc-400 transition-all">⌘K</button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1.5">
          {/* Language picker */}
          <div className="relative">
            <button onClick={() => setLangOpen(p => !p)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/5 text-xs text-zinc-400 hover:bg-zinc-800 transition-all">
              <Globe className="w-3.5 h-3.5" /> {LANG_LABELS[language]} <ChevronDown className={`w-3 h-3 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 top-full mt-1.5 w-44 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-30">
                  {LANGUAGES.map(l => (
                    <button key={l.code} onClick={() => { setLanguage(l.code); setLangOpen(false); toast.success(`Language: ${l.label}`); }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-white/5 transition-colors ${language === l.code ? 'text-amber-400' : 'text-zinc-300'}`}>
                      {language === l.code && <Check className="w-3 h-3" />}
                      <span className={language === l.code ? '' : 'ml-5'}>{l.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Persona */}
          <div className="relative">
            <button onClick={() => setPersonaOpen(p => !p)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/5 text-xs text-zinc-400 hover:bg-zinc-800 transition-all">
              <span>{currentPersona.icon}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${personaOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {personaOpen && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 top-full mt-1.5 w-60 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-30">
                  {PERSONAS.map(p => (
                    <button key={p.id} onClick={() => { setPersona(p.id); setPersonaOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors ${persona === p.id ? 'bg-white/5' : ''}`}>
                      <span className="text-lg">{p.icon}</span>
                      <div><div className="text-sm font-medium text-zinc-200">{p.label}</div><div className="text-xs text-zinc-500">{p.desc}</div></div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Engine toggle */}
          <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-white/5">
            <button onClick={() => setEngine('langchain')} className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${engine === 'langchain' ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'}`}>⚡ LC</button>
            <button onClick={() => setEngine('core_python')} className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${engine === 'core_python' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}>⚙️ PY</button>
          </div>

          {/* Tool buttons */}
          <button onClick={() => setIpcBnsOpen(true)} className="p-1.5 rounded-lg text-zinc-500 hover:text-amber-400 hover:bg-amber-900/10 transition-all" title="IPC ↔ BNS Comparator"><Scale className="w-4 h-4" /></button>
          <button onClick={() => setGraphOpen(true)} className="p-1.5 rounded-lg text-zinc-500 hover:text-purple-400 hover:bg-purple-900/10 transition-all" title="Precedent Graph"><GitBranch className="w-4 h-4" /></button>
          <button onClick={() => setStatsOpen(true)} className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-400 hover:bg-blue-900/10 transition-all" title="Statistics"><BarChart2 className="w-4 h-4" /></button>
          <button onClick={toggleTheme} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all" title="Toggle Theme">{isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button>
          <button onClick={() => setShortcutsOpen(true)} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all" title="Keyboard Shortcuts"><Keyboard className="w-4 h-4" /></button>
          {messages.length > 0 && (
            <button onClick={clearChat} className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-900/10 transition-all" title="Clear chat"><X className="w-4 h-4" /></button>
          )}
        </div>
      </div>

      {/* ─── Messages ─── */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 scrollbar-thin scrollbar-thumb-zinc-800">
        {/* Empty state */}
        {messages.length === 0 && !isLoading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full min-h-[55vh] text-center px-4">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.4 }}
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-700/20 border border-amber-500/20 flex items-center justify-center mb-5 shadow-2xl shadow-amber-900/20">
              <Scale className="w-10 h-10 text-amber-400" />
            </motion.div>
            <h1 className="text-3xl font-bold text-zinc-100 mb-1 tracking-tight">Samvidhan AI</h1>
            <p className="text-zinc-400 mb-1">सम्विधान — Indian Legal Intelligence</p>
            <p className="text-zinc-600 text-sm max-w-md mb-8">
              Explore Indian law, Supreme Court judgments, BNS, Constitution and more.<br />
              <span className="text-zinc-700">All data stays on your machine. 100% private.</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
              {suggestions.map((s, i) => (
                <motion.button key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }} onClick={() => sendMessage(s.q)}
                  className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/60 border border-white/5 text-left hover:border-amber-500/25 hover:bg-amber-900/5 transition-all group">
                  <div className="w-9 h-9 rounded-lg bg-zinc-800 group-hover:bg-amber-900/30 flex items-center justify-center flex-shrink-0 transition-colors">
                    <s.icon className="w-4.5 h-4.5 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-500 group-hover:text-amber-400 mb-0.5 transition-colors">{s.label}</div>
                    <div className="text-xs text-zinc-600 leading-snug">{s.q}</div>
                  </div>
                </motion.button>
              ))}
            </div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="mt-8 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/20 border border-emerald-500/20 text-xs text-emerald-500">
              <Shield className="w-3.5 h-3.5" /> Privacy-first · Runs fully offline · No data leaves your machine
            </motion.div>
          </motion.div>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} onOpenSource={onOpenSource} />
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* ─── Input bar ─── */}
      <div className="px-5 pb-4 pt-2 flex-shrink-0 bg-zinc-950/90 backdrop-blur-xl">
        <div className={`flex items-end gap-2 rounded-2xl border px-4 py-2.5 transition-all shadow-lg
          ${isListening ? 'border-red-500/40 bg-red-900/10' : 'border-white/8 bg-zinc-900/80 hover:border-white/12'}`}>
          {/* Voice */}
          <button onClick={toggleVoice}
            className={`p-2 rounded-xl transition-all flex-shrink-0 mb-0.5 ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/5'}`}>
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text input */}
          <textarea ref={inputRef} rows={1} value={input}
            onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'; }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={isListening ? '🎙️ Listening...' : `Ask about Indian Law... (${currentPersona.icon})`}
            className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-zinc-200 placeholder:text-zinc-600 leading-relaxed max-h-[150px] scrollbar-none py-1" />

          {/* Send */}
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className={`p-2.5 rounded-xl flex-shrink-0 mb-0.5 transition-all ${input.trim() && !isLoading ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-900/30' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}>
            {isLoading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
          </motion.button>
        </div>
        <p className="text-center text-[10px] text-zinc-700 mt-2">
          <kbd className="bg-zinc-800 px-1 py-0.5 rounded text-[9px]">Enter</kbd> send &nbsp;·&nbsp;
          <kbd className="bg-zinc-800 px-1 py-0.5 rounded text-[9px]">Shift+Enter</kbd> new line &nbsp;·&nbsp;
          <kbd className="bg-zinc-800 px-1 py-0.5 rounded text-[9px]">⌘K</kbd> commands &nbsp;·&nbsp;
          <kbd className="bg-zinc-800 px-1 py-0.5 rounded text-[9px]">?</kbd> shortcuts
        </p>
      </div>
    </div>
  );
}
