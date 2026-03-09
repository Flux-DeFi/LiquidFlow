"use client";

import React, { useState } from "react";
import { Copy, Check, LogOut, Moon, Sun } from "lucide-react";
import { useWallet } from "@/context/wallet-context";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { session, disconnect } = useWallet();
  const { theme, setTheme } = useTheme();
  const [copied, setCopied] = useState(false);

  const connectedAddress = session?.publicKey || "Not connected";

  const copyAddress = async () => {
    if (!session?.publicKey) return;
    await navigator.clipboard.writeText(session.publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative max-w-xl mx-auto py-12">
      <div className="rounded-3xl border border-glass-border bg-glass backdrop-blur-2xl shadow-2xl p-6 sm:p-10 space-y-8 sm:space-y-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Profile Settings
          </h1>
          <p className="text-sm opacity-60 mt-1 text-muted-foreground">
            Manage your FlowFi experience
          </p>
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
            </div>
            <div>
              <p className="font-medium text-foreground">
                Appearance
              </p>
              <p className="text-sm text-muted-foreground">Toggle dark & light mode</p>
            </div>
          </div>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="px-4 py-2 text-sm rounded-xl border border-glass-border hover:bg-glass-highlight transition-all text-foreground"
          >
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        {/* Wallet Section */}
        <div className="space-y-3">
          <p className="font-medium text-foreground">
            Connected Wallet
          </p>

          <div className="relative flex items-center justify-between bg-glass-highlight px-4 py-3 sm:px-5 sm:py-4 rounded-xl font-mono text-xs sm:text-sm break-all border border-glass-border text-foreground">
            <span className="pr-4 truncate">{connectedAddress}</span>

            <button
              onClick={copyAddress}
              className="ml-3 opacity-70 hover:opacity-100 transition flex-shrink-0"
            >
              {copied ? (
                <Check size={16} className="text-green-500 sm:size-18" />
              ) : (
                <Copy size={16} className="sm:size-18 text-muted-foreground" />
              )}
            </button>

            {copied && (
              <span className="absolute -top-8 right-2 text-xs bg-foreground text-background px-2 py-1 rounded-md shadow">
                Copied
              </span>
            )}
          </div>
        </div>

        {/* Disconnect */}
        <button
          onClick={disconnect}
          className="w-full flex items-center justify-center gap-2 bg-red-500/90 hover:bg-red-500 transition px-4 py-3 rounded-xl text-white font-medium shadow-lg hover:shadow-red-500/30"
        >
          <LogOut size={18} />
          Disconnect Wallet
        </button>
      </div>
    </div>
  );
}
