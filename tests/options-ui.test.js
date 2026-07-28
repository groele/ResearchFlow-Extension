const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const optionsHtml = read('pages/options.html');
const optionsJs = read('scripts/options.js');
const manifest = JSON.parse(read('manifest.json'));

['view-dashboard', 'view-manuscripts', 'view-submissions', 'view-settings'].forEach((id) => {
  assert(optionsHtml.includes(`id="${id}"`), `main workspace should include ${id}`);
});
['submission-assist-enabled', 'submission-assist-capture-enabled', 'submission-assist-state-label', 'submission-assist-scope-help', 'btn-reset-submission-assist'].forEach((id) => {
  assert(optionsHtml.includes(`id="${id}"`), `submission recognition settings should include ${id}`);
});
assert(optionsHtml.includes('settings-switch-track'), 'submission recognition should use the shared custom switch treatment');
assert(optionsHtml.includes('v4.1.0 Companion'), 'workspace version label should match the feature release');

['view-projects', 'view-library', 'metric-projects', 'metric-records', 'metric-evidence', 'recent-records'].forEach((removedSection) => {
  assert(!optionsHtml.includes(removedSection), `options page should not expose removed ${removedSection}`);
});

['view-evidence', 'ai.js', 'settings-ai-card', 'route-files'].forEach((removedModule) => {
  assert(!optionsHtml.includes(removedModule), `options page should not expose removed ${removedModule}`);
});

['renderDashboard', 'renderKanban', 'renderSubmissions', 'renderJournalPortals', 'loadSettings'].forEach((functionName) => {
  assert(optionsJs.includes(`function ${functionName}`), `main workspace should retain ${functionName}`);
});
['function normalizeText', 'function getSubmissionStatusLabel'].forEach((definition) => {
  assert(optionsJs.includes(definition), `restored workspace should define ${definition}`);
});
assert(!/renderEvidence|aiCopilot|btn-ai-draft|btn-import-guidelines/i.test(optionsJs), 'removed Evidence and AI behavior should stay absent');
assert(!manifest.host_permissions.some((origin) => origin.includes('openai.com') || origin.includes('deepseek.com')), 'active core must not request AI provider access');
assert(optionsJs.includes('sub-journal-url'), 'new submission flow should accept a detected portal URL');
assert(optionsJs.includes('submission-capture-review'), 'captured portal data should open a human review panel');
assert(optionsJs.includes('sub-capture-project-title'), 'capture review should require a new project name');
assert(optionsJs.includes('captureProvenance'), 'confirmed captures should retain local provenance and confidence');
assert(optionsJs.includes("reviewedByUser: true"), 'captured information should only be marked reviewed after confirmation');
assert(optionsJs.includes('sub-edit-first-author'), 'submission editor should expose a first-author module');
assert(optionsJs.includes('pipeline-first-author'), 'dashboard pipeline cards should render first-author information');
assert(
  /\$\{t\('timelineDateSource'\)\}:[\s\S]{0,500}pipeline-first-author/.test(optionsJs),
  'dashboard first-author entry should follow the submission date source'
);
assert(optionsJs.includes('captureDetailsEnabled'), 'automatic detailed capture should have an independent setting');

console.log('restored main workspace tests passed');
