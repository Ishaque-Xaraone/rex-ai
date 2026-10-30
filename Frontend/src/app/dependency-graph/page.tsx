'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { GraphCanvas } from '@/components/dependency-graph/graph-canvas';
import { Button } from '@/components/ui/button';
import { RefreshCw, Filter, Loader2, FolderGit2 } from 'lucide-react';
import { ApiClient } from '@/services/api';
import { ProjectMetadata } from '@rex/shared';
import type { Node, Edge } from '@xyflow/react';

function DependencyGraphContent() {
  const searchParams = useSearchParams();
  const initialAnalysisId = searchParams.get('analysisId') || '';

  const [analysisId, setAnalysisId] = useState(initialAnalysisId);
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load projects list for the project selector
    ApiClient.listProjects()
      .then((data) => {
        setProjects(data);
        if (!initialAnalysisId && data.length > 0) {
          // Find if any project has an active analysis or trigger check
        }
      })
      .catch((err) => console.error(err));
  }, [initialAnalysisId]);

  const loadGraph = async (id: string) => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const graphData = await ApiClient.getAnalysisGraph(id);

      const flowNodes: Node[] = graphData.nodes.map((n, idx) => {
        const isExternal = n.type === 'externalPackage';
        return {
          id: n.id,
          position: n.position || {
            x: (idx % 3) * 280 + 50,
            y: Math.floor(idx / 3) * 160 + 50,
          },
          data: { label: n.label },
          style: {
            background: isExternal ? '#0f172a' : '#1e293b',
            color: isExternal ? '#38bdf8' : '#f8fafc',
            border: isExternal ? '1px dashed #0284c7' : '1px solid #3b82f6',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '12px',
            fontFamily: 'monospace',
            maxWidth: '240px',
            wordBreak: 'break-all',
          },
        };
      });

      const flowEdges: Edge[] = graphData.edges.map((e, idx) => ({
        id: e.id || `e-${idx}`,
        source: e.source,
        target: e.target,
        label: e.label,
        type: 'smoothstep',
        animated: e.label?.includes('import'),
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load graph data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (analysisId) {
      loadGraph(analysisId);
    }
  }, [analysisId]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <Header
        title="Interactive Dependency Graph"
        description="Module dependencies, external package imports, and caller hierarchies rendered in real-time."
        actions={
          <div className="flex items-center gap-3">
            {analysisId && (
              <Button
                variant="secondary"
                size="sm"
                className="flex items-center gap-1.5"
                onClick={() => loadGraph(analysisId)}
                disabled={isLoading}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Re-layout
              </Button>
            )}
          </div>
        }
      />

      {/* Analysis Selector Bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
        <label className="text-xs text-slate-400 font-medium">Selected Analysis Run:</label>
        <input
          type="text"
          placeholder="Paste analysis ID here..."
          value={analysisId}
          onChange={(e) => setAnalysisId(e.target.value.trim())}
          className="bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs rounded-lg text-slate-200 w-80 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <Button size="sm" onClick={() => loadGraph(analysisId)} disabled={!analysisId || isLoading}>
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Load Graph'}
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-red-900/40 bg-red-950/20 text-red-300 text-xs">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex h-[550px] w-full items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-slate-400 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span>Building dependency nodes and resolving edges...</span>
        </div>
      ) : (
        <GraphCanvas nodes={nodes} edges={edges} />
      )}
    </div>
  );
}

export default function DependencyGraphPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading Dependency Graph...</div>}>
      <DependencyGraphContent />
    </Suspense>
  );
}
