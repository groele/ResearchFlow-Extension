import React, { useState, useRef } from 'react';
import { useCitations } from './useCitations';
import { useLang } from '@/i18n';
import { PageHeader } from '@components/layout/PageHeader';
import { Card } from '@components/primitives/Card';
import { Badge } from '@components/primitives/Badge';
import { Button } from '@components/primitives/Button';
import { Input } from '@components/primitives/Input';
import { Select } from '@components/primitives/Select';
import { EmptyState } from '@components/primitives/EmptyState';
import { BookMarked, Search, Download, Upload, Copy, Check, FileText, Filter } from 'lucide-react';

export function CitationsView() {
  const { t } = useLang();
  const {
    citations, stats, years, types,
    search, setSearch,
    typeFilter, setTypeFilter,
    yearFilter, setYearFilter,
    sortBy, setSortBy,
    selectedIds, toggleSelect, selectAll, clearSelection,
    exportFormat, setExportFormat,
    exportSelected, exportSingle, exportAsBibTeX,
    importBibTeX, importRIS,
  } = useCitations();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = (id: string, text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error('Failed to copy to clipboard:', e);
    }
  };

  const handleExportSelected = () => {
    const text = exportFormat === 'bibtex' ? exportAsBibTeX() : exportSelected();
    if (!text) return;
    const ext = exportFormat === 'bibtex' ? 'bib' : 'txt';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `citations-export.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    let count = 0;
    if (file.name.endsWith('.bib') || file.name.endsWith('.bibtex')) {
      count = await importBibTeX(text);
    } else if (file.name.endsWith('.ris')) {
      count = await importRIS(text);
    } else {
      setImportStatus(t('citations.importError'));
      return;
    }
    setImportStatus(t('citations.importSuccess', { count, file: file.name }));
    setTimeout(() => setImportStatus(''), 3000);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      <PageHeader
        title={t('citations.title')}
        description={`${stats.total} ${t('citations.references')} · ${stats.withDoi} ${t('citations.withDoi')} · ${stats.withAbstract} ${t('citations.withAbstracts')}`}
        icon={<BookMarked size={18} />}
        actions={
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept=".bib,.bibtex,.ris" className="hidden" onChange={handleImport} />
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} leftIcon={<Upload size={14} />}>
              {t('citations.importBtn')}
            </Button>
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
              options={[
                { value: 'apa7', label: t('citations.apa7') },
                { value: 'mla9', label: t('citations.mla9') },
                { value: 'chicago', label: t('citations.chicago') },
                { value: 'gb7714', label: t('citations.gb7714') },
                { value: 'bibtex', label: t('citations.bibtex') },
              ]}
              className="w-32"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportSelected}
              disabled={selectedIds.size === 0}
              leftIcon={<Download size={14} />}
            >
              {t('common.export')} ({selectedIds.size})
            </Button>
          </div>
        }
      />

      {importStatus && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-success-600/10 border border-success-600/20 text-xs text-success-400">
          {importStatus}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: t('citations.total'), value: stats.total },
          { label: t('citations.withDoi'), value: stats.withDoi },
          { label: t('citations.withAbstracts'), value: stats.withAbstract },
          { label: t('citations.recentYear'), value: stats.recent },
        ].map(s => (
          <div key={s.label} className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/40 text-center">
            <p className="text-lg font-bold text-slate-100 font-display">{s.value}</p>
            <p className="text-3xs text-slate-500 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <Input
            placeholder={t('citations.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={14} />}
          />
        </div>
        <Select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          options={[
            { value: '', label: t('citations.allYears') },
            ...years.map(y => ({ value: y, label: y })),
          ]}
          className="w-32"
        />
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={[
            { value: '', label: t('citations.allTypes') },
            ...types.slice(0, 10).map(t => ({ value: t, label: t })),
          ]}
          className="w-36"
        />
        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          options={[
            { value: 'year', label: t('citations.sortByYear') },
            { value: 'title', label: t('citations.sortByTitle') },
            { value: 'author', label: t('citations.sortByAuthor') },
          ]}
          className="w-36"
        />
      </div>

      {/* Bulk actions */}
      <div className="flex items-center gap-2 mb-3">
        <Button variant="ghost" size="xs" onClick={selectAll}>{t('common.selectAll')}</Button>
        <Button variant="ghost" size="xs" onClick={clearSelection}>{t('common.clear')}</Button>
        <span className="text-3xs text-slate-500">{selectedIds.size} {t('common.selected')}</span>
      </div>

      {/* Citations list */}
      {citations.length === 0 ? (
        <EmptyState
          icon={<BookMarked size={32} />}
          title={t('citations.noCitations')}
          description={search || typeFilter || yearFilter ? t('citations.noCitationsFilter') : t('citations.noCitationsDesc')}
        />
      ) : (
        <div className="space-y-2">
          {citations.map(rec => {
            const doi = rec.externalRef?.match(/10\.\d{4,}\/[^\s]+/)?.[0];
            const year = rec.externalRef?.match(/\b(19|20)\d{2}\b/)?.[0];
            const authors = rec.tags.find(t => t.startsWith('author:'))?.replace('author:', '');
            const journal = rec.tags.find(t => t.startsWith('journal:'))?.replace('journal:', '');
            const isSelected = selectedIds.has(rec.id);

            return (
              <Card key={rec.id} variant="solid" padding="sm" hover="subtle">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(rec.id)}
                    className="mt-1 accent-primary-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-medium text-slate-200 truncate">{rec.title}</p>
                      {year && <Badge size="sm" variant="default">{year}</Badge>}
                    </div>
                    <p className="text-3xs text-slate-500 truncate">
                      {authors && <span>{authors}</span>}
                      {journal && <span className="ml-1 italic">· {journal}</span>}
                      {doi && <span className="ml-1 font-mono">· {doi}</span>}
                    </p>
                    {rec.summary && (
                      <p className="text-3xs text-slate-600 line-clamp-2 mt-1">{rec.summary}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {rec.tags.filter(t => !t.startsWith('author:') && !t.startsWith('journal:')).slice(0, 5).map(tag => (
                        <Badge key={tag} size="sm" variant="default">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleCopy(rec.id, exportSingle(rec.id, 'apa7'))}
                      className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition"
                      title={t('citations.copyApa7')}
                    >
                      {copiedId === rec.id ? <Check size={14} className="text-success-400" /> : <Copy size={14} />}
                    </button>
                    {doi && (
                      <a
                        href={`https://doi.org/${doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition"
                        title={t('citations.openDoi')}
                      >
                        <FileText size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
