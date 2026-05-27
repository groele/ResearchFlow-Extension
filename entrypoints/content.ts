import { scrapeAcademicMetadata } from '../src/core/journal-rules';

export default defineContentScript({
  matches: [
    '*://scholar.google.com/*',
    '*://*.scholar.google.com/*',
    '*://pubmed.ncbi.nlm.nih.gov/*',
    '*://*.pubmed.ncbi.nlm.nih.gov/*',
    '*://arxiv.org/*',
    '*://*.arxiv.org/*',
    '*://doi.org/*',
    '*://*.doi.org/*',
    '*://*.nature.com/*',
    '*://*.science.org/*',
    '*://*.springer.com/*',
    '*://*.wiley.com/*',
    '*://*.ieee.org/*',
    '*://*.acs.org/*',
    '*://*.elsevier.com/*',
    '*://*.researchgate.net/*',
    '*://*.semanticscholar.org/*',
  ],
  main() {
    console.log('ScholarFlow Scraper probe loaded successfully.');

    // Listen for scrape requests from Side panel or Action Popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'SCRAPE_PAGE') {
        scrapeAcademicMetadata(document)
          .then((metadata) => {
            sendResponse(metadata);
          })
          .catch((err) => {
            console.error('ScholarFlow Scraping error:', err);
            sendResponse(null);
          });
        return true; // Keep message channel open for async scrape
      }
    });
  },
});
