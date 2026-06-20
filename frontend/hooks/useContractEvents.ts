"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useWallet } from "@/context/wallet-context";

export interface ContractEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
  ledger: number;
  txHash: string;
}

export interface EventFilter {
  contractId: string;
  eventTypes?: string[];
  fromLedger?: number;
}

/**
 * Hook for listening to Soroban contract events
 * Useful for real-time updates on stream creation, withdrawals, etc.
 */
export function useContractEvents(filter: EventFilter) {
  const { session } = useWallet();
  const [events] = useState<ContractEvent[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  // Derive error from session state
  const error = !session ? "Wallet not connected" : null;

  useEffect(() => {
    if (!session) {
      return;
    }

    // TODO: Implement actual event listening using Stellar Horizon API
    // This should poll for new events or use WebSocket for real-time updates
    console.log("Starting event listener:", filter);

    // Mock event listener
    intervalRef.current = setInterval(() => {
      // Simulate receiving events
      console.log("Polling for events...");
    }, 5000);

    // Update listening state after setting up interval
    Promise.resolve().then(() => setIsListening(true));

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsListening(false);
    };
  }, [session, filter]);

  const stopListening = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsListening(false);
    }
  }, []);

  return {
    events,
    isListening,
    error,
    stopListening,
  };
}

export function useStreamEvents(contractId: string, streamId: string | null) {
  const filter = useMemo(
    () => ({
      contractId,
      eventTypes: ["stream_created", "tokens_withdrawn", "stream_cancelled", "stream_topped_up"],
    }),
    [contractId]
  );

  const { events, isListening, error } = useContractEvents(filter);

  const streamEvents = streamId
    ? events.filter(
        (event) =>
          event.data?.stream_id === streamId &&
          filter.eventTypes.includes(event.type)
      )
    : [];

  return {
    events: streamEvents,
    isListening,
    error,
  };
}
