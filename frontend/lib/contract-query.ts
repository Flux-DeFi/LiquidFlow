export interface ContractQueryRequest {
  contractId: string;
  method: string;
  args?: unknown[];
}

/**
 * Read-only transport for Soroban contract state.
 *
 * Kept separate from `useContractQuery` so the hook's fetch behaviour can be
 * observed in tests without reaching for the network, and so the real
 * implementation lands in one place.
 */
export async function simulateContractQuery<T = unknown>(
  request: ContractQueryRequest
): Promise<T> {
  // TODO: Implement actual contract query using stellar-sdk
  // This should simulate the contract call without submitting a transaction
  console.log("Querying contract:", {
    contract: request.contractId,
    method: request.method,
    args: request.args,
  });

  // Mock data for now
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { success: true, result: null } as T;
}
