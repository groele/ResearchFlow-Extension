const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const optionsHtml = read('pages/options.html');
const optionsJs = read('scripts/options.js');
const manifest = JSON.parse(read('manifest.json'));

['view-dashboard', 'view-settings'].forEach((id) => {
  assert(optionsHtml.includes(`id="${id}"`), `core workspace should include ${id}`);
});

['view-projects', 'view-library', 'metric-projects', 'metric-records', 'recent-records'].forEach((removedSection) => {
  assert(!optionsHtml.includes(removedSection), `options page should not expose removed ${removedSection}`);
});

['view-manuscripts', 'view-submissions', 'view-evidence', 'ai.js'].forEach((legacyModule) => {
  assert(!optionsHtml.includes(legacyModule), `options page should not expose legacy ${legacyModule}`);
});

[
  'scripts/core/research-core.js',
  'scripts/modules/dashboard.js',
  'scripts/modules/settings.js'
].forEach((modulePath) => {
  assert(fs.existsSync(path.join(root, modulePath)), `expected active module: ${modulePath}`);
  assert(optionsHtml.includes(`../${modulePath}`), `options page should load ${modulePath}`);
});

assert(optionsJs.includes('global.RFModules.dashboard.render'), 'entrypoint should compose dashboard module');
assert(optionsJs.includes('global.RFModules.settings.bind'), 'entrypoint should bind settings module');
assert(!optionsJs.includes('global.RFModules.projects'), 'entrypoint should not compose the removed projects module');
assert(!optionsJs.includes('global.RFModules.library'), 'entrypoint should not compose the removed library module');
assert(!manifest.host_permissions.some((origin) => origin.includes('openai.com') || origin.includes('deepseek.com')), 'active core must not request AI provider access');

console.log('core options architecture tests passed');
