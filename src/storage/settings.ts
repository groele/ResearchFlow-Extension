export interface SyncProviderConfig {
  provider: 'local' | 'webdav' | 'github';
  config: Record<string, any>;
}

export interface AISettings {
  provider: 'openai' | 'deepseek';
  apiKey: string;
  endpoint: string;
  model: string;
}

export interface ProfileSettings {
  displayName: string;
  chineseName: string;
  englishName: string;
  affiliation: string;
  orcid: string;
  language: 'en' | 'zh';
  avatar: string;
  motto: string;
}

export interface JournalPortal {
  id: string;
  name: string;
  url: string;
  color: string;
  isDefault: boolean;
}

export interface ExtensionSettings {
  syncProviders: {
    metadata: SyncProviderConfig;
    files: SyncProviderConfig;
  };
  ai: AISettings;
  profile: ProfileSettings;
  journalPortals: JournalPortal[];
  zoteroSource: 'local' | 'web';
  zoteroUid: string;
  zoteroKey: string;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  syncProviders: {
    metadata: { provider: 'local', config: {} },
    files: { provider: 'local', config: {} }
  },
  ai: {
    provider: 'openai',
    apiKey: '',
    endpoint: 'https://api.openai.com/v1',
    model: 'gpt-4o'
  },
  profile: {
    displayName: '',
    chineseName: '',
    englishName: '',
    affiliation: '',
    orcid: '',
    language: 'en',
    avatar: '',
    motto: ''
  },
  journalPortals: [
    { id: 'acs', name: 'ACS', url: 'https://publish.acs.org/app/login?code=1000', color: '#002C6C', isDefault: true },
    { id: 'wiley', name: 'Wiley', url: 'https://submission.wiley.com/submission/dashboard', color: '#00A4E4', isDefault: true },
    { id: 'apl', name: 'APL', url: 'https://apl.peerx-press.org/cgi-bin/main.plex', color: '#D22630', isDefault: true },
    { id: 'nature', name: 'Nature', url: 'https://mts-ncomms.nature.com/cgi-bin/main.plex', color: '#B59E50', isDefault: true }
  ],
  zoteroSource: 'local',
  zoteroUid: '',
  zoteroKey: ''
};

export async function loadSettings(): Promise<ExtensionSettings> {
  const result = await chrome.storage.local.get(['settings']);
  if (result.settings) {
    // Deep merge with defaults to ensure all keys are present
    return deepMerge(DEFAULT_SETTINGS, result.settings);
  }
  return { ...DEFAULT_SETTINGS };
}

export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
  const current = await loadSettings();
  const updated = deepMerge(current, settings);
  await chrome.storage.local.set({ settings: updated });
  // Send message to notify active pages of configuration updates
  chrome.runtime.sendMessage({ action: 'SETTINGS_UPDATED', settings: updated }).catch(() => {});
}

function deepMerge(target: any, source: any): any {
  const output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;

  function isObject(item: any) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }
}
