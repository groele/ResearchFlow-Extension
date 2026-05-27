import React, { useState } from 'react';
import { useManuscripts, type KanbanStatus } from './useManuscripts';
import { useLang } from '../../i18n';
import { cn } from '../../ui/cn';
import { PageHeader } from '../../ui/components/layout/PageHeader';
import { Card } from '../../ui/components/primitives/Card';
import { Button } from '../../ui/components/primitives/Button';
import { Badge } from '../../ui/components/primitives/Badge';
import { Modal, ModalFooter } from '../../ui/components/primitives/Modal';
import { Input } from '../../ui/components/primitives/Input';
import { Textarea } from '../../ui/components/primitives/Textarea';
import { Select } from '../../ui/components/primitives/Select';
import { EmptyState } from '../../ui/components/primitives/EmptyState';
import { IconButton } from '../../ui/components/primitives/IconButton';
import { ConfirmDialog } from '../../ui/components/primitives/ConfirmDialog';
import { Columns3, Plus, Trash2, Edit2, GripVertical } from 'lucide-react';

export function KanbanView() {
  const { t } = useLang();
  const [deleteMsId, setDeleteMsId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<KanbanStatus | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const {
    kanbanColumns, projects, submissions,
    isManuscriptModalOpen, setIsManuscriptModalOpen,
    editingManuscriptId, manuscriptForm, setManuscriptForm,
    handleSaveManuscript, openEditManuscript, resetForm, handleDeleteManuscript,
    handleMoveManuscript,
  } = useManuscripts();

  const columnConfig: Record<KanbanStatus, { label: string; variant: 'default' | 'primary' | 'warning' | 'success' }> = {
    preparing: { label: t('kanban.preparing'), variant: 'default' },
    submitted: { label: t('kanban.submitted'), variant: 'primary' },
    under_review: { label: t('kanban.underReview'), variant: 'warning' },
    accepted: { label: t('kanban.accepted'), variant: 'success' },
  };

  const subStatusLabel: Record<string, string> = {
    preparing: t('kanban.subPreparing'),
    submitted: t('kanban.subSubmitted'),
    under_review: t('kanban.subUnderReview'),
    revision: t('kanban.subRevision'),
    accepted: t('kanban.subAccepted'),
    published: t('kanban.subPublished'),
    rejected: t('kanban.subRejected'),
  };

  return (
    <div>
      <PageHeader
        title={t('kanban.title')}
        description={t('kanban.description')}
        icon={<Columns3 size={18} />}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => { resetForm(); setIsManuscriptModalOpen(true); }}
            leftIcon={<Plus size={14} />}
          >
            {t('kanban.manuscript')}
          </Button>
        }
      />

      {/* Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {(Object.keys(columnConfig) as KanbanStatus[]).map((status) => {
          const config = columnConfig[status];
          const items = kanbanColumns[status];
          return (
            <div key={status} className="flex-shrink-0 w-72">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant={config.variant} size="sm">{config.label}</Badge>
                <span className="text-2xs text-slate-500">{items.length} {t('kanban.milestones')}</span>
              </div>
              <div
                className={cn(
                  "space-y-2 min-h-[200px] rounded-lg transition-colors p-1",
                  dragOverColumn === status && "bg-primary-500/5 ring-1 ring-primary-500/20"
                )}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverColumn(status); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverColumn(null); }}
                onDrop={(e) => {
                  e.preventDefault();
                  const msId = e.dataTransfer.getData('text/plain');
                  if (msId) handleMoveManuscript(msId, status);
                  setDragOverColumn(null);
                }}
              >
                {items.length === 0 ? (
                  <div className={cn(
                    "p-4 rounded-lg border border-dashed text-center transition-colors",
                    dragOverColumn === status ? "border-primary-500/40" : "border-slate-800"
                  )}>
                    <p className="text-2xs text-slate-600">
                      {dragOverColumn === status ? t('kanban.dropHere') : t('kanban.noManuscripts')}
                    </p>
                  </div>
                ) : (
                  items.map((ms) => {
                    const msSubs = submissions.filter(s => s.manuscriptId === ms.id);
                    return (
                      <Card
                        key={ms.id}
                        variant="solid"
                        padding="sm"
                        hover="subtle"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', ms.id);
                          e.dataTransfer.effectAllowed = 'move';
                          setDraggingId(ms.id);
                        }}
                        onDragEnd={() => setDraggingId(null)}
                        className={cn(
                          "cursor-grab active:cursor-grabbing",
                          draggingId === ms.id && "opacity-40 scale-95"
                        )}
                      >
                        <div className="flex items-start gap-1">
                          <GripVertical size={12} className="text-slate-600 mt-0.5 flex-shrink-0 cursor-grab" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h4 className="text-xs font-medium text-slate-200 flex-1 line-clamp-2">{ms.title}</h4>
                              <div className="flex gap-0.5 ml-1">
                                <IconButton variant="ghost" size="xs" icon={<Edit2 size={11} />} aria-label={t('common.edit')} onClick={() => openEditManuscript(ms)} />
                                <IconButton variant="danger" size="xs" icon={<Trash2 size={11} />} aria-label={t('common.delete')} onClick={() => setDeleteMsId(ms.id)} />
                              </div>
                            </div>
                            {ms.journal && <p className="text-2xs text-slate-500 mt-1">{ms.journal}</p>}
                            {msSubs.length > 0 && (
                              <div className="mt-2 flex gap-1">
                                {msSubs.map(sub => (
                                  <Badge key={sub.id} size="sm" variant={sub.status === 'accepted' ? 'success' : sub.status === 'under_review' ? 'warning' : 'default'}>
                                    {subStatusLabel[sub.status] || sub.status.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteMsId}
        onClose={() => setDeleteMsId(null)}
        onConfirm={async () => {
          if (deleteMsId) await handleDeleteManuscript(deleteMsId);
          setDeleteMsId(null);
        }}
        title={t('common.confirm') + ' — ' + t('common.delete')}
        description={t('kanban.deleteManuscriptDesc')}
        confirmLabel={t('common.delete')}
        variant="danger"
      />

      {/* Manuscript Modal */}
      <Modal
        isOpen={isManuscriptModalOpen}
        onClose={() => setIsManuscriptModalOpen(false)}
        title={editingManuscriptId ? t('kanban.editManuscript') : t('kanban.newManuscript')}
        size="md"
      >
        <div className="space-y-3">
          <Input label={t('kanban.manuscriptTitle')} value={manuscriptForm.title} onChange={(e) => setManuscriptForm({ ...manuscriptForm, title: e.target.value })} placeholder={t('kanban.manuscriptTitlePlaceholder')} />
          <Select
            label={t('kanban.project')}
            value={manuscriptForm.projectId}
            onChange={(e) => setManuscriptForm({ ...manuscriptForm, projectId: e.target.value })}
            options={[
              { value: '', label: t('kanban.noProject') },
              ...projects.map(p => ({ value: p.id, label: p.title }))
            ]}
          />
          <Input label={t('kanban.targetJournal')} value={manuscriptForm.journal} onChange={(e) => setManuscriptForm({ ...manuscriptForm, journal: e.target.value })} placeholder={t('kanban.journalPlaceholder')} />
          <Input label={t('kanban.authors')} value={manuscriptForm.authors} onChange={(e) => setManuscriptForm({ ...manuscriptForm, authors: e.target.value })} placeholder={t('kanban.authorsPlaceholder')} hint={t('kanban.authorsHint')} />
          <Textarea label={t('kanban.abstractLabel')} value={manuscriptForm.abstract} onChange={(e) => setManuscriptForm({ ...manuscriptForm, abstract: e.target.value })} placeholder={t('kanban.abstractPlaceholder')} />
        </div>
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={() => setIsManuscriptModalOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="primary" size="sm" onClick={handleSaveManuscript}>{editingManuscriptId ? t('common.update') : t('common.create')}</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
