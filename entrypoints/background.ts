import { db } from '../src/storage/dexie';
import { migrateOldStorage } from '../src/storage/dexie';
import { syncEngine } from '../src/storage/sync';
import { generateId } from '../src/storage/id';

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

export default defineBackground(() => {
  console.log('ScholarFlow Service Worker Initialized.');

  // 1. Install & Initialization Hooks
  chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('ScholarFlow Extension Installed/Updated.');

    // Run database migration from legacy JSON store to Dexie
    try {
      const migrationRes = await migrateOldStorage();
      console.log('Storage migration completed:', migrationRes);
    } catch (e) {
      console.error('Failed to run storage migration:', e);
    }

    // Set up context menus to let researchers capture highlights in context
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'capture-highlight-note',
        title: 'Log selection as Research Record Note',
        contexts: ['selection']
      });
    });

    // Programmatic Side Panel click behavior (Chrome 116+)
    if (chrome.sidePanel && typeof chrome.sidePanel.setPanelBehavior === 'function') {
      chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
    }
  });

  // 2. Context Menu Trigger Handler
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'capture-highlight-note' && info.selectionText && tab) {
      try {
        // Load existing projects or create a default one
        let firstProject = await db.projects.limit(1).first();
        let projectId = firstProject?.id;

        if (!projectId) {
          projectId = 'proj_general';
          await db.projects.put({
            id: projectId,
            userId: 'user',
            title: 'General In-Context Notes',
            discipline: 'General Science',
            hypothesis: '',
            abstract: 'General folder for research highlights captured from the web',
            status: 'active',
            areaId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }

        const highlightedRecord = {
          id: generateId('rec'),
          userId: 'user',
          projectId: projectId,
          schemaTemplateId: null,
          title: `Captured Highlight: ${(tab.title || 'Page').slice(0, 30)}...`,
          recordType: 'literature_review',
          methodology: `Scraped directly from page ${tab.url}`,
          recordedDate: new Date().toISOString(),
          attributes: {
            highlightedQuote: info.selectionText,
            sourceUrl: tab.url || ''
          },
          dataPath: tab.url || '',
          externalRef: null,
          summary: `"${info.selectionText}"`,
          tags: ['web-highlight'],
          readingStatus: 'unread',
          starred: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await db.researchRecords.put(highlightedRecord);
        console.log('Highlighted research record logged to IndexedDB successfully.');

        // Notify options and side panel pages of database changes
        chrome.runtime.sendMessage({ action: 'DATABASE_UPDATED' }).catch(() => {});
        
        // Auto trigger background sync
        syncEngine.syncDatabaseNow().catch(console.error);
      } catch (e) {
        console.error('Error logging highlighted note context:', e);
      }
    }
  });

  // 3. Message Command Bus Listener
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'TRIGGER_SYNC') {
      syncEngine.syncDatabaseNow()
        .then((res) => sendResponse(res))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;
    }

    if (request.action === 'DATABASE_UPDATED') {
      // Debounce rapid writes — only sync after 2s of inactivity
      if (syncTimeout) clearTimeout(syncTimeout);
      syncTimeout = setTimeout(() => {
        syncEngine.syncDatabaseNow().catch(console.error);
      }, 2000);
      // Badge update to signal pending sync
      chrome.action?.setBadgeText?.({ text: '' }).catch(() => {});
      chrome.action?.setBadgeBackgroundColor?.({ color: '#14b8a6' }).catch(() => {});
      sendResponse({ ok: true });
      return false;
    }
  });
});
