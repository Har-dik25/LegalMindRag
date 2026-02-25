import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, User, Trash2, StopCircle, RefreshCw, X, Shield,
  Scale, FileText, Zap, BookOpen, Search, Menu,
  CornerDownRight, Sparkles, ArrowUp, Clock, Copy, Check,
  Download, History as HistoryIcon, Mic, Sun, Moon, Maximize2,
  FileUp, Share2, Book, ArrowRightLeft, Home, Bookmark, Settings,
  Activity, Database, Cpu, ChevronRight, AlertTriangle, LogOut,
  ToggleLeft, ToggleRight, Code, Layers, Workflow, Box
} from "lucide-react";
import LoginSignup from "./LoginSignup";

const API_URL = "http://localhost:8000";

const CATEGORIES = [
  { id: "all", label: "General", icon: Menu },
  { id: "Criminal Law", label: "Criminal", icon: Shield },
  { id: "Constitutional Law", label: "Constitution", icon: Scale },
  { id: "Civil Procedure", label: "Civil", icon: FileText },
  { id: "Property Law", label: "Property", icon: BookOpen },
  { id: "Tax & Financial Law", label: "Finance", icon: Zap },
];

const IPC_BNS_MAP = {
  "302": { ipc: "302", bns: "103", title: "Punishment for Murder" },
  "307": { ipc: "307", bns: "109", title: "Attempt to Murder" },
  "376": { ipc: "376", bns: "64", title: "Punishment for Rape" },
  "420": { ipc: "420", bns: "318", title: "Cheating and Dishonestly Inducing Delivery of Property" },
  "124A": { ipc: "124A", bns: "152", title: "Sedition (Acts endangering sovereignty/unity)" },
  "300": { ipc: "300", bns: "101", title: "Murder" },
  "120B": { ipc: "120B", bns: "61", title: "Criminal Conspiracy" },
  "143": { ipc: "143", bns: "189", title: "Unlawful Assembly" }
};

const SUGGESTIONS = [
  { q: "What is Section 302 of BNS 2023?", label: "BNS Section 302" },
  { q: "Grounds for divorce under Hindu Marriage Act?", label: "Divorce Laws" },
  { q: "Explain the Basic Structure doctrine", label: "Basic Structure" },
  { q: "Bail provisions for non-bailable offences", label: "Bail Laws" },
];

