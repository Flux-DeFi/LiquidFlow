"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@/context/wallet-context";
import { useSorobanTransaction } from "./useSorobanTransaction";

export interface ContractCallOptions {
  contractId: string;
  method: string;
  args?: unknown[];
  onSuccess?: (result: unknown) => void;
  onError?: (error: string) => void;
}

export interface ContractCallState {
  data: unknown;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for invoking Soroban smart contract methods
 * Abstracts transaction building and contract invocation
 */
export function useContractCall() {
  const { session } = useWallet();
  const { executeTransaction, status, error: txError } = useSorobanTransaction();
  const [data, setData] = useState<unknown>(null);

  const invoke = useCallback(
    async (options: ContractCallOptions) => {
      if (!session) {
        throw new Error("Wallet not connected");
      }

      const buildTransaction = async () => {
        // TODO: Build Soroban contract invocation transaction
        // This will use stellar-sdk to create the transaction
        console.log("Building contract call:", {
          contract: options.contractId,
          method: options.method,
          args: options.args,
          caller: session.publicKey,
        });

        return {
          contractId: options.contractId,
          method: options.method,
          args: options.args,
        };
      };

      const result = await executeTransaction(buildTransaction, {
        onSuccess: (hash) => {
          // TODO: Parse contract call result from transaction
          const mockResult = { success: true, hash };
          setData(mockResult);
          options.onSuccess?.(mockResult);
        },
        onError: options.onError,
      });

      return result;
    },
    [session, executeTransaction]
  );

  return {
    invoke,
    data,
    isLoading: status === "building" || status === "signing" || status === "submitting",
    error: txError,
  };
}
