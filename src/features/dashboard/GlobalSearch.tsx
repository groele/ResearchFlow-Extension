import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useGlobalSearch, getSearchHistory, clearSearchHistory, type SearchResultType } from '@/hooks/useGlobalSearch';
import { useLang } from '@/i18n';
import { Badge } from '@components/primitives/Badge';
import { EmptyState } from '@components/primitives/EmptyState';
import {
  Search, X, Clock, FolderOpen, FileText, FlaskConical,
  Lightbulb, Database, BookOpen, Columns3, ListTodo, ChevronRight,
} from 'lucide-react';

interface GlobalSearchProps {
  onNavigate?: (view: string) => void;
}

const typeIcon: Record<SearchResultType, React.ReactNode> = {
  project: <FolderOpen size={13} />,
  record: <FileText size={13} />,
  hypothesis: <Lightbulb size={13} />,
  experiment: <FlaskConical size={13} />,
  evidence: <Database size={13} />,
  journal: <BookOpen size={13} />,
  manuscript: <Columns3 size={13} />,
  task: <ListTodo size={13} />,
};

const typeColor: Record<SearchResultType, string> = {
  project: 'text-warning-400',
  record: 'text-info-400',
  hypothesis: 'text-purple-400',
  experiment: 'text-pink-400',
  evidence: 'text-emerald-400',
  journal: 'text-amber-400',
  manuscript: 'text-primary-400',
  task: 'text-slate-400',
};

const typeNavTarget: Record<SearchResultType, string> = {
  project: 'projects',
  record: 'records',
  hypothesis: 'planning',
  experiment: 'planning',
  evidence: 'evidence',
  journal: 'journal',
  manuscript: 'kanban',
  task: 'kanban',
};

