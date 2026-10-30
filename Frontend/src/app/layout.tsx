import React from 'react';
import type { Metadata } from 'next';
import '../styles/globals.css';
import { Navbar } from '@/components/layout/navbar';
import { QueryProvider } from '@/lib/query-provider';

export const metadata: Metadata = {
  title: 'REX AI — Reverse Engineering & Debugging Platform',
  description: 'Production static code analysis, reverse engineering, and automated security audit platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <QueryProvider>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
