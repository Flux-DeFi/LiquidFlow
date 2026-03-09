"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Settings, 
  Zap,
  History
} from "lucide-react";

const MENU_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { id: "incoming", label: "Incoming", href: "/incoming", icon: ArrowDownLeft },
  { id: "outgoing", label: "Outgoing", href: "/outgoing", icon: ArrowUpRight },
  { id: "activity", label: "Activity", href: "/activity", icon: History },
  { id: "settings", label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="dashboard-sidebar hidden lg:flex">
      <div className="brand flex items-center gap-2 mb-4 px-2">
        <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
        </div>
        <span>FlowFi</span>
      </div>
      
      <nav className="flex-1 space-y-1" aria-label="Sidebar">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`sidebar-item flex items-center gap-3 transition-all ${
                isActive ? "bg-accent/10 text-accent font-semibold" : "hover:bg-glass-highlight"
              }`}
              data-active={isActive ? "true" : undefined}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-accent" : "text-slate-500"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto px-2 pb-2">
         <div className="rounded-xl bg-gradient-to-br from-accent/10 to-transparent p-4 border border-accent/10">
            <p className="text-[10px] uppercase tracking-wider font-bold text-accent mb-1">Stellar Testnet</p>
            <p className="text-xs text-slate-500 leading-tight">Connected to Soroban real-time layer</p>
         </div>
      </div>
    </aside>
  );
}
