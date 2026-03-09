"use client";

import { useEffect, useCallback } from "react";
import {
  X,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useWallet } from "@/context/wallet-context";
import type { WalletId, WalletDescriptor } from "@/lib/wallet";
import { shortenPublicKey } from "@/lib/wallet";

// ─── Wallet icons (inline SVG) ────────────────────────────────────────────────

function FreighterIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="10" fill="#6366f1" />
      <path d="M8 20l12-10 12 10-12 10L8 20z" fill="white" opacity="0.9" />
      <path d="M14 20l6-5 6 5-6 5-6-5z" fill="#6366f1" />
    </svg>
  );
}

function AlbedoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="10" fill="#0ea5e9" />
      <circle
        cx="20"
        cy="20"
        r="9"
        stroke="white"
        strokeWidth="2.5"
        fill="none"
      />
      <circle cx="20" cy="20" r="4" fill="white" />
    </svg>
  );
}

function XBullIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="10" fill="#10b981" />
      <path
        d="M12 12l8 8 8-8M12 28l8-8 8 8"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const WALLET_ICONS: Record<
  WalletId,
  React.ComponentType<{ className?: string }>
> = {
  freighter: FreighterIcon,
  albedo: AlbedoIcon,
  xbull: XBullIcon,
};

const WALLET_INSTALL_URLS: Record<WalletId, string> = {
  freighter: "https://www.freighter.app/",
  albedo: "https://albedo.link/",
  xbull: "https://xbull.app/",
};

// ─── Wallet Option Card ────────────────────────────────────────────────────────

function WalletCard({
  wallet,
  isSelected,
  isConnecting,
  onSelect,
}: {
  wallet: WalletDescriptor;
  isSelected: boolean;
  isConnecting: boolean;
  onSelect: (id: WalletId) => void;
}) {
  const Icon = WALLET_ICONS[wallet.id];
  const isLoading = isSelected && isConnecting;

  return (
    <button
      onClick={() => onSelect(wallet.id)}
      disabled={isConnecting}
      className={`group w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed ${
        isSelected && isConnecting
          ? "border-accent bg-accent/10"
          : "border-glass-border bg-glass hover:border-accent/50 hover:bg-glass-highlight"
      }`}
    >
      <div className="relative flex-shrink-0">
        <Icon className="h-10 w-10" />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/30">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-foreground">
            {wallet.name}
          </span>
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-accent/10 text-accent border border-accent/20 leading-none">
            {wallet.badge}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
          {wallet.description}
        </p>
      </div>

      <div className="flex-shrink-0">
        {isLoading ? (
          <span className="text-xs text-accent font-medium">Connecting…</span>
        ) : (
          <span className="text-xs text-muted-foreground group-hover:text-accent transition-colors">
            Connect →
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Main Modal ────────────────────────────────────────────────────────────────

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectWalletModal({
  isOpen,
  onClose,
}: ConnectWalletModalProps) {
  const {
    wallets,
    status,
    session,
    selectedWalletId,
    errorMessage,
    connect,
    disconnect,
    clearError,
  } = useWallet();

  const isConnecting = status === "connecting";
  const isConnected = status === "connected";
  const hasError = status === "error";

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isConnecting) onClose();
    },
    [isConnecting, onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // Auto-close after successful connection
  useEffect(() => {
    if (isConnected && isOpen) {
      const timer = setTimeout(onClose, 1500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (walletId: WalletId) => {
    clearError();
    connect(walletId);
  };

  const handleDisconnect = () => {
    disconnect();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={isConnecting ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="relative w-full max-w-md animate-in slide-in-from-bottom-4 fade-in-0 duration-300">
          <div className="rounded-2xl border border-glass-border bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-glass-border">
              <div>
                <h2
                  id="wallet-modal-title"
                  className="text-lg font-bold text-foreground"
                >
                  {isConnected ? "Wallet Connected" : "Connect Wallet"}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {isConnected
                    ? `Connected via ${session?.walletName}`
                    : "Select a wallet to connect to FlowFi"}
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={isConnecting}
                aria-label="Close modal"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-glass-highlight hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-3">
              {/* Error Banner */}
              {hasError && errorMessage && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-red-400 font-medium">
                      Connection failed
                    </p>
                    <p className="text-red-300/80 text-xs mt-0.5">
                      {errorMessage}
                    </p>
                  </div>
                  <button
                    onClick={clearError}
                    className="flex-shrink-0 text-red-400/60 hover:text-red-400 transition-colors text-xs"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Success State */}
              {isConnected && session && (
                <div className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/10 p-4">
                  <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {session.walletName}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {shortenPublicKey(session.publicKey)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {session.network}{" "}
                      {session.mocked && (
                        <span className="text-yellow-500">(Demo)</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="flex-shrink-0 text-xs text-muted-foreground hover:text-red-400 transition-colors border border-glass-border rounded-lg px-2 py-1"
                  >
                    Disconnect
                  </button>
                </div>
              )}

              {/* Wallet List */}
              {!isConnected && (
                <div className="space-y-2">
                  {wallets.map((wallet) => (
                    <WalletCard
                      key={wallet.id}
                      wallet={wallet}
                      isSelected={selectedWalletId === wallet.id}
                      isConnecting={isConnecting}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 pt-1">
              {!isConnected ? (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Don&apos;t have a wallet?</span>
                  <a
                    href={WALLET_INSTALL_URLS[selectedWalletId ?? "freighter"]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                  >
                    Install Freighter
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center">
                  Closing automatically…
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
