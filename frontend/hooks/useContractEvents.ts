"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useWallet } from "@/context/wallet-context";
import { useStableIdentity } from "./useStableIdentity";

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
export function useContractEvents(eventFilter: EventFilter) {
  const { session } = useWallet();
  const [events] = useState<ContractEvent[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Filters are usually written inline at the call site, so the object identity
  // changes on every render. Keying on the serialized filter stops the listener
  // from being torn down and recreated on every commit.
  const filter = useStableIdentity(eventFilter);

  // Derive error from session state
  const error = !session ? "Wallet not connected" : null;

  // Use a stable key for the filter object so an inline object identity
  // change does not trigger the effect on every render.
  const filterKey = useMemo(
    () => JSON.stringify(filter),
    [filter],
  );

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
  }, [session, filterKey, filter]);

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

const STREAM_EVENT_TYPES = [
  "stream_created",
  "tokens_withdrawn",
  "stream_cancelled",
  "stream_topped_up",
];

export function useStreamEvents(contractId: string, streamId: string | null) {
  const filter = useMemo(
    () => ({
      contractId,
      eventTypes: STREAM_EVENT_TYPES,
    }),
    [contractId]
  );

  const { events, isListening, error } = useContractEvents(filter);

  const streamEvents = useMemo(
    () =>
      streamId
        ? events.filter(
            (event: ContractEvent) =>
              event.data?.stream_id === streamId &&
              STREAM_EVENT_TYPES.includes(event.type)
          )
        : [],
    [events, streamId]
  );

  return {
    events: streamEvents,
    isListening,
    error,
  };
}
