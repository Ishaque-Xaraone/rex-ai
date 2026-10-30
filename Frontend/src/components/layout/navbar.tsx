import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Cpu, GitFork, FileText, Settings, Layers } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white">
            <Cpu className="h-6 w-6 text-blue-500" />
            <span>REX <span className="text-blue-500">AI</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <Link href="/dashboard" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
              <Layers className="h-4 w-4" /> Dashboard
            </Link>
            <Link href="/projects" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
              <Cpu className="h-4 w-4" /> Projects
            </Link>
            <Link href="/dependency-graph" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
              <GitFork className="h-4 w-4" /> Dependency Graph
            </Link>
            <Link href="/reports" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> Reports
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/settings" className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <Settings className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            System Ready
          </div>
        </div>
      </div>
    </header>
  );
}
