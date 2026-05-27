import type { PaperMetadata } from '../../messaging/types';

export const overleafAdapter = {
  id: 'overleaf',
  match(url: string): boolean {
    return url.includes('overleaf.com');
  },
  extract(doc: Document, baseMetadata: Partial<PaperMetadata>): Partial<PaperMetadata> {
    const meta: Partial<PaperMetadata> = {
      ...baseMetadata,
      siteType: 'overleaf',
    };

    const nameEl = doc.querySelector('.project-name, [data-testid="project-name"]');
    if (nameEl) {
      meta.title = nameEl.textContent?.trim() || '';
    }

    return meta;
  }
};
