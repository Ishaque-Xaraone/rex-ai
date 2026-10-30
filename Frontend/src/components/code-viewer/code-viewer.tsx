import React from 'react';
import { LineReference } from '@rex/shared';

export interface CodeViewerProps {
  code: string;
  filePath?: string;
  highlightRange?: LineReference;
}

export function CodeViewer({ code, filePath, highlightRange }: CodeViewerProps) {
  const lines = code.split('\n');

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs overflow-hidden">
      {filePath && (
        <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/60 text-slate-400 flex items-center justify-between">
          <span>{filePath}</span>
          <span className="text-[11px] text-slate-500">{lines.length} lines</span>
        </div>
      )}
      <div className="overflow-x-auto p-4 max-h-[500px]">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((lineContent, index) => {
              const lineNum = index + 1;
              const isHighlighted =
                highlightRange &&
                lineNum >= highlightRange.startLine &&
                lineNum <= highlightRange.endLine;

              return (
                <tr
                  key={lineNum}
                  className={isHighlighted ? 'bg-red-500/15 border-l-2 border-red-500' : 'hover:bg-slate-900/40'}
                >
                  <td className="w-12 select-none text-right pr-4 text-slate-600 font-mono">
                    {lineNum}
                  </td>
                  <td className="whitespace-pre text-slate-200">
                    {lineContent || '\n'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
