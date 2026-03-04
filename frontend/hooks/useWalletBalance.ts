"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@/context/wallet-context";

export interface TokenBalance {
  asset: string;
  balance: string;
  decimals: number;
}

/**
 * Hook for fetching wallet token balances
 * Supports both native XLM and custom Stellar assets
 */
export function useWalletBalance(tokenAddress?: string, refetchInterval?: number) {
  const { session } = useWallet();
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!session) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement actual balance fetching using Stellar Horizon API
      // This should query the account balances
      console.log("Fetching balance for:", {
        publicKey: session.publicKey,
        token: tokenAddress || "XLM",
      });

      // Mock balance
      await new Promise((resolve) => setTimeout(resolve, 300));
      const mockBalance = "1000.00";
      setBalance(mockBalance);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch balance";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [session, tokenAddress]);

  useEffect(() => {
    fetchBalance();

    if (refetchInterval && refetchInterval > 0) {
      const interval = setInterval(fetchBalance, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchBalance, refetchInterval]);

  return {
    balance,
    isLoading,
    error,
    refetch: fetchBalance,
  };
}

/**
 * Hook for fetching all token balances for the connected wallet
 */
export function useAllBalances(refetchInterval?: number) {
  const { session } = useWallet();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!session) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement actual balance fetching using Stellar Horizon API
      console.log("Fetching all balances for:", session.publicKey);

      // Mock balances
      await new Promise((resolve) => setTimeout(resolve, 300));
      const mockBalances: TokenBalance[] = [
        { asset: "XLM", balance: "1000.00", decimals: 7 },
        { asset: "USDC", balance: "500.00", decimals: 7 },
      ];
      setBalances(mockBalances);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch balances";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchBalances();

    if (refetchInterval && refetchInterval > 0) {
      const interval = setInterval(fetchBalances, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchBalances, refetchInterval]);

  return {
    balances,
    isLoading,
    error,
    refetch: fetchBalances,
  };
}
