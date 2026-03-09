import type { WalletId } from "@/lib/wallet";

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  amount: number;
  direction: "sent" | "received";
  timestamp: string;
}

export interface Stream {
  id: string;
  recipient: string;
  amount: number;
  token: string;
  status: "Active" | "Completed" | "Cancelled";
  deposited: number;
  withdrawn: number;
  date: string;
}

export type TransactionType = "withdrawal" | "cancellation" | "stream_created";
export type TransactionStatus = "completed" | "pending" | "failed";

export interface Transaction {
  id: string;
  type: TransactionType;
  streamId: string;
  amount: number;
  token: string;
  counterparty: string;
  timestamp: string;
  txHash: string;
  status: TransactionStatus;
}

export interface DashboardSnapshot {
  totalSent: number;
  totalReceived: number;
  totalValueLocked: number;
  activeStreamsCount: number;
  recentActivity: ActivityItem[];
  streams: Stream[];
  transactions: Transaction[];
}

const MOCK_STATS_BY_WALLET: Record<WalletId, DashboardSnapshot | null> = {
  freighter: {
    totalSent: 12850,
    totalReceived: 4720,
    totalValueLocked: 32140,
    activeStreamsCount: 2,
    streams: [
      {
        id: "stream-1",
        date: "2023-10-25",
        recipient: "G...ABCD",
        amount: 500,
        token: "USDC",
        status: "Active",
        deposited: 500,
        withdrawn: 100,
      },
      {
        id: "stream-2",
        date: "2023-10-26",
        recipient: "G...EFGH",
        amount: 1200,
        token: "XLM",
        status: "Active",
        deposited: 1200,
        withdrawn: 300,
      },
    ],
    recentActivity: [
      {
        id: "act-1",
        title: "Design Retainer",
        description: "Outgoing stream settled",
        amount: 250,
        direction: "sent",
        timestamp: "2026-02-19T13:10:00.000Z",
      },
      {
        id: "act-2",
        title: "Community Grant",
        description: "Incoming stream payout",
        amount: 420,
        direction: "received",
        timestamp: "2026-02-18T17:45:00.000Z",
      },
      {
        id: "act-3",
        title: "Developer Subscription",
        description: "Outgoing recurring payment",
        amount: 85,
        direction: "sent",
        timestamp: "2026-02-18T09:15:00.000Z",
      },
    ],
    transactions: [
      {
        id: "tx-1",
        type: "stream_created",
        streamId: "stream-1",
        amount: 500,
        token: "USDC",
        counterparty: "G...ABCD",
        timestamp: "2026-01-10T09:00:00.000Z",
        txHash: "a1b2c3d4e5f6",
        status: "completed",
      },
      {
        id: "tx-2",
        type: "stream_created",
        streamId: "stream-2",
        amount: 1200,
        token: "XLM",
        counterparty: "G...EFGH",
        timestamp: "2026-01-15T14:30:00.000Z",
        txHash: "b2c3d4e5f6a1",
        status: "completed",
      },
      {
        id: "tx-3",
        type: "withdrawal",
        streamId: "stream-4",
        amount: 250,
        token: "USDC",
        counterparty: "G...MNOP",
        timestamp: "2026-01-22T11:15:00.000Z",
        txHash: "c3d4e5f6a1b2",
        status: "completed",
      },
      {
        id: "tx-4",
        type: "cancellation",
        streamId: "stream-5",
        amount: 800,
        token: "USDC",
        counterparty: "G...QRST",
        timestamp: "2026-01-28T16:45:00.000Z",
        txHash: "d4e5f6a1b2c3",
        status: "completed",
      },
      {
        id: "tx-5",
        type: "withdrawal",
        streamId: "stream-1",
        amount: 100,
        token: "USDC",
        counterparty: "G...ABCD",
        timestamp: "2026-02-03T08:20:00.000Z",
        txHash: "e5f6a1b2c3d4",
        status: "completed",
      },
      {
        id: "tx-6",
        type: "stream_created",
        streamId: "stream-6",
        amount: 2000,
        token: "EURC",
        counterparty: "G...UVWX",
        timestamp: "2026-02-05T13:00:00.000Z",
        txHash: "f6a1b2c3d4e5",
        status: "completed",
      },
      {
        id: "tx-7",
        type: "cancellation",
        streamId: "stream-6",
        amount: 2000,
        token: "EURC",
        counterparty: "G...UVWX",
        timestamp: "2026-02-09T10:10:00.000Z",
        txHash: "a1b2c3d4e5f7",
        status: "completed",
      },
      {
        id: "tx-8",
        type: "withdrawal",
        streamId: "stream-2",
        amount: 300,
        token: "XLM",
        counterparty: "G...EFGH",
        timestamp: "2026-02-12T09:55:00.000Z",
        txHash: "b2c3d4e5f7a1",
        status: "completed",
      },
      {
        id: "tx-9",
        type: "stream_created",
        streamId: "stream-7",
        amount: 450,
        token: "XLM",
        counterparty: "G...YZ01",
        timestamp: "2026-02-14T15:30:00.000Z",
        txHash: "c3d4e5f7a1b2",
        status: "pending",
      },
      {
        id: "tx-10",
        type: "withdrawal",
        streamId: "stream-7",
        amount: 50,
        token: "XLM",
        counterparty: "G...YZ01",
        timestamp: "2026-02-17T12:00:00.000Z",
        txHash: "d4e5f7a1b2c3",
        status: "failed",
      },
      {
        id: "tx-11",
        type: "cancellation",
        streamId: "stream-7",
        amount: 450,
        token: "XLM",
        counterparty: "G...YZ01",
        timestamp: "2026-02-18T07:45:00.000Z",
        txHash: "e5f7a1b2c3d4",
        status: "completed",
      },
      {
        id: "tx-12",
        type: "withdrawal",
        streamId: "stream-1",
        amount: 100,
        token: "USDC",
        counterparty: "G...ABCD",
        timestamp: "2026-02-19T13:10:00.000Z",
        txHash: "f7a1b2c3d4e5",
        status: "completed",
      },
    ],
  },
  albedo: null,
  xbull: {
    totalSent: 2130,
    totalReceived: 3890,
    totalValueLocked: 5400,
    activeStreamsCount: 1,
    streams: [
      {
        id: "stream-3",
        date: "2023-10-27",
        recipient: "G...IJKL",
        amount: 300,
        token: "EURC",
        status: "Active",
        deposited: 300,
        withdrawn: 50,
      },
    ],
    recentActivity: [
      {
        id: "act-4",
        title: "Ops Payroll",
        description: "Incoming stream payout",
        amount: 630,
        direction: "received",
        timestamp: "2026-02-19T08:05:00.000Z",
      },
    ],
    transactions: [
      {
        id: "tx-20",
        type: "stream_created",
        streamId: "stream-3",
        amount: 300,
        token: "EURC",
        counterparty: "G...IJKL",
        timestamp: "2026-01-20T10:00:00.000Z",
        txHash: "aa1bb2cc3dd4",
        status: "completed",
      },
      {
        id: "tx-21",
        type: "withdrawal",
        streamId: "stream-3",
        amount: 50,
        token: "EURC",
        counterparty: "G...IJKL",
        timestamp: "2026-02-10T14:20:00.000Z",
        txHash: "bb2cc3dd4ee5",
        status: "completed",
      },
      {
        id: "tx-22",
        type: "cancellation",
        streamId: "stream-8",
        amount: 600,
        token: "XLM",
        counterparty: "G...2345",
        timestamp: "2026-02-15T09:30:00.000Z",
        txHash: "cc3dd4ee5ff6",
        status: "completed",
      },
    ],
  },
};

export function getMockDashboardStats(
  walletId: WalletId,
): DashboardSnapshot | null {
  const source = MOCK_STATS_BY_WALLET[walletId];

  if (!source) {
    return null;
  }

  return {
    ...source,
    recentActivity: source.recentActivity.map((activity) => ({ ...activity })),
    streams: source.streams.map((stream) => ({ ...stream })),
    transactions: source.transactions.map((tx) => ({ ...tx })),
  };
}
