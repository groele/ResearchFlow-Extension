const assert = require('node:assert/strict');

global.window = global;
require('../scripts/core/research-core.js');

const db = RFCore.normalizeDatabase({
  projects: null,
  researchRecords: 'invalid',
  tasks: [{ id: 'done', completed: true }, { id: 'open', completed: false }],
  evidence: [{ id: 'evidence_1' }],
  settings: null
});

assert.deepEqual(db.projects, []);
assert.deepEqual(db.researchRecords, []);
assert.equal(db.settings.profile.language, 'en');

RFCore.upsertProject(db, {
  title: '  Focused project  ',
  discipline: 'Physics',
  status: 'active'
});
assert.equal(db.projects.length, 1);
assert.equal(db.projects[0].title, 'Focused project');

RFCore.upsertRecord(db, {
  title: '  Captured result  ',
  projectId: db.projects[0].id,
  recordType: 'analysis',
  tags: 'optics, reproducibility'
});
assert.equal(db.researchRecords.length, 1);
assert.deepEqual(db.researchRecords[0].tags, ['optics', 'reproducibility']);

assert.deepEqual(
  {
    taskCount: RFCore.getDashboardStats(db).taskCount,
    evidenceCount: RFCore.getDashboardStats(db).evidenceCount
  },
  { taskCount: 1, evidenceCount: 1 }
);

RFCore.deleteProject(db, db.projects[0].id);
assert.equal(db.projects.length, 0);
assert.equal(db.researchRecords[0].projectId, null);

assert.throws(
  () => RFCore.upsertRecord(db, { title: '   ' }),
  /Record title is required/
);

console.log('research core tests passed');
