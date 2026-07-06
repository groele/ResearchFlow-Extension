/**
 * ResearchFlow Companion - Popup Controller
 */

const POPUP_I18N = {
  en: {
    documentTitle: 'ResearchFlow Quick Panel',
    subtitle: 'Personal Research OS',
    openMasterDashboard: 'Open Master Dashboard',
    activeProjects: 'Active Projects',
    researchRecords: 'Research Records',
    openDashboard: 'Open Dashboard',
    openSidePanel: 'Open Side Panel',
    researchIntake: 'Research Intake',
    metadataDetected: 'Literature metadata detected',
    paperFound: 'Paper found: {doi}',
    targetProject: 'Target Project',
    newProject: 'New Project',
    cancel: 'Cancel',
    createNewProjectTitle: 'Create new project inline',
    uncategorized: '-- Uncategorized / Personal Notes --',
    newProjectPlaceholder: 'New project name...',
    titleLabel: 'Title / Paper Title',
    titlePlaceholder: 'e.g. Discussed cell morphology result',
    doiLabel: 'DOI / Literature URL',
    doiPlaceholder: 'e.g. 10.1038/s41565-024-01567-2',
    notesLabel: 'Summary / Notes / Findings',
    notesPlaceholder: 'Enter quick observation, thoughts, or abstract highlights...',
    saveCapturedNote: 'Save Captured Note',
    saving: 'Saving...',
    useToolbarForSidePanel: 'Use Chrome toolbar to open the side panel',
    errorOpeningSidePanel: 'Error opening side panel',
    enterNoteTitle: 'Please enter a note title',
    enterNewProjectName: 'Please enter a new project name',
    captureSuccess: 'Research note captured successfully!',
    captureFailed: 'Failed to save research note'
  },
  zh: {
    documentTitle: 'ResearchFlow 快速面板',
    subtitle: '个人科研工作台',
    openMasterDashboard: '打开主仪表盘',
    activeProjects: '进行中项目',
    researchRecords: '研究记录',
    openDashboard: '打开仪表盘',
    openSidePanel: '打开侧边工作区',
    researchIntake: '研究采集',
    metadataDetected: '检测到文献信息',
    paperFound: '已识别文献 DOI：{doi}',
    targetProject: '目标项目',
    newProject: '新建项目',
    cancel: '取消',
    createNewProjectTitle: '在当前面板中新建项目',
    uncategorized: '-- 未归类 / 个人笔记 --',
    newProjectPlaceholder: '新项目名称...',
    titleLabel: '题目 / 论文题目',
    titlePlaceholder: '例如：讨论细胞形貌结果',
    doiLabel: 'DOI / 文献链接',
    doiPlaceholder: '例如：10.1038/s41565-024-01567-2',
    notesLabel: '摘要 / 笔记 / 发现',
    notesPlaceholder: '输入快速观察、想法或摘要重点...',
    saveCapturedNote: '保存采集笔记',
    saving: '保存中...',
    useToolbarForSidePanel: '请使用 Chrome 工具栏打开侧边工作区',
    errorOpeningSidePanel: '打开侧边工作区失败',
    enterNoteTitle: '请输入笔记题目',
    enterNewProjectName: '请输入新项目名称',
    captureSuccess: '研究笔记已保存',
    captureFailed: '研究笔记保存失败'
  }
};

const POPUP_ICONS = {
  dashboard: '<svg class="svg-icon" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
  sidepanel: '<svg class="svg-icon" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>',
  save: '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>'
};

let popupLanguage = 'en';

function pt(key, params = {}) {
  const template = POPUP_I18N[popupLanguage]?.[key] || POPUP_I18N.en[key] || key;
  return Object.entries(params).reduce(
    (text, [paramKey, value]) => text.replaceAll(`{${paramKey}}`, value ?? ''),
    template
  );
}

