import type { PaperMetadata } from '@/messaging/types';
import { arxivAdapter } from './arxiv';
import { biorxivAdapter } from './biorxiv';
import { pubmedAdapter } from './pubmed';
import { overleafAdapter } from './overleaf';

export interface JournalRule {
  id: string;
  match(url: string, doc: Document): boolean;
  extract(doc: Document, baseMetadata: Partial<PaperMetadata>): Partial<PaperMetadata> | Promise<Partial<PaperMetadata>>;
}

const adapters: JournalRule[] = [
  arxivAdapter,
  biorxivAdapter,
  pubmedAdapter,
  overleafAdapter
];

/**
 * Extracts Dublin Core & Highwire Press meta tags
 */
export function extractMetaTags(doc: Document): Partial<PaperMetadata> {
  const meta: Partial<PaperMetadata> = {
    title: doc.title,
    doi: '',
    authors: [],
    abstract: '',
    pdfUrl: '',
    journal: '',
    pubDate: '',
  };

  const metaSelectors: Record<string, string[]> = {
    title: ['citation_title', 'dc.title', 'og:title'],
    doi: ['citation_doi', 'dc.identifier', 'dc.identifier.doi'],
    abstract: ['citation_abstract', 'dc.description', 'description', 'og:description'],
    pdfUrl: ['citation_pdf_url'],
    journal: ['citation_journal_title', 'dc.relation.journal'],
    pubDate: ['citation_publication_date', 'dc.date', 'citation_date']
  };

  const getMetaContent = (names: string[]) => {
    for (const name of names) {
      // Try name attribute
      let element = doc.querySelector(`meta[name="${name}"]`);
      if (element && element.getAttribute('content')) return element.getAttribute('content') || '';
      // Try property attribute
      element = doc.querySelector(`meta[property="${name}"]`);
      if (element && element.getAttribute('content')) return element.getAttribute('content') || '';
    }
    return '';
  };

  const authors: string[] = [];
  const authorTags = doc.querySelectorAll('meta[name="citation_author"], meta[name="dc.creator"]');
  authorTags.forEach(tag => {
    const val = tag.getAttribute('content');
    if (val && !authors.includes(val)) authors.push(val);
  });

  meta.title = getMetaContent(metaSelectors.title) || meta.title;
  meta.doi = getMetaContent(metaSelectors.doi) || meta.doi;
  meta.authors = authors.length > 0 ? authors : [];
  meta.abstract = getMetaContent(metaSelectors.abstract) || meta.abstract;
  meta.pdfUrl = getMetaContent(metaSelectors.pdfUrl) || meta.pdfUrl;
  meta.journal = getMetaContent(metaSelectors.journal) || meta.journal;
  meta.pubDate = getMetaContent(metaSelectors.pubDate) || meta.pubDate;

  return meta;
}

/**
 * Searches the page content for a valid DOI string using regex
 */
export function findDoiOnPage(doc: Document): string {
  const doiRegex = /\b(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i;

  const findDoiInString = (str: string) => {
    if (!str) return '';
    const match = str.match(doiRegex);
    return match ? match[1] : '';
  };

  // 1. Try search in URL
  let doi = findDoiInString(doc.location.href);
  if (doi) return doi;

  // 2. Try search in Document Title
  doi = findDoiInString(doc.title);
  if (doi) return doi;

  // 3. Try checking any link matching "doi.org"
  const doiLinks = doc.querySelectorAll('a[href*="doi.org/"]');
  for (const link of Array.from(doiLinks) as HTMLAnchorElement[]) {
    const matched = findDoiInString(link.href);
    if (matched) return matched;
  }

  // 4. Try checking common DOM elements text content
  const commonDoiSelectors = [
    '.doi', '.doi-link', '[data-doi]', '.citation-doi', 
    '.article-doi', '.publication-doi', '#doi', '.article-header'
  ];
  for (const selector of commonDoiSelectors) {
    const el = doc.querySelector(selector);
    if (el) {
      if (selector === '[data-doi]') {
        const attrVal = el.getAttribute('data-doi');
        if (attrVal) return attrVal;
      }
      const matched = findDoiInString(el.textContent || '');
      if (matched) return matched;
    }
  }

  // 5. Fallback: Search first 30000 characters of page body text
  if (doc.body) {
    const bodyText = doc.body.innerText;
    if (bodyText) {
      const matched = findDoiInString(bodyText.substring(0, 30000));
      if (matched) return matched;
    }
  }

  return '';
}

function cleanString(str: string): string {
  if (!str) return '';
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Runs the scraper pipeline using meta tags and specialized journal adapters
 */
export async function scrapeAcademicMetadata(doc: Document): Promise<PaperMetadata> {
  const url = doc.location.href;
  let metadata: Partial<PaperMetadata> = extractMetaTags(doc);
  metadata.sourceUrl = url;
  metadata.siteType = 'generic';

  // Find matching adapter
  for (const adapter of adapters) {
    if (adapter.match(url, doc)) {
      metadata = await adapter.extract(doc, metadata);
      break;
    }
  }

  // Clean strings
  metadata.title = cleanString(metadata.title || doc.title);
  metadata.abstract = cleanString(metadata.abstract || '');

  // Fallback DOI Detection
  if (!metadata.doi) {
    metadata.doi = findDoiOnPage(doc);
  }

  if (metadata.doi) {
    metadata.doi = metadata.doi.replace(/doi:\s*/i, '')
                                .replace(/^https?:\/\/doi\.org\//i, '')
                                .trim();
    // Remove trailing punctuation that might have been matched
    metadata.doi = metadata.doi.replace(/[.,;)]+$/, '');
  }

  return {
    title: metadata.title || '',
    doi: metadata.doi || '',
    authors: metadata.authors || [],
    abstract: metadata.abstract || '',
    pdfUrl: metadata.pdfUrl || '',
    journal: metadata.journal || '',
    sourceUrl: metadata.sourceUrl || url,
    pubDate: metadata.pubDate || '',
    siteType: (metadata.siteType as any) || 'generic',
  };
}
