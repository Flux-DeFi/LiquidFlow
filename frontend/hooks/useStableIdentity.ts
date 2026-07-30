"use client";

import { useMemo } from "react";

let unserializableCounter = 0;

/**
 * Builds a value-based key for anything that is used as a hook dependency.
 *
 * `bigint` and function members are given printable stand-ins because
 * `JSON.stringify` cannot represent them. Values that cannot be serialized at
 * all (circular structures, for example) fall back to a fresh key on every
 * call, which keeps the previous "treat it as changed" behaviour rather than
 * claiming a stability we cannot prove.
 */
export function stableKey(value: unknown): string {
  try {
    const serialized = JSON.stringify(value, (_key, entry: unknown) => {
      if (typeof entry === "bigint") {
        return `${entry.toString()}n`;
      }

      if (typeof entry === "function") {
        return `fn:${(entry as { name?: string }).name || "anonymous"}`;
      }

      return entry;
    });

    return serialized ?? "undefined";
  } catch {
    unserializableCounter += 1;
    return `unserializable:${unserializableCounter}`;
  }
}

/**
 * Returns a reference-stable version of `value`.
 *
 * Callers of the contract hooks routinely build their inputs inline
 * (`args: streamId ? [streamId] : undefined`), so the array or object identity
 * changes on every render even though the query itself is unchanged. Feeding
 * that identity into `useCallback`/`useEffect` dependency arrays recreates the
 * callback on every commit, which re-runs the effect, which sets state, which
 * renders again — an unbounded refetch loop.
 *
 * This hook keeps the value seen for a given serialized key, so the identity
 * only changes when the underlying data actually changes.
 */
export function useStableIdentity<T>(value: T): T {
  const key = stableKey(value);

  // `key` is a complete stand-in for `value`: recomputing only when the
  // serialized form changes is precisely the identity behaviour we want, so
  // `value` is intentionally left out of the dependency array.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => value, [key]);
}
