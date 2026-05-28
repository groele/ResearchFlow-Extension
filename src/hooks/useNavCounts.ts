import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@storage/dexie';

/**
 * Returns reactive badge counts for sidebar navigation items.
 * Keys map to nav item IDs; values are the counts to display.
 */
export function useNavCounts(): Record<string, number> {
  const tasks = useLiveQuery(
    () => db.tasks.where('status').notEqual('completed').count(),
    []
  );

  const unread = useLiveQuery(
    async () => {
      const records = await db.researchRecords
        .where('readingStatus')
        .equals('unread')
        .toArray();
      return records.filter((r) => r.tags.includes('literature')).length;
    },
    []
  );

  const submissions = useLiveQuery(
    async () => {
      const all = await db.submissions.toArray();
      return all.filter(
        (s) => s.status === 'under_review' || s.status === 'revision_requested'
      ).length;
    },
    []
  );

  const manuscripts = useLiveQuery(
    () => db.manuscripts.count(),
    []
  );

  return useMemo(
    () => ({
      tasks: tasks ?? 0,
      unread: unread ?? 0,
      submissions: submissions ?? 0,
      manuscripts: manuscripts ?? 0,
    }),
    [tasks, unread, submissions, manuscripts]
  );
}
