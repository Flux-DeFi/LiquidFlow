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

## Error Handling Convention

All hooks in this module follow a consistent error-handling pattern so that consumers can handle failures uniformly, regardless of which hook produced the error.

### Common Error Shape

Every hook returns an `error` field with the shape `string | null`:

- **`null`** — no error; the last operation succeeded or hasn't run yet.
- **`string`** — a human-readable error message describing what went wrong.

| Hook | Error field type | Notes |
|:---|:---|:---|
| `useSorobanTransaction` | `error?: string` | Error is `undefined` when `status === "idle"` or `"success"` |
| `useContractCall` | `error: string \| null` | Delegates to `useSorobanTransaction` |
| `useContractQuery` | `error: string \| null` | Catches errors from `simulateContractQuery` |
| `useWalletBalance` | `error: string \| null` | Catches errors from balance fetch |
| `useAllBalances` | `error: string \| null` | Catches errors from multi-balance fetch |
| `useStreamOperations` | `error: string \| null` | Delegates to `useContractCall` |
| `useStreamData` | `error: string \| null` | Delegates to `useContractQuery` |
| `useUserStreams` | `error: string \| null` | Delegates to `useContractQuery` |

### Error Message Origin

Error messages are produced by the same pattern throughout:

```typescript
catch (err) {
  const errorMessage = err instanceof Error ? err.message : "Fallback message";
  setError(errorMessage);
}
```

This means:
- If the thrown value is an `Error` instance, its `.message` is used.
- Otherwise a static fallback string is used (e.g. `"Query failed"`, `"Transaction failed"`, `"Failed to fetch balance"`).
- Error messages are **never structured objects** — they are always plain strings.

### Consumer Guidelines

When consuming a hook, always render the error state:

```tsx
const { data, isLoading, error } = useContractQuery({ ... });

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} />;
// render data ...
```

The `examples.tsx` file in this directory shows concrete usage for every hook, including
error rendering (see `CreateStreamExample`, `OutgoingStreamsExample`, and others).

### Clearing Errors

- **Data hooks** (`useContractQuery`, `useWalletBalance`, `useAllBalances`): errors are cleared automatically when the next fetch starts (`setError(null)` in the fetch callback).
- **Transaction hooks** (`useSorobanTransaction`, `useContractCall`): call the `reset()` function returned by `useSorobanTransaction` to clear the error state. `useContractCall` does not expose `reset` directly — consumers should reset at the lower level if needed.
- **`useStreamOperations`**: errors are inherited from `useContractCall` and are cleared on the next `invoke` call.

### Loading State Convention

All hooks expose `isLoading: boolean` that is `true` while an async operation is in flight.
The `examples.tsx` file demonstrates the standard loading → error → data rendering pattern.

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