/**
 * Example usage of Soroban contract hooks
 * These examples demonstrate how to use the custom hooks in React components
 */

"use client";

import { useState } from "react";
import {
  useStreamOperations,
  useUserStreams,
  useStreamData,
  useWalletBalance,
  useContractEvents,
} from "@/hooks";

// Example 1: Create a new payment stream
export function CreateStreamExample() {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const { createStream, isLoading, error } = useStreamOperations("CCONTRACT_ID");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createStream(
      {
        recipient,
        tokenAddress: "CUSDC_TOKEN_ADDRESS",
        amount: parseFloat(amount),
        duration: 86400, // 24 hours
      },
      (streamId) => {
        console.log("Stream created successfully:", streamId);
        alert(`Stream created with ID: ${streamId}`);
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Recipient address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Stream"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}

// Example 2: Display user's outgoing streams
export function OutgoingStreamsExample() {
  const { streams, isLoading, error, refetch } = useUserStreams(
    "CCONTRACT_ID",
    "outgoing",
    { refetchInterval: 10000 } // Auto-refresh every 10 seconds
  );

  if (isLoading) return <div>Loading streams...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>My Outgoing Streams</h2>
      <button onClick={refetch}>Refresh</button>
      <ul>
        {streams.map((stream) => (
          <li key={stream.id}>
            To: {stream.recipient} | Amount: {stream.depositedAmount} | Status:{" "}
            {stream.isActive ? "Active" : "Inactive"}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Example 3: Stream detail view with withdraw functionality
export function StreamDetailExample({ streamId }: { streamId: string }) {
  const { stream, isLoading, error } = useStreamData("CCONTRACT_ID", streamId);
  const { withdraw, isLoading: isWithdrawing } = useStreamOperations("CCONTRACT_ID");

  const handleWithdraw = async () => {
    await withdraw({ streamId }, () => {
      alert("Withdrawal successful!");
    });
  };

  if (isLoading) return <div>Loading stream...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!stream) return <div>Stream not found</div>;

  const availableToWithdraw = stream.depositedAmount - stream.withdrawnAmount;

  return (
    <div>
      <h2>Stream Details</h2>
      <p>Sender: {stream.sender}</p>
      <p>Recipient: {stream.recipient}</p>
      <p>Deposited: {stream.depositedAmount}</p>
      <p>Withdrawn: {stream.withdrawnAmount}</p>
      <p>Available: {availableToWithdraw}</p>
      <p>Status: {stream.isActive ? "Active" : "Inactive"}</p>
      <button onClick={handleWithdraw} disabled={isWithdrawing || !stream.isActive}>
        {isWithdrawing ? "Withdrawing..." : "Withdraw"}
      </button>
    </div>
  );
}

// Example 4: Display wallet balance
export function WalletBalanceExample() {
  const { balance, isLoading, error } = useWalletBalance("CUSDC_TOKEN_ADDRESS", 5000);

  if (isLoading) return <div>Loading balance...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h3>USDC Balance</h3>
      <p>{balance || "0.00"} USDC</p>
    </div>
  );
}

// Example 5: Top up an existing stream
export function TopUpStreamExample({ streamId }: { streamId: string }) {
  const [amount, setAmount] = useState("");
  const { topUp, isLoading, error } = useStreamOperations("CCONTRACT_ID");

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();

    await topUp(
      {
        streamId,
        amount: parseFloat(amount),
      },
      () => {
        alert("Stream topped up successfully!");
        setAmount("");
      }
    );
  };

  return (
    <form onSubmit={handleTopUp}>
      <h3>Top Up Stream</h3>
      <input
        type="number"
        placeholder="Amount to add"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Processing..." : "Top Up"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}

// Example 6: Cancel a stream
export function CancelStreamExample({ streamId }: { streamId: string }) {
  const { cancelStream, isLoading, error } = useStreamOperations("CCONTRACT_ID");

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this stream?")) {
      return;
    }

    await cancelStream({ streamId }, () => {
      alert("Stream cancelled successfully!");
    });
  };

  return (
    <div>
      <button onClick={handleCancel} disabled={isLoading} style={{ color: "red" }}>
        {isLoading ? "Cancelling..." : "Cancel Stream"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

// Example 7: Listen to contract events
export function ContractEventsExample() {
  const { events, isListening } = useContractEvents({
    contractId: "CCONTRACT_ID",
    eventTypes: ["stream_created", "tokens_withdrawn"],
  });

  return (
    <div>
      <h3>Recent Events</h3>
      <p>Status: {isListening ? "Listening..." : "Not listening"}</p>
      <ul>
        {events.map((event, index) => (
          <li key={index}>
            {event.type} - {new Date(event.timestamp).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Example 8: Complete dashboard combining multiple hooks
export function CompleteDashboardExample() {
  const { streams: outgoing } = useUserStreams("CCONTRACT_ID", "outgoing");
  const { streams: incoming } = useUserStreams("CCONTRACT_ID", "incoming");
  const { balance } = useWalletBalance("CUSDC_TOKEN_ADDRESS");
  const { events } = useContractEvents({
    contractId: "CCONTRACT_ID",
    eventTypes: ["stream_created", "tokens_withdrawn"],
  });

  return (
    <div>
      <h1>Stream Dashboard</h1>

      <section>
        <h2>Balance</h2>
        <p>{balance || "0.00"} USDC</p>
      </section>

      <section>
        <h2>Outgoing Streams ({outgoing.length})</h2>
        <ul>
          {outgoing.map((stream) => (
            <li key={stream.id}>
              {stream.recipient} - {stream.depositedAmount}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Incoming Streams ({incoming.length})</h2>
        <ul>
          {incoming.map((stream) => (
            <li key={stream.id}>
              {stream.sender} - {stream.depositedAmount}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Recent Activity</h2>
        <ul>
          {events.slice(0, 5).map((event, index) => (
            <li key={index}>{event.type}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
