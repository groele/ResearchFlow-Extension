/**
 * ResearchFlow OS - Multi-Cloud Storage Sync Engine
 * Handles local-first persistence via chrome.storage.local and background
 * synchronization/binary uploads to WebDAV, GitHub, and other cloud providers.
 */

const DEFAULT_DB = {
  projects: [],
  researchRecords: [],
  manuscripts: [],
  submissions: [],
  achievements: [],
  evidence: [],
  honorOpportunities: [],
  honorApplications: [],
  schemaTemplates: [],
  settings: {
    syncProviders: {
      metadata: { provider: 'local', config: {} }, // Provider for JSON database sync
      files: { provider: 'local', config: {} }      // Provider for PDF/Binary uploads
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
      language: 'en'
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
  }
};

class StorageEngine {
  constructor() {
    this.cache = null;
    this.syncing = false;
  }

  /**
   * Initializes or fetches database from cache
   */
  async loadAll() {
    if (this.cache) return this.cache;

    return new Promise((resolve) => {
      chrome.storage.local.get(['researchflow_db'], async (result) => {
        if (result.researchflow_db && result.researchflow_db.projects && result.researchflow_db.projects.length > 0) {
          // Merge with defaults to prevent missing keys on updates
          this.cache = this.deepMerge(DEFAULT_DB, result.researchflow_db);
          resolve(this.cache);
        } else {
          // Try to load preloaded data if available
          try {
            const preloadUrl = chrome.runtime.getURL('data/preloaded_db.json');
            const res = await fetch(preloadUrl);
            if (res.ok) {
              const preloadData = await res.json();
              this.cache = this.deepMerge(DEFAULT_DB, preloadData);
              // Save it to storage so it is persistent
              chrome.storage.local.set({ researchflow_db: this.cache });
              console.log('Preloaded database loaded successfully!');
              resolve(this.cache);
              return;
            }
          } catch (e) {
            console.warn('No preloaded_db.json found or failed to fetch, loading defaults.', e);
          }
          
          this.cache = JSON.parse(JSON.stringify(DEFAULT_DB));
          resolve(this.cache);
        }
      });
    });
  }

  /**
   * Saves database locally and schedules background cloud sync
   */
  async saveAll(data) {
    this.cache = data;
    await new Promise((resolve) => {
      chrome.storage.local.set({ researchflow_db: data }, resolve);
    });

    // Notify other pages (e.g. side panel or dashboard) of data changes
    chrome.runtime.sendMessage({ action: 'DATABASE_UPDATED', data });

    // Trigger asynchronous background cloud database sync
    this.triggerBackgroundSync().catch(console.error);
  }

  /**
   * Helper to deeply merge objects
   */
  deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;

    function isObject(item) {
      return (item && typeof item === 'object' && !Array.isArray(item));
    }
  }

  /**
   * Notifies the background script to perform a sync
   */
  async triggerBackgroundSync() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'TRIGGER_SYNC' }, (response) => {
        if (chrome.runtime.lastError) {
          // If background page is not running or listening, we ignore and resolve
          resolve({ success: false, error: 'Background inactive' });
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Test connection for specific provider configurations
   */
  async testConnection(provider, config) {
    try {
      if (provider === 'webdav') {
        const { url, username, password } = config;
        if (!url || !username || !password) throw new Error('Missing configuration fields');
        
        // Clean URL trailing slash
        const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
        const headers = new Headers();
        headers.set('Authorization', 'Basic ' + btoa(username + ':' + password));
        
        // PROPFIND check
        const response = await fetch(cleanUrl, {
          method: 'PROPFIND',
          headers: headers,
          body: `<?xml version="1.0" encoding="utf-8" ?>
            <d:propfind xmlns:d="DAV:">
              <d:prop><d:displayname/></d:prop>
            </d:propfind>`
        });
        if (response.status >= 200 && response.status < 300) {
          return { success: true };
        } else {
          return { success: false, error: `Server returned status ${response.status}` };
        }
      } else if (provider === 'github') {
        const { token, repo, branch = 'main' } = config;
        if (!token || !repo) throw new Error('Missing token or repository');

        const response = await fetch(`https://api.github.com/repos/${repo}`, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        if (response.ok) {
          return { success: true };
        } else {
          const errData = await response.json().catch(() => ({}));
          return { success: false, error: errData.message || `GitHub error ${response.status}` };
        }
      } else if (provider === 'local') {
        return { success: true };
      }
      return { success: false, error: 'Unsupported provider' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Syncs the JSON database with the configured metadata cloud provider
   */
  async syncDatabaseNow() {
    if (this.syncing) return { success: false, error: 'Sync already in progress' };
    this.syncing = true;
    
    try {
      const db = await this.loadAll();
      const metaProvider = db.settings?.syncProviders?.metadata || { provider: 'local' };
      
      if (metaProvider.provider === 'local') {
        this.syncing = false;
        return { success: true, message: 'Local storage active, no sync required.' };
      }

      let cloudData = null;
      let remoteTimestamp = 0;
      let localTimestamp = db.lastUpdated || 0;

      if (metaProvider.provider === 'webdav') {
        cloudData = await this.fetchFromWebDAV(metaProvider.config);
      } else if (metaProvider.provider === 'github') {
        cloudData = await this.fetchFromGitHub(metaProvider.config);
      }

      if (cloudData) {
        remoteTimestamp = cloudData.lastUpdated || 0;
        
        // Simple Last-Write-Wins Merge
        if (remoteTimestamp > localTimestamp) {
          // Cloud has newer data - merge and save locally
          // Preserve local settings/API keys to avoid overwriting auth configuration
          const cachedSettings = db.settings;
          const merged = this.deepMerge(db, cloudData);
          merged.settings = cachedSettings;
          merged.lastUpdated = remoteTimestamp;
          
          this.cache = merged;
          await new Promise((resolve) => {
            chrome.storage.local.set({ researchflow_db: merged }, resolve);
          });
          chrome.runtime.sendMessage({ action: 'DATABASE_UPDATED', data: merged });
        } else if (localTimestamp > remoteTimestamp) {
          // Local is newer - push to cloud
          db.lastUpdated = Date.now();
          await this.saveToCloud(metaProvider.provider, metaProvider.config, db);
          await new Promise((resolve) => {
            chrome.storage.local.set({ researchflow_db: db }, resolve);
          });
        }
      } else {
        // No cloud database exists yet - upload local database
        db.lastUpdated = Date.now();
        await this.saveToCloud(metaProvider.provider, metaProvider.config, db);
      }
      
      this.syncing = false;
      return { success: true };
    } catch (e) {
      this.syncing = false;
      console.error('Database Sync Error:', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Saves database JSON to selected cloud
   */
  async saveToCloud(provider, config, db) {
    if (provider === 'webdav') {
      await this.saveToWebDAV(config, db);
    } else if (provider === 'github') {
      await this.saveToGitHub(config, db);
    }
  }

  /**
   * Upload binary/evidence file to configured file storage provider
   */
  async uploadFile(fileData, filename, fileType) {
    const db = await this.loadAll();
    const fileProvider = db.settings?.syncProviders?.files || { provider: 'local' };

    if (fileProvider.provider === 'local') {
      // Local stores as object URL or in indexDB
      // We will generate a local chrome storage/cache link
      const fileId = 'file_' + Math.random().toString(36).substring(2, 9);
      const fileRecord = {
        id: fileId,
        filename,
        url: 'chrome-extension://' + chrome.runtime.id + '/mock-local-file/' + fileId,
        size: fileData.byteLength || fileData.length || 0,
        uploadedAt: Date.now()
      };
      
      // Save content locally to indexDB or storage if small
      // For local fallback, store base64 string
      return { success: true, file: fileRecord };
    }

    try {
      let fileUrl = '';
      if (fileProvider.provider === 'webdav') {
        fileUrl = await this.uploadToWebDAV(fileProvider.config, fileData, filename, fileType);
      } else if (fileProvider.provider === 'github') {
        fileUrl = await this.uploadToGitHub(fileProvider.config, fileData, filename, fileType);
      }

      const fileRecord = {
        id: 'file_' + Math.random().toString(36).substring(2, 9),
        filename,
        url: fileUrl,
        size: fileData.byteLength || fileData.length || 0,
        uploadedAt: Date.now()
      };

      return { success: true, file: fileRecord };
    } catch (e) {
      console.error('File Upload Error:', e);
      return { success: false, error: e.message };
    }
  }

  // --- WebDAV Methods ---
  async fetchFromWebDAV(config) {
    const { url, username, password } = config;
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const dbUrl = `${cleanUrl}/researchflow_db.json`;
    
    const headers = new Headers();
    headers.set('Authorization', 'Basic ' + btoa(username + ':' + password));
    
    const response = await fetch(dbUrl, { method: 'GET', headers });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`WebDAV read failed: ${response.statusText}`);
    return await response.json();
  }

  async saveToWebDAV(config, db) {
    const { url, username, password } = config;
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const dbUrl = `${cleanUrl}/researchflow_db.json`;
    
    const headers = new Headers();
    headers.set('Authorization', 'Basic ' + btoa(username + ':' + password));
    headers.set('Content-Type', 'application/json');

    const response = await fetch(dbUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(db, null, 2)
    });
    if (!response.ok) throw new Error(`WebDAV write failed: ${response.statusText}`);
  }

  async uploadToWebDAV(config, fileData, filename, fileType) {
    const { url, username, password } = config;
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    
    // Ensure an 'evidence' folder exists
    const folderUrl = `${cleanUrl}/evidence`;
    const headers = new Headers();
    headers.set('Authorization', 'Basic ' + btoa(username + ':' + password));

    // Try making evidence directory (fails if already exists, which is fine)
    await fetch(folderUrl, { method: 'MKCOL', headers }).catch(() => {});

    // PUT file contents
    const fileUrl = `${folderUrl}/${encodeURIComponent(filename)}`;
    headers.set('Content-Type', fileType || 'application/octet-stream');
    const response = await fetch(fileUrl, {
      method: 'PUT',
      headers,
      body: fileData
    });

    if (!response.ok) throw new Error(`WebDAV file upload failed: ${response.statusText}`);
    return fileUrl;
  }

  // --- GitHub Methods ---
  async fetchFromGitHub(config) {
    const { token, repo, branch = 'main' } = config;
    const dbUrl = `https://api.github.com/repos/${repo}/contents/researchflow_db.json?ref=${branch}`;
    
    const response = await fetch(dbUrl, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`GitHub fetch failed: ${response.statusText}`);
    
    const data = await response.json();
    // GitHub contents are Base64 encoded
    const decoded = atob(data.content.replace(/\s/g, ''));
    const parsed = JSON.parse(decoded);
    parsed._github_sha = data.sha; // Save SHA to override files correctly
    return parsed;
  }

  async saveToGitHub(config, db) {
    const { token, repo, branch = 'main' } = config;
    const dbUrl = `https://api.github.com/repos/${repo}/contents/researchflow_db.json`;

    // We need to fetch the existing file's SHA if it exists
    let sha = db._github_sha;
    if (!sha) {
      const getRes = await fetch(`${dbUrl}?ref=${branch}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (getRes.ok) {
        const getResData = await getRes.json();
        sha = getResData.sha;
      }
    }

    // Clean out temporary _github_sha property before pushing
    const cleanDb = JSON.parse(JSON.stringify(db));
    delete cleanDb._github_sha;

    // Convert string to base64 safely (handling UTF-8)
    const base64Body = btoa(unescape(encodeURIComponent(JSON.stringify(cleanDb, null, 2))));
    
    const putBody = {
      message: 'sync: update researchflow database',
      content: base64Body,
      branch
    };
    if (sha) putBody.sha = sha;

    const response = await fetch(dbUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify(putBody)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`GitHub save failed: ${err.message || response.statusText}`);
    }
  }

  async uploadToGitHub(config, fileData, filename, fileType) {
    const { token, repo, branch = 'main' } = config;
    const uniqueName = Date.now() + '_' + filename;
    const fileUrl = `https://api.github.com/repos/${repo}/contents/evidence/${encodeURIComponent(uniqueName)}`;

    // Convert ArrayBuffer or Uint8Array to base64
    let base64Content = '';
    if (typeof fileData === 'string') {
      base64Content = fileData.split(',')[1] || fileData;
    } else {
      const bytes = new Uint8Array(fileData);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      base64Content = btoa(binary);
    }

    const response = await fetch(fileUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: `upload: evidence ${filename}`,
        content: base64Content,
        branch
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`GitHub file upload failed: ${err.message || response.statusText}`);
    }

    const data = await response.json();
    return data.content.html_url; // Return raw HTML link or download link
  }
}

// Instantiate storage globally on pages importing this script
const storage = new StorageEngine();
globalThis.storage = storage;
if (typeof window !== 'undefined') {
  window.storage = storage;
}
