/**
 * ResearchFlow Companion - Side Panel Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const sideProjectSelect = document.getElementById('side-project-select');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const btnOptions = document.getElementById('btn-options');

  // Tab 1: Capture
  const btnScrape = document.getElementById('btn-scrape');
  const metaTitle = document.getElementById('meta-title');
  const metaDoi = document.getElementById('meta-doi');
  const metaAuthors = document.getElementById('meta-authors');
  const metaAbstract = document.getElementById('meta-abstract');
  const metaPdf = document.getElementById('meta-pdf');
  const btnSaveRecord = document.getElementById('btn-save-record');
  const btnSaveEvidence = document.getElementById('btn-save-evidence');
  
  // New Citation previewer bindings
  const secCitation = document.getElementById('sec-citation');
  const selCitationStyle = document.getElementById('sel-citation-style');
  const citationText = document.getElementById('citation-text');
  const btnCopyCitation = document.getElementById('btn-copy-citation');

  // New Structured Reading Dimensions bindings
  const detailsStructuredNotes = document.getElementById('details-structured-notes');
  const metaBreakthrough = document.getElementById('meta-breakthrough');
  const metaEquations = document.getElementById('meta-equations');
  const metaDatasets = document.getElementById('meta-datasets');
  const metaLimitations = document.getElementById('meta-limitations');

  // Tab 2: AI Copilot
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const btnChatSend = document.getElementById('btn-chat-send');
  const btnAiSummarize = document.getElementById('btn-ai-summarize');
  const btnAiRebuttal = document.getElementById('btn-ai-rebuttal');

  // Tab 3: Notes & Tasks
  const scratchpad = document.getElementById('scratchpad');
  const btnAddTask = document.getElementById('btn-add-task');
  const sideTasksList = document.getElementById('side-tasks-list');

  // Database State
  let db = await window.storage.loadAll();
  populateProjects(db);
  loadScratchpad();

  // Listeners for global database changes
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'DATABASE_UPDATED') {
      db = message.data;
      populateProjects(db);
      renderTasks();
    }
  });

  // Action: Open Full Dashboard
  btnOptions.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('pages/options.html') });
  });

  // Action: Switch Tabs
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(tabId).classList.add('active');
      if (tabId === 'tab-capture') scheduleAutoCapture();
    });
  });

  // Context Selection Change
  sideProjectSelect.addEventListener('change', () => {
    renderTasks();
  });

  // --- TAB 1: CAPTURE LITERATURE LOGIC ---
  btnScrape.addEventListener('click', async () => {
    btnScrape.disabled = true;
    btnScrape.innerHTML = '<span class="loader"></span> Scanning DOM...';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        showNotification('No active tab found', 'danger');
        return;
      }

      // Inject content script if not loaded (helps in dynamic page sessions)
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['scripts/content.js']
        });
      } catch (e) {
        // Already loaded or restricted page
      }

      // Scrape
      chrome.tabs.sendMessage(tab.id, { action: 'SCRAPE_PAGE' }, (response) => {
        if (chrome.runtime.lastError || !response) {
          showNotification('Could not read page metadata. Try refreshing.', 'warning');
          // Fill fallback URL
          metaPdf.value = tab.url;
          metaTitle.value = tab.title;
        } else {
          metaTitle.value = response.title || '';
          metaDoi.value = response.doi || '';
          metaAuthors.value = Array.isArray(response.authors) ? response.authors.join(', ') : '';
          metaAbstract.value = response.abstract || '';
          metaPdf.value = response.pdfUrl || response.sourceUrl || tab.url;
          showNotification('Page metadata parsed successfully!', 'success');
          updateCitationPreview(); // Compile initial citation preview

          // EXTREME PROFESSIONAL UX: Silent background AI structured parameter extraction
          if (db.settings?.ai?.apiKey && response.abstract) {
            showNotification('AI is extracting key scientific parameters...', 'info');
            detailsStructuredNotes.open = true; // Auto expand to highlight the magic
            
            metaBreakthrough.placeholder = '🔬 AI is analyzing breakthroughs...';
            metaEquations.placeholder = '🔬 AI is mapping methods...';
            metaDatasets.placeholder = '🔬 AI is identifying tools...';
            metaLimitations.placeholder = '🔬 AI is locating limitations...';

            const aiPrompt = `Title: ${response.title}\nAbstract: ${response.abstract}\nURL: ${tab.url}`;
            const aiSystemPrompt = `You are a scientific data miner. Extract the paper key parameters as a clean JSON object ONLY. Respond ONLY in valid JSON. JSON format:
            {
              "breakthrough": "Concise core novelty or breakthrough",
              "equations": "Key methods, materials, or math equations cited",
              "datasets": "Datasets, tools, or compute platforms used",
              "limitations": "Direct limitations or unresolved challenges mentioned"
            }`;

            window.aiCopilot.generateCompletion(aiPrompt, aiSystemPrompt, true)
              .then(aiRes => {
                const parsed = JSON.parse(aiRes);
                metaBreakthrough.value = parsed.breakthrough || '';
                metaEquations.value = parsed.equations || '';
                metaDatasets.value = parsed.datasets || '';
                metaLimitations.value = parsed.limitations || '';
                updateCitationPreview();
                showNotification('AI key parameter extraction complete!', 'success');
              })
              .catch(() => {
                // Reset standard placeholders
                metaBreakthrough.placeholder = 'e.g. Novel carbon anode design';
                metaEquations.placeholder = 'e.g. CVD synthesis, Eq (3)';
                metaDatasets.placeholder = 'e.g. arXiv corpus, PyTorch';
                metaLimitations.placeholder = 'e.g. Poor cyclability';
              });
          }
        }
        btnScrape.disabled = false;
        btnScrape.innerHTML = `
          <svg class="svg-icon" viewBox="0 0 24 24"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          Capture Active Page
        `;
      });
    } catch (err) {
      console.error(err);
      showNotification('Extraction failed', 'danger');
      btnScrape.disabled = false;
      btnScrape.innerHTML = 'Capture Active Page';
    }
  });

  // Save parsed metadata as a literature review ResearchRecord
  btnSaveRecord.addEventListener('click', async () => {
    const projectId = sideProjectSelect.value;
    if (!projectId) {
      showNotification('Please select an active project first', 'danger');
      return;
    }

    const title = metaTitle.value.trim();
    if (!title) {
      showNotification('Title is required', 'danger');
      return;
    }

    btnSaveRecord.disabled = true;
    try {
      const authors = metaAuthors.value.split(',').map(a => a.trim()).filter(Boolean);
      const newRecord = {
        id: 'rec_' + Math.random().toString(36).substring(2, 9),
        userId: 'user',
        projectId: projectId,
        schemaTemplateId: null,
        title: title,
        recordType: 'literature_review',
        methodology: 'Literature captured via Chrome',
        recordedDate: new Date().toISOString(),
        attributes: {
          doi: metaDoi.value.trim(),
          authors: authors,
          pdfUrl: metaPdf.value.trim(),
          structuredNotes: {
            breakthrough: metaBreakthrough.value.trim(),
            equations: metaEquations.value.trim(),
            datasets: metaDatasets.value.trim(),
            limitations: metaLimitations.value.trim()
          }
        },
        dataPath: metaPdf.value.trim(),
        externalRef: metaDoi.value.trim(),
        summary: metaAbstract.value.trim(),
        tags: ['captured-literature'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.researchRecords.push(newRecord);
      await window.storage.saveAll(db);
      showNotification('Literature Record logged!', 'success');
    } catch (e) {
      showNotification('Save failed', 'danger');
    } finally {
      btnSaveRecord.disabled = false;
    }
  });

  // Save page as evidence
  btnSaveEvidence.addEventListener('click', async () => {
    const projectId = sideProjectSelect.value;
    if (!projectId) {
      showNotification('Please select an active project first', 'danger');
      return;
    }

    const title = metaTitle.value.trim();
    if (!title) {
      showNotification('Title is required', 'danger');
      return;
    }

    btnSaveEvidence.disabled = true;
    try {
      const newEvidence = {
        id: 'ev_' + Math.random().toString(36).substring(2, 9),
        userId: 'user',
        projectId: projectId,
        title: title,
        description: `Literature bookmark with DOI ${metaDoi.value}`,
        evidenceType: 'url',
        filePath: metaPdf.value.trim(),
        fileSize: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.evidence.push(newEvidence);
      await window.storage.saveAll(db);
      showNotification('Evidence linked to project!', 'success');
    } catch (e) {
      showNotification('Failed to link evidence', 'danger');
    } finally {
      btnSaveEvidence.disabled = false;
    }
  });

  // --- TAB 2: AI COPILOT LOGIC ---
  btnChatSend.addEventListener('click', () => sendUserMessage());
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendUserMessage();
    }
  });

  async function sendUserMessage(overridePrompt = null) {
    const prompt = overridePrompt || chatInput.value.trim();
    if (!prompt) return;

    if (!overridePrompt) chatInput.value = '';

    // Append user message
    appendMessage(prompt, 'user');
    const loadingBubble = appendMessage('<span class="loader"></span> AI is thinking...', 'ai');

    try {
      const response = await window.aiCopilot.generateCompletion(prompt);
      loadingBubble.innerHTML = formatMarkdown(response);
    } catch (e) {
      loadingBubble.textContent = `Error: ${e.message}. Make sure your OpenAI/DeepSeek API Key is configured in Settings.`;
    }
  }

  // Quick Action: Summarize
  btnAiSummarize.addEventListener('click', async () => {
    const title = metaTitle.value.trim() || 'Active Web Page';
    const abstract = metaAbstract.value.trim() || 'No abstract captured yet. Please capture active page first.';
    
    appendMessage(`Please summarize the paper: "${title}"`, 'user');
    const loadingBubble = appendMessage('<span class="loader"></span> Processing summary...', 'ai');

    try {
      const summary = await window.aiCopilot.summarizePaper(title, abstract);
      loadingBubble.innerHTML = formatMarkdown(summary);
    } catch (e) {
      loadingBubble.textContent = `Error: ${e.message}. Set your AI credentials in Settings.`;
    }
  });

  // Quick Action: Review response
  btnAiRebuttal.addEventListener('click', async () => {
    const abstract = metaAbstract.value.trim();
    if (!abstract) {
      showNotification('Capture literature abstract first', 'warning');
      return;
    }

    const comment = prompt("Enter reviewer comment to respond to:");
    if (!comment) return;

    appendMessage(`Generate rebuttal response for reviewer comment: "${comment}"`, 'user');
    const loadingBubble = appendMessage('<span class="loader"></span> Drafting rebuttal response...', 'ai');

    try {
      const response = await window.aiCopilot.generateReviewResponse(comment, 'Use experimental proof-of-concept from captured abstract.', abstract);
      loadingBubble.innerHTML = formatMarkdown(response);
    } catch (e) {
      loadingBubble.textContent = `Error: ${e.message}`;
    }
  });

  function appendMessage(text, sender) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    bubble.innerHTML = text;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return bubble;
  }

  // Simple Markdown Formatter
  function formatMarkdown(text) {
    return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.08); padding: 2px 4px; border-radius: 4px;">$1</code>');
  }

  // --- TAB 3: NOTES & TASKS LOGIC ---
  // Working Scratchpad Autosave
  let scratchpadTimeout;
  scratchpad.addEventListener('input', () => {
    clearTimeout(scratchpadTimeout);
    scratchpadTimeout = setTimeout(() => {
      chrome.storage.local.set({ researchflow_scratchpad: scratchpad.value });
    }, 500); // Debounce save
  });

  async function loadScratchpad() {
    chrome.storage.local.get(['researchflow_scratchpad'], (result) => {
      if (result.researchflow_scratchpad) {
        scratchpad.value = result.researchflow_scratchpad;
      }
    });
  }

  // Add checklist task
  btnAddTask.addEventListener('click', async () => {
    const projectId = sideProjectSelect.value;
    if (!projectId) {
      showNotification('Select active project context', 'warning');
      return;
    }

    const taskTitle = prompt('Enter new task description:');
    if (!taskTitle || !taskTitle.trim()) return;

    const newTask = {
      id: 'task_' + Math.random().toString(36).substring(2, 9),
      userId: 'user',
      projectId: projectId,
      title: taskTitle.trim(),
      description: 'Quick task logged from Sidepanel Workspace',
      status: 'todo',
      priority: 3,
      dueDate: null,
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.tasks.push(newTask);
    await window.storage.saveAll(db);
    renderTasks();
  });

  function renderTasks() {
    const projectId = sideProjectSelect.value;
    sideTasksList.innerHTML = '';

    if (!projectId) {
      sideTasksList.innerHTML = '<p class="empty-state">Select a project context to view tasks.</p>';
      return;
    }

    const projectTasks = db.tasks.filter(t => t.projectId === projectId);
    if (projectTasks.length === 0) {
      sideTasksList.innerHTML = '<p class="empty-state">No checklist tasks recorded. Click + Add Task.</p>';
      return;
    }

    projectTasks.forEach(task => {
      const item = document.createElement('div');
      item.className = `task-item ${task.status === 'completed' ? 'completed' : ''}`;
      
      const left = document.createElement('div');
      left.className = 'task-item-left';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.status === 'completed';
      checkbox.addEventListener('change', async () => {
        task.status = checkbox.checked ? 'completed' : 'todo';
        task.completedAt = checkbox.checked ? new Date().toISOString() : null;
        task.updatedAt = new Date().toISOString();
        
        await window.storage.saveAll(db);
        item.classList.toggle('completed', checkbox.checked);
      });

      const span = document.createElement('span');
      span.textContent = task.title;
      
      left.appendChild(checkbox);
      left.appendChild(span);

      const delBtn = document.createElement('button');
      delBtn.className = 'task-delete';
      delBtn.innerHTML = '🗑️';
      delBtn.addEventListener('click', async () => {
        db.tasks = db.tasks.filter(t => t.id !== task.id);
        await window.storage.saveAll(db);
        renderTasks();
      });

      item.appendChild(left);
      item.appendChild(delBtn);
      sideTasksList.appendChild(item);
    });
  }

  // --- GENERAL HELPERS ---
  function populateProjects(database) {
    const prevSelected = sideProjectSelect.value;
    sideProjectSelect.innerHTML = '<option value="">-- No Active Project Selected --</option>';
    
    database.projects.forEach(proj => {
      const opt = document.createElement('option');
      opt.value = proj.id;
      opt.textContent = proj.title;
      if (proj.id === prevSelected) opt.selected = true;
      sideProjectSelect.appendChild(opt);
    });
  }

  // --- ACADEMIC CITATION GENERATOR LOGIC ---
  function updateCitationPreview() {
    const title = metaTitle.value.trim();
    const rawAuthors = metaAuthors.value.trim();
    const doi = metaDoi.value.trim();
    const pdf = metaPdf.value.trim();
    const style = selCitationStyle.value;

    if (!title) {
      secCitation.style.display = 'none';
      return;
    }

    secCitation.style.display = 'block';
    const authorsList = rawAuthors.split(',').map(a => a.trim()).filter(Boolean);
    const year = new Date().getFullYear();
    let compiled = '';

    if (style === 'apa') {
      let authorStr = 'Anon.';
      if (authorsList.length > 0) {
        authorStr = authorsList.map(a => {
          const parts = a.split(' ');
          const last = parts[parts.length - 1] || '';
          const firstInit = parts[0] ? parts[0][0] + '.' : '';
          return last ? `${last}, ${firstInit}` : a;
        }).join(', ');
      }
      compiled = `${authorStr} (${year}). <em>${title}</em>. Scholarly Database. ${doi ? 'https://doi.org/' + doi : pdf}`;
    } else if (style === 'mla') {
      let authorStr = 'Anon.';
      if (authorsList.length > 0) {
        if (authorsList.length > 2) {
          authorStr = authorsList[0] + ', et al.';
        } else {
          authorStr = authorsList.join(' and ');
        }
      }
      compiled = `${authorStr} "${title}." <em>Journal/Preprint</em>, ${year}, ${doi ? 'doi:' + doi : pdf}.`;
    } else if (style === 'bibtex') {
      const citeKey = authorsList[0] ? authorsList[0].split(' ').pop().toLowerCase() + year + title.split(' ')[0].toLowerCase() : 'paper' + year;
      let authorStr = 'Anon';
      if (authorsList.length > 0) {
        authorStr = authorsList.join(' and ');
      }
      compiled = `@article{${citeKey.replace(/[^a-zA-Z0-9]/g, '')},<br>` +
                 `  author = {${authorStr}},<br>` +
                 `  title = {${title}},<br>` +
                 `  year = {${year}},<br>` +
                 `  journal = {Scholarly Portal},<br>` +
                 (doi ? `  doi = {${doi}},<br>` : '') +
                 `  url = {${pdf}}<br>` +
                 `}`;
    }

    citationText.innerHTML = compiled;
  }

  // Real-time input watchers to update citation instantly when typing
  [metaTitle, metaAuthors, metaDoi, metaPdf].forEach(input => {
    input.addEventListener('input', updateCitationPreview);
  });
  
  selCitationStyle.addEventListener('change', updateCitationPreview);
  
  btnCopyCitation.addEventListener('click', () => {
    const textToCopy = citationText.innerText || citationText.textContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
      showNotification('Citation copied!', 'success');
    }).catch(() => {
      showNotification('Failed to copy', 'warning');
    });
  });

  function showNotification(msg, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `badge badge-${type === 'success' ? 'success' : 'warning'}`;
    notification.style.position = 'fixed';
    notification.style.top = '12px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
    notification.style.zIndex = '99999';
    notification.textContent = msg;

    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 2500);
  }

  let autoCaptureTimer = null;
  function scheduleAutoCapture() {
    clearTimeout(autoCaptureTimer);
    autoCaptureTimer = setTimeout(() => {
      const capturePaneActive = document.getElementById('tab-capture')?.classList.contains('active');
      if (capturePaneActive && !btnScrape.disabled) {
        btnScrape.click();
      }
    }, 500);
  }

  scheduleAutoCapture();
  chrome.tabs.onActivated.addListener(scheduleAutoCapture);
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status !== 'complete') return;
    chrome.tabs.query({ active: true, currentWindow: true }, ([activeTab]) => {
      if (activeTab?.id === tabId) scheduleAutoCapture();
    });
  });
});
