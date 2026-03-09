"use client";

import React from "react";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { useWallet } from "@/context/wallet-context";

export default function DashboardPage() {
  const { session, disconnect, status } = useWallet();

  if (status !== "connected" || !session) {
    return (
      <div className="flex items-center justify-center h-full">
         <div className="text-center p-8 glass-card max-w-md rounded-3xl">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-slate-500 mb-6">You need to connect your Stellar wallet to access the LiquidFlow dashboard.</p>
            {/* The Connect button in TopNav can handle this, or we can add a local one */}
         </div>
      </div>
    );
  }

  return <DashboardView session={session} onDisconnect={disconnect} />;
}
