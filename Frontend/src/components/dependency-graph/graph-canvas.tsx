'use client';

import React from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export interface GraphCanvasProps {
  nodes: Node[];
  edges: Edge[];
}

export function GraphCanvas({ nodes, edges }: GraphCanvasProps) {
  if (nodes.length === 0) {
    return (
      <div className="flex h-[550px] w-full items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-slate-500">
        No graph dependencies detected yet. Run analysis to extract modules and call edges.
      </div>
    );
  }

  return (
    <div className="h-[550px] w-full rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        className="bg-slate-950"
      >
        <Background color="#334155" gap={16} />
        <Controls className="bg-slate-900 border-slate-700 fill-slate-300" />
      </ReactFlow>
    </div>
  );
}
