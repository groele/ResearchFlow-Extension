const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const optionsHtml = read('pages/options.html');
const optionsJs = read('scripts/options.js');
const optionsCss = read('styles/options.css');
const manifest = JSON.parse(read('manifest.json'));

['view-dashboard', 'view-manuscripts', 'view-submissions', 'view-settings'].forEach((id) => {
  assert(optionsHtml.includes(`id="${id}"`), `main workspace should include ${id}`);
});
['submission-assist-enabled', 'submission-assist-capture-enabled', 'submission-assist-state-label', 'submission-assist-scope-help', 'btn-reset-submission-assist'].forEach((id) => {
  assert(optionsHtml.includes(`id="${id}"`), `submission recognition settings should include ${id}`);
});
assert(optionsHtml.includes('settings-switch-track'), 'submission recognition should use the shared custom switch treatment');
['settings-workbench', 'settings-primary-column', 'settings-secondary-column', 'settings-trust-strip', 'settings-route-savebar', 'settings-backup-actions'].forEach((className) => {
  assert(optionsHtml.includes(`class="${className}`) || optionsHtml.includes(` ${className}`), `settings redesign should include ${className}`);
});
assert(optionsHtml.includes('class="settings-hero-index"'), 'settings console should expose a restrained workspace index');
['settings-kicker', 'settings-route-privacy-note', 'settings-credential-note', 'settings-backup-note'].forEach((id) => {
  assert(optionsHtml.includes(`id="${id}"`), `settings redesign should expose localized ${id}`);
});
assert(optionsHtml.includes('id="settings-local-card" data-sync-provider="local"'), 'local-only routing should retain a visible explanatory provider panel');
assert(!optionsHtml.includes('class="settings-grid"'), 'settings should use the guided workbench instead of a flat card grid');
assert(optionsCss.includes('.settings-workbench'), 'settings workbench should have a dedicated responsive layout');
assert(optionsCss.includes('Settings console refinement'), 'settings should use the integrated scientific-console visual treatment');
assert(optionsCss.includes('@media (max-width: 1180px)'), 'settings workbench should reflow before the narrow mobile breakpoint');
assert(optionsJs.includes("setText('#settings-kicker', t('settingsKicker'))"), 'settings hero should localize with the active interface language');
assert(optionsJs.includes("mainContent.scrollTop = 0"), 'workspace navigation should reveal the beginning of each settings view');
assert(optionsHtml.includes('v6.0.1 Companion'), 'workspace version label should match the documentation release');
assert.equal(manifest.version, '6.0.1', 'manifest version should match the documentation release');

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
assert(!optionsJs.includes('pipeline-first-author-index'), 'dashboard first-author typography should not use a competing number badge');
assert(
  /\.pipeline-first-author\s*\{[\s\S]*?font:\s*inherit;[\s\S]*?font-size:\s*11px;/.test(optionsCss),
  'dashboard first-author typography should inherit the metadata font at the shared size'
);
assert(
  /\$\{t\('timelineDateSource'\)\}:[\s\S]{0,500}pipeline-first-author/.test(optionsJs),
  'dashboard first-author entry should follow the submission date source'
);
assert(optionsJs.includes('captureDetailsEnabled'), 'automatic detailed capture should have an independent setting');
assert(optionsJs.includes('function setupSubmissionAutoSave'), 'submission editor should configure automatic persistence');
assert(optionsJs.includes("editCenter.addEventListener('input'"), 'text fields should trigger debounced automatic persistence');
assert(optionsJs.includes("editCenter.addEventListener('change'"), 'select, date, and checklist changes should persist immediately');
assert(optionsJs.includes("renderDetails: false"), 'automatic persistence should preserve editor focus instead of rerendering the form');
assert(optionsJs.includes('lastSavedSnapshot'), 'automatic persistence should skip duplicate blur saves');
assert(optionsJs.includes('data-submission-autosave-status'), 'submission editor should expose accessible automatic save state');
assert(!optionsJs.includes('id="btn-save-sub-edit-center"'), 'submission editor should not require a standalone save button');
assert(
  /body\.submission-capture-mode \.modal-backdrop\s*\{[\s\S]*?pointer-events:\s*none;[\s\S]*?background:\s*transparent;/.test(optionsCss),
  'capture review should leave the workspace visible and interactive'
);
assert(
  /\.modal-card\.submission-capture-card\s*\{[\s\S]*?width:\s*clamp\(520px,\s*46vw,\s*680px\);[\s\S]*?max-height:\s*calc\(100vh - 48px\);[\s\S]*?pointer-events:\s*auto;/.test(optionsCss),
  'capture review should use a bounded non-blocking side card'
);
assert(optionsJs.includes("window.addEventListener('pagehide', flushPendingSave)"), 'pending editor changes should flush when the page closes');
assert(optionsJs.includes('findExistingCapturedSubmission'), 'captured submissions should be checked for duplicates');
assert(optionsJs.includes('sanitizeDatabaseForExternalUse'), 'database export should redact device credentials');
assert(optionsJs.includes('function normalizeSubmissionStatus'), 'legacy submission status aliases should normalize to one canonical enum');
assert(optionsJs.includes('openLinkSubmissionModal'), 'detached submissions should provide a direct manuscript-linking flow');
assert(optionsJs.includes('recordEntityDeletion'), 'submission deletion should create a synchronization tombstone');
assert(optionsJs.includes('function showAcceptanceCelebration'), 'accepted submissions should trigger the milestone celebration');
assert(optionsJs.includes("window.matchMedia?.('(prefers-reduced-motion: reduce)')"), 'celebration motion should honor reduced-motion preferences');
assert(optionsJs.includes('window.RFUI.shouldCelebrateAcceptance'), 'celebration should use a tested one-time status-transition guard');
assert(
  optionsJs.indexOf('await window.storage.saveAll(workingDatabase') < optionsJs.indexOf('if (shouldCelebrate) showAcceptanceCelebration(savedSub)'),
  'celebration should run only after the accepted state is persisted'
);
assert(optionsJs.includes('structuredClone(db)'), 'submission edits should be applied to an isolated transaction copy');
assert(optionsJs.includes('function refreshSubmissionStatusPresentation'), 'auto-save should refresh status chrome without rebuilding the active form');
assert(optionsJs.includes('function persistManuscriptStatusChange'), 'kanban status changes should use an isolated persistence transaction');
assert(optionsJs.includes('showAcceptanceCelebration({ title: result.manuscript.title'), 'kanban acceptance should share the milestone celebration');
assert(optionsJs.includes('data-submission-status-badge="stage"'), 'submission details should expose a lightweight stage badge update target');
assert(optionsJs.includes('data-submission-status-badge="editor"'), 'submission editor should expose a lightweight status badge update target');
assert(optionsCss.includes('.acceptance-celebration'), 'acceptance celebration should use the workspace visual system');
assert(
  /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.acceptance-confetti-field\s*\{[\s\S]*?display:\s*none;/.test(optionsCss),
  'reduced-motion mode should suppress falling confetti'
);
assert(!optionsJs.includes('data-editor-mount-badge'), 'internal render-version badges should not appear in the submission workflow');
assert(optionsHtml.includes('class="submission-tools-row"'), 'journal shortcuts should use a dedicated row instead of crowding the page title');
assert(optionsHtml.includes('data-sync-provider="webdav"'), 'WebDAV settings should support provider-specific progressive disclosure');
assert(optionsHtml.includes('data-sync-provider="github"'), 'GitHub settings should support provider-specific progressive disclosure');
assert(optionsHtml.includes('id="language-auto-save-status"'), 'language settings should communicate automatic persistence');
assert(!optionsHtml.includes('id="btn-save-language"'), 'language selection should not require a separate save button');
assert(optionsHtml.includes('id="btn-restore-import-backup"'), 'settings should expose recovery from the last pre-import backup');
assert(optionsJs.includes("new Blob([JSON.stringify(safeDb, null, 2)]"), 'large database exports should use a Blob rather than a data URI');
assert(optionsJs.includes('MAX_IMPORT_BYTES'), 'database imports should enforce a bounded input size');
assert(optionsJs.includes('PRE_IMPORT_BACKUP_KEY'), 'database imports should create a recoverable pre-import snapshot');
assert(
  optionsJs.indexOf('[PRE_IMPORT_BACKUP_KEY]') < optionsJs.indexOf('db = await window.storage.saveAll(normalizedImport)'),
  'the recovery snapshot should be written before imported data replaces the active database'
);

console.log('restored main workspace tests passed');
