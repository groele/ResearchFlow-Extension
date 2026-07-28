(function attachSettingsModule(global) {
  'use strict';

  function render(app) {
    const profile = app.db.settings.profile || {};
    document.getElementById('profile-name').value = profile.displayName || '';
    document.getElementById('profile-affiliation').value = profile.affiliation || '';
    const provider = app.db.settings.syncProviders?.metadata?.provider || 'local';
    document.getElementById('sync-provider').value = provider;
  }

  function bind(app) {
    document.getElementById('settings-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.currentTarget));
      app.db.settings.profile = { ...(app.db.settings.profile || {}), displayName: values.displayName.trim(), affiliation: values.affiliation.trim() };
      app.db.settings.syncProviders = app.db.settings.syncProviders || {};
      app.db.settings.syncProviders.metadata = { ...(app.db.settings.syncProviders.metadata || {}), provider: values.provider };
      await app.save('Settings saved.');
    });
    document.getElementById('btn-export-db').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(app.db, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `researchflow-core-export-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    });
  }

  global.RFModules = global.RFModules || {};
  global.RFModules.settings = { render, bind };
}(window));
