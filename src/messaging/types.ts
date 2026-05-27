export interface PaperMetadata {
  title: string;
  doi: string;
  authors: string[];
  abstract: string;
  pdfUrl: string;
  journal: string;
  sourceUrl: string;
  pubDate: string;
  siteType: 'generic' | 'arxiv' | 'biorxiv' | 'pubmed' | 'scholar' | 'overleaf';
}

export type ExtensionRequest =
  | { action: 'SCRAPE_PAGE' }
  | { action: 'TRIGGER_SYNC' }
  | { action: 'DATABASE_UPDATED' }
  | { action: 'SETTINGS_UPDATED'; settings: any };

export interface ScrapePageResponse {
  metadata: PaperMetadata;
}

export interface SyncResponse {
  success: boolean;
  message?: string;
  error?: string;
}
