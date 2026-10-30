'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { ReportCard } from '@/components/reports/report-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, FileText, AlertCircle } from 'lucide-react';
import { ApiClient } from '@/services/api';
import { PdfReportMetadata } from '@rex/shared';

function ReportsContent() {
  const searchParams = useSearchParams();
  const initialAnalysisId = searchParams.get('analysisId') || '';

  const [analysisId, setAnalysisId] = useState(initialAnalysisId);
  const [report, setReport] = useState<PdfReportMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async (id: string) => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await ApiClient.getAnalysisReport(id);
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch report');
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (analysisId) {
      fetchReport(analysisId);
    }
  }, [analysisId]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <Header
        title="Audit & Compliance Reports"
        description="Comprehensive security audit logs, executive summaries, and downloadable PDF reports."
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
        <Button size="sm" onClick={() => fetchReport(analysisId)} disabled={!analysisId || isLoading}>
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Load Audit Report'}
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-red-900/40 bg-red-950/20 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex py-16 w-full items-center justify-center text-slate-400 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span>Compiling audit metrics and executive report...</span>
        </div>
      ) : report ? (
        <div className="space-y-6">
          <ReportCard report={report} />
        </div>
      ) : (
        <Card className="border-slate-800 py-16 text-center text-slate-500">
          Enter an Analysis ID or run a code analysis to inspect the generated security audit report.
        </Card>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading Report Interface...</div>}>
      <ReportsContent />
    </Suspense>
  );
}
