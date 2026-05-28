import { useState, useCallback, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Project } from '@storage/dexie';
import { generateId } from '@storage/id';

export type ViewMode = 'list' | 'card';

const UNCATEGORIZED_ID = 'proj_uncategorized';

export const UNCATEGORIZED_PROJECT: Project = {
  id: UNCATEGORIZED_ID,
  userId: 'user',
  title: 'Uncategorized',
  discipline: '',
  hypothesis: '',
  abstract: 'System project for uncategorized items. Cannot be deleted.',
  status: 'active',
  areaId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function useProjects() {
  const projects = useLiveQuery(() => db.projects.where('userId').equals('user').toArray()) ?? [];
  const researchAreas = useLiveQuery(() => db.researchAreas.where('userId').equals('user').toArray()) ?? [];
  const tasks = useLiveQuery(() => db.tasks.where('userId').equals('user').toArray()) ?? [];
  const researchRecords = useLiveQuery(() => db.researchRecords.where('userId').equals('user').toArray()) ?? [];

  // Ensure uncategorized project exists
  useEffect(() => {
    db.projects.get(UNCATEGORIZED_ID).then(existing => {
      if (!existing) {
        db.projects.put({ ...UNCATEGORIZED_PROJECT, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      }
    });
  }, []);

  const [viewMode, setViewMode] = useState<ViewMode>('card');

  // Area modal state
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaDesc, setNewAreaDesc] = useState('');
  const [newAreaColor, setNewAreaColor] = useState('#14b8a6');

  // Project modal state
  const [isProjModalOpen, setIsProjModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjDiscipline, setNewProjDiscipline] = useState('');
  const [newProjHypothesis, setNewProjHypothesis] = useState('');
  const [newProjAbstract, setNewProjAbstract] = useState('');
  const [newProjAreaId, setNewProjAreaId] = useState<string | null>(null);
  const [areaFilter, setAreaFilter] = useState<string | null>(null);

  // Move modal state
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveTargetProjectId, setMoveTargetProjectId] = useState('');
  const [moveSuccessMsg, setMoveSuccessMsg] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const clearError = useCallback(() => setError(null), []);

  const resetAreaForm = useCallback(() => {
    setNewAreaName('');
    setNewAreaDesc('');
    setNewAreaColor('#14b8a6');
  }, []);

  const resetProjectForm = useCallback(() => {
    setEditingProjectId(null);
    setNewProjTitle('');
    setNewProjDiscipline('');
    setNewProjHypothesis('');
    setNewProjAbstract('');
    setNewProjAreaId(null);
  }, []);

  const openEditProject = useCallback((proj: Project) => {
    setEditingProjectId(proj.id);
    setNewProjTitle(proj.title);
    setNewProjDiscipline(proj.discipline || '');
    setNewProjHypothesis(proj.hypothesis || '');
    setNewProjAbstract(proj.abstract || '');
    setNewProjAreaId(proj.areaId || null);
    setIsProjModalOpen(true);
  }, []);

  const handleSaveArea = useCallback(async () => {
    if (!newAreaName.trim()) return;
    try {
      const now = new Date().toISOString();
      await db.researchAreas.put({
        id: generateId('area'),
        userId: 'user',
        name: newAreaName.trim(),
        description: newAreaDesc.trim() || null,
        color: newAreaColor,
        createdAt: now,
        updatedAt: now,
      });
      resetAreaForm();
      setIsAreaModalOpen(false);
    } catch (e: unknown) {
      console.error('Failed to save area:', e instanceof Error ? e.message : e);
      setError('Failed to save research area. Please try again.');
    }
  }, [newAreaName, newAreaDesc, newAreaColor, resetAreaForm]);

  // Separate uncategorized from regular projects
  const uncategorizedProject = useMemo(
    () => projects.find(p => p.id === UNCATEGORIZED_ID) || UNCATEGORIZED_PROJECT,
    [projects]
  );

  const regularProjects = useMemo(
    () => projects.filter(p => p.id !== UNCATEGORIZED_ID),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    const base = areaFilter ? regularProjects.filter(p => p.areaId === areaFilter) : regularProjects;
    return base;
  }, [regularProjects, areaFilter]);

  // Uncategorized project stats
  const uncategorizedStats = useMemo(() => {
    const uncTasks = tasks.filter(t => t.projectId === UNCATEGORIZED_ID);
    const completed = uncTasks.filter(t => t.status === 'completed').length;
    const uncRecords = researchRecords.filter(r => r.projectId === UNCATEGORIZED_ID);
    return {
      taskCount: uncTasks.length,
      recordCount: uncRecords.length,
      progress: uncTasks.length > 0 ? Math.round((completed / uncTasks.length) * 100) : 0,
      totalItems: uncTasks.length + uncRecords.length,
    };
  }, [tasks, researchRecords]);

  const enrichedProjects = useMemo(() => {
    return filteredProjects.map(proj => {
      const projTasks = tasks.filter(t => t.projectId === proj.id);
      const completedTasks = projTasks.filter(t => t.status === 'completed').length;
      const progress = projTasks.length > 0 ? Math.round((completedTasks / projTasks.length) * 100) : 0;
      const recordCount = researchRecords.filter(r => r.projectId === proj.id).length;
      return { ...proj, progress, taskCount: projTasks.length, recordCount };
    });
  }, [filteredProjects, tasks, researchRecords]);

  const handleSaveProject = useCallback(async () => {
    if (!newProjTitle.trim()) return;
    try {
      const now = new Date().toISOString();
      await db.projects.put({
        id: editingProjectId || generateId('proj'),
        userId: 'user',
        title: newProjTitle.trim(),
        discipline: newProjDiscipline.trim(),
        hypothesis: newProjHypothesis.trim(),
        abstract: newProjAbstract.trim(),
        status: 'active',
        areaId: newProjAreaId,
        createdAt: editingProjectId ? (await db.projects.get(editingProjectId))?.createdAt || now : now,
        updatedAt: now,
      });
      resetProjectForm();
      setIsProjModalOpen(false);
    } catch (e: unknown) {
      console.error('Failed to save project:', e instanceof Error ? e.message : e);
      setError('Failed to save project. Please try again.');
    }
  }, [editingProjectId, newProjTitle, newProjDiscipline, newProjHypothesis, newProjAbstract, newProjAreaId, resetProjectForm]);

  const handleDeleteProject = useCallback(async (id: string) => {
    try {
      // Cascade: delete related records, tasks, hypotheses, experiments, experimentResults, journalEntries, evidence
      await db.researchRecords.where('projectId').equals(id).delete();
      await db.tasks.where('projectId').equals(id).delete();
      await db.hypotheses.where('projectId').equals(id).delete();
      await db.experiments.where('projectId').equals(id).delete();
      await db.experimentResults.where('projectId').equals(id).delete();
      await db.journalEntries.where('projectId').equals(id).delete();
      await db.evidence.where('projectId').equals(id).delete();

      // Delete manuscripts and their submissions
      const relatedManuscripts = await db.manuscripts.where('projectId').equals(id).toArray();
      for (const ms of relatedManuscripts) {
        await db.submissions.where('manuscriptId').equals(ms.id).delete();
      }
      await db.manuscripts.bulkDelete(relatedManuscripts.map(m => m.id));

      await db.projects.delete(id);
    } catch (e: unknown) {
      console.error('Failed to delete project:', e instanceof Error ? e.message : e);
      setError('Failed to delete project. Please try again.');
    }
  }, []);

  const handleDeleteArea = useCallback(async (id: string) => {
    try {
      // Unlink projects from this area before deleting
      const linkedProjects = await db.projects.where('areaId').equals(id).toArray();
      for (const p of linkedProjects) {
        await db.projects.update(p.id, { areaId: null });
      }
      await db.researchAreas.delete(id);
    } catch (e: unknown) {
      console.error('Failed to delete area:', e instanceof Error ? e.message : e);
      setError('Failed to delete research area. Please try again.');
    }
  }, []);

  // Move items from uncategorized to a target project
  const handleMoveFromUncategorized = useCallback(async (targetProjectId: string) => {
    if (!targetProjectId || targetProjectId === UNCATEGORIZED_ID) return;
    try {
      const now = new Date().toISOString();
      const targetName = projects.find(p => p.id === targetProjectId)?.title || targetProjectId;

      // Move tasks
      const uncTasks = await db.tasks.where('projectId').equals(UNCATEGORIZED_ID).toArray();
      for (const task of uncTasks) {
        await db.tasks.update(task.id, { projectId: targetProjectId, updatedAt: now });
      }

      // Move records
      const uncRecords = await db.researchRecords.where('projectId').equals(UNCATEGORIZED_ID).toArray();
      for (const rec of uncRecords) {
        await db.researchRecords.update(rec.id, { projectId: targetProjectId, updatedAt: now });
      }

      // Move evidence
      const uncEvidence = await db.evidence.where('projectId').equals(UNCATEGORIZED_ID).toArray();
      for (const ev of uncEvidence) {
        await db.evidence.update(ev.id, { projectId: targetProjectId, updatedAt: now });
      }

      // Move hypotheses
      const uncHyps = await db.hypotheses.where('projectId').equals(UNCATEGORIZED_ID).toArray();
      for (const hyp of uncHyps) {
        await db.hypotheses.update(hyp.id, { projectId: targetProjectId, updatedAt: now });
      }

      // Move experiments
      const uncExps = await db.experiments.where('projectId').equals(UNCATEGORIZED_ID).toArray();
      for (const exp of uncExps) {
        await db.experiments.update(exp.id, { projectId: targetProjectId, updatedAt: now });
      }

      // Move manuscripts
      const uncMs = await db.manuscripts.where('projectId').equals(UNCATEGORIZED_ID).toArray();
      for (const ms of uncMs) {
        await db.manuscripts.update(ms.id, { projectId: targetProjectId, updatedAt: now });
      }

      const movedCount = uncTasks.length + uncRecords.length + uncEvidence.length + uncHyps.length + uncExps.length + uncMs.length;
      setMoveSuccessMsg(`Moved ${movedCount} items to ${targetName}`);
      setIsMoveModalOpen(false);
      setMoveTargetProjectId('');
    } catch (e: unknown) {
      console.error('Failed to move items:', e instanceof Error ? e.message : e);
      setError('Failed to move items. Please try again.');
    }
  }, [projects]);

  return {
    projects,
    filteredProjects,
    enrichedProjects,
    researchAreas,
    // Uncategorized
    uncategorizedProject,
    uncategorizedStats,
    regularProjects,
    isMoveModalOpen, setIsMoveModalOpen,
    moveTargetProjectId, setMoveTargetProjectId,
    moveSuccessMsg, setMoveSuccessMsg,
    handleMoveFromUncategorized,
    // View mode
    viewMode, setViewMode,
    // Area modal
    isAreaModalOpen,
    setIsAreaModalOpen,
    newAreaName, setNewAreaName,
    newAreaDesc, setNewAreaDesc,
    newAreaColor, setNewAreaColor,
    handleSaveArea,
    // Project modal
    isProjModalOpen,
    setIsProjModalOpen,
    editingProjectId,
    newProjTitle, setNewProjTitle,
    newProjDiscipline, setNewProjDiscipline,
    newProjHypothesis, setNewProjHypothesis,
    newProjAbstract, setNewProjAbstract,
    newProjAreaId, setNewProjAreaId,
    areaFilter, setAreaFilter,
    handleSaveProject,
    openEditProject,
    resetProjectForm,
    // Delete
    handleDeleteProject,
    handleDeleteArea,
    // Error state
    error,
    clearError,
  };
}
