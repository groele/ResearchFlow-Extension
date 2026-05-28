import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@components/primitives/Card';
import { Badge } from '@components/primitives/Badge';
import { Input } from '@components/primitives/Input';
import {
  ExternalLink, Search, BookOpen, FlaskConical, Database,
  Globe, GraduationCap, FileText, Microscope, Atom, Heart,
  Cpu, Leaf, Landmark, Beaker,
} from 'lucide-react';
import { useLang, type TranslationKey } from '@/i18n';

// --- Types ---
interface JournalLink {
  id: string;
  name: string;
  url: string;
  category: 'journal' | 'preprint' | 'database' | 'tool' | 'publisher';
  icon: React.ReactNode;
  color: string;
  descriptionKey: TranslationKey;
  tags: string[];
}

// --- Data ---
const journalLinks: JournalLink[] = [
  // Major Publishers
  {
    id: 'nature',
    name: 'Nature',
    url: 'https://www.nature.com',
    category: 'publisher',
    icon: <Atom size={16} />,
    color: '#c9184a',
    descriptionKey: 'journals.natureDesc',
    tags: ['multidisciplinary', 'top'],
  },
  {
    id: 'science',
    name: 'Science',
    url: 'https://www.science.org',
    category: 'publisher',
    icon: <FlaskConical size={16} />,
    color: '#2563eb',
    descriptionKey: 'journals.scienceDesc',
    tags: ['multidisciplinary', 'top'],
  },
  {
    id: 'cell',
    name: 'Cell',
    url: 'https://www.cell.com',
    category: 'publisher',
    icon: <Microscope size={16} />,
    color: '#dc2626',
    descriptionKey: 'journals.cellDesc',
    tags: ['biology', 'life-science'],
  },
  {
    id: 'acs',
    name: 'ACS Publications',
    url: 'https://pubs.acs.org',
    category: 'publisher',
    icon: <Beaker size={16} />,
    color: '#059669',
    descriptionKey: 'journals.acsDesc',
    tags: ['chemistry', 'materials'],
  },
  {
    id: 'rsc',
    name: 'RSC Publishing',
    url: 'https://pubs.rsc.org',
    category: 'publisher',
    icon: <FlaskConical size={16} />,
    color: '#7c3aed',
    descriptionKey: 'journals.rscDesc',
    tags: ['chemistry', 'materials'],
  },
  {
    id: 'wiley',
    name: 'Wiley Online Library',
    url: 'https://onlinelibrary.wiley.com',
    category: 'publisher',
    icon: <BookOpen size={16} />,
    color: '#0891b2',
    descriptionKey: 'journals.wileyDesc',
    tags: ['multidisciplinary'],
  },
  {
    id: 'elsevier',
    name: 'Elsevier (ScienceDirect)',
    url: 'https://www.sciencedirect.com',
    category: 'publisher',
    icon: <Database size={16} />,
    color: '#f97316',
    descriptionKey: 'journals.elsevierDesc',
    tags: ['multidisciplinary'],
  },
  {
    id: 'springer',
    name: 'Springer Nature',
    url: 'https://link.springer.com',
    category: 'publisher',
    icon: <Globe size={16} />,
    color: '#0d9488',
    descriptionKey: 'journals.springerDesc',
    tags: ['multidisciplinary'],
  },
  {
    id: 'ieee',
    name: 'IEEE Xplore',
    url: 'https://ieeexplore.ieee.org',
    category: 'publisher',
    icon: <Cpu size={16} />,
    color: '#1d4ed8',
    descriptionKey: 'journals.ieeeDesc',
    tags: ['engineering', 'electronics', 'cs'],
  },
  {
    id: 'aps',
    name: 'APS Physics (PRL/PRB)',
    url: 'https://journals.aps.org',
    category: 'publisher',
    icon: <Atom size={16} />,
    color: '#1e40af',
    descriptionKey: 'journals.apsDesc',
    tags: ['physics'],
  },
  {
    id: 'iop',
    name: 'IOP Publishing',
    url: 'https://iopscience.iop.org',
    category: 'publisher',
    icon: <Atom size={16} />,
    color: '#0369a1',
    descriptionKey: 'journals.iopDesc',
    tags: ['physics', 'materials'],
  },
  {
    id: 'mdpi',
    name: 'MDPI',
    url: 'https://www.mdpi.com',
    category: 'publisher',
    icon: <FileText size={16} />,
    color: '#2563eb',
    descriptionKey: 'journals.mdpiDesc',
    tags: ['open-access', 'multidisciplinary'],
  },

  // Preprint Servers
  {
    id: 'arxiv',
    name: 'arXiv',
    url: 'https://arxiv.org',
    category: 'preprint',
    icon: <FileText size={16} />,
    color: '#b45309',
    descriptionKey: 'journals.arxivDesc',
    tags: ['physics', 'cs', 'math', 'preprint'],
  },
  {
    id: 'biorxiv',
    name: 'bioRxiv',
    url: 'https://www.biorxiv.org',
    category: 'preprint',
    icon: <Heart size={16} />,
    color: '#16a34a',
    descriptionKey: 'journals.biorxivDesc',
    tags: ['biology', 'preprint'],
  },
  {
    id: 'medrxiv',
    name: 'medRxiv',
    url: 'https://www.medrxiv.org',
    category: 'preprint',
    icon: <Heart size={16} />,
    color: '#dc2626',
    descriptionKey: 'journals.medrxivDesc',
    tags: ['medical', 'preprint'],
  },
  {
    id: 'chemrxiv',
    name: 'ChemRxiv',
    url: 'https://chemrxiv.org',
    category: 'preprint',
    icon: <Beaker size={16} />,
    color: '#059669',
    descriptionKey: 'journals.chemrxivDesc',
    tags: ['chemistry', 'preprint'],
  },

  // Citation Databases
  {
    id: 'google-scholar',
    name: 'Google Scholar',
    url: 'https://scholar.google.com',
    category: 'database',
    icon: <GraduationCap size={16} />,
    color: '#2563eb',
    descriptionKey: 'journals.googleScholarDesc',
    tags: ['search', 'citations'],
  },
  {
    id: 'web-of-science',
    name: 'Web of Science',
    url: 'https://www.webofscience.com',
    category: 'database',
    icon: <Database size={16} />,
    color: '#f59e0b',
    descriptionKey: 'journals.wosDesc',
    tags: ['citations', 'impact-factor'],
  },
  {
    id: 'scopus',
    name: 'Scopus',
    url: 'https://www.scopus.com',
    category: 'database',
    icon: <Database size={16} />,
    color: '#e65100',
    descriptionKey: 'journals.scopusDesc',
    tags: ['citations', 'metrics'],
  },
  {
    id: 'pubmed',
    name: 'PubMed',
    url: 'https://pubmed.ncbi.nlm.nih.gov',
    category: 'database',
    icon: <Microscope size={16} />,
    color: '#16a34a',
    descriptionKey: 'journals.pubmedDesc',
    tags: ['biomedical', 'search'],
  },
  {
    id: 'cnki',
    name: 'CNKI (知网)',
    url: 'https://www.cnki.net',
    category: 'database',
    icon: <BookOpen size={16} />,
    color: '#dc2626',
    descriptionKey: 'journals.cnkiDesc',
    tags: ['chinese', 'database'],
  },

  // Research Tools
  {
    id: 'orcid',
    name: 'ORCID',
    url: 'https://orcid.org',
    category: 'tool',
    icon: <Landmark size={16} />,
    color: '#a6ce39',
    descriptionKey: 'journals.orcidDesc',
    tags: ['identity', 'profile'],
  },
  {
    id: 'researchgate',
    name: 'ResearchGate',
    url: 'https://www.researchgate.net',
    category: 'tool',
    icon: <Globe size={16} />,
    color: '#00d0af',
    descriptionKey: 'journals.researchgateDesc',
    tags: ['network', 'sharing'],
  },
  {
    id: 'doi',
    name: 'DOI Resolver',
    url: 'https://doi.org',
    category: 'tool',
    icon: <ExternalLink size={16} />,
    color: '#059669',
    descriptionKey: 'journals.doiDesc',
    tags: ['doi', 'resolver'],
  },
  {
    id: 'overleaf',
    name: 'Overleaf',
    url: 'https://www.overleaf.com',
    category: 'tool',
    icon: <FileText size={16} />,
    color: '#468b43',
    descriptionKey: 'journals.overleafDesc',
    tags: ['latex', 'writing'],
  },
  {
    id: 'semantic-scholar',
    name: 'Semantic Scholar',
    url: 'https://www.semanticscholar.org',
    category: 'tool',
    icon: <Search size={16} />,
    color: '#f59e0b',
    descriptionKey: 'journals.semanticScholarDesc',
    tags: ['ai', 'search', 'citations'],
  },
];

