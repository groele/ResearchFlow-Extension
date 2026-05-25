/**
 * ResearchFlow Companion - Content Scraper
 * Extracts scholarly metadata (DOI, title, authors, abstract, PDF url) 
 * from academic sites and returns it to the extension side panel.
 */

// Listener to handle scrape requests from Sidepanel or Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SCRAPE_PAGE') {
    const metadata = scrapeAcademicMetadata();
    sendResponse(metadata);
  }
  return true; // Keep message channel open for async operations
});

function scrapeAcademicMetadata() {
  const url = window.location.href;
  let metadata = {
    title: document.title,
    doi: '',
    authors: [],
    abstract: '',
    pdfUrl: '',
    journal: '',
    sourceUrl: url,
    pubDate: '',
    siteType: 'generic'
  };

  try {
    // 1. Meta tag extraction (Standard Highwire / Dublin Core used by major journals)
    extractMetaTags(metadata);

    // 2. Platform-specific fine-tuning
    if (url.includes('arxiv.org')) {
      scrapeArxiv(metadata);
    } else if (url.includes('biorxiv.org') || url.includes('medrxiv.org')) {
      scrapeBiorxiv(metadata);
    } else if (url.includes('pubmed.ncbi.nlm.nih.gov')) {
      scrapePubmed(metadata);
    } else if (url.includes('scholar.google.com')) {
      scrapeGoogleScholar(metadata);
    } else if (url.includes('overleaf.com')) {
      scrapeOverleaf(metadata);
    }

    // Clean up strings
    metadata.title = cleanString(metadata.title);
    metadata.abstract = cleanString(metadata.abstract);

    // Fallback DOI Detection
    if (!metadata.doi) {
      metadata.doi = findDoiOnPage();
    }

    if (metadata.doi) {
      metadata.doi = metadata.doi.replace(/doi:\s*/i, '')
                                  .replace(/^https?:\/\/doi\.org\//i, '')
                                  .trim();
      // Remove trailing punctuation that might have been matched
      metadata.doi = metadata.doi.replace(/[.,;)]+$/, '');
    }

  } catch (e) {
    console.error('ResearchFlow Content Scraper Error:', e);
  }

  return metadata;
}

/**
 * Extracts standard Dublin Core & Highwire Press meta tags
 */
function extractMetaTags(meta) {
  const metaSelectors = {
    title: ['citation_title', 'dc.title', 'og:title'],
    doi: ['citation_doi', 'dc.identifier', 'dc.identifier.doi'],
    author: ['citation_author', 'dc.creator'],
    abstract: ['citation_abstract', 'dc.description', 'description', 'og:description'],
    pdfUrl: ['citation_pdf_url'],
    journal: ['citation_journal_title', 'dc.relation.journal'],
    pubDate: ['citation_publication_date', 'dc.date', 'citation_date']
  };

  const getMetaContent = (names) => {
    for (const name of names) {
      // Try name attribute
      let element = document.querySelector(`meta[name="${name}"]`);
      if (element && element.getAttribute('content')) return element.getAttribute('content');
      // Try property attribute
      element = document.querySelector(`meta[property="${name}"]`);
      if (element && element.getAttribute('content')) return element.getAttribute('content');
    }
    return '';
  };

  const authors = [];
  const authorTags = document.querySelectorAll('meta[name="citation_author"], meta[name="dc.creator"]');
  authorTags.forEach(tag => {
    const val = tag.getAttribute('content');
    if (val && !authors.includes(val)) authors.push(val);
  });

  meta.title = getMetaContent(metaSelectors.title) || meta.title;
  meta.doi = getMetaContent(metaSelectors.doi) || meta.doi;
  meta.authors = authors.length > 0 ? authors : meta.authors;
  meta.abstract = getMetaContent(metaSelectors.abstract) || meta.abstract;
  meta.pdfUrl = getMetaContent(metaSelectors.pdfUrl) || meta.pdfUrl;
  meta.journal = getMetaContent(metaSelectors.journal) || meta.journal;
  meta.pubDate = getMetaContent(metaSelectors.pubDate) || meta.pubDate;
}

/**
 * Specific scraper for arXiv.org
 */
