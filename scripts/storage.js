/**
 * ResearchFlow core - local-first storage and optional private synchronization.
 * Active collections support projects, research records, manuscripts,
 * submissions and tasks. Retired Evidence Locker and AI settings are removed
 * while normalizing old databases.
 */

const SYNC_CREDENTIALS_KEY = 'researchflow_sync_credentials';
const SYNC_SECRET_KEYS = new Set(['token', 'password', 'accesstoken', 'refreshtoken', 'clientsecret', 'authorization']);

const DEFAULT_DB = {
  schemaVersion: 7,
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
  deletedEntities: {
    researchAreas: [],
    projects: [],
    researchRecords: [],
    manuscripts: [],
    submissions: [],
    tasks: []
  },
  settings: {
    syncProviders: {
      metadata: { provider: 'local', config: {} } // Provider for JSON database sync
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
    ]
  }
};

class StorageEngine {
  constructor() {
    this.cache = null;
    this.syncing = false;
    this.deviceIdPromise = null;
    this.syncTimer = null;
    this.syncCredentials = null;
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
  async saveAll(data, options = {}) {
    if (
      options.localOnly !== true
      && typeof window !== 'undefined'
      && chrome.runtime?.sendMessage
    ) {
      const backgroundResult = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'SAVE_DATABASE',
          data,
          mergeOnConflict: options.mergeOnConflict === true
        }, (response) => {
          if (chrome.runtime.lastError) {
            resolve({ success: false, unavailable: true, error: chrome.runtime.lastError.message });
            return;
          }
          resolve(response || { success: false, unavailable: true });
        });
      });
      if (backgroundResult?.success && backgroundResult.data) {
        const normalizedResult = await this.ensureDbShape(backgroundResult.data, { stamp: false });
        this.cache = this.adoptSavedSnapshot(data, normalizedResult);
        return this.cache;
      }
      if (!backgroundResult?.unavailable) {
        throw new Error(backgroundResult?.error || 'Database save failed.');
      }
    }

    const normalized = await this.ensureDbShape(data, { stamp: true });
    this.cache = this.adoptSavedSnapshot(data, normalized);
    await this.persistLocal(this.cache);

    // Notify other pages (e.g. side panel or dashboard) of data changes
    chrome.runtime.sendMessage({ action: 'DATABASE_UPDATED', data: this.cache }).catch(() => {});

    // Trigger asynchronous cloud sync only when the selected remote provider
    // has a complete, valid configuration. Local persistence must never be
    // coupled to a half-configured WebDAV or GitHub route.
    if (await this.shouldRunCloudSync(this.cache)) {
      this.scheduleBackgroundSync();
    }
    return this.cache;
  }

  adoptSavedSnapshot(target, savedSnapshot) {
    if (
      target
      && savedSnapshot
      && target !== savedSnapshot
      && typeof target === 'object'
      && !Array.isArray(target)
    ) {
      Object.keys(target).forEach((key) => delete target[key]);
      Object.assign(target, savedSnapshot);
      return target;
    }
    return savedSnapshot;
  }

  scheduleBackgroundSync(delayMs = 1000) {
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      this.syncTimer = null;
      this.triggerBackgroundSync().catch(console.error);
    }, delayMs);
  }

  async persistLocal(data) {
    const safeData = this.sanitizeDatabaseForExternalUse(data);
    await new Promise((resolve) => {
      chrome.storage.local.set({ researchflow_db: safeData }, resolve);
    });
  }

  async ensureDbShape(data, options = {}) {
    const now = Date.now();
    const source = data && typeof data === 'object' ? data : {};
    const normalized = this.deepMerge(DEFAULT_DB, source);
    delete normalized.evidence;
    delete normalized.projectEvidenceLinks;
    delete normalized.recordEvidenceLinks;

    [
      'researchAreas',
      'projects',
      'researchRecords',
      'manuscripts',
      'submissions',
      'tasks'
    ].forEach((key) => {
      if (!Array.isArray(normalized[key])) normalized[key] = [];
    });
    normalized.deletedEntities = normalized.deletedEntities && typeof normalized.deletedEntities === 'object'
      ? normalized.deletedEntities
      : {};
    [
      'researchAreas',
      'projects',
      'researchRecords',
      'manuscripts',
      'submissions',
      'tasks'
    ].forEach((key) => {
      normalized.deletedEntities[key] = this.normalizeDeletionTombstones(normalized.deletedEntities[key]);
    });

    normalized.schemaVersion = Math.max(Number(normalized.schemaVersion) || 0, DEFAULT_DB.schemaVersion);
    normalized.settings = this.deepMerge(DEFAULT_DB.settings, normalized.settings || {});
    delete normalized.settings.ai;
    delete normalized.settings.syncProviders.files;
    if (options.migrateCredentials === false) {
      const metadata = normalized.settings?.syncProviders?.metadata;
      if (metadata) metadata.config = this.getPublicSyncConfig(metadata.provider, metadata.config);
    } else {
      await this.migrateSyncCredentials(normalized);
    }
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

  recordEntityDeletion(database, collectionName, entityId) {
    if (!database || !entityId || !Array.isArray(database?.[collectionName])) return false;
    database.deletedEntities = database.deletedEntities && typeof database.deletedEntities === 'object'
      ? database.deletedEntities
      : {};
    const existing = this.normalizeDeletionTombstones(database.deletedEntities[collectionName]);
    const deletedAt = new Date().toISOString();
    database.deletedEntities[collectionName] = existing
      .filter(item => item.id !== entityId)
      .concat({
        id: String(entityId),
        deletedAt,
        deviceId: String(database.deviceId || '')
      });
    database[collectionName] = database[collectionName].filter(item => item?.id !== entityId);
    return true;
  }

  normalizeDeletionTombstones(items) {
    const byId = new Map();
    (Array.isArray(items) ? items : []).forEach((item) => {
      if (!item || typeof item !== 'object' || !String(item.id || '').trim()) return;
      const normalized = {
        id: String(item.id),
        deletedAt: item.deletedAt || item.updatedAt || new Date(0).toISOString(),
        deviceId: String(item.deviceId || '')
      };
      const previous = byId.get(normalized.id);
      if (!previous || this.getEntityTimestamp(normalized) >= this.getEntityTimestamp(previous)) {
        byId.set(normalized.id, normalized);
      }
    });
    return Array.from(byId.values());
  }

  getEntityTimestamp(item) {
    const timestamp = new Date(item?.deletedAt || item?.updatedAt || item?.createdAt || 0).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  filterDeletedEntities(items, tombstones) {
    const deletedById = new Map(
      this.normalizeDeletionTombstones(tombstones).map(item => [item.id, item])
    );
    return (Array.isArray(items) ? items : []).filter((item) => {
      const tombstone = deletedById.get(String(item?.id || ''));
      if (!tombstone) return true;
      return this.getEntityTimestamp(item) > this.getEntityTimestamp(tombstone);
    });
  }

  getSyncConfigurationIssue(metadataProvider) {
    const provider = String(metadataProvider?.provider || 'local').trim().toLowerCase();
    const config = metadataProvider?.config && typeof metadataProvider.config === 'object'
      ? metadataProvider.config
      : {};

    if (provider === 'local') return null;

    if (provider === 'webdav') {
      const url = String(config.url || '').trim();
      if (!url) return 'WebDAV URL is required.';
      try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) {
          return 'Invalid WebDAV URL';
        }
      } catch (_) {
        return 'Invalid WebDAV URL';
      }
      if (!String(config.username || '').trim() || !String(config.password || '').trim()) {
        return 'WebDAV username and app password are required.';
      }
      return null;
    }

    if (provider === 'github') {
      if (!String(config.token || '').trim()) return 'GitHub token is required.';
      if (!/^[^/\s]+\/[^/\s]+$/.test(String(config.repo || '').trim())) {
        return 'GitHub repository must use the owner/repository format.';
      }
      return null;
    }

    return `Unsupported sync provider: ${provider}`;
  }

  async shouldRunCloudSync(database = this.cache) {
    const metadataProvider = await this.getEffectiveMetadataProvider(database);
    return metadataProvider.provider !== 'local' && !this.getSyncConfigurationIssue(metadataProvider);
  }

  getPublicSyncConfig(provider, config = {}) {
    if (provider === 'webdav') {
      return { url: String(config.url || '').trim() };
    }
    if (provider === 'github') {
      return {
        repo: String(config.repo || '').trim(),
        branch: String(config.branch || 'main').trim() || 'main'
      };
    }
    return {};
  }

  getCredentialPatch(provider, config = {}) {
    if (provider === 'webdav') {
      return {
        username: String(config.username || '').trim(),
        password: String(config.password || '')
      };
    }
    if (provider === 'github') {
      return { token: String(config.token || '').trim() };
    }
    return {};
  }

  async loadSyncCredentials() {
    if (this.syncCredentials) return this.deepMerge({}, this.syncCredentials);
    this.syncCredentials = await new Promise((resolve) => {
      chrome.storage.local.get([SYNC_CREDENTIALS_KEY], (result) => {
        const stored = result?.[SYNC_CREDENTIALS_KEY];
        resolve(stored && typeof stored === 'object' ? stored : {});
      });
    });
    return this.deepMerge({}, this.syncCredentials);
  }

  async saveSyncCredentials(provider, config = {}) {
    const credentials = await this.loadSyncCredentials();
    if (provider === 'webdav' || provider === 'github') {
      credentials[provider] = this.getCredentialPatch(provider, config);
    }
    this.syncCredentials = credentials;
    await new Promise((resolve) => {
      chrome.storage.local.set({ [SYNC_CREDENTIALS_KEY]: credentials }, resolve);
    });
    return this.getCredentialPatch(provider, credentials[provider] || {});
  }

  async migrateSyncCredentials(database) {
    const metadata = database?.settings?.syncProviders?.metadata;
    if (!metadata || typeof metadata !== 'object') return;
    const provider = String(metadata.provider || 'local').trim().toLowerCase();
    const config = metadata.config && typeof metadata.config === 'object' ? metadata.config : {};
    const credentialPatch = this.getCredentialPatch(provider, config);
    if (Object.values(credentialPatch).some(Boolean)) {
      await this.saveSyncCredentials(provider, credentialPatch);
    } else {
      await this.loadSyncCredentials();
    }
    metadata.config = this.getPublicSyncConfig(provider, config);
  }

  async getEffectiveMetadataProvider(database = this.cache) {
    const metadata = database?.settings?.syncProviders?.metadata || { provider: 'local', config: {} };
    const provider = String(metadata.provider || 'local').trim().toLowerCase();
    const credentials = await this.loadSyncCredentials();
    return {
      provider,
      config: {
        ...this.getPublicSyncConfig(provider, metadata.config),
        ...(credentials[provider] || {})
      }
    };
  }

  sanitizeDatabaseForExternalUse(database) {
    const sanitized = JSON.parse(JSON.stringify(database || {}));
    const metadata = sanitized?.settings?.syncProviders?.metadata;
    if (metadata) {
      metadata.config = this.getPublicSyncConfig(metadata.provider, metadata.config);
    }
    const scrub = (value) => {
      if (!value || typeof value !== 'object') return;
      Object.keys(value).forEach((key) => {
        if (SYNC_SECRET_KEYS.has(key.toLowerCase())) {
          delete value[key];
          return;
        }
        scrub(value[key]);
      });
    };
    scrub(sanitized);
    delete sanitized._github_sha;
    delete sanitized._webdav_etag;
    return sanitized;
  }

  normalizeEntityMetadata(database) {
    const nowIso = new Date().toISOString();
    [
      'researchAreas',
      'projects',
      'researchRecords',
      'manuscripts',
      'submissions',
      'tasks'
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
        const credentialBytes = new TextEncoder().encode(`${username}:${password}`);
        headers.set('Authorization', 'Basic ' + btoa(String.fromCharCode(...credentialBytes)));
        
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
      const metaProvider = await this.getEffectiveMetadataProvider(db);
      
      if (metaProvider.provider === 'local') {
        this.syncing = false;
        return { success: true, message: 'Local storage active, no sync required.' };
      }

      const configurationIssue = this.getSyncConfigurationIssue(metaProvider);
      if (configurationIssue) {
        this.syncing = false;
        return {
          success: false,
          skipped: true,
          error: configurationIssue
        };
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
          chrome.runtime.sendMessage({ action: 'DATABASE_UPDATED', data: merged }).catch(() => {});
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
    const remote = await this.ensureDbShape(remoteDb, { stamp: false, migrateCredentials: false });
    const merged = this.deepMerge(local, remote);

    [
      'researchAreas',
      'projects',
      'researchRecords',
      'manuscripts',
      'submissions',
      'tasks'
    ].forEach((collectionName) => {
      merged.deletedEntities[collectionName] = this.normalizeDeletionTombstones([
        ...(local.deletedEntities?.[collectionName] || []),
        ...(remote.deletedEntities?.[collectionName] || [])
      ]);
      merged[collectionName] = this.filterDeletedEntities(
        this.mergeEntityArray(local[collectionName], remote[collectionName]),
        merged.deletedEntities[collectionName]
      );
    });

    // Keep local routing preferences authoritative on this device; credentials
    // live outside the synchronized database.
    merged.settings = local.settings;
    merged._github_sha = remote._github_sha || local._github_sha;
    merged._webdav_etag = remote._webdav_etag || local._webdav_etag;
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

  // --- WebDAV Methods ---
  async fetchFromWebDAV(config) {
    const { url, username, password } = config;
    await this.ensureHostPermissionForUrl(url, { request: false });
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const dbUrl = `${cleanUrl}/researchflow_db.json`;
    
    const headers = new Headers();
    const credentialBytes = new TextEncoder().encode(`${username}:${password}`);
    headers.set('Authorization', 'Basic ' + btoa(String.fromCharCode(...credentialBytes)));
    
    const response = await fetch(dbUrl, { method: 'GET', headers });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`WebDAV read failed: ${response.statusText}`);
    const parsed = await response.json();
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      parsed._webdav_etag = response.headers?.get?.('etag') || null;
    }
    return parsed;
  }

  async saveToWebDAV(config, db) {
    const { url, username, password } = config;
    await this.ensureHostPermissionForUrl(url, { request: false });
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const dbUrl = `${cleanUrl}/researchflow_db.json`;
    
    const headers = new Headers();
    const credentialBytes = new TextEncoder().encode(`${username}:${password}`);
    headers.set('Authorization', 'Basic ' + btoa(String.fromCharCode(...credentialBytes)));
    headers.set('Content-Type', 'application/json');
    if (db._webdav_etag) headers.set('If-Match', db._webdav_etag);

    const response = await fetch(dbUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(this.sanitizeDatabaseForExternalUse(db), null, 2)
    });
    if (response.status === 409 || response.status === 412) {
      throw new Error('WebDAV conflict: the remote database changed. Sync again to merge before retrying.');
    }
    if (!response.ok) throw new Error(`WebDAV write failed: ${response.statusText}`);
  }

  async ensureHostPermissionForUrl(url, options = {}) {
    const shouldRequest = options.request !== false;
    let originPattern = '';
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) {
        throw new Error('Invalid WebDAV URL');
      }
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
    const cleanDb = this.sanitizeDatabaseForExternalUse(db);

    // Convert string to base64 safely (handling UTF-8)
    const base64Body = btoa(unescape(encodeURIComponent(JSON.stringify(cleanDb, null, 2))));
    
    const putBody = {
      message: 'sync: update researchflow database',
      content: base64Body,
      branch
    };
    if (sha) putBody.sha = sha;

    let response = await fetch(dbUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify(putBody)
    });

    let rebasedDatabase = null;
    if (response.status === 409 || response.status === 422) {
      const latestRemote = await this.fetchFromGitHub(config);
      if (latestRemote?._github_sha) {
        const rebased = await this.mergeDatabases(db, latestRemote);
        rebasedDatabase = rebased;
        const retryBody = {
          message: 'sync: merge and update researchflow database',
          content: btoa(unescape(encodeURIComponent(JSON.stringify(
            this.sanitizeDatabaseForExternalUse(rebased),
            null,
            2
          )))),
          branch,
          sha: latestRemote._github_sha
        };
        response = await fetch(dbUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify(retryBody)
        });
      }
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`GitHub save failed: ${err.message || response.statusText}`);
    }
    const saved = await response.json().catch(() => null);
    if (rebasedDatabase) {
      Object.keys(db).forEach(key => delete db[key]);
      Object.assign(db, rebasedDatabase);
    }
    if (saved?.content?.sha) db._github_sha = saved.content.sha;
  }

}

// Instantiate storage globally on pages importing this script
const storage = new StorageEngine();
globalThis.storage = storage;
if (typeof window !== 'undefined') {
  window.storage = storage;
}
