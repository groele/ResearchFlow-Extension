const assert = require('node:assert/strict');

const RFUI = require('../scripts/ui-utils.js');

assert.equal(RFUI.cleanDoiFromText('https://doi.org/10.1038/s41586-024-12345-6.'), '10.1038/s41586-024-12345-6');
assert.equal(RFUI.cleanDoiFromText(undefined), '');

assert.equal(RFUI.cleanResearchTitle(undefined), '');
assert.equal(RFUI.cleanResearchTitle('Nature: Example Paper | Nature'), 'Example Paper');
assert.equal(RFUI.cleanResearchTitle('PubMed - A precise result - PubMed'), 'A precise result');

assert.equal(RFUI.getToastBadgeClass('success'), 'badge badge-success');
assert.equal(RFUI.getToastBadgeClass('danger'), 'badge badge-danger');
assert.equal(RFUI.getToastBadgeClass('error'), 'badge badge-danger');
assert.equal(RFUI.getToastBadgeClass('info'), 'badge badge-info');
assert.equal(RFUI.getToastBadgeClass('unknown'), 'badge badge-warning');

assert.equal(RFUI.toDateInputValue('2026-06-23T08:30:00.000Z'), '2026-06-23');
assert.equal(RFUI.toDateInputValue('not-a-date', '2026-01-02'), '2026-01-02');
assert.equal(RFUI.toDateInputValue(null, '2026-01-02'), '2026-01-02');

assert.deepEqual(RFUI.getRecordFormMode(null), {
  isEdit: false,
  isDuplicate: false,
  title: 'Log New Research Record',
  submitLabel: 'Log Record'
});
assert.deepEqual(RFUI.getRecordFormMode({ id: 'rec_1' }), {
  isEdit: true,
  isDuplicate: false,
  title: 'Modify Research Record',
  submitLabel: 'Save Changes'
});
assert.deepEqual(RFUI.getRecordFormMode({ id: 'rec_1' }, { duplicate: true }), {
  isEdit: false,
  isDuplicate: true,
  title: 'Duplicate Research Record',
  submitLabel: 'Create Copy'
});

assert.equal(RFUI.shouldNotifyMetadataCaptureFailure({
  isAutomaticCapture: true,
  isRestrictedPage: false
}), false);
assert.equal(RFUI.shouldNotifyMetadataCaptureFailure({
  isAutomaticCapture: true,
  isRestrictedPage: true
}), false);
assert.equal(RFUI.shouldNotifyMetadataCaptureFailure({
  isAutomaticCapture: false,
  isRestrictedPage: false
}), true);
assert.equal(RFUI.shouldNotifyMetadataCaptureFailure({
  isAutomaticCapture: false,
  isRestrictedPage: true
}), true);

assert.deepEqual(RFUI.buildSubmissionIdentityUpdate({
  title: '  Revised paper title  ',
  journal: '  Advanced Materials  ',
  journalUrl: ' https://example.com/submission '
}), {
  ok: true,
  title: 'Revised paper title',
  journal: 'Advanced Materials',
  journalUrl: 'https://example.com/submission'
});
assert.deepEqual(RFUI.buildSubmissionIdentityUpdate({
  title: '',
  journal: 'Nature',
  journalUrl: ''
}), {
  ok: false,
  error: 'Manuscript title is required.'
});
assert.deepEqual(RFUI.buildSubmissionIdentityUpdate({
  title: 'Paper',
  journal: 'Nature',
  journalUrl: 'not a url'
}), {
  ok: false,
  error: 'Journal URL must be a valid URL.'
});

assert.deepEqual(RFUI.buildSubmissionEditCenterUpdate({
  title: '  Revised submission title  ',
  journal: '  Advanced Functional Materials  ',
  journalUrl: ' https://example.com/submit ',
  status: 'accepted',
  submissionDate: '2026-01-10',
  firstDecisionDate: '2026-02-12',
  revisionDueDate: '2026-03-01',
  decisionDate: '2026-04-15',
  doi: ' https://doi.org/10.1002/adfm.202528029 ',
  articleUrl: ' https://advanced.onlinelibrary.wiley.com/doi/10.1002/adfm.202528029 '
}), {
  ok: true,
  title: 'Revised submission title',
  journal: 'Advanced Functional Materials',
  journalUrl: 'https://example.com/submit',
  status: 'accepted',
  submissionDate: '2026-01-10',
  firstDecisionDate: '2026-02-12',
  revisionDueDate: '2026-03-01',
  decisionDate: '2026-04-15',
  doi: '10.1002/adfm.202528029',
  articleUrl: 'https://advanced.onlinelibrary.wiley.com/doi/10.1002/adfm.202528029'
});
assert.deepEqual(RFUI.buildSubmissionEditCenterUpdate({
  title: '',
  journal: 'Nature',
  journalUrl: ''
}), {
  ok: false,
  error: 'Manuscript title is required.'
});
assert.deepEqual(RFUI.buildSubmissionEditCenterUpdate({
  title: 'Paper',
  journal: 'Nature',
  journalUrl: 'not a url'
}), {
  ok: false,
  error: 'Journal URL must be a valid URL.'
});
assert.deepEqual(RFUI.buildSubmissionEditCenterUpdate({
  title: 'Paper',
  journal: 'Nature',
  articleUrl: 'not a url'
}), {
  ok: false,
  error: 'Article URL must be a valid URL.'
});

