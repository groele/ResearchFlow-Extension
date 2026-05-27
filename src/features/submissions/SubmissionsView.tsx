import React, { useState } from 'react';
import { useSubmissions } from './useSubmissions';
import { useLang } from '../../i18n';
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
import { Send, Plus, Trash2, Edit2, Search, Clock, CheckCircle2, FileCheck } from 'lucide-react';

export function SubmissionsView() {
  const { t } = useLang();
  const [deleteSubId, setDeleteSubId] = useState<string | null>(null);

  const statusConfig: Record<string, { label: string; variant: string; icon: React.ReactNode }> = {
    preparing: { label: t('submissions.preparing'), variant: 'default', icon: <Clock size={12} /> },
    submitted: { label: t('submissions.submitted'), variant: 'info', icon: <Send size={12} /> },
    under_review: { label: t('submissions.underReview'), variant: 'warning', icon: <Clock size={12} /> },
    revision_requested: { label: t('submissions.revisionRequested'), variant: 'warning', icon: <Edit2 size={12} /> },
    accepted: { label: t('submissions.accepted'), variant: 'success', icon: <CheckCircle2 size={12} /> },
    published: { label: t('submissions.published'), variant: 'primary', icon: <FileCheck size={12} /> },
    rejected: { label: t('submissions.rejected'), variant: 'error', icon: <Trash2 size={12} /> },
  };

  const {
    filtered, manuscripts,
    search, setSearch,
    isModalOpen, setIsModalOpen,
    editingId, form, setForm,
    handleSave, openEdit, resetForm, handleDelete, handleStatusChange,
  } = useSubmissions();

  return (
    <div>
      <PageHeader
        title={t('submissions.title')}
        description={t('submissions.description')}
        icon={<Send size={18} />}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            leftIcon={<Plus size={14} />}
          >
            {t('submissions.submission')}
          </Button>
        }
      />

      <div className="mb-4">
        <Input
          placeholder={t('submissions.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={14} />}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Send size={32} />}
          title={t('submissions.noSubmissions')}
          description={search ? t('submissions.noSubmissionsFilter') : t('submissions.noSubmissionsDesc')}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((sub) => {
            const sc = statusConfig[sub.status] || statusConfig.preparing;
            const manuscript = manuscripts.find(m => m.id === sub.manuscriptId);
            return (
              <Card key={sub.id} variant="solid" padding="md" hover="lift">
                <div className="flex items-start gap-4">
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    <div className={`h-3 w-3 rounded-full ${
                      sub.status === 'accepted' || sub.status === 'published' ? 'bg-success-500' :
                      sub.status === 'rejected' ? 'bg-error-500' :
                      sub.status === 'under_review' || sub.status === 'revision_requested' ? 'bg-warning-500' :
                      sub.status === 'submitted' ? 'bg-info-500' : 'bg-slate-600'
                    }`} />
                    <div className="w-px h-full bg-slate-800" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={sc.variant as any} size="sm">
                        <span className="flex items-center gap-1">{sc.icon} {sc.label}</span>
                      </Badge>
                      {sub.timelineNodes && sub.timelineNodes.length > 0 && (
                        <span className="text-2xs text-slate-600">{sub.timelineNodes.length} {t('kanban.milestones')}</span>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-slate-200">{sub.journal}</h3>
                    {manuscript && (
                      <p className="text-2xs text-slate-500 mt-0.5">{t('submissions.manuscript')}: {manuscript.title}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-2xs text-slate-600">
                      {sub.initialSubmissionDate && (
                        <span>{t('submissions.submittedLabel')}: {new Date(sub.initialSubmissionDate).toLocaleDateString()}</span>
                      )}
                      {sub.acceptanceDate && (
                        <span className="text-success-500">{t('submissions.acceptedLabel')}: {new Date(sub.acceptanceDate).toLocaleDateString()}</span>
                      )}
                      {sub.deadlineDate && (
                        <span className="text-warning-500">{t('submissions.deadlineLabel')}: {new Date(sub.deadlineDate).toLocaleDateString()}</span>
                      )}
                    </div>
                    {sub.notes && (
                      <p className="text-2xs text-slate-600 mt-1.5 line-clamp-2">{sub.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <IconButton variant="ghost" size="sm" icon={<Edit2 size={13} />} aria-label="Edit" onClick={() => openEdit(sub)} />
                    <IconButton variant="danger" size="sm" icon={<Trash2 size={13} />} aria-label="Delete" onClick={() => setDeleteSubId(sub.id)} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteSubId}
        onClose={() => setDeleteSubId(null)}
        onConfirm={async () => {
          if (deleteSubId) await handleDelete(deleteSubId);
          setDeleteSubId(null);
        }}
        title={t('common.confirm') + ' — ' + t('common.delete')}
        description={t('submissions.deleteDesc')}
        confirmLabel={t('common.delete')}
        variant="danger"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? t('submissions.editSubmission') : t('submissions.newSubmission')}
        size="md"
      >
        <div className="space-y-3">
          <Select
            label={t('submissions.manuscript')}
            value={form.manuscriptId}
            onChange={(e) => setForm({ ...form, manuscriptId: e.target.value })}
            options={[
              { value: '', label: t('submissions.selectManuscript') },
              ...manuscripts.map(m => ({ value: m.id, label: m.title }))
            ]}
          />
          <Input label={t('submissions.journal')} value={form.journal} onChange={(e) => setForm({ ...form, journal: e.target.value })} placeholder={t('submissions.journalPlaceholder')} />
          <Select
            label={t('submissions.status')}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={Object.entries(statusConfig).map(([val, cfg]) => ({ value: val, label: cfg.label }))}
          />
          <Input label={t('submissions.submissionDate')} type="date" value={form.initialSubmissionDate} onChange={(e) => setForm({ ...form, initialSubmissionDate: e.target.value })} />
          <Input label={t('submissions.deadline')} type="date" value={form.deadlineDate} onChange={(e) => setForm({ ...form, deadlineDate: e.target.value })} />
          <Textarea label={t('submissions.notes')} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t('submissions.notesPlaceholder')} />
        </div>
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="primary" size="sm" onClick={handleSave}>{editingId ? t('common.update') : t('common.create')}</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
