"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@/context/wallet-context";

export interface QueryOptions {
  contractId: string;
  method: string;
  args?: unknown[];
  enabled?: boolean;
  refetchInterval?: number;
}

export interface QueryState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for querying Soroban contract state (read-only operations)
 * Supports automatic refetching and caching
 */
export function useContractQuery<T = unknown>(options: QueryOptions): QueryState<T> {
  const { session } = useWallet();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!session || options.enabled === false) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement actual contract query using stellar-sdk
      // This should simulate the contract call without submitting a transaction
      console.log("Querying contract:", {
        contract: options.contractId,
        method: options.method,
        args: options.args,
      });

      // Mock data for now
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockData = { success: true, result: null } as T;
      setData(mockData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Query failed";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [session, options.contractId, options.method, options.args, options.enabled]);

  useEffect(() => {
    fetchData();

    if (options.refetchInterval && options.refetchInterval > 0) {
      const interval = setInterval(fetchData, options.refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, options.refetchInterval]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
