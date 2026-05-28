import type { ExtensionRequest, PaperMetadata } from './types';

/**
 * Sends a typed request to the background service worker or another active context.
 */
export async function sendExtensionMessage<T = unknown>(message: ExtensionRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Sends a scrape request to a specific tab's content script.
 */
export async function scrapeTab(tabId: number): Promise<PaperMetadata> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { action: 'SCRAPE_PAGE' }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (!response) {
        reject(new Error('Scraping failed: No response received from tab.'));
      } else {
        resolve(response);
      }
    });
  });
}
