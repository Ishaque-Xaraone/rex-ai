import React from 'react';
import Link from 'next/link';
import { Cpu, ShieldAlert, GitFork, ArrowRight, CheckCircle2, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="relative overflow-hidden py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-xs text-blue-400 mb-6">
            <span className="font-semibold">REX AI MVP v0.1.0</span> • Automated AST Analysis & Security Auditing
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white">
            Reverse Engineering & <span className="text-blue-500">Code Analysis</span> Platform
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-400 max-w-3xl mx-auto">
            Deep static analysis, compiler-driven AST symbol extraction, dependency graph resolution,
            and deterministic security vulnerability detection for modern polyglot repositories.
          </p>

          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/projects">
              <Button size="lg" className="flex items-center gap-2">
                Open Projects <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg">
                View Live Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Compiler AST Analysis</h3>
            <p className="mt-2 text-sm text-slate-400">
              Direct integration with the TypeScript compiler API and language adapters. Extracts symbols, scopes, signatures, and call flows.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
              <GitFork className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Interactive Dependency Graph</h3>
            <p className="mt-2 text-sm text-slate-400">
              Visualizes cross-module dependencies, external package imports, and caller-callee call graphs in real-time.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-5">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Security & Anti-Patterns</h3>
            <p className="mt-2 text-sm text-slate-400">
              Detects dynamic eval execution, potential command injection, hardcoded API keys, and unsafe DOM manipulations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
