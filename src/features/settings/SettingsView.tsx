import React, { useState } from 'react';
import { useSettings } from './useSettings';
import { useLang } from '@/i18n';
import { PageHeader } from '@components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@components/primitives/Card';
import { Button } from '@components/primitives/Button';
import { Input } from '@components/primitives/Input';
import { Select } from '@components/primitives/Select';
import { Badge } from '@components/primitives/Badge';
import { Tabs } from '@components/primitives/Tabs';
import { Settings, User, Cloud, Bot, Database, Check, AlertCircle } from 'lucide-react';

export function SettingsView() {
  const { t, lang, switchLang } = useLang();
  const {
    settings, setSettings,
    isSyncing, syncStatus,
    webdavConfig, setWebdavConfig,
    githubConfig, setGithubConfig,
    aiConfig, setAiConfig,
    profileForm, setProfileForm,
    handleSaveSettings, handleTestConnection, handleManualSync,
    handleExportJson, handleImportJson,
  } = useSettings();

  const [activeTab, setActiveTab] = useState('profile');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const onSave = async () => {
    const ok = await handleSaveSettings();
    setSaveStatus(ok ? t('settings.saved') : t('settings.saveFailed'));
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const tabs = [
    { id: 'profile', label: t('settings.profile'), icon: <User size={13} /> },
    { id: 'sync', label: t('settings.sync'), icon: <Cloud size={13} /> },
    { id: 'ai', label: t('settings.ai'), icon: <Bot size={13} /> },
    { id: 'backup', label: t('settings.data'), icon: <Database size={13} /> },
  ];

  return (
    <div>
      <PageHeader
        title={t('settings.title')}
        description={t('settings.description')}
        icon={<Settings size={18} />}
        actions={
          <div className="flex items-center gap-2">
            {saveStatus && (
              <Badge variant="success" size="sm">
                <Check size={10} className="mr-1" /> {saveStatus}
              </Badge>
            )}
            <Button variant="primary" size="sm" onClick={onSave}>{t('common.save')}</Button>
          </div>
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card variant="solid" padding="md">
          <CardHeader><CardTitle>{t('settings.profile')}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 max-w-md">
              <Input label={t('settings.displayName')} value={profileForm.displayName} onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })} placeholder={t('settings.displayNamePlaceholder')} />
              <Input label={t('settings.affiliation')} value={profileForm.affiliate} onChange={(e) => setProfileForm({ ...profileForm, affiliate: e.target.value })} placeholder={t('settings.affiliationPlaceholder')} />
              <Select
                label={t('settings.language')}
                value={profileForm.language}
                onChange={(e) => {
                  const newLang = e.target.value as 'en' | 'zh';
                  setProfileForm({ ...profileForm, language: newLang });
                  switchLang(newLang);
                }}
                options={[
                  { value: 'en', label: t('settings.english') },
                  { value: 'zh', label: t('settings.chinese') },
                ]}
              />

              {/* Motto */}
              <div className="pt-2 border-t border-slate-800">
                <Input
                  label={t('settings.motto')}
                  value={profileForm.motto}
                  onChange={(e) => setProfileForm({ ...profileForm, motto: e.target.value })}
                  placeholder={t('settings.mottoPlaceholder')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cloud Sync Tab */}
      {activeTab === 'sync' && (
        <div className="space-y-4">
          <Card variant="solid" padding="md">
            <CardHeader><CardTitle>{t('settings.syncProvider')}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3 max-w-md">
                <Select
                  label={t('settings.syncProvider')}
                  value={settings.syncProviders?.metadata?.provider || 'local'}
                  onChange={(e) => setSettings({
                    ...settings,
                    syncProviders: { ...settings.syncProviders, metadata: { provider: e.target.value as any, config: {} } }
                  })}
                  options={[
                    { value: 'local', label: t('settings.local') },
                    { value: 'webdav', label: t('settings.webdav') },
                    { value: 'github', label: t('settings.github') },
                  ]}
                />
              </div>
            </CardContent>
          </Card>

          {settings.syncProviders?.metadata?.provider === 'webdav' && (
            <Card variant="solid" padding="md">
              <CardHeader><CardTitle>{t('settings.webdav')}</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3 max-w-md">
                  <Input label={t('settings.webdavUrl')} value={webdavConfig.url} onChange={(e) => setWebdavConfig({ ...webdavConfig, url: e.target.value })} placeholder="https://dav.example.com" />
                  <Input label={t('settings.username')} value={webdavConfig.username} onChange={(e) => setWebdavConfig({ ...webdavConfig, username: e.target.value })} />
                  <Input label={t('settings.password')} type="password" value={webdavConfig.password} onChange={(e) => setWebdavConfig({ ...webdavConfig, password: e.target.value })} />
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleTestConnection('webdav')}>{t('settings.testConnection')}</Button>
                    <Button variant="primary" size="sm" onClick={handleManualSync} isLoading={isSyncing}>{isSyncing ? t('settings.syncing') : t('settings.manualSync')}</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {settings.syncProviders?.metadata?.provider === 'github' && (
            <Card variant="solid" padding="md">
              <CardHeader><CardTitle>{t('settings.github')}</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3 max-w-md">
                  <Input label={t('settings.githubToken')} type="password" value={githubConfig.token} onChange={(e) => setGithubConfig({ ...githubConfig, token: e.target.value })} />
                  <Input label={t('settings.githubRepo')} value={githubConfig.repo} onChange={(e) => setGithubConfig({ ...githubConfig, repo: e.target.value })} placeholder="username/repo" />
                  <Input label={t('settings.branch')} value={githubConfig.branch} onChange={(e) => setGithubConfig({ ...githubConfig, branch: e.target.value })} placeholder="main" />
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleTestConnection('github')}>{t('settings.testConnection')}</Button>
                    <Button variant="primary" size="sm" onClick={handleManualSync} isLoading={isSyncing}>{isSyncing ? t('settings.syncing') : t('settings.manualSync')}</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {syncStatus && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {syncStatus.includes('fail') || syncStatus.includes('error') ? (
                <AlertCircle size={14} className="text-error-400" />
              ) : (
                <Check size={14} className="text-success-400" />
              )}
              {syncStatus}
            </div>
          )}
        </div>
      )}

      {/* AI Tab */}
      {activeTab === 'ai' && (
        <Card variant="solid" padding="md">
          <CardHeader><CardTitle>{t('settings.aiCopilot')}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 max-w-md">
              <Select
                label={t('settings.aiProvider')}
                value={aiConfig.provider}
                onChange={(e) => setAiConfig({ ...aiConfig, provider: e.target.value as 'openai' | 'deepseek' })}
                options={[
                  { value: 'openai', label: 'OpenAI' },
                  { value: 'deepseek', label: 'DeepSeek' },
                ]}
              />
              <Input label={t('settings.apiKey')} type="password" value={aiConfig.apiKey} onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })} placeholder="sk-..." />
              <Input label={t('settings.endpoint')} value={aiConfig.endpoint} onChange={(e) => setAiConfig({ ...aiConfig, endpoint: e.target.value })} />
              <Input label={t('settings.model')} value={aiConfig.model} onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backup Tab */}
      {activeTab === 'backup' && (
        <Card variant="solid" padding="md">
          <CardHeader><CardTitle>{t('settings.data')}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4 max-w-md">
              <p className="text-xs text-slate-400">{t('settings.exportDesc')}</p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleExportJson}>{t('settings.exportData')}</Button>
                <div className="relative">
                  <Button variant="secondary" size="sm" onClick={() => document.getElementById('import-json-input')?.click()}>
                    {t('settings.importData')}
                  </Button>
                  <input
                    id="import-json-input"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImportJson(file);
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
