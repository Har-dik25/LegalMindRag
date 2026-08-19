import React from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { X, Network } from 'lucide-react';

/* ── Custom Node ── */
function StrategyNode({ data }) {
  const colorMap = {
    root:    'from-amber-600 to-orange-700 border-amber-500/40 shadow-amber-900/30',
    yours:   'from-cyan-700 to-blue-800 border-cyan-500/30 shadow-cyan-900/30',
    opponent:'from-red-700 to-rose-800 border-red-500/30 shadow-red-900/30',
    outcome: 'from-emerald-700 to-teal-800 border-emerald-500/30 shadow-emerald-900/30',
  };
  const colors = colorMap[data.type] || colorMap.yours;

  return (
    <div className={`bg-gradient-to-br ${colors} border rounded-xl px-4 py-3 min-w-[180px] max-w-[220px] shadow-lg`}>
      <div className="text-[9px] uppercase tracking-widest font-bold text-white/60 mb-1">{data.type}</div>
      <div className="text-xs text-white font-semibold leading-snug">{data.label}</div>
    </div>
  );
}

const nodeTypes = { strategy: StrategyNode };

/* ── Sample tree data ── */
const INITIAL_NODES = [
  { id: '1', type: 'strategy', position: { x: 250, y: 0 },   data: { label: 'File Suit under Section 34, Arbitration Act', type: 'root' } },
  { id: '2', type: 'strategy', position: { x: 0,   y: 120 }, data: { label: 'Argue: Agreement has valid arbitration clause', type: 'yours' } },
  { id: '3', type: 'strategy', position: { x: 500, y: 120 }, data: { label: 'Opponent: Clause is vague / unconscionable', type: 'opponent' } },
  { id: '4', type: 'strategy', position: { x: -100, y: 260 }, data: { label: 'Cite Vidya Drolia (2021) – pro-arbitration bias', type: 'yours' } },
  { id: '5', type: 'strategy', position: { x: 150, y: 260 }, data: { label: 'Counter: Public policy exception under S. 34(2)(b)', type: 'opponent' } },
  { id: '6', type: 'strategy', position: { x: 400, y: 260 }, data: { label: 'Challenge jurisdiction of arbitral tribunal', type: 'opponent' } },
  { id: '7', type: 'strategy', position: { x: 650, y: 260 }, data: { label: 'Argue fraud vitiates arbitration (N. Radhakrishnan)', type: 'opponent' } },
  { id: '8', type: 'strategy', position: { x: -50, y: 400 }, data: { label: 'Outcome: Court upholds arbitration – proceed to tribunal', type: 'outcome' } },
  { id: '9', type: 'strategy', position: { x: 250, y: 400 }, data: { label: 'Outcome: Partial set-aside – limited remand', type: 'outcome' } },
  { id: '10', type: 'strategy', position: { x: 550, y: 400 }, data: { label: 'Outcome: Suit dismissed – fresh proceedings needed', type: 'outcome' } },
];

const INITIAL_EDGES = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#06b6d4' } },
  { id: 'e1-3', source: '1', target: '3', animated: true, style: { stroke: '#ef4444' } },
  { id: 'e2-4', source: '2', target: '4', style: { stroke: '#06b6d4' } },
  { id: 'e2-5', source: '2', target: '5', style: { stroke: '#ef4444' } },
  { id: 'e3-6', source: '3', target: '6', style: { stroke: '#ef4444' } },
  { id: 'e3-7', source: '3', target: '7', style: { stroke: '#ef4444' } },
  { id: 'e4-8', source: '4', target: '8', style: { stroke: '#10b981' } },
  { id: 'e5-9', source: '5', target: '9', style: { stroke: '#f59e0b' } },
  { id: 'e6-10', source: '6', target: '10', style: { stroke: '#ef4444' } },
  { id: 'e7-10', source: '7', target: '10', style: { stroke: '#ef4444' } },
];

export default function StrategySimulator({ onClose }) {
  const [nodes, , onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, , onEdgesChange] = useEdgesState(INITIAL_EDGES);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-xl flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-950/90 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-lg">
            <Network className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Litigation Strategy Simulator</h2>
            <p className="text-[10px] text-zinc-500">Map opponent moves & counter-arguments like chess</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden md:flex items-center gap-3 mr-4">
            {[
              { label: 'Your Move', cls: 'bg-cyan-500' },
              { label: 'Opponent', cls: 'bg-red-500' },
              { label: 'Outcome',  cls: 'bg-emerald-500' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                <div className={`w-2 h-2 rounded-full ${l.cls}`} />
                {l.label}
              </div>
            ))}
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
          className="bg-zinc-950"
        >
          <Background color="#27272a" gap={20} size={1} />
          <Controls
            className="!bg-zinc-900 !border-white/10 !rounded-xl !shadow-xl [&>button]:!bg-zinc-800 [&>button]:!border-white/5 [&>button]:!text-zinc-400 [&>button:hover]:!bg-zinc-700"
          />
          <MiniMap
            nodeColor={(n) => {
              const t = n.data?.type;
              if (t === 'root') return '#f59e0b';
              if (t === 'yours') return '#06b6d4';
              if (t === 'opponent') return '#ef4444';
              if (t === 'outcome') return '#10b981';
              return '#71717a';
            }}
            maskColor="rgba(0,0,0,0.7)"
            className="!bg-zinc-900 !border-white/10 !rounded-xl"
          />
        </ReactFlow>
      </div>
    </motion.div>
  );
}
