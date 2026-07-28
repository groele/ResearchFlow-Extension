/* ResearchFlow side panel: fast capture and project-scoped working notes. */
(function bootstrapSidePanel(global) {
  'use strict';
  let db;
  let scratchpadTimer;

  const byId = (id) => document.getElementById(id);
  const escape = global.RFUI.escapeHTML;

  function toast(message) {
    const item = document.createElement('div');
    item.className = 'core-toast';
    item.textContent = message;
    byId('side-toast').append(item);
    setTimeout(() => item.remove(), 2600);
  }

  function selectedProjectId() {
    return byId('side-project-select').value || null;
  }

  function renderProjects() {
    const selected = selectedProjectId();
    byId('side-project-select').innerHTML = `<option value="">Unassigned</option>${db.projects.map((project) => `<option value="${escape(project.id)}" ${project.id === selected ? 'selected' : ''}>${escape(project.title)}</option>`).join('')}`;
  }

  function renderTasks() {
    const projectId = selectedProjectId();
    const tasks = db.tasks.filter((task) => !projectId || task.projectId === projectId);
    byId('side-tasks-list').innerHTML = tasks.length ? tasks.map((task) => `<label class="core-task"><input type="checkbox" data-task-id="${escape(task.id)}" ${task.completed ? 'checked' : ''}><span>${escape(task.title || 'Untitled task')}</span></label>`).join('') : '<p class="empty-state">Add the next concrete action for this project.</p>';
  }

  async function persist(message) {
    await global.storage.saveAll(db);
    renderProjects();
    renderTasks();
    if (message) toast(message);
  }

  async function scrapeCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab is available.');
    const request = () => new Promise((resolve, reject) => chrome.tabs.sendMessage(tab.id, { action: 'SCRAPE_PAGE' }, (response) => {
      const error = chrome.runtime.lastError;
      if (error) reject(error);
      else resolve(response);
    }));
    let metadata;
    try { metadata = await request(); }
    catch (_) {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['scripts/content.js'] });
      metadata = await request();
    }
    if (!metadata) throw new Error('No paper metadata was found on this page.');
    return { ...metadata, sourceUrl: tab.url || '' };
  }

  function fillCaptureForm(metadata) {
    byId('meta-title').value = metadata.title || '';
    byId('meta-doi').value = metadata.doi || '';
    byId('meta-source-url').value = metadata.pdfUrl || metadata.sourceUrl || '';
    byId('meta-summary').value = metadata.abstract || metadata.description || '';
    byId('meta-tags').value = (metadata.keywords || []).join(', ');
  }

  document.addEventListener('DOMContentLoaded', async () => {
    db = global.RFCore.normalizeDatabase(await global.storage.loadAll());
    renderProjects();
    renderTasks();
    chrome.storage.local.get(['researchflow_scratchpad'], (result) => { byId('scratchpad').value = result.researchflow_scratchpad || ''; });

    document.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => {
      document.querySelectorAll('[data-tab]').forEach((item) => item.classList.toggle('active', item === button));
      document.querySelectorAll('.tab-pane').forEach((pane) => pane.classList.toggle('active', pane.id === button.dataset.tab));
    }));
    byId('btn-options').addEventListener('click', () => chrome.tabs.create({ url: chrome.runtime.getURL('pages/options.html') }));
    byId('side-project-select').addEventListener('change', renderTasks);
    byId('btn-scrape').addEventListener('click', async () => {
      const button = byId('btn-scrape');
      button.disabled = true;
      button.textContent = 'Capturing…';
      try { fillCaptureForm(await scrapeCurrentTab()); toast('Metadata captured. Review and save it to your library.'); }
      catch (error) { toast(error.message || 'Capture failed. You can enter the record manually.'); }
      finally { button.disabled = false; button.textContent = 'Capture current paper'; }
    });
    byId('capture-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.currentTarget));
      values.projectId = selectedProjectId();
      try { global.RFCore.upsertRecord(db, values); await persist('Saved to your research library.'); event.currentTarget.reset(); }
      catch (error) { toast(error.message); }
    });
    byId('btn-add-task').addEventListener('click', async () => {
      const title = prompt('What is the next concrete action?');
      if (!title?.trim()) return;
      db.tasks.push({ id: `task_${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`, title: title.trim(), projectId: selectedProjectId(), completed: false, createdAt: new Date().toISOString() });
      await persist('Task added.');
    });
    byId('side-tasks-list').addEventListener('change', async (event) => {
      const task = db.tasks.find((item) => item.id === event.target.dataset.taskId);
      if (!task) return;
      task.completed = event.target.checked;
      task.updatedAt = new Date().toISOString();
      await persist('Task updated.');
    });
    byId('scratchpad').addEventListener('input', (event) => {
      clearTimeout(scratchpadTimer);
      scratchpadTimer = setTimeout(() => chrome.storage.local.set({ researchflow_scratchpad: event.target.value }), 400);
    });
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'DATABASE_UPDATED') { db = global.RFCore.normalizeDatabase(message.data); renderProjects(); renderTasks(); }
    });
  });
}(window));
