/**
 * @vitest-environment node
 *
 * Render the DashboardView component and verify that it shows a friendly
 * empty state when the wallet has zero streams. Uses renderToStaticMarkup
 * for synchronous rendering with hydration-compatible output.
 */
import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DashboardView } from "./dashboard-view";
import type { WalletSession } from "@/lib/wallet";

const MOCK_SESSION: WalletSession = {
  walletId: "freighter",
  walletName: "Freighter",
  publicKey: "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ",
  connectedAt: "2026-01-01T00:00:00.000Z",
  network: "Stellar Testnet",
  mocked: true,
};

const EMPTY_SNAPSHOT = {
  totalSent: 0,
  totalReceived: 0,
  totalValueLocked: 0,
  activeStreamsCount: 0,
  streams: [] as {
    id: string; recipient: string; amount: number; token: string;
    status: string; deposited: number; withdrawn: number; date: string;
  }[],
  recentActivity: [] as {
    id: string; title: string; description: string; amount: number;
    direction: string; timestamp: string;
  }[],
  transactions: [] as {
    id: string; type: string; streamId: string; amount: number;
    token: string; counterparty: string; timestamp: string;
    txHash: string; status: string;
  }[],
};

vi.mock("@/lib/dashboard", () => ({
  getMockDashboardStats: () => EMPTY_SNAPSHOT,
}));

describe("DashboardView empty state", () => {
  it("renders a friendly empty state with CTA when streams are empty", () => {
    const html = renderToStaticMarkup(
      createElement(DashboardView, {
        session: MOCK_SESSION,
        onDisconnect: () => {},
      }),
    );

    expect(html).toContain("No streams yet");
    expect(html).toContain("Create Your First Stream");
    expect(html).toContain("/create-stream");
  });

  it("does not flash between loading and empty states (renders empty state directly)", () => {
    const html = renderToStaticMarkup(
      createElement(DashboardView, {
        session: MOCK_SESSION,
        onDisconnect: () => {},
      }),
    );

    // The component should render the empty state in a single render pass.
    expect(html).not.toContain("undefined");
    expect(html).toContain("dashboard-empty-state");
  });
});