assert.deepEqual(RFUI.buildSubmissionEditSyncPlan({
  title: '  Final shared title  ',
  journal: '  Nature Materials  ',
  journalUrl: ' https://example.com/portal ',
  status: 'published',
  submissionDate: '2026-01-10',
  firstDecisionDate: '2026-02-12',
  revisionDueDate: '2026-03-01',
  decisionDate: '2026-04-15',
  doi: 'https://doi.org/10.1038/s41563-026-01234-5',
  articleUrl: ''
}), {
  ok: true,
  manuscriptPatch: {
    title: 'Final shared title',
    targetJournals: ['Nature Materials']
  },
  detachedSubmissionTitle: 'Final shared title',
  submissionPatch: {
    targetJournal: 'Nature Materials',
    journalUrl: 'https://example.com/portal',
    submissionDate: '2026-01-10T12:00:00.000Z',
    firstDecisionDate: '2026-02-12T12:00:00.000Z',
    revisionDueDate: '2026-03-01T12:00:00.000Z',
    decisionDate: '2026-04-15T12:00:00.000Z',
    status: 'published'
  },
  publicationPatch: {
    doi: '10.1038/s41563-026-01234-5',
    articleUrl: 'https://doi.org/10.1038/s41563-026-01234-5'
  },
  shouldClearPublication: false,
  shouldMarkRejected: false,
  rejectionDate: ''
});
assert.deepEqual(RFUI.buildSubmissionEditSyncPlan({
  title: 'Active review title',
  journal: '',
  journalUrl: '',
  status: 'under_review',
  doi: '10.1000/unused'
}), {
  ok: true,
  manuscriptPatch: {
    title: 'Active review title',
    targetJournals: []
  },
  detachedSubmissionTitle: 'Active review title',
  submissionPatch: {
    targetJournal: null,
    journalUrl: null,
    submissionDate: null,
    firstDecisionDate: null,
    revisionDueDate: null,
    decisionDate: null,
    status: 'under_review'
  },
  publicationPatch: null,
  shouldClearPublication: true,
  shouldMarkRejected: false,
  rejectionDate: ''
});
assert.deepEqual(RFUI.buildSubmissionEditSyncPlan({
  title: 'Rejected title',
  journal: 'Science',
  status: 'rejected',
  firstDecisionDate: '2026-02-12',
  decisionDate: ''
}).shouldMarkRejected, true);
assert.deepEqual(RFUI.buildSubmissionEditSyncPlan({
  title: 'Rejected title',
  journal: 'Science',
  status: 'rejected',
  firstDecisionDate: '2026-02-12',
  decisionDate: ''
}).rejectionDate, '2026-02-12');

assert.deepEqual(RFUI.buildSubmissionCreateMode({
  selectedManuscriptId: 'man_1',
  newManuscriptTitle: '',
  targetJournal: 'Nature'
}), {
  ok: true,
  mode: 'existing',
  manuscriptId: 'man_1',
  targetJournal: 'Nature',
  title: ''
});
assert.deepEqual(RFUI.buildSubmissionCreateMode({
  selectedManuscriptId: '__new__',
  newManuscriptTitle: '  New paper  ',
  targetJournal: '  Science  '
}), {
  ok: true,
  mode: 'new',
  manuscriptId: '',
  targetJournal: 'Science',
  title: 'New paper'
});
assert.deepEqual(RFUI.buildSubmissionCreateMode({
  selectedManuscriptId: '__new__',
  newManuscriptTitle: '',
  targetJournal: 'Nature'
}), {
  ok: false,
  error: 'Manuscript title is required.'
});
assert.deepEqual(RFUI.buildSubmissionCreateMode({
  selectedManuscriptId: 'man_1',
  newManuscriptTitle: '',
  targetJournal: ''
}), {
  ok: false,
  error: 'Target journal is required.'
});

assert.equal(RFUI.shouldAutoCapture({
  capturePaneActive: true,
  scrapeButtonDisabled: false,
  formDirty: false,
  activeTabKey: '1:https://example.com/a',
  lastCapturedTabKey: ''
}), true);

assert.equal(RFUI.shouldAutoCapture({
  capturePaneActive: true,
  scrapeButtonDisabled: false,
  formDirty: true,
  activeTabKey: '1:https://example.com/a',
  lastCapturedTabKey: ''
}), false);

assert.equal(RFUI.shouldAutoCapture({
  capturePaneActive: true,
  scrapeButtonDisabled: false,
  formDirty: false,
  activeTabKey: '1:https://example.com/a',
  lastCapturedTabKey: '1:https://example.com/a'
}), false);

console.log('ui-utils tests passed');
