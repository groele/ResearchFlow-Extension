import React, { useState, useMemo } from 'react';
import { usePlanning } from './usePlanning';
import { useLang } from '@/i18n';
import { PageHeader } from '@components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@components/primitives/Card';
import { Button } from '@components/primitives/Button';
import { Badge } from '@components/primitives/Badge';
import { Modal, ModalFooter } from '@components/primitives/Modal';
import { Input } from '@components/primitives/Input';
import { Textarea } from '@components/primitives/Textarea';
import { Select } from '@components/primitives/Select';
import { EmptyState } from '@components/primitives/EmptyState';
import { IconButton } from '@components/primitives/IconButton';
import { ConfirmDialog } from '@components/primitives/ConfirmDialog';
import { HypothesisGraph, type GraphNode, type GraphEdge } from '@components/domain/HypothesisGraph';
import { Beaker, Plus, Trash2, Edit2, FlaskConical, Target, CheckCircle2, XCircle, Clock, Play, Microscope, ArrowRight, Share2 } from 'lucide-react';

export function PlanningView() {
  const { t } = useLang();
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'hyp' | 'exp'; id: string } | null>(null);

  const hypStatusConfig: Record<string, { label: string; variant: string; icon: React.ReactNode }> = {
    proposed: { label: t('planning.proposed'), variant: 'default', icon: <Target size={12} /> },
    testing: { label: t('planning.testing'), variant: 'warning', icon: <Clock size={12} /> },
    confirmed: { label: t('planning.confirmed'), variant: 'success', icon: <CheckCircle2 size={12} /> },
    refuted: { label: t('planning.refuted'), variant: 'error', icon: <XCircle size={12} /> },
  };

  const expStatusConfig: Record<string, { label: string; variant: string; icon: React.ReactNode }> = {
    planned: { label: t('planning.planned'), variant: 'default', icon: <Clock size={12} /> },
    running: { label: t('planning.running'), variant: 'info', icon: <Play size={12} /> },
    completed: { label: t('planning.completed'), variant: 'success', icon: <CheckCircle2 size={12} /> },
    failed: { label: t('planning.failed'), variant: 'error', icon: <XCircle size={12} /> },
  };

  const {
    projects, hypotheses, experiments, allHypotheses,
    selectedProjectId, setSelectedProjectId,
    isHypModalOpen, setIsHypModalOpen,
    editingHypId, hypForm, setHypForm,
    handleSaveHypothesis, openEditHyp, resetHypForm, handleDeleteHypothesis, handleHypStatusChange,
    isExpModalOpen, setIsExpModalOpen,
    editingExpId, expForm, setExpForm,
    handleSaveExperiment, openEditExp, resetExpForm, handleDeleteExperiment, handleExpStatusChange,
    // Workflow coherence
    experimentsByHypothesis, evidenceByHypothesis,
    handleCreateExperimentFromHypothesis, handleCreateEvidenceFromExperiment,
  } = usePlanning();

  const hypColumns = ['proposed', 'testing', 'confirmed', 'refuted'];

  // Hypothesis-Experiment graph data
  const graphNodes = useMemo<GraphNode[]>(() => {
    const hypNodes: GraphNode[] = hypotheses.map(h => ({
      id: h.id,
      label: h.statement,
      type: 'hypothesis' as const,
      status: h.status,
    }));
    const expNodes: GraphNode[] = experiments.map(e => ({
      id: e.id,
      label: e.title,
      type: 'experiment' as const,
      status: e.status,
    }));
    return [...hypNodes, ...expNodes];
  }, [hypotheses, experiments]);

  const graphEdges = useMemo<GraphEdge[]>(() => {
    return experiments
      .filter(e => e.hypothesisId && hypotheses.some(h => h.id === e.hypothesisId))
      .map(e => ({ from: e.hypothesisId!, to: e.id }));
  }, [experiments, hypotheses]);

  return (
    <div>
      <PageHeader
        title={t('planning.title')}
        description={t('planning.description')}
        icon={<Beaker size={18} />}
        actions={
          <div className="flex gap-2">
            <Select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              options={[
                { value: '', label: t('planning.allProjects') },
                ...projects.map(p => ({ value: p.id, label: p.title }))
              ]}
              className="w-48"
            />
            <Button variant="secondary" size="sm" onClick={() => { resetHypForm(); setIsHypModalOpen(true); }} leftIcon={<Plus size={14} />}>
              {t('planning.hypothesis')}
            </Button>
            <Button variant="primary" size="sm" onClick={() => { resetExpForm(); setIsExpModalOpen(true); }} leftIcon={<Plus size={14} />}>
              {t('planning.experiment')}
            </Button>
          </div>
        }
      />

      {/* Hypothesis-Experiment Network Graph */}
      {graphNodes.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <Share2 size={13} /> {t('planning.hypothesisGraph')}
          </h3>
          <Card variant="solid" padding="md">
            <HypothesisGraph
              nodes={graphNodes}
              edges={graphEdges}
              height={Math.max(220, graphNodes.length * 30 + 60)}
              hypothesisLabel={t('planning.hypothesis')}
              experimentLabel={t('planning.experiment')}
            />
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-800/60">
              <span className="text-3xs text-slate-500">
                {t('planning.graphHypotheses')}: {hypotheses.length}
              </span>
              <span className="text-3xs text-slate-500">
                {t('planning.graphExperiments')}: {experiments.length}
              </span>
              <span className="text-3xs text-slate-500">
                {t('planning.graphLinked')}: {graphEdges.length}
              </span>
              <span className="text-3xs text-slate-500">
                {t('planning.graphUnlinked')}: {experiments.filter(e => !e.hypothesisId).length}
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* Hypothesis Board */}
      <div className="mb-8">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Target size={13} /> {t('planning.hypothesisBoard')}
        </h3>
        {hypotheses.length === 0 ? (
          <EmptyState
            icon={<Target size={28} />}
            title={t('planning.noHypotheses')}
            description={selectedProjectId ? t('planning.noHypothesesProject') : t('planning.noHypothesesDesc')}
          />
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {hypColumns.map(status => {
              const colHyps = hypotheses.filter(h => h.status === status);
              const cfg = hypStatusConfig[status];
              return (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={cfg.variant as any} size="sm">{cfg.icon} {cfg.label}</Badge>
                    <span className="text-3xs text-slate-600">{colHyps.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[80px]">
                    {colHyps.map(h => {
                      const linkedExps = experimentsByHypothesis[h.id] || [];
                      const linkedEv = evidenceByHypothesis[h.id] || [];
                      return (
                      <Card key={h.id} variant="solid" padding="sm" hover="subtle">
                        <p className="text-xs text-slate-200 line-clamp-3 mb-2">{h.statement}</p>
                        {h.notes && <p className="text-3xs text-slate-500 line-clamp-2 mb-2">{h.notes}</p>}

                        {/* Linked experiments & evidence */}
                        <div className="mb-2 space-y-1">
                          {linkedExps.length > 0 && (
                            <div className="flex items-center gap-1 text-3xs text-slate-400">
                              <FlaskConical size={10} />
                              <span>{linkedExps.length} {t('planning.experimentCount')}</span>
                            </div>
                          )}
                          {linkedEv.length > 0 && (
                            <div className="flex items-center gap-1 text-3xs text-slate-400">
                              <Microscope size={10} />
                              <span>{linkedEv.length} {t('planning.evidenceCount')}</span>
                            </div>
                          )}
                        </div>

                        {/* Quick action: create experiment from hypothesis */}
                        <button
                          onClick={() => handleCreateExperimentFromHypothesis(h.id)}
                          className="w-full mb-2 flex items-center justify-center gap-1 text-3xs text-teal-400 hover:text-teal-300 px-2 py-1 rounded bg-teal-900/30 hover:bg-teal-900/50 transition border border-teal-800/30"
                        >
                          <ArrowRight size={10} />
                          {t('planning.createExperimentFromHyp')}
                        </button>

                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            {hypColumns.filter(s => s !== h.status).map(s => (
                              <button
                                key={s}
                                onClick={() => handleHypStatusChange(h.id, s)}
                                className="text-3xs text-slate-500 hover:text-slate-300 px-1 py-0.5 rounded bg-slate-800/50 hover:bg-slate-800 transition"
                                title={t('planning.moveTo') + ' ' + hypStatusConfig[s].label}
                              >
                                {hypStatusConfig[s].label}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-0.5">
                            <IconButton variant="ghost" size="xs" icon={<Edit2 size={10} />} aria-label={t('a11y.edit')} onClick={() => openEditHyp(h)} />
                            <IconButton variant="danger" size="xs" icon={<Trash2 size={10} />} aria-label={t('a11y.delete')} onClick={() => setConfirmDelete({ type: 'hyp', id: h.id })} />
                          </div>
                        </div>
                      </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Experiments List */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <FlaskConical size={13} /> {t('planning.experiments')}
        </h3>
        {experiments.length === 0 ? (
          <EmptyState
            icon={<FlaskConical size={28} />}
            title={t('planning.noExperiments')}
            description={t('planning.noExperimentsDesc')}
          />
        ) : (
          <div className="space-y-3">
            {experiments.map(exp => {
              const cfg = expStatusConfig[exp.status] || expStatusConfig.planned;
              const linkedHyp = allHypotheses.find(h => h.id === exp.hypothesisId);
              const linkedEv = linkedHyp ? (evidenceByHypothesis[linkedHyp.id] || []) : [];
              return (
                <Card key={exp.id} variant="solid" padding="md" hover="subtle">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={cfg.variant as any} size="sm">{cfg.icon} {cfg.label}</Badge>
                        {linkedHyp && (
                          <Badge variant="default" size="sm">
                            <Target size={10} /> {linkedHyp.statement.slice(0, 30)}...
                          </Badge>
                        )}
                      </div>
                      <h4 className="text-sm font-medium text-slate-200">{exp.title}</h4>
                      {exp.design && <p className="text-2xs text-slate-400 mt-1 line-clamp-2">{exp.design}</p>}
                      {exp.variables && <p className="text-3xs text-slate-500 mt-1">{t('planning.variablesLabel')} {exp.variables}</p>}

                      {/* Linked hypothesis detail */}
                      {linkedHyp && (
                        <div className="mt-2 flex items-center gap-1.5 text-3xs text-slate-500">
                          <Target size={10} className="text-teal-500" />
                          <span className="truncate">{linkedHyp.statement}</span>
                          <Badge variant={hypStatusConfig[linkedHyp.status]?.variant as any || 'default'} size="sm">
                            {hypStatusConfig[linkedHyp.status]?.label || linkedHyp.status}
                          </Badge>
                        </div>
                      )}

                      {/* Linked evidence */}
                      {linkedEv.length > 0 && (
                        <div className="mt-1.5 flex items-center gap-1 text-3xs text-slate-500">
                          <Microscope size={10} />
                          <span>{linkedEv.length} {t('planning.evidenceCount')}</span>
                        </div>
                      )}

                      {exp.results && (
                        <div className="mt-2 p-2 rounded bg-slate-950/40 border border-slate-800/50">
                          <p className="text-2xs text-slate-300">{exp.results}</p>
                        </div>
                      )}

                      {/* Quick action: create evidence from experiment */}
                      <button
                        onClick={() => handleCreateEvidenceFromExperiment(exp.id)}
                        className="mt-2 flex items-center gap-1 text-3xs text-teal-400 hover:text-teal-300 px-2 py-1 rounded bg-teal-900/30 hover:bg-teal-900/50 transition border border-teal-800/30"
                      >
                        <ArrowRight size={10} />
                        {t('planning.createEvidenceFromExp')}
                      </button>
                    </div>
                    <div className="flex items-center gap-1 ml-3">
                      {expStatusConfig && Object.entries(expStatusConfig)
                        .filter(([k]) => k !== exp.status)
                        .map(([k, c]) => (
                          <button
                            key={k}
                            onClick={() => handleExpStatusChange(exp.id, k)}
                            className="text-3xs text-slate-500 hover:text-slate-300 px-1.5 py-0.5 rounded bg-slate-800/50 hover:bg-slate-800 transition"
                            title={t('planning.moveTo') + ' ' + c.label}
                          >
                            {c.label}
                          </button>
                        ))}
                      <IconButton variant="ghost" size="sm" icon={<Edit2 size={13} />} aria-label={t('a11y.edit')} onClick={() => openEditExp(exp)} />
                      <IconButton variant="danger" size="sm" icon={<Trash2 size={13} />} aria-label={t('a11y.delete')} onClick={() => setConfirmDelete({ type: 'exp', id: exp.id })} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (!confirmDelete) return;
          if (confirmDelete.type === 'hyp') await handleDeleteHypothesis(confirmDelete.id);
          else await handleDeleteExperiment(confirmDelete.id);
          setConfirmDelete(null);
        }}
        title={t('common.confirm') + ' — ' + t('common.delete')}
        description={confirmDelete?.type === 'hyp'
          ? t('planning.deleteHypothesisDesc')
          : t('planning.deleteExperimentDesc')}
        confirmLabel={t('common.delete')}
        variant="danger"
      />

      {/* Hypothesis Modal */}
      <Modal isOpen={isHypModalOpen} onClose={() => setIsHypModalOpen(false)} title={editingHypId ? t('planning.editHypothesis') : t('planning.newHypothesis')} size="md">
        <div className="space-y-3">
          <Textarea label={t('planning.hypothesisStatement')} value={hypForm.statement} onChange={(e) => setHypForm({ ...hypForm, statement: e.target.value })} placeholder={t('planning.hypothesisPlaceholder')} />
          <Select
            label={t('submissions.status')}
            value={hypForm.status}
            onChange={(e) => setHypForm({ ...hypForm, status: e.target.value })}
            options={Object.entries(hypStatusConfig).map(([v, c]) => ({ value: v, label: c.label }))}
          />
          <Textarea label={t('planning.notes')} value={hypForm.notes} onChange={(e) => setHypForm({ ...hypForm, notes: e.target.value })} placeholder={t('planning.notesPlaceholder')} />
        </div>
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={() => setIsHypModalOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="primary" size="sm" onClick={handleSaveHypothesis}>{editingHypId ? t('common.update') : t('common.create')}</Button>
        </ModalFooter>
      </Modal>

      {/* Experiment Modal */}
      <Modal isOpen={isExpModalOpen} onClose={() => setIsExpModalOpen(false)} title={editingExpId ? t('planning.editExperiment') : t('planning.newExperiment')} size="lg">
        <div className="space-y-3">
          <Input label={t('planning.experimentTitle')} value={expForm.title} onChange={(e) => setExpForm({ ...expForm, title: e.target.value })} placeholder={t('planning.experimentTitlePlaceholder')} />
          <Select
            label={t('planning.linkedHypothesis')}
            value={expForm.hypothesisId}
            onChange={(e) => setExpForm({ ...expForm, hypothesisId: e.target.value })}
            options={[
              { value: '', label: t('planning.noHypothesis') },
              ...allHypotheses.map(h => ({ value: h.id, label: h.statement.slice(0, 60) + (h.statement.length > 60 ? '...' : '') }))
            ]}
          />
          <Textarea label={t('planning.experimentalDesign')} value={expForm.design} onChange={(e) => setExpForm({ ...expForm, design: e.target.value })} placeholder={t('planning.designPlaceholder')} />
          <Input label={t('planning.variables')} value={expForm.variables} onChange={(e) => setExpForm({ ...expForm, variables: e.target.value })} placeholder={t('planning.variablesPlaceholder')} />
          <Select
            label={t('submissions.status')}
            value={expForm.status}
            onChange={(e) => setExpForm({ ...expForm, status: e.target.value })}
            options={Object.entries(expStatusConfig).map(([v, c]) => ({ value: v, label: c.label }))}
          />
          <Textarea label={t('planning.results')} value={expForm.results} onChange={(e) => setExpForm({ ...expForm, results: e.target.value })} placeholder={t('planning.resultsPlaceholder')} />
        </div>
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={() => setIsExpModalOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="primary" size="sm" onClick={handleSaveExperiment}>{editingExpId ? t('common.update') : t('common.create')}</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
