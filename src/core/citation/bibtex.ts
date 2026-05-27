export interface BibTeXEntry {
  key: string;
  type: string;
  fields: Record<string, string>;
}

const FIELD_MAP: Record<string, string> = {
  title: 'title',
  author: 'authors',
  year: 'year',
  journal: 'journal',
  booktitle: 'booktitle',
  volume: 'volume',
  number: 'number',
  pages: 'pages',
  publisher: 'publisher',
  doi: 'doi',
  url: 'url',
  abstract: 'abstract',
  keywords: 'keywords',
  isbn: 'isbn',
  issn: 'issn',
  editor: 'editor',
  edition: 'edition',
  chapter: 'chapter',
  institution: 'institution',
  organization: 'organization',
  school: 'school',
  address: 'address',
  note: 'note',
};

export function parseBibTeX(input: string): BibTeXEntry[] {
  const entries: BibTeXEntry[] = [];
  const regex = /@(\w+)\s*\{([^,]*),\s*([\s\S]*?)\n\s*\}/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    const type = match[1].toLowerCase();
    const key = match[2].trim();
    const body = match[3];

    const fields: Record<string, string> = {};
    const fieldRegex = /(\w+)\s*=\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g;
    let fieldMatch: RegExpExecArray | null;

    while ((fieldMatch = fieldRegex.exec(body)) !== null) {
      const name = fieldMatch[1].toLowerCase();
      const value = fieldMatch[2].trim().replace(/\s+/g, ' ');
      const mapped = FIELD_MAP[name] || name;
      fields[mapped] = value;
    }

    entries.push({ key, type, fields });
  }

  return entries;
}

export function generateBibTeX(entries: BibTeXEntry[]): string {
  return entries.map(entry => {
    const fieldLines = Object.entries(entry.fields)
      .filter(([, v]) => v)
      .map(([k, v]) => `  ${k} = {${v}}`)
      .join(',\n');
    return `@${entry.type}{${entry.key},\n${fieldLines}\n}`;
  }).join('\n\n');
}

export function entryToRecord(entry: BibTeXEntry) {
  const f = entry.fields;
  return {
    title: f.title || '',
    authors: f.authors || '',
    year: f.year || '',
    journal: f.journal || f.booktitle || '',
    doi: f.doi || '',
    url: f.url || '',
    abstract: f.abstract || '',
    keywords: f.keywords ? f.keywords.split(/[,;]/).map(k => k.trim()) : [],
    volume: f.volume || '',
    number: f.number || '',
    pages: f.pages || '',
    publisher: f.publisher || '',
    bibtexKey: entry.key,
    entryType: entry.type,
  };
}

export function recordToBibTeX(key: string, type: string, record: {
  title?: string;
  authors?: string;
  year?: string;
  journal?: string;
  doi?: string;
  url?: string;
  abstract?: string;
}): BibTeXEntry {
  const fields: Record<string, string> = {};
  if (record.title) fields.title = record.title;
  if (record.authors) fields.author = record.authors;
  if (record.year) fields.year = record.year;
  if (record.journal) fields.journal = record.journal;
  if (record.doi) fields.doi = record.doi;
  if (record.url) fields.url = record.url;
  if (record.abstract) fields.abstract = record.abstract;
  return { key, type, fields };
}
