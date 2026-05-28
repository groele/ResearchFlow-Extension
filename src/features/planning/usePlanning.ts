import { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Hypothesis, type Experiment } from '@storage/dexie';
import { generateId } from '@storage/id';

export function usePlanning() {
  const projects = useLiveQuery(() => db.projects.toArray()) ?? [];
  const hypotheses = useLiveQuery(() => db.hypotheses.toArray()) ?? [];
  const experiments = useLiveQuery(() => db.experiments.toArray()) ?? [];

  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isHypModalOpen, setIsHypModalOpen] = useState(false);
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [editingHypId, setEditingHypId] = useState<string | null>(null);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);

  const [hypForm, setHypForm] = useState({
    statement: '',
    status: 'proposed' as string,
    notes: '',
  });

  const [expForm, setExpForm] = useState({
    title: '',
    hypothesisId: '',
    design: '',
    variables: '',
    status: 'planned' as string,
    results: '',
    resultSummary: '',
  });

  const projectHypotheses = selectedProjectId
    ? hypotheses.filter(h => h.projectId === selectedProjectId)
    : hypotheses;

  const projectExperiments = selectedProjectId
    ? experiments.filter(e => e.projectId === selectedProjectId)
    : experiments;

  const resetHypForm = useCallback(() => {
    setEditingHypId(null);
    setHypForm({ statement: '', status: 'proposed', notes: '' });
  }, []);

  const resetExpForm = useCallback(() => {
    setEditingExpId(null);
    setExpForm({ title: '', hypothesisId: '', design: '', variables: '', status: 'planned', results: '', resultSummary: '' });
  }, []);

  const openEditHyp = useCallback((h: Hypothesis) => {
    setEditingHypId(h.id);
    setHypForm({ statement: h.statement, status: h.status, notes: h.notes || '' });
    setIsHypModalOpen(true);
  }, []);

  const openEditExp = useCallback((e: Experiment) => {
    setEditingExpId(e.id);
    setExpForm({
      title: e.title,
      hypothesisId: e.hypothesisId || '',
      design: e.design,
      variables: e.variables,
      status: e.status,
      results: e.results || '',
      resultSummary: e.resultSummary || '',
    });
    setIsExpModalOpen(true);
  }, []);

  const handleSaveHypothesis = useCallback(async () => {
    if (!hypForm.statement.trim() || !selectedProjectId) return;
    try {
      const now = new Date().toISOString();
      const existing = editingHypId ? await db.hypotheses.get(editingHypId) : null;
      await db.hypotheses.put({
        id: editingHypId || generateId('hyp'),
        projectId: selectedProjectId,
        statement: hypForm.statement.trim(),
        status: hypForm.status,
        evidenceIds: existing?.evidenceIds || [],
        notes: hypForm.notes.trim(),
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      });
      resetHypForm();
      setIsHypModalOpen(false);
    } catch (e: unknown) {
      console.error('Failed to save hypothesis:', e);
    }
  }, [editingHypId, hypForm, selectedProjectId, resetHypForm]);

  const handleSaveExperiment = useCallback(async () => {
    if (!expForm.title.trim() || !selectedProjectId) return;
    try {
      const now = new Date().toISOString();
      const existing = editingExpId ? await db.experiments.get(editingExpId) : null;
      await db.experiments.put({
        id: editingExpId || generateId('exp'),
        projectId: selectedProjectId,
        hypothesisId: expForm.hypothesisId || null,
        title: expForm.title.trim(),
        design: expForm.design.trim(),
        variables: expForm.variables.trim(),
        status: expForm.status,
        results: expForm.results.trim(),
        resultSummary: expForm.resultSummary?.trim() || '',
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      });
      resetExpForm();
      setIsExpModalOpen(false);
    } catch (e: unknown) {
      console.error('Failed to save experiment:', e);
    }
  }, [editingExpId, expForm, selectedProjectId, resetExpForm]);

  const handleDeleteHypothesis = useCallback(async (id: string) => {
    try {
      await db.hypotheses.delete(id);
      // Cascade: unlink experiments referencing this hypothesis
      const linkedExps = await db.experiments.where('hypothesisId').equals(id).toArray();
      for (const exp of linkedExps) {
        await db.experiments.update(exp.id, { hypothesisId: null });
      }
    } catch (e: unknown) {
      console.error('Failed to delete hypothesis:', e);
    }
  }, []);

  const handleDeleteExperiment = useCallback(async (id: string) => {
    try {
      await db.experiments.delete(id);
    } catch (e: unknown) {
      console.error('Failed to delete experiment:', e);
    }
  }, []);

  const handleHypStatusChange = useCallback(async (id: string, newStatus: string) => {
    try {
      await db.hypotheses.update(id, { status: newStatus, updatedAt: new Date().toISOString() });
    } catch (e: unknown) {
      console.error('Failed to update hypothesis status:', e);
    }
  }, []);

  const handleExpStatusChange = useCallback(async (id: string, newStatus: string) => {
    try {
      await db.experiments.update(id, { status: newStatus, updatedAt: new Date().toISOString() });
    } catch (e: unknown) {
      console.error('Failed to update experiment status:', e);
    }
  }, []);

  return {
    projects,
    hypotheses: projectHypotheses,
    experiments: projectExperiments,
    allHypotheses: hypotheses,
    selectedProjectId,
    setSelectedProjectId,
    // Hypothesis
    isHypModalOpen,
    setIsHypModalOpen,
    editingHypId,
    hypForm,
    setHypForm,
    handleSaveHypothesis,
    openEditHyp,
    resetHypForm,
    handleDeleteHypothesis,
    handleHypStatusChange,
    // Experiment
    isExpModalOpen,
    setIsExpModalOpen,
    editingExpId,
    expForm,
    setExpForm,
    handleSaveExperiment,
    openEditExp,
    resetExpForm,
    handleDeleteExperiment,
    handleExpStatusChange,
  };
}
