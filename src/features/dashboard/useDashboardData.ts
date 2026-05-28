import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Submission, type Project, type ResearchRecord, type Manuscript, type Task } from '@storage/dexie';

// --- Utility Functions ---
const todayString = () => new Date().toISOString().slice(0, 10);

const normalizeDateString = (str: string | null | undefined): string => {
  if (!str) return '';
  const d = new Date(str);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

const getDaysDiff = (dateStr1: string, dateStr2: string): number | null => {
  if (!dateStr1 || !dateStr2) return null;
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
  return Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
};

// --- Timeline Analysis ---
export interface Milestone {
  name: string;
  date: string | null;
  color: string;
  emphasis: boolean;
  today?: boolean;
  node?: TimelineNode;
}

export interface DisplayMeta {
  mode: 'prepare' | 'accepted' | 'r1-active' | 'under-review';
  label: string;
  value: number | null;
  color: string;
  bg: string;
  border: string;
  caption: string;
  pending: boolean;
  milestones: Milestone[];
}

export interface SubmissionAnalysis {
  expToSubmit: number | null;
  submitToNow: number | null;
  r1ToNow: number | null;
  submitToAccept: number | null;
  display: DisplayMeta;
  accepted: boolean;
  experimentDate: string | null;
  submitDate: string | null;
  r1Date: string | null;
  acceptDate: string | null;
  onlineDate: string | null;
}

interface TimelineNode {
  name: string;
  type?: string;
  status?: string;
  date?: string;
  planDate?: string;
  dueDate?: string;
  completeDate?: string;
}

const inferNodeKey = (node: TimelineNode): string => {
  const name = (node.name || '').toLowerCase();
  if (name.includes('experiment') || name.includes('实验')) return 'experiment_done';
  if (name.includes('draft') || name.includes('初稿')) return 'draft_done';
  if (name.includes('submit') || name.includes('投稿')) return 'submit';
  if (name.includes('r1 comments') || name.includes('审稿意见 r1')) return 'r1_comments';
  if (name.includes('r1 revision') || name.includes('r1 修回')) return 'r1_revised';
  if (name.includes('r2 comments') || name.includes('审稿意见 r2')) return 'r2_comments';
  if (name.includes('r2 revision') || name.includes('r2 修回')) return 'r2_revised';
  if (name.includes('accept') || name.includes('接收')) return 'accept';
  if (name.includes('online') || name.includes('发表') || name.includes('上线')) return 'online';
  return 'other';
};

export const analyzeSubmission = (sub: Submission): SubmissionAnalysis => {
  const nodes = [...(sub.timelineNodes || [])].sort((a, b) => {
    const da = a.completeDate || a.planDate || a.dueDate || '';
    const db2 = b.completeDate || b.planDate || b.dueDate || '';
    return new Date(da).getTime() - new Date(db2).getTime();
  });

  const getKeyEventDate = (key: string): string | null => {
    const node = nodes.find(n => inferNodeKey(n) === key);
    const nodeDate = node ? normalizeDateString(node.completeDate || node.planDate || node.dueDate) : null;
    if (key === 'submit') return normalizeDateString(sub.initialSubmissionDate) || nodeDate;
    if (key === 'r1_comments') return normalizeDateString(sub.firstDecisionDate) || nodeDate;
    if (key === 'accept') return normalizeDateString(sub.acceptanceDate) || nodeDate;
    if (key === 'online') return normalizeDateString(sub.publicationDate) || nodeDate;
    return nodeDate;
  };

  const experimentDate = getKeyEventDate('experiment_done');
  const submitDate = getKeyEventDate('submit');
  const r1Date = getKeyEventDate('r1_comments');
  const acceptDate = getKeyEventDate('accept');
  const onlineDate = getKeyEventDate('online');
  const accepted = !!acceptDate || sub.status === 'accept' || sub.status === 'published';

  const expToSubmit = experimentDate && submitDate ? getDaysDiff(experimentDate, submitDate) : null;
  const submitToNow = submitDate && !accepted ? getDaysDiff(submitDate, todayString()) : null;
  const r1ToNow = r1Date && !accepted ? getDaysDiff(r1Date, todayString()) : null;
  const submitToAccept = submitDate && acceptDate ? getDaysDiff(submitDate, acceptDate) : null;

  let display: DisplayMeta = {
    mode: 'prepare',
    label: 'Experiment → Submission',
    value: expToSubmit,
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.08)',
    border: 'rgba(59, 130, 246, 0.2)',
    caption: 'Focus: finish the pre-submission cycle.',
    pending: false,
    milestones: [
      { name: 'Experiments done', date: experimentDate, color: '#3b82f6', emphasis: true },
      { name: 'Submission', date: submitDate, color: '#f97316', emphasis: true }
    ]
  };

  if (accepted) {
    display = {
      mode: 'accepted',
      label: 'Submission → Acceptance',
      value: submitToAccept,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.2)',
      caption: 'Total duration tracked from submission to acceptance.',
      pending: false,
      milestones: [
        { name: 'Submission', date: submitDate, color: '#f97316', emphasis: true },
        { name: 'Acceptance', date: acceptDate, color: '#10b981', emphasis: true }
      ]
    };
  } else if (r1Date) {
    display = {
      mode: 'r1-active',
      label: 'R1 Comments → Today',
      value: r1ToNow,
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.2)',
      caption: 'R1 returned; active review revision countdown window.',
      pending: true,
      milestones: [
        { name: 'Submission', date: submitDate, color: '#f97316', emphasis: false },
        { name: 'R1 Comments', date: r1Date, color: '#ef4444', emphasis: true },
        { name: 'Today', date: todayString(), color: '#ef4444', emphasis: true, today: true }
      ]
    };
  } else if (submitDate) {
    display = {
      mode: 'under-review',
      label: 'Submission → Today',
      value: submitToNow,
      color: '#f97316',
      bg: 'rgba(249, 115, 22, 0.08)',
      border: 'rgba(249, 115, 22, 0.2)',
      caption: 'Not accepted yet; tracking waiting time after submission.',
      pending: true,
      milestones: [
        { name: 'Submission', date: submitDate, color: '#f97316', emphasis: true },
        { name: 'Today', date: todayString(), color: '#f97316', emphasis: true, today: true }
      ]
    };
  }

  return { expToSubmit, submitToNow, r1ToNow, submitToAccept, display, accepted, experimentDate, submitDate, r1Date, acceptDate, onlineDate };
};