function scrapeArxiv(meta) {
  meta.siteType = 'arxiv';
  meta.journal = 'arXiv';
  
  // Extract Title
  const titleEl = document.querySelector('h1.title');
  if (titleEl) {
    // Remove the word "Title:" at the start
    meta.title = titleEl.textContent.replace(/^title:\s*/i, '').trim();
  }

  // Extract Authors
  const authorEls = document.querySelectorAll('.authors a');
  if (authorEls.length > 0) {
    meta.authors = Array.from(authorEls).map(el => el.textContent.trim());
  }

  // Extract Abstract
  const abstractEl = document.querySelector('blockquote.abstract');
  if (abstractEl) {
    meta.abstract = abstractEl.textContent.replace(/^abstract:\s*/i, '').trim();
  }

  // Extract PDF URL
  const pdfLink = document.querySelector('a.download-pdf, .extra-services .full-text a[href*="/pdf"]');
  if (pdfLink) {
    meta.pdfUrl = pdfLink.href;
  } else {
    // Construct default PDF URL
    const match = window.location.href.match(/abs\/([^?#]+)/);
    if (match) {
      meta.pdfUrl = `https://arxiv.org/pdf/${match[1]}.pdf`;
    }
  }
}

/**
 * Specific scraper for bioRxiv/medRxiv
 */
function scrapeBiorxiv(meta) {
  meta.siteType = 'biorxiv';
  meta.journal = window.location.href.includes('medrxiv.org') ? 'medRxiv' : 'bioRxiv';

  // Abstract element fallback
  const absEl = document.querySelector('.section.abstract p, #abstract p');
  if (absEl && !meta.abstract) {
    meta.abstract = absEl.textContent;
  }
}

/**
 * Specific scraper for PubMed
 */
function scrapePubmed(meta) {
  meta.siteType = 'pubmed';
  meta.journal = document.querySelector('.journal-actions-trigger')?.textContent?.trim() || meta.journal;

  const titleEl = document.querySelector('.heading-title');
  if (titleEl) meta.title = titleEl.textContent.trim();

  // Authors
  const authorEls = document.querySelectorAll('.authors-list-item .full-name');
  if (authorEls.length > 0) {
    meta.authors = Array.from(authorEls).map(el => el.textContent.trim());
  }

  // Abstract
  const abstractEl = document.querySelector('#eng-abstract, .abstract-content');
  if (abstractEl) {
    meta.abstract = abstractEl.textContent.replace(/\s+/g, ' ').trim();
  }

  // DOI
  const doiEl = document.querySelector('.citation-doi, .id-link[data-type="doi"]');
  if (doiEl && !meta.doi) {
    meta.doi = doiEl.textContent.trim();
  }
}

/**
 * Specific scraper for Google Scholar
 */
function scrapeGoogleScholar(meta) {
  meta.siteType = 'scholar';
}

/**
 * Specific scraper for Overleaf
 */
function scrapeOverleaf(meta) {
  meta.siteType = 'overleaf';
  const nameEl = document.querySelector('.project-name, [data-testid="project-name"]');
  if (nameEl) {
    meta.title = nameEl.textContent.trim();
  }
}

function cleanString(str) {
  if (!str) return '';
  return str.replace(/\s+/g, ' ').trim();
}

function findDoiOnPage() {
  const doiRegex = /\b(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i;

  const findDoiInString = (str) => {
    if (!str) return '';
    const match = str.match(doiRegex);
    return match ? match[1] : '';
  };

  // 1. Try search in URL
  let doi = findDoiInString(window.location.href);
  if (doi) return doi;

  // 2. Try search in Document Title
  doi = findDoiInString(document.title);
  if (doi) return doi;

  // 3. Try checking any link matching "doi.org"
  const doiLinks = document.querySelectorAll('a[href*="doi.org/"]');
  for (const link of doiLinks) {
    const matched = findDoiInString(link.href);
    if (matched) return matched;
  }

  // 4. Try checking common DOM elements text content
  const commonDoiSelectors = [
    '.doi', '.doi-link', '[data-doi]', '.citation-doi', 
    '.article-doi', '.publication-doi', '#doi', '.article-header'
  ];
  for (const selector of commonDoiSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      if (selector === '[data-doi]') {
        const attrVal = el.getAttribute('data-doi');
        if (attrVal) return attrVal;
      }
      const matched = findDoiInString(el.textContent);
      if (matched) return matched;
    }
  }

  // 5. Fallback: Search first 30000 characters of page body text
  if (document.body) {
    const bodyText = document.body.innerText;
    if (bodyText) {
      const matched = findDoiInString(bodyText.substring(0, 30000));
      if (matched) return matched;
    }
  }

  return '';
}
