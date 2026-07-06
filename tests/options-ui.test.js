const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const optionsJs = fs.readFileSync(path.resolve(__dirname, '../scripts/options.js'), 'utf8');
const optionsHtml = fs.readFileSync(path.resolve(__dirname, '../pages/options.html'), 'utf8');
const optionsCss = fs.readFileSync(path.resolve(__dirname, '../styles/options.css'), 'utf8');

function assertI18nKey(key) {
  const pattern = new RegExp(`${key}:\\s*['"\`]`, 'g');
  const matches = optionsJs.match(pattern) || [];
  assert(matches.length >= 2, `I18N should define ${key} in both language packs`);
}

assert(
  optionsJs.includes('btn-edit-submission'),
  'submission cards should expose a visible edit button'
);

assert(
  /selectedSubmissionId\s*=\s*newSub\.id/.test(optionsJs),
  'newly tracked submissions should become the selected submission'
);

assert(
  /renderSubmissionDetails\(newSub\)/.test(optionsJs),
  'newly tracked submissions should open the detail edit panel immediately'
);

assert(
  /focusSubmissionEditCenter/.test(optionsJs),
  'submission edit entry should be able to focus the unified edit center'
);

assert(
  optionsJs.includes("t('submissionEntryEditorTitle')"),
  'submission detail should localize the unified editor title'
);

assert(
  optionsJs.includes('submission-edit-center'),
  'submission detail should render the centralized edit center'
);

assert(
  !optionsHtml.includes('id="submission-entry-editor-panel"'),
  'submission entry editor should not be placed as a page-level top panel'
);

assert(
  optionsJs.includes('id="submission-entry-editor-panel"') && optionsJs.includes('data-side-entry-editor="true"'),
  'submission detail side panel should render the submission entry editor'
);

assert(
  /saveSubmissionEditFromValues/.test(optionsJs),
  'side submission entry editor should use the shared save flow'
);

[
  'sub-edit-title',
  'sub-edit-journal',
  'sub-edit-doi',
  'sub-edit-article-url',
  'btn-save-sub-edit-center'
].forEach(id => {
  assert(
    optionsJs.includes(id),
    `side submission entry editor should include ${id}`
  );
});

assert(
  optionsJs.includes('sub-edit-compliance-checklist-container'),
  'central edit workspace should contain the editable submission checklist'
);

assert(
  optionsJs.includes('sub-edit-review-matrix-container'),
  'central edit workspace should contain the editable peer review response matrix'
);

assert(
  optionsJs.includes('collectSubmissionReviewMatrixFromEditor'),
  'review comments and responses should be collected through the central save flow'
);

assert(
  optionsJs.includes('collectSubmissionChecklistFromEditor'),
  'checklist state should be collected through the central save flow'
);

assert(
  optionsJs.includes('workflow-edit-summary') && optionsJs.includes("t('editableSummary')"),
  'workflow context should expose a visible editable summary before the form'
);

assert(
  optionsJs.includes('btn-focus-edit-center'),
  'editable summary should include a button that focuses the central editor'
);

assert(
  /const\s+RF_OPTIONS_RENDER_VERSION\s*=/.test(optionsJs) && /dataset\.rfRenderVersion\s*=\s*RF_OPTIONS_RENDER_VERSION/.test(optionsJs),
  'submission detail should mark the rendered options version for runtime verification'
);

assert(
  /dataset\.rfEditorMounted\s*=\s*editorMounted/.test(optionsJs),
  'submission detail should mark whether the central editor mounted'
);

assert(
  /detailPanel\.scrollTop\s*=\s*0/.test(optionsJs),
  'submission detail panel should reset to the top after opening an item'
);

assert(
  !optionsHtml.includes('id="submission-central-editor"'),
  'submissions page should not duplicate the central editor outside the detail workflow'
);

const detailStart = optionsJs.indexOf('function renderSubmissionDetails');
const workflowIndex = optionsJs.indexOf('workflow-context-card', detailStart);
const editIndex = optionsJs.indexOf('submission-edit-center', detailStart);
assert(detailStart !== -1, 'renderSubmissionDetails should exist');
assert(workflowIndex !== -1, 'submission detail should render workflow context');
assert(editIndex !== -1, 'submission detail should render central edit workspace');
assert(
  /insertAdjacentElement\('afterend',\s*editCenter\)/.test(optionsJs),
  'runtime should keep the central editor directly below workflow context in the side detail panel'
);

assert(
  optionsJs.includes('data-submission-workflow-context="true"'),
  'workflow context should have a stable insertion marker'
);

assert(
  !/insertAdjacentElement\('beforebegin',\s*editCenter\)/.test(optionsJs),
  'central editor should not be forced above workflow context'
);

