"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "@/context/wallet-context";

export interface TokenBalance {
  asset: string;
  balance: string;
  decimals: number;
}

/** Default maximum backoff interval (30 seconds). */
const MAX_BACKOFF_MS = 30_000;

/**
 * Calculates exponential backoff delay capped at MAX_BACKOFF_MS.
 * Uses `1 << n` (bit-shift) for the 2ⁿ multiplier — faster than Math.pow(2, n).
 */
function backoffDelay(baseMs: number, consecutiveFailures: number): number {
  if (consecutiveFailures <= 0) return baseMs;
  const multiplier = consecutiveFailures < 31 ? 1 << consecutiveFailures : Infinity;
  return Math.min(baseMs * multiplier, MAX_BACKOFF_MS);
}

/**
 * Factory that creates a polling loop driven by recursive setTimeout.
 *
 * Returns a `start` function the caller invokes in its effect, and a `stop`
 * function the caller invokes in its effect cleanup.
 *
 * Every poll tick calls `fetchFn`.  On success the failure count resets to
 * zero; on failure it increments by one.  The delay for the next tick is
 * `baseInterval × 2^failures` capped at `MAX_BACKOFF_MS`.
 */
function createPollLoop(
  fetchFn: () => Promise<void>,
  baseInterval: number,
  failureCountRef: { current: number },
) {
  let active = true;
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  function tick() {
    if (!active) return;
    const delay = backoffDelay(baseInterval, failureCountRef.current);
    timeoutHandle = setTimeout(async () => {
      if (!active) return;
      try {
        await fetchFn();
        failureCountRef.current = 0;
      } catch {
        failureCountRef.current += 1;
      }
      tick();
    }, delay);
  }

  return {
    start() {
      tick();
    },
    stop() {
      active = false;
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle);
        timeoutHandle = null;
      }
    },
  };
}

/**
 * Hook for fetching wallet token balances
 * Supports both native XLM and custom Stellar assets
 *
 * On repeated fetch failures, the polling interval backs off exponentially
 * (capped at 30 seconds) so the hook does not hammer the RPC node when it
 * is temporarily unreachable.
 */
export function useWalletBalance(tokenAddress?: string, refetchInterval?: number) {
  const { session } = useWallet();
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const consecutiveFailures = useRef(0);

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
      throw err; // Re-throw so the poll scheduler can count failures
    } finally {
      setIsLoading(false);
    }
  }, [session, tokenAddress]);

  useEffect(() => {
    // Initial fetch
    fetchBalance();

    // Start polling loop with exponential backoff
    if (refetchInterval && refetchInterval > 0) {
      const loop = createPollLoop(fetchBalance, refetchInterval, consecutiveFailures);
      loop.start();
      return () => loop.stop();
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
 *
 * On repeated fetch failures, the polling interval backs off exponentially
 * (capped at 30 seconds) so the hook does not hammer the RPC node when it
 * is temporarily unreachable.
 */
export function useAllBalances(refetchInterval?: number) {
  const { session } = useWallet();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const consecutiveFailures = useRef(0);

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
      throw err; // Re-throw so the poll scheduler can count failures
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    // Initial fetch
    fetchBalances();

    // Start polling loop with exponential backoff
    if (refetchInterval && refetchInterval > 0) {
      const loop = createPollLoop(fetchBalances, refetchInterval, consecutiveFailures);
      loop.start();
      return () => loop.stop();
    }
  }, [fetchBalances, refetchInterval]);

  return {
    balances,
    isLoading,
    error,
    refetch: fetchBalances,
  };
}