export function GlobalSearch({ onNavigate }: GlobalSearchProps) {
  const { t } = useLang();
  const {
    query, setQuery, clear, isSearching,
    groupedResults, totalResults, debouncedQuery,
  } = useGlobalSearch();

  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build flat list of navigable option IDs for arrow key navigation
  const optionIds = useMemo(() => {
    const ids: string[] = [];
    if (showHistory && history.length > 0) {
      history.forEach((_, i) => ids.push(`search-history-${i}`));
    }
    if (!isSearching && groupedResults.length > 0) {
      groupedResults.forEach(group => {
        group.results.slice(0, 5).forEach(result => {
          ids.push(`search-result-${result.id}`);
        });
      });
    }
    return ids;
  }, [showHistory, history, isSearching, groupedResults]);

  // Reset active index when options change
  useEffect(() => {
    setActiveIndex(-1);
  }, [optionIds.length, showHistory]);

  // Load history when opening
  const handleFocus = useCallback(() => {
    setIsOpen(true);
    setHistory(getSearchHistory());
    if (!query) setShowHistory(true);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Hide history when typing
  useEffect(() => {
    if (query) setShowHistory(false);
  }, [query]);

  const handleHistoryClick = useCallback((item: string) => {
    setQuery(item);
    setShowHistory(false);
    inputRef.current?.focus();
  }, [setQuery]);

  const showDropdown = isOpen && (!!query || showHistory);

  const handleClearHistory = useCallback(() => {
    clearSearchHistory();
    setHistory([]);
  }, []);

  const handleResultClick = useCallback((type: SearchResultType) => {
    const target = typeNavTarget[type];
    onNavigate?.(target);
    setIsOpen(false);
    clear();
  }, [onNavigate, clear]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setShowHistory(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
      return;
    }

    if (!showDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < optionIds.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : optionIds.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const activeId = optionIds[activeIndex];
      if (activeId?.startsWith('search-history-')) {
        const histIdx = parseInt(activeId.replace('search-history-', ''), 10);
        if (history[histIdx]) handleHistoryClick(history[histIdx]);
      } else if (activeId?.startsWith('search-result-')) {
        const resultId = activeId.replace('search-result-', '');
        for (const group of groupedResults) {
          const result = group.results.find(r => r.id === resultId);
          if (result) {
            handleResultClick(result.type);
            break;
          }
        }
      }
    }
  }, [showDropdown, optionIds, activeIndex, history, groupedResults, handleHistoryClick, handleResultClick]);

  // Scroll active option into view
  useEffect(() => {
    if (activeIndex >= 0 && optionIds[activeIndex]) {
      const el = listRef.current?.querySelector(`[data-option-id="${optionIds[activeIndex]}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, optionIds]);

  const activeDescendant = activeIndex >= 0 ? optionIds[activeIndex] : undefined;

  return (
    <div ref={containerRef} className="relative mb-6" aria-expanded={showDropdown}>
      <div className="relative" role="combobox" aria-haspopup="listbox" aria-owns={showDropdown ? 'search-listbox' : undefined}>
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={t('search.placeholder')}
          aria-label={t('search.searchLabel')}
          aria-autocomplete="list"
          aria-activedescendant={activeDescendant}
          className="w-full h-10 pl-10 pr-9 rounded-lg border border-slate-800 bg-slate-900/60 text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors duration-150"
        />
        {query && (
          <button
            onClick={() => { clear(); setShowHistory(true); setHistory(getSearchHistory()); }}
            aria-label={t('common.clear')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div ref={listRef} id="search-listbox" role="listbox" className="absolute z-50 top-full left-0 right-0 mt-1.5 rounded-lg border border-slate-800 bg-slate-900 shadow-xl max-h-80 overflow-y-auto">
          {/* Search History */}
          {showHistory && history.length > 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Clock size={11} />
                  {t('search.recentSearches')}
                </span>
                <button
                  onClick={handleClearHistory}
                  className="text-2xs text-slate-600 hover:text-slate-400 transition-colors"
                >
                  {t('search.clearHistory')}
                </button>
              </div>
              {history.map((item, i) => (
                <button
                  key={i}
                  id={`search-history-${i}`}
                  data-option-id={`search-history-${i}`}
                  role="option"
                  aria-selected={activeIndex === i}
                  onClick={() => handleHistoryClick(item)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full text-left px-3 py-1.5 rounded-md text-xs truncate transition-colors ${
                    activeIndex === i ? 'bg-slate-800/60 text-slate-200' : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          )}

          {/* Loading indicator */}
          {isSearching && query && (
            <div className="px-4 py-3 text-xs text-slate-500">{t('common.loading')}</div>
          )}

          {/* No results */}
          {!isSearching && debouncedQuery && totalResults === 0 && (
            <div className="p-4">
              <EmptyState
                title={t('search.noResults')}
                description={t('search.noResultsDesc')}
              />
            </div>
          )}

          {/* Grouped results */}
          {!isSearching && groupedResults.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1.5 mb-1">
                <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500">
                  {t('search.resultsCount', { count: totalResults })}
                </span>
              </div>
              {groupedResults.map(group => (
                <div key={group.type} className="mb-2 last:mb-0">
                  <div className="px-2 py-1">
                    <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t(`search.type.${group.type}` as any)}
                    </span>
                    <Badge size="sm" className="ml-1.5">{group.results.length}</Badge>
                  </div>
                  {group.results.slice(0, 5).map(result => {
                    const optId = `search-result-${result.id}`;
                    const idx = optionIds.indexOf(optId);
                    return (
                      <button
                        key={result.id}
                        id={optId}
                        data-option-id={optId}
                        role="option"
                        aria-selected={activeIndex === idx}
                        onClick={() => handleResultClick(result.type)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`w-full text-left flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors group ${
                          activeIndex === idx ? 'bg-slate-800/60' : 'hover:bg-slate-800/60'
                        }`}
                      >
                        <span className={`${typeColor[result.type]} flex-shrink-0`}>
                          {typeIcon[result.type]}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-200 truncate group-hover:text-slate-100">
                            {result.title}
                          </p>
                          <p className="text-2xs text-slate-500 truncate">
                            {result.subtitle}
                            {result.matchedField && (
                              <span className="text-slate-600 ml-1.5">
                                &middot; {t('search.matchedIn', { field: result.matchedField })}
                              </span>
                            )}
                          </p>
                        </div>
                        <ChevronRight size={12} className="text-slate-700 group-hover:text-primary-400 transition-colors flex-shrink-0" />
                      </button>
                    );
                  })}
                  {group.results.length > 5 && (
                    <button
                      onClick={() => handleResultClick(group.type)}
                      className="w-full text-left px-3 py-1 text-2xs text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      {t('search.moreResults', { count: group.results.length - 5 })}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
