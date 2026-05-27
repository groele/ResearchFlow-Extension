import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../src/storage/dexie';
import { loadSettings } from '../../src/storage/settings';
import { generateId } from '../../src/storage/id';
import { useLang } from '../../src/i18n';
import { Button } from '../../src/ui/components/primitives/Button';
import { Input } from '../../src/ui/components/primitives/Input';
import { Textarea } from '../../src/ui/components/primitives/Textarea';
import { Card } from '../../src/ui/components/primitives/Card';
import { IconButton } from '../../src/ui/components/primitives/IconButton';
import { useToast } from '../../src/ui/components/primitives/Toast';
import {
  RefreshCw, Sparkles, Copy, Check, FileSpreadsheet,
  ChevronDown, ChevronUp,
} from 'lucide-react';

interface CaptureTabProps {
  selectedProjectId: string;
  onAiExtraction: (title: string, abstract: string, url: string) => Promise<void>;
}

export function CaptureTab({ selectedProjectId, onAiExtraction }: CaptureTabProps) {
  const { t } = useLang();
  const { toast } = useToast();

  const [metaTitle, setMetaTitle] = useState('');
  const [metaDoi, setMetaDoi] = useState('');
  const [metaAuthors, setMetaAuthors] = useState('');
  const [metaAbstract, setMetaAbstract] = useState('');
  const [metaPdf, setMetaPdf] = useState('');
  const [showStructured, setShowStructured] = useState(false);
  const [metaBreakthrough, setMetaBreakthrough] = useState('');
  const [metaEquations, setMetaEquations] = useState('');
  const [metaDatasets, setMetaDatasets] = useState('');
  const [metaLimitations, setMetaLimitations] = useState('');
  const [citationStyle, setCitationStyle] = useState<'apa' | 'mla' | 'bibtex'>('apa');
  const [citationText, setCitationText] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => { compileCitation(); }, [metaTitle, metaAuthors, metaDoi, metaPdf, citationStyle]);

  const handleAutoCapture = () => {
    setTimeout(async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url && !tab.url.startsWith('chrome://')) triggerScraping(tab);
      } catch {}
    }, 400);
  };

  const triggerScraping = async (tab: chrome.tabs.Tab) => {
    if (isScanning) return;
    setIsScanning(true);
    try {
      chrome.tabs.sendMessage(tab.id!, { action: 'SCRAPE_PAGE' }, async (response) => {
        if (chrome.runtime.lastError || !response) {
          setMetaTitle(tab.title || '');
          setMetaPdf(tab.url || '');
          setMetaDoi(''); setMetaAuthors(''); setMetaAbstract('');
        } else {
          setMetaTitle(response.title || '');
          setMetaDoi(response.doi || '');
          setMetaAuthors(Array.isArray(response.authors) ? response.authors.join(', ') : '');
          setMetaAbstract(response.abstract || '');
          setMetaPdf(response.pdfUrl || response.sourceUrl || tab.url || '');
          toast('success', t('sidepanel.metadataCaptured'));
          const settings = await loadSettings();
          if (settings.ai?.apiKey && response.abstract) {
            onAiExtraction(response.title, response.abstract, tab.url || '');
          }
        }
        setIsScanning(false);
      });
    } catch { setIsScanning(false); }
  };

  const compileCitation = () => {
    if (!metaTitle.trim()) { setCitationText(''); return; }
    const authors = metaAuthors.split(',').map(a => a.trim()).filter(Boolean);
    const year = new Date().getFullYear();
    let c = '';
    if (citationStyle === 'apa') {
      const as = authors.length > 0 ? authors.map(a => { const p = a.split(' '); return `${p[p.length-1]}, ${p[0]?.[0]}.`; }).join(', ') : 'Anon.';
      c = `${as} (${year}). *${metaTitle}*. ${metaDoi ? 'https://doi.org/' + metaDoi : metaPdf}`;
    } else if (citationStyle === 'mla') {
      const as = authors.length > 2 ? authors[0] + ', et al.' : authors.length > 0 ? authors.join(' and ') : 'Anon.';
      c = `${as} "${metaTitle}." *Journal*, ${year}, ${metaDoi ? 'doi:' + metaDoi : metaPdf}.`;
    } else {
      const key = ((authors[0]?.split(' ').pop() || '') + year + metaTitle.split(' ')[0]).replace(/[^a-zA-Z0-9]/g, '');
      c = `@article{${key},\n  author = {${authors.join(' and ') || 'Anon'}},\n  title = {${metaTitle}},\n  year = {${year}},\n${metaDoi ? `  doi = {${metaDoi}},\n` : ''}  url = {${metaPdf}}\n}`;
    }
    setCitationText(c);
  };

  const handleCopyCitation = () => {
    if (citationText) navigator.clipboard.writeText(citationText).then(() => toast('success', t('common.copied'))).catch(() => toast('warning', 'Copy failed'));
  };

  const handleSaveRecord = async () => {
    if (!selectedProjectId) { toast('warning', t('sidepanel.selectProject')); return; }
    if (!metaTitle.trim()) { toast('error', t('sidepanel.titleRequired')); return; }
    try {
      await db.researchRecords.put({
        id: generateId('rec'), userId: 'user', projectId: selectedProjectId,
        schemaTemplateId: null, title: metaTitle.trim(), recordType: 'literature_review',
        methodology: 'Captured via sidepanel', recordedDate: new Date().toISOString(),
        attributes: { doi: metaDoi.trim(), authors: metaAuthors.split(',').map(a => a.trim()), pdfUrl: metaPdf.trim(),
          structuredNotes: { breakthrough: metaBreakthrough, equations: metaEquations, datasets: metaDatasets, limitations: metaLimitations }
        },
        dataPath: metaPdf.trim(), externalRef: metaDoi.trim(), summary: metaAbstract.trim(),
        tags: ['captured-literature'],
        readingStatus: 'unread',
        starred: false,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      });
      toast('success', t('sidepanel.recordSaved'));
      chrome.runtime.sendMessage({ action: 'DATABASE_UPDATED' }).catch(() => {});
    } catch { toast('error', t('sidepanel.saveFailed')); }
  };

  const handleSaveEvidence = async () => {
    if (!selectedProjectId) { toast('warning', t('sidepanel.selectProject')); return; }
    if (!metaTitle.trim()) { toast('error', t('sidepanel.titleRequired')); return; }
    try {
      await db.evidence.put({
        id: generateId('ev'), userId: 'user', projectId: selectedProjectId,
        title: metaTitle.trim(), description: `DOI: ${metaDoi}`, evidenceType: 'url',
        filePath: metaPdf.trim(), fileSize: 0,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      });
      toast('success', t('sidepanel.evidenceLinked'));
      chrome.runtime.sendMessage({ action: 'DATABASE_UPDATED' }).catch(() => {});
    } catch { toast('error', t('sidepanel.linkFailed')); }
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <Button
        variant="secondary"
        className="w-full"
        onClick={handleAutoCapture}
        isLoading={isScanning}
        leftIcon={<RefreshCw size={13} className={isScanning ? 'animate-spin' : ''} />}
      >
        {isScanning ? t('sidepanel.scanning') : t('sidepanel.capturePage')}
      </Button>

      <div className="space-y-3">
        <Input label={t('sidepanel.title')} value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder={t('sidepanel.titlePlaceholder')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('sidepanel.doi')} value={metaDoi} onChange={(e) => setMetaDoi(e.target.value)} placeholder="10.xxxx" className="font-mono text-2xs" />
          <Input label={t('sidepanel.pdfUrl')} value={metaPdf} onChange={(e) => setMetaPdf(e.target.value)} placeholder={t('sidepanel.urlPlaceholder')} className="font-mono text-2xs" />
        </div>
        <Input label={t('sidepanel.authors')} value={metaAuthors} onChange={(e) => setMetaAuthors(e.target.value)} placeholder={t('sidepanel.authorsPlaceholder')} />
        <Textarea label={t('sidepanel.abstract')} value={metaAbstract} onChange={(e) => setMetaAbstract(e.target.value)} placeholder={t('sidepanel.abstractPlaceholder')} />
      </div>

      <Card variant="default" padding="none">
        <button
          onClick={() => setShowStructured(!showStructured)}
          className="w-full px-3 py-2 flex items-center justify-between text-2xs font-semibold text-primary-400 hover:text-primary-300 transition"
        >
          <span className="flex items-center gap-1.5"><Sparkles size={12} /> {t('sidepanel.aiInsights')}</span>
          {showStructured ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showStructured && (
          <div className="p-3 border-t border-slate-800 space-y-2">
            <Input label={t('sidepanel.breakthrough')} value={metaBreakthrough} onChange={(e) => setMetaBreakthrough(e.target.value)} placeholder={t('sidepanel.breakthroughPlaceholder')} />
            <Input label={t('sidepanel.equations')} value={metaEquations} onChange={(e) => setMetaEquations(e.target.value)} placeholder={t('sidepanel.equationsPlaceholder')} />
            <div className="grid grid-cols-2 gap-2">
              <Input label={t('sidepanel.tools')} value={metaDatasets} onChange={(e) => setMetaDatasets(e.target.value)} placeholder={t('sidepanel.toolsPlaceholder')} />
              <Input label={t('sidepanel.limitations')} value={metaLimitations} onChange={(e) => setMetaLimitations(e.target.value)} placeholder={t('sidepanel.limitationsPlaceholder')} />
            </div>
          </div>
        )}
      </Card>

      {metaTitle && (
        <Card variant="default" padding="sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xs font-semibold text-slate-400 uppercase">{t('sidepanel.citation')}</span>
            <div className="flex items-center gap-2">
              <select value={citationStyle} onChange={(e) => setCitationStyle(e.target.value as any)} className="bg-slate-950 border border-slate-800 text-3xs text-slate-300 px-1 py-0.5 rounded">
                <option value="apa">APA</option>
                <option value="mla">MLA</option>
                <option value="bibtex">BibTeX</option>
              </select>
              <IconButton variant="ghost" size="xs" icon={<Copy size={11} />} aria-label={t('common.copy')} onClick={handleCopyCitation} />
            </div>
          </div>
          <pre className="text-3xs text-slate-300 font-mono whitespace-pre-wrap break-words bg-slate-950/60 p-2 rounded border border-slate-800/50">{citationText}</pre>
        </Card>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" size="sm" onClick={handleSaveEvidence} leftIcon={<FileSpreadsheet size={13} />}>{t('sidepanel.linkEvidence')}</Button>
        <Button variant="primary" className="flex-1" size="sm" onClick={handleSaveRecord} leftIcon={<Check size={13} />}>{t('sidepanel.logRecord')}</Button>
      </div>
    </div>
  );
}
