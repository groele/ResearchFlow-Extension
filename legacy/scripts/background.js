/**
 * ResearchFlow Companion - Background Service Worker (Manifest V3)
 * Manages background sync cycles, extension installation hooks,
 * context menus for text highlights, and programmatically routes side panel actions.
 */

// Import storage engine scripts into the service worker scope
importScripts('storage.js');

// 1. Install & Initialization Hook
self.addEventListener('install', (event) => {
  console.log('ResearchFlow Service Worker Installing...');
  self.skipWaiting();
});

chrome.runtime.onInstalled.addListener((details) => {
  console.log('ResearchFlow Companion Extension Installed.');
  
  // Set up context menus to let researchers capture quotes/data from pages
  chrome.contextMenus.create({
    id: 'capture-highlight-note',
    title: 'Log selection as Research Record Note',
    contexts: ['selection']
  });

  // Programmatic Side Panel click behavior (Chrome 116+)
  if (chrome.sidePanel && typeof chrome.sidePanel.setPanelBehavior === 'function') {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});

// 2. Context Menu Trigger Handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'capture-highlight-note' && info.selectionText) {
    try {
      const db = await storage.loadAll();
      
      // Default to the first project or create a default 'General' project if empty
      let projectId = db.projects[0]?.id;
      if (!projectId) {
        projectId = 'proj_general';
        db.projects.push({
          id: projectId,
          userId: 'user',
          title: 'General In-Context Notes',
          discipline: 'General Science',
          hypothesis: '',
          abstract: 'General folder for research highlights captured from the web',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      const highlightedRecord = {
        id: 'rec_' + Math.random().toString(36).substring(2, 9),
        userId: 'user',
        projectId: projectId,
        schemaTemplateId: null,
        title: `Captured Highlight: ${tab.title.slice(0, 30)}...`,
        recordType: 'literature_review',
        methodology: `Scraped directly from page ${tab.url}`,
        recordedDate: new Date().toISOString(),
        attributes: {
          highlightedQuote: info.selectionText,
          sourceUrl: tab.url
        },
        dataPath: tab.url,
        externalRef: null,
        summary: `"${info.selectionText}"`,
        tags: ['web-highlight'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.researchRecords.push(highlightedRecord);
      await storage.saveAll(db);
      
      console.log('Highlighted research record logged successfully.');
    } catch (e) {
      console.error('Error logging highlighted note:', e);
    }
  }
});

// 3. Message Routing
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'TRIGGER_SYNC') {
    // Run asynchronous background database synchronization
    storage.syncDatabaseNow()
      .then((res) => {
        sendResponse(res);
      })
      .catch((err) => {
        sendResponse({ success: false, error: err.message });
      });
    return true; // Keep response channel open for async promise
  }
});
