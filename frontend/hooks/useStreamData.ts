"use client";

import { useMemo } from "react";
import { useContractQuery } from "./useContractQuery";
import { useWallet } from "@/context/wallet-context";

export interface StreamData {
  id: string;
  sender: string;
  recipient: string;
  tokenAddress: string;
  ratePerSecond: number;
  depositedAmount: number;
  withdrawnAmount: number;
  startTime: number;
  lastUpdateTime: number;
  isActive: boolean;
}

// Shared empty result so consumers never see a new array identity per render.
const NO_STREAMS: StreamData[] = [];

/**
 * Hook for fetching stream data from the contract
 * Automatically refetches when stream ID or contract changes
 */
export function useStreamData(contractId: string, streamId: string | null) {
  const { session } = useWallet();

  // Memoize args array so its identity is stable across renders when streamId
  // hasn't changed, preventing the useContractQuery effect from re-running.
  const args = useMemo(
    () => (streamId ? [streamId] : undefined),
    [streamId],
  );

  const { data, isLoading, error, refetch } = useContractQuery<StreamData>({
    contractId,
    method: "get_stream",
    args,
    enabled: !!session && !!streamId,
  });

  return {
    stream: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for fetching multiple streams for a user
 * Can fetch incoming or outgoing streams
 */
export function useUserStreams(
  contractId: string,
  type: "incoming" | "outgoing" = "outgoing",
  options?: { refetchInterval?: number }
) {
  const { session } = useWallet();
  const publicKey = session?.publicKey ?? null;

  const args = useMemo(() => (publicKey ? [publicKey] : undefined), [publicKey]);

  // Memoize args array to prevent useContractQuery from re-fetching on every
  // render when session.publicKey hasn't changed.
  const args = useMemo(
    () => (session ? [session.publicKey] : undefined),
    [session?.publicKey],
  );

  const { data, isLoading, error, refetch } = useContractQuery<StreamData[]>({
    contractId,
    method: type === "incoming" ? "get_incoming_streams" : "get_outgoing_streams",
    args,
    enabled: !!session,
    refetchInterval: options?.refetchInterval,
  });

  const streams = useMemo(() => data ?? NO_STREAMS, [data]);

  return {
    streams,
    isLoading,
    error,
    refetch,
  };
}
