const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const manifest = JSON.parse(read('manifest.json'));

[
  manifest.background.service_worker,
  manifest.options_page
].forEach((entrypoint) => {
  assert(exists(entrypoint), `manifest entrypoint should exist: ${entrypoint}`);
});

assert(Array.isArray(manifest.content_scripts), 'submission portal content scripts should be registered');
const portalContentScript = manifest.content_scripts.find(entry =>
  entry.js?.includes('scripts/journal-portals.js') && entry.js?.includes('scripts/content.js')
);
assert(portalContentScript, 'portal detection should load before the page prompt controller');
assert(
  portalContentScript.matches.some(pattern => pattern.includes('manuscriptcentral.com')),
  'ScholarOne portals should be supported'
);
assert(
  portalContentScript.matches.some(pattern => pattern.includes('editorialmanager.com')),
  'Editorial Manager portals should be supported'
);

for (const pagePath of [manifest.options_page]) {
  const html = read(pagePath);
  for (const match of html.matchAll(/<script\s+src="([^"]+)"/g)) {
    const scriptPath = path.normalize(path.join(path.dirname(pagePath), match[1]));
    assert(exists(scriptPath), `${pagePath} should load an existing script: ${scriptPath}`);
  }
}

const requiredIds = {
  'pages/options.html': [
    'view-dashboard', 'view-manuscripts', 'view-submissions', 'view-settings',
    'dashboard-gantt', 'cards-idea', 'cards-drafting', 'cards-submitted',
    'cards-accepted', 'submissions-list-container', 'submission-detail-panel',
    'journal-portals-list', 'route-db', 'btn-export-db', 'btn-manual-sync',
    'modal-container'
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
assert(!exists('pages/sidepanel.html'), 'side panel page should be removed');
assert(!exists('scripts/sidepanel.js'), 'side panel controller should be removed');
assert(!exists('styles/sidepanel.css'), 'side panel styles should be removed');
assert(!exists('pages/popup.html'), 'toolbar popup page should be removed');
assert(!exists('scripts/popup.js'), 'toolbar popup controller should be removed');
assert(!('default_popup' in manifest.action), 'toolbar icon should bypass the popup');
assert(!('side_panel' in manifest), 'manifest should not register a side panel');
assert(!manifest.permissions.includes('sidePanel'), 'manifest should not request sidePanel permission');

const backgroundJs = read(manifest.background.service_worker);
assert(backgroundJs.includes('chrome.action.onClicked.addListener'), 'toolbar icon should have a click handler');
assert(backgroundJs.includes('chrome.runtime.openOptionsPage()'), 'toolbar icon should open the main workspace');
assert(!backgroundJs.includes('openPanelOnActionClick'), 'toolbar icon should not open the side panel');
assert(backgroundJs.includes('OPEN_SUBMISSION_CAPTURE'), 'background should accept detected submission drafts');
assert(backgroundJs.includes('researchflow_pending_submission_draft'), 'background should persist a short-lived submission draft');
assert(backgroundJs.includes('openSubmissionCapturePage'), 'detected portals should open the direct submission form route');
assert(backgroundJs.includes('?mode=submission-capture'), 'detected portals should request submission capture mode');
assert(backgroundJs.includes('chrome.tabs.update'), 'an existing workspace should navigate directly to the submission form');
assert(backgroundJs.includes('chrome.tabs.create'), 'a missing workspace should open the submission form in a new tab');

const contentJs = read('scripts/content.js');
assert(contentJs.includes('maybeOfferSubmissionCapture'), 'content script should offer quick submission entry');
assert(contentJs.includes('Do not show on this site'), 'portal prompt should support per-site dismissal');
assert(contentJs.includes('collectSubmissionPageSignals'), 'portal capture should collect reviewable workflow fields');
assert(contentJs.includes('Capture information'), 'portal prompt should expose one-click information capture');
assert(contentJs.includes('captureDetailsEnabled'), 'content capture should respect the independent detail-capture switch');

const optionsJs = read('scripts/options.js');
assert(optionsJs.includes('consumePendingSubmissionDraft'), 'main workspace should consume detected submission drafts');
assert(optionsJs.includes("classList.add('submission-capture-mode')"), 'detected drafts should enter focused submission form mode');
assert(optionsJs.includes('selectedSubmissionId = newSub.id'), 'new submissions should open as the selected record');
assert(optionsJs.includes('window.RFCore.upsertProject'), 'confirmed capture should create a linked project');

const storageJs = read('scripts/storage.js');
assert(!storageJs.includes('evidence: []'), 'storage defaults should not retain Evidence Locker data');
assert(storageJs.includes('delete normalized.evidence'), 'old databases should discard Evidence Locker data');
assert(storageJs.includes('delete normalized.projectEvidenceLinks'), 'old project evidence links should be discarded');
assert(storageJs.includes('delete normalized.recordEvidenceLinks'), 'old record evidence links should be discarded');
assert(storageJs.includes('delete normalized.settings.ai'), 'old AI settings should be discarded');
assert(storageJs.includes('delete normalized.settings.syncProviders.files'), 'old evidence file routing should be discarded');
assert(storageJs.includes("'manuscripts'"), 'storage should normalize manuscripts');
assert(storageJs.includes("'submissions'"), 'storage should normalize submissions');

console.log('runtime contract tests passed');