// --- Hook ---
export function useDashboardData() {
  const projects = useLiveQuery(() => db.projects.where('userId').equals('user').toArray()) ?? [];
  const records = useLiveQuery(() => db.researchRecords.where('userId').equals('user').toArray()) ?? [];
  const manuscripts = useLiveQuery(() => db.manuscripts.toArray()) ?? [];
  const submissions = useLiveQuery(() => db.submissions.toArray()) ?? [];
  const tasks = useLiveQuery(() => db.tasks.where('userId').equals('user').toArray()) ?? [];

  // Compute analyses for all submissions
  const manuscriptMap = useMemo(() => {
    const map = new Map<string, Manuscript>();
    for (const m of manuscripts) map.set(m.id, m);
    return map;
  }, [manuscripts]);

  const analyses = useMemo(() => {
    return submissions.map(sub => ({
      submission: sub,
      manuscript: manuscriptMap.get(sub.manuscriptId),
      analysis: analyzeSubmission(sub),
    }));
  }, [submissions, manuscriptMap]);

  // Timeline alerts (pending submissions with milestones due soon)
  const timelineAlerts = useMemo(() => {
    return analyses
      .filter(a => a.analysis.display.pending)
      .sort((a, b) => {
        const va = a.analysis.display.value ?? 999;
        const vb = b.analysis.display.value ?? 999;
        return va - vb;
      });
  }, [analyses]);

  // Metrics averages
  const metrics = useMemo(() => {
    const completed = analyses.filter(a => a.analysis.accepted);
    const expToSubmitValues = completed.map(a => a.analysis.expToSubmit).filter((v): v is number => v !== null);
    const submitToAcceptValues = completed.map(a => a.analysis.submitToAccept).filter((v): v is number => v !== null);
    const pendingCount = analyses.filter(a => a.analysis.display.pending).length;
    const acceptedCount = completed.length;

    return {
      avgExpToSubmit: expToSubmitValues.length > 0 ? Math.round(expToSubmitValues.reduce((a, b) => a + b, 0) / expToSubmitValues.length) : null,
      avgSubmitToAccept: submitToAcceptValues.length > 0 ? Math.round(submitToAcceptValues.reduce((a, b) => a + b, 0) / submitToAcceptValues.length) : null,
      pendingCount,
      acceptedCount,
      totalSubmissions: submissions.length,
    };
  }, [analyses, submissions.length]);

  // Recent records (last 5)
  const recentRecords = useMemo(() => {
    return [...records]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [records]);

  // Task stats
  const taskStats = useMemo(() => {
    const todo = tasks.filter(t => t.status === 'todo').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return { todo, completed, total: tasks.length };
  }, [tasks]);

  // Monthly submission trend (past 12 months)
  const monthlyTrend = useMemo(() => {
    const months: { label: string; value: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short' });
      const count = records.filter(r => r.createdAt.slice(0, 7) === key).length;
      months.push({ label, value: count });
    }
    return months;
  }, [records]);

  // Record type distribution
  const recordTypeDistribution = useMemo(() => {
    const types: Record<string, number> = {};
    records.forEach(r => {
      const label = r.recordType.replace(/_/g, ' ');
      types[label] = (types[label] || 0) + 1;
    });
    const colors = ['#14b8a6', '#3b82f6', '#f97316', '#8b5cf6', '#ef4444', '#eab308', '#06b6d4'];
    return Object.entries(types).map(([label, value], i) => ({
      label,
      value,
      color: colors[i % colors.length],
    }));
  }, [records]);

  // Project progress (records per project)
  const projectProgress = useMemo(() => {
    const recordCountByProject = new Map<string, number>();
    for (const r of records) {
      recordCountByProject.set(r.projectId, (recordCountByProject.get(r.projectId) || 0) + 1);
    }
    return projects.slice(0, 6).map(p => ({
      label: p.title.slice(0, 15) + (p.title.length > 15 ? '...' : ''),
      value: recordCountByProject.get(p.id) || 0,
    }));
  }, [projects, records]);

  // Overdue tasks
  const overdueTasks = useMemo(() => {
    const today = todayString();
    return tasks.filter(t => t.dueDate && t.dueDate < today && t.status !== 'completed');
  }, [tasks]);

  // Reading stats
  const readingStats = useMemo(() => {
    const litRecords = records.filter(r => r.recordType === 'literature_review' || r.tags.includes('literature'));
    return {
      total: litRecords.length,
      unread: litRecords.filter(r => !r.readingStatus || r.readingStatus === 'unread').length,
      reading: litRecords.filter(r => r.readingStatus === 'reading').length,
      read: litRecords.filter(r => r.readingStatus === 'read').length,
    };
  }, [records]);

  // Weekly activity
  const weeklyActivity = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoStr = weekAgo.toISOString();

    return {
      records: records.filter(r => r.createdAt >= weekAgoStr).length,
      tasksCompleted: tasks.filter(t => t.status === 'completed' && t.updatedAt >= weekAgoStr).length,
      papersRead: records.filter(r =>
        (r.recordType === 'literature_review' || r.tags.includes('literature')) &&
        r.readingStatus === 'read' &&
        r.updatedAt >= weekAgoStr
      ).length,
    };
  }, [records, tasks]);

  // Monthly activity
  const monthlyActivity = useMemo(() => {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const monthAgoStr = monthAgo.toISOString();

    return {
      records: records.filter(r => r.createdAt >= monthAgoStr).length,
      tasksCompleted: tasks.filter(t => t.status === 'completed' && t.updatedAt >= monthAgoStr).length,
      papersRead: records.filter(r =>
        (r.recordType === 'literature_review' || r.tags.includes('literature')) &&
        r.readingStatus === 'read' &&
        r.updatedAt >= monthAgoStr
      ).length,
    };
  }, [records, tasks]);

  // Urgent tasks (due within 3 days or overdue)
  const urgentTasks = useMemo(() => {
    const today = new Date();
    const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    const todayStr = todayString();
    const threeDaysStr = threeDaysLater.toISOString().slice(0, 10);

    return tasks
      .filter(t =>
        t.status === 'todo' &&
        t.dueDate &&
        t.dueDate <= threeDaysStr
      )
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  }, [tasks]);

  // Recent reading (last 5 literature records)
  const recentReading = useMemo(() => {
    return records
      .filter(r => r.recordType === 'literature_review' || r.tags.includes('literature'))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [records]);

  return {
    projects,
    records,
    manuscripts,
    submissions,
    tasks,
    analyses,
    timelineAlerts,
    metrics,
    recentRecords,
    taskStats,
    monthlyTrend,
    recordTypeDistribution,
    projectProgress,
    overdueTasks,
    readingStats,
    weeklyActivity,
    monthlyActivity,
    urgentTasks,
    recentReading,
  };
}
