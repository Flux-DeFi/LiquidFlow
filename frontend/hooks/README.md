
## Error Handling Conventions

All hooks in this package share a consistent error-handling pattern. Consumers should rely on this convention rather than building ad-hoc error handling.

### Common Error Shape

Every hook exposes an `error` field with the following contract:

```typescript
error: string | null
```

- **`null`** — the operation has not failed (it may still be loading or idle).
- **`string`** — a human-readable error message describing what went wrong.

### How Errors Are Produced

1. **Transaction hooks** (`useSorobanTransaction`, `useContractCall`, `useStreamOperations`)  
   Errors are caught by a `try / catch` block around the full transaction lifecycle (build → sign → submit). The caught exception is normalised with:
   ```typescript
   const errorMessage = error instanceof Error ? error.message : "Transaction failed";
   ```
   This means you will receive the original `Error` message when available, or a safe fallback otherwise.

2. **Query hooks** (`useContractQuery`, `useStreamData`, `useWalletBalance`)  
   Errors are caught during the async fetch/simulate phase and normalised the same way. The `error` state is reset to `null` at the start of every new fetch, so stale errors do not persist across refetches.

3. **Wallet-not-connected guard**  
   When the user has not connected a wallet, transaction hooks short-circuit immediately with:
   ```typescript
   error: "Wallet not connected"
   ```

### Recommended Consumer Pattern

Check `error` after `isLoading` becomes `false`:

```typescript
const { data, isLoading, error } = useContractQuery({ ... });

if (isLoading) return <Spinner />;
if (error)   return <Alert variant="error">{error}</Alert>;
return <DataView data={data} />;
```

For mutating hooks, render the error inline near the triggering control so the user can retry:

```typescript
const { invoke, isLoading, error } = useContractCall();

return (
  <form onSubmit={handleSubmit}>
    {/* form fields */}
    <button type="submit" disabled={isLoading}>
      {isLoading ? "Submitting…" : "Submit"}
    </button>
    {error && <p className="error-text">{error}</p>}
  </form>
);
```

### Do Not

- Do **not** parse `error` strings to branch on error types. The message is intended for display only. If you need programmatic error discrimination, open an issue to discuss typed error wrappers.
- Do **not** ignore the `error` field. Always surface it in the UI or log it for debugging.

### Examples

See `frontend/hooks/examples.tsx` for a complete component demonstrating error handling with `useStreamOperations` and `useContractQuery`.
# Soroban Contract Interaction Hooks

Custom React hooks for interacting with Soroban smart contracts on the Stellar network. These hooks abstract complex transaction building, signing, and contract invocations into reusable, type-safe interfaces.

## Overview

This collection provides a complete toolkit for building Stellar/Soroban dApps with React:

- **Transaction Management**: Build, sign, and submit transactions
- **Contract Queries**: Read contract state without submitting transactions
- **Contract Calls**: Invoke contract methods with proper state management
- **Stream Operations**: High-level operations for payment streaming
- **Event Listening**: Real-time contract event monitoring
- **Balance Tracking**: Fetch and monitor wallet balances

## Hooks

### Core Hooks

#### `useSorobanTransaction`
Low-level hook for building, signing, and submitting Stellar/Soroban transactions.

```typescript
const { executeTransaction, status, hash, error, isLoading } = useSorobanTransaction();

await executeTransaction(
  async () => buildMyTransaction(),
  {
    onSuccess: (hash) => console.log("Transaction submitted:", hash),
    onError: (error) => console.error("Transaction failed:", error),
  }
);
```

#### `useContractQuery`
Query contract state (read-only operations) with automatic refetching.

```typescript
const { data, isLoading, error, refetch } = useContractQuery({
  contractId: "CCONTRACT...",
  method: "get_stream",
  args: [streamId],
  enabled: true,
  refetchInterval: 5000, // Refetch every 5 seconds
});
```

`args` is keyed by its serialized value rather than by array identity, so passing
a fresh array literal on every render does not retrigger the query. The fetcher
returned as `refetch` keeps a stable identity for unchanged inputs, and a
`refetchInterval` timer is created once instead of being rebuilt per render.

#### `useContractCall`
Invoke contract methods that modify state.

```typescript
const { invoke, data, isLoading, error } = useContractCall();

await invoke({
  contractId: "CCONTRACT...",
  method: "create_stream",
  args: [sender, recipient, amount, duration],
  onSuccess: (result) => console.log("Stream created:", result),
});
```

