/**
 * Import script for ScholarFlow export data
 * Reads researchflow-export-2026-05-28.json and transforms it to the new schema
 *
 * Usage: node scripts/import-data.js
 * This outputs a clean JSON file that can be imported via Settings > Import
 */

import { readFileSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';

const INPUT_FILE = 'researchflow-export-2026-05-28.json';
const OUTPUT_FILE = 'scholarflow-import-ready.json';

const raw = JSON.parse(readFileSync(INPUT_FILE, 'utf-8'));

// --- ID mapping for new user ---
const USER_ID = 'user';
const now = new Date().toISOString();

// Map old area IDs to new IDs
const areaIdMap = {};
for (const area of raw.researchAreas) {
  areaIdMap[area.id] = area.id; // Keep original IDs
}

// --- Transform Research Areas ---
const researchAreas = raw.researchAreas.map(a => ({
  id: a.id,
  userId: USER_ID,
  name: a.name,
  description: a.description || '',
  color: a.color || '#14b8a6',
  createdAt: a.createdAt,
  updatedAt: a.updatedAt,
}));

// --- Transform Projects ---
const projects = raw.projects.map(p => ({
  id: p.id,
  userId: USER_ID,
  title: p.title || '',
  discipline: p.discipline || '',
  hypothesis: p.hypothesis || '',
  abstract: p.description || p.abstract || '',
  status: p.status === 'completed' ? 'archived' : (p.status || 'active'),
  areaId: p.areaId || null,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
}));

// Add uncategorized project
projects.unshift({
  id: 'proj_uncategorized',
  userId: USER_ID,
  title: 'Uncategorized',
  discipline: '',
  hypothesis: '',
  abstract: 'System project for uncategorized items.',
  status: 'active',
  areaId: null,
  createdAt: now,
  updatedAt: now,
});

// --- Transform Manuscripts ---
const manuscripts = raw.manuscripts.map(m => ({
  id: m.id,
  userId: USER_ID,
  projectId: m.projectId || 'proj_uncategorized',
  title: m.title || '',
  abstract: m.abstract || '',
  targetJournal: m.targetJournal || '',
  manuscriptType: m.manuscriptType || 'research_article',
  status: m.status || 'draft',
  sections: [],
  notes: m.notes || '',
  tags: tryParseJson(m.tags, []),
  statusHistory: tryParseJson(m.statusHistory, []),
  createdAt: m.createdAt,
  updatedAt: m.updatedAt,
}));

// --- Transform Submissions ---
const submissions = raw.submissions.map(s => {
  const ms = s.manuscript || {};
  // Parse timeline nodes for status history
  const timelineNodes = s.timelineNodes || [];

  // Build a clean status history from timeline nodes
  const statusHistory = timelineNodes
    .filter(n => n.completeDate)
    .map(n => ({
      status: mapTimelineToStatus(n),
      at: n.completeDate + 'T00:00:00.000Z',
      name: n.name,
    }));

  // Determine clean status
  let status = mapSubmissionStatus(s.status);

  // Extract DOI from notes
  const doiMatch = (s.notes || '').match(/DOI:\s*(10\.\S+)/i);
  const doi = doiMatch ? doiMatch[1] : '';

  return {
    id: s.id,
    userId: USER_ID,
    manuscriptId: s.manuscriptId,
    journalName: s.journalName || ms.targetJournal || '',
    journalAbbrev: s.journalAbbrev || '',
    publisher: s.publisher || '',
    impactFactor: s.impactFactor || null,
    manuscriptNumber: s.manuscriptNumber || '',
    submissionDate: s.submissionDate || s.submittedAt || null,
    submissionUrl: s.submissionUrl || '',
    decisionDate: s.decisionDate || s.decisionAt || null,
    firstDecisionDate: s.firstDecisionDate || null,
    acceptedAt: s.acceptedAt || null,
    status,
    notes: doi ? `DOI: ${doi}` : (s.notes || ''),
    revisionDeadline: s.revisionDeadline || null,
    coverLetter: s.coverLetter || '',
    complianceChecklist: Array.isArray(s.complianceChecklist) ? s.complianceChecklist : [],
    reviewRounds: s.reviewRounds || [],
    timelineNodes,
    statusHistory: JSON.stringify(statusHistory),
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
});

// --- Transform Research Records ---
const researchRecords = raw.researchRecords.map(r => ({
  id: r.id,
  userId: USER_ID,
  projectId: r.projectId || 'proj_uncategorized',
  schemaTemplateId: null,
  recordType: r.recordType || r.discipline || 'general',
  title: r.title || '',
  summary: r.content || r.abstract || '',
  methodology: r.methodology || '',
  recordedDate: r.occurredAt || r.createdAt,
  attributes: tryParseJson(r.attributes, {}),
  dataPath: r.dataPath || '',
  tags: tryParseJson(r.tags, []),
  externalRef: r.externalRef || null,
  readingStatus: r.readingStatus || 'unread',
  starred: r.starred || false,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
}));

// --- Transform Tasks ---
const tasks = raw.tasks.map(t => ({
  id: t.id,
  userId: USER_ID,
  projectId: t.projectId || 'proj_uncategorized',
  title: t.title || '',
  description: t.description || '',
  status: t.status || 'todo',
  priority: t.priority || 'medium',
  dueDate: t.dueDate || null,
  completedAt: t.completedAt || null,
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
}));

// --- Journal Portals from settings (for reference) ---
const journalPortals = raw.settings?.journalPortals || [];

// --- Build output ---
const output = {
  projects,
  researchRecords,
  manuscripts,
  submissions,
  tasks,
  researchAreas,
  evidence: [],
  hypotheses: [],
  experiments: [],
  // Extra data that might be useful
  _metadata: {
    exportedAt: raw.exportedAt,
    importedAt: now,
    originalDeviceId: raw.deviceId,
    journalPortals,
    achievements: raw.achievements || [],
  },
};

writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

console.log(`Import file created: ${OUTPUT_FILE}`);
console.log(`  Projects: ${projects.length}`);
console.log(`  Manuscripts: ${manuscripts.length}`);
console.log(`  Submissions: ${submissions.length}`);
console.log(`  Research Areas: ${researchAreas.length}`);
console.log(`  Research Records: ${researchRecords.length}`);
console.log(`  Tasks: ${tasks.length}`);
console.log(`  Journal Portals: ${journalPortals.length} (stored in _metadata)`);

// --- Helper functions ---
function tryParseJson(str, fallback) {
  if (!str) return fallback;
  if (typeof str !== 'string') return str;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function mapSubmissionStatus(oldStatus) {
  const map = {
    'target_planning': 'draft',
    'preparing': 'draft',
    'submitted': 'submitted',
    'under_review': 'under_review',
    'minor_revision': 'revision_requested',
    'major_revision': 'revision_requested',
    'revision': 'revision_requested',
    'resubmitted': 'submitted',
    'accept': 'accepted',
    'accepted': 'accepted',
    'reject': 'rejected',
    'rejected': 'rejected',
    'withdrawn': 'withdrawn',
    'published': 'accepted',
  };
  return map[oldStatus] || oldStatus || 'draft';
}

function mapTimelineToStatus(node) {
  const key = node.key || '';
  if (key === 'submit') return 'submitted';
  if (key === 'r1_comments' || key === 'r2_comments') return 'under_review';
  if (key === 'accept') return 'accepted';
  if (key === 'reject') return 'rejected';
  if (node.type === 'revision') return 'revision_requested';
  if (node.type === 'publication') return 'accepted';
  return node.name || 'unknown';
}
