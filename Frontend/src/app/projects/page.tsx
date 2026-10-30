'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/header';
import { UploadCloud, FolderGit2, Play, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { ApiClient } from '@/services/api';
import { ProjectMetadata } from '@rex/shared';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [analyzingProjectId, setAnalyzingProjectId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const data = await ApiClient.listProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append('archive', selectedFile);
      formData.append('name', projectName.trim() || selectedFile.name.replace(/\.[^/.]+$/, ''));

      const result = await ApiClient.importProject(formData);
      setStatusMessage({
        type: 'success',
        text: `Successfully imported "${result.name}" (${result.importedFilesCount} source files detected).`,
      });
      setSelectedFile(null);
      setProjectName('');
      await fetchProjects();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Upload failed',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleTriggerAnalysis = async (projectId: string) => {
    setAnalyzingProjectId(projectId);
    try {
      const job = await ApiClient.triggerAnalysis(projectId);
      router.push(`/analysis/${job.id}`);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to trigger analysis',
      });
      setAnalyzingProjectId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <Header
        title="Project Management"
        description="Import codebase archives, configure AST pipelines, and trigger code analyses."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-blue-400" />
                Import Repository Archive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Project Display Name
                  </label>
                  <Input
                    placeholder="e.g. payment-service"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Source Archive (.zip)
                  </label>
                  <Input
                    type="file"
                    accept=".zip"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Maximum size: 50MB. ZIP Slip defense enforced. Code is never executed.
                  </p>
                </div>

                {statusMessage && (
                  <div
                    className={`p-3 text-xs rounded-lg flex items-start gap-2 ${
                      statusMessage.type === 'success'
                        ? 'bg-emerald-950/40 border border-emerald-900/50 text-emerald-300'
                        : 'bg-red-950/40 border border-red-900/50 text-red-300'
                    }`}
                  >
                    {statusMessage.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    )}
                    <span>{statusMessage.text}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Validating & Extracting...
                    </>
                  ) : (
                    'Import Codebase'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Existing Projects List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Active Projects</CardTitle>
              <Badge variant="default">{projects.length} Registered</Badge>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-500 gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading projects from database...</span>
                </div>
              ) : projects.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No projects imported yet. Upload a project archive (.zip) above to begin.
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          <FolderGit2 className="h-4 w-4 text-blue-400" />
                          {project.name}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          ID: <span className="font-mono text-slate-500">{project.id.slice(0, 8)}...</span> • Imported:{' '}
                          {new Date(project.createdAt).toLocaleDateString()}
                          {project.description && ` • ${project.description}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={analyzingProjectId === project.id}
                          className="flex items-center gap-1.5"
                          onClick={() => handleTriggerAnalysis(project.id)}
                        >
                          {analyzingProjectId === project.id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Starting...
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5" /> Analyze
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
