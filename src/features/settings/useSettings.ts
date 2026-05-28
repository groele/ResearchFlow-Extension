import { useState, useEffect, useCallback } from 'react';
import { db } from '@storage/dexie';
import { syncEngine } from '@storage/sync';
import { loadSettings, saveSettings, DEFAULT_SETTINGS, type ExtensionSettings, type AISettings, type WebDAVConfig, type GitHubConfig } from '@storage/settings';

export function useSettings() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const [webdavConfig, setWebdavConfig] = useState({ url: '', username: '', password: '' });
  const [githubConfig, setGithubConfig] = useState<GitHubConfig>({ token: '', repo: '', branch: 'main' });
  const [aiConfig, setAiConfig] = useState<AISettings>({ provider: 'openai', apiKey: '', endpoint: 'https://api.openai.com/v1', model: 'gpt-4o' });
  const [profileForm, setProfileForm] = useState({ displayName: '', affiliate: '', language: 'en' as 'en' | 'zh', motto: '' });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const data = await loadSettings();
        setSettings(data);
        if (data.syncProviders?.metadata?.provider === 'webdav') {
          setWebdavConfig(data.syncProviders.metadata.config as WebDAVConfig);
        }
        if (data.syncProviders?.metadata?.provider === 'github') {
          setGithubConfig(data.syncProviders.metadata.config as GitHubConfig);
        }
        if (data.ai) setAiConfig(data.ai);
        if (data.profile) {
          setProfileForm({
            displayName: data.profile.displayName || '',
            affiliate: data.profile.affiliation || '',
            language: data.profile.language || 'en',
            motto: data.profile.motto || '',
          });
        }
      } catch (e: unknown) {
        console.error('Failed to load settings:', e);
      }
    }
    fetchSettings();
  }, []);

  const handleSaveSettings = useCallback(async () => {
    try {
      const newSettings: Partial<ExtensionSettings> = {
        profile: {
          ...settings.profile,
          displayName: profileForm.displayName,
          affiliation: profileForm.affiliate,
          language: profileForm.language,
          motto: profileForm.motto,
        },
        ai: aiConfig,
        syncProviders: {
          metadata: {
            provider: (settings.syncProviders?.metadata?.provider || 'local') as 'local' | 'webdav' | 'github',
            config: settings.syncProviders?.metadata?.provider === 'webdav' ? webdavConfig :
                    settings.syncProviders?.metadata?.provider === 'github' ? githubConfig : {}
          },
          files: settings.syncProviders?.files || { provider: 'local', config: {} }
        }
      };
      await saveSettings(newSettings);
      setSettings({ ...settings, ...newSettings });
      return true;
    } catch (e: unknown) {
      console.error('Failed to save settings:', e);
      return false;
    }
  }, [settings, profileForm, aiConfig, webdavConfig, githubConfig]);

  const handleTestConnection = useCallback(async (provider: 'webdav' | 'github') => {
    try {
      const config = provider === 'webdav' ? webdavConfig : githubConfig;
      return await syncEngine.testConnection(provider, config);
    } catch (e: unknown) {
      console.error('Connection test failed:', e);
      return false;
    }
  }, [webdavConfig, githubConfig]);

  const handleManualSync = useCallback(async () => {
    setIsSyncing(true);
    setSyncStatus('Syncing...');
    try {
      const res = await syncEngine.syncDatabaseNow();
      setSyncStatus(res.success ? 'Sync completed' : `Sync failed: ${res.error}`);
    } catch (e: unknown) {
      setSyncStatus(`Sync error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const handleExportJson = useCallback(async () => {
    try {
      const data = {
        projects: await db.projects.toArray(),
        researchRecords: await db.researchRecords.toArray(),
        manuscripts: await db.manuscripts.toArray(),
        submissions: await db.submissions.toArray(),
        tasks: await db.tasks.toArray(),
        researchAreas: await db.researchAreas.toArray(),
        evidence: await db.evidence.toArray(),
        hypotheses: await db.hypotheses.toArray(),
        experiments: await db.experiments.toArray(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scholarflow_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      console.error('Failed to export data:', e);
    }
  }, []);

  const handleImportJson = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.projects) await db.projects.bulkPut(data.projects);
      if (data.researchRecords) await db.researchRecords.bulkPut(data.researchRecords);
      if (data.manuscripts) await db.manuscripts.bulkPut(data.manuscripts);
      if (data.submissions) await db.submissions.bulkPut(data.submissions);
      if (data.tasks) await db.tasks.bulkPut(data.tasks);
      if (data.researchAreas) await db.researchAreas.bulkPut(data.researchAreas);
      if (data.evidence) await db.evidence.bulkPut(data.evidence);
      if (data.hypotheses) await db.hypotheses.bulkPut(data.hypotheses);
      if (data.experiments) await db.experiments.bulkPut(data.experiments);
    } catch (e: unknown) {
      console.error('Failed to import data:', e);
      throw new Error('Invalid JSON file: ' + (e instanceof Error ? e.message : String(e)));
    }
  }, []);

  return {
    settings,
    setSettings,
    isSyncing,
    syncStatus,
    webdavConfig, setWebdavConfig,
    githubConfig, setGithubConfig,
    aiConfig, setAiConfig,
    profileForm, setProfileForm,
    handleSaveSettings,
    handleTestConnection,
    handleManualSync,
    handleExportJson,
    handleImportJson,
  };
}
