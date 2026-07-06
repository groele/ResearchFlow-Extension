/**
 * ResearchFlow Companion - Side Panel Controller
 */

const SIDE_I18N = {
  en: {
    documentTitle: 'ResearchFlow Workspace',
    goToDashboard: 'Go to Dashboard',
    activeProjectContext: 'Active Project Context',
    noActiveProject: '-- No Active Project Selected --',
    captureTab: 'Capture',
    copilotTab: 'AI Copilot',
    notesTab: 'Notes',
    captureActivePage: 'Capture Active Page',
    scanning: 'Scanning...',
    detecting: 'Detecting...',
    publicationTitle: 'Publication Title',
    publicationTitlePlaceholder: 'Academic paper title...',
    doiNumber: 'DOI Number',
    doiPlaceholder: 'e.g. 10.1038/s41586-024-xxxx',
    authors: 'Authors',
    authorsPlaceholder: 'Comma separated authors list...',
    abstract: 'Abstract',
    abstractPlaceholder: 'Abstract or paper overview text...',
    sourceLink: 'Source Link / PDF',
    sourcePlaceholder: 'https://...',
    structuredReadingNotes: 'Structured Reading Notes',
    coreBreakthrough: 'Core Breakthrough',
    breakthroughPlaceholder: 'e.g. Novel carbon anode design',
    methodologyEquations: 'Methodology & Equations',
    equationsPlaceholder: 'e.g. CVD synthesis, Eq (3)',
    datasetsCompute: 'Datasets & Compute',
    datasetsPlaceholder: 'e.g. arXiv corpus, PyTorch',
    openLimitations: 'Open Limitations',
    limitationsPlaceholder: 'e.g. Poor cyclability at high C-rate',
    saveRecord: 'Save Record',
    linkEvidence: 'Link Evidence',
    academicCitation: 'Academic Citation',
    copyCitation: 'Copy Citation',
    summarizePage: 'Summarize Page',
    reviewResponse: 'Review Response',
    aiGreeting: "Hello! I'm your ResearchFlow AI Copilot. Set your API Key in Settings to begin summarizing, generating CV items, or reviewing papers side-by-side!",
    chatPlaceholder: 'Ask a research question or query...',
    workingScratchpad: 'Working Scratchpad',
    scratchpadPlaceholder: 'Type temporary notes, computational code snippets, or thoughts here. Autosaves instantly.',
    projectChecklist: 'Project Checklist',
    addTask: '+ Add Task',
    selectProjectForTasks: 'Select a project context to view tasks.',
    noTasks: 'No checklist tasks recorded. Click + Add Task.',
    deleteTask: 'Delete task',
    openAccessFound: 'Open access PDF found via Unpaywall',
    couldNotAccessTabs: 'Could not access browser tabs',
    noActiveTab: 'No active tab found',
    couldNotReadMetadata: 'Could not read page metadata. Try refreshing.',
    restrictedPage: 'This page type cannot be scanned.',
    pdfDetected: 'PDF detected',
    pageCapturedSearching: 'Page captured - searching open access PDF...',
    searchingOpenAccess: 'Searching open access (Unpaywall)...',
    aiBreakthroughLoading: 'AI is analyzing breakthroughs...',
    aiMethodsLoading: 'AI is mapping methods...',
    aiToolsLoading: 'AI is identifying tools...',
    aiLimitationsLoading: 'AI is locating limitations...',
    selectActiveProjectFirst: 'Please select an active project first',
    titleRequired: 'Title is required',
    literatureRecordLogged: 'Literature Record logged!',
    saveFailed: 'Save failed',
    evidenceLinked: 'Evidence linked to project!',
    evidenceLinkFailed: 'Failed to link evidence',
    aiThinking: 'AI is thinking...',
    aiCredentialError: 'Make sure your OpenAI/DeepSeek API Key is configured in Settings.',
    activeWebPage: 'Active Web Page',
    noAbstractCaptured: 'No abstract captured yet. Please capture active page first.',
    summarizePrompt: 'Please summarize the paper: "{title}"',
    processingSummary: 'Processing summary...',
    setAiCredentials: 'Set your AI credentials in Settings.',
    captureAbstractFirst: 'Capture literature abstract first',
    reviewerPrompt: 'Enter reviewer comment to respond to:',
    rebuttalPrompt: 'Generate rebuttal response for reviewer comment: "{comment}"',
    draftingRebuttal: 'Drafting rebuttal response...',
    selectActiveProjectContext: 'Select active project context',
    newTaskPrompt: 'Enter new task description:',
    citationCopied: 'Citation copied!',
    copyFailed: 'Failed to copy'
  },
  zh: {
    documentTitle: 'ResearchFlow 侧边工作区',
    goToDashboard: '前往仪表盘',
    activeProjectContext: '当前项目上下文',
    noActiveProject: '-- 未选择当前项目 --',
    captureTab: '采集',
    copilotTab: 'AI 助手',
    notesTab: '笔记',
    captureActivePage: '采集当前页面',
    scanning: '扫描中...',
    detecting: '识别中...',
    publicationTitle: '论文题目',
    publicationTitlePlaceholder: '学术论文题目...',
    doiNumber: 'DOI 编号',
    doiPlaceholder: '例如：10.1038/s41586-024-xxxx',
    authors: '作者',
    authorsPlaceholder: '用逗号分隔作者列表...',
    abstract: '摘要',
    abstractPlaceholder: '论文摘要或概览...',
    sourceLink: '来源链接 / PDF',
    sourcePlaceholder: 'https://...',
    structuredReadingNotes: '结构化阅读笔记',
    coreBreakthrough: '核心突破',
    breakthroughPlaceholder: '例如：新型碳负极设计',
    methodologyEquations: '方法与方程',
    equationsPlaceholder: '例如：CVD 合成，公式 (3)',
    datasetsCompute: '数据集与计算',
    datasetsPlaceholder: '例如：arXiv 语料，PyTorch',
    openLimitations: '开放问题',
    limitationsPlaceholder: '例如：高倍率下循环稳定性不足',
    saveRecord: '保存记录',
    linkEvidence: '关联证据',
    academicCitation: '学术引用',
    copyCitation: '复制引用',
    summarizePage: '总结页面',
    reviewResponse: '审稿回复',
    aiGreeting: '我是 ResearchFlow AI 助手。请先在设置中配置 API Key，然后可以总结论文、生成材料或辅助审稿回复。',
    chatPlaceholder: '输入研究问题或查询...',
    workingScratchpad: '临时草稿',
    scratchpadPlaceholder: '输入临时笔记、计算代码片段或想法。内容会自动保存。',
    projectChecklist: '项目清单',
    addTask: '+ 添加任务',
    selectProjectForTasks: '请选择项目上下文以查看任务。',
    noTasks: '暂无清单任务。点击 + 添加任务。',
    deleteTask: '删除任务',
    openAccessFound: '已通过 Unpaywall 找到开放 PDF',
    couldNotAccessTabs: '无法访问浏览器标签页',
    noActiveTab: '未找到当前活动标签页',
    couldNotReadMetadata: '无法读取页面元数据，请刷新后重试。',
    restrictedPage: '当前页面类型无法扫描。',
    pdfDetected: '已检测到 PDF',
    pageCapturedSearching: '页面已采集，正在搜索开放 PDF...',
    searchingOpenAccess: '正在搜索开放 PDF (Unpaywall)...',
    aiBreakthroughLoading: 'AI 正在分析核心突破...',
    aiMethodsLoading: 'AI 正在梳理方法...',
    aiToolsLoading: 'AI 正在识别工具...',
    aiLimitationsLoading: 'AI 正在定位局限...',
    selectActiveProjectFirst: '请先选择当前项目',
    titleRequired: '题目为必填项',
    literatureRecordLogged: '文献记录已保存',
    saveFailed: '保存失败',
    evidenceLinked: '证据已关联到项目',
    evidenceLinkFailed: '证据关联失败',
    aiThinking: 'AI 正在思考...',
    aiCredentialError: '请确认已在设置中配置 OpenAI/DeepSeek API Key。',
    activeWebPage: '当前网页',
    noAbstractCaptured: '尚未采集摘要。请先采集当前页面。',
    summarizePrompt: '请总结这篇论文：“{title}”',
    processingSummary: '正在生成总结...',
    setAiCredentials: '请在设置中配置 AI 凭据。',
    captureAbstractFirst: '请先采集文献摘要',
    reviewerPrompt: '请输入需要回复的审稿意见：',
    rebuttalPrompt: '请为这条审稿意见生成回复：“{comment}”',
    draftingRebuttal: '正在起草审稿回复...',
    selectActiveProjectContext: '请选择当前项目上下文',
    newTaskPrompt: '请输入新任务描述：',
    citationCopied: '引用已复制',
    copyFailed: '复制失败'
  }
};

