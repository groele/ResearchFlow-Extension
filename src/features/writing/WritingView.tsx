import React, { useState } from 'react';
import { useWriting } from './useWriting';
import { useLang } from '../../i18n';
import { PageHeader } from '../../ui/components/layout/PageHeader';
import { Card } from '../../ui/components/primitives/Card';
import { Button } from '../../ui/components/primitives/Button';
import { Badge } from '../../ui/components/primitives/Badge';
import { Select } from '../../ui/components/primitives/Select';
import { EmptyState } from '../../ui/components/primitives/EmptyState';
import { ProgressBar } from '../../ui/components/primitives/ProgressBar';
import { ConfirmDialog } from '../../ui/components/primitives/ConfirmDialog';
import { PenLine, Plus, Trash2, ChevronUp, ChevronDown, FileText, LayoutTemplate } from 'lucide-react';

export function WritingView() {
  const { t } = useLang();
  const {
    manuscripts, projects,
    selectedMsId, selectedManuscript,
    sections, activeSection, activeSectionId, setActiveSectionId,
    wordCount, progress,
    handleSelectManuscript,
    handleApplyTemplate,
    handleUpdateSection,
    handleAddSection,
    handleDeleteSection,
    handleReorderSection,
  } = useWriting();

  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [showAddSection, setShowAddSection] = useState(false);
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);

  return (
    <div>
      <PageHeader
        title={t('writing.title')}
        description={t('writing.description')}
        icon={<PenLine size={18} />}
        actions={
          <div className="flex gap-2">
            <Select
              value={selectedMsId}
              onChange={(e) => handleSelectManuscript(e.target.value)}
              options={[
                { value: '', label: t('writing.selectManuscript') },
                ...manuscripts.map(m => ({ value: m.id, label: m.title }))
              ]}
              className="w-64"
            />
          </div>
        }
      />

      {!selectedMsId ? (
        <EmptyState
          icon={<PenLine size={32} />}
          title={t('writing.selectManuscriptTitle')}
          description={t('writing.selectManuscriptDesc')}
        />
      ) : (
        <div className="flex gap-4">
          {/* Sidebar: Section List */}
          <div className="w-56 flex-shrink-0">
            {/* Progress */}
            <Card variant="solid" padding="sm" className="mb-3">
              <ProgressBar value={progress} color={progress === 100 ? 'success' : 'primary'} label={t('writing.completion')} showValue size="sm" />
              <div className="flex items-center justify-between mt-2 text-3xs text-slate-500">
                <span>{wordCount.total} {t('common.words')} {t('common.total')}</span>
                <span>{sections.length} {t('common.sections')}</span>
              </div>
            </Card>

            {/* Template button */}
            {sections.length === 0 && (
              <Button
                variant="secondary"
                size="sm"
                className="w-full mb-3"
                onClick={() => handleApplyTemplate()}
                leftIcon={<LayoutTemplate size={14} />}
              >
                {t('writing.applyImrad')}
              </Button>
            )}

            {/* Section list */}
            <div className="space-y-1">
              {sections.map((sec, idx) => (
                <button
                  key={sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                    activeSectionId === sec.id
                      ? 'bg-primary-600/15 text-primary-400 border border-primary-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-3xs text-slate-600">{idx + 1}</span>
                    <span className="truncate">{sec.title}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {sec.content.trim().length > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-success-500" />
                    )}
                    <div className="flex flex-col">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReorderSection(sec.id, 'up'); }}
                        className="text-slate-600 hover:text-slate-400"
                        disabled={idx === 0}
                      >
                        <ChevronUp size={10} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReorderSection(sec.id, 'down'); }}
                        className="text-slate-600 hover:text-slate-400"
                        disabled={idx === sections.length - 1}
                      >
                        <ChevronDown size={10} />
                      </button>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Add section */}
            {showAddSection ? (
              <div className="mt-2 flex gap-1">
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newSectionTitle.trim()) {
                      handleAddSection(newSectionTitle);
                      setNewSectionTitle('');
                      setShowAddSection(false);
                    }
                  }}
                  placeholder={t('writing.sectionTitlePlaceholder')}
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-primary-500 focus:outline-none rounded px-2 py-1 text-2xs text-slate-200"
                  autoFocus
                />
                <Button variant="ghost" size="xs" onClick={() => { setShowAddSection(false); setNewSectionTitle(''); }}>
                  <span className="text-2xs">{t('common.cancel')}</span>
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddSection(true)}
                className="mt-2 w-full flex items-center gap-1.5 px-3 py-1.5 text-2xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 rounded-lg transition"
              >
                <Plus size={12} /> {t('writing.addSection')}
              </button>
            )}
          </div>

          {/* Main: Editor */}
          <div className="flex-1 min-w-0">
            {activeSection ? (
              <Card variant="solid" padding="md">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-200">{activeSection.title}</h3>
                    <Badge size="sm">{wordCount.current} {t('common.words')}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setDeleteSectionId(activeSection.id)}
                    leftIcon={<Trash2 size={12} />}
                  >
                    {t('writing.delete')}
                  </Button>
                </div>
                <textarea
                  value={activeSection.content}
                  onChange={(e) => handleUpdateSection(activeSection.id, e.target.value)}
                  className="w-full min-h-[400px] bg-slate-950/60 border border-slate-800 focus:border-primary-500 focus:outline-none rounded-lg p-4 text-sm leading-relaxed text-slate-200 resize-y placeholder-slate-500 font-serif"
                  placeholder={`${t('writing.writePlaceholder')} ${activeSection.title.toLowerCase()} ${t('writing.writeHere')}`}
                />
              </Card>
            ) : (
              <EmptyState
                title={t('writing.noSection')}
                description={t('writing.noSectionDesc')}
              />
            )}
          </div>
        </div>
      )}

      {/* Delete Section Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteSectionId}
        onClose={() => setDeleteSectionId(null)}
        onConfirm={async () => {
          if (deleteSectionId) await handleDeleteSection(deleteSectionId);
          setDeleteSectionId(null);
        }}
        title={t('common.confirm') + ' — ' + t('common.delete')}
        description={t('writing.deleteSectionDesc')}
        confirmLabel={t('common.delete')}
        variant="danger"
      />
    </div>
  );
}
