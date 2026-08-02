import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, FolderClosed, Plus, Clock, Scale,
  Upload, CheckCircle2, Loader2, File, Trash2, X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import toast from 'react-hot-toast';

const RECENT_QUERIES = [
  'BNS Section 103 – Murder', 'Kesavananda Bharati judgment',
  'Bail in non-bailable offences', 'Article 21 – Right to Life',
];

export default function MatterSidebar() {
  const { matters, activeMatter, setActiveMatter, addMatter, removeMatter } = useApp();
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    multiple: true,
    onDrop: (files) => {
      const newFiles = files.map(f => ({ name: f.name, status: 'processing', size: f.size }));
      setUploadedFiles(p => [...p, ...newFiles]);
      toast.loading(`Vectorizing ${files.length} file(s)...`, { duration: 2500 });
      setTimeout(() => {
        setUploadedFiles(p => p.map(f =>
          newFiles.find(nf => nf.name === f.name) ? { ...f, status: 'done' } : f
        ));
        toast.success('✅ Files vectorized locally!');
      }, 2500);
    },
  });

  return (
    <div className="h-full flex flex-col overflow-hidden bg-zinc-900/40 dark:bg-zinc-900/40 light:bg-slate-100/80">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-white/5 dark:border-white/5 light:border-zinc-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Matters</span>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={addMatter}
            className="w-6 h-6 rounded-md bg-zinc-800 hover:bg-amber-900/40 flex items-center justify-center text-zinc-500 hover:text-amber-400 transition-all" title="New Matter">
            <Plus className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        <div className="space-y-1">
          {matters.map(m => (
            <div key={m.id} className="group flex items-center gap-2">
              <motion.button layout onClick={() => setActiveMatter(m.id)}
                className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeMatter === m.id
                    ? 'bg-gradient-to-r from-amber-900/30 to-orange-900/20 text-amber-300 border border-amber-500/20'
                    : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
                }`}>
                {activeMatter === m.id ? <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" /> : <FolderClosed className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />}
                <span className="truncate">{m.name}</span>
              </motion.button>
              {m.id !== 'default' && (
                <button onClick={() => removeMatter(m.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-zinc-700 hover:text-red-400 hover:bg-red-900/20 transition-all">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent queries */}
      <div className="px-4 py-3 border-b border-white/5 dark:border-white/5 light:border-zinc-200 flex-shrink-0">
        <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest block mb-2">Recent</span>
        {RECENT_QUERIES.map((q, i) => (
          <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/40 cursor-pointer transition-all">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{q}</span>
          </div>
        ))}
      </div>

      {/* Document Vault */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Document Vault</span>
          <span className="text-[10px] text-zinc-700">🔒 Local only</span>
        </div>
        <p className="text-[11px] text-zinc-700 leading-relaxed mb-3">
          Drop PDF case files. Vectorized <strong className="text-zinc-600">on-device</strong>, never uploaded.
        </p>

        {/* Dropzone */}
        <div {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            isDragActive ? 'border-amber-500/60 bg-amber-900/10 scale-[1.02]' : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/20'
          }`}>
          <input {...getInputProps()} />
          <Upload className={`w-5 h-5 mx-auto mb-2 ${isDragActive ? 'text-amber-400' : 'text-zinc-700'}`} />
          {isDragActive
            ? <p className="text-xs text-amber-400 font-medium">Drop to vectorize locally</p>
            : <><p className="text-xs text-zinc-600 font-medium">Drag & Drop</p><p className="text-[10px] text-zinc-700 mt-0.5">PDF or TXT files</p></>
          }
        </div>

        {/* Uploaded files */}
        <AnimatePresence>
          {uploadedFiles.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-zinc-900 border border-white/5">
              <File className="w-3 h-3 text-zinc-600 flex-shrink-0" />
              <span className="text-[11px] text-zinc-500 truncate flex-1">{f.name}</span>
              {f.status === 'processing'
                ? <div className="flex items-center gap-1 text-amber-400"><Loader2 className="w-3 h-3 animate-spin" /></div>
                : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              }
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer brand */}
      <div className="px-4 py-3 border-t border-white/5 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-700">
          <Scale className="w-3 h-3 text-amber-900" />
          Samvidhan AI · सम्विधान
        </div>
      </div>
    </div>
  );
}
