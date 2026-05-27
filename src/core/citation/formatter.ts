export type CitationFormat = 'apa7' | 'mla9' | 'chicago' | 'gb7714' | 'bibtex';

export interface CitationData {
  title: string;
  authors: string;
  year: string;
  journal: string;
  volume?: string;
  number?: string;
  pages?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  publisher?: string;
  booktitle?: string;
  entryType?: string;
}

function parseAuthorList(authors: string): string[] {
  return authors
    .split(/;|,?\s+and\s+/i)
    .map(a => a.trim())
    .filter(Boolean);
}

function formatAuthorAPA(author: string): string {
  const parts = author.split(',').map(s => s.trim());
  if (parts.length >= 2) {
    const last = parts[0];
    const initials = parts.slice(1).map(n => n.charAt(0).toUpperCase() + '.').join(' ');
    return `${last}, ${initials}`;
  }
  const words = author.split(/\s+/);
  if (words.length >= 2) {
    const last = words[words.length - 1];
    const initials = words.slice(0, -1).map(n => n.charAt(0).toUpperCase() + '.').join(' ');
    return `${last}, ${initials}`;
  }
  return author;
}

function formatAuthorMLA(author: string): string {
  const parts = author.split(',').map(s => s.trim());
  if (parts.length >= 2) {
    return `${parts[0]}, ${parts.slice(1).join(' ')}`;
  }
  const words = author.split(/\s+/);
  if (words.length >= 2) {
    return `${words[words.length - 1]}, ${words.slice(0, -1).join(' ')}`;
  }
  return author;
}

export function formatCitation(data: CitationData, format: CitationFormat): string {
  switch (format) {
    case 'apa7':
      return formatAPA7(data);
    case 'mla9':
      return formatMLA9(data);
    case 'chicago':
      return formatChicago(data);
    case 'gb7714':
      return formatGB7714(data);
    case 'bibtex':
      return formatBibTeXInline(data);
    default:
      return formatAPA7(data);
  }
}

function formatAPA7(d: CitationData): string {
  const authors = parseAuthorList(d.authors);
  let authorStr: string;
  if (authors.length === 0) {
    authorStr = 'Unknown Author';
  } else if (authors.length === 1) {
    authorStr = formatAuthorAPA(authors[0]);
  } else if (authors.length === 2) {
    authorStr = `${formatAuthorAPA(authors[0])}, & ${formatAuthorAPA(authors[1])}`;
  } else if (authors.length <= 20) {
    const formatted = authors.map(formatAuthorAPA);
    authorStr = formatted.slice(0, -1).join(', ') + ', & ' + formatted[formatted.length - 1];
  } else {
    const formatted = authors.slice(0, 19).map(formatAuthorAPA);
    authorStr = formatted.join(', ') + ', ... ' + formatAuthorAPA(authors[authors.length - 1]);
  }

  const parts = [`${authorStr} (${d.year || 'n.d.'}). ${d.title}.`];
  if (d.journal) {
    let journalRef = ` *${d.journal}*`;
    if (d.volume) journalRef += `, *${d.volume}*`;
    if (d.number) journalRef += `(${d.number})`;
    if (d.pages) journalRef += `, ${d.pages}`;
    parts.push(journalRef + '.');
  }
  if (d.doi) parts.push(` https://doi.org/${d.doi}`);
  else if (d.url) parts.push(` ${d.url}`);
  return parts.join('');
}

function formatMLA9(d: CitationData): string {
  const authors = parseAuthorList(d.authors);
  let authorStr: string;
  if (authors.length === 0) {
    authorStr = 'Unknown Author';
  } else if (authors.length === 1) {
    authorStr = formatAuthorMLA(authors[0]);
  } else if (authors.length === 2) {
    authorStr = `${formatAuthorMLA(authors[0])}, and ${formatAuthorMLA(authors[1])}`;
  } else {
    authorStr = `${formatAuthorMLA(authors[0])}, et al.`;
  }

  const parts = [`${authorStr}. "${d.title}."`];
  if (d.journal) {
    let journalRef = ` *${d.journal}*`;
    if (d.volume) journalRef += `, vol. ${d.volume}`;
    if (d.number) journalRef += `, no. ${d.number}`;
    if (d.year) journalRef += `, ${d.year}`;
    if (d.pages) journalRef += `, pp. ${d.pages}`;
    parts.push(journalRef + '.');
  }
  if (d.doi) parts.push(` DOI: ${d.doi}.`);
  return parts.join('');
}

function formatChicago(d: CitationData): string {
  const authors = parseAuthorList(d.authors);
  let authorStr: string;
  if (authors.length === 0) {
    authorStr = 'Unknown Author';
  } else if (authors.length === 1) {
    authorStr = authors[0];
  } else if (authors.length === 2) {
    authorStr = `${authors[0]} and ${authors[1]}`;
  } else if (authors.length === 3) {
    authorStr = `${authors[0]}, ${authors[1]}, and ${authors[2]}`;
  } else {
    authorStr = `${authors[0]}, et al.`;
  }

  const parts = [`${authorStr}. "${d.title}."`];
  if (d.journal) {
    let journalRef = ` *${d.journal}*`;
    if (d.volume) journalRef += ` ${d.volume}`;
    if (d.number) journalRef += `, no. ${d.number}`;
    if (d.year) journalRef += ` (${d.year})`;
    if (d.pages) journalRef += `: ${d.pages}`;
    parts.push(journalRef + '.');
  }
  if (d.doi) parts.push(` https://doi.org/${d.doi}.`);
  return parts.join('');
}

function formatGB7714(d: CitationData): string {
  const authors = parseAuthorList(d.authors);
  let authorStr: string;
  if (authors.length === 0) {
    authorStr = '佚名';
  } else if (authors.length <= 3) {
    authorStr = authors.join(', ');
  } else {
    authorStr = authors.slice(0, 3).join(', ') + ', 等';
  }

  const parts = [`${authorStr}. ${d.title}[J].`];
  if (d.journal) {
    let journalRef = ` ${d.journal}`;
    if (d.year) journalRef += `, ${d.year}`;
    if (d.volume) journalRef += `, ${d.volume}`;
    if (d.number) journalRef += `(${d.number})`;
    if (d.pages) journalRef += `: ${d.pages}`;
    parts.push(journalRef + '.');
  }
  return parts.join('');
}

function formatBibTeXInline(d: CitationData): string {
  const firstAuthor = parseAuthorList(d.authors)[0]?.split(',')[0]?.trim().toLowerCase() || 'unknown';
  const year = d.year || 'nd';
  return `@article{${firstAuthor}${year},\n  title = {${d.title}},\n  author = {${d.authors}},\n  year = {${d.year}},\n  journal = {${d.journal}}\n}`;
}

export function formatCitationsBatch(data: CitationData[], format: CitationFormat): string {
  return data.map(d => formatCitation(d, format)).join('\n\n');
}
