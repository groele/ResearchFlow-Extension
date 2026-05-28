import type { PaperMetadata } from '@/messaging/types';

export const biorxivAdapter = {
  id: 'biorxiv',
  match(url: string): boolean {
    return url.includes('biorxiv.org') || url.includes('medrxiv.org');
  },
  extract(doc: Document, baseMetadata: Partial<PaperMetadata>): Partial<PaperMetadata> {
    const meta: Partial<PaperMetadata> = {
      ...baseMetadata,
      siteType: 'biorxiv',
      journal: doc.location.href.includes('medrxiv.org') ? 'medRxiv' : 'bioRxiv',
    };

    // Abstract element fallback
    const absEl = doc.querySelector('.section.abstract p, #abstract p');
    if (absEl && !meta.abstract) {
      meta.abstract = absEl.textContent || '';
    }

    return meta;
  }
};
