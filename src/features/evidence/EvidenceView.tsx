import React, { useState } from 'react';
import { useEvidence } from './useEvidence';
import { useLang } from '@/i18n';
import { PageHeader } from '@components/layout/PageHeader';
import { Card } from '@components/primitives/Card';
import { Button } from '@components/primitives/Button';
import { Badge } from '@components/primitives/Badge';
import { Modal, ModalFooter } from '@components/primitives/Modal';
import { Input } from '@components/primitives/Input';
import { Textarea } from '@components/primitives/Textarea';
import { Select } from '@components/primitives/Select';
import { EmptyState } from '@components/primitives/EmptyState';
import { IconButton } from '@components/primitives/IconButton';
import { ConfirmDialog } from '@components/primitives/ConfirmDialog';
import { Microscope, Plus, Trash2, Edit2, Search, FileImage, FileCode, FileSpreadsheet } from 'lucide-react';

const evidenceTypeIcons: Record<string, React.ReactNode> = {
  figure: <FileImage size={14} />,
  table: <FileSpreadsheet size={14} />,
  code: <FileCode size={14} />,
};

const evidenceTypeColors: Record<string, string> = {
  figure: 'primary',
  table: 'success',
  code: 'info',
  dataset: 'warning',
  other: 'default',
};

export function EvidenceView() {
  const { t } = useLang();
  const [deleteEvidenceId, setDeleteEvidenceId] = useState<string | null>(null);

  const {
    filtered, projects,
    search, setSearch,
    isModalOpen, setIsModalOpen,
    editingId, form, setForm,
    handleSave, openEdit, resetForm, handleDelete,
  } = useEvidence();

  const evidenceTypeLabel: Record<string, string> = {
    figure: t('evidence.figure'),
    table: t('evidence.table'),
    code: t('evidence.code'),
    dataset: t('evidence.dataset'),
    other: t('evidence.other'),
  };

  return (
    <div>
      <PageHeader
        title={t('evidence.title')}
        description={t('evidence.description')}
        icon={<Microscope size={18} />}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            leftIcon={<Plus size={14} />}
          >
            {t('evidence.evidence')}
          </Button>
        }
      />

      <div className="mb-4">
        <Input
          placeholder={t('evidence.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={14} />}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Microscope size={32} />}
          title={t('evidence.noEvidence')}
          description={search ? t('evidence.noEvidenceFilter') : t('evidence.noEvidenceDesc')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item) => (
            <Card key={item.id} variant="solid" padding="md" hover="lift">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant={(evidenceTypeColors[item.evidenceType] as any) || 'default'} size="sm">
                      <span className="flex items-center gap-1">
                        {evidenceTypeIcons[item.evidenceType] || <Microscope size={12} />}
                        {evidenceTypeLabel[item.evidenceType] || item.evidenceType}
                      </span>
                    </Badge>
                  </div>
                  <h3 className="text-sm font-medium text-slate-200 truncate">{item.title}</h3>
                  {item.description && (
                    <p className="text-2xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                  )}
                  {item.filePath && (
                    <p className="text-2xs text-slate-600 mt-1.5 font-mono truncate">{item.filePath}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <IconButton variant="ghost" size="sm" icon={<Edit2 size={13} />} aria-label={t('a11y.edit')} onClick={() => openEdit(item)} />
                  <IconButton variant="danger" size="sm" icon={<Trash2 size={13} />} aria-label={t('a11y.delete')} onClick={() => setDeleteEvidenceId(item.id)} />
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/50 text-2xs text-slate-600">
                {new Date(item.updatedAt).toLocaleDateString()}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteEvidenceId}
        onClose={() => setDeleteEvidenceId(null)}
        onConfirm={async () => {
          if (deleteEvidenceId) await handleDelete(deleteEvidenceId);
          setDeleteEvidenceId(null);
        }}
        title={t('common.confirm') + ' — ' + t('common.delete')}
        description={t('evidence.deleteDesc')}
        confirmLabel={t('common.delete')}
        variant="danger"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? t('evidence.editEvidence') : t('evidence.addEvidence')}
        size="md"
      >
        <div className="space-y-3">
          <Input label={t('evidence.titleLabel')} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t('evidence.titlePlaceholder')} />
          <Select
            label={t('evidence.type')}
            value={form.evidenceType}
            onChange={(e) => setForm({ ...form, evidenceType: e.target.value })}
            options={[
              { value: 'figure', label: t('evidence.figure') },
              { value: 'table', label: t('evidence.table') },
              { value: 'dataset', label: t('evidence.dataset') },
              { value: 'code', label: t('evidence.code') },
              { value: 'other', label: t('evidence.other') },
            ]}
          />
          <Select
            label={t('evidence.project')}
            value={form.projectId}
            onChange={(e) => setForm({ ...form, projectId: e.target.value })}
            options={[
              { value: '', label: t('evidence.noProject') },
              ...projects.map(p => ({ value: p.id, label: p.title }))
            ]}
          />
          <Input label={t('evidence.filePath')} value={form.filePath} onChange={(e) => setForm({ ...form, filePath: e.target.value })} placeholder={t('evidence.filePathPlaceholder')} />
          <Textarea label={t('evidence.descriptionLabel')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t('evidence.descriptionPlaceholder')} />
        </div>
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="primary" size="sm" onClick={handleSave}>{editingId ? t('common.update') : t('common.add')}</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
