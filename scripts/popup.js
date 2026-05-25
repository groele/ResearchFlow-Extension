/**
 * ResearchFlow Companion - Popup Controller
 */

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
      const tabTitle = tab.title;

      // Extract DOI using standard regex
      const doiRegex = /(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i;
      const match = url.match(doiRegex) || tabTitle.match(doiRegex);
      
      if (match) {
        const detectedDoi = match[1];
        if (doiInput) doiInput.value = detectedDoi;
        if (banner) {
          banner.style.display = 'flex';
          document.getElementById('detected-status-text').textContent = `📄 Paper Found: ${detectedDoi}`;
        }
        
        // Clean and pre-fill paper title
        let cleanTitle = tabTitle
          .replace(/^(arXiv|PubMed|bioRxiv|Nature|Science|IEEE|Springer|Wiley|ACS)\s*(:|：|-)\s*/i, '')
          .replace(/\s*\|\s*.*$/g, '') // Remove site postfixes
          .replace(/\s*-\s*PubMed$/i, '')
          .trim();
        
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
        btnToggleProject.textContent = '✕ Cancel';
      } else {
        newProjectInput.style.display = 'none';
        projectSelect.style.display = 'block';
        btnToggleProject.textContent = '➕ New Project';
      }
    });
  }

  // Sync state in real time if background updates it
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'DATABASE_UPDATED') {
      db = message.data;
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
        alert('Please open the Sidepanel manually using Chrome Toolbar (Extensions -> ResearchFlow -> Toggle Sidepanel).');
      }
      window.close(); // Close popup
    } catch (e) {
      console.error(e);
      alert('Error opening Side Panel.');
    }
  });

  // Action: Save Research Note
  btnSaveNote.addEventListener('click', async () => {
    let projectId = null;
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();
    const doi = doiInput ? doiInput.value.trim() : '';

    if (!title) {
      showToast('Please enter a note title', 'error');
      return;
    }

    btnSaveNote.disabled = true;
    btnSaveNote.innerHTML = '<span class="loader"></span> Saving...';

    try {
      // Check if we need to create a new project inline on-the-fly
      if (newProjectInput && newProjectInput.style.display === 'block') {
        const newProjTitle = newProjectInput.value.trim();
        if (!newProjTitle) {
          showToast('Please enter a new project name', 'error');
          btnSaveNote.disabled = false;
          btnSaveNote.innerHTML = `Save Captured Note`;
          return;
        }
        
        // Create new project object matching the database schema
        const newProjId = 'proj_' + Math.random().toString(36).substring(2, 9);
        const newProj = {
          id: newProjId,
          userId: 'user',
          areaId: db.researchAreas[0]?.id || 'area_default',
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
        btnToggleProject.textContent = '➕ New Project';
      }

      // Re-populate project selector dropdown with the new project included
      populateProjects(db);
      updateMetrics(db);
      
      showToast('Research note captured successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save research note', 'error');
    } finally {
      btnSaveNote.disabled = false;
      btnSaveNote.innerHTML = `
        <svg class="svg-icon" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        Save Captured Note
      `;
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
    projectSelect.innerHTML = '<option value="">-- Uncategorized / Personal Notes --</option>';
    
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
    toast.className = `popup-toast badge badge-${type === 'success' ? 'success' : 'danger'}`;
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
