const assert = require('node:assert/strict');

const localStorageState = {};

global.chrome = {
  storage: {
    local: {
      get(keys, callback) {
        const requested = Array.isArray(keys) ? keys : [keys];
        callback(Object.fromEntries(requested.filter(key => key in localStorageState).map(key => [key, localStorageState[key]])));
      },
      set(values, callback) {
        Object.assign(localStorageState, values);
        callback?.();
      }
    }
  },
  runtime: {
    sendMessage() {
      return Promise.resolve({ success: true });
    }
  }
};

require('../scripts/storage.js');

const engine = global.storage;

assert.equal(engine.getSyncConfigurationIssue({ provider: 'local', config: {} }), null);
assert.equal(
  engine.getSyncConfigurationIssue({ provider: 'webdav', config: { url: '', username: '', password: '' } }),
  'WebDAV URL is required.'
);
assert.equal(
  engine.getSyncConfigurationIssue({
    provider: 'webdav',
    config: { url: 'not-a-url', username: 'user', password: 'secret' }
  }),
  'Invalid WebDAV URL'
);
assert.equal(
  engine.getSyncConfigurationIssue({
    provider: 'webdav',
    config: { url: 'ftp://example.com/dav', username: 'user', password: 'secret' }
  }),
  'Invalid WebDAV URL'
);
assert.equal(
  engine.getSyncConfigurationIssue({
    provider: 'webdav',
    config: { url: 'https://dav.example.com/dav', username: '', password: 'secret' }
  }),
  'WebDAV username and app password are required.'
);
assert.equal(
  engine.getSyncConfigurationIssue({
    provider: 'webdav',
    config: { url: 'https://dav.example.com/dav', username: 'user', password: 'secret' }
  }),
  null
);
assert.equal(
  engine.getSyncConfigurationIssue({
    provider: 'github',
    config: { token: 'token', repo: 'missing-owner-separator' }
  }),
  'GitHub repository must use the owner/repository format.'
);

(async () => {
  engine.syncCredentials = null;
  const migrated = await engine.ensureDbShape({
    settings: {
      syncProviders: {
        metadata: {
          provider: 'github',
          config: { token: 'legacy-token', repo: 'owner/repo', branch: 'main' }
        }
      }
    }
  }, { stamp: false });
  assert.deepEqual(
    migrated.settings.syncProviders.metadata.config,
    { repo: 'owner/repo', branch: 'main' },
    'legacy credentials must be removed from the portable database'
  );
  assert.equal(
    localStorageState.researchflow_sync_credentials.github.token,
    'legacy-token',
    'legacy credentials should migrate to device-local storage'
  );
  await engine.ensureDbShape({
    settings: {
      syncProviders: {
        metadata: {
          provider: 'github',
          config: { token: 'remote-token', repo: 'remote/repo', branch: 'main' }
        }
      }
    }
  }, { stamp: false, migrateCredentials: false });
  assert.equal(
    (await engine.loadSyncCredentials()).github.token,
    'legacy-token',
    'remote database content must not overwrite device-local credentials'
  );

  engine.syncCredentials = {
    webdav: { username: 'user', password: 'secret' },
    github: { token: 'github-secret' }
  };
  assert.equal(
    await engine.shouldRunCloudSync({
      settings: { syncProviders: { metadata: { provider: 'webdav', config: { url: 'not-a-url' } } } }
    }),
    false
  );
  assert.equal(
    await engine.shouldRunCloudSync({
      settings: { syncProviders: { metadata: { provider: 'webdav', config: { url: 'https://dav.example.com/dav' } } } }
    }),
    true
  );

  const sanitized = engine.sanitizeDatabaseForExternalUse({
    settings: {
      syncProviders: {
        metadata: {
          provider: 'github',
          config: { repo: 'owner/repo', branch: 'main', token: 'github-secret', password: 'nested-secret' }
        }
      }
    },
    nested: { refreshToken: 'refresh-secret', value: 1 },
    _github_sha: 'temporary'
  });
  assert.deepEqual(sanitized.settings.syncProviders.metadata.config, { repo: 'owner/repo', branch: 'main' });
  assert.equal(sanitized.nested.refreshToken, undefined);
  assert.equal(sanitized._github_sha, undefined);
  assert(!JSON.stringify(sanitized).includes('secret'), 'external database payload must not contain credentials');

  let webdavPayload = '';
  global.fetch = async (_url, options = {}) => {
    webdavPayload = String(options.body || '');
    return { ok: true, json: async () => ({}) };
  };
  await engine.saveToWebDAV(
    { url: 'https://dav.example.com/dav', username: '研究者', password: 'pässword' },
    {
      settings: {
        syncProviders: {
          metadata: {
            provider: 'webdav',
            config: { url: 'https://dav.example.com/dav', username: '研究者', password: 'pässword' }
          }
        }
      }
    }
  );
  assert(!webdavPayload.includes('pässword'), 'WebDAV payload must redact credentials');
  assert(!webdavPayload.includes('研究者'), 'WebDAV payload must redact usernames');

  let scheduledSyncs = 0;
  engine.ensureDbShape = async data => data;
  engine.persistLocal = async () => {};
  engine.scheduleBackgroundSync = () => {
    scheduledSyncs += 1;
  };

  await engine.saveAll({
    settings: {
      syncProviders: {
        metadata: {
          provider: 'webdav',
          config: { url: 'not-a-url' }
        }
      }
    }
  });
  assert.equal(scheduledSyncs, 0, 'local save must not schedule an invalid WebDAV route');

  await engine.saveAll({
    settings: {
      syncProviders: {
        metadata: {
          provider: 'webdav',
          config: { url: 'https://dav.example.com/dav' }
        }
      }
    }
  });
  assert.equal(scheduledSyncs, 1, 'local save should schedule a complete WebDAV route');

  console.log('storage sync configuration tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
