import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const IPC_BNS_DATA = {
  '302': { ipc: { num: '302', title: 'Punishment for Murder', text: 'Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine.' }, bns: { num: '103', title: 'Punishment for Murder', text: 'Whoever commits murder shall be punished with death or imprisonment for life, and shall also be liable to fine.' }, note: 'Section renumbered from 302 to 103. Substantive content is largely preserved.' },
  '307': { ipc: { num: '307', title: 'Attempt to Murder', text: 'Whoever does any act with such intention or knowledge, and under such circumstances that, if he by that act caused death, he would be guilty of murder, shall be punished with imprisonment...' }, bns: { num: '109', title: 'Attempt to Murder', text: 'Whoever does any act with such intention or knowledge that if the act caused death, the person would be guilty of murder, shall be punished...' }, note: 'Section renumbered from 307 to 109.' },
  '376': { ipc: { num: '376', title: 'Punishment for Rape', text: 'Whoever commits rape shall be punished with rigorous imprisonment of either description for a term which shall not be less than ten years, but which may extend to imprisonment for life.' }, bns: { num: '64', title: 'Punishment for Rape', text: 'Whoever commits rape shall be punished with rigorous imprisonment of either description for a term which shall not be less than ten years, but which may extend to imprisonment for life.' }, note: 'Section renumbered from 376 to 64. Key protections retained.' },
  '420': { ipc: { num: '420', title: 'Cheating', text: 'Whoever cheats and thereby dishonestly induces the person deceived to deliver any property to any person, shall be punished with imprisonment of either description for a term which may extend to seven years.' }, bns: { num: '318', title: 'Cheating', text: 'Whoever cheats and thereby dishonestly induces the person deceived to deliver any property to any person, shall be punished with imprisonment...' }, note: 'Renumbered from 420 to 318. Terms of imprisonment largely unchanged.' },
  '124A': { ipc: { num: '124A', title: 'Sedition', text: 'Whoever by words, either spoken or written, or by signs, or by visible representation, or otherwise, excites or attempts to excite disaffection towards the Government established by law in India...' }, bns: { num: '152', title: 'Acts endangering sovereignty, unity and integrity of India', text: 'Whoever, purposely or knowingly, by words spoken or written or by signs or by visible representation or by electronic communication or by use of financial means or otherwise, excites or attempts to excite, secession or armed rebellion...' }, note: 'Major change: "Sedition" is replaced by a broader "Acts endangering sovereignty/unity" provision.' },
};

export default function IpcBnsComparator() {
  const { ipcBnsOpen, setIpcBnsOpen } = useApp();
  const [search, setSearch] = useState('302');
  const [sliderVal, setSliderVal] = useState(50);
  const data = IPC_BNS_DATA[search.toUpperCase()] ?? IPC_BNS_DATA[search] ?? null;

  if (!ipcBnsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl h-[88vh] bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 bg-zinc-900/60 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-zinc-100">IPC → BNS Time-Slider Comparator</h2>
            <p className="text-xs text-zinc-600 mt-0.5">Drag the slider to see how Indian criminal law changed on 1 July 2024</p>
          </div>
          <button onClick={() => setIpcBnsOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-all"><X className="w-5 h-5" /></button>
        </div>

        {/* Search + slider */}
        <div className="px-6 py-4 border-b border-white/5 flex-shrink-0 space-y-3">
          <div className="flex gap-3">
            {Object.keys(IPC_BNS_DATA).map(k => (
              <button key={k} onClick={() => setSearch(k)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${search === k ? 'bg-amber-900/40 text-amber-300 border border-amber-500/30' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300 border border-white/5'}`}>
                {k}
              </button>
            ))}
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-mono text-zinc-600 mb-1.5">
              <span>◀ Pre-July 2024 — IPC (Indian Penal Code, 1860)</span>
              <span>Post-July 2024 — BNS 2023 ▶</span>
            </div>
            <input type="range" min="0" max="100" value={sliderVal}
              onChange={e => setSliderVal(e.target.value)}
              className="w-full h-2 rounded-full accent-amber-500 cursor-pointer" />
          </div>
        </div>

        {/* Diff view */}
        <div className="flex-1 flex gap-0 overflow-hidden">
          {/* IPC panel */}
          <div className={`flex-1 border-r border-white/5 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 transition-opacity duration-500 ${sliderVal > 60 ? 'opacity-30' : 'opacity-100'}`}>
            <div className="mb-4"><span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded-full border border-red-400/20">REPEALED — 1 July 2024</span></div>
            {data ? (
              <>
                <h3 className="text-xl font-serif font-bold text-zinc-200 mb-1">IPC § {data.ipc.num}</h3>
                <p className="text-sm font-semibold text-zinc-400 mb-4">{data.ipc.title}</p>
                <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/15">
                  <p className="text-sm text-red-200/80 font-serif leading-loose line-through decoration-red-500/40">{data.ipc.text}</p>
                </div>
              </>
            ) : <p className="text-zinc-600 text-sm italic">Select a section above to see the comparison.</p>}
          </div>

          {/* BNS panel */}
          <div className={`flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 transition-opacity duration-500 ${sliderVal < 40 ? 'opacity-30' : 'opacity-100'}`}>
            <div className="mb-4"><span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">ENACTED — BNS 2023</span></div>
            {data ? (
              <>
                <h3 className="text-xl font-serif font-bold text-zinc-200 mb-1">BNS § {data.bns.num}</h3>
                <p className="text-sm font-semibold text-zinc-400 mb-4">{data.bns.title}</p>
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/15 mb-4">
                  <p className="text-sm text-emerald-200/90 font-serif leading-loose">{data.bns.text}</p>
                </div>
                {data.note && (
                  <div className="p-3 rounded-lg bg-amber-900/10 border border-amber-500/20 text-xs text-amber-300">
                    📝 {data.note}
                  </div>
                )}
              </>
            ) : <p className="text-zinc-600 text-sm italic">Select a section above to see the comparison.</p>}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
