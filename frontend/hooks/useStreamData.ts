"use client";

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

/**
 * Hook for fetching stream data from the contract
 * Automatically refetches when stream ID or contract changes
 */
export function useStreamData(contractId: string, streamId: string | null) {
  const { session } = useWallet();

  const { data, isLoading, error, refetch } = useContractQuery<StreamData>({
    contractId,
    method: "get_stream",
    args: streamId ? [streamId] : undefined,
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

  const { data, isLoading, error, refetch } = useContractQuery<StreamData[]>({
    contractId,
    method: type === "incoming" ? "get_incoming_streams" : "get_outgoing_streams",
    args: session ? [session.publicKey] : undefined,
    enabled: !!session,
    refetchInterval: options?.refetchInterval,
  });

  return {
    streams: data || [],
    isLoading,
    error,
    refetch,
  };
}
