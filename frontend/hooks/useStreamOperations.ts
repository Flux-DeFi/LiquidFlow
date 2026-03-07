"use client";

import { useCallback } from "react";
import { useContractCall } from "./useContractCall";
import { useWallet } from "@/context/wallet-context";

export interface CreateStreamParams {
  recipient: string;
  tokenAddress: string;
  amount: number;
  duration: number;
}

export interface WithdrawParams {
  streamId: string;
}

export interface TopUpParams {
  streamId: string;
  amount: number;
}

export interface CancelStreamParams {
  streamId: string;
}

/**
 * High-level hook for stream-specific contract operations
 * Provides convenient methods for create, withdraw, topUp, and cancel
 */
export function useStreamOperations(contractId: string) {
  const { session } = useWallet();
  const { invoke, isLoading, error } = useContractCall();

  const createStream = useCallback(
    async (params: CreateStreamParams, onSuccess?: (streamId: string) => void) => {
      if (!session) {
        throw new Error("Wallet not connected");
      }

      return invoke({
        contractId,
        method: "create_stream",
        args: [
          session.publicKey, // sender
          params.recipient,
          params.tokenAddress,
          params.amount,
          params.duration,
        ],
        onSuccess: (result) => {
          // Extract stream ID from result
          const resultData = result as { streamId?: string; hash?: string };
          const streamId = resultData?.streamId || resultData?.hash || "";
          onSuccess?.(streamId);
        },
      });
    },
    [contractId, invoke, session]
  );

  const withdraw = useCallback(
    async (params: WithdrawParams, onSuccess?: () => void) => {
      if (!session) {
        throw new Error("Wallet not connected");
      }

      return invoke({
        contractId,
        method: "withdraw",
        args: [session.publicKey, params.streamId],
        onSuccess,
      });
    },
    [contractId, invoke, session]
  );

  const topUp = useCallback(
    async (params: TopUpParams, onSuccess?: () => void) => {
      if (!session) {
        throw new Error("Wallet not connected");
      }

      return invoke({
        contractId,
        method: "top_up_stream",
        args: [session.publicKey, params.streamId, params.amount],
        onSuccess,
      });
    },
    [contractId, invoke, session]
  );

  const cancelStream = useCallback(
    async (params: CancelStreamParams, onSuccess?: () => void) => {
      if (!session) {
        throw new Error("Wallet not connected");
      }

      return invoke({
        contractId,
        method: "cancel_stream",
        args: [session.publicKey, params.streamId],
        onSuccess,
      });
    },
    [contractId, invoke, session]
  );

  return {
    createStream,
    withdraw,
    topUp,
    cancelStream,
    isLoading,
    error,
  };
}