assert(
  /addEventListener\('click',\s*\(event\)\s*=>/.test(optionsJs) && /focusSubmissionEditCenter\(\)/.test(optionsJs),
  'editable summary focus button should explicitly invoke central editor focus handling'
);

assert(
  optionsJs.includes('detailPanel.scrollTo') && optionsJs.includes('getBoundingClientRect') && optionsJs.includes('submission-edit-center-focused'),
  'editable summary focus should scroll the side detail panel and visibly highlight the editor'
);

assert(
  /\.submission-entry-editor-card\.submission-edit-center-focused::after\s*\{[\s\S]*inset:\s*0[\s\S]*background:[\s\S]*border:[\s\S]*pointer-events:\s*none/.test(optionsCss),
  'edit focus feedback should use an internal full-card overlay, not only a thin outside line'
);

assert(
  /\.submission-entry-editor-card\.submission-edit-center-focused\s+\.submission-edit-center-head\s*\{[\s\S]*background:[\s\S]*border-bottom-color:/.test(optionsCss),
  'edit focus feedback should visibly tint the editor header'
);

assert(
  /\.submission-detail-card\s*>\s*\*\s*\{[\s\S]*flex:\s*0\s+0\s+auto/.test(optionsCss),
  'submission detail cards should not flex-shrink into a thin line inside the scroll pane'
);

assert(
  /\.submission-entry-editor-card\s*\{[\s\S]*flex:\s*0\s+0\s+auto/.test(optionsCss),
  'submission entry editor should keep its full form height instead of shrinking'
);

assert(
  /saveSubmissionEditFromValues/.test(optionsJs),
  'submission editors should use the shared save flow'
);

assert(
  !/id="compliance-checklist-container"/.test(optionsJs),
  'legacy lower checklist panel should not remain as a second editable entry'
);

assert(
  !/id="rebuttal-matrix-container"/.test(optionsJs),
  'legacy lower rebuttal panel should not remain as a second editable entry'
);

assert(
  !/#submission-detail-panel\s+\.submission-edit-center\s*\{[^}]*display\s*:\s*none/i.test(optionsCss),
  'detail central editor must not be hidden by CSS'
);

const editCenterCssMatch = optionsCss.match(/\.submission-edit-center\s*\{([\s\S]*?)\}/);
assert(editCenterCssMatch, 'submission edit center CSS rule should exist');
assert(
  !/\border\s*:/.test(editCenterCssMatch[1]),
  'submission edit center must not use CSS order because it should stay below workflow context'
);

assert(
  optionsCss.includes('.workflow-edit-summary'),
  'editable workflow summary should have dedicated styling'
);

[
  'submissionsPageTitle',
  'submissionsPageSubtitle',
  'activeSubmissionsTitle',
  'activeSubmissionsHelp',
  'submissionEmptyDetail',
  'journalPortalsTitle',
  'trackNewSubmissionButton',
  'submissionDetailKicker',
  'currentStageLabel',
  'trackedSinceLabel',
  'workflowContextTitle',
  'workflowNeedsLinking',
  'workflowLinkedFlow',
  'workflowProjectLabel',
  'workflowManuscriptLabel',
  'workflowRecordsLabel',
  'workflowTimelineLabel',
  'workflowReviewerCommentsLabel',
  'editableSummary',
  'editFields',
  'submissionEntryEditorTitle',
  'submissionEntryEditorHelp',
  'linkedManuscriptBadge',
  'detachedSubmissionBadge',
  'manuscriptSection',
  'manuscriptTitleLabel',
  'paperTitlePlaceholder',
  'submissionPortalUrl',
  'reviewTimingSection',
  'publicationSection',
  'submissionChecklistSection',
  'parseGuidelines',
  'peerReviewMatrixSection',
  'addComment',
  'reviewEditorHelp',
  'saveAllChanges',
  'transferRoundHelp',
  'savedReviewPreviewTitle',
  'savedReviewPreviewHelp',
  'exportTable',
  'emptyReviewEditor',
  'emptyReviewPreview',
  'reviewerCommentLabel',
  'authorResponseLabel',
  'copy',
  'aiDraft',
  'responsesLabel',
  'submissionEditsSaved',
  'confirmDeleteSubmission',
  'confirmMarkRejected'
].forEach(assertI18nKey);

assert(
  /function\s+refreshActiveViewForLanguage/.test(optionsJs) && /refreshActiveViewForLanguage\(\)/.test(optionsJs),
  'language changes should rerender the active dynamic view'
);

assert(
  /languageSelect\.value\s*=\s*currentLanguage\s*\|\|\s*profile\.language/.test(optionsJs),
  'language preview should keep the current selection before the preference is saved'
);

assert(
  optionsHtml.includes('v1.2.14 Companion'),
  'options page should display the current extension version'
);

console.log('options-ui tests passed');
