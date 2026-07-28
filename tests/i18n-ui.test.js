const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const popupJs = read('scripts/popup.js');
const sidepanelHtml = read('pages/sidepanel.html');
const sidepanelJs = read('scripts/sidepanel.js');
const sidepanelCss = read('styles/sidepanel.css');

assert(popupJs.includes('POPUP_I18N'), 'popup keeps its existing localized quick-capture strings');
assert(sidepanelHtml.includes('Capture · organize · retrieve'), 'side panel should communicate the focused research loop');
assert(sidepanelHtml.includes('tab-workspace'), 'side panel should expose the project workspace');
assert(!sidepanelHtml.includes('Copilot'), 'generic AI copilot should not remain in the active side panel');
assert(!/AI assistant|AI 助手|关联证据|evidence/i.test(sidepanelHtml), 'side panel should not expose AI or Evidence Locker controls');
assert(!/assistant|copilot|evidence/i.test(sidepanelJs), 'side panel controller should not retain AI or Evidence Locker behavior');
assert(!/ai-quick|chat-bubble|chat-input|evidence/i.test(sidepanelCss), 'side panel styles should not retain AI or Evidence Locker modules');
assert(sidepanelJs.includes('scrapeCurrentTab'), 'side panel should retain current-paper capture');
assert(sidepanelJs.includes('researchflow_scratchpad'), 'side panel should retain local working notes');

console.log('focused sidepanel UI tests passed');
