"use client";

import React from "react";
import { ModeToggle } from "../ModeToggle";
import { useWallet } from "@/context/wallet-context";
import { shortenPublicKey } from "@/lib/wallet";
import { Bell, Search, User, Menu } from "lucide-react";

interface TopNavProps {
  onMenuClick?: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const { session, status } = useWallet();
  const isConnected = status === "connected";

  return (
    <header className="dashboard-header flex items-center justify-between px-6 py-4 bg-glass backdrop-blur-md border-b border-glass-border">
      <div className="flex items-center gap-4 lg:hidden">
         <button 
           onClick={onMenuClick}
           className="p-2 rounded-lg hover:bg-glass-highlight"
         >
            <Menu className="h-6 w-6" />
         </button>
         <span className="font-bold text-lg">FlowFi</span>
      </div>

      <div className="hidden md:flex flex-1 max-w-md items-center relative">
         <Search className="absolute left-3 h-4 w-4 text-slate-400" />
         <input 
           type="text" 
           placeholder="Search streams, recipients..."
           className="w-full bg-glass-highlight border border-glass-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
         />
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <div className="hidden sm:flex items-center gap-2">
           <button className="p-2 rounded-lg hover:bg-glass-highlight text-slate-500 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border-2 border-background"></span>
           </button>
           <ModeToggle />
        </div>

        {isConnected && session ? (
          <div className="wallet-chip flex items-center gap-3 bg-accent/5 border-accent/20">
            <div className="hidden sm:block text-right">
              <p className="text-[10px] font-bold text-accent uppercase leading-none">{session.walletName}</p>
              <p className="text-sm font-mono font-semibold">{shortenPublicKey(session.publicKey)}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center text-white">
               <User className="h-5 w-5" />
            </div>
          </div>
        ) : (
          <button className="secondary-button px-6">
            Connect
          </button>
        )}
      </div>
    </header>
  );
}
