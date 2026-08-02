import React, { useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';

const INITIAL_NODES = [
  { id: '1', position: { x: 300, y: 30 }, data: { label: 'Kesavananda Bharati\n(1973) — Basic Structure', year: '1973' }, style: { background: 'linear-gradient(135deg,#064e3b,#065f46)', border: '1px solid #10b981', color: '#6ee7b7', borderRadius: '12px', padding: '12px 16px', fontSize: '11px', fontWeight: '700', textAlign: 'center', width: 160 } },
  { id: '2', position: { x: 70, y: 170 }, data: { label: 'Minerva Mills\n(1980)', year: '1980' }, style: { background: '#18181b', border: '1px solid #3f3f46', color: '#a1a1aa', borderRadius: '10px', padding: '10px 14px', fontSize: '10px', textAlign: 'center', width: 130 } },
  { id: '3', position: { x: 300, y: 170 }, data: { label: 'Indira Nehru Gandhi\n(1975)', year: '1975' }, style: { background: '#18181b', border: '1px solid #3f3f46', color: '#a1a1aa', borderRadius: '10px', padding: '10px 14px', fontSize: '10px', textAlign: 'center', width: 130 } },
  { id: '4', position: { x: 530, y: 170 }, data: { label: 'I.R. Coelho\n(2007)', year: '2007' }, style: { background: '#18181b', border: '1px solid #3f3f46', color: '#a1a1aa', borderRadius: '10px', padding: '10px 14px', fontSize: '10px', textAlign: 'center', width: 130 } },
  { id: '5', position: { x: 175, y: 310 }, data: { label: 'Waman Rao\n(1981)', year: '1981' }, style: { background: '#0c0a09', border: '1px solid #292524', color: '#78716c', borderRadius: '10px', padding: '8px 12px', fontSize: '10px', textAlign: 'center', width: 120 } },
  { id: '6', position: { x: 430, y: 310 }, data: { label: 'Bommai\n(1994)', year: '1994' }, style: { background: '#0c0a09', border: '1px solid #292524', color: '#78716c', borderRadius: '10px', padding: '8px 12px', fontSize: '10px', textAlign: 'center', width: 120 } },
];

const INITIAL_EDGES = [
  { id: 'e1-2', source: '1', target: '2', label: 'Reaffirmed by', animated: true, style: { stroke: '#10b981' }, labelStyle: { fill: '#6ee7b7', fontSize: 9, fontWeight: '600' }, labelBgStyle: { fill: '#064e3b' } },
  { id: 'e1-3', source: '1', target: '3', label: 'Applied', style: { stroke: '#f59e0b' }, labelStyle: { fill: '#fcd34d', fontSize: 9 }, labelBgStyle: { fill: '#78350f' } },
  { id: 'e1-4', source: '1', target: '4', label: 'Extended', animated: true, style: { stroke: '#10b981' }, labelStyle: { fill: '#6ee7b7', fontSize: 9 }, labelBgStyle: { fill: '#064e3b' } },
  { id: 'e2-5', source: '2', target: '5', style: { stroke: '#52525b' } },
  { id: 'e4-6', source: '4', target: '6', style: { stroke: '#52525b' } },
];

export default function PrecedentGraph() {
  const { graphOpen, setGraphOpen } = useApp();
  const [nodes, , onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const onConnect = useCallback(params => setEdges(eds => addEdge(params, eds)), [setEdges]);

  if (!graphOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-6xl h-[88vh] bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative">

        {/* Floating header */}
        <div className="absolute top-4 left-4 z-10 p-4 bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-xl max-w-xs shadow-lg">
          <h2 className="text-sm font-bold text-zinc-100 mb-1">⚖️ Precedent Weave</h2>
          <p className="text-xs text-zinc-500 leading-relaxed">Visual citation graph of landmark Supreme Court judgments. Drag nodes to rearrange.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/30 border border-emerald-500/20 text-emerald-400">● Animated = Cites</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-500">— Static = Related</span>
          </div>
        </div>

        {/* Close */}
        <div className="absolute top-4 right-4 z-10">
          <button onClick={() => setGraphOpen(false)} className="p-2 bg-zinc-900 border border-white/10 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 transition-all shadow-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* React Flow canvas */}
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange} onConnect={onConnect} fitView colorMode="dark">
          <Background color="#27272a" gap={24} size={1} />
          <Controls className="!bg-zinc-900 !border-zinc-700 !rounded-xl" />
          <MiniMap className="!bg-zinc-900 !border-zinc-700 !rounded-xl" nodeColor="#3f3f46" maskColor="rgba(9,9,11,0.8)" />
        </ReactFlow>
      </motion.div>
    </div>
  );
}
