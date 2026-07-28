const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const popupJs = read('scripts/popup.js');
const sidepanelHtml = read('pages/sidepanel.html');
const sidepanelJs = read('scripts/sidepanel.js');

assert(popupJs.includes('POPUP_I18N'), 'popup keeps its existing localized quick-capture strings');
assert(sidepanelHtml.includes('Capture · organize · retrieve'), 'side panel should communicate the focused research loop');
assert(sidepanelHtml.includes('tab-workspace'), 'side panel should expose the project workspace');
assert(!sidepanelHtml.includes('Copilot'), 'generic AI copilot should not remain in the active side panel');
assert(sidepanelJs.includes('scrapeCurrentTab'), 'side panel should retain current-paper capture');
assert(sidepanelJs.includes('researchflow_scratchpad'), 'side panel should retain local working notes');

console.log('focused sidepanel UI tests passed');
