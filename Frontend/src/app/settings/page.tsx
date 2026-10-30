'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/layout/header';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <Header
        title="Settings & Configurations"
        description="Configure backend endpoints, storage safety limits, and language adapter preferences."
      />

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Backend & Service Integrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Backend API URL
              </label>
              <Input defaultValue="http://localhost:4000/api" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                FastAPI AI-Service URL
              </label>
              <Input defaultValue="http://localhost:8000" />
            </div>
            <Button size="sm">Save Endpoints</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload & Decompression Safety Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Max Archive Upload Size (MB)
              </label>
              <Input defaultValue="50" type="number" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Max Expanded Archive Limit (MB)
              </label>
              <Input defaultValue="200" type="number" />
            </div>
            <Button variant="secondary" size="sm">
              Update Limits
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
