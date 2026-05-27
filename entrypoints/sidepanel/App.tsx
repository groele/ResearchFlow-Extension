import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../src/storage/dexie';
import { aiCopilot } from '../../src/core/ai';
import { useLang } from '../../src/i18n';
import { Button } from '../../src/ui/components/primitives/Button';
import { ToastProvider, useToast } from '../../src/ui/components/primitives/Toast';
import { ErrorBoundary } from '../../src/ui/components/primitives/ErrorBoundary';
import { CaptureTab } from './CaptureTab';
import { CopilotTab } from './CopilotTab';
import { TasksTab } from './TasksTab';
import { FileText, Bot, CheckSquare, Settings } from 'lucide-react';
import './style.css';

type TabId = 'capture' | 'copilot' | 'tasks';

function SidepanelContent() {
  const { t } = useLang();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>('capture');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaAbstract, setMetaAbstract] = useState('');

  const projects = useLiveQuery(() => db.projects.toArray()) ?? [];

  const handleAiExtraction = async (title: string, abstract: string, url: string) => {
    setMetaTitle(title);
    setMetaAbstract(abstract);
    try {
      const prompt = `Title: ${title}\nAbstract: ${abstract}\nURL: ${url}`;
      const sys = `Extract key parameters as JSON: {"breakthrough":"...","equations":"...","datasets":"...","limitations":"..."}`;
      await aiCopilot.generateCompletion(prompt, sys, true);
    } catch {}
  };

  const tabs = [
    { id: 'capture' as TabId, label: t('sidepanel.capture'), icon: <FileText size={13} /> },
    { id: 'copilot' as TabId, label: t('sidepanel.copilot'), icon: <Bot size={13} /> },
    { id: 'tasks' as TabId, label: t('sidepanel.tasks'), icon: <CheckSquare size={13} /> },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <span className="text-2xs font-bold text-white">SF</span>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100">ScholarFlow</h3>
            <span className="text-3xs text-slate-500 uppercase tracking-wider">{t('sidebar.researchOS')}</span>
          </div>
        </div>
        <Button variant="ghost" size="xs" onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('options.html') })} leftIcon={<Settings size={12} />}>
          {t('sidepanel.dashboard')}
        </Button>
      </div>

      {/* Project Context */}
      <div className="px-3 py-2 bg-slate-900/50 border-b border-slate-800 flex items-center gap-2 shrink-0">
        <span className="text-3xs text-slate-400 font-medium uppercase shrink-0">{t('sidepanel.context')}</span>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 text-2xs text-slate-200 font-medium py-1 px-1.5 rounded focus:outline-none focus:border-primary-500 transition cursor-pointer"
        >
          <option value="">{t('sidepanel.noProject')}</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex shrink-0 bg-slate-900 border-b border-slate-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-2xs font-semibold border-b-2 tracking-wide uppercase transition ${
              activeTab === tab.id ? 'border-primary-500 text-primary-400 bg-slate-950/40' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'capture' && (
          <CaptureTab selectedProjectId={selectedProjectId} onAiExtraction={handleAiExtraction} />
        )}
        {activeTab === 'copilot' && (
          <CopilotTab metaTitle={metaTitle} metaAbstract={metaAbstract} />
        )}
        {activeTab === 'tasks' && (
          <TasksTab selectedProjectId={selectedProjectId} />
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <SidepanelContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
