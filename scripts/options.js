/* ResearchFlow options entrypoint: composition and lifecycle only. */
(function bootstrapOptions(global) {
  'use strict';

  const app = {
    db: null,
    activeView: 'view-dashboard',
    async save(message) {
      this.db = global.RFCore.normalizeDatabase(this.db);
      await global.storage.saveAll(this.db);
      this.render();
      if (message) this.toast(message);
    },
    render() {
      global.RFModules.dashboard.render(this);
      global.RFModules.settings.render(this);
    },
    toast(message) {
      const element = document.createElement('div');
      element.className = 'core-toast';
      element.textContent = message;
      document.getElementById('toast-region').append(element);
      setTimeout(() => element.remove(), 2600);
    },
    openModal(html) {
      document.getElementById('modal-card-content').innerHTML = html;
      const modal = document.getElementById('modal-container');
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      modal.querySelector('[data-close-modal]')?.addEventListener('click', () => this.closeModal());
    },
    closeModal() {
      const modal = document.getElementById('modal-container');
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.getElementById('modal-card-content').replaceChildren();
    },
    switchView(view) {
      this.activeView = view;
      document.querySelectorAll('.content-view').forEach((section) => section.classList.toggle('active', section.id === view));
      document.querySelectorAll('[data-view]').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
      this.render();
    }
  };

  global.RFApp = app;

  document.addEventListener('DOMContentLoaded', async () => {
    app.db = global.RFCore.normalizeDatabase(await global.storage.loadAll());
    app.render();
    global.RFModules.settings.bind(app);
    document.querySelectorAll('[data-view], [data-switch-view]').forEach((button) => button.addEventListener('click', () => app.switchView(button.dataset.view || button.dataset.switchView)));
    document.getElementById('modal-container').addEventListener('click', (event) => {
      if (event.target.id === 'modal-container') app.closeModal();
    });
    document.getElementById('btn-manual-sync').addEventListener('click', async () => {
      const result = await global.storage.syncDatabaseNow();
      app.toast(result?.success ? 'Sync complete.' : `Sync skipped: ${result?.error || 'no provider configured'}`);
    });
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action !== 'DATABASE_UPDATED') return;
      app.db = global.RFCore.normalizeDatabase(message.data);
      app.render();
    });
  });
}(window));
