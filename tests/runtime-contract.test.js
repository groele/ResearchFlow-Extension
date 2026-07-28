const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const manifest = JSON.parse(read('manifest.json'));

[
  manifest.background.service_worker,
  manifest.action.default_popup,
  manifest.options_page,
  manifest.side_panel.default_path
].forEach((entrypoint) => {
  assert(exists(entrypoint), `manifest entrypoint should exist: ${entrypoint}`);
});

for (const pagePath of [
  manifest.action.default_popup,
  manifest.options_page,
  manifest.side_panel.default_path
]) {
  const html = read(pagePath);
  for (const match of html.matchAll(/<script\s+src="([^"]+)"/g)) {
    const scriptPath = path.normalize(path.join(path.dirname(pagePath), match[1]));
    assert(exists(scriptPath), `${pagePath} should load an existing script: ${scriptPath}`);
  }
}

const requiredIds = {
  'pages/options.html': [
    'view-dashboard', 'view-settings', 'metric-tasks', 'metric-evidence',
    'settings-form', 'profile-name', 'profile-affiliation', 'sync-provider',
    'btn-export-db', 'btn-manual-sync', 'modal-container', 'toast-region'
  ],
  'pages/sidepanel.html': [
    'side-project-select', 'tab-capture', 'tab-workspace', 'btn-scrape',
    'capture-form', 'meta-title', 'meta-doi', 'meta-source-url',
    'meta-summary', 'meta-content', 'meta-tags', 'scratchpad',
    'btn-add-task', 'side-tasks-list', 'side-toast'
  ],
  'pages/popup.html': [
    'metric-projects', 'metric-records', 'project-select', 'note-title',
    'note-doi', 'note-content', 'btn-save-note', 'btn-open-master',
    'btn-sidepanel'
  ]
};

for (const [pagePath, ids] of Object.entries(requiredIds)) {
  const html = read(pagePath);
  for (const id of ids) {
    assert(html.includes(`id="${id}"`), `${pagePath} should provide #${id}`);
  }
}

assert(!exists('scripts/modules/projects.js'), 'removed projects dashboard module should stay absent');
assert(!exists('scripts/modules/library.js'), 'removed library dashboard module should stay absent');
assert(!exists('scripts/ai.js'), 'retired AI runtime should stay absent');

console.log('runtime contract tests passed');
