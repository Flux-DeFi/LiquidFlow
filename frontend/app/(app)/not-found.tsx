"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center p-8 md:p-12 glass-card max-w-lg rounded-3xl">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-5xl font-black text-accent md:h-24 md:w-24 md:text-6xl">
          404
        </div>
        <h1 className="mb-3 text-3xl leading-tight font-black md:text-4xl">
          Page not found
        </h1>
        <p className="mx-auto mb-8 max-w-sm text-base text-slate-400">
          The page you&apos;re looking for doesn&apos;t exist or has been
          moved. Let&apos;s get you back to your dashboard.
        </p>
        <Link
          href="/app/dashboard"
          className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-8 text-base font-bold text-background shadow-[0_0_16px_rgba(16,185,129,0.35)] transition-all hover:shadow-[0_0_24px_rgba(16,185,129,0.5)] active:scale-95"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}