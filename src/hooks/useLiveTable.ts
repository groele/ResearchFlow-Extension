import { useLiveQuery } from 'dexie-react-hooks';
import type { Table } from 'dexie';

/**
 * Generic hook for querying a Dexie table with optional filtering.
 */
export function useLiveTable<T>(
  table: Table<T>,
  queryFn?: () => Promise<T[]>,
  deps: any[] = []
): T[] {
  const result = useLiveQuery(
    queryFn || (() => table.toArray()),
    deps,
    []
  );
  return result ?? [];
}
