import React from 'react';
import { PdfReportMetadata } from '@rex/shared';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { FileDown, ShieldAlert, CheckCircle2 } from 'lucide-react';

export interface ReportCardProps {
  report: PdfReportMetadata;
}

export function ReportCard({ report }: ReportCardProps) {
  return (
    <Card className="border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl">{report.projectName} — Security Audit</CardTitle>
          <CardDescription>Generated: {new Date(report.generatedAt).toLocaleString()}</CardDescription>
        </div>
        <Badge variant={report.status === 'generated' ? 'success' : 'warning'}>
          {report.status.toUpperCase()}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-300">{report.executiveSummary}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg">
            <div className="text-xs text-red-400 font-medium">Critical</div>
            <div className="text-xl font-bold text-red-200 mt-1">{report.findingsBySeverity.critical}</div>
          </div>
          <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-lg">
            <div className="text-xs text-amber-400 font-medium">High</div>
            <div className="text-xl font-bold text-amber-200 mt-1">{report.findingsBySeverity.high}</div>
          </div>
          <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-lg">
            <div className="text-xs text-blue-400 font-medium">Medium</div>
            <div className="text-xl font-bold text-blue-200 mt-1">{report.findingsBySeverity.medium}</div>
          </div>
          <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg">
            <div className="text-xs text-slate-400 font-medium">Low / Info</div>
            <div className="text-xl font-bold text-slate-200 mt-1">
              {report.findingsBySeverity.low + report.findingsBySeverity.info}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {
              alert('PDF download will stream when compiled in production mode.');
            }}
          >
            <FileDown className="h-4 w-4" /> Export Audit PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