function setPopupText(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

function setPopupPlaceholder(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.placeholder = value;
}

function setPopupButtonHtml(selector, icon, label) {
  const el = document.querySelector(selector);
  if (el) el.innerHTML = `${icon}\n        ${label}`;
}

function saveButtonHtml() {
  return `${POPUP_ICONS.save}\n        ${pt('saveCapturedNote')}`;
}

function applyPopupLanguage() {
  document.documentElement.lang = popupLanguage === 'zh' ? 'zh-CN' : 'en';
  document.title = pt('documentTitle');

  setPopupText('.subtitle', pt('subtitle'));
  document.getElementById('btn-options')?.setAttribute('title', pt('openMasterDashboard'));
  document.getElementById('btn-toggle-project-creator')?.setAttribute('title', pt('createNewProjectTitle'));

  const metricLabels = document.querySelectorAll('.metric-label');
  if (metricLabels[0]) metricLabels[0].textContent = pt('activeProjects');
  if (metricLabels[1]) metricLabels[1].textContent = pt('researchRecords');

  setPopupButtonHtml('#btn-open-master', POPUP_ICONS.dashboard, pt('openDashboard'));
  setPopupButtonHtml('#btn-sidepanel', POPUP_ICONS.sidepanel, pt('openSidePanel'));
  setPopupText('.quick-capture h3', pt('researchIntake'));

  const banner = document.getElementById('paper-detected-banner');
  const detectedText = document.getElementById('detected-status-text');
  if (detectedText && (!banner || banner.style.display === 'none')) {
    detectedText.textContent = pt('metadataDetected');
  }

  setPopupText('label[for="project-select"]', pt('targetProject'));
  setPopupText('label[for="note-title"]', pt('titleLabel'));
  setPopupText('label[for="note-doi"]', pt('doiLabel'));
  setPopupText('label[for="note-content"]', pt('notesLabel'));
  setPopupPlaceholder('#new-project-input', pt('newProjectPlaceholder'));
  setPopupPlaceholder('#note-title', pt('titlePlaceholder'));
  setPopupPlaceholder('#note-doi', pt('doiPlaceholder'));
  setPopupPlaceholder('#note-content', pt('notesPlaceholder'));

  const newProjectInput = document.getElementById('new-project-input');
  const toggleButton = document.getElementById('btn-toggle-project-creator');
  if (toggleButton) {
    toggleButton.textContent = newProjectInput?.style.display === 'block' ? pt('cancel') : pt('newProject');
  }

  const saveButton = document.getElementById('btn-save-note');
  if (saveButton && !saveButton.disabled) saveButton.innerHTML = saveButtonHtml();
}

document.addEventListener('DOMContentLoaded', async () => {
  // Load elements
  const metricProjects = document.getElementById('metric-projects');
  const metricRecords = document.getElementById('metric-records');
  const projectSelect = document.getElementById('project-select');
  const noteTitleInput = document.getElementById('note-title');
  const noteContentInput = document.getElementById('note-content');
  
  const btnOptions = document.getElementById('btn-options');
  const btnOpenMaster = document.getElementById('btn-open-master');
  const btnSidepanel = document.getElementById('btn-sidepanel');
  const btnSaveNote = document.getElementById('btn-save-note');

  // Load database
  let db = await window.storage.loadAll();
  popupLanguage = db.settings?.profile?.language || 'en';
  applyPopupLanguage();
  updateMetrics(db);
  populateProjects(db);

  // Auto-detect Active Tab Paper Metadata on load
  const banner = document.getElementById('paper-detected-banner');
  const doiInput = document.getElementById('note-doi');
  
  if (banner) banner.style.display = 'none';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const url = tab.url;
      const tabTitle = tab.title || '';

      // Extract DOI using standard regex
      const detectedDoi = window.RFUI.cleanDoiFromText(url) || window.RFUI.cleanDoiFromText(tabTitle);
      
      if (detectedDoi) {
        if (doiInput) doiInput.value = detectedDoi;
        if (banner) {
          banner.style.display = 'flex';
          document.getElementById('detected-status-text').textContent = pt('paperFound', { doi: detectedDoi });
        }
        
        // Clean and pre-fill paper title
        let cleanTitle = window.RFUI.cleanResearchTitle(tabTitle);
        
        if (noteTitleInput) noteTitleInput.value = cleanTitle;
      }
    }
  } catch (e) {
    console.error('Metadata auto-detection failed:', e);
  }

  // Toggle Project Creator
  const btnToggleProject = document.getElementById('btn-toggle-project-creator');
  const newProjectInput = document.getElementById('new-project-input');

  if (btnToggleProject) {
    btnToggleProject.addEventListener('click', () => {
      if (newProjectInput.style.display === 'none') {
        newProjectInput.style.display = 'block';
        newProjectInput.value = '';
        projectSelect.style.display = 'none';
        btnToggleProject.textContent = pt('cancel');
      } else {
        newProjectInput.style.display = 'none';
        projectSelect.style.display = 'block';
        btnToggleProject.textContent = pt('newProject');
      }
    });
  }

  // Sync state in real time if background updates it
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'DATABASE_UPDATED') {
      db = message.data;
      popupLanguage = db.settings?.profile?.language || popupLanguage;
      applyPopupLanguage();
      updateMetrics(db);
      populateProjects(db);
    }
  });

  // Action: Open Full Dashboard
  btnOptions.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('pages/options.html') });
  });

  btnOpenMaster.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('pages/options.html') });
  });

  // Action: Toggle Sidepanel Workspace
  btnSidepanel.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;
      
      // Chrome Extension API to programmatically open the sidepanel
      if (chrome.sidePanel && typeof chrome.sidePanel.open === 'function') {
        chrome.sidePanel.open({ windowId: tab.windowId });
      } else {
        showToast(pt('useToolbarForSidePanel'), 'info');
        return;
      }
      window.close(); // Close popup
    } catch (e) {
      console.error(e);
      showToast(pt('errorOpeningSidePanel'), 'danger');
    }
  });

  // Action: Save Research Note
  btnSaveNote.addEventListener('click', async () => {
    let projectId = null;
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();
    const doi = doiInput ? doiInput.value.trim() : '';

    if (!title) {
      showToast(pt('enterNoteTitle'), 'error');
      return;
    }

    btnSaveNote.disabled = true;
    btnSaveNote.innerHTML = `<span class="loader"></span> ${pt('saving')}`;

    try {
      // Check if we need to create a new project inline on-the-fly
      if (newProjectInput && newProjectInput.style.display === 'block') {
        const newProjTitle = newProjectInput.value.trim();
        if (!newProjTitle) {
          showToast(pt('enterNewProjectName'), 'error');
          btnSaveNote.disabled = false;
          btnSaveNote.innerHTML = saveButtonHtml();
          return;
        }
        
        // Create new project object matching the database schema
        const newProjId = 'proj_' + Math.random().toString(36).substring(2, 9);
        const newProj = {
          id: newProjId,
          userId: 'user',
          areaId: db.researchAreas?.[0]?.id || 'area_default',
          title: newProjTitle,
          discipline: 'General',
          description: 'Created inline via Quick Capture Panel',
          hypothesis: null,
          objectives: null,
          currentStage: 'idea',
          status: 'active',
          tags: ['captured-inline'],
          customFields: {},
          externalRef: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        db.projects.push(newProj);
        projectId = newProjId;
      } else {
        projectId = projectSelect.value || null; // Nullable for uncategorized!
      }

      const isLiterature = !!doi || (noteTitleInput.value.toLowerCase().includes('review') || noteContentInput.value.toLowerCase().includes('doi'));
      const recordType = isLiterature ? 'literature_review' : 'other';

      // Create new record complying with the system's schema
      const newRecord = {
        id: 'rec_' + Math.random().toString(36).substring(2, 9),
        userId: 'user',
        projectId: projectId,
        schemaTemplateId: null,
        title: title,
        recordType: recordType,
        methodology: isLiterature ? 'Literature captured via intake panel' : 'Captured via Chrome Quick Note',
        recordedDate: new Date().toISOString(),
        attributes: doi ? { doi: doi } : {},
        dataPath: null,
        externalRef: null,
        summary: content,
        tags: isLiterature ? ['quick-capture', 'literature'] : ['quick-capture'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.researchRecords.push(newRecord);
      await window.storage.saveAll(db);

      // Clean inputs
      noteTitleInput.value = '';
      noteContentInput.value = '';
      if (doiInput) doiInput.value = '';
      if (banner) banner.style.display = 'none';

      // Reset inline project creator if active
      if (newProjectInput && newProjectInput.style.display === 'block') {
        newProjectInput.style.display = 'none';
        projectSelect.style.display = 'block';
        btnToggleProject.textContent = pt('newProject');
      }

      // Re-populate project selector dropdown with the new project included
      populateProjects(db);
      updateMetrics(db);
      
      showToast(pt('captureSuccess'), 'success');
    } catch (err) {
      console.error(err);
      showToast(pt('captureFailed'), 'error');
    } finally {
      btnSaveNote.disabled = false;
      btnSaveNote.innerHTML = saveButtonHtml();
    }
  });

  // Helper: Update Metric labels
  function updateMetrics(database) {
    const activeProjects = database.projects.filter(p => p.status === 'active' || p.status === 'planning');
    metricProjects.textContent = activeProjects.length;
    metricRecords.textContent = database.researchRecords.length;
  }

  // Helper: Populate target projects selector
  function populateProjects(database) {
    // Keep initial option (default to Uncategorized staging ground!)
    projectSelect.innerHTML = `<option value="">${pt('uncategorized')}</option>`;
    
    // Sort active projects first
    const sorted = [...database.projects].sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return 0;
    });

    sorted.forEach(proj => {
      const opt = document.createElement('option');
      opt.value = proj.id;
      opt.textContent = `${proj.title} [${proj.status}]`;
      projectSelect.appendChild(opt);
    });
  }

  // Helper: Show Feedback Toast in HTML
  function showToast(message, type = 'success') {
    const existing = document.querySelector('.popup-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `popup-toast ${window.RFUI.getToastBadgeClass(type)}`;
    toast.style.position = 'fixed';
    toast.style.bottom = '12px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.zIndex = '9999';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
    toast.style.animation = 'slideIn 0.25s forwards';
    toast.textContent = message;

    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2500);
  }
});
