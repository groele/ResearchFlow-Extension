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

console.log('restored main workspace tests passed');
