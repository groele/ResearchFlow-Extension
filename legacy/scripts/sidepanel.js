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

  // Listeners for global database changes and async PDF updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'DATABASE_UPDATED') {
      db = message.data;
      populateProjects(db);
      renderTasks();
    }

    // 阶段2: 接收Unpaywall后台异步PDF查询结果
    if (message.action === 'PDF_URL_FOUND' && message.source === 'unpaywall') {
      const currentPdf = metaPdf.value.trim();
      // 仅当当前PDF字段为空或仅含页面URL时才自动填充
      const currentTab = metaPdf.dataset.sourceUrl || '';
      if (!currentPdf || currentPdf === currentTab) {
        metaPdf.value = message.pdfUrl;
        metaPdf.dataset.unpaywallEnriched = 'true';
        showNotification('📄 Open access PDF found via Unpaywall!', 'success');
        updateCitationPreview();
      }
      // 移除「正在搜索」徽章
      document.getElementById('unpaywall-searching-badge')?.remove();
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

  // 按钮HTML常量提前声明，避免异步回调中引用前不存在的问题
  const SCRAPE_BTN_HTML = `
    <svg class="svg-icon" viewBox="0 0 24 24"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
    Capture Active Page
  `;

  btnScrape.addEventListener('click', async () => {
    btnScrape.disabled = true;
    btnScrape.innerHTML = '<span class="loader"></span> Scanning...';

    // 清理上次徽章
    document.getElementById('unpaywall-searching-badge')?.remove();
    delete metaPdf.dataset.unpaywallEnriched;
    delete metaPdf.dataset.sourceUrl;

    const resetBtn = () => {
      btnScrape.disabled = false;
      btnScrape.innerHTML = SCRAPE_BTN_HTML;
    };

    let tab;
    try {
      [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    } catch (e) {
      showNotification('Could not access browser tabs', 'danger');
      resetBtn();
      return;
    }

    if (!tab) {
      showNotification('No active tab found', 'danger');
      resetBtn();
      return;
    }

    // ══ 屃6：首先查询 background 缓存（命中则直接渲染，0ms）══
    try {
      const cached = await queryBackgroundCache(tab.id, tab.url);
      if (cached) {
        fillAndEnrich(cached, tab);
        resetBtn();
        return;
      }
    } catch (_) { /* 缓存查询失败，继续按需扫描 */ }

    // ══ 屃7: 缓存未命中 — 按需注入并扫描══
    btnScrape.innerHTML = '<span class="loader"></span> Detecting...';

    // 注入 content.js；如果已加载（IIFE guard 会静默返回），或受限页面则徽略
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['scripts/content.js']
      });
    } catch (e) {
      // 页面受限 / 已加载均属正常，继续发送消息
    }

    chrome.tabs.sendMessage(tab.id, { action: 'SCRAPE_PAGE' }, (response) => {
      // 必须先读取 lastError 否则 Chrome 会报“Unchecked runtime.lastError”警告
      const runtimeErr = chrome.runtime.lastError;
      if (runtimeErr || !response) {
        // 区分“页面受限”和“真实错误”
        const isRestricted = runtimeErr?.message?.includes('Cannot access') ||
                             runtimeErr?.message?.includes('receiving end');
        if (!isRestricted) {
          showNotification('Could not read page metadata. Try refreshing.', 'warning');
        } else {
          showNotification('This page type cannot be scanned.', 'info');
        }
        metaPdf.value = tab.url;
        metaPdf.dataset.sourceUrl = tab.url;
        metaTitle.value = tab.title || '';
      } else {
        fillAndEnrich(response, tab);
      }
      resetBtn();
    });
  });

  /**
   * 查询 background 内存缓存
   * @returns {Promise<object|null>} 元数据对象或 null
   */
  function queryBackgroundCache(tabId, url) {
    return new Promise(resolve => {
      try {
        chrome.runtime.sendMessage(
          { action: 'GET_CACHED_SCRAPE', tabId, url },
          (res) => {
            if (chrome.runtime.lastError) { resolve(null); return; }
            resolve(res?.hit ? res.metadata : null);
          }
        );
      } catch (_) { resolve(null); }
    });
  }

  /**
   * 将扫描结果填充到表单，并启动 Unpaywall 补充、AI 提取
   */
  function fillAndEnrich(response, tab) {
    metaTitle.value   = response.title   || '';
    metaDoi.value     = response.doi      || '';
    metaAuthors.value = Array.isArray(response.authors) ? response.authors.join(', ') : '';
    metaAbstract.value= response.abstract || '';
    metaPdf.dataset.sourceUrl = tab.url;

    if (response.pdfUrl) {
      metaPdf.value = response.pdfUrl;
      showNotification('✅ PDF detected!', 'success');
    } else {
      metaPdf.value = tab.url;
      showNotification('Page captured — searching open access PDF...', 'info');
    }

    updateCitationPreview();

    // Unpaywall 异步层—仅在没有PDF且有DOI时启动
    const hasPdf = !!response.pdfUrl;
    const doi = response.doi;
    if (!hasPdf && doi) {
      showUnpaywallSearchingBadge();
      chrome.runtime.sendMessage(
        { action: 'FETCH_PDF_VIA_UNPAYWALL', doi, tabId: tab.id },
        (res) => {
          // 必须先读取 lastError 否则报警
          void chrome.runtime.lastError;
          document.getElementById('unpaywall-searching-badge')?.remove();
          if (res?.success && res.pdfUrl) {
            const currentPdf = metaPdf.value.trim();
            if (!currentPdf || currentPdf === tab.url) {
              metaPdf.value = res.pdfUrl;
              metaPdf.dataset.unpaywallEnriched = 'true';
              updateCitationPreview();
              showNotification('📄 Open access PDF found via Unpaywall!', 'success');
            }
          }
        }
      );
    }

    // AI 结构化参数提取
    if (db.settings?.ai?.apiKey && response.abstract) {
      detailsStructuredNotes.open = true;
      metaBreakthrough.placeholder = '🔬 AI is analyzing breakthroughs...';
      metaEquations.placeholder    = '🔬 AI is mapping methods...';
      metaDatasets.placeholder     = '🔬 AI is identifying tools...';
      metaLimitations.placeholder  = '🔬 AI is locating limitations...';

      const aiPrompt       = `Title: ${response.title}\nAbstract: ${response.abstract}\nURL: ${tab.url}`;
      const aiSystemPrompt = `You are a scientific data miner. Extract the paper key parameters as a clean JSON object ONLY. Respond ONLY in valid JSON. JSON format:\n{\n  "breakthrough": "Concise core novelty or breakthrough",\n  "equations": "Key methods, materials, or math equations cited",\n  "datasets": "Datasets, tools, or compute platforms used",\n  "limitations": "Direct limitations or unresolved challenges mentioned"\n}`;

      window.aiCopilot.generateCompletion(aiPrompt, aiSystemPrompt, true)
        .then(aiRes => {
          try {
            const parsed = JSON.parse(aiRes);
            metaBreakthrough.value = parsed.breakthrough || '';
            metaEquations.value    = parsed.equations    || '';
            metaDatasets.value     = parsed.datasets     || '';
            metaLimitations.value  = parsed.limitations  || '';
            updateCitationPreview();
          } catch (_) {}
        })
        .catch(() => {
          metaBreakthrough.placeholder = 'e.g. Novel carbon anode design';
          metaEquations.placeholder    = 'e.g. CVD synthesis, Eq (3)';
          metaDatasets.placeholder     = 'e.g. arXiv corpus, PyTorch';
          metaLimitations.placeholder  = 'e.g. Poor cyclability';
        });
    }
  }

  // 显示Unpaywall搜索中徽章
  function showUnpaywallSearchingBadge() {
    document.getElementById('unpaywall-searching-badge')?.remove();
    const badge = document.createElement('div');
    badge.id = 'unpaywall-searching-badge';
    badge.style.cssText = [
      'display:flex', 'align-items:center', 'gap:6px', 'margin-top:4px',
      'font-size:10px', 'color:hsl(var(--text-muted))', 'padding:4px 8px',
      'background:rgba(99,102,241,0.1)', 'border-radius:6px',
      'border:1px solid rgba(99,102,241,0.25)'
    ].join(';');
    badge.innerHTML = '<span class="loader" style="width:10px;height:10px;border-width:1.5px;"></span> Searching open access (Unpaywall)...';
    metaPdf.closest('.form-group')?.after(badge);
  }

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
    const loadingBubble = appendLoadingMessage('AI is thinking...');

    try {
      const response = await window.aiCopilot.generateCompletion(prompt);
      renderSafeMarkdownInto(loadingBubble, response);
    } catch (e) {
      loadingBubble.textContent = `Error: ${e.message}. Make sure your OpenAI/DeepSeek API Key is configured in Settings.`;
    }
  }

  // Quick Action: Summarize
  btnAiSummarize.addEventListener('click', async () => {
    const title = metaTitle.value.trim() || 'Active Web Page';
    const abstract = metaAbstract.value.trim() || 'No abstract captured yet. Please capture active page first.';
    
    appendMessage(`Please summarize the paper: "${title}"`, 'user');
    const loadingBubble = appendLoadingMessage('Processing summary...');

    try {
      const summary = await window.aiCopilot.summarizePaper(title, abstract);
      renderSafeMarkdownInto(loadingBubble, summary);
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
    const loadingBubble = appendLoadingMessage('Drafting rebuttal response...');

    try {
      const response = await window.aiCopilot.generateReviewResponse(comment, 'Use experimental proof-of-concept from captured abstract.', abstract);
      renderSafeMarkdownInto(loadingBubble, response);
    } catch (e) {
      loadingBubble.textContent = `Error: ${e.message}`;
    }
  });

  function appendMessage(text, sender) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    bubble.textContent = text;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return bubble;
  }

  function appendLoadingMessage(label) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble ai';
    const loader = document.createElement('span');
    loader.className = 'loader';
    bubble.appendChild(loader);
    bubble.appendChild(document.createTextNode(` ${label}`));
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return bubble;
  }

  function renderSafeMarkdownInto(container, text) {
    container.textContent = '';
    const fragment = document.createDocumentFragment();
    const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\n)/g;
    let cursor = 0;
    String(text || '').replace(pattern, (match, _token, offset) => {
      appendPlain(fragment, String(text).slice(cursor, offset));
      if (match === '\n') {
        fragment.appendChild(document.createElement('br'));
      } else if (match.startsWith('**')) {
        const strong = document.createElement('strong');
        strong.textContent = match.slice(2, -2);
        fragment.appendChild(strong);
      } else if (match.startsWith('`')) {
        const code = document.createElement('code');
        code.textContent = match.slice(1, -1);
        fragment.appendChild(code);
      } else if (match.startsWith('*')) {
        const em = document.createElement('em');
        em.textContent = match.slice(1, -1);
        fragment.appendChild(em);
      }
      cursor = offset + match.length;
      return match;
    });
    appendPlain(fragment, String(text || '').slice(cursor));
    container.appendChild(fragment);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function appendPlain(fragment, value) {
    if (value) fragment.appendChild(document.createTextNode(value));
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
    citationText.textContent = '';

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
      citationText.append(
        document.createTextNode(`${authorStr} (${year}). `),
        createTextElement('em', title),
        document.createTextNode(`. Scholarly Database. ${doi ? 'https://doi.org/' + doi : pdf}`)
      );
    } else if (style === 'mla') {
      let authorStr = 'Anon.';
      if (authorsList.length > 0) {
        if (authorsList.length > 2) {
          authorStr = authorsList[0] + ', et al.';
        } else {
          authorStr = authorsList.join(' and ');
        }
      }
      citationText.append(
        document.createTextNode(`${authorStr} "${title}." `),
        createTextElement('em', 'Journal/Preprint'),
        document.createTextNode(`, ${year}, ${doi ? 'doi:' + doi : pdf}.`)
      );
    } else if (style === 'bibtex') {
      const citeKey = authorsList[0] ? authorsList[0].split(' ').pop().toLowerCase() + year + title.split(' ')[0].toLowerCase() : 'paper' + year;
      let authorStr = 'Anon';
      if (authorsList.length > 0) {
        authorStr = authorsList.join(' and ');
      }
      citationText.textContent = `@article{${citeKey.replace(/[^a-zA-Z0-9]/g, '')},\n` +
                 `  author = {${authorStr}},\n` +
                 `  title = {${title}},\n` +
                 `  year = {${year}},\n` +
                 `  journal = {Scholarly Portal},\n` +
                 (doi ? `  doi = {${doi}},\n` : '') +
                 `  url = {${pdf}}\n` +
                 `}`;
    }
  }

  function createTextElement(tagName, value) {
    const el = document.createElement(tagName);
    el.textContent = value;
    return el;
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
    // 延迟从 500ms 降至 80ms：当页面加载完成和侧面板打开时
    // 缓存通常已由 background 预充，命中时几乎不需要情感延迟
    autoCaptureTimer = setTimeout(() => {
      const capturePaneActive = document.getElementById('tab-capture')?.classList.contains('active');
      if (capturePaneActive && !btnScrape.disabled) {
        btnScrape.click();
      }
    }, 80);
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
