"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useWallet } from "@/context/wallet-context";
import { simulateContractQuery } from "@/lib/contract-query";
import { useStableIdentity } from "./useStableIdentity";

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

  // Derive a stable serialization key from args so that a functionally identical
  // array (e.g. [streamId] recreated on each render) does not change the identity
  // of fetchData and trigger the effect on every commit.
  const argsKey = useMemo(
    () => JSON.stringify(options.args ?? []),
    [options.args],
  );

  const fetchData = useCallback(async () => {
    if (!session || enabled === false) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await simulateContractQuery<T>({ contractId, method, args });
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Query failed";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [session, options.contractId, options.method, options.enabled, options.args]);

  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    if (!session || enabled === false || !refetchInterval || refetchInterval <= 0) {
      return;
    }

    const interval = setInterval(() => {
      void fetchDataRef.current();
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [session, enabled, refetchInterval]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