const APPROACHES = {
  langchain: {
    id: "langchain",
    label: "LangChain",
    shortLabel: "LC",
    description: "LCEL Chains + ChatOllama",
    icon: Layers,
    color: "blue",
    gradient: "from-blue-500 to-cyan-500",
    bgClass: "bg-blue-500/10",
    textClass: "text-blue-400",
    borderClass: "border-blue-500/30",
    badgeBg: "bg-blue-500/15",
    badgeText: "text-blue-300",
  },
  core_python: {
    id: "core_python",
    label: "Core Python",
    shortLabel: "PY",
    description: "Raw Ollama REST API",
    icon: Code,
    color: "emerald",
    gradient: "from-emerald-500 to-green-500",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-400",
    borderClass: "border-emerald-500/30",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-300",
  },
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [showSources, setShowSources] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLightMode, setIsLightMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMapperOpen, setIsMapperOpen] = useState(false);
  const [mapperQuery, setMapperQuery] = useState("");

  // ── Approach State ──
  const [activeApproach, setActiveApproach] = useState("langchain");
  const [approachAnimating, setApproachAnimating] = useState(false);
  const [responseApproach, setResponseApproach] = useState(null);

  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const inputRef = useRef(null);

  // Load Theme
  useEffect(() => {
    const savedMode = localStorage.getItem("legal_mind_theme");
    if (savedMode === "light") {
      setIsLightMode(true);
      document.body.classList.add("light-mode");
    }
  }, []);

  // Load approach from backend on mount
  useEffect(() => {
    fetch(`${API_URL}/config/approach`)
      .then(res => res.json())
      .then(data => {
        if (data.approach) setActiveApproach(data.approach);
      })
      .catch(() => { });
  }, []);

  // Load History from backend when user logs in
  useEffect(() => {
    if (!currentUser) {
      setChatHistory([]);
      return;
    }
    fetch(`${API_URL}/history/load/${currentUser.id}`)
      .then(res => res.json())
      .then(data => setChatHistory(data))
      .catch(console.error);
  }, [currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const toggleTheme = () => {
    const newMode = !isLightMode;
    setIsLightMode(newMode);
    if (newMode) {
      document.body.classList.add("light-mode");
      localStorage.setItem("legal_mind_theme", "light");
    } else {
      document.body.classList.remove("light-mode");
      localStorage.setItem("legal_mind_theme", "dark");
    }
  };

  const switchApproach = async (approach) => {
    if (approach === activeApproach || isLoading) return;
    setApproachAnimating(true);
    try {
      const res = await fetch(`${API_URL}/config/approach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approach }),
      });
      if (res.ok) {
        setActiveApproach(approach);
      }
    } catch (e) {
      console.error("Failed to switch approach:", e);
    }
    setTimeout(() => setApproachAnimating(false), 600);
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    if (inputRef.current) {
      inputRef.current.style.height = "56px";
      const scrollHeight = inputRef.current.scrollHeight;
      inputRef.current.style.height = scrollHeight > 56 ? `${Math.min(scrollHeight, 200)}px` : "56px";
    }
  };

  const handleSend = async (messageText = input) => {
    if (!messageText.trim() || isLoading) return;

    const userMsg = { role: "user", content: messageText, id: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "56px";
    setIsLoading(true);
    setSources([]);
    setResponseApproach(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setMessages(prev => [...prev, { role: "assistant", content: "", id: Date.now() + 1, approach: activeApproach }]);

    try {
      const url = new URL(`${API_URL}/stream`);
      url.searchParams.append("query", userMsg.content);
      if (activeCategory !== "all") url.searchParams.append("category", activeCategory);
      url.searchParams.append("approach", activeApproach);

      const response = await fetch(url, { signal: controller.signal });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "token") {
              assistantResponse += data.content;
              setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1].content = assistantResponse;
                return [...newMsgs];
              });
            } else if (data.type === "sources") {
              setSources(data.data);
            } else if (data.type === "approach") {
              setResponseApproach(data.data);
              setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1].approach = data.data;
                return [...newMsgs];
              });
            } else if (data.type === "done") {
              setIsLoading(false);
              const chatId = Date.now().toString();
              const fullMessages = [...newMessages, { role: "assistant", content: assistantResponse, approach: activeApproach }];
              const title = messageText.slice(0, 30) + "...";

              if (currentUser) {
                fetch(`${API_URL}/history/save`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: chatId,
                    user_id: currentUser.id,
                    title: title,
                    messages: fullMessages
                  })
                }).catch(console.error);

                setChatHistory(prev => [{ id: chatId, title: title, updated_at: new Date().toISOString(), messages: fullMessages }, ...prev.slice(0, 19)]);
              }
            }
          } catch (e) { }
        }
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].content = "⚠️ *Service interrupted.*";
          return [...newMsgs];
        });
      }
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSources([]);
    setSelectedSource(null);
    setResponseApproach(null);
    inputRef.current?.focus();
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window)) return alert("Speech recognition not supported");
    const recognition = new window.webkitSpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      setInput(event.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const exportChat = () => {
    const content = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LegalMind_Brief_${Date.now()}.txt`;
    a.click();
  };

  const mapResult = mapperQuery ? IPC_BNS_MAP[Object.keys(IPC_BNS_MAP).find(k => k === mapperQuery || IPC_BNS_MAP[k].bns === mapperQuery)] : null;
  const isWelcome = messages.length === 0;
  const currentApproachConfig = APPROACHES[activeApproach];

  if (!currentUser) {
    return <LoginSignup onLogin={setCurrentUser} isLightMode={isLightMode} />;
  }

  return (
    <div className={`flex flex-col h-screen transition-colors duration-1000 ${isLightMode ? 'bg-[#FDFDFD]' : 'mesh-bg'}`}>

      {/* ─── PREMIUM SAAS HEADER ─── */}
      <header className={`h-16 flex items-center justify-between px-8 border-b z-50 transition-all shadow-sm ${isLightMode ? 'bg-white/80 backdrop-blur-md border-zinc-200' : 'glass-panel border-b-white/5 shadow-none'}`}>
        <div className="flex items-center gap-4 w-[250px]">
          <div className={`w-8 h-8 flex items-center justify-center rounded-lg shadow-sm ${isLightMode ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-blue-500/20' : 'bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-400/30 text-blue-400'}`}>
            <Scale size={18} strokeWidth={2.5} className={!isLightMode ? "drop-shadow-md" : ""} />
          </div>
          <div className="flex flex-col hidden sm:flex justify-center h-full pt-1">
            <span className={`font-semibold text-lg tracking-tight leading-none ${isLightMode ? 'text-zinc-900' : 'text-zinc-100'}`}>
              LegalMind
            </span>
          </div>
        </div>

        {/* Pill-shaped SaaS Categories */}
        <nav className="flex-1 flex items-center justify-center gap-3 overflow-x-auto no-scrollbar mx-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all rounded-full border ${activeCategory === cat.id
                ? (isLightMode ? 'bg-zinc-900 text-white border-transparent' : 'bg-white text-black border-transparent shadow-md shadow-white/10')
                : (isLightMode ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 border-transparent' : 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent')
                }`}
            >
              {cat.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-5 w-[250px] justify-end">
          <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${isLightMode ? 'text-zinc-500 hover:bg-zinc-100' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
            {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <button onClick={exportChat} className={`p-2 rounded-full transition-colors ${isLightMode ? 'text-zinc-500 hover:bg-zinc-100' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`} title="Export Brief">
            <Download size={18} />
          </button>

          <div className={`h-5 w-px ${isLightMode ? 'bg-zinc-200' : 'bg-zinc-800'}`}></div>

          <button
            onClick={() => setCurrentUser(null)}
            className={`flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full text-sm font-medium transition-colors ${isLightMode ? 'text-zinc-600 hover:bg-red-50 hover:text-red-600' : 'text-zinc-400 hover:bg-red-500/10 hover:text-red-400'}`}
            title="Sign Out"
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isLightMode ? 'bg-zinc-200' : 'bg-zinc-800'}`}>
              <User size={12} />
            </div>
            <span className="hidden lg:block text-xs uppercase tracking-wider">Log Out</span>
          </button>
        </div>
      </header>

      {/* ─── APPROACH TOGGLE BAR ─── */}
      <div className={`h-12 flex items-center justify-center border-b z-40 transition-all ${isLightMode ? 'bg-zinc-50/80 backdrop-blur-sm border-zinc-200' : 'bg-black/30 backdrop-blur-md border-white/5'}`}>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-bold uppercase tracking-[0.15em] mr-2 ${isLightMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
            RAG Engine
          </span>

          <div className={`flex items-center rounded-full p-0.5 transition-all duration-500 ${isLightMode ? 'bg-zinc-200/80' : 'bg-zinc-800/80'} ${approachAnimating ? 'scale-[1.02]' : 'scale-100'}`}>
            {Object.values(APPROACHES).map((approach) => {
              const isActive = activeApproach === approach.id;
              const Icon = approach.icon;
              return (
                <button
                  key={approach.id}
                  onClick={() => switchApproach(approach.id)}
                  disabled={isLoading}
                  className={`relative flex items-center gap-2 px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-500 ${isActive
                      ? isLightMode
                        ? `bg-white text-zinc-900 shadow-md shadow-black/5`
                        : `bg-gradient-to-r ${approach.gradient} text-white shadow-lg shadow-${approach.color}-500/25`
                      : isLightMode
                        ? 'text-zinc-500 hover:text-zinc-700'
                        : 'text-zinc-500 hover:text-zinc-300'
                    } ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  <Icon size={14} strokeWidth={2.5} />
                  <span className="hidden sm:inline">{approach.label}</span>
                  <span className="sm:hidden">{approach.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Approach Info Tooltip */}
          <div className={`hidden md:flex items-center gap-2 ml-3 px-3 py-1 rounded-lg border transition-all duration-500 ${isLightMode
              ? 'bg-white/50 border-zinc-200'
              : `${currentApproachConfig.bgClass} ${currentApproachConfig.borderClass}`
            }`}>
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse bg-gradient-to-r ${currentApproachConfig.gradient}`} />
            <span className={`text-[11px] font-medium ${isLightMode ? 'text-zinc-600' : currentApproachConfig.textClass}`}>
              {currentApproachConfig.description}
            </span>
          </div>
        </div>
      </div>

      {/* ─── IPC-BNS CROSS MAPPER ─── */}
      <AnimatePresence>
        {isMapperOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 120 }} exit={{ height: 0 }} className={`border-b border-zinc-900 flex items-center justify-center overflow-hidden ${isLightMode ? 'bg-zinc-100' : 'bg-zinc-950'}`}>
            <div className="w-full max-w-2xl px-8 flex gap-8 items-center justify-center">
              <div className="flex-1 flex flex-col">
                <span className="text-[9px] font-bold text-zinc-600 uppercase mb-2">Search IPC or BNS Section #</span>
                <input
                  value={mapperQuery} onChange={e => setMapperQuery(e.target.value.toUpperCase())}
                  placeholder="e.g. 302"
                  className={`border border-zinc-800 rounded-none px-4 py-2 text-sm focus:ring-1 focus:ring-inherit outline-none ${isLightMode ? 'bg-white text-black border-zinc-300' : 'bg-zinc-900 text-white'}`}
                />
              </div>
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase">IPC</span>
                  <div className={`text-xl font-black ${isLightMode ? 'text-black' : 'text-white'}`}>{mapResult ? mapResult.ipc : "—"}</div>
                </div>
                <ArrowRightLeft className="text-zinc-500" size={16} />
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase">BNS</span>
                  <div className="text-xl font-black text-indigo-500">{mapResult ? mapResult.bns : "—"}</div>
                </div>
              </div>
              {mapResult && (
                <div className={`flex-1 text-[11px] font-medium border-l border-zinc-800 pl-8 leading-tight ${isLightMode ? 'text-zinc-600 border-zinc-300' : 'text-zinc-400'}`}>
                  {mapResult.title}
                </div>
              )}
            </div>
          </motion.div>
        )
        }
      </AnimatePresence>

      {/* ─── WORKSTATION LAYOUT ─── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Bar: Navigation & History */}
        <aside className={`w-[68px] hover:w-[260px] group border-r transition-all duration-300 z-40 flex flex-col items-center py-6 overflow-hidden sticky top-0 h-full ${isLightMode ? 'bg-white/50 backdrop-blur-sm border-zinc-200' : 'bg-black/20 backdrop-blur-md border-white/5'}`}>
          {/* Top Nav Icons */}
          <div className="flex flex-col gap-2 w-full px-3 transition-all">
            <button onClick={clearChat} className={`flex items-center gap-4 py-3 px-3 rounded-lg transition-colors w-full group/btn overflow-hidden ${isLightMode ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
              <Home size={20} className="shrink-0 transition-colors" />
              <span className="opacity-0 group-hover:opacity-100 font-medium text-sm whitespace-nowrap transition-opacity text-inherit">Home</span>
            </button>
            <button className={`flex items-center gap-4 py-3 px-3 rounded-lg transition-colors w-full group/btn overflow-hidden ${isLightMode ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
              <HistoryIcon size={20} className="shrink-0 transition-colors" />
              <span className="opacity-0 group-hover:opacity-100 font-medium text-sm whitespace-nowrap transition-opacity text-inherit">Activity Log</span>
            </button>
            <button className={`flex items-center gap-4 py-3 px-3 rounded-lg transition-colors w-full group/btn overflow-hidden ${isLightMode ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
              <Bookmark size={20} className="shrink-0 transition-colors" />
              <span className="opacity-0 group-hover:opacity-100 font-medium text-sm whitespace-nowrap transition-opacity text-inherit">Saved Documents</span>
            </button>
            <button className={`flex items-center gap-4 py-3 px-3 rounded-lg transition-colors w-full group/btn overflow-hidden ${isLightMode ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
              <Settings size={20} className="shrink-0 transition-colors" />
              <span className="opacity-0 group-hover:opacity-100 font-medium text-sm whitespace-nowrap transition-opacity text-inherit">Settings</span>
            </button>
          </div>

          <div className={`w-8 h-px my-6 group-hover:w-[calc(100%-24px)] transition-all ${isLightMode ? 'bg-zinc-200' : 'bg-white/10'}`}></div>

          <div className="flex-1 w-full px-4 space-y-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-y-auto no-scrollbar">
            <h3 className={`text-xs font-semibold px-2 mb-3 mt-2 ${isLightMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Recent Queries</h3>
            {chatHistory.map((h, i) => (
              <button key={i} onClick={() => setMessages(h.messages)} className={`w-full text-left text-sm py-2 px-3 rounded-md truncate transition-colors ${isLightMode ? 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
                {h.title}
              </button>
            ))}
            {chatHistory.length === 0 && <div className="text-sm px-2 text-zinc-500 italic mt-2">No recent history</div>}
          </div>
        </aside >

        {/* Main Viewport */}
        <div className="flex-1 flex flex-col relative w-full overflow-hidden" >

          <main className={`flex-1 overflow-y-auto no-scrollbar flex flex-col items-center ${selectedSource ? 'pr-[400px]' : ''} transition-all duration-500 w-full`}>

            {isWelcome ? (
              /* Soft SaaS Welcome Screen */
              <div className="w-full flex-1 flex flex-col items-center justify-center p-6 relative">
                <div className="z-10 flex flex-col items-center justify-center w-full max-w-2xl py-12 mb-24 text-center">
                  <div className={`w-16 h-16 flex items-center justify-center rounded-3xl shadow-sm mb-6 ${isLightMode ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-blue-500/20' : 'bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-400/30 text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.15)]'}`}>
                    <Scale size={32} strokeWidth={1.5} className={!isLightMode ? "drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]" : ""} />
                  </div>
                  <h1 className={`text-3xl font-bold tracking-tight mb-3 ${isLightMode ? 'text-zinc-900' : 'text-white'}`}>
                    Welcome to LegalMind
                  </h1>
                  <p className={`text-lg max-w-xl mx-auto mb-8 ${isLightMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Your intelligent legal assistant. Search through vast statutes, case laws, and legal precedents instantly.
                  </p>

                  {/* Approach Cards on Welcome Screen */}
                  <div className="flex gap-4 mt-4 w-full max-w-lg">
                    {Object.values(APPROACHES).map((approach) => {
                      const isActive = activeApproach === approach.id;
                      const Icon = approach.icon;
                      return (
                        <button
                          key={approach.id}
                          onClick={() => switchApproach(approach.id)}
                          className={`flex-1 flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-500 group/card ${isActive
                              ? isLightMode
                                ? `bg-white border-zinc-900 shadow-lg shadow-black/5`
                                : `bg-gradient-to-b from-${approach.color}-500/10 to-transparent ${approach.borderClass} shadow-lg shadow-${approach.color}-500/10`
                              : isLightMode
                                ? 'bg-white/50 border-zinc-200 hover:border-zinc-400 hover:shadow-md'
                                : 'bg-zinc-900/30 border-white/5 hover:border-white/20 hover:bg-zinc-800/30'
                            }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isActive
                              ? `bg-gradient-to-br ${approach.gradient} text-white shadow-md`
                              : isLightMode
                                ? 'bg-zinc-100 text-zinc-500 group-hover/card:text-zinc-700'
                                : 'bg-zinc-800 text-zinc-500 group-hover/card:text-zinc-300'
                            }`}>
                            <Icon size={20} strokeWidth={2} />
                          </div>
                          <div className="text-center">
                            <div className={`text-sm font-semibold mb-0.5 ${isActive
                                ? isLightMode ? 'text-zinc-900' : 'text-white'
                                : isLightMode ? 'text-zinc-700' : 'text-zinc-400'
                              }`}>
                              {approach.label}
                            </div>
                            <div className={`text-[11px] ${isLightMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                              {approach.description}
                            </div>
                          </div>
                          {isActive && (
                            <motion.div
                              layoutId="activeApproachDot"
                              className={`w-2 h-2 rounded-full bg-gradient-to-r ${approach.gradient}`}
                              transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="w-full max-w-4xl px-4 py-8 relative z-10 w-full">
                  <div className="space-y-6 pb-40">
                    {messages.map((msg, idx) => (
                      <div key={idx} className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role === "assistant" && (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mr-4 mt-1 ${isLightMode ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/20 text-blue-400'}`}>
                            <Bot size={16} />
                          </div>
                        )}

                        <div className={msg.role === "user" ? "user-bubble" : "assistant-area"}>
                          {msg.role === "user" ? (
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                          ) : (
                            <>
                              {/* Approach badge on assistant messages */}
                              {msg.approach && (
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-3 ${msg.approach === "langchain"
                                    ? isLightMode ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    : isLightMode ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  }`}>
                                  {msg.approach === "langchain" ? <Layers size={10} /> : <Code size={10} />}
                                  {msg.approach === "langchain" ? "LangChain" : "Core Python"}
                                </div>
                              )}
                              <div className="legal-prose">
                                <ReactMarkdown>{msg.content || (isLoading ? "Analyzing legal data..." : "")}</ReactMarkdown>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex w-full justify-start">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mr-4 mt-1 ${isLightMode ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/20 text-blue-400'}`}>
                          <Bot size={16} className="animate-pulse" />
                        </div>
                        <div className="assistant-area">
                          <div className="space-y-3 pt-1 opacity-70 w-full max-w-md">
                            <div className="shimmer h-2 w-full rounded-md" />
                            <div className="shimmer h-2 w-3/4 rounded-md" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </>
            )}
          </main>

          {/* Source Panel (Right Side Split Screen) */}
          <AnimatePresence>
            {selectedSource && (
              <motion.div initial={{ x: 420, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 420, opacity: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className={`fixed right-0 top-16 bottom-0 w-[420px] z-50 p-6 flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.1)] border-l ${isLightMode ? 'bg-white/90 backdrop-blur-xl border-zinc-200' : 'glass-panel rounded-none border-y-0 border-r-0'}`}>
                <div className="flex items-center justify-between mb-6">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${isLightMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Reference Material</span>
                  <button onClick={() => setSelectedSource(null)} className={`p-1.5 rounded-lg transition-colors ${isLightMode ? 'text-zinc-400 hover:bg-zinc-100' : 'text-zinc-500 hover:bg-white/10'}`}><X size={18} strokeWidth={2.5} /></button>
                </div>

                <h2 className={`text-[15px] font-semibold mb-4 leading-tight ${isLightMode ? 'text-zinc-900' : 'text-white'}`}>{selectedSource.title}</h2>

                <div className="flex gap-2 mb-6">
                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-md ${isLightMode ? 'bg-zinc-100 text-zinc-600' : 'bg-white/5 text-zinc-300'}`}>{selectedSource.type}</span>
                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-md ${isLightMode ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'}`}>Excerpt</span>
                </div>

                <div className={`flex-1 overflow-y-auto chat-scroll pr-3 text-[14px] leading-relaxed whitespace-pre-wrap font-sans ${isLightMode ? 'text-zinc-700' : 'text-zinc-300'}`}>
                  {selectedSource.text}
                </div>

                <div className={`mt-6 pt-4 border-t ${isLightMode ? 'border-zinc-100' : 'border-white/10'}`}>
                  <button onClick={() => copyText(selectedSource.text)} className={`w-full flex items-center justify-center gap-2 text-sm font-medium py-3 rounded-xl transition-all shadow-sm ${isLightMode ? 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
                    <Copy size={16} /> {copied ? 'Copied to clipboard' : 'Copy excerpt'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Docked Command Bar Area */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 pointer-events-none z-40 flex flex-col items-center">

            {/* Sources Bar */}
            {sources.length > 0 && !isWelcome && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex flex-wrap justify-center gap-2 max-w-3xl pointer-events-auto"
              >
                {sources.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSource(s)}
                    className={`text-[12px] font-medium px-3 py-1.5 rounded-lg transition-all border flex items-center gap-1.5 ${isLightMode ? 'bg-white border-zinc-200 text-zinc-600 hover:border-blue-400 hover:text-blue-600 shadow-sm' : 'bg-zinc-900/80 backdrop-blur-sm border-white/10 text-zinc-300 hover:border-blue-500/50 hover:text-blue-400'}`}
                  >
                    <FileText size={11} />
                    {s.title?.slice(0, 25)}...
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${isLightMode ? 'bg-zinc-100 text-zinc-500' : 'bg-white/5 text-zinc-500'}`}>
                      {(s.score * 100).toFixed(0)}%
                    </span>
                  </button>
                ))}
              </motion.div>
            )}

            {/* Soft SaaS Quick Prompts */}
            {isWelcome && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-6 flex flex-wrap justify-center gap-3 max-w-3xl pointer-events-auto">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => handleSend(s.q)} className={`text-[13px] font-medium px-4 py-2 rounded-full transition-all shadow-sm border ${isLightMode ? 'bg-white border-zinc-200 text-zinc-600 hover:border-blue-400 hover:text-blue-600' : 'bg-zinc-900 border-white/10 text-zinc-300 hover:border-blue-500/50 hover:text-blue-400'}`}>
                    {s.label}
                  </button>
                ))}
              </motion.div>
            )}

            {/* Floating Soft Command Input */}
            <div className={`w-full max-w-3xl flex items-end transition-all rounded-3xl border shadow-xl ${isLightMode ? 'bg-white/90 backdrop-blur-md border-zinc-200 focus-within:border-blue-400 focus-within:shadow-[0_8px_30px_rgba(59,130,246,0.1)]' : 'bg-black/50 backdrop-blur-xl border-white/10 focus-within:border-blue-500/50 focus-within:shadow-[0_8px_30px_rgba(59,130,246,0.15)]'} ${isListening ? 'border-red-500/50' : ''} pointer-events-auto overflow-hidden`}>

              <button
                onClick={startVoice}
                className={`p-4 h-[60px] flex items-center justify-center shrink-0 transition-colors ${isListening ? 'text-red-500 animate-pulse' : (isLightMode ? 'text-zinc-400 hover:text-blue-600' : 'text-zinc-500 hover:text-blue-400')}`}
              >
                <Mic size={20} />
              </button>

              <textarea
                ref={inputRef} value={input}
                onChange={handleInput}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading}
                placeholder={isListening ? "Listening..." : "Ask a legal question..."}
                className={`flex-1 bg-transparent border-none text-[15px] focus:ring-0 outline-none resize-none py-[18px] no-scrollbar ${isLightMode ? 'text-zinc-900 placeholder:text-zinc-400' : 'text-white placeholder:text-zinc-500'}`}
                rows={1}
                style={{ minHeight: "60px" }}
                autoFocus
              />

              <div className="p-2 shrink-0 h-[60px] flex items-center justify-center gap-1">
                {/* Approach Badge inside input */}
                <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg mr-1 transition-all duration-300 ${activeApproach === "langchain"
                    ? isLightMode ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'
                    : isLightMode ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                  {activeApproach === "langchain" ? <Layers size={12} /> : <Code size={12} />}
                  <span className="text-[10px] font-bold uppercase">{activeApproach === "langchain" ? "LC" : "PY"}</span>
                </div>

                {isLoading ? (
                  <button onClick={() => abortControllerRef.current?.abort()} className={`p-2 rounded-xl transition-colors ${isLightMode ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}><StopCircle size={18} strokeWidth={2} /></button>
                ) : (
                  <button onClick={() => handleSend()} className={`p-2.5 rounded-xl transition-all shadow-sm ${isLightMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-500'} ${input.trim() ? 'opacity-100 scale-100' : 'opacity-50 scale-95'}`}><ArrowUp size={18} strokeWidth={2.5} /></button>
                )}
              </div>
            </div>

            <div className="font-mono text-[9px] text-zinc-600 tracking-[0.1em] mt-3 flex items-center justify-between w-full max-w-4xl pointer-events-auto px-1 opacity-70">
              <span className="flex items-center gap-2 uppercase"><Shield size={10} /> [SEC: ACTIVE]</span>
              <div className="flex gap-8">
                <span className="flex items-center gap-2 cursor-pointer hover:text-zinc-400 transition-colors uppercase"><FileUp size={10} /> INGEST</span>
                <span className="flex items-center gap-2 cursor-pointer hover:text-zinc-400 transition-colors uppercase"><Share2 size={10} /> LOG.EXPORT</span>
              </div>
            </div>
          </div>

        </div >
      </div >
    </div >
  );
}

export default App;
