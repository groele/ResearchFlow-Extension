import { useState, useCallback, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@storage/dexie';

export type ReadingStatus = 'unread' | 'reading' | 'read' | 'to-reread';

export type ReadingFilter = ReadingStatus | 'all' | 'starred';

export function useReadingQueue() {
  const records = useLiveQuery(() => db.researchRecords.where('userId').equals('user').toArray()) ?? [];
  const projects = useLiveQuery(() => db.projects.where('userId').equals('user').toArray()) ?? [];

  const [statusFilter, setStatusFilter] = useState<ReadingFilter>('all');
  const [projectFilter, setProjectFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'status'>('date');

  const readingQueue = useMemo(() => {
    let filtered = records.filter(r => r.recordType === 'literature_review' || r.tags.includes('literature'));

    if (statusFilter === 'starred') {
      filtered = filtered.filter(r => r.starred);
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(r => (r.readingStatus || 'unread') === statusFilter);
    }
    if (projectFilter) {
      filtered = filtered.filter(r => r.projectId === projectFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    filtered.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'status') {
        const order: Record<string, number> = { unread: 0, reading: 1, 'to-reread': 2, read: 3 };
        return (order[a.readingStatus || 'unread'] ?? 0) - (order[b.readingStatus || 'unread'] ?? 0);
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return filtered;
  }, [records, statusFilter, projectFilter, search, sortBy]);

  const stats = useMemo(() => {
    const litRecords = records.filter(r => r.recordType === 'literature_review' || r.tags.includes('literature'));
    return {
      total: litRecords.length,
      unread: litRecords.filter(r => !r.readingStatus || r.readingStatus === 'unread').length,
      reading: litRecords.filter(r => r.readingStatus === 'reading').length,
      read: litRecords.filter(r => r.readingStatus === 'read').length,
      'to-reread': litRecords.filter(r => r.readingStatus === 'to-reread').length,
      starred: litRecords.filter(r => r.starred).length,
    } as Record<string, number>;
  }, [records]);

  const handleStatusChange = useCallback(async (id: string, status: ReadingStatus) => {
    await db.researchRecords.update(id, { readingStatus: status, updatedAt: new Date().toISOString() });
  }, []);

  const handleToggleStar = useCallback(async (id: string) => {
    const rec = await db.researchRecords.get(id);
    if (rec) {
      await db.researchRecords.update(id, { starred: !rec.starred, updatedAt: new Date().toISOString() });
    }
  }, []);

  return {
    readingQueue,
    projects,
    stats,
    statusFilter,
    setStatusFilter,
    projectFilter,
    setProjectFilter,
    search,
    setSearch,
    sortBy,
    setSortBy,
    handleStatusChange,
    handleToggleStar,
  };
}
