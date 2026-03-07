"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@/context/wallet-context";

export type TransactionStatus = "idle" | "building" | "signing" | "submitting" | "success" | "error";

export interface TransactionState {
  status: TransactionStatus;
  hash?: string;
  error?: string;
}

export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
}

/**
 * Hook for building, signing, and submitting Stellar/Soroban transactions
 * Handles the complete transaction lifecycle with proper state management
 */
export function useSorobanTransaction() {
  const { session } = useWallet();
  const [state, setState] = useState<TransactionState>({ status: "idle" });

  const executeTransaction = useCallback(
    async (
      buildTransaction: () => Promise<unknown>,
      options?: { onSuccess?: (hash: string) => void; onError?: (error: string) => void }
    ): Promise<TransactionResult> => {
      if (!session) {
        const error = "Wallet not connected";
        setState({ status: "error", error });
        options?.onError?.(error);
        return { success: false, error };
      }

      try {
        setState({ status: "building" });
        await buildTransaction();

        setState({ status: "signing" });
        // TODO: Integrate with Freighter API for signing
        // const signedTx = await window.freighterApi.signTransaction(transaction);

        setState({ status: "submitting" });
        // TODO: Submit to Stellar network
        // const result = await submitTransaction(signedTx);

        // Mock success for now
        const mockHash = `mock_tx_${Date.now()}`;
        setState({ status: "success", hash: mockHash });
        options?.onSuccess?.(mockHash);

        return { success: true, hash: mockHash };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Transaction failed";
        setState({ status: "error", error: errorMessage });
        options?.onError?.(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [session]
  );

  const reset = useCallback(() => {
    setState({ status: "idle" });
  }, []);

  return {
    ...state,
    executeTransaction,
    reset,
    isLoading: state.status === "building" || state.status === "signing" || state.status === "submitting",
  };
}
