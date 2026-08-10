// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { WalletProvider, useWallet } from "./wallet-context";

// ---------------------------------------------------------------------------
// Mock @soroban-react/core
// The WalletProvider reads { address, connect, disconnect, activeChain,
// activeConnector } from useSorobanReact().  We expose a mutable mock object
// so tests can simulate the connect / disconnect lifecycle.
// ---------------------------------------------------------------------------
const mockSoroban = {
  address: undefined as string | undefined,
  activeConnector: undefined as { name: string } | undefined,
  activeChain: undefined as { name: string } | undefined,
  connect: vi.fn<() => Promise<void>>(),
  disconnect: vi.fn<() => Promise<void>>(),
};

vi.mock("@soroban-react/core", () => ({
  useSorobanReact: () => mockSoroban,
}));

// ---------------------------------------------------------------------------
// Test harness – renders inside WalletProvider so it can read / exercise the
// public API that the issue asks us to test.
// ---------------------------------------------------------------------------
function TestHarness() {
  const wallet = useWallet();

  return (
    <div>
      <div data-testid="status">{wallet.status}</div>
      <div data-testid="session">{wallet.session ? wallet.session.publicKey : "null"}</div>
      <div data-testid="error">{wallet.errorMessage ?? "none"}</div>
      <div data-testid="hydrated">{String(wallet.isHydrated)}</div>
      <button
        data-testid="connect-freighter"
        onClick={() => wallet.connect("freighter")}
      >
        Connect Freighter
      </button>
      <button
        data-testid="connect-albedo"
        onClick={() => wallet.connect("albedo")}
      >
        Connect Albedo
      </button>
      <button data-testid="disconnect" onClick={wallet.disconnect}>
        Disconnect
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <WalletProvider>
      <TestHarness />
    </WalletProvider>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simulate the soroban-react context having a connected wallet. */
function simulateConnectedWallet() {
  mockSoroban.address = "GCFLOWFIFREIGHTERMOCKPUBKEY9Q6YB6PW46O67Q3N";
  mockSoroban.activeConnector = { name: "Freighter" };
  mockSoroban.activeChain = { name: "Stellar Testnet" };
}

/** Clear the simulated wallet (disconnected state). */
function simulateDisconnectedWallet() {
  mockSoroban.address = undefined;
  mockSoroban.activeConnector = undefined;
  mockSoroban.activeChain = undefined;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("WalletProvider / useWallet", () => {
  beforeEach(() => {
    simulateDisconnectedWallet();
    mockSoroban.connect.mockReset();
    mockSoroban.disconnect.mockReset();
    // Default: connect resolves successfully (but doesn't set address unless
    // the test explicitly calls simulateConnectedWallet).
    mockSoroban.connect.mockResolvedValue(undefined);
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  describe("initial state", () => {
    it("starts idle with no session once hydration completes", () => {
      renderWithProvider();

      expect(screen.getByTestId("status")).toHaveTextContent("idle");
      expect(screen.getByTestId("session")).toHaveTextContent("null");
      expect(screen.getByTestId("error")).toHaveTextContent("none");
      // The hydration effect runs on mount and marks the context hydrated.
      expect(screen.getByTestId("hydrated")).toHaveTextContent("true");
    });

    it("hydrates from localStorage when a stored session exists", async () => {
      const storedSession = {
        walletId: "freighter",
        walletName: "Freighter",
        publicKey: "GCSTOREDPUBKEY1234567890ABCDEFGHIJKLMNOP",
        connectedAt: "2026-08-10T00:00:00.000Z",
        network: "Stellar Testnet",
        mocked: false,
      };
      localStorage.setItem("flowfi.wallet.session.v1", JSON.stringify(storedSession));

      // Mirror the stored key in the soroban context so the sync effect
      // reconciles to the hydrated session instead of tearing it down.
      mockSoroban.address = storedSession.publicKey;
      mockSoroban.activeConnector = { name: "Freighter" };
      mockSoroban.activeChain = { name: "Stellar Testnet" };

      renderWithProvider();

      // After hydration the context should be hydrated and restore the session.
      await waitFor(() => {
        expect(screen.getByTestId("hydrated")).toHaveTextContent("true");
        expect(screen.getByTestId("status")).toHaveTextContent("connected");
        expect(screen.getByTestId("session")).toHaveTextContent(storedSession.publicKey);
      });
    });
  });

  describe("connect flow", () => {
    it("transitions through connecting → connected on successful freighter connect", async () => {
      // Arrange: sorobanConnect will update the mock context with an address
      mockSoroban.connect.mockImplementationOnce(async () => {
        simulateConnectedWallet();
      });

      const user = userEvent.setup();
      renderWithProvider();

      // Act
      await user.click(screen.getByTestId("connect-freighter"));

      // Wait for the sync effect to fire and update the status
      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("connected");
      });

      // Assert: session should have the freighter mock public key
      expect(screen.getByTestId("session")).toHaveTextContent(
        "GCFLOWFIFREIGHTERMOCKPUBKEY9Q6YB6PW46O67Q3N"
      );
      expect(screen.getByTestId("error")).toHaveTextContent("none");
    });

    it("shows an error message when sorobanConnect rejects", async () => {
      mockSoroban.connect.mockRejectedValueOnce(new Error("User rejected the request."));

      const user = userEvent.setup();
      renderWithProvider();

      await user.click(screen.getByTestId("connect-freighter"));

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("error");
      });

      // The toWalletErrorMessage function normalises rejection patterns
      expect(screen.getByTestId("error")).toHaveTextContent(
        "User rejected the wallet connection request."
      );
    });

    it("shows a generic error message for non-rejection errors", async () => {
      mockSoroban.connect.mockRejectedValueOnce(new Error("Network error"));

      const user = userEvent.setup();
      renderWithProvider();

      await user.click(screen.getByTestId("connect-freighter"));

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("error");
      });

      expect(screen.getByTestId("error")).toHaveTextContent("Network error");
    });

    it("throws for unsupported wallets (albedo, xbull)", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await user.click(screen.getByTestId("connect-albedo"));

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("error");
      });

      expect(screen.getByTestId("error")).toHaveTextContent(
        "Wallet albedo not yet implemented via Soroban React Core."
      );
    });
  });

  describe("disconnect flow", () => {
    it("transitions from connected to idle on disconnect", async () => {
      // Start with a connected wallet
      mockSoroban.connect.mockImplementationOnce(async () => {
        simulateConnectedWallet();
      });

      const user = userEvent.setup();
      renderWithProvider();

      // Connect first
      await user.click(screen.getByTestId("connect-freighter"));
      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("connected");
      });

      // Simulate soroban-react disconnect (clears address)
      mockSoroban.disconnect.mockImplementationOnce(async () => {
        simulateDisconnectedWallet();
      });

      // Act: disconnect
      await user.click(screen.getByTestId("disconnect"));

      // The sync effect should detect address is gone and transition to idle
      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("idle");
      });

      expect(screen.getByTestId("session")).toHaveTextContent("null");
    });
  });
});