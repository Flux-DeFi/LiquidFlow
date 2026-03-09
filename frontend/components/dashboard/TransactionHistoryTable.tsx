"use client";

import React, { useState, useMemo } from "react";
import type { Transaction, TransactionType, TransactionStatus } from "@/lib/dashboard";

interface TransactionHistoryTableProps {
  transactions: Transaction[];
  pageSize?: number;
}

const TYPE_LABELS: Record<TransactionType, string> = {
  withdrawal: "Withdrawal",
  cancellation: "Cancellation",
  stream_created: "Stream Created",
};

const STATUS_LABELS: Record<TransactionStatus, string> = {
  completed: "Completed",
  pending: "Pending",
  failed: "Failed",
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatAmount(amount: number, token: string): string {
  return `${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${token}`;
}

function shortenTxHash(hash: string): string {
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

export function TransactionHistoryTable({
  transactions,
  pageSize = 5,
}: TransactionHistoryTableProps) {
  const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "all">("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return transactions
      .filter((tx) => typeFilter === "all" || tx.type === typeFilter)
      .filter((tx) => statusFilter === "all" || tx.status === statusFilter)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [transactions, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageRows = filtered.slice(pageStart, pageStart + pageSize);

  function handleTypeFilter(value: string) {
    setTypeFilter(value as TransactionType | "all");
    setPage(1);
  }

  function handleStatusFilter(value: string) {
    setStatusFilter(value as TransactionStatus | "all");
    setPage(1);
  }

  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel__header">
        <h3>Transaction History</h3>
        <span>{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="txn-filters">
        <div className="txn-filter-group">
          <label htmlFor="txn-type-filter" className="txn-filter-label">
            Type
          </label>
          <select
            id="txn-type-filter"
            className="txn-filter-select"
            value={typeFilter}
            onChange={(e) => handleTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="cancellation">Cancellation</option>
            <option value="stream_created">Stream Created</option>
          </select>
        </div>

        <div className="txn-filter-group">
          <label htmlFor="txn-status-filter" className="txn-filter-label">
            Status
          </label>
          <select
            id="txn-status-filter"
            className="txn-filter-select"
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mini-empty-state">
          <p>No transactions match the selected filters.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="txn-table-wrap">
            <table className="dashboard-table txn-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Stream</th>
                  <th>Counterparty</th>
                  <th>Amount</th>
                  <th>Tx Hash</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((tx) => (
                  <tr key={tx.id}>
                    <td className="txn-cell--date">{formatTimestamp(tx.timestamp)}</td>
                    <td>
                      <span className={`txn-type-badge txn-type-badge--${tx.type}`}>
                        {TYPE_LABELS[tx.type]}
                      </span>
                    </td>
                    <td>
                      <code className="text-xs">{tx.streamId}</code>
                    </td>
                    <td>
                      <code className="text-xs">{tx.counterparty}</code>
                    </td>
                    <td className="txn-cell--amount">{formatAmount(tx.amount, tx.token)}</td>
                    <td>
                      <code className="text-xs txn-hash">{shortenTxHash(tx.txHash)}</code>
                    </td>
                    <td>
                      <span className={`txn-status-badge txn-status-badge--${tx.status}`}>
                        {STATUS_LABELS[tx.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="txn-cards">
            {pageRows.map((tx) => (
              <div key={tx.id} className="txn-card">
                <div className="txn-card__top">
                  <span className={`txn-type-badge txn-type-badge--${tx.type}`}>
                    {TYPE_LABELS[tx.type]}
                  </span>
                  <span className={`txn-status-badge txn-status-badge--${tx.status}`}>
                    {STATUS_LABELS[tx.status]}
                  </span>
                </div>
                <div className="txn-card__body">
                  <div>
                    <p className="txn-card__label">Date</p>
                    <p className="txn-card__value">{formatTimestamp(tx.timestamp)}</p>
                  </div>
                  <div>
                    <p className="txn-card__label">Amount</p>
                    <p className="txn-card__value txn-card__value--amount">
                      {formatAmount(tx.amount, tx.token)}
                    </p>
                  </div>
                  <div>
                    <p className="txn-card__label">Counterparty</p>
                    <code className="txn-card__code">{tx.counterparty}</code>
                  </div>
                  <div>
                    <p className="txn-card__label">Stream</p>
                    <code className="txn-card__code">{tx.streamId}</code>
                  </div>
                  <div>
                    <p className="txn-card__label">Tx Hash</p>
                    <code className="txn-card__code">{shortenTxHash(tx.txHash)}</code>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="txn-pagination">
            <button
              type="button"
              className="secondary-button txn-pagination__btn"
              disabled={safePage === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span className="txn-pagination__info">
              Page {safePage} of {totalPages}
            </span>
            <button
              type="button"
              className="secondary-button txn-pagination__btn"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}
