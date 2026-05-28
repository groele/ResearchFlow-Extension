import { useLiveQuery } from 'dexie-react-hooks';
import type { Table } from 'dexie';
import type { DependencyList } from 'react';

/**
 * Generic hook for querying a Dexie table with optional filtering.
 */
export function useLiveTable<T>(
  table: Table<T>,
  queryFn?: () => Promise<T[]>,
  deps: DependencyList = []
): T[] {
  const result = useLiveQuery(
    queryFn || (() => table.toArray()),
    deps as unknown[],
    []
  );
  return result ?? [];
}