// --- Category config ---
const categories = [
  { id: 'publisher', labelKey: 'journals.catPublishers' as TranslationKey, icon: <BookOpen size={12} /> },
  { id: 'preprint', labelKey: 'journals.catPreprints' as TranslationKey, icon: <FileText size={12} /> },
  { id: 'database', labelKey: 'journals.catDatabases' as TranslationKey, icon: <Database size={12} /> },
  { id: 'tool', labelKey: 'journals.catTools' as TranslationKey, icon: <Globe size={12} /> },
];

// --- Component ---
export function JournalDashboard() {
  const { t } = useLang();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = journalLinks;
    if (activeCategory) {
      items = items.filter(j => j.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(j =>
        j.name.toLowerCase().includes(q) ||
        j.tags.some(tag => tag.includes(q)) ||
        t(j.descriptionKey).toLowerCase().includes(q)
      );
    }
    return items;
  }, [search, activeCategory, t]);

  const grouped = useMemo(() => {
    const groups: Record<string, JournalLink[]> = {};
    for (const item of filtered) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [filtered]);

  return (
    <Card variant="solid" padding="md">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <CardTitle className="flex items-center gap-2">
            <BookOpen size={16} className="text-primary-400" />
            {t('journals.title')}
          </CardTitle>
          <div className="w-48">
            <Input
              placeholder={t('journals.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={13} />}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-2.5 py-1 rounded-lg text-2xs font-medium transition ${
              activeCategory === null
                ? 'bg-primary-600/20 text-primary-400 border border-primary-600/30'
                : 'text-slate-500 hover:text-slate-300 border border-slate-800'
            }`}
          >
            {t('common.all')} ({journalLinks.length})
          </button>
          {categories.map(cat => {
            const count = journalLinks.filter(j => j.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-2xs font-medium transition ${
                  activeCategory === cat.id
                    ? 'bg-primary-600/20 text-primary-400 border border-primary-600/30'
                    : 'text-slate-500 hover:text-slate-300 border border-slate-800'
                }`}
              >
                {cat.icon} {t(cat.labelKey)} ({count})
              </button>
            );
          })}
        </div>

        {/* Journal links grid */}
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">{t('journals.noResults')}</p>
        ) : (
          <div className="space-y-4">
            {categories.map(cat => {
              const items = grouped[cat.id];
              if (!items || items.length === 0) return null;
              return (
                <div key={cat.id}>
                  <h4 className="text-3xs font-semibold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                    {cat.icon} {t(cat.labelKey)}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {items.map(journal => (
                      <a
                        key={journal.id}
                        href={journal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all duration-150"
                      >
                        <div
                          className="h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                          style={{ backgroundColor: journal.color + '20', color: journal.color }}
                        >
                          {journal.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                            {journal.name}
                          </p>
                          <p className="text-3xs text-slate-500 truncate">
                            {t(journal.descriptionKey)}
                          </p>
                        </div>
                        <ExternalLink size={11} className="text-slate-600 group-hover:text-slate-400 flex-shrink-0 transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tag cloud for quick filter */}
        {search && (
          <div className="mt-3 pt-3 border-t border-slate-800">
            <p className="text-3xs text-slate-500">
              {t('journals.showing')} {filtered.length} {t('journals.of')} {journalLinks.length}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
