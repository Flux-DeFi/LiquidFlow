/**
 * @vitest-environment jsdom
 *
 * Tests for the wallet context provider's connect/disconnect flow.
 * Mocks the underlying Soroban wallet SDK so no real wallet is needed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { WalletProvider, useWallet } from "./wallet-context";
import type { WalletSession } from "@/lib/wallet";
import { toWalletErrorMessage } from "@/lib/wallet";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { mockSorobanContext, sorobanConnect, sorobanDisconnect } =
  vi.hoisted(() => {
    const connect = vi.fn<() => Promise<void>>();
    const disconnect = vi.fn();

    return {
      mockSorobanContext: {
        address: null as string | null,
        connect,
        disconnect,
        activeChain: null as { name: string } | null,
        activeConnector: null as { name: string } | null,
      },
      sorobanConnect: connect,
      sorobanDisconnect: disconnect,
    };
  });

vi.mock("@soroban-react/core", () => ({
  useSorobanReact: () => mockSorobanContext,
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const MOCK_SESSION: WalletSession = {
  walletId: "freighter",
  walletName: "Freighter",
  publicKey: "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ",
  connectedAt: "2026-01-01T00:00:00.000Z",
  network: "Stellar Testnet",
  mocked: true,
};

function setStoredSession(session: WalletSession): void {
  window.localStorage.setItem(
    "flowfi.wallet.session.v1",
    JSON.stringify(session),
  );
}

function clearStoredSession(): void {
  window.localStorage.removeItem("flowfi.wallet.session.v1");
}

type WalletValue = ReturnType<typeof useWallet>;

async function renderWalletProvider(): Promise<{
  value: () => WalletValue;
  unmount: () => void;
}> {
  (
    globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;

  let currentValue: WalletValue | undefined;

  function Consumer() {
    currentValue = useWallet();
    return null;
  }

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      createElement(WalletProvider, null, createElement(Consumer) as ReactNode),
    );
  });

  return {
    value: () => currentValue!,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  clearStoredSession();
  mockSorobanContext.address = null;
  mockSorobanContext.activeChain = null;
  mockSorobanContext.activeConnector = null;
  sorobanConnect.mockReset();
  sorobanDisconnect.mockReset();
  sorobanConnect.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  clearStoredSession();
});

describe("WalletProvider initial state", () => {
  it("starts in idle state and is hydrated when no session exists", async () => {
    const harness = await renderWalletProvider();
    const ctx = harness.value();

    expect(ctx.status).toBe("idle");
    expect(ctx.session).toBeNull();
    expect(ctx.selectedWalletId).toBeNull();
    expect(ctx.errorMessage).toBeNull();
    expect(ctx.isHydrated).toBe(true);

    harness.unmount();
  });

  it("hydrates from a stored session if one exists", async () => {
    // When a stored session exists, the hydration effect sets status to
    // "connected". The sync effect watches `address` — if it's null
    // while status is "connected", it will disconnect. Set the mock
    // address so the sync effect keeps the connected state.
    setStoredSession(MOCK_SESSION);
    mockSorobanContext.address = MOCK_SESSION.publicKey;

    const harness = await renderWalletProvider();
    const ctx = harness.value();

    expect(ctx.status).toBe("connected");
    expect(ctx.session).toEqual(MOCK_SESSION);
    expect(ctx.selectedWalletId).toBe("freighter");
    expect(ctx.isHydrated).toBe(true);

    harness.unmount();
  });
});

describe("WalletProvider connect", () => {
  it("sets status to connecting immediately when connect is called", async () => {
    let resolveConnect: () => void;
    sorobanConnect.mockImplementation(
      () => new Promise<void>((resolve) => { resolveConnect = resolve; }),
    );

    const harness = await renderWalletProvider();

    act(() => {
      harness.value().connect("freighter");
    });

    // After the synchronous dispatch of connect:start, status should be "connecting"
    expect(harness.value().status).toBe("connecting");
    expect(harness.value().selectedWalletId).toBe("freighter");
    expect(harness.value().errorMessage).toBeNull();

    resolveConnect!();
    harness.unmount();
  });

  it("shows an error state when the wallet connection is rejected", async () => {
    sorobanConnect.mockRejectedValue(new Error("User rejected the request."));

    const harness = await renderWalletProvider();

    await act(async () => {
      await harness.value().connect("freighter");
    });

    expect(harness.value().status).toBe("error");
    expect(harness.value().session).toBeNull();
    expect(harness.value().selectedWalletId).toBe("freighter");
    expect(harness.value().errorMessage).toBe(
      "User rejected the wallet connection request.",
    );

    expect(
      window.localStorage.getItem("flowfi.wallet.session.v1"),
    ).toBeNull();

    harness.unmount();
  });

  it("clears the error when clearError is called", async () => {
    sorobanConnect.mockRejectedValue(new Error("Connection failed."));

    const harness = await renderWalletProvider();

    await act(async () => {
      await harness.value().connect("freighter");
    });

    expect(harness.value().status).toBe("error");

    act(() => {
      harness.value().clearError();
    });

    expect(harness.value().errorMessage).toBeNull();
    expect(harness.value().status).toBe("idle");

    harness.unmount();
  });
});

describe("WalletProvider disconnect", () => {
  it("transitions to idle and clears the session on disconnect", async () => {
    setStoredSession(MOCK_SESSION);
    mockSorobanContext.address = MOCK_SESSION.publicKey;

    const harness = await renderWalletProvider();
    expect(harness.value().status).toBe("connected");

    act(() => {
      harness.value().disconnect();
    });

    expect(harness.value().status).toBe("idle");
    expect(harness.value().session).toBeNull();
    expect(harness.value().selectedWalletId).toBeNull();
    expect(harness.value().errorMessage).toBeNull();

    expect(
      window.localStorage.getItem("flowfi.wallet.session.v1"),
    ).toBeNull();

    expect(sorobanDisconnect).toHaveBeenCalledTimes(1);

    harness.unmount();
  });

  it("does nothing when already disconnected", async () => {
    const harness = await renderWalletProvider();
    expect(harness.value().status).toBe("idle");

    act(() => {
      harness.value().disconnect();
    });

    expect(harness.value().status).toBe("idle");
    expect(sorobanDisconnect).toHaveBeenCalledTimes(1);

    harness.unmount();
  });
});