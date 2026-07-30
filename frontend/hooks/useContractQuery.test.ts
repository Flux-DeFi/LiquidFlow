/**
 * @vitest-environment jsdom
 *
 * Regression coverage for the refetch loop described in issue #153: callers
 * pass their query arguments inline, so an identity-based dependency made
 * `fetchData` — and every effect keyed on it — change on every commit.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { flush, renderHook } from "./testing/renderHook";
import { stableKey } from "./useStableIdentity";
import { useStreamData, useUserStreams } from "./useStreamData";
import { useContractEvents } from "./useContractEvents";

const CONTRACT_ID = "CCONTRACT_ID";

const { simulateContractQuery, PUBLIC_KEY, walletValue } = vi.hoisted(() => {
  const publicKey = "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ";

  return {
    simulateContractQuery: vi.fn(),
    PUBLIC_KEY: publicKey,
    walletValue: {
      session: {
        walletId: "freighter",
        walletName: "Freighter",
        publicKey,
        connectedAt: "2026-01-01T00:00:00.000Z",
        network: "Stellar Testnet",
        mocked: true,
      },
    },
  };
});

vi.mock("@/lib/contract-query", () => ({ simulateContractQuery }));
vi.mock("@/context/wallet-context", () => ({ useWallet: () => walletValue }));

const QUERY_RESULT = { success: true, result: null };

beforeEach(() => {
  simulateContractQuery.mockReset();
  simulateContractQuery.mockResolvedValue(QUERY_RESULT);
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/** setInterval calls made with a specific delay, ignoring unrelated timers. */
function intervalsScheduled(calls: readonly unknown[][], delay: number) {
  return calls.filter((call) => call[1] === delay).length;
}

describe("useContractQuery argument stability", () => {
  it("fetches exactly once when useUserStreams mounts with a stable input", async () => {
    const view = renderHook(() => useUserStreams(CONTRACT_ID), undefined);
    await flush();

    expect(simulateContractQuery).toHaveBeenCalledTimes(1);
    expect(simulateContractQuery).toHaveBeenCalledWith({
      contractId: CONTRACT_ID,
      method: "get_outgoing_streams",
      args: [PUBLIC_KEY],
    });

    // Once the initial fetch has settled the hook must be at rest: no further
    // renders, and therefore no further effect runs.
    const settledRenderCount = view.renderCount;
    await flush();
    await flush();

    expect(view.renderCount).toBe(settledRenderCount);
    expect(simulateContractQuery).toHaveBeenCalledTimes(1);

    view.unmount();
  });

  it("does not refetch when the caller re-renders with unchanged inputs", async () => {
    const view = renderHook(() => useUserStreams(CONTRACT_ID), undefined);
    await flush();
    expect(simulateContractQuery).toHaveBeenCalledTimes(1);

    const { refetch, streams } = view.result.current;

    for (let i = 0; i < 5; i += 1) {
      view.rerender();
    }
    await flush();

    expect(simulateContractQuery).toHaveBeenCalledTimes(1);
    // A stable fetcher identity is what keeps the effects from re-running.
    expect(view.result.current.refetch).toBe(refetch);
    expect(view.result.current.streams).toBe(streams);

    view.unmount();
  });

  it("refetches once per genuine argument change", async () => {
    const view = renderHook(
      (streamId: string | null) => useStreamData(CONTRACT_ID, streamId),
      "stream-1" as string | null
    );
    await flush();
    expect(simulateContractQuery).toHaveBeenCalledTimes(1);

    view.rerender("stream-1");
    await flush();
    expect(simulateContractQuery).toHaveBeenCalledTimes(1);

    view.rerender("stream-2");
    await flush();
    expect(simulateContractQuery).toHaveBeenCalledTimes(2);
    expect(simulateContractQuery).toHaveBeenLastCalledWith({
      contractId: CONTRACT_ID,
      method: "get_stream",
      args: ["stream-2"],
    });

    view.unmount();
  });

  it("skips the query while it is disabled", async () => {
    const view = renderHook(
      (streamId: string | null) => useStreamData(CONTRACT_ID, streamId),
      null as string | null
    );
    await flush();

    expect(simulateContractQuery).not.toHaveBeenCalled();

    view.rerender("stream-1");
    await flush();
    expect(simulateContractQuery).toHaveBeenCalledTimes(1);

    view.unmount();
  });
});

describe("useContractQuery refetch interval", () => {
  it("creates the interval once and fires it on schedule", async () => {
    vi.useFakeTimers();
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");

    const view = renderHook(
      () => useUserStreams(CONTRACT_ID, "outgoing", { refetchInterval: 1000 }),
      undefined
    );
    await flush();

    expect(simulateContractQuery).toHaveBeenCalledTimes(1);
    expect(intervalsScheduled(setIntervalSpy.mock.calls, 1000)).toBe(1);

    // Extra commits must not tear the timer down and rebuild it.
    view.rerender();
    view.rerender();
    await flush();
    expect(intervalsScheduled(setIntervalSpy.mock.calls, 1000)).toBe(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(simulateContractQuery).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(simulateContractQuery).toHaveBeenCalledTimes(3);

    // Still one timer after several ticks and renders.
    expect(intervalsScheduled(setIntervalSpy.mock.calls, 1000)).toBe(1);

    view.unmount();
  });

  it("does not schedule a timer when no interval is configured", async () => {
    vi.useFakeTimers();
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");

    const view = renderHook(() => useUserStreams(CONTRACT_ID), undefined);
    await flush();

    expect(intervalsScheduled(setIntervalSpy.mock.calls, 1000)).toBe(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(simulateContractQuery).toHaveBeenCalledTimes(1);

    view.unmount();
  });
});

describe("useContractEvents filter stability", () => {
  it("keeps a single poller alive when the filter is written inline", async () => {
    vi.useFakeTimers();
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");

    const view = renderHook(
      () =>
        useContractEvents({
          contractId: CONTRACT_ID,
          eventTypes: ["stream_created", "tokens_withdrawn"],
        }),
      undefined
    );
    await flush();

    view.rerender();
    view.rerender();
    view.rerender();
    await flush();

    expect(intervalsScheduled(setIntervalSpy.mock.calls, 5000)).toBe(1);

    view.unmount();
  });
});

describe("stableKey", () => {
  it("returns the same key for structurally equal values", () => {
    expect(stableKey(["stream-1"])).toBe(stableKey(["stream-1"]));
    expect(stableKey({ contractId: CONTRACT_ID, fromLedger: 1 })).toBe(
      stableKey({ contractId: CONTRACT_ID, fromLedger: 1 })
    );
    expect(stableKey(undefined)).toBe("undefined");
    expect(stableKey([])).toBe("[]");
  });

  it("distinguishes different values", () => {
    expect(stableKey(["stream-1"])).not.toBe(stableKey(["stream-2"]));
    expect(stableKey(undefined)).not.toBe(stableKey([]));
  });

  it("handles values JSON cannot represent", () => {
    expect(stableKey([BigInt(10)])).toBe(stableKey([BigInt(10)]));
    expect(stableKey([BigInt(10)])).not.toBe(stableKey([BigInt(11)]));
  });

  it("never claims stability for unserializable values", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(stableKey(circular)).not.toBe(stableKey(circular));
  });
});
