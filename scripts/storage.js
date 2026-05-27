/**
 * ResearchFlow OS - Multi-Cloud Storage Sync Engine
 * Handles local-first persistence via chrome.storage.local and background
 * synchronization/binary uploads to WebDAV, GitHub, and other cloud providers.
 */

const DEFAULT_DB = {
  schemaVersion: 2,
  lastUpdated: 0,
  updatedAt: null,
  revision: 0,
  deviceId: '',
  researchAreas: [],
  projects: [],
  researchRecords: [],
  manuscripts: [],
  submissions: [],
  tasks: [],
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
    this.deviceIdPromise = null;
    this.syncTimer = null;
  }

  /**
   * Initializes or fetches database from cache
   */
  async loadAll() {
    if (this.cache) return this.cache;

    return new Promise((resolve) => {
      chrome.storage.local.get(['researchflow_db'], async (result) => {
        if (result.researchflow_db) {
          this.cache = await this.ensureDbShape(result.researchflow_db, { stamp: false });
          await this.persistLocal(this.cache);
          resolve(this.cache);
        } else {
          // Try to load preloaded data if available
          try {
            const preloadUrl = chrome.runtime.getURL('data/preloaded_db.json');
            const res = await fetch(preloadUrl);
            if (res.ok) {
              const preloadData = await res.json();
              this.cache = await this.ensureDbShape(preloadData, { stamp: false });
              // Save it to storage so it is persistent
              await this.persistLocal(this.cache);
              console.log('Preloaded database loaded successfully!');
              resolve(this.cache);
              return;
            }
          } catch (e) {
            console.warn('No preloaded_db.json found or failed to fetch, loading defaults.', e);
          }
          
          this.cache = await this.ensureDbShape(DEFAULT_DB, { stamp: false });
          await this.persistLocal(this.cache);
          resolve(this.cache);
        }
      });
    });
  }

  /**
   * Saves database locally and schedules background cloud sync
   */
  async saveAll(data) {
    const normalized = await this.ensureDbShape(data, { stamp: true });
    this.cache = normalized;
    await this.persistLocal(normalized);

    // Notify other pages (e.g. side panel or dashboard) of data changes
    chrome.runtime.sendMessage({ action: 'DATABASE_UPDATED', data: normalized });

    // Trigger asynchronous background cloud database sync
    this.scheduleBackgroundSync();
  }

  scheduleBackgroundSync(delayMs = 1000) {
    if (typeof window === 'undefined') {
      this.triggerBackgroundSync().catch(console.error);
      return;
    }
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      this.syncTimer = null;
      this.triggerBackgroundSync().catch(console.error);
    }, delayMs);
  }

  async persistLocal(data) {
    await new Promise((resolve) => {
      chrome.storage.local.set({ researchflow_db: data }, resolve);
    });
  }

  async ensureDbShape(data, options = {}) {
    const now = Date.now();
    const source = data && typeof data === 'object' ? data : {};
    const normalized = this.deepMerge(DEFAULT_DB, source);

    [
      'researchAreas',
      'projects',
      'researchRecords',
      'manuscripts',
      'submissions',
      'tasks',
      'achievements',
      'evidence',
      'honorOpportunities',
      'honorApplications',
      'schemaTemplates'
    ].forEach((key) => {
      if (!Array.isArray(normalized[key])) normalized[key] = [];
    });

    normalized.schemaVersion = Math.max(Number(normalized.schemaVersion) || 0, DEFAULT_DB.schemaVersion);
    normalized.settings = this.deepMerge(DEFAULT_DB.settings, normalized.settings || {});
    normalized.deviceId = normalized.deviceId || await this.getDeviceId();
    this.normalizeEntityMetadata(normalized);

    if (options.stamp) {
      normalized.lastUpdated = now;
      normalized.updatedAt = new Date(now).toISOString();
      normalized.revision = (Number(normalized.revision) || 0) + 1;
    } else {
      normalized.lastUpdated = Number(normalized.lastUpdated) || now;
      normalized.updatedAt = normalized.updatedAt || new Date(normalized.lastUpdated).toISOString();
      normalized.revision = Number(normalized.revision) || 0;
    }

    return normalized;
  }

  normalizeEntityMetadata(database) {
    const nowIso = new Date().toISOString();
    [
      'researchAreas',
      'projects',
      'researchRecords',
      'manuscripts',
      'submissions',
      'tasks',
      'achievements',
      'evidence',
      'honorOpportunities',
      'honorApplications',
      'schemaTemplates'
    ].forEach((collectionName) => {
      database[collectionName].forEach((entity) => {
        if (!entity || typeof entity !== 'object') return;
        if (!entity.id) entity.id = `${collectionName}_${Math.random().toString(36).slice(2, 9)}`;
        if (!entity.createdAt) entity.createdAt = entity.updatedAt || database.updatedAt || nowIso;
        if (!entity.updatedAt) entity.updatedAt = entity.createdAt || database.updatedAt || nowIso;
      });
    });
  }

  async getDeviceId() {
    if (!this.deviceIdPromise) {
      this.deviceIdPromise = new Promise((resolve) => {
        chrome.storage.local.get(['researchflow_device_id'], (result) => {
          if (result.researchflow_device_id) {
            resolve(result.researchflow_device_id);
            return;
          }
          const id = 'device_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
          chrome.storage.local.set({ researchflow_device_id: id }, () => resolve(id));
        });
      });
    }
    return this.deviceIdPromise;
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
        await this.ensureHostPermissionForUrl(url);
        
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

        const merged = await this.mergeDatabases(db, cloudData);
        const localChanged = this.hasMeaningfulChanges(db, merged);
        const shouldPush = localTimestamp >= remoteTimestamp || localChanged;
        const shouldUpdateLocal = remoteTimestamp > localTimestamp || localChanged;

        if (shouldUpdateLocal) {
          this.cache = merged;
          await this.persistLocal(merged);
          chrome.runtime.sendMessage({ action: 'DATABASE_UPDATED', data: merged });
        }

        if (shouldPush) {
          const pushDb = await this.ensureDbShape(merged, { stamp: true });
          await this.saveToCloud(metaProvider.provider, metaProvider.config, pushDb);
          this.cache = pushDb;
          await this.persistLocal(pushDb);
        }
      } else {
        // No cloud database exists yet - upload local database
        const pushDb = await this.ensureDbShape(db, { stamp: true });
        await this.saveToCloud(metaProvider.provider, metaProvider.config, pushDb);
        this.cache = pushDb;
        await this.persistLocal(pushDb);
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

  async mergeDatabases(localDb, remoteDb) {
    const local = await this.ensureDbShape(localDb, { stamp: false });
    const remote = await this.ensureDbShape(remoteDb, { stamp: false });
    const merged = this.deepMerge(local, remote);

    [
      'researchAreas',
      'projects',
      'researchRecords',
      'manuscripts',
      'submissions',
      'tasks',
      'achievements',
      'evidence',
      'honorOpportunities',
      'honorApplications',
      'schemaTemplates'
    ].forEach((collectionName) => {
      merged[collectionName] = this.mergeEntityArray(local[collectionName], remote[collectionName]);
    });

    // Keep local secrets/routes authoritative on this device; merge data entities across devices.
    merged.settings = local.settings;
    merged._github_sha = remote._github_sha || local._github_sha;
    merged.lastUpdated = Math.max(Number(local.lastUpdated) || 0, Number(remote.lastUpdated) || 0);
    merged.updatedAt = new Date(merged.lastUpdated || Date.now()).toISOString();
    merged.revision = Math.max(Number(local.revision) || 0, Number(remote.revision) || 0);
    return merged;
  }

  mergeEntityArray(localItems = [], remoteItems = []) {
    const byId = new Map();
    [...localItems, ...remoteItems].forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const id = item.id || `${item.title || item.name || 'entity'}_${item.createdAt || ''}`;
      const previous = byId.get(id);
      if (!previous) {
        byId.set(id, item);
        return;
      }
      byId.set(id, this.pickNewerEntity(previous, item));
    });
    return Array.from(byId.values()).sort((a, b) => {
      const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return tb - ta;
    });
  }

  pickNewerEntity(a, b) {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    if (timeA === timeB) return this.deepMerge(a, b);
    return timeB > timeA ? this.deepMerge(a, b) : this.deepMerge(b, a);
  }

  hasMeaningfulChanges(a, b) {
    const clean = (value) => {
      const clone = JSON.parse(JSON.stringify(value || {}));
      delete clone.lastUpdated;
      delete clone.updatedAt;
      delete clone.revision;
      delete clone._github_sha;
      return clone;
    };
    return JSON.stringify(clean(a)) !== JSON.stringify(clean(b));
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
    await this.ensureHostPermissionForUrl(url, { request: false });
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
    await this.ensureHostPermissionForUrl(url, { request: false });
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
    await this.ensureHostPermissionForUrl(url, { request: false });
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

  async ensureHostPermissionForUrl(url, options = {}) {
    const shouldRequest = options.request !== false;
    let originPattern = '';
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) return true;
      originPattern = `${parsed.origin}/*`;
    } catch (e) {
      throw new Error('Invalid WebDAV URL');
    }

    if (!chrome.permissions) return true;

    const hasPermission = await new Promise((resolve) => {
      chrome.permissions.contains({ origins: [originPattern] }, resolve);
    });
    if (hasPermission) return true;

    if (!shouldRequest) {
      throw new Error(`Missing optional host permission for ${originPattern}. Use Test WebDAV Connection once to grant access.`);
    }

    const granted = await new Promise((resolve) => {
      chrome.permissions.request({ origins: [originPattern] }, resolve);
    });
    if (!granted) throw new Error(`Permission denied for ${originPattern}`);
    return true;
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
