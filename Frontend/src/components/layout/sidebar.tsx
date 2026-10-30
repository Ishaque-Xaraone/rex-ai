import React from 'react';
import Link from 'next/link';
import { Layers, FolderGit2, GitGraph, FileCode2, FileSpreadsheet, Sliders } from 'lucide-react';

export function Sidebar() {
  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: Layers },
    { label: 'Projects', href: '/projects', icon: FolderGit2 },
    { label: 'Dependency Graph', href: '/dependency-graph', icon: GitGraph },
    { label: 'Audit Reports', href: '/reports', icon: FileSpreadsheet },
    { label: 'System Settings', href: '/settings', icon: Sliders },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 p-4 flex flex-col gap-2 min-h-[calc(100vh-4rem)]">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
        Platform Navigation
      </div>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <Icon className="h-4 w-4 text-slate-400" />
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
}
