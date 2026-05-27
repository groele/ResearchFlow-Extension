import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../src/storage/dexie';
import { generateId } from '../../src/storage/id';
import { Button } from '../../src/ui/components/primitives/Button';
import { Input } from '../../src/ui/components/primitives/Input';
import { Textarea } from '../../src/ui/components/primitives/Textarea';
import { Select } from '../../src/ui/components/primitives/Select';
import { Badge } from '../../src/ui/components/primitives/Badge';
import { ToastProvider, useToast } from '../../src/ui/components/primitives/Toast';
import { ErrorBoundary } from '../../src/ui/components/primitives/ErrorBoundary';
import { Layout, PanelLeftOpen, Plus, Check, FileText, FolderOpen } from 'lucide-react';
import './style.css';

function PopupContent() {
  const projectCount = useLiveQuery(() => db.projects.filter(p => p.status === 'active' || p.status === 'planning').count()) ?? 0;
  const recordCount = useLiveQuery(() => db.researchRecords.count()) ?? 0;
  const projects = useLiveQuery(() => db.projects.toArray()) ?? [];
  const { toast } = useToast();

  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteDoi, setNoteDoi] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [detectedDoi, setDetectedDoi] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function detect() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) {
          const doiRegex = /(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i;
          const match = tab.url.match(doiRegex) || (tab.title || '').match(doiRegex);
          if (match) {
            const doi = match[1].replace(/[.,;)]+$/, '');
            setDetectedDoi(doi);
            setNoteDoi(doi);
            const cleanTitle = (tab.title || '')
              .replace(/^(arXiv|PubMed|bioRxiv|Nature|Science|IEEE|Springer|Wiley|ACS)\s*(:|：|-)\s*/i, '')
              .replace(/\s*\|\s*.*$/g, '')
              .replace(/\s*-\s*PubMed$/i, '')
              .trim();
            setNoteTitle(cleanTitle);
          }
        }
      } catch {}
    }
    detect();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) {
      toast('error', 'Please enter a title');
      return;
    }
    setIsSaving(true);
    try {
      let finalProjectId = selectedProjectId;
      if (isCreatingProject) {
        if (!newProjectTitle.trim()) {
          toast('error', 'Enter a project name');
          setIsSaving(false);
          return;
        }
        const id = generateId('proj');
        await db.projects.put({
          id, userId: 'user', title: newProjectTitle.trim(),
          discipline: 'General Science', hypothesis: '', abstract: '',
          status: 'active', areaId: null,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        });
        finalProjectId = id;
        setIsCreatingProject(false);
        setNewProjectTitle('');
        setSelectedProjectId(id);
      }

      const isLit = !!noteDoi.trim();
      await db.researchRecords.put({
        id: generateId('rec'), userId: 'user',
        projectId: finalProjectId || 'proj_general',
        schemaTemplateId: null, title: noteTitle.trim(),
        recordType: isLit ? 'literature_review' : 'other',
        methodology: '', recordedDate: new Date().toISOString(),
        attributes: noteDoi.trim() ? { doi: noteDoi.trim() } : {},
        dataPath: '', externalRef: noteDoi.trim() || null,
        summary: noteContent.trim(),
        tags: isLit ? ['quick-capture', 'literature'] : ['quick-capture'],
        readingStatus: 'unread',
        starred: false,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      });

      chrome.runtime.sendMessage({ action: 'DATABASE_UPDATED' }).catch(() => {});
      setNoteTitle(''); setNoteContent(''); setNoteDoi(''); setDetectedDoi('');
      toast('success', 'Record captured!');
    } catch (err: any) {
      toast('error', 'Save failed: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const openDashboard = () => chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
  const toggleSidePanel = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && chrome.sidePanel?.open) {
      await chrome.sidePanel.open({ windowId: tab.windowId });
      window.close();
    }
  };

  return (
    <div className="w-[360px] bg-slate-950 text-slate-100 p-4 border border-slate-800 rounded-xl shadow-2xl font-sans select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <span className="text-sm font-bold text-white">SF</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 font-display">ScholarFlow</h2>
            <span className="text-3xs text-slate-500 uppercase tracking-wider">Quick Capture</span>
          </div>
        </div>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="xs" onClick={toggleSidePanel} leftIcon={<PanelLeftOpen size={12} />}>
            Panel
          </Button>
          <Button variant="primary" size="xs" onClick={openDashboard} leftIcon={<Layout size={12} />}>
            Dashboard
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="h-8 w-8 rounded-md bg-primary-950 flex items-center justify-center text-primary-400 border border-primary-800">
            <FolderOpen size={14} />
          </div>
          <div>
            <p className="text-3xs text-slate-400 uppercase tracking-wider font-medium">Projects</p>
            <p className="text-base font-semibold text-slate-100 leading-tight">{projectCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="h-8 w-8 rounded-md bg-info-950 flex items-center justify-center text-info-400 border border-info-600/30">
            <FileText size={14} />
          </div>
          <div>
            <p className="text-3xs text-slate-400 uppercase tracking-wider font-medium">Records</p>
            <p className="text-base font-semibold text-slate-100 leading-tight">{recordCount}</p>
          </div>
        </div>
      </div>

      {/* DOI Detection */}
      {detectedDoi && (
        <div className="flex items-center gap-2 p-2.5 mb-4 rounded-lg bg-primary-950/40 border border-primary-800/30 animate-pulse">
          <Check size={14} className="text-primary-400 flex-shrink-0" />
          <div className="text-2xs text-primary-200">
            <span className="font-semibold text-primary-300 block">Paper Detected</span>
            <span className="font-mono">{detectedDoi}</span>
          </div>
        </div>
      )}

      {/* Capture Form */}
      <form onSubmit={handleSave} className="space-y-3">
        <Input
          label="Title"
          value={noteTitle}
          onChange={(e) => setNoteTitle(e.target.value)}
          placeholder="Paper title or note..."
          required
        />
        <Input
          label="DOI"
          value={noteDoi}
          onChange={(e) => setNoteDoi(e.target.value)}
          placeholder="10.xxxx/xxxxx"
          className="font-mono"
        />

        {/* Project Selector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-2xs font-semibold uppercase tracking-wider text-slate-400">Project</label>
            <button
              type="button"
              onClick={() => setIsCreatingProject(!isCreatingProject)}
              className="text-2xs text-primary-400 hover:text-primary-300 font-medium flex items-center gap-0.5"
            >
              {isCreatingProject ? 'Cancel' : <><Plus size={10} /> New</>}
            </button>
          </div>
          {isCreatingProject ? (
            <Input
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              placeholder="New project name..."
              autoFocus
            />
          ) : (
            <Select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              options={[
                { value: '', label: '-- Uncategorized --' },
                ...projects.map(p => ({ value: p.id, label: p.title }))
              ]}
            />
          )}
        </div>

        <Textarea
          label="Notes"
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder="Key findings, methodology, parameters..."
          className="min-h-[60px] max-h-[120px]"
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          isLoading={isSaving}
        >
          Save Record
        </Button>
      </form>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <PopupContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
