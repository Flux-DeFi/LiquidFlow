"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

  const { contractId, method, enabled, refetchInterval } = options;

  // Callers pass their arguments inline (`args: streamId ? [streamId] : undefined`),
  // so the array is a new object on every render. Keying on the serialized value
  // instead of the array identity keeps `fetchData` stable for unchanged inputs.
  const args = useStableIdentity(options.args);

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
  }, [session, contractId, method, args, enabled]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // The interval reads the current fetcher through a ref so the timer is only
  // rebuilt when the schedule itself changes, never because an unrelated
  // render produced a new `fetchData`.
  const fetchDataRef = useRef(fetchData);

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