const SIDE_ICONS = {
  capture: '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>',
  flag: '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
  chat: '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  note: '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  trash: '<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>'
};

let sideLanguage = 'en';

function st(key, params = {}) {
  const template = SIDE_I18N[sideLanguage]?.[key] || SIDE_I18N.en[key] || key;
  return Object.entries(params).reduce(
    (text, [paramKey, value]) => text.replaceAll(`{${paramKey}}`, value ?? ''),
    template
  );
}

function setSideText(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

function setSidePlaceholder(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.placeholder = value;
}

function setSideFormLabel(inputId, value) {
  const input = document.getElementById(inputId);
  const label = input?.closest('.form-group')?.querySelector('label');
  if (label) label.textContent = value;
}

function setSideTabLabel(tabId, icon, label) {
  const button = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
  if (button) button.innerHTML = `${icon}\n        ${label}`;
}

function captureButtonHtml() {
  return `${SIDE_ICONS.capture}\n            ${st('captureActivePage')}`;
}

function applySidepanelLanguage() {
  document.documentElement.lang = sideLanguage === 'zh' ? 'zh-CN' : 'en';
  document.title = st('documentTitle');

  document.getElementById('btn-options')?.setAttribute('title', st('goToDashboard'));
  setSideText('label[for="side-project-select"]', st('activeProjectContext'));
  setSideTabLabel('tab-capture', SIDE_ICONS.flag, st('captureTab'));
  setSideTabLabel('tab-copilot', SIDE_ICONS.chat, st('copilotTab'));
  setSideTabLabel('tab-notes', SIDE_ICONS.note, st('notesTab'));

  const scrapeButton = document.getElementById('btn-scrape');
  if (scrapeButton && !scrapeButton.disabled) scrapeButton.innerHTML = captureButtonHtml();

  setSideFormLabel('meta-title', st('publicationTitle'));
  setSidePlaceholder('#meta-title', st('publicationTitlePlaceholder'));
  setSideFormLabel('meta-doi', st('doiNumber'));
  setSidePlaceholder('#meta-doi', st('doiPlaceholder'));
  setSideFormLabel('meta-authors', st('authors'));
  setSidePlaceholder('#meta-authors', st('authorsPlaceholder'));
  setSideFormLabel('meta-abstract', st('abstract'));
  setSidePlaceholder('#meta-abstract', st('abstractPlaceholder'));
  setSideFormLabel('meta-pdf', st('sourceLink'));
  setSidePlaceholder('#meta-pdf', st('sourcePlaceholder'));
  setSideText('#details-structured-notes summary', st('structuredReadingNotes'));
  setSideFormLabel('meta-breakthrough', st('coreBreakthrough'));
  setSidePlaceholder('#meta-breakthrough', st('breakthroughPlaceholder'));
  setSideFormLabel('meta-equations', st('methodologyEquations'));
  setSidePlaceholder('#meta-equations', st('equationsPlaceholder'));
  setSideFormLabel('meta-datasets', st('datasetsCompute'));
  setSidePlaceholder('#meta-datasets', st('datasetsPlaceholder'));
  setSideFormLabel('meta-limitations', st('openLimitations'));
  setSidePlaceholder('#meta-limitations', st('limitationsPlaceholder'));

  setSideText('#btn-save-record', st('saveRecord'));
  setSideText('#btn-save-evidence', st('linkEvidence'));
  setSideText('#sec-citation h4', st('academicCitation'));
  setSideText('#btn-copy-citation', st('copyCitation'));
  setSideText('#btn-ai-summarize', st('summarizePage'));
  setSideText('#btn-ai-rebuttal', st('reviewResponse'));
  setSideText('#chat-messages .chat-bubble.ai:first-child', st('aiGreeting'));
  setSidePlaceholder('#chat-input', st('chatPlaceholder'));
  setSideText('.notes-workspace h3', st('workingScratchpad'));
  setSidePlaceholder('#scratchpad', st('scratchpadPlaceholder'));
  setSideText('.tasks-header h3', st('projectChecklist'));
  setSideText('#btn-add-task', st('addTask'));
  setSideText('#side-tasks-list .empty-state', st('selectProjectForTasks'));
}

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
  sideLanguage = db.settings?.profile?.language || 'en';
  applySidepanelLanguage();
  let captureFormDirty = false;
  let lastCapturedTabKey = '';
  populateProjects(db);
  loadScratchpad();

  [metaTitle, metaDoi, metaAuthors, metaAbstract, metaPdf, metaBreakthrough, metaEquations, metaDatasets, metaLimitations]
    .filter(Boolean)
    .forEach(input => {
      input.addEventListener('input', () => {
        captureFormDirty = true;
      });
    });

  // Listeners for global database changes and async PDF updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'DATABASE_UPDATED') {
      db = message.data;
      sideLanguage = db.settings?.profile?.language || sideLanguage;
      applySidepanelLanguage();
      populateProjects(db);
      renderTasks();
    }

    // Handle asynchronous Unpaywall PDF enrichment from the background worker.
    if (message.action === 'PDF_URL_FOUND' && message.source === 'unpaywall') {
      const currentPdf = metaPdf.value.trim();
      // Only replace the PDF field while it still contains the source page URL.
      const currentTab = metaPdf.dataset.sourceUrl || '';
      if (!currentPdf || currentPdf === currentTab) {
        metaPdf.value = message.pdfUrl;
        metaPdf.dataset.unpaywallEnriched = 'true';
        showNotification(st('openAccessFound'), 'success');
        updateCitationPreview();
      }
      // Remove the searching badge once the background result arrives.
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

  btnScrape.addEventListener('click', async () => {
    const isAutomaticCapture = btnScrape.dataset.autoCapture === 'true';
    delete btnScrape.dataset.autoCapture;
    btnScrape.disabled = true;
    btnScrape.innerHTML = `<span class="loader"></span> ${st('scanning')}`;

    // Clear previous enrichment state before a new capture pass.
    document.getElementById('unpaywall-searching-badge')?.remove();
    delete metaPdf.dataset.unpaywallEnriched;
    delete metaPdf.dataset.sourceUrl;

    const resetBtn = () => {
      btnScrape.disabled = false;
      btnScrape.innerHTML = captureButtonHtml();
    };

    let tab;
    try {
      [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      lastCapturedTabKey = window.RFUI.getTabKey(tab);
    } catch (e) {
      showNotification(st('couldNotAccessTabs'), 'danger');
      resetBtn();
      return;
    }

    if (!tab) {
      showNotification(st('noActiveTab'), 'danger');
      resetBtn();
      return;
    }

    // First try the background metadata cache; a hit renders immediately.
    try {
      const cached = await queryBackgroundCache(tab.id, tab.url);
      if (cached) {
        fillAndEnrich(cached, tab);
        resetBtn();
        return;
      }
    } catch (_) { /* Cache lookup failed; continue with live scanning. */ }

    // Cache missed: inject content script on demand, then request metadata.
    btnScrape.innerHTML = `<span class="loader"></span> ${st('detecting')}`;

    // content.js is idempotent; restricted pages are handled by sendMessage below.
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['scripts/content.js']
      });
    } catch (e) {
      // 页面受限 / 已加载均属正常，继续发送消息
    }

    chrome.tabs.sendMessage(tab.id, { action: 'SCRAPE_PAGE' }, (response) => {
      // Read lastError first to avoid Chrome's unchecked runtime warning.
      const runtimeErr = chrome.runtime.lastError;
      if (runtimeErr || !response) {
        // 区分“页面受限”和“真实错误”
        const isRestricted = runtimeErr?.message?.includes('Cannot access') ||
                             runtimeErr?.message?.includes('receiving end');
        const shouldNotifyFailure = window.RFUI.shouldNotifyMetadataCaptureFailure({
          isAutomaticCapture,
          isRestrictedPage: isRestricted
        });
        if (shouldNotifyFailure) {
          if (!isRestricted) {
            showNotification(st('couldNotReadMetadata'), 'warning');
          } else {
            showNotification(st('restrictedPage'), 'info');
          }
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
   * Query the background metadata cache.
   * @returns {Promise<object|null>} Metadata object or null.
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
   * Fill the capture form and start Unpaywall and AI enrichment.
   */
  function fillAndEnrich(response, tab) {
    metaTitle.value   = response.title   || '';
    metaDoi.value     = response.doi      || '';
    metaAuthors.value = Array.isArray(response.authors) ? response.authors.join(', ') : '';
    metaAbstract.value= response.abstract || '';
    metaPdf.dataset.sourceUrl = tab.url;

    if (response.pdfUrl) {
      metaPdf.value = response.pdfUrl;
      showNotification(st('pdfDetected'), 'success');
    } else {
      metaPdf.value = tab.url;
      showNotification(st('pageCapturedSearching'), 'info');
    }

    updateCitationPreview();

    // Start Unpaywall enrichment only when DOI exists and no PDF URL is available.
    const hasPdf = !!response.pdfUrl;
    const doi = response.doi;
    if (!hasPdf && doi) {
      showUnpaywallSearchingBadge();
      chrome.runtime.sendMessage(
        { action: 'FETCH_PDF_VIA_UNPAYWALL', doi, tabId: tab.id },
        (res) => {
          // Read lastError first to avoid Chrome runtime warnings.
          void chrome.runtime.lastError;
          document.getElementById('unpaywall-searching-badge')?.remove();
          if (res?.success && res.pdfUrl) {
            const currentPdf = metaPdf.value.trim();
            if (!currentPdf || currentPdf === tab.url) {
              metaPdf.value = res.pdfUrl;
              metaPdf.dataset.unpaywallEnriched = 'true';
              updateCitationPreview();
              showNotification(st('openAccessFound'), 'success');
            }
          }
        }
      );
    }

    // AI structured-note extraction.
    if (db.settings?.ai?.apiKey && response.abstract) {
      detailsStructuredNotes.open = true;
      metaBreakthrough.placeholder = st('aiBreakthroughLoading');
      metaEquations.placeholder    = st('aiMethodsLoading');
      metaDatasets.placeholder     = st('aiToolsLoading');
      metaLimitations.placeholder  = st('aiLimitationsLoading');

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
          metaBreakthrough.placeholder = st('breakthroughPlaceholder');
          metaEquations.placeholder    = st('equationsPlaceholder');
          metaDatasets.placeholder     = st('datasetsPlaceholder');
          metaLimitations.placeholder  = st('limitationsPlaceholder');
        });
    }

    captureFormDirty = false;
  }

  // Show a compact Unpaywall search status badge.
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
    badge.innerHTML = `<span class="loader" style="width:10px;height:10px;border-width:1.5px;"></span> ${st('searchingOpenAccess')}`;
    metaPdf.closest('.form-group')?.after(badge);
  }

  // Save parsed metadata as a literature review ResearchRecord
  btnSaveRecord.addEventListener('click', async () => {
    const projectId = sideProjectSelect.value;
    if (!projectId) {
      showNotification(st('selectActiveProjectFirst'), 'danger');
      return;
    }

    const title = metaTitle.value.trim();
    if (!title) {
      showNotification(st('titleRequired'), 'danger');
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
      showNotification(st('literatureRecordLogged'), 'success');
      captureFormDirty = false;
    } catch (e) {
      showNotification(st('saveFailed'), 'danger');
    } finally {
      btnSaveRecord.disabled = false;
    }
  });

  // Save page as evidence
  btnSaveEvidence.addEventListener('click', async () => {
    const projectId = sideProjectSelect.value;
    if (!projectId) {
      showNotification(st('selectActiveProjectFirst'), 'danger');
      return;
    }

    const title = metaTitle.value.trim();
    if (!title) {
      showNotification(st('titleRequired'), 'danger');
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
      showNotification(st('evidenceLinked'), 'success');
      captureFormDirty = false;
    } catch (e) {
      showNotification(st('evidenceLinkFailed'), 'danger');
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
    const loadingBubble = appendLoadingMessage(st('aiThinking'));

    try {
      const response = await window.aiCopilot.generateCompletion(prompt);
      renderSafeMarkdownInto(loadingBubble, response);
    } catch (e) {
      loadingBubble.textContent = `Error: ${e.message}. ${st('aiCredentialError')}`;
    }
  }

  // Quick Action: Summarize
  btnAiSummarize.addEventListener('click', async () => {
    const title = metaTitle.value.trim() || st('activeWebPage');
    const abstract = metaAbstract.value.trim() || st('noAbstractCaptured');
    
    appendMessage(st('summarizePrompt', { title }), 'user');
    const loadingBubble = appendLoadingMessage(st('processingSummary'));

    try {
      const summary = await window.aiCopilot.summarizePaper(title, abstract);
      renderSafeMarkdownInto(loadingBubble, summary);
    } catch (e) {
      loadingBubble.textContent = `Error: ${e.message}. ${st('setAiCredentials')}`;
    }
  });

  // Quick Action: Review response
  btnAiRebuttal.addEventListener('click', async () => {
    const abstract = metaAbstract.value.trim();
    if (!abstract) {
      showNotification(st('captureAbstractFirst'), 'warning');
      return;
    }

    const comment = prompt(st('reviewerPrompt'));
    if (!comment) return;

    appendMessage(st('rebuttalPrompt', { comment }), 'user');
    const loadingBubble = appendLoadingMessage(st('draftingRebuttal'));

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
      showNotification(st('selectActiveProjectContext'), 'warning');
      return;
    }

    const taskTitle = prompt(st('newTaskPrompt'));
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
      sideTasksList.innerHTML = `<p class="empty-state">${st('selectProjectForTasks')}</p>`;
      return;
    }

    const projectTasks = db.tasks.filter(t => t.projectId === projectId);
    if (projectTasks.length === 0) {
      sideTasksList.innerHTML = `<p class="empty-state">${st('noTasks')}</p>`;
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
      delBtn.innerHTML = SIDE_ICONS.trash;
      delBtn.title = st('deleteTask');
      delBtn.setAttribute('aria-label', st('deleteTask'));
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
    sideProjectSelect.innerHTML = `<option value="">${st('noActiveProject')}</option>`;
    
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
      showNotification(st('citationCopied'), 'success');
    }).catch(() => {
      showNotification(st('copyFailed'), 'warning');
    });
  });

  function showNotification(msg, type = 'success') {
    const notification = document.createElement('div');
    notification.className = window.RFUI.getToastBadgeClass(type);
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
    autoCaptureTimer = setTimeout(async () => {
      const capturePaneActive = document.getElementById('tab-capture')?.classList.contains('active');
      let activeTabKey = '';
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        activeTabKey = window.RFUI.getTabKey(activeTab);
      } catch (_) {}

      const canCapture = window.RFUI.shouldAutoCapture({
        capturePaneActive,
        scrapeButtonDisabled: btnScrape.disabled,
        formDirty: captureFormDirty,
        activeTabKey,
        lastCapturedTabKey
      });

      if (canCapture) {
        btnScrape.dataset.autoCapture = 'true';
        btnScrape.click();
      }
    }, 120);
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
