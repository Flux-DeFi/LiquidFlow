"use client";

import { useEffect, useState } from "react";
import { Copy, Check, LogOut, Moon, Sun, Bell } from "lucide-react";

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [copied, setCopied] = useState(false);

  const connectedAddress = "0x92f4D9b123456789ABCDEF123456789ABCDEF123";

  /* ---------------- THEME INIT ---------------- */
  useEffect(() => {
    const saved = localStorage.getItem("flowfi-theme") as
      | "light"
      | "dark"
      | null;

    if (saved) {
      setTheme(saved);
      document.documentElement.classList.toggle("dark", saved === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("flowfi-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const copyAddress = async () => {
    await navigator.clipboard.writeText(connectedAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDisconnect = () => {
    console.log("Wallet disconnected");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-black dark:from-white dark:via-gray-100 dark:to-gray-200 transition-colors">
      {/* Background Glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 blur-3xl rounded-full" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/20 blur-3xl rounded-full" />

      <div className="relative max-w-xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="rounded-3xl border border-white/10 dark:border-black/10 bg-white/5 dark:bg-black/5 backdrop-blur-2xl shadow-2xl p-6 sm:p-10 space-y-8 sm:space-y-10">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white dark:text-black">
              Profile Settings
            </h1>
            <p className="text-sm opacity-60 mt-1">
              Manage your FlowFi experience
            </p>
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                <Bell size={18} />
              </div>
              <div>
                <p className="font-medium text-white dark:text-black">
                  Email Notifications
                </p>
                <p className="text-sm opacity-60">
                  Get notified about activity
                </p>
              </div>
            </div>

            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                emailNotifications
                  ? "bg-gradient-to-r from-purple-500 to-blue-500"
                  : "bg-zinc-600"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transform transition duration-300 ${
                  emailNotifications ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              <div>
                <p className="font-medium text-white dark:text-black">
                  Appearance
                </p>
                <p className="text-sm opacity-60">Toggle dark & light mode</p>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="px-4 py-2 text-sm rounded-xl border border-white/10 dark:border-black/10 hover:scale-105 transition-transform text-white dark:text-black"
            >
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
          </div>

          {/* Wallet Section */}
          <div className="space-y-3">
            <p className="font-medium text-white dark:text-black">
              Connected Wallet
            </p>

            <div className="relative flex items-center justify-between bg-black/40 dark:bg-white/40 px-4 py-3 sm:px-5 sm:py-4 rounded-xl font-mono text-xs sm:text-sm break-all text-white dark:text-black border border-white/10 dark:border-black/10">
              <span className="pr-4 truncate">{connectedAddress}</span>

              <button
                onClick={copyAddress}
                className="ml-3 opacity-70 hover:opacity-100 transition flex-shrink-0"
              >
                {copied ? (
                  <Check size={16} className="text-green-400 sm:size-18" />
                ) : (
                  <Copy size={16} className="sm:size-18" />
                )}
              </button>

              {copied && (
                <span className="absolute -top-8 right-2 text-xs bg-black text-white dark:bg-white dark:text-black px-2 py-1 rounded-md shadow">
                  Copied
                </span>
              )}
            </div>
          </div>

          {/* Disconnect */}
          <button
            onClick={handleDisconnect}
            className="w-full flex items-center justify-center gap-2 bg-red-600/90 hover:bg-red-600 transition px-4 py-3 rounded-xl text-white font-medium shadow-lg hover:shadow-red-500/30"
          >
            <LogOut size={18} />
            Disconnect Wallet
          </button>
        </div>
      </div>
    </div>
  );
}
