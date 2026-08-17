import React, { useCallback, useState } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { X, Network, BookOpen, Scale, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';

const INITIAL_NODES = [
  // Constitutional Core
  {
    id: '1',
    position: { x: 420, y: 30 },
    data: {
      label: 'Kesavananda Bharati (1973)\nBasic Structure Doctrine',
      topic: 'Constitutional Law',
      ratio: 'Parliament cannot alter the basic structure or essential framework of the Constitution under Article 368.',
      year: '1973',
    },
    style: {
      background: 'linear-gradient(135deg, #1B382B, #0E241B)',
      border: '1px solid #10B981',
      color: '#6EE7B7',
      borderRadius: '12px',
      padding: '12px 16px',
      fontSize: '11px',
      fontWeight: '700',
      textAlign: 'center',
      width: 190,
      boxShadow: '0 0 20px rgba(16,185,129,0.25)',
    },
  },
  {
    id: '2',
    position: { x: 180, y: 170 },
    data: {
      label: 'Minerva Mills (1980)\nHarmony of Rights & DPSP',
      topic: 'Constitutional Law',
      ratio: 'Harmonious balance between Fundamental Rights (Part III) and Directive Principles (Part IV) is part of Basic Structure.',
      year: '1980',
    },
    style: {
      background: '#16181D',
      border: '1px solid #3F3F46',
      color: '#D1C5B6',
      borderRadius: '10px',
      padding: '10px 14px',
      fontSize: '10px',
      textAlign: 'center',
      width: 160,
    },
  },
  {
    id: '3',
    position: { x: 440, y: 170 },
    data: {
      label: 'Maneka Gandhi (1978)\nDue Process & Art. 21',
      topic: 'Fundamental Rights',
      ratio: 'Procedure established by law under Article 21 must be fair, just, and reasonable — not arbitrary or oppressive.',
      year: '1978',
    },
    style: {
      background: 'linear-gradient(135deg, #3D2700, #1F1400)',
      border: '1px solid #B08D57',
      color: '#FFDEAE',
      borderRadius: '12px',
      padding: '12px 16px',
      fontSize: '11px',
      fontWeight: '700',
      textAlign: 'center',
      width: 180,
      boxShadow: '0 0 15px rgba(176,141,87,0.2)',
    },
  },
  {
    id: '4',
    position: { x: 700, y: 170 },
    data: {
      label: 'I.R. Coelho (2007)\n9th Schedule Judicial Review',
      topic: 'Constitutional Law',
      ratio: 'Laws placed in the 9th Schedule after 24 April 1973 are open to judicial review if they violate Basic Structure.',
      year: '2007',
    },
    style: {
      background: '#16181D',
      border: '1px solid #3F3F46',
      color: '#D1C5B6',
      borderRadius: '10px',
      padding: '10px 14px',
      fontSize: '10px',
      textAlign: 'center',
      width: 160,
    },
  },

  // Criminal Procedure & Arrest
  {
    id: '5',
    position: { x: 100, y: 320 },
    data: {
      label: 'D.K. Basu (1997)\nCustodial Violence & Arrest Guidelines',
      topic: 'Criminal Procedure',
      ratio: 'Mandatory 11 guidelines for arrest and detention. Failure creates irrebuttable presumption of official misconduct.',
      year: '1997',
    },
    style: {
      background: 'linear-gradient(135deg, #451A1A, #200B0B)',
      border: '1px solid #EF4444',
      color: '#FCA5A5',
      borderRadius: '12px',
      padding: '12px 16px',
      fontSize: '11px',
      fontWeight: '700',
      textAlign: 'center',
      width: 190,
      boxShadow: '0 0 15px rgba(239,68,68,0.2)',
    },
  },
  {
    id: '6',
    position: { x: 340, y: 320 },
    data: {
      label: 'Arnesh Kumar (2014)\nSection 41A Notice of Appearance',
      topic: 'Criminal Procedure',
      ratio: 'No automatic arrest for offences punishable with up to 7 years without written reasons and S. 41A CrPC compliance.',
      year: '2014',
    },
    style: {
      background: '#16181D',
      border: '1px solid #B08D57',
      color: '#E8C086',
      borderRadius: '10px',
      padding: '10px 14px',
      fontSize: '10px',
      textAlign: 'center',
      width: 170,
    },
  },
  {
    id: '7',
    position: { x: 570, y: 320 },
    data: {
      label: 'Lalita Kumari (2014)\nMandatory FIR Registration',
      topic: 'Criminal Procedure',
      ratio: 'Registration of FIR under Section 154 CrPC (Section 173 BNSS) is mandatory if cognizable offence is disclosed.',
      year: '2014',
    },
    style: {
      background: '#16181D',
      border: '1px solid #3F3F46',
      color: '#D1C5B6',
      borderRadius: '10px',
      padding: '10px 14px',
      fontSize: '10px',
      textAlign: 'center',
      width: 170,
    },
  },

  // Evidence & Capital Sentencing
  {
    id: '8',
    position: { x: 790, y: 320 },
    data: {
      label: 'Sharad Birdhichand (1984)\nPanchsheel of Circumstantial Evidence',
      topic: 'Evidence Law',
      ratio: 'Five golden principles for conviction on circumstantial evidence: the chain must be fully established with no hypothesis of innocence.',
      year: '1984',
    },
    style: {
      background: '#16181D',
      border: '1px solid #3F3F46',
      color: '#D1C5B6',
      borderRadius: '10px',
      padding: '10px 14px',
      fontSize: '10px',
      textAlign: 'center',
      width: 180,
    },
  },
  {
    id: '9',
    position: { x: 440, y: 460 },
    data: {
      label: 'Arjun Panditrao (2020)\nElectronic Evidence Section 65B',
      topic: 'Digital Evidence',
      ratio: 'Secondary electronic evidence requires mandatory statutory certification under S. 65B IEA / S. 63 BSA.',
      year: '2020',
    },
    style: {
      background: 'linear-gradient(135deg, #1E293B, #0F172A)',
      border: '1px solid #38BDF8',
      color: '#BAE6FD',
      borderRadius: '12px',
      padding: '12px 16px',
      fontSize: '11px',
      fontWeight: '700',
      textAlign: 'center',
      width: 180,
      boxShadow: '0 0 15px rgba(56,189,248,0.2)',
    },
  },
];

const INITIAL_EDGES = [
  { id: 'e1-2', source: '1', target: '2', label: 'Reaffirmed by', animated: true, style: { stroke: '#10B981', strokeWidth: 2 }, labelStyle: { fill: '#6EE7B7', fontSize: 9, fontWeight: '600' }, labelBgStyle: { fill: '#064E3B' } },
  { id: 'e1-3', source: '1', target: '3', label: 'Expanded to Art. 21', animated: true, style: { stroke: '#B08D57', strokeWidth: 2 }, labelStyle: { fill: '#FFDEAE', fontSize: 9 }, labelBgStyle: { fill: '#3D2700' } },
  { id: 'e1-4', source: '1', target: '4', label: 'Applied to 9th Sched.', style: { stroke: '#71717A' } },
  { id: 'e3-5', source: '3', target: '5', label: 'Life & Liberty Shield', animated: true, style: { stroke: '#EF4444' }, labelStyle: { fill: '#FCA5A5', fontSize: 9 }, labelBgStyle: { fill: '#451A1A' } },
  { id: 'e5-6', source: '5', target: '6', label: 'Arrest Safeguards', animated: true, style: { stroke: '#B08D57' } },
  { id: 'e5-7', source: '5', target: '7', label: 'FIR Mandate', style: { stroke: '#71717A' } },
  { id: 'e3-9', source: '3', target: '9', label: 'Fair Trial Standards', style: { stroke: '#38BDF8' } },
];

export default function PrecedentGraph() {
  const { graphOpen, setGraphOpen } = useApp();
  const [nodes, , onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [selectedNode, setSelectedNode] = useState(INITIAL_NODES[0]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
  }, []);

  if (!graphOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-lg">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="w-full max-w-6xl h-[92vh] bg-[#0E0F12] border border-[#B08D57]/30 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col relative font-inter"
      >
        {/* Floating Top Control Bar */}
        <div className="absolute top-4 left-4 z-10 p-4 bg-[#16181D]/90 backdrop-blur-md border border-[#B08D57]/20 rounded-xl max-w-sm shadow-xl">
          <div className="flex items-center gap-2 mb-1">
            <Network className="w-4 h-4 text-[#B08D57]" />
            <h2 className="text-sm font-serif font-bold text-[#E9E6DD]">Precedent Jurisprudential Weave</h2>
          </div>
          <p className="text-xs text-[#8A8778] leading-relaxed">
            Interactive citation graph of landmark Supreme Court rulings. Click any case node to inspect its binding ratio.
          </p>
        </div>

        {/* Close Button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setGraphOpen(false)}
            className="p-2.5 bg-[#16181D] border border-[#B08D57]/30 hover:bg-[#B08D57]/20 rounded-xl text-[#8A8778] hover:text-[#B08D57] transition-all shadow-xl"
            title="Close Precedent Weave"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* React Flow Graph Viewport */}
        <div className="flex-1 w-full h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
            colorMode="dark"
          >
            <Background color="#1C1F26" gap={24} size={1} />
            <Controls className="!bg-[#16181D] !border-[#B08D57]/20 !rounded-xl !text-[#E9E6DD]" />
            <MiniMap className="!bg-[#121316] !border-[#B08D57]/20 !rounded-xl" nodeColor="#B08D57" maskColor="rgba(14,15,18,0.8)" />
          </ReactFlow>
        </div>

        {/* Selected Case Ratio Bottom Drawer */}
        {selectedNode && (
          <div className="absolute bottom-4 left-4 right-4 z-10 p-4 md:p-5 bg-[#16181D]/95 backdrop-blur-md border border-[#B08D57]/30 rounded-xl shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#B08D57]/10 text-[#B08D57] flex-shrink-0 mt-0.5">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-serif font-bold text-[#E9E6DD]">
                    {selectedNode.data.label.split('\n')[0]} ({selectedNode.data.year})
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#B08D57]/20 text-[#B08D57] border border-[#B08D57]/30">
                    {selectedNode.data.topic}
                  </span>
                </div>
                <p className="text-xs text-[#d1c5b6] mt-1 leading-relaxed">
                  <strong className="text-[#B08D57]">Binding Ratio Decidendi:</strong> {selectedNode.data.ratio}
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
