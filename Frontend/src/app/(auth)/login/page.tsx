'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Cpu } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <Card className="w-full max-w-md border-slate-800">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3">
            <Cpu className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl">Sign In to REX AI</CardTitle>
          <p className="text-xs text-slate-400 mt-1">
            Access your code security analysis projects & audit telemetry.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Work Email
              </label>
              <Input type="email" placeholder="engineer@enterprise.com" required />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Password
              </label>
              <Input type="password" placeholder="••••••••" required />
            </div>
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
