'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Layers, ShieldCheck, Cpu, ArrowUpRight, Plus, Loader2, FolderGit2 } from 'lucide-react';
import { ApiClient } from '@/services/api';
import { ProjectMetadata } from '@rex/shared';

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [healthStatus, setHealthStatus] = useState<string>('checking');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      ApiClient.listProjects().catch(() => []),
      ApiClient.getHealth().catch(() => ({ status: 'offline' })),
    ])
      .then(([projectsData, healthData]) => {
        setProjects(projectsData);
        setHealthStatus(healthData.status || 'unknown');
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <Header
        title="Engineering Dashboard"
        description="Static analysis telemetry, security findings, and project status overview."
        actions={
          <Link href="/projects">
            <Button className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Import Project
            </Button>
          </Link>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs font-medium text-slate-400">Total Registered Projects</span>
            <CardTitle className="text-2xl mt-1 text-white">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : projects.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs font-medium text-slate-400">Static AST Engine</span>
            <div className="flex items-center gap-2 mt-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-400"></span>
              <span className="text-sm font-semibold text-blue-400">TypeScript Compiler API</span>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs font-medium text-slate-400">Database & Services Health</span>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  healthStatus === 'healthy'
                    ? 'bg-emerald-400 animate-pulse'
                    : healthStatus === 'degraded'
                      ? 'bg-amber-400'
                      : 'bg-red-400'
                }`}
              ></span>
              <span
                className={`text-sm font-semibold capitalize ${
                  healthStatus === 'healthy'
                    ? 'text-emerald-400'
                    : healthStatus === 'degraded'
                      ? 'text-amber-400'
                      : 'text-red-400'
                }`}
              >
                {healthStatus}
              </span>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Projects Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Registered Codebase Projects</CardTitle>
          <Link href="/projects" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
            Manage All <ArrowUpRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-slate-500 gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Fetching projects...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No projects registered yet. Go to{' '}
              <Link href="/projects" className="text-blue-400 hover:underline">
                Projects
              </Link>{' '}
              to upload an archive.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {projects.slice(0, 5).map((project) => (
                <div key={project.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm text-white flex items-center gap-2">
                      <FolderGit2 className="h-4 w-4 text-blue-400" />
                      {project.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Created: {new Date(project.createdAt).toLocaleDateString()}
                      {project.description && ` • ${project.description}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/projects`}>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
