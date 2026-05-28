import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@storage/dexie';

// --- Types ---
export type SearchResultType =
  | 'project'
  | 'record'
  | 'hypothesis'
  | 'experiment'
  | 'evidence'
  | 'journal'
  | 'manuscript'
  | 'task';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  matchedField: string;
  updatedAt: string;
}

export interface GroupedResults {
  type: SearchResultType;
  label: string;
  results: SearchResult[];
}

// --- Constants ---
const SEARCH_HISTORY_KEY = 'scholarflow_search_history';
const MAX_HISTORY = 10;
const DEBOUNCE_MS = 300;

// --- Search History ---
export function getSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addToHistory(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  const history = getSearchHistory();
  const filtered = history.filter(h => h !== trimmed);
  filtered.unshift(trimmed);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered.slice(0, MAX_HISTORY)));
}

export function clearSearchHistory() {
  localStorage.removeItem(SEARCH_HISTORY_KEY);
}

// --- Matching ---
function matchesQuery(text: string | undefined | null, query: string): boolean {
  if (!text) return false;
  // Normalize for Chinese: lowercase is a no-op for CJK but safe for Latin
  return text.toLowerCase().includes(query.toLowerCase());
}

function searchField(item: Record<string, any>, fields: string[], query: string): string | null {
  for (const field of fields) {
    if (matchesQuery(item[field], query)) return field;
  }
  return null;
}

// --- Hook ---
export function useGlobalSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
      setIsSearching(false);
    }, DEBOUNCE_MS);
    if (query) setIsSearching(true);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Live queries for all searchable tables
  const projects = useLiveQuery(() => db.projects.toArray()) ?? [];
  const records = useLiveQuery(() => db.researchRecords.toArray()) ?? [];
  const hypotheses = useLiveQuery(() => db.hypotheses.toArray()) ?? [];
  const experiments = useLiveQuery(() => db.experiments.toArray()) ?? [];
  const evidence = useLiveQuery(() => db.evidence.toArray()) ?? [];
  const journalEntries = useLiveQuery(() => db.journalEntries.toArray()) ?? [];
  const manuscripts = useLiveQuery(() => db.manuscripts.toArray()) ?? [];
  const tasks = useLiveQuery(() => db.tasks.toArray()) ?? [];

  // Perform search
  const results = useMemo((): SearchResult[] => {
    const q = debouncedQuery.trim();
    if (!q) return [];

    const out: SearchResult[] = [];

    // Projects
    for (const p of projects) {
      const field = searchField(p, ['title', 'discipline', 'hypothesis', 'abstract'], q);
      if (field) {
        out.push({
          id: p.id,
          type: 'project',
          title: p.title,
          subtitle: p.discipline || '',
          matchedField: field,
          updatedAt: p.updatedAt,
        });
      }
    }

    // Research Records
    for (const r of records) {
      const tagMatch = r.tags?.some((t: string) => matchesQuery(t, q));
      const field = searchField(r, ['title', 'summary', 'methodology', 'recordType'], q);
      if (field || tagMatch) {
        out.push({
          id: r.id,
          type: 'record',
          title: r.title,
          subtitle: r.recordType?.replace(/_/g, ' ') || '',
          matchedField: tagMatch ? 'tags' : field!,
          updatedAt: r.updatedAt,
        });
      }
    }

    // Hypotheses
    for (const h of hypotheses) {
      const field = searchField(h, ['statement', 'notes', 'status'], q);
      if (field) {
        out.push({
          id: h.id,
          type: 'hypothesis',
          title: h.statement,
          subtitle: h.status || '',
          matchedField: field,
          updatedAt: h.updatedAt,
        });
      }
    }

    // Experiments
    for (const e of experiments) {
      const field = searchField(e, ['title', 'design', 'variables', 'results', 'resultSummary'], q);
      if (field) {
        out.push({
          id: e.id,
          type: 'experiment',
          title: e.title,
          subtitle: e.status || '',
          matchedField: field,
          updatedAt: e.updatedAt,
        });
      }
    }

    // Evidence
    for (const ev of evidence) {
      const field = searchField(ev, ['title', 'description', 'evidenceType'], q);
      if (field) {
        out.push({
          id: ev.id,
          type: 'evidence',
          title: ev.title,
          subtitle: ev.evidenceType || '',
          matchedField: field,
          updatedAt: ev.updatedAt,
        });
      }
    }

    // Journal Entries
    for (const j of journalEntries) {
      const tagMatch = j.tags?.some((t: string) => matchesQuery(t, q));
      const field = searchField(j, ['content', 'mood'], q);
      if (field || tagMatch) {
        out.push({
          id: j.id,
          type: 'journal',
          title: j.content.slice(0, 80) + (j.content.length > 80 ? '...' : ''),
          subtitle: j.date || '',
          matchedField: tagMatch ? 'tags' : field!,
          updatedAt: j.updatedAt,
        });
      }
    }

    // Manuscripts
    for (const m of manuscripts) {
      const field = searchField(m, ['title', 'abstract', 'journal'], q);
      if (field) {
        out.push({
          id: m.id,
          type: 'manuscript',
          title: m.title,
          subtitle: m.journal || '',
          matchedField: field,
          updatedAt: m.updatedAt,
        });
      }
    }

    // Tasks
    for (const t of tasks) {
      const field = searchField(t, ['title', 'description', 'status'], q);
      if (field) {
        out.push({
          id: t.id,
          type: 'task',
          title: t.title,
          subtitle: t.status || '',
          matchedField: field,
          updatedAt: t.updatedAt,
        });
      }
    }

    // Sort by recency
    out.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return out;
  }, [debouncedQuery, projects, records, hypotheses, experiments, evidence, journalEntries, manuscripts, tasks]);

  // Group results by type
  const groupedResults = useMemo((): GroupedResults[] => {
    if (results.length === 0) return [];

    const labelMap: Record<SearchResultType, string> = {
      project: 'Projects',
      record: 'Records',
      hypothesis: 'Hypotheses',
      experiment: 'Experiments',
      evidence: 'Evidence',
      journal: 'Journal',
      manuscript: 'Manuscripts',
      task: 'Tasks',
    };

    const order: SearchResultType[] = [
      'project', 'record', 'hypothesis', 'experiment',
      'evidence', 'journal', 'manuscript', 'task',
    ];

    const groups = new Map<SearchResultType, SearchResult[]>();
    for (const r of results) {
      if (!groups.has(r.type)) groups.set(r.type, []);
      groups.get(r.type)!.push(r);
    }

    return order
      .filter(type => groups.has(type))
      .map(type => ({
        type,
        label: labelMap[type],
        results: groups.get(type)!,
      }));
  }, [results]);

  // Save to history on search
  const search = useCallback((q: string) => {
    setQuery(q);
    if (q.trim()) addToHistory(q.trim());
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
  }, []);

  return {
    query,
    setQuery: search,
    clear,
    debouncedQuery,
    isSearching,
    results,
    groupedResults,
    totalResults: results.length,
  };
}
