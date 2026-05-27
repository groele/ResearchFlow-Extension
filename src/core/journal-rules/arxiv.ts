import type { PaperMetadata } from '../../messaging/types';

export const arxivAdapter = {
  id: 'arxiv',
  match(url: string): boolean {
    return url.includes('arxiv.org');
  },
  extract(doc: Document, baseMetadata: Partial<PaperMetadata>): Partial<PaperMetadata> {
    const meta: Partial<PaperMetadata> = {
      ...baseMetadata,
      siteType: 'arxiv',
      journal: 'arXiv',
    };

    // Extract Title
    const titleEl = doc.querySelector('h1.title');
    if (titleEl) {
      meta.title = titleEl.textContent?.replace(/^title:\s*/i, '').trim();
    }

    // Extract Authors
    const authorEls = doc.querySelectorAll('.authors a');
    if (authorEls.length > 0) {
      meta.authors = Array.from(authorEls).map(el => el.textContent?.trim() || '').filter(Boolean);
    }

    // Extract Abstract
    const abstractEl = doc.querySelector('blockquote.abstract');
    if (abstractEl) {
      meta.abstract = abstractEl.textContent?.replace(/^abstract:\s*/i, '').trim();
    }

    // Extract PDF URL
    const pdfLink = doc.querySelector('a.download-pdf, .extra-services .full-text a[href*="/pdf"]') as HTMLAnchorElement | null;
    if (pdfLink) {
      meta.pdfUrl = pdfLink.href;
    } else {
      // Construct default PDF URL
      const match = doc.location.href.match(/abs\/([^?#]+)/);
      if (match) {
        meta.pdfUrl = `https://arxiv.org/pdf/${match[1]}.pdf`;
      }
    }

    return meta;
  }
};
