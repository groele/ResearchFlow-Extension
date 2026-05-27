import { db, type Project, type ResearchRecord, type Manuscript, type Submission, type Evidence, type SchemaTemplate, type Hypothesis, type Experiment } from './dexie';
import { loadSettings, type ExtensionSettings } from './settings';
import { generateId } from './id';

export interface SyncResult {
  success: boolean;
  message?: string;
  error?: string;
}

class CloudSyncEngine {
  private syncing = false;

  /**
   * Test connection with a cloud provider
   */
  async testConnection(provider: 'webdav' | 'github', config: Record<string, any>): Promise<SyncResult> {
    try {
      if (provider === 'webdav') {
        const { url, username, password } = config;
        if (!url || !username || !password) throw new Error('Missing WebDAV configuration fields');
        
        const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
        const headers = new Headers();
        headers.set('Authorization', 'Basic ' + btoa(username + ':' + password));
        
        const response = await fetch(cleanUrl, {
          method: 'PROPFIND',
          headers,
          body: `<?xml version="1.0" encoding="utf-8" ?>
            <d:propfind xmlns:d="DAV:">
              <d:prop><d:displayname/></d:prop>
            </d:propfind>`
        });
        
        if (response.status >= 200 && response.status < 300) {
          return { success: true };
        } else {
          return { success: false, error: `WebDAV server returned status ${response.status}` };
        }
      } else if (provider === 'github') {
        const { token, repo } = config;
        if (!token || !repo) throw new Error('Missing GitHub token or repository path');

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
      }
      return { success: false, error: 'Unsupported provider' };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Synchronizes the database tables with the configured metadata cloud provider
   */
  async syncDatabaseNow(): Promise<SyncResult> {
    if (this.syncing) return { success: false, error: 'Sync already in progress' };
    this.syncing = true;
    
    try {
      const settings = await loadSettings();
      const metaProvider = settings.syncProviders?.metadata || { provider: 'local', config: {} };
      
      if (metaProvider.provider === 'local') {
        this.syncing = false;
        return { success: true, message: 'Local storage active, no sync required.' };
      }

      // 1. Package local database tables into a single JSON object
      const localData = await this.packageLocalData();
      
      let remoteData: any = null;
      let remoteTimestamp = 0;
      const localTimestamp = localData.lastUpdated || 0;

      // 2. Fetch remote database JSON
      if (metaProvider.provider === 'webdav') {
        remoteData = await this.fetchFromWebDAV(metaProvider.config);
      } else if (metaProvider.provider === 'github') {
        remoteData = await this.fetchFromGitHub(metaProvider.config);
      }

      if (remoteData) {
        remoteTimestamp = remoteData.lastUpdated || 0;
        
        // 3. Simple Last-Write-Wins Merge
        if (remoteTimestamp > localTimestamp) {
          // Remote is newer - merge and update local tables
          await this.importRemoteData(remoteData);
          console.log('Database synced: Imported newer remote database.');
        } else if (localTimestamp > remoteTimestamp) {
          // Local is newer - push local to remote
          localData.lastUpdated = Date.now();
          await this.saveToCloud(metaProvider.provider, metaProvider.config, localData);
          console.log('Database synced: Uploaded local changes.');
        } else {
          console.log('Database synced: Already in sync.');
        }
      } else {
        // No remote database exists yet - create it with local data
        localData.lastUpdated = Date.now();
        await this.saveToCloud(metaProvider.provider, metaProvider.config, localData);
        console.log('Database synced: Initialized remote cloud database.');
      }
      
      // Notify other parts of the extension of data changes
      chrome.runtime.sendMessage({ action: 'DATABASE_UPDATED' }).catch(() => {});
      
      this.syncing = false;
      return { success: true };
    } catch (e: any) {
      this.syncing = false;
      console.error('Database Sync Error:', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Uploads raw evidence file (e.g. PDF) to cloud
   */
  async uploadFile(fileData: any, filename: string, fileType: string): Promise<SyncResult & { file?: any }> {
    const settings = await loadSettings();
    const fileProvider = settings.syncProviders?.files || { provider: 'local', config: {} };

    if (fileProvider.provider === 'local') {
      const fileId = generateId('file');
      const fileRecord: Evidence = {
        id: fileId,
        userId: 'user',
        projectId: 'proj_general',
        title: filename,
        description: `Uploaded mock evidence file ${filename}`,
        evidenceType: filename.toLowerCase().endsWith('.pdf') ? 'pdf' : 'url',
        filePath: `chrome-extension://${chrome.runtime.id}/mock-local-file/${fileId}`,
        fileSize: fileData.byteLength || fileData.length || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await db.evidence.put(fileRecord);
      chrome.runtime.sendMessage({ action: 'DATABASE_UPDATED' }).catch(() => {});
      return { success: true, file: fileRecord };
    }

    try {
      let fileUrl = '';
      if (fileProvider.provider === 'webdav') {
        fileUrl = await this.uploadToWebDAV(fileProvider.config, fileData, filename, fileType);
      } else if (fileProvider.provider === 'github') {
        fileUrl = await this.uploadToGitHub(fileProvider.config, fileData, filename, fileType);
      }

      const fileRecord: Evidence = {
        id: generateId('ev'),
        userId: 'user',
        projectId: 'proj_general',
        title: filename,
        description: `Uploaded evidence file ${filename}`,
        evidenceType: filename.toLowerCase().endsWith('.pdf') ? 'pdf' : 'url',
        filePath: fileUrl,
        fileSize: fileData.byteLength || fileData.length || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.evidence.put(fileRecord);
      chrome.runtime.sendMessage({ action: 'DATABASE_UPDATED' }).catch(() => {});
      return { success: true, file: fileRecord };
    } catch (e: any) {
      console.error('File Upload Error:', e);
      return { success: false, error: e.message };
    }
  }

  // --- Core Helpers ---
  private async packageLocalData(): Promise<any> {
    const projects = await db.projects.toArray();
    const researchRecords = await db.researchRecords.toArray();
    const manuscripts = await db.manuscripts.toArray();
    const submissions = await db.submissions.toArray();
    const tasks = await db.tasks.toArray();
    const researchAreas = await db.researchAreas.toArray();
    const evidence = await db.evidence.toArray();
    const schemaTemplates = await db.schemaTemplates.toArray();
    const hypotheses = await db.hypotheses.toArray();
    const experiments = await db.experiments.toArray();

    const timestampResult = await chrome.storage.local.get(['db_last_updated']);

    return {
      projects,
      researchRecords,
      manuscripts,
      submissions,
      tasks,
      researchAreas,
      evidence,
      schemaTemplates,
      hypotheses,
      experiments,
      lastUpdated: timestampResult.db_last_updated || Date.now()
    };
  }

  private async importRemoteData(data: any): Promise<void> {
    await db.transaction('rw', [
      db.projects,
      db.researchRecords,
      db.manuscripts,
      db.submissions,
      db.tasks,
      db.researchAreas,
      db.evidence,
      db.schemaTemplates,
      db.hypotheses,
      db.experiments,
    ], async () => {
      await db.projects.clear();
      await db.researchRecords.clear();
      await db.manuscripts.clear();
      await db.submissions.clear();
      await db.tasks.clear();
      await db.researchAreas.clear();
      await db.evidence.clear();
      await db.schemaTemplates.clear();
      await db.hypotheses.clear();
      await db.experiments.clear();

      if (Array.isArray(data.projects)) await db.projects.bulkPut(data.projects);
      if (Array.isArray(data.researchRecords)) await db.researchRecords.bulkPut(data.researchRecords);
      if (Array.isArray(data.manuscripts)) await db.manuscripts.bulkPut(data.manuscripts);
      if (Array.isArray(data.submissions)) await db.submissions.bulkPut(data.submissions);
      if (Array.isArray(data.tasks)) await db.tasks.bulkPut(data.tasks);
      if (Array.isArray(data.researchAreas)) await db.researchAreas.bulkPut(data.researchAreas);
      if (Array.isArray(data.evidence)) await db.evidence.bulkPut(data.evidence);
      if (Array.isArray(data.schemaTemplates)) await db.schemaTemplates.bulkPut(data.schemaTemplates);
      if (Array.isArray(data.hypotheses)) await db.hypotheses.bulkPut(data.hypotheses);
      if (Array.isArray(data.experiments)) await db.experiments.bulkPut(data.experiments);
    });

    if (data.lastUpdated) {
      await chrome.storage.local.set({ db_last_updated: data.lastUpdated });
    }
  }

  private async saveToCloud(provider: 'webdav' | 'github', config: Record<string, any>, data: any): Promise<void> {
    if (provider === 'webdav') {
      await this.saveToWebDAV(config, data);
    } else if (provider === 'github') {
      await this.saveToGitHub(config, data);
    }
    await chrome.storage.local.set({ db_last_updated: data.lastUpdated });
  }

  // --- WebDAV Connectors ---
  private async fetchFromWebDAV(config: Record<string, any>): Promise<any> {
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

  private async saveToWebDAV(config: Record<string, any>, dbObj: any): Promise<void> {
    const { url, username, password } = config;
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const dbUrl = `${cleanUrl}/researchflow_db.json`;
    
    const headers = new Headers();
    headers.set('Authorization', 'Basic ' + btoa(username + ':' + password));
    headers.set('Content-Type', 'application/json');

    const response = await fetch(dbUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(dbObj, null, 2)
    });
    if (!response.ok) throw new Error(`WebDAV write failed: ${response.statusText}`);
  }

  private async uploadToWebDAV(config: Record<string, any>, fileData: any, filename: string, fileType: string): Promise<string> {
    const { url, username, password } = config;
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    
    const folderUrl = `${cleanUrl}/evidence`;
    const headers = new Headers();
    headers.set('Authorization', 'Basic ' + btoa(username + ':' + password));

    // Try making evidence directory (fails silently if it already exists)
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

  // --- GitHub Connectors ---
  private async fetchFromGitHub(config: Record<string, any>): Promise<any> {
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
    const decoded = atob(data.content.replace(/\s/g, ''));
    const parsed = JSON.parse(decoded);
    parsed._github_sha = data.sha;
    return parsed;
  }

  private async saveToGitHub(config: Record<string, any>, dbObj: any): Promise<void> {
    const { token, repo, branch = 'main' } = config;
    const dbUrl = `https://api.github.com/repos/${repo}/contents/researchflow_db.json`;

    let sha = dbObj._github_sha;
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

    const cleanDb = { ...dbObj };
    delete cleanDb._github_sha;

    const base64Body = btoa(unescape(encodeURIComponent(JSON.stringify(cleanDb, null, 2))));
    
    const putBody: Record<string, any> = {
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

  private async uploadToGitHub(config: Record<string, any>, fileData: any, filename: string, fileType: string): Promise<string> {
    const { token, repo, branch = 'main' } = config;
    const uniqueName = Date.now() + '_' + filename;
    const fileUrl = `https://api.github.com/repos/${repo}/contents/evidence/${encodeURIComponent(uniqueName)}`;

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
    return data.content.html_url;
  }
}

export const syncEngine = new CloudSyncEngine();
