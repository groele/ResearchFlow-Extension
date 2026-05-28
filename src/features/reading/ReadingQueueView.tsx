import React from 'react';
import { useReadingQueue, type ReadingStatus, type ReadingFilter } from './useReadingQueue';
import { useLang } from '@/i18n';
import { PageHeader } from '@components/layout/PageHeader';
import { Card } from '@components/primitives/Card';
import { Badge } from '@components/primitives/Badge';
import { Button } from '@components/primitives/Button';
import { Input } from '@components/primitives/Input';
import { Select } from '@components/primitives/Select';
import { EmptyState } from '@components/primitives/EmptyState';
import { BookOpen, Search, Star, Clock, CheckCircle2, RotateCcw, Eye, Plus, CheckCheck } from 'lucide-react';

interface ReadingQueueViewProps {
  onNavigate?: (view: string) => void;
}

export function ReadingQueueView({ onNavigate }: ReadingQueueViewProps) {
  const { t } = useLang();
  const {
    readingQueue, projects, stats,
    statusFilter, setStatusFilter,
    projectFilter, setProjectFilter,
    search, setSearch,
    sortBy, setSortBy,
    handleStatusChange,
    handleToggleStar,
    markAllAsRead,
  } = useReadingQueue();

  const statusConfig: Record<ReadingStatus, { label: string; variant: string; icon: React.ReactNode }> = {
    unread: { label: t('reading.unread'), variant: 'default', icon: <BookOpen size={12} /> },
    reading: { label: t('reading.reading'), variant: 'info', icon: <Eye size={12} /> },
    read: { label: t('reading.read'), variant: 'success', icon: <CheckCircle2 size={12} /> },
    'to-reread': { label: t('reading.toReread'), variant: 'warning', icon: <RotateCcw size={12} /> },
  };

  return (
    <div>
      <PageHeader
        title={t('reading.title')}
        description={`${stats.total} ${t('reading.papers')} · ${stats.unread} ${t('reading.unreadCount')} · ${stats.reading} ${t('reading.readingCount')} · ${stats.read} ${t('reading.readCount')}`}
        icon={<BookOpen size={18} />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<CheckCheck size={14} />}
              onClick={markAllAsRead}
            >
              {t('reading.markAllRead')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => onNavigate?.('records')}
            >
              {t('reading.addPaper')}
            </Button>
          </div>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {(Object.entries(statusConfig) as [ReadingStatus, typeof statusConfig[ReadingStatus]][]).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
            className={`p-2.5 rounded-lg border text-center transition ${
              statusFilter === key
                ? 'border-primary-500 bg-primary-600/15'
                : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/60'
            }`}
          >
            <p className="text-lg font-bold text-slate-100 font-display">{stats[key] || 0}</p>
            <p className="text-3xs text-slate-500 uppercase tracking-wider">{cfg.label}</p>
          </button>
        ))}
        <button
          onClick={() => setStatusFilter(statusFilter === 'starred' ? 'all' : 'starred')}
          className={`p-2.5 rounded-lg border text-center transition ${
            statusFilter === 'starred'
              ? 'border-primary-500 bg-primary-600/15'
              : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/60'
          }`}
        >
          <p className="text-lg font-bold text-slate-100 font-display">{stats.starred}</p>
          <p className="text-3xs text-slate-500 uppercase tracking-wider">{t('reading.starred')}</p>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <Input
            placeholder={t('reading.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={14} />}
          />
        </div>
        <Select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          options={[
            { value: '', label: t('reading.allProjects') },
            ...projects.map(p => ({ value: p.id, label: p.title }))
          ]}
          className="w-48"
        />
        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          options={[
            { value: 'date', label: t('reading.sortByDate') },
            { value: 'title', label: t('reading.sortByTitle') },
            { value: 'status', label: t('reading.sortByStatus') },
          ]}
          className="w-40"
        />
      </div>

      {/* Queue List */}
      {readingQueue.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={32} />}
          title={t('reading.queueEmpty')}
          description={search || statusFilter !== 'all' ? t('reading.queueEmptyFilter') : t('reading.queueEmptyDesc')}
        />
      ) : (
        <div className="space-y-2">
          {readingQueue.map(rec => {
            const status = (rec.readingStatus || 'unread') as ReadingStatus;
            const cfg = statusConfig[status];
            return (
              <Card key={rec.id} variant="solid" padding="sm" hover="subtle">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleStar(rec.id)}
                    className={`flex-shrink-0 transition ${rec.starred ? 'text-warning-400' : 'text-slate-600 hover:text-slate-400'}`}
                  >
                    <Star size={16} fill={rec.starred ? 'currentColor' : 'none'} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">{rec.title}</p>
                    <p className="text-3xs text-slate-500 truncate mt-0.5">
                      {rec.externalRef && <span className="font-mono">{rec.externalRef}</span>}
                      {rec.tags.length > 0 && <span> · {rec.tags.slice(0, 3).join(', ')}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {Object.entries(statusConfig).map(([key, sCfg]) => (
                      <button
                        key={key}
                        onClick={() => handleStatusChange(rec.id, key as ReadingStatus)}
                        className={`p-1 rounded transition ${
                          status === key
                            ? 'bg-primary-600/20 text-primary-400'
                            : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'
                        }`}
                        title={sCfg.label}
                      >
                        {sCfg.icon}
                      </button>
                    ))}
                  </div>
                  <Badge variant={cfg.variant as any} size="sm">{cfg.label}</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