### Stream-Specific Hooks

#### `useStreamOperations`
High-level operations for payment streaming contracts.

```typescript
const { createStream, withdraw, topUp, cancelStream, isLoading, error } = 
  useStreamOperations("CCONTRACT...");

// Create a new stream
await createStream({
  recipient: "GRECIPIENT...",
  tokenAddress: "CTOKEN...",
  amount: 1000,
  duration: 86400, // 24 hours
}, (streamId) => {
  console.log("Stream created with ID:", streamId);
});

// Withdraw from stream
await withdraw({ streamId: "123" });

// Top up existing stream
await topUp({ streamId: "123", amount: 500 });

// Cancel stream
await cancelStream({ streamId: "123" });
```

#### `useStreamData`
Fetch individual stream data from the contract.

```typescript
const { stream, isLoading, error, refetch } = useStreamData(
  "CCONTRACT...",
  streamId
);

// stream contains: sender, recipient, amount, status, etc.
```

#### `useUserStreams`
Fetch all streams for the connected user.

```typescript
const { streams, isLoading, error, refetch } = useUserStreams(
  "CCONTRACT...",
  "outgoing", // or "incoming"
  { refetchInterval: 10000 }
);
```

### Balance Hooks

#### `useWalletBalance`
Fetch balance for a specific token.

```typescript
const { balance, isLoading, error, refetch } = useWalletBalance(
  "CTOKEN...", // Optional: omit for XLM
  5000 // Refetch interval
);
```

#### `useAllBalances`
Fetch all token balances for the connected wallet.

```typescript
const { balances, isLoading, error, refetch } = useAllBalances(5000);

// balances: [{ asset: "XLM", balance: "1000.00", decimals: 7 }, ...]
```

### Event Hooks

#### `useContractEvents`
Listen to contract events in real-time.

```typescript
const { events, isListening, error, stopListening } = useContractEvents({
  contractId: "CCONTRACT...",
  eventTypes: ["stream_created", "tokens_withdrawn"],
  fromLedger: 12345,
});
```

#### `useStreamEvents`
Listen to events for a specific stream.

```typescript
const { events, isListening, error } = useStreamEvents(
  "CCONTRACT...",
  streamId
);
```

## Usage Example

```typescript
"use client";

import { useStreamOperations, useUserStreams } from "@/hooks";

export function StreamDashboard() {
  const { createStream, isLoading } = useStreamOperations("CCONTRACT...");
  const { streams, refetch } = useUserStreams("CCONTRACT...", "outgoing");

  const handleCreateStream = async () => {
    await createStream({
      recipient: "GRECIPIENT...",
      tokenAddress: "CTOKEN...",
      amount: 1000,
      duration: 86400,
    }, () => {
      refetch(); // Refresh stream list
    });
  };

  return (
    <div>
      <button onClick={handleCreateStream} disabled={isLoading}>
        Create Stream
      </button>
      <ul>
        {streams.map((stream) => (
          <li key={stream.id}>{stream.recipient}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Implementation Status

⚠️ **Current Status**: These hooks provide the interface and state management layer. The actual Stellar SDK integration is marked with TODO comments and needs to be implemented:

1. Install `@stellar/stellar-sdk` package
2. Implement transaction building in `useSorobanTransaction`
3. Integrate Freighter API for transaction signing
4. Implement Horizon API calls for queries and balance fetching
5. Set up event streaming/polling

## Next Steps

1. Add Stellar SDK dependency: `npm install @stellar/stellar-sdk`
2. Configure network settings (Testnet/Mainnet)
3. Implement transaction builders for each contract method
4. Add proper error handling and retry logic
5. Implement event polling or WebSocket connections
6. Add transaction simulation before submission
7. Implement proper caching and state management

## Architecture

These hooks follow a layered architecture:

```
High-Level Hooks (useStreamOperations, useUserStreams)
         ↓
Mid-Level Hooks (useContractCall, useContractQuery)
         ↓
Low-Level Hook (useSorobanTransaction)
         ↓
Stellar SDK + Wallet Integration
```

This design allows for:
- Easy testing and mocking
- Gradual implementation of features
- Flexibility to swap underlying implementations
- Type-safe interfaces throughout
