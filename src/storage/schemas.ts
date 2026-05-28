import { z } from 'zod';

// --- Timeline Node Schema ---
export const TimelineNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  status: z.string(),
  date: z.string(),
  planDate: z.string().optional(),
  dueDate: z.string().optional(),
  completeDate: z.string().optional(),
  notes: z.string().optional(),
  keyEventMapping: z.string().optional(),
});

// --- Entity Schemas ---
export const ProjectSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  title: z.string().min(1).max(500),
  discipline: z.string(),
  hypothesis: z.string(),
  abstract: z.string(),
  status: z.enum(['active', 'archived', 'planning']),
  areaId: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ResearchRecordSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  projectId: z.string().min(1),
  schemaTemplateId: z.string().nullable(),
  title: z.string().min(1).max(1000),
  recordType: z.string(),
  methodology: z.string(),
  recordedDate: z.string(),
  attributes: z.record(z.any()),
  dataPath: z.string(),
  externalRef: z.string().nullable(),
  summary: z.string(),
  tags: z.array(z.string()),
  readingStatus: z.enum(['unread', 'reading', 'read', 'to-reread']).optional().default('unread'),
  starred: z.boolean().optional().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ManuscriptSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string().min(1).max(1000),
  abstract: z.string(),
  status: z.enum(['preparing', 'draft', 'ready', 'submitted', 'published']),
  authors: z.array(z.string()),
  journal: z.string(),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    order: z.number(),
  })).optional().default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const SubmissionSchema = z.object({
  id: z.string().min(1),
  manuscriptId: z.string().min(1),
  journal: z.string(),
  status: z.enum(['preparing', 'submitted', 'under_review', 'revision', 'accepted', 'rejected', 'published']),
  initialSubmissionDate: z.string().nullable(),
  deadlineDate: z.string().nullable(),
  firstDecisionDate: z.string().nullable(),
  revisionDueDate: z.string().nullable(),
  acceptanceDate: z.string().nullable(),
  publicationDate: z.string().nullable(),
  notes: z.string(),
  timelineNodes: z.array(TimelineNodeSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const TaskSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string(),
  status: z.enum(['todo', 'completed']),
  priority: z.number().int().min(0).max(3),
  dueDate: z.string().nullable(),
  completedAt: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ResearchAreaSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().nullable(),
  color: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const EvidenceSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string(),
  evidenceType: z.string(),
  filePath: z.string(),
  fileSize: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const SchemaTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  fields: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean(),
    defaultValue: z.any().optional(),
  })),
  createdAt: z.string().datetime(),
});

export const HypothesisSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  statement: z.string().min(1),
  status: z.enum(['proposed', 'testing', 'confirmed', 'refuted']),
  evidenceIds: z.array(z.string()).default([]),
  notes: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ExperimentSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  hypothesisId: z.string().nullable(),
  title: z.string().min(1),
  design: z.string(),
  variables: z.string(),
  status: z.enum(['planned', 'running', 'completed', 'failed']),
  results: z.string(),
  resultSummary: z.string().default(''),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ExperimentResultSchema = z.object({
  id: z.string().min(1),
  experimentId: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string().min(1),
  summary: z.string(),
  conclusionType: z.enum(['supporting', 'contradicting', 'inconclusive']),
  evidenceIds: z.array(z.string()).default([]),
  rawData: z.string().default(''),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const JournalEntrySchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  projectId: z.string().nullable(),
  date: z.string(),
  content: z.string().min(1),
  mood: z.enum(['productive', 'stuck', 'breakthrough', 'neutral']).default('neutral'),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// --- Inferred Types ---
export type Project = z.infer<typeof ProjectSchema>;
export type ResearchRecord = z.infer<typeof ResearchRecordSchema>;
export type Manuscript = z.infer<typeof ManuscriptSchema>;
export type Submission = z.infer<typeof SubmissionSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type ResearchArea = z.infer<typeof ResearchAreaSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type SchemaTemplate = z.infer<typeof SchemaTemplateSchema>;
export type TimelineNode = z.infer<typeof TimelineNodeSchema>;
export type Hypothesis = z.infer<typeof HypothesisSchema>;
export type Experiment = z.infer<typeof ExperimentSchema>;
export type ExperimentResult = z.infer<typeof ExperimentResultSchema>;
export type JournalEntry = z.infer<typeof JournalEntrySchema>;
