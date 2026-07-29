/**
 * ResearchFlow Companion - focused MV3 service worker.
 *
 * Responsibilities:
 * - open the full workspace from the toolbar icon;
 * - receive reviewed submission-portal captures;
 * - serialize database writes across extension pages;
 * - run explicit or scheduled database synchronization.
 */

importScripts('storage.js', 'journal-portals.js');

let databaseWriteQueue = Promise.resolve();

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

async function openSubmissionCapturePage() {
  const workspaceUrl = chrome.runtime.getURL('pages/options.html');
  const captureUrl = `${workspaceUrl}?mode=submission-capture`;
  const tabs = await chrome.tabs.query({});
  const existingWorkspace = tabs.find(tab => (
    tab.id
    && typeof tab.url === 'string'
    && tab.url.startsWith(workspaceUrl)
  ));

  if (existingWorkspace) {
    await chrome.tabs.update(existingWorkspace.id, { url: captureUrl, active: true });
    if (existingWorkspace.windowId) {
      await chrome.windows.update(existingWorkspace.windowId, { focused: true }).catch(() => {});
    }
    return;
  }

  await chrome.tabs.create({ url: captureUrl, active: true });
}

function safeText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function buildPendingSubmissionDraft(request, sender) {
  const supplied = request.capture || request.draft || {};
  const detected = self.RFJournalPortals?.buildSubmissionCapture({
    url: supplied.portalUrl || supplied.journalUrl || sender.tab?.url || '',
    title: supplied.pageTitle || sender.tab?.title || '',
    signals: {
      journalName: supplied.journalName || supplied.targetJournal,
      manuscriptTitle: supplied.manuscriptTitle,
      manuscriptId: supplied.manuscriptId,
      status: supplied.workflowStage || supplied.status,
      submissionDate: supplied.submissionDate,
      revisionDueDate: supplied.revisionDueDate,
      firstAuthor: supplied.firstAuthor,
      authors: supplied.authors,
      abstract: supplied.abstract,
      keywords: supplied.keywords
    }
  });
  if (!detected) return null;

  const now = Date.now();
  return {
    targetJournal: safeText(detected.journalName, 160),
    journalUrl: detected.portalUrl,
    platformId: detected.platformId,
    platformName: detected.platformName,
    sourceOrigin: detected.origin,
    manuscriptTitle: safeText(detected.manuscriptTitle, 500),
    manuscriptId: safeText(detected.manuscriptId, 120),
    workflowStage: safeText(detected.workflowStage, 40),
    submissionDate: detected.submissionDate || new Date(now).toISOString().slice(0, 10),
    revisionDueDate: detected.revisionDueDate || '',
    firstAuthor: safeText(detected.firstAuthor, 160),
    authors: safeText(detected.authors, 600),
    abstract: safeText(detected.abstract, 4000),
    keywords: safeText(detected.keywords, 500),
    confidenceScore: Number(detected.confidenceScore) || 0,
    confidenceLevel: safeText(detected.confidenceLevel, 20),
    detectedFieldCount: Number(detected.detectedFieldCount) || 0,
    evidence: Array.isArray(detected.evidence) ? detected.evidence.slice(0, 12) : [],
    createdAt: now,
    expiresAt: now + (30 * 60 * 1000)
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SAVE_DATABASE') {
    databaseWriteQueue = databaseWriteQueue
      .catch(() => {})
      .then(async () => {
        let nextDatabase = request.data;
        if (request.mergeOnConflict) {
          const currentDatabase = await storage.loadAll();
          nextDatabase = await storage.mergeDatabases(request.data, currentDatabase);
        }
        return storage.saveAll(nextDatabase, { localOnly: true });
      });
    databaseWriteQueue
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'TRIGGER_SYNC') {
    storage.syncDatabaseNow()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'OPEN_SUBMISSION_CAPTURE') {
    const pendingDraft = buildPendingSubmissionDraft(request, sender);
    if (!pendingDraft) {
      sendResponse({ success: false, error: 'Unsupported submission portal.' });
      return true;
    }

    chrome.storage.local
      .set({ researchflow_pending_submission_draft: pendingDraft })
      .then(() => openSubmissionCapturePage())
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  return false;
});
