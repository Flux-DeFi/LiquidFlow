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
