export interface RISEntry {
  fields: Record<string, string[]>;
}

const RIS_FIELD_MAP: Record<string, string> = {
  TI: 'title',
  T1: 'title',
  AU: 'authors',
  A1: 'authors',
  PY: 'year',
  Y1: 'year',
  JO: 'journal',
  JA: 'journal',
  J2: 'journal',
  VL: 'volume',
  IS: 'number',
  SP: 'pagesStart',
  EP: 'pagesEnd',
  DO: 'doi',
  UR: 'url',
  AB: 'abstract',
  KW: 'keywords',
  PB: 'publisher',
  SN: 'isbn',
  N1: 'notes',
  ER: '_end',
  TY: '_type',
};

export function parseRIS(input: string): RISEntry[] {
  const entries: RISEntry[] = [];
  let current: RISEntry | null = null;

  const lines = input.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^([A-Z][A-Z0-9])\s*-\s*(.*)/);
    if (!match) continue;

    const tag = match[1];
    const value = match[2].trim();

    if (tag === 'TY') {
      current = { fields: { _type: [value] } };
      continue;
    }

    if (!current) continue;

    if (tag === 'ER') {
      entries.push(current);
      current = null;
      continue;
    }

    const mapped = RIS_FIELD_MAP[tag] || tag.toLowerCase();
    if (!current.fields[mapped]) {
      current.fields[mapped] = [];
    }
    current.fields[mapped].push(value);
  }

  if (current) entries.push(current);
  return entries;
}

export function entryToRecord(entry: RISEntry) {
  const f = entry.fields;
  return {
    title: (f.title || []).join(' '),
    authors: (f.authors || []).join('; '),
    year: (f.year || f.year || [''])[0] || '',
    journal: (f.journal || [''])[0] || '',
    doi: (f.doi || [''])[0] || '',
    url: (f.url || [''])[0] || '',
    abstract: (f.abstract || []).join(' '),
    keywords: f.keywords || [],
    volume: (f.volume || [''])[0] || '',
    number: (f.number || [''])[0] || '',
    pages: [f.pagesStart, f.pagesEnd].filter(Boolean).join('-'),
    publisher: (f.publisher || [''])[0] || '',
    entryType: (f._type || ['JOUR'])[0],
    notes: (f.notes || []).join(' '),
  };
}

export function generateRIS(entries: RISEntry[]): string {
  return entries.map(entry => {
    const lines: string[] = [];
    const type = entry.fields._type?.[0] || 'JOUR';
    lines.push(`TY  - ${type}`);

    for (const [key, values] of Object.entries(entry.fields)) {
      if (key === '_type' || key === '_end') continue;
      for (const v of values) {
        const risTag = Object.entries(RIS_FIELD_MAP).find(([, m]) => m === key)?.[0] || key.toUpperCase();
        lines.push(`${risTag}  - ${v}`);
      }
    }

    lines.push('ER  -');
    return lines.join('\n');
  }).join('\n\n');
}
