import type { PaperMetadata } from '@/messaging/types';

export const pubmedAdapter = {
  id: 'pubmed',
  match(url: string): boolean {
    return url.includes('pubmed.ncbi.nlm.nih.gov');
  },
  extract(doc: Document, baseMetadata: Partial<PaperMetadata>): Partial<PaperMetadata> {
    const meta: Partial<PaperMetadata> = {
      ...baseMetadata,
      siteType: 'pubmed',
    };

    const journalTrigger = doc.querySelector('.journal-actions-trigger');
    if (journalTrigger) {
      meta.journal = journalTrigger.textContent?.trim() || meta.journal || '';
    }

    const titleEl = doc.querySelector('.heading-title');
    if (titleEl) {
      meta.title = titleEl.textContent?.trim() || '';
    }

    // Authors
    const authorEls = doc.querySelectorAll('.authors-list-item .full-name');
    if (authorEls.length > 0) {
      meta.authors = Array.from(authorEls).map(el => el.textContent?.trim() || '').filter(Boolean);
    }

    // Abstract
    const abstractEl = doc.querySelector('#eng-abstract, .abstract-content');
    if (abstractEl) {
      meta.abstract = abstractEl.textContent?.replace(/\s+/g, ' ').trim() || '';
    }

    // DOI
    const doiEl = doc.querySelector('.citation-doi, .id-link[data-type="doi"]');
    if (doiEl && !meta.doi) {
      meta.doi = doiEl.textContent?.trim() || '';
    }

    return meta;
  }
};
