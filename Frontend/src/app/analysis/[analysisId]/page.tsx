'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { CodeViewer } from '@/components/code-viewer/code-viewer';
import { GitFork, ArrowLeft, Loader2, AlertTriangle, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { ApiClient } from '@/services/api';
import { AnalysisJob, Finding, FindingSeverity } from '@rex/shared';

export default function AnalysisDetailsPage() {
  const params = useParams();
  const analysisId = (params?.analysisId as string) || '';

  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysisData = async () => {
    if (!analysisId) return;
    try {
      const jobData = await ApiClient.getAnalysisJob(analysisId);
      setJob(jobData);

      if (jobData.status === 'completed' || jobData.status === 'partial') {
        const findingsData = await ApiClient.getAnalysisFindings(analysisId);
        setFindings(findingsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysisData();

    // Auto-poll if job is still in running or queued state
    const interval = setInterval(() => {
      if (job && (job.status === 'running' || job.status === 'queued')) {
        fetchAnalysisData();
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [analysisId, job?.status]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium">Loading analysis telemetry...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="p-6 rounded-xl border border-red-900/40 bg-red-950/20 text-red-300">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Analysis Not Found
          </h2>
          <p className="text-sm mt-1">{error || `Could not find analysis job with id: ${analysisId}`}</p>
          <div className="mt-4">
            <Link href="/projects">
              <Button variant="outline" size="sm">
                Back to Projects
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isRunning = job.status === 'running' || job.status === 'queued';
  const filteredFindings =
    selectedSeverity === 'all'
      ? findings
      : findings.filter((f) => f.severity === selectedSeverity);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Projects
        </Link>
      </div>

      <Header
        title={`Analysis Run: ${analysisId.slice(0, 13)}...`}
        description={`Compiler AST analysis for project ${job.projectId}.`}
        actions={
          <div className="flex items-center gap-3">
            <Badge
              variant={
                job.status === 'completed'
                  ? 'success'
                  : job.status === 'partial'
                    ? 'warning'
                    : job.status === 'failed'
                      ? 'danger'
                      : 'info'
              }
            >
              {job.status.toUpperCase()}
            </Badge>

            <Link href={`/dependency-graph?analysisId=${analysisId}`}>
              <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                <GitFork className="h-3.5 w-3.5" /> View Graph
              </Button>
            </Link>

            <Link href={`/reports?analysisId=${analysisId}`}>
              <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Audit Report
              </Button>
            </Link>
          </div>
        }
      />

      {/* Running Progress State */}
      {isRunning && (
        <Card className="mb-8 border-blue-900/50 bg-blue-950/20">
          <CardContent className="py-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-300 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {job.currentPhase || 'AST analysis pipeline in progress...'}
              </span>
              <span className="text-xs font-mono text-blue-400">{job.progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-2 transition-all duration-300"
                style={{ width: `${job.progressPercent}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Partial Limitations Banner */}
      {job.status === 'partial' && job.limitations && job.limitations.length > 0 && (
        <div className="mb-6 p-4 rounded-xl border border-amber-900/40 bg-amber-950/20 text-amber-300 text-xs">
          <div className="font-semibold flex items-center gap-1.5 mb-1 text-amber-200">
            <AlertTriangle className="h-4 w-4" /> Analysis Completed with Limitations
          </div>
          <ul className="list-disc list-inside space-y-0.5 mt-1 text-slate-300">
            {job.limitations.map((limit, i) => (
              <li key={i}>{limit}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Failed Error Banner */}
      {job.status === 'failed' && (
        <div className="mb-6 p-4 rounded-xl border border-red-900/40 bg-red-950/20 text-red-300 text-xs">
          <div className="font-semibold flex items-center gap-1.5 mb-1 text-red-200">
            <ShieldAlert className="h-4 w-4" /> Analysis Failed
          </div>
          <p>{job.errorMessage || 'An error occurred during static analysis execution.'}</p>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-1">
            <span className="text-xs text-slate-400">Lines of Code</span>
            <CardTitle className="text-2xl mt-1 text-white">
              {job.summary?.totalLinesOfCode ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <span className="text-xs text-slate-400">Symbols Extracted</span>
            <CardTitle className="text-2xl mt-1 text-blue-400">
              {job.summary?.symbolsCount ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <span className="text-xs text-slate-400">Dependencies</span>
            <CardTitle className="text-2xl mt-1 text-emerald-400">
              {job.summary?.dependenciesCount ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <span className="text-xs text-slate-400">Security Findings</span>
            <CardTitle className="text-2xl mt-1 text-red-400">
              {findings.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Findings Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Discovered Findings & Evidence</h2>

          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3 py-1 rounded-md transition-colors capitalize ${
                  selectedSeverity === sev
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sev} {sev === 'all' ? `(${findings.length})` : ''}
              </button>
            ))}
          </div>
        </div>

        {filteredFindings.length === 0 ? (
          <Card className="border-slate-800 py-12 text-center text-slate-500">
            {isRunning
              ? 'Analyzing syntax nodes...'
              : 'No security findings detected for the selected filter.'}
          </Card>
        ) : (
          filteredFindings.map((finding) => (
            <Card key={finding.id} className="border-slate-800">
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        finding.severity === 'critical'
                          ? 'danger'
                          : finding.severity === 'high'
                            ? 'warning'
                            : 'default'
                      }
                    >
                      {finding.severity.toUpperCase()}
                    </Badge>
                    <span className="text-xs font-mono text-slate-400">{finding.ruleId}</span>
                    <span className="text-xs text-slate-500 capitalize">• {finding.category}</span>
                  </div>
                  <CardTitle className="text-base mt-2">{finding.ruleTitle}</CardTitle>
                  <p className="text-sm text-slate-400 mt-1">{finding.description}</p>
                </div>
                <div className="text-xs font-mono text-slate-500">
                  {finding.evidence.filePath}:{finding.evidence.lineReference.startLine}
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-2">
                  <CodeViewer
                    code={finding.evidence.snippet}
                    filePath={finding.evidence.filePath}
                    highlightRange={finding.evidence.lineReference}
                  />
                </div>
                {finding.remediation && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                    <span className="font-semibold text-blue-400">Remediation: </span>
                    {finding.remediation}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
