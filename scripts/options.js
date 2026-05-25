/**
 * ResearchFlow OS - Options Dashboard Controller
 * Manages full routing, CRUD forms, kanbans, timeline charts, and sync settings.
 */

let db = null;
let selectedProjectId = null;
let selectedSubmissionId = null;
let currentDashboardFilter = 'all'; // 'all', 'accepted', 'active'
let currentLanguage = 'en';

const I18N = {
  en: {
    dashboardNav: 'Dashboard Overview',
    projectsNav: 'Areas & Projects',
    recordsNav: 'Research Records',
    manuscriptsNav: 'Manuscripts Kanban',
    submissionsNav: 'Submissions & Review',
    evidenceNav: 'Evidence Locker',
    settingsNav: 'Multi-Cloud Settings',
    syncLocal: 'Synced (Local)',
    forceSync: '🔄 Force Sync',
    dashboardTitle: 'Dashboard Overview',
    dashboardSubtitle: "A bird's eye view of your scientific progress and pipelines.",
    acceptedPublished: '🎉 Accepted & Published',
    activeReview: '🕒 Active In-Review',
    totalSubmissions: '📊 Total Submissions',
    clickToFilter: 'Click to filter',
    timelineTitle: '📅 Manuscript Pipeline Timelines',
    timelineSubtitle: 'Track experiments, writing, submission, revision, acceptance, and publication through visual manuscript pipelines.',
    timelineSortedBySubmissionDate: 'Sorted by submission date',
    compact: 'Compact',
    expanded: 'Expanded',
    allPipelines: 'All pipelines',
    activePipelines: 'Active in review',
    acceptedPipelines: 'Accepted / published',
    metricExpSubmit: 'Avg. experiment → submit',
    metricSubmitToday: 'Unaccepted: submit → today',
    metricR1Today: 'Unaccepted: R1 → today',
    metricSubmitAccept: 'Accepted: submit → accept',
    recentLogs: '⚡ Recent Research Logs',
    timelineAlerts: '🔔 Timeline Alerts',
    addEvent: '+ Event',
    latestEvent: 'Latest Event',
    noEventYet: 'No event yet',
    addEventStart: 'Add an event to start tracking',
    clickAddEvent: 'Click here to add a timeline event for this manuscript.',
    clickEditEvent: 'Click to edit this event.',
    settingsTitle: 'Multi-Cloud & AI Integration Settings',
    settingsSubtitle: 'Control exactly how and where your private data is distributed.',
    languageCardTitle: 'Language & Interface',
    languageLabel: 'Display Language',
    languageHelp: 'Switch the dashboard interface between English and Chinese.',
    cloudRoutingTitle: 'Distributed Cloud Storage Routing',
    webdavTitle: 'WebDAV Credentials',
    githubTitle: 'GitHub Private Repository Sync',
    aiTitle: 'AI Copilot Credentials',
    backupTitle: 'Database Backup & Import',
    saveLanguage: 'Save Language',
    saveMappings: 'Save Storage Mappings',
    saveAI: 'Save AI Configuration',
    exportDb: 'Export Database',
    importJson: 'Import JSON',
    languageSaved: 'Language preference saved.',
    databaseExported: 'Database JSON exported!',
    noUrgentEvents: 'No urgent review or timeline events.',
    noRecentRecords: 'No research records captured yet.',
    noPipelines: 'No manuscript submission pipelines in progress.',
    eventNameRequired: 'Event name is required.',
    zoteroSync: 'Import to Zotero',
    untitledEvent: 'Untitled Event',
    untitledManuscript: 'Untitled Manuscript',
    targetJournal: 'Target Journal',
    typeNoEvent: 'No Event',
    eventTypeResearch: 'Research',
    eventTypeWriting: 'Writing',
    eventTypeSubmission: 'Submission',
    eventTypeReview: 'Review',
    eventTypeRevision: 'Revision',
    eventTypePublication: 'Publication',
    eventTypeSpecial: 'Special',
    statusCompleted: 'Completed',
    statusActive: 'Active',
    statusPending: 'Planned',
    statusBlocked: 'Blocked',
    inlineAddTimelineEvent: 'Add timeline event',
    cancel: 'Cancel',
    eventPlaceholder: 'Event, e.g. R1 comments received',
    noDate: 'No date',
    days: 'days',
    dayUnitShort: 'd',
    relativeToday: 'today',
    relativeDaysAgo: '{count} days ago',
    relativeInDays: 'in {count} days',
    nodesSaved: '{count} nodes saved',
    expSubmitShort: 'Exp→Submit',
    keyEventRail: 'Key event rail',
    countingNow: 'Counting now',
    completedInterval: 'Completed interval',
    displayPrepareLabel: 'Experiment → Submission',
    displayPrepareCaption: 'Current focus: finish the pre-submission cycle.',
    displayAcceptedLabel: 'Submission → Acceptance',
    displayAcceptedCaption: 'Accepted manuscripts show the total time from submission to acceptance.',
    displayR1Label: 'R1 Comments → Today',
    displayR1Caption: 'R1 returned; the active window now starts from the first decision.',
    displayReviewLabel: 'Submission → Today',
    displayReviewCaption: 'Not accepted yet; keep counting the waiting time after submission.',
    milestoneExperimentDone: 'Experiments done',
    milestoneSubmission: 'Submission',
    milestoneAcceptance: 'Acceptance',
    milestoneR1Comments: 'R1 comments',
    milestoneToday: 'Today',
    statePreparing: 'Preparing',
    stateOnline: 'Online',
    stateAccepted: 'Accepted',
    stateAfterR1: 'After R1',
    stateUnderReview: 'Under Review',
    stateSubmitted: 'Submitted',
    stateNotSubmitted: 'Not submitted',
    stateSinceR1: '{count} d since R1',
    stateSinceSubmit: '{count} d since submit',
    defaultExperimentsCompleted: 'Experiments Completed',
    defaultDataOrganization: 'Data Organization',
    defaultDraftCompleted: 'Draft Completed',
    defaultManuscriptSubmitted: 'Manuscript Submitted',
    defaultReviewCommentsR1: 'Review Comments R1',
    defaultR1RevisionSubmitted: 'R1 Revision Submitted',
    defaultReviewCommentsR2: 'Review Comments R2',
    defaultR2RevisionSubmitted: 'R2 Revision Submitted',
    defaultAccepted: 'Accepted',
    defaultOnlinePublication: 'Online Publication',
    defaultProof: 'Proof',
    editTimelineEvent: 'Edit Timeline Event',
    close: 'Close',
    eventName: 'Event Name',
    type: 'Type',
    status: 'Status',
    keyEventMapping: 'Key Event Mapping',
    eventDate: 'Event Date',
    eventDateHelp: 'One timeline event only needs one date: the day this mapped event happened. Deadlines and source dates are managed in the submission timeline panel.',
    plannedDate: 'Planned Date',
    initialSubmissionDate: 'Initial Submission Date',
    deadlineDate: 'Deadline / Due Date',
    completionDate: 'Completion Date',
    firstDecisionDate: 'First Decision / R1 Date',
    revisionDueDateLabel: 'Revision Due Date',
    timelineDateControlTitle: 'Timeline Date Source',
    timelineDateControlHelp: 'Dashboard timing uses these submission-level dates first, then mirrors them onto timeline events. Editing the submit/acceptance timeline events also updates these source dates.',
    saveTimelineDates: 'Save Timeline Dates',
    timelineDatesSaved: 'Timeline dates saved and synced to Dashboard.',
    timelineDateSource: 'Date source',
    doiLabel: 'DOI',
    articlePage: 'Article page',
    doiNotSet: 'DOI not set',
    trackSubmissionTitle: 'Track Journal Submission',
    manuscriptPaper: 'Manuscript / Paper',
    targetJournalInput: 'Target Journal',
    articleUrlLabel: 'Article / Journal URL',
    articleUrlPlaceholder: 'https://doi.org/10.xxxx/xxxxx',
    publicationLinkTitle: 'Publication Link',
    savePublicationLink: 'Save DOI / Link',
    publicationLinkSaved: 'Publication DOI and link saved.',
    trackSubmissionButton: 'Track Submission',
    manuscriptJournalRequired: 'Manuscript and Journal are required',
    submissionAddedToast: 'New submission added to pipeline!',
    dateSourceSubmission: 'submission record',
    dateSourceTimeline: 'timeline node',
    dateSourceMissing: 'not set',
    planToday: 'Plan Today',
    setToday: 'Set Today',
    due14: 'Due +14d',
    markActive: 'Mark Active',
    markDoneToday: 'Mark Done Today',
    clearDates: 'Clear Dates',
    clearDate: 'Clear Date',
    notes: 'Notes',
    notesPlaceholder: 'Decision details, reviewer deadline, portal note, or next action...',
    delete: 'Delete',
    saveChanges: 'Save Changes',
    keyAuto: 'Auto detect',
    keyExperimentsDone: 'Key: Experiments done',
    keyDraftDone: 'Key: Draft done',
    keySubmitted: 'Key: Submitted',
    keyR1Comments: 'Key: R1 comments',
    keyR1Resubmitted: 'Key: R1 resubmitted',
    keyR2Comments: 'Key: R2 comments',
    keyR2Resubmitted: 'Key: R2 resubmitted',
    keyAccepted: 'Key: Accepted',
    keyOnlinePublished: 'Key: Online / Published',
    statusPlannedNotStarted: 'Planned / Not Started',
    statusInProgress: 'In Progress',
    statusBlockedException: 'Blocked / Exception',
    statusOverdue: 'Overdue',
    statusDueSoon: 'Due soon',
    statusUpcoming: 'Upcoming',
    specialException: 'Special / Exception',
    submissionNotFound: 'Submission not found. Refreshing dashboard.',
    eventNotFound: 'Event not found. Refreshing dashboard.',
    eventAddedToast: 'Added event "{name}".',
    eventSavedToast: 'Event "{name}" saved.',
    eventRemovedToast: 'Event removed from pipeline',
    confirmDeleteEvent: 'Are you sure you want to delete event "{name}"?'
  },
  zh: {
    dashboardNav: '仪表盘总览',
    projectsNav: '领域与项目',
    recordsNav: '研究记录',
    manuscriptsNav: '手稿看板',
    submissionsNav: '投稿与审稿',
    evidenceNav: '证据库',
    settingsNav: '多云设置',
    syncLocal: '已同步（本地）',
    forceSync: '🔄 强制同步',
    dashboardTitle: '仪表盘总览',
    dashboardSubtitle: '集中查看科研进展、投稿状态和关键时间线。',
    acceptedPublished: '🎉 已接收 / 已发表',
    activeReview: '🕒 审稿中',
    totalSubmissions: '📊 投稿总数',
    clickToFilter: '点击筛选',
    timelineTitle: '📅 手稿投稿时间线',
    timelineSubtitle: '跟踪实验、写作、投稿、返修、接收和发表等关键事件。',
    timelineSortedBySubmissionDate: '按投稿日期排序',
    compact: '紧凑',
    expanded: '展开',
    allPipelines: '全部时间线',
    activePipelines: '审稿中',
    acceptedPipelines: '已接收 / 已发表',
    metricExpSubmit: '平均 实验 → 投稿',
    metricSubmitToday: '未接收：投稿 → 今天',
    metricR1Today: '未接收：R1 → 今天',
    metricSubmitAccept: '已接收：投稿 → 接收',
    recentLogs: '⚡ 最近研究记录',
    timelineAlerts: '🔔 时间线提醒',
    addEvent: '+ 事件',
    latestEvent: '最新事件',
    noEventYet: '暂无事件',
    addEventStart: '添加事件后开始跟踪',
    clickAddEvent: '点击这里为该手稿添加时间线事件。',
    clickEditEvent: '点击编辑该事件。',
    settingsTitle: '多云与 AI 集成设置',
    settingsSubtitle: '控制私有数据的保存、同步和分发位置。',
    languageCardTitle: '语言与界面',
    languageLabel: '显示语言',
    languageHelp: '在英文和中文界面之间切换。',
    cloudRoutingTitle: '分布式云存储路由',
    webdavTitle: 'WebDAV 凭据',
    githubTitle: 'GitHub 私有仓库同步',
    aiTitle: 'AI 助手凭据',
    backupTitle: '数据库备份与导入',
    saveLanguage: '保存语言',
    saveMappings: '保存存储映射',
    saveAI: '保存 AI 配置',
    exportDb: '导出数据库',
    importJson: '导入 JSON',
    languageSaved: '语言偏好已保存。',
    databaseExported: '数据库 JSON 已导出。',
    noUrgentEvents: '暂无紧急审稿或时间线事件。',
    noRecentRecords: '暂无研究记录。',
    noPipelines: '暂无手稿投稿时间线。',
    eventNameRequired: '请填写事件名称。',
    zoteroSync: '导入 Zotero',
    untitledEvent: '未命名事件',
    untitledManuscript: '未命名手稿',
    targetJournal: '目标期刊',
    typeNoEvent: '暂无事件',
    eventTypeResearch: '研究',
    eventTypeWriting: '写作',
    eventTypeSubmission: '投稿',
    eventTypeReview: '审稿',
    eventTypeRevision: '返修',
    eventTypePublication: '发表',
    eventTypeSpecial: '特殊',
    statusCompleted: '已完成',
    statusActive: '进行中',
    statusPending: '计划中',
    statusBlocked: '阻塞',
    inlineAddTimelineEvent: '添加时间线事件',
    cancel: '取消',
    eventPlaceholder: '事件，例如：收到 R1 审稿意见',
    noDate: '暂无日期',
    days: '天',
    dayUnitShort: '天',
    relativeToday: '今天',
    relativeDaysAgo: '{count} 天前',
    relativeInDays: '{count} 天后',
    nodesSaved: '已保存 {count} 个节点',
    expSubmitShort: '实验→投稿',
    keyEventRail: '关键事件轴',
    countingNow: '持续计时中',
    completedInterval: '已完成区间',
    displayPrepareLabel: '实验 → 投稿',
    displayPrepareCaption: '当前重点：完成投稿前准备周期。',
    displayAcceptedLabel: '投稿 → 接收',
    displayAcceptedCaption: '完成稿件固定展示投稿到接收的总耗时。',
    displayR1Label: 'R1 意见 → 今天',
    displayR1Caption: 'R1 已返回，当前计时窗口切换到 R1 意见之后。',
    displayReviewLabel: '投稿 → 今天',
    displayReviewCaption: '尚未接收，当前持续统计投稿后的等待时间。',
    milestoneExperimentDone: '实验完成',
    milestoneSubmission: '投稿',
    milestoneAcceptance: '接收',
    milestoneR1Comments: 'R1 意见',
    milestoneToday: '今天',
    statePreparing: '准备中',
    stateOnline: '已上线',
    stateAccepted: '已接收',
    stateAfterR1: 'R1 之后',
    stateUnderReview: '审稿中',
    stateSubmitted: '已投稿',
    stateNotSubmitted: '尚未投稿',
    stateSinceR1: 'R1 后 {count} 天',
    stateSinceSubmit: '投稿后 {count} 天',
    defaultExperimentsCompleted: '实验完成',
    defaultDataOrganization: '数据整理',
    defaultDraftCompleted: '初稿完成',
    defaultManuscriptSubmitted: '手稿已投稿',
    defaultReviewCommentsR1: '收到 R1 审稿意见',
    defaultR1RevisionSubmitted: 'R1 修回已提交',
    defaultReviewCommentsR2: '收到 R2 审稿意见',
    defaultR2RevisionSubmitted: 'R2 修回已提交',
    defaultAccepted: '已接收',
    defaultOnlinePublication: '上线发表',
    defaultProof: '校样',
    editTimelineEvent: '编辑时间线事件',
    close: '关闭',
    eventName: '事件名称',
    type: '类型',
    status: '状态',
    keyEventMapping: '关键事件映射',
    eventDate: '事件日期',
    eventDateHelp: '一个时间线事件只需要一个日期：该映射事件实际发生的日期。截止日期和来源日期在投稿详情的时间线面板中维护。',
    plannedDate: '计划日期',
    initialSubmissionDate: '初始投稿日期',
    deadlineDate: '截止日期',
    completionDate: '完成日期',
    firstDecisionDate: '首次决定 / R1 日期',
    revisionDueDateLabel: '返修截止日期',
    timelineDateControlTitle: '时间线日期来源',
    timelineDateControlHelp: 'Dashboard 计时优先使用这里的投稿级日期，并自动同步到时间线事件。编辑“投稿/接收”等时间线事件时，也会反向更新这些来源日期。',
    saveTimelineDates: '保存时间线日期',
    timelineDatesSaved: '时间线日期已保存并同步到 Dashboard。',
    timelineDateSource: '日期来源',
    doiLabel: 'DOI',
    articlePage: '文章主页',
    doiNotSet: '未设置 DOI',
    trackSubmissionTitle: '跟踪期刊投稿',
    manuscriptPaper: '手稿 / 论文',
    targetJournalInput: '目标期刊',
    articleUrlLabel: '文章 / 期刊页面 URL',
    articleUrlPlaceholder: 'https://doi.org/10.xxxx/xxxxx',
    publicationLinkTitle: '发表链接',
    savePublicationLink: '保存 DOI / 链接',
    publicationLinkSaved: 'DOI 和文章链接已保存。',
    trackSubmissionButton: '开始跟踪投稿',
    manuscriptJournalRequired: '请填写手稿和目标期刊',
    submissionAddedToast: '新的投稿已加入时间线。',
    dateSourceSubmission: '投稿记录',
    dateSourceTimeline: '时间线节点',
    dateSourceMissing: '未设置',
    planToday: '计划为今天',
    setToday: '设为今天',
    due14: '14 天后截止',
    markActive: '标记进行中',
    markDoneToday: '标记今天完成',
    clearDates: '清空日期',
    clearDate: '清空日期',
    notes: '备注',
    notesPlaceholder: '填写决定详情、审稿截止日、投稿系统备注或下一步行动...',
    delete: '删除',
    saveChanges: '保存修改',
    keyAuto: '自动识别',
    keyExperimentsDone: '关键：实验完成',
    keyDraftDone: '关键：初稿完成',
    keySubmitted: '关键：已投稿',
    keyR1Comments: '关键：R1 意见',
    keyR1Resubmitted: '关键：R1 修回',
    keyR2Comments: '关键：R2 意见',
    keyR2Resubmitted: '关键：R2 修回',
    keyAccepted: '关键：接收',
    keyOnlinePublished: '关键：上线 / 发表',
    statusPlannedNotStarted: '计划中 / 未开始',
    statusInProgress: '进行中',
    statusBlockedException: '阻塞 / 异常',
    statusOverdue: '已逾期',
    statusDueSoon: '即将到期',
    statusUpcoming: '待开始',
    specialException: '特殊 / 异常',
    submissionNotFound: '找不到该投稿，正在刷新仪表盘。',
    eventNotFound: '找不到该事件，正在刷新仪表盘。',
    eventAddedToast: '已添加事件“{name}”。',
    eventSavedToast: '事件“{name}”已保存。',
    eventRemovedToast: '事件已从时间线移除。',
    confirmDeleteEvent: '确定要删除事件“{name}”吗？'
  }
};

function t(key) {
  return I18N[currentLanguage]?.[key] || I18N.en[key] || key;
}

function tf(key, vars = {}) {
  return t(key).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '');
}

function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

function setAllText(selector, value) {
  document.querySelectorAll(selector).forEach(el => { el.textContent = value; });
}

function setNavText(selector, value) {
  const el = document.querySelector(selector);
  if (!el) return;
  const icon = el.querySelector('svg');
  el.innerHTML = '';
  if (icon) el.appendChild(icon);
  el.appendChild(document.createTextNode(value));
}

function setFilterCardTitle(selector, value) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.innerHTML = `${escapeHTML(value)} <span class="filter-tip">${escapeHTML(t('clickToFilter'))}</span>`;
}

function applyLanguage() {
  setNavText('.nav-item[data-view="view-dashboard"]', t('dashboardNav'));
  setNavText('.nav-item[data-view="view-projects"]', t('projectsNav'));
  setNavText('.nav-item[data-view="view-records"]', t('recordsNav'));
  setNavText('.nav-item[data-view="view-manuscripts"]', t('manuscriptsNav'));
  setNavText('.nav-item[data-view="view-submissions"]', t('submissionsNav'));
  setNavText('.nav-item[data-view="view-evidence"]', t('evidenceNav'));
  setNavText('.nav-item[data-view="view-settings"]', t('settingsNav'));
  setText('#sync-status-text', t('syncLocal'));
  setText('#btn-manual-sync', t('forceSync'));

  setText('#view-dashboard .view-header h1', t('dashboardTitle'));
  setText('#view-dashboard .view-header .text-muted', t('dashboardSubtitle'));
  setFilterCardTitle('#card-filter-accepted h4', t('acceptedPublished'));
  setFilterCardTitle('#card-filter-active h4', t('activeReview'));
  setFilterCardTitle('#card-filter-all h4', t('totalSubmissions'));
  setAllText('.filter-tip', t('clickToFilter'));
  setText('.pipeline-module-header h3', t('timelineTitle'));
  setText('.pipeline-module-header .text-muted', t('timelineSubtitle'));
  setText('#pipeline-view-label', document.getElementById('dashboard-gantt')?.classList.contains('expanded') ? t('expanded') : t('compact'));
  setText('#dashboard-filter-label', getDashboardFilterLabel());
  const summaryCards = document.querySelectorAll('.timeline-summary-header .summary-card .label');
  if (summaryCards[0]) summaryCards[0].textContent = t('metricExpSubmit');
  if (summaryCards[1]) summaryCards[1].textContent = t('metricSubmitToday');
  if (summaryCards[2]) summaryCards[2].textContent = t('metricR1Today');
  if (summaryCards[3]) summaryCards[3].textContent = t('metricSubmitAccept');
  const recentHeads = document.querySelectorAll('#view-dashboard .recent-box h3');
  if (recentHeads[0]) recentHeads[0].textContent = t('recentLogs');
  if (recentHeads[1]) recentHeads[1].textContent = t('timelineAlerts');

  setText('#view-settings .view-header h1', t('settingsTitle'));
  setText('#view-settings .view-header .text-muted', t('settingsSubtitle'));
  setText('#settings-language-card h3', t('languageCardTitle'));
  setText('label[for="ui-language"]', t('languageLabel'));
  setText('#language-help', t('languageHelp'));
  setText('#btn-save-language', t('saveLanguage'));
  setText('#settings-cloud-card h3', t('cloudRoutingTitle'));
  setText('#settings-webdav-card h3', t('webdavTitle'));
  setText('#settings-github-card h3', t('githubTitle'));
  setText('#settings-ai-card h3', t('aiTitle'));
  setText('#settings-backup-card h3', t('backupTitle'));
  setText('#btn-save-settings', t('saveMappings'));
  setText('#btn-save-ai', t('saveAI'));
  setText('#btn-export-db', t('exportDb'));
  setText('#btn-trigger-import', t('importJson'));
  setText('#btn-zotero-sync', t('zoteroSync'));
}

document.addEventListener('DOMContentLoaded', async () => {
  // Navigation Routing
  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.content-view');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetView = item.getAttribute('data-view');
      
      navItems.forEach(n => n.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));
      
      item.classList.add('active');
      document.getElementById(targetView).classList.add('active');
      
      // Trigger tab-specific loaders
      if (targetView === 'view-dashboard') renderDashboard();
      if (targetView === 'view-projects') renderProjectsTree();
      if (targetView === 'view-records') renderRecords();
      if (targetView === 'view-manuscripts') renderKanban();
      if (targetView === 'view-submissions') renderSubmissions();
      if (targetView === 'view-evidence') renderEvidence();
      if (targetView === 'view-settings') loadSettings();
    });
  });

  // Load Database
  db = await window.storage.loadAll();
  currentLanguage = db.settings?.profile?.language || 'en';
  document.documentElement.lang = currentLanguage === 'zh' ? 'zh-CN' : 'en';
  
  // Dynamic Database Migration: Translate Chinese nodes to English & filter out '手稿定稿'
  let dbMigrationChanged = false;
  if (db && db.submissions) {
    db.submissions.forEach(sub => {
      if (sub.timelineNodes && sub.timelineNodes.length > 0) {
        const originalLength = sub.timelineNodes.length;
        // Filter out '手稿定稿'
        sub.timelineNodes = sub.timelineNodes.filter(node => {
          const nameTrimmed = node.name.trim();
          return nameTrimmed !== '手稿定稿' && nameTrimmed !== 'Manuscript Finalization';
        });
        
        const nameMapping = {
          '实验完成': 'Experiments Completed',
          '数据整理': 'Data Organization',
          '初稿完成': 'Draft Completed',
          '投稿': 'Manuscript Submitted',
          '审稿意见 R1': 'Review Comments R1',
          'R1 修回提交': 'R1 Revision Submitted',
          '审稿意见 R2': 'Review Comments R2',
          'R2 修回提交': 'R2 Revision Submitted',
          '接收': 'Accepted',
          'Online': 'Online Publication',
          'Proof': 'Proof'
        };
        
        sub.timelineNodes.forEach(node => {
          const nameTrimmed = node.name.trim();
          if (nameMapping[nameTrimmed]) {
            node.name = nameMapping[nameTrimmed];
            dbMigrationChanged = true;
          }
        });
        
        if (sub.timelineNodes.length !== originalLength) {
          dbMigrationChanged = true;
        }
      }
    });
    
    if (dbMigrationChanged) {
      window.storage.saveAll(db).catch(console.error);
    }
  }
  
  // Set up synchronization alerts/updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'DATABASE_UPDATED') {
      db = message.data;
      
      // Migrate on update too
      if (db && db.submissions) {
        let updateChanged = false;
        db.submissions.forEach(sub => {
          if (sub.timelineNodes && sub.timelineNodes.length > 0) {
            const origLen = sub.timelineNodes.length;
            sub.timelineNodes = sub.timelineNodes.filter(node => {
              const nameTrimmed = node.name.trim();
              return nameTrimmed !== '手稿定稿' && nameTrimmed !== 'Manuscript Finalization';
            });
            const nameMapping = {
              '实验完成': 'Experiments Completed',
              '数据整理': 'Data Organization',
              '初稿完成': 'Draft Completed',
              '投稿': 'Manuscript Submitted',
              '审稿意见 R1': 'Review Comments R1',
              'R1 修回提交': 'R1 Revision Submitted',
              '审稿意见 R2': 'Review Comments R2',
              'R2 修回提交': 'R2 Revision Submitted',
              '接收': 'Accepted',
              'Online': 'Online Publication',
              'Proof': 'Proof'
            };
            sub.timelineNodes.forEach(node => {
              const nameTrimmed = node.name.trim();
              if (nameMapping[nameTrimmed]) {
                node.name = nameMapping[nameTrimmed];
                updateChanged = true;
              }
            });
            if (sub.timelineNodes.length !== origLen) {
              updateChanged = true;
            }
          }
        });
        if (updateChanged) {
          window.storage.saveAll(db).catch(console.error);
        }
      }
      
      updateSyncStatus('success', 'Synced');
      
      // Reload active view
      const activeNav = document.querySelector('.nav-item.active');
      if (activeNav) {
        const viewId = activeNav.getAttribute('data-view');
        if (viewId === 'view-dashboard') renderDashboard();
        if (viewId === 'view-projects') renderProjectsTree();
        if (viewId === 'view-records') renderRecords();
        if (viewId === 'view-manuscripts') renderKanban();
        if (viewId === 'view-submissions') renderSubmissions();
        if (viewId === 'view-evidence') renderEvidence();
      }
    }
  });

  // Initial load
  applyLanguage();
  renderDashboard();
  setupSettingsListeners();
  setupSyncListeners();
  setupGlobalModalListeners();
  setupJournalPortalListeners();
  setupDashboardFilterListeners();

  // Pipeline View Toggle and Drawer Event Listeners
  const btnToggle = document.getElementById('btn-pipeline-view-toggle');
  if (btnToggle) {
    btnToggle.addEventListener('click', () => {
      const container = document.getElementById('dashboard-gantt');
      const label = document.getElementById('pipeline-view-label');
      if (container.classList.contains('expanded')) {
        container.classList.remove('expanded');
        label.textContent = t('compact');
      } else {
        container.classList.add('expanded');
        label.textContent = t('expanded');
      }
    });
  }

});

// --- DASHBOARD Lifecycle Filters ---
function setupDashboardFilterListeners() {
  const cardAccepted = document.getElementById('card-filter-accepted');
  const cardActive = document.getElementById('card-filter-active');
  const cardAll = document.getElementById('card-filter-all');
  
  if (!cardAccepted || !cardActive || !cardAll) return;
  
  const clearActiveClasses = () => {
    cardAccepted.classList.remove('active');
    cardActive.classList.remove('active');
    cardAll.classList.remove('active');
  };
  
  cardAccepted.addEventListener('click', () => {
    currentDashboardFilter = 'accepted';
    clearActiveClasses();
    cardAccepted.classList.add('active');
    renderDashboard();
  });
  
  cardActive.addEventListener('click', () => {
    currentDashboardFilter = 'active';
    clearActiveClasses();
    cardActive.classList.add('active');
    renderDashboard();
  });
  
  cardAll.addEventListener('click', () => {
    currentDashboardFilter = 'all';
    clearActiveClasses();
    cardAll.classList.add('active');
    renderDashboard();
  });
}


// --- SYNCHRONIZATION INDICATORS ---
function updateSyncStatus(state, text) {
  const dot = document.getElementById('sync-dot');
  const statusText = document.getElementById('sync-status-text');
  
  dot.className = 'indicator-dot';
  dot.classList.add(state); // 'active' (emerald), 'syncing' (amber), 'error' (rose)
  statusText.textContent = text;
}

function setupSyncListeners() {
  const syncBtn = document.getElementById('btn-manual-sync');
  syncBtn.addEventListener('click', async () => {
    syncBtn.disabled = true;
    syncBtn.innerHTML = '🔄 Syncing...';
    updateSyncStatus('syncing', 'Syncing...');

    try {
      const res = await window.storage.syncDatabaseNow();
      if (res.success) {
        showGlobalToast('Database synchronization complete!', 'success');
        updateSyncStatus('active', 'Synced');
      } else {
        showGlobalToast(`Sync failed: ${res.error}`, 'error');
        updateSyncStatus('error', 'Sync Failed');
      }
    } catch (e) {
      updateSyncStatus('error', 'Sync Failed');
    } finally {
      syncBtn.disabled = false;
      syncBtn.innerHTML = '🔄 Force Sync';
    }
  });
}

// --- MANUSCRIPT KEY EVENT RAIL UTILITIES (gemini-code-1779592757736) ---
const typeMeta = {
  research: { color: "#2563eb", labelKey: "eventTypeResearch" },
  writing: { color: "#7c3aed", labelKey: "eventTypeWriting" },
  submission: { color: "#f97316", labelKey: "eventTypeSubmission" },
  review: { color: "#f97316", labelKey: "eventTypeReview" },
  revision: { color: "#dc2626", labelKey: "eventTypeRevision" },
  publication: { color: "#16a34a", labelKey: "eventTypePublication" },
  special: { color: "#64748b", labelKey: "eventTypeSpecial" }
};

function getTimelineTypeMeta(type) {
  const meta = typeMeta[type] || typeMeta.special;
  return { ...meta, label: t(meta.labelKey || 'eventTypeSpecial') };
}

const defaultTimelineNameKeys = {
  'Experiments Completed': 'defaultExperimentsCompleted',
  '实验完成': 'defaultExperimentsCompleted',
  'Data Organization': 'defaultDataOrganization',
  '数据整理': 'defaultDataOrganization',
  'Draft Completed': 'defaultDraftCompleted',
  '初稿完成': 'defaultDraftCompleted',
  'Manuscript Submitted': 'defaultManuscriptSubmitted',
  '手稿已投稿': 'defaultManuscriptSubmitted',
  'Review Comments R1': 'defaultReviewCommentsR1',
  '收到 R1 审稿意见': 'defaultReviewCommentsR1',
  'R1 Revision Submitted': 'defaultR1RevisionSubmitted',
  'R1 修回已提交': 'defaultR1RevisionSubmitted',
  'Review Comments R2': 'defaultReviewCommentsR2',
  '收到 R2 审稿意见': 'defaultReviewCommentsR2',
  'R2 Revision Submitted': 'defaultR2RevisionSubmitted',
  'R2 修回已提交': 'defaultR2RevisionSubmitted',
  'Accepted': 'defaultAccepted',
  '已接收': 'defaultAccepted',
  'Online Publication': 'defaultOnlinePublication',
  '上线发表': 'defaultOnlinePublication',
  'Proof': 'defaultProof',
  '校样': 'defaultProof'
};

function getTimelineNodeDisplayName(node) {
  const rawName = (node?.name || '').trim();
  if (!rawName) return t('untitledEvent');
  const defaultKey = defaultTimelineNameKeys[rawName];
  return defaultKey ? t(defaultKey) : rawName;
}

function getDaysDiff(dateStr1, dateStr2) {
  if (!dateStr1 || !dateStr2) return null;
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  if (isNaN(d1) || isNaN(d2)) return null;
  
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.max(0, Math.round((utc2 - utc1) / 86400000));
}

function getRelativeDateLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const today = new Date();
  const utcDate = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round((utcToday - utcDate) / 86400000);

  if (diff === 0) return t('relativeToday');
  if (diff > 0) return tf('relativeDaysAgo', { count: diff });
  return tf('relativeInDays', { count: Math.abs(diff) });
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDateString(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function dateInputToIso(value) {
  const normalized = normalizeDateString(value);
  return normalized ? `${normalized}T12:00:00.000Z` : null;
}

function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getNodeDate(node) {
  return node?.completeDate || node?.planDate || node?.dueDate || '';
}

function getLatestTimelineNode(nodes = []) {
  const datedNodes = nodes
    .filter(getNodeDate)
    .sort((a, b) => new Date(getNodeDate(b)) - new Date(getNodeDate(a)));

  if (datedNodes.length) return datedNodes[0];

  return [...nodes].reverse().find(node =>
    node.status === 'active' ||
    node.status === 'completed' ||
    node.status === 'blocked' ||
    node.status === 'danger'
  ) || nodes[0] || null;
}

function createTimelineNode(subId, values = {}) {
  const now = new Date().toISOString();
  return {
    id: `node_${subId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: (values.name || t('untitledEvent')).trim(),
    type: values.type || 'research',
    key: values.key || 'auto',
    status: values.status || 'pending',
    planDate: values.planDate || '',
    dueDate: values.dueDate || '',
    completeDate: values.completeDate || '',
    notes: values.notes || '',
    createdAt: now,
    updatedAt: now
  };
}

function buildOptions(options, selectedValue) {
  return options.map(option => {
    const value = typeof option === 'string' ? option : option.value;
    const label = typeof option === 'string' ? option : option.label;
    return `<option value="${escapeHTML(value)}" ${value === selectedValue ? 'selected' : ''}>${escapeHTML(label)}</option>`;
  }).join('');
}

function buildInlineStageEditor(subId) {
  const typeOptions = [
    { value: 'research', label: t('eventTypeResearch') },
    { value: 'writing', label: t('eventTypeWriting') },
    { value: 'submission', label: t('eventTypeSubmission') },
    { value: 'review', label: t('eventTypeReview') },
    { value: 'revision', label: t('eventTypeRevision') },
    { value: 'publication', label: t('eventTypePublication') },
    { value: 'special', label: t('eventTypeSpecial') }
  ];

  return `
    <div class="inline-stage-editor" data-sub-id="${escapeHTML(subId)}" hidden>
      <div class="inline-stage-head">
        <span>${t('inlineAddTimelineEvent')}</span>
        <button class="btn-secondary btn-sm btn-inline-stage-cancel" type="button">${t('cancel')}</button>
      </div>
      <div class="inline-stage-fields">
        <input type="text" class="inline-stage-name" placeholder="${escapeHTML(t('eventPlaceholder'))}">
        <input type="date" class="inline-stage-date" value="${todayString()}">
        <select class="inline-stage-type">${buildOptions(typeOptions, 'review')}</select>
        <button class="btn-primary btn-sm btn-inline-stage-save" type="button">${t('addEvent').replace('+ ', '')}</button>
      </div>
    </div>
  `;
}

function toggleInlineStageEditor(card, shouldOpen = null) {
  const editor = card?.querySelector('.inline-stage-editor');
  if (!editor) return;
  editor.hidden = shouldOpen === null ? !editor.hidden : !shouldOpen;
  if (!editor.hidden) {
    const nameInput = editor.querySelector('.inline-stage-name');
    if (nameInput) nameInput.focus();
  }
}

async function saveInlineStageEvent(editor) {
  const subId = editor.getAttribute('data-sub-id');
  const sub = db.submissions.find(s => s.id === subId);
  if (!sub) {
    showGlobalToast(t('submissionNotFound'), 'error');
    renderDashboard();
    return;
  }

  const name = editor.querySelector('.inline-stage-name').value.trim();
  const eventDate = editor.querySelector('.inline-stage-date').value || todayString();
  const type = editor.querySelector('.inline-stage-type').value;

  if (!name) {
    alert(t('eventNameRequired'));
    editor.querySelector('.inline-stage-name').focus();
    return;
  }

  if (!Array.isArray(sub.timelineNodes)) sub.timelineNodes = [];
  const nodeValues = {
    name,
    type,
    status: 'completed',
    planDate: '',
    dueDate: '',
    completeDate: eventDate,
    notes: ''
  };

  sub.timelineNodes.push(createTimelineNode(subId, nodeValues));
  await window.storage.saveAll(db);
  renderDashboard();
  showGlobalToast(tf('eventAddedToast', { name }), 'success');
}

function inferKey(node) {
  if (node.key && node.key !== 'auto') return node.key;
  const t = `${node.name || ''} ${node.notes || ''}`.toLowerCase();
  if (/online|publication|published|见刊|上线/.test(t) || node.type === 'publication' && t.includes('online')) return 'online';
  if (/accept|accepted|接收|录用/.test(t) || node.type === 'publication' && t.includes('accept')) return 'accept';
  if (/r2|second/.test(t) && (/submit|revis|修回|resubmitted/.test(t) || node.type === 'revision')) return 'r2_revised';
  if (/r2|second/.test(t) && (/comment|decision|review|意见|returned/.test(t) || node.type === 'review')) return 'r2_comments';
  if (/r1|first/.test(t) && (/submit|revis|修回|resubmitted/.test(t) || node.type === 'revision')) return 'r1_revised';
  if (/r1|first|comment|decision|审稿意见|一审|returned/.test(t) || node.type === 'review' || node.type === 'revision') return 'r1_comments';
  if (/submit|submission|submitted|投稿/.test(t) || node.type === 'submission') return 'submit';
  if (/draft|manuscript|completed|finished|手稿/.test(t) || node.type === 'writing') return 'draft_done';
  if (/experiment|data|complete|completed|实验|数据/.test(t) || node.type === 'research') return 'experiment_done';
  return 'auto';
}

function getTimelineNodeByKey(sub, key) {
  return (sub.timelineNodes || []).find(node => node.key === key || inferKey(node) === key) || null;
}

function setTimelineNodeDate(node, date, field = 'completeDate') {
  if (!node || !date) return false;
  let changed = false;
  ['planDate', 'dueDate', 'completeDate'].forEach(dateField => {
    const next = dateField === field ? date : '';
    if ((node[dateField] || '') !== next) {
      node[dateField] = next;
      changed = true;
    }
  });
  return changed;
}

function createCanonicalTimelineNode(subId, key, name, type, status = 'pending') {
  return createTimelineNode(subId, { key, name, type, status });
}

function ensureTimelineNode(sub, key, name, type, status = 'pending') {
  if (!Array.isArray(sub.timelineNodes)) sub.timelineNodes = [];
  let node = getTimelineNodeByKey(sub, key);
  if (!node) {
    node = createCanonicalTimelineNode(sub.id, key, name, type, status);
    sub.timelineNodes.push(node);
    return { node, changed: true };
  }

  let changed = false;
  if (node.key !== key) {
    node.key = key;
    changed = true;
  }
  if (!node.type || node.type === 'special') {
    node.type = type;
    changed = true;
  }
  return { node, changed };
}

function initializeSubmissionTimelineNodes(sub) {
  const submitDate = normalizeDateString(sub.submissionDate);
  const firstDecisionDate = normalizeDateString(sub.firstDecisionDate);
  const revisionDueDate = normalizeDateString(sub.revisionDueDate);
  const decisionDate = normalizeDateString(sub.decisionDate);

  sub.timelineNodes = [
    createTimelineNode(sub.id, { key: 'experiment_done', name: 'Experiments Completed', type: 'research', status: 'completed' }),
    createTimelineNode(sub.id, { key: 'draft_done', name: 'Draft Completed', type: 'writing', status: submitDate ? 'completed' : 'pending' }),
    createTimelineNode(sub.id, {
      key: 'submit',
      name: 'Manuscript Submitted',
      type: 'submission',
      status: submitDate ? 'completed' : 'pending',
      completeDate: submitDate
    }),
    createTimelineNode(sub.id, {
      key: 'r1_comments',
      name: 'Review Comments R1',
      type: 'review',
      status: firstDecisionDate ? 'completed' : (revisionDueDate ? 'active' : 'pending'),
      completeDate: firstDecisionDate,
      dueDate: firstDecisionDate ? '' : revisionDueDate
    }),
    createTimelineNode(sub.id, { key: 'r1_revised', name: 'R1 Revision Submitted', type: 'revision', status: 'pending' }),
    createTimelineNode(sub.id, {
      key: 'accept',
      name: 'Accepted',
      type: 'publication',
      status: decisionDate && (sub.status === 'accepted' || sub.status === 'published') ? 'completed' : 'pending',
      completeDate: decisionDate && (sub.status === 'accepted' || sub.status === 'published') ? decisionDate : ''
    }),
    createTimelineNode(sub.id, {
      key: 'online',
      name: 'Online Publication',
      type: 'publication',
      status: decisionDate && sub.status === 'published' ? 'completed' : 'pending',
      completeDate: decisionDate && sub.status === 'published' ? decisionDate : ''
    })
  ];
}

function syncSubmissionFieldsFromTimeline(sub) {
  if (!sub || !Array.isArray(sub.timelineNodes)) return false;
  let changed = false;
  const submitNode = getTimelineNodeByKey(sub, 'submit');
  const submitNodeDate = normalizeDateString(getNodeDate(submitNode));
  if (submitNodeDate && normalizeDateString(sub.submissionDate) !== submitNodeDate) {
    sub.submissionDate = dateInputToIso(submitNodeDate);
    changed = true;
  }

  const r1Node = getTimelineNodeByKey(sub, 'r1_comments');
  const r1Date = normalizeDateString(r1Node?.completeDate || '');
  if (r1Date && normalizeDateString(sub.firstDecisionDate) !== r1Date) {
    sub.firstDecisionDate = dateInputToIso(r1Date);
    changed = true;
  }

  const acceptNode = getTimelineNodeByKey(sub, 'accept') || getTimelineNodeByKey(sub, 'online');
  const acceptDate = normalizeDateString(acceptNode?.completeDate || '');
  if (acceptDate && normalizeDateString(sub.decisionDate) !== acceptDate) {
    sub.decisionDate = dateInputToIso(acceptDate);
    changed = true;
  }

  return changed;
}

function normalizeSubmissionTimeline(sub) {
  if (!sub) return false;
  let changed = false;
  if (!Array.isArray(sub.timelineNodes) || sub.timelineNodes.length === 0) {
    initializeSubmissionTimelineNodes(sub);
    changed = true;
  }

  const submitDate = normalizeDateString(sub.submissionDate);
  if (submitDate) {
    const result = ensureTimelineNode(sub, 'submit', 'Manuscript Submitted', 'submission', 'completed');
    changed = result.changed || changed;
    changed = setTimelineNodeDate(result.node, submitDate, 'completeDate') || changed;
    if (result.node.status !== 'completed') {
      result.node.status = 'completed';
      changed = true;
    }
  } else {
    changed = syncSubmissionFieldsFromTimeline(sub) || changed;
  }

  const firstDecisionDate = normalizeDateString(sub.firstDecisionDate);
  if (firstDecisionDate) {
    const result = ensureTimelineNode(sub, 'r1_comments', 'Review Comments R1', 'review', 'completed');
    changed = result.changed || changed;
    changed = setTimelineNodeDate(result.node, firstDecisionDate, 'completeDate') || changed;
    if (result.node.status !== 'completed') {
      result.node.status = 'completed';
      changed = true;
    }
  }

  const revisionDueDate = normalizeDateString(sub.revisionDueDate);
  if (revisionDueDate && !firstDecisionDate) {
    const result = ensureTimelineNode(sub, 'r1_comments', 'Review Comments R1', 'review', 'active');
    changed = result.changed || changed;
    if ((result.node.dueDate || '') !== revisionDueDate) {
      result.node.dueDate = revisionDueDate;
      changed = true;
    }
    if (result.node.status === 'pending') {
      result.node.status = 'active';
      changed = true;
    }
  }

  const decisionDate = normalizeDateString(sub.decisionDate);
  if (decisionDate && (sub.status === 'accepted' || sub.status === 'published')) {
    const key = sub.status === 'published' ? 'online' : 'accept';
    const result = ensureTimelineNode(sub, key, key === 'online' ? 'Online Publication' : 'Accepted', 'publication', 'completed');
    changed = result.changed || changed;
    changed = setTimelineNodeDate(result.node, decisionDate, 'completeDate') || changed;
    if (result.node.status !== 'completed') {
      result.node.status = 'completed';
      changed = true;
    }
  }

  if (changed) sub.updatedAt = new Date().toISOString();
  return changed;
}

function analyzeSubmission(sub) {
  normalizeSubmissionTimeline(sub);
  const events = [...(sub.timelineNodes || [])].sort((a, b) => {
    const da = a.completeDate || a.planDate || a.dueDate || a.createdAt || '';
    const db = b.completeDate || b.planDate || b.dueDate || b.createdAt || '';
    return new Date(da) - new Date(db);
  });
  
  const getKeyEventDate = (key) => {
    const node = events.find(e => inferKey(e) === key);
    const nodeDate = node ? normalizeDateString(node.completeDate || node.planDate || node.dueDate) : null;
    if (key === 'submit') return normalizeDateString(sub.submissionDate) || nodeDate;
    if (key === 'r1_comments') return normalizeDateString(sub.firstDecisionDate) || nodeDate;
    if (key === 'accept' || key === 'online') {
      return normalizeDateString(sub.decisionDate) && (sub.status === 'accepted' || sub.status === 'published')
        ? normalizeDateString(sub.decisionDate)
        : nodeDate;
    }
    return nodeDate;
  };

  const datedResearchEvent = events.find(e => e.type === 'research' && getNodeDate(e));
  const experimentDate = getKeyEventDate('experiment_done') || (datedResearchEvent ? getNodeDate(datedResearchEvent) : null);
  const submitDate = getKeyEventDate('submit');
  const submitNode = events.find(e => inferKey(e) === 'submit');
  const submitDateSource = normalizeDateString(sub.submissionDate)
    ? t('dateSourceSubmission')
    : (normalizeDateString(getNodeDate(submitNode)) ? t('dateSourceTimeline') : t('dateSourceMissing'));
  const r1Date = getKeyEventDate('r1_comments');
  const acceptDate = getKeyEventDate('accept');
  const onlineDate = getKeyEventDate('online');
  
  const latest = getLatestTimelineNode(sub.timelineNodes || []);
  const accepted = Boolean(acceptDate) || sub.status === 'accepted' || sub.status === 'published';

  const expToSubmit = experimentDate && submitDate ? getDaysDiff(experimentDate, submitDate) : null;
  const submitToNow = submitDate && !accepted ? getDaysDiff(submitDate, todayString()) : null;
  const r1ToNow = r1Date && !accepted ? getDaysDiff(r1Date, todayString()) : null;
  const submitToAccept = submitDate && acceptDate ? getDaysDiff(submitDate, acceptDate) : null;
  const acceptToOnline = acceptDate && onlineDate ? getDaysDiff(acceptDate, onlineDate) : null;

  let display = {
    mode: "prepare",
    label: t('displayPrepareLabel'),
    value: expToSubmit,
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
    caption: t('displayPrepareCaption'),
    pending: false,
    milestones: [
      { name: t('milestoneExperimentDone'), date: experimentDate, color: "#2563eb", emphasis: true, node: events.find(e => inferKey(e) === 'experiment_done') },
      { name: t('milestoneSubmission'), date: submitDate, color: "#f97316", emphasis: true, node: events.find(e => inferKey(e) === 'submit') }
    ]
  };

  if (accepted) {
    display = {
      mode: "accepted",
      label: t('displayAcceptedLabel'),
      value: submitToAccept,
      color: "#16a34a",
      bg: "#f0fdf4",
      border: "#bbf7d0",
      caption: t('displayAcceptedCaption'),
      pending: false,
      milestones: [
        { name: t('milestoneSubmission'), date: submitDate, color: "#f97316", emphasis: true, node: events.find(e => inferKey(e) === 'submit') },
        { name: t('milestoneAcceptance'), date: acceptDate, color: "#16a34a", emphasis: true, node: events.find(e => inferKey(e) === 'accept') }
      ]
    };
  } else if (r1Date) {
    display = {
      mode: "r1-active",
      label: t('displayR1Label'),
      value: r1ToNow,
      color: "#dc2626",
      bg: "#fef2f2",
      border: "#fecaca",
      caption: t('displayR1Caption'),
      pending: true,
      milestones: [
        { name: t('milestoneSubmission'), date: submitDate, color: "#f97316", emphasis: false, node: events.find(e => inferKey(e) === 'submit') },
        { name: t('milestoneR1Comments'), date: r1Date, color: "#dc2626", emphasis: true, node: events.find(e => inferKey(e) === 'r1_comments') },
        { name: t('milestoneToday'), date: todayString(), color: "#dc2626", emphasis: true, today: true }
      ]
    };
  } else if (submitDate) {
    display = {
      mode: "under-review",
      label: t('displayReviewLabel'),
      value: submitToNow,
      color: "#f97316",
      bg: "#fff7ed",
      border: "#fed7aa",
      caption: t('displayReviewCaption'),
      pending: true,
      milestones: [
        { name: t('milestoneSubmission'), date: submitDate, color: "#f97316", emphasis: true, node: events.find(e => inferKey(e) === 'submit') },
        { name: t('milestoneToday'), date: todayString(), color: "#f97316", emphasis: true, today: true }
      ]
    };
  }

  // Adjust display theme variables based on prefers-color-scheme dynamically
  const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (isDarkMode) {
    if (display.mode === 'prepare') {
      display.bg = 'rgba(37,99,235,0.08)';
      display.border = 'rgba(37,99,235,0.3)';
    } else if (display.mode === 'accepted') {
      display.bg = 'rgba(22,163,74,0.08)';
      display.border = 'rgba(22,163,74,0.3)';
    } else if (display.mode === 'r1-active') {
      display.bg = 'rgba(220,38,38,0.08)';
      display.border = 'rgba(220,38,38,0.3)';
    } else if (display.mode === 'under-review') {
      display.bg = 'rgba(249,115,22,0.08)';
      display.border = 'rgba(249,115,22,0.3)';
    }
  }

  let stateLabel = t('statePreparing');
  let stateColor = "#64748b";
  let stateNote = submitDate ? t('stateSubmitted') : t('stateNotSubmitted');
  if (onlineDate) { stateLabel = t('stateOnline'); stateColor = "#15803d"; stateNote = formatShortDate(onlineDate); }
  else if (acceptDate) { stateLabel = t('stateAccepted'); stateColor = "#16a34a"; stateNote = formatShortDate(acceptDate); }
  else if (r1Date) { stateLabel = t('stateAfterR1'); stateColor = "#dc2626"; stateNote = tf('stateSinceR1', { count: r1ToNow ?? "—" }); }
  else if (submitDate) { stateLabel = t('stateUnderReview'); stateColor = "#0891b2"; stateNote = tf('stateSinceSubmit', { count: submitToNow ?? "—" }); }

  return { events, experimentDate, submitDate, submitDateSource, r1Date, acceptDate, onlineDate, latest, accepted, expToSubmit, submitToNow, r1ToNow, submitToAccept, acceptToOnline, display, stateLabel, stateColor, stateNote };
}

function isAcceptedSubmission(sub) {
  return Boolean(sub && analyzeSubmission(sub).accepted);
}

function getDashboardFilterLabel() {
  if (currentDashboardFilter === 'accepted') return t('acceptedPipelines');
  if (currentDashboardFilter === 'active') return t('activePipelines');
  return t('allPipelines');
}

function getSubmissionAttentionScore(sub) {
  const analysis = analyzeSubmission(sub);
  const nodes = sub.timelineNodes || [];
  const hasBlocked = nodes.some(n => computeNodeStatus(n) === 'blocked');
  const hasOverdue = nodes.some(n => computeNodeStatus(n) === 'overdue');
  const hasDueSoon = nodes.some(n => computeNodeStatus(n) === 'due_soon');
  const hasRevision = /revision/.test(sub.status || '') || Boolean(analysis.r1Date);

  if (hasBlocked || hasOverdue) return 0;
  if (hasRevision) return 1;
  if (!analysis.accepted && analysis.submitDate) return 2;
  if (hasDueSoon) return 3;
  if (!analysis.submitDate) return 4;
  return analysis.accepted ? 6 : 5;
}

function getSubmissionDoi(sub) {
  const direct = normalizeDoi(sub?.doi || sub?.DOI || sub?.articleDoi || sub?.metadata?.doi || sub?.attributes?.doi);
  if (direct) return direct;

  const textDoi = extractDoiFromText([sub?.notes, sub?.summary, sub?.description, sub?.articleUrl, sub?.journalUrl].filter(Boolean).join(' '));
  if (textDoi) return textDoi;

  const manuscript = db?.manuscripts?.find(m => m.id === sub?.manuscriptId);
  const title = normalizeText(manuscript?.title || sub?.title || '');
  const journal = normalizeText(sub?.targetJournal || sub?.journalName || '');
  const achievement = db?.achievements?.find(ach => {
    const achTitle = normalizeText(ach.title || '');
    const achJournal = normalizeText(ach.journal || '');
    return ach.doi && (
      (title && achTitle && (achTitle === title || achTitle.includes(title) || title.includes(achTitle))) ||
      (journal && achJournal && achJournal === journal)
    );
  });
  return normalizeDoi(achievement?.doi || '');
}

function getSubmissionJournalName(sub) {
  if (!sub) return t('targetJournal');
  const manuscript = db?.manuscripts?.find(m => m.id === sub.manuscriptId);
  const manuscriptJournal = Array.isArray(manuscript?.targetJournals)
    ? manuscript.targetJournals[0]
    : manuscript?.targetJournal;
  return sub.targetJournal || sub.journalName || sub.journal || sub.publisher || manuscriptJournal || t('targetJournal');
}

function getSubmissionArticleUrl(sub) {
  const explicitUrl = String(sub?.articleUrl || sub?.publicationUrl || sub?.url || sub?.journalArticleUrl || '').trim();
  if (explicitUrl) return explicitUrl;
  const doi = getSubmissionDoi(sub);
  return doi ? `https://doi.org/${doi}` : '';
}

function getSubmissionSortTime(sub) {
  const analysis = analyzeSubmission(sub);
  const normalized = normalizeDateString(sub?.submissionDate) || analysis.submitDate || normalizeDateString(sub?.submittedAt);
  if (normalized) return new Date(`${normalized}T12:00:00.000Z`).getTime();
  return 0;
}

function sortDashboardSubmissions(submissions) {
  return [...submissions].sort((a, b) => {
    const submittedA = getSubmissionSortTime(a);
    const submittedB = getSubmissionSortTime(b);
    if (submittedA !== submittedB) return submittedA - submittedB;

    const da = getNodeDate(getLatestTimelineNode(a.timelineNodes || [])) || a.updatedAt || a.createdAt || '';
    const db = getNodeDate(getLatestTimelineNode(b.timelineNodes || [])) || b.updatedAt || b.createdAt || '';
    return new Date(da || 0) - new Date(db || 0);
  });
}

// --- VIEW 1: DASHBOARD OVERVIEW ---
// --- VIEW 1: DASHBOARD OVERVIEW ---
function renderDashboard() {
  // Calculate interactive stats counts
  const visibleSubmissions = db.submissions.filter(s => s.status !== 'rejected');
  let timelineChanged = false;
  visibleSubmissions.forEach(sub => {
    timelineChanged = normalizeSubmissionTimeline(sub) || timelineChanged;
  });
  if (timelineChanged) window.storage.saveAll(db).catch(console.error);
  const acceptedCount = visibleSubmissions.filter(isAcceptedSubmission).length;
  const activeCount = visibleSubmissions.filter(s => !isAcceptedSubmission(s)).length;
  const totalCount = visibleSubmissions.length;

  document.getElementById('stat-accepted-submissions').textContent = acceptedCount;
  document.getElementById('stat-active-submissions').textContent = activeCount;
  document.getElementById('stat-total-submissions').textContent = totalCount;
  const filterLabel = document.getElementById('dashboard-filter-label');
  if (filterLabel) filterLabel.textContent = getDashboardFilterLabel();

  // Calculate top summary metrics using analyzeSubmission
  const analyses = db.submissions.filter(s => s.status !== 'rejected').map(analyzeSubmission);
  const expSubmit = analyses.map(a => a.expToSubmit).filter(v => v !== null && !isNaN(v) && v >= 0);
  const submitNow = analyses.filter(a => !a.accepted).map(a => a.submitToNow).filter(v => v !== null && !isNaN(v) && v >= 0);
  const r1Now = analyses.filter(a => !a.accepted).map(a => a.r1ToNow).filter(v => v !== null && !isNaN(v) && v >= 0);
  const submitAccept = analyses.filter(a => a.accepted).map(a => a.submitToAccept).filter(v => v !== null && !isNaN(v) && v >= 0);

  applyLanguage();
  const avgText = (arr) => arr.length ? `${Math.round(arr.reduce((s, n) => s + n, 0) / arr.length)}${t('dayUnitShort')}` : "—";
  
  if (document.getElementById("mExpSubmit")) document.getElementById("mExpSubmit").textContent = avgText(expSubmit);
  if (document.getElementById("mSubmitNow")) document.getElementById("mSubmitNow").textContent = avgText(submitNow);
  if (document.getElementById("mR1Now")) document.getElementById("mR1Now").textContent = avgText(r1Now);
  if (document.getElementById("mSubmitAccept")) document.getElementById("mSubmitAccept").textContent = avgText(submitAccept);

  // 1. Pipeline Timeline Cards
  const ganttBox = document.getElementById('dashboard-gantt');
  ganttBox.innerHTML = '';
  
  // Apply active filter state
  let submissionsList = visibleSubmissions;
  if (currentDashboardFilter === 'accepted') {
    submissionsList = submissionsList.filter(isAcceptedSubmission);
  } else if (currentDashboardFilter === 'active') {
    submissionsList = submissionsList.filter(s => !isAcceptedSubmission(s));
  }
  submissionsList = sortDashboardSubmissions(submissionsList);

  if (submissionsList.length === 0) {
    ganttBox.innerHTML = `<p class="empty-state">${t('noPipelines')}</p>`;
  } else {
    submissionsList.forEach((sub, index) => {
      const man = db.manuscripts.find(m => m.id === sub.manuscriptId);
      const manTitle = man ? man.title : t('untitledManuscript');
      const journalName = getSubmissionJournalName(sub);
      
      // Auto initialize default standard nodes if not present
      if (!sub.timelineNodes || sub.timelineNodes.length === 0) {
        sub.timelineNodes = [
          { id: `node_1_${sub.id}_${Date.now()}`, name: 'Experiments Completed', type: 'research', planDate: '', completeDate: '', dueDate: '', status: 'completed', notes: '' },
          { id: `node_2_${sub.id}_${Date.now()}`, name: 'Data Organization', type: 'research', planDate: '', completeDate: '', dueDate: '', status: 'completed', notes: '' },
          { id: `node_3_${sub.id}_${Date.now()}`, name: 'Draft Completed', type: 'writing', planDate: '', completeDate: '', dueDate: '', status: 'completed', notes: '' },
          { id: `node_4_${sub.id}_${Date.now()}`, name: 'Manuscript Submitted', type: 'submission', planDate: '', completeDate: '', dueDate: '', status: 'active', notes: '' },
          { id: `node_5_${sub.id}_${Date.now()}`, name: 'Review Comments R1', type: 'review', planDate: '', completeDate: '', dueDate: '', status: 'pending', notes: '' },
          { id: `node_6_${sub.id}_${Date.now()}`, name: 'R1 Revision Submitted', type: 'revision', planDate: '', completeDate: '', dueDate: '', status: 'pending', notes: '' },
          { id: `node_7_${sub.id}_${Date.now()}`, name: 'Accepted', type: 'publication', planDate: '', completeDate: '', dueDate: '', status: 'pending', notes: '' },
          { id: `node_8_${sub.id}_${Date.now()}`, name: 'Online Publication', type: 'publication', planDate: '', completeDate: '', dueDate: '', status: 'pending', notes: '' }
        ];
        window.storage.saveAll(db).catch(console.error);
      }

      // Analyze submission via the unified helper
      const a = analyzeSubmission(sub);
      
      // Determine visual stage category borders
      let stageClass = 'stage-active';
      if (a.accepted || sub.status === 'accepted' || sub.status === 'published') {
        stageClass = 'stage-accepted';
      } else if ((sub.status || '').includes('revision')) {
        stageClass = 'stage-revision';
      } else {
        const sortedNodes = autoSortNodes(sub.timelineNodes);
        const hasOverdue = sortedNodes.some(n => { const s = computeNodeStatus(n); return s === 'overdue' || s === 'blocked'; });
        if (hasOverdue) stageClass = 'stage-exception';
      }

      // Build premium 4-column event rail card matching the reference design
      const card = document.createElement('div');
      card.className = `pipeline-card ${stageClass}`;

      const latestMeta = a.latest ? getTimelineTypeMeta(a.latest.type) : { color: "#64748b", label: t('typeNoEvent') };
      const latestDate = a.latest ? getNodeDate(a.latest) : '';
      const latestRelative = latestDate ? getRelativeDateLabel(latestDate) : '';
      const submissionDoi = getSubmissionDoi(sub);
      const articleUrl = getSubmissionArticleUrl(sub);
      const doiHtml = submissionDoi
        ? `<a class="doi-link" href="${escapeHTML(articleUrl || `https://doi.org/${submissionDoi}`)}" target="_blank" rel="noopener noreferrer">${t('doiLabel')}: ${escapeHTML(submissionDoi)}</a>`
        : (articleUrl
          ? `<a class="doi-link" href="${escapeHTML(articleUrl)}" target="_blank" rel="noopener noreferrer">${t('articlePage')}</a>`
          : `<span class="doi-missing">${t('doiNotSet')}</span>`);

      // Col 2 Event Rail details
      const milestones = a.display.milestones.filter(m => m.name && m.date !== undefined);
      const count = Math.max(2, milestones.length);

      let railHtml = `
        <div class="event-rail" style="--count:${count}">
          <div class="rail-track ${a.display.pending ? "pending" : ""}"></div>
      `;

      milestones.forEach(m => {
        const isInteractive = m.node ? true : false;
        railHtml += `
          <div class="milestone">
            <div class="dot-wrap">
              <div class="dot ${m.emphasis ? "emphasis" : ""} ${m.today ? "today" : ""} ${isInteractive ? "interactive-dot" : ""}" 
                   style="--dot-color:${m.color || a.display.color}; ${isInteractive ? 'cursor: pointer;' : ''}" 
                   ${isInteractive ? `data-node-id="${escapeHTML(m.node.id)}" data-sub-id="${escapeHTML(sub.id)}" title="${escapeHTML(t('clickEditEvent'))}: ${escapeHTML(m.name)}"` : ''}></div>
            </div>
            <div class="milestone-name">${escapeHTML(m.name)}</div>
            <div class="milestone-date">${m.date ? formatShortDate(m.date) : "—"}</div>
          </div>
        `;
      });

      railHtml += `
        </div>
        <div class="rail-caption">
          <span>${t('keyEventRail')}</span>
          <span class="caption-highlight">${a.display.pending ? t('countingNow') : t('completedInterval')}</span>
        </div>
      `;

      card.innerHTML = `
        <!-- Col 1: Manuscript Info -->
        <div class="project-info">
          <div class="project-heading-row">
            <span class="submission-index">${index + 1}</span>
            <div class="journal">${escapeHTML(journalName)}</div>
          </div>
          <h3 class="project-title" title="${escapeHTML(manTitle)}">${escapeHTML(manTitle)}</h3>
          <div class="project-meta">
            <span>${tf('nodesSaved', { count: sub.timelineNodes.length })}</span>
            <span>${t('timelineSortedBySubmissionDate')}: ${a.submitDate ? escapeHTML(formatShortDate(a.submitDate)) : t('noDate')}</span>
            <span>${t('expSubmitShort')} ${a.expToSubmit === null ? "—" : a.expToSubmit + t('dayUnitShort')}</span>
            <span>${t('timelineDateSource')}: ${escapeHTML(a.submitDateSource)}</span>
          </div>
          <div class="pipeline-link-row">
            ${doiHtml}
          </div>
          <div class="pipeline-actions" style="margin-top: 12px; display: flex; gap: 8px;">
            <button class="btn-secondary btn-sm btn-pipeline-add" data-sub-id="${escapeHTML(sub.id)}">${t('addEvent')}</button>
          </div>
        </div>

        <!-- Col 2: Middle Core Panel -->
        <div class="core-panel" style="--panel-color:${a.display.color}; --panel-bg:${a.display.bg}; --panel-border:${a.display.border}">
          <div class="core-head">
            <div>
              <div class="core-label">${escapeHTML(a.display.label)}</div>
              <div class="core-sub">${escapeHTML(a.display.caption)}</div>
            </div>
            <div class="core-value"><strong>${a.display.value === null ? "—" : a.display.value}</strong><span>${t('days')}</span></div>
          </div>
          ${railHtml}
        </div>

        <!-- Col 3: Latest Node Window -->
        <div class="latest-window" data-sub-id="${escapeHTML(sub.id)}" data-latest-id="${a.latest ? escapeHTML(a.latest.id) : ''}">
          <div class="latest-head">
            <span>${t('latestEvent')}</span>
            <span class="node-type" style="--node-color:${latestMeta.color}">${escapeHTML(latestMeta.label)}</span>
          </div>
          <div class="latest-title">${a.latest ? escapeHTML(getTimelineNodeDisplayName(a.latest)) : t('noEventYet')}</div>
          <div class="latest-date">${a.latest ? `${latestDate ? escapeHTML(formatShortDate(latestDate)) : t('noDate')}${latestRelative ? ` · ${escapeHTML(latestRelative)}` : ''}` : t('addEventStart')}</div>
          <div class="latest-note">${a.latest ? escapeHTML(a.latest.notes || t('clickEditEvent')) : t('clickAddEvent')}</div>
        </div>

        <!-- Col 4: State Box -->
        <div class="state-box">
          <span class="state-pill" style="--state-color:${a.stateColor}">${escapeHTML(a.stateLabel)}</span>
          <div class="state-note">${escapeHTML(a.stateNote)}</div>
        </div>
        ${buildInlineStageEditor(sub.id)}
      `;

      // Setup click listeners for interactive dots in Col 2
      card.querySelectorAll('.dot.interactive-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          const nodeId = dot.getAttribute('data-node-id');
          const subId = dot.getAttribute('data-sub-id');
          openStageDrawer(subId, nodeId);
        });
      });

      // Setup click listener for latest-window in Col 3
      const latestWindow = card.querySelector('.latest-window');
      if (latestWindow) {
        latestWindow.addEventListener('click', (e) => {
          e.stopPropagation();
          const latestId = latestWindow.getAttribute('data-latest-id');
          const subId = latestWindow.getAttribute('data-sub-id');
          if (latestId) {
            openStageDrawer(subId, latestId);
          } else {
            toggleInlineStageEditor(card, true);
          }
        });
      }

      ganttBox.appendChild(card);
    });

    // Delegate inline event creation.
    ganttBox.querySelectorAll('.btn-pipeline-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleInlineStageEditor(btn.closest('.pipeline-card'), true);
      });
    });

    ganttBox.querySelectorAll('.btn-inline-stage-cancel').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleInlineStageEditor(btn.closest('.pipeline-card'), false);
      });
    });

    ganttBox.querySelectorAll('.btn-inline-stage-save').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await saveInlineStageEvent(btn.closest('.inline-stage-editor'));
      });
    });
  }




  // 2. Recent Research Logs
  const recentLogs = document.getElementById('dashboard-recent-records');
  recentLogs.innerHTML = '';
  const sortedRecords = [...db.researchRecords]
    .sort((a, b) => new Date(b.occurredAt || b.createdAt) - new Date(a.occurredAt || a.createdAt))
    .slice(0, 5);

  if (sortedRecords.length === 0) {
    recentLogs.innerHTML = `<p class="empty-state">${t('noRecentRecords')}</p>`;
  } else {
    sortedRecords.forEach(rec => {
      const item = document.createElement('div');
      item.className = 'recent-item';
      
      const title = document.createElement('span');
      title.className = 'recent-item-title';
      title.textContent = rec.title;

      const badge = document.createElement('span');
      badge.className = `badge badge-${rec.recordType === 'literature_review' ? 'info' : 'purple'}`;
      badge.textContent = rec.recordType;

      const date = document.createElement('span');
      date.className = 'recent-item-date';
      date.textContent = new Date(rec.occurredAt || rec.createdAt).toLocaleDateString();

      item.appendChild(title);
      item.appendChild(badge);
      item.appendChild(date);
      recentLogs.appendChild(item);
    });
  }

  // 3. Timeline alerts and review milestones
  const reviewMilestones = document.getElementById('dashboard-pending-milestones');
  reviewMilestones.innerHTML = '';

  const timelineAlerts = [];
  db.submissions
    .filter(s => s.status !== 'rejected')
    .forEach(sub => {
      const man = db.manuscripts.find(m => m.id === sub.manuscriptId);
      (sub.timelineNodes || []).forEach(node => {
        const computedStatus = computeNodeStatus(node);
        const importantType = node.type === 'review' || node.type === 'revision' || node.type === 'publication';
        const actionable = computedStatus === 'overdue' || computedStatus === 'due_soon' || computedStatus === 'blocked' || node.status === 'active';
        const hasTimelineDate = Boolean(node.dueDate || node.planDate || node.completeDate);
        if (!actionable && !hasTimelineDate) return;
        if (!importantType && !actionable) return;
        if (computedStatus === 'completed') return;

        timelineAlerts.push({
          sub,
          node,
          computedStatus,
          title: `${getSubmissionJournalName(sub)}: ${getTimelineNodeDisplayName(node)}`,
          date: node.dueDate || node.planDate || node.completeDate || sub.revisionDueDate || '',
          manTitle: man ? man.title : t('untitledManuscript')
        });
      });
    });

  const statusRank = { overdue: 0, blocked: 1, due_soon: 2, in_progress: 3, not_started: 4, upcoming: 5 };
  timelineAlerts.sort((a, b) => {
    const ra = statusRank[a.computedStatus] ?? 9;
    const rb = statusRank[b.computedStatus] ?? 9;
    if (ra !== rb) return ra - rb;
    return new Date(a.date || '2999-12-31') - new Date(b.date || '2999-12-31');
  });

  if (timelineAlerts.length === 0) {
    reviewMilestones.innerHTML = `<p class="empty-state">${t('noUrgentEvents')}</p>`;
  } else {
    timelineAlerts.slice(0, 5).forEach(alert => {
      const item = document.createElement('div');
      item.className = 'recent-item';
      item.title = alert.manTitle;
      
      const title = document.createElement('span');
      title.className = 'recent-item-title';
      title.textContent = alert.title;

      const badge = document.createElement('span');
      const badgeClass = alert.computedStatus === 'overdue' || alert.computedStatus === 'blocked'
        ? 'danger'
        : alert.computedStatus === 'due_soon'
          ? 'warning'
          : 'info';
      badge.className = `badge badge-${badgeClass}`;
      badge.textContent = getNodeStatusLabel(alert.computedStatus);

      const date = document.createElement('span');
      date.className = 'recent-item-date';
      date.textContent = alert.date ? formatShortDate(alert.date) : t('noDate');

      item.appendChild(title);
      item.appendChild(badge);
      item.appendChild(date);
      reviewMilestones.appendChild(item);
    });
  }
}

// --- PIPELINE TIMELINE HELPERS ---
function getSubmissionCycleTime(sub) {
  const start = sub.submissionDate ? new Date(sub.submissionDate) : (sub.createdAt ? new Date(sub.createdAt) : new Date());
  
  const isCompleted = sub.status === 'accepted' || sub.status === 'published';
  let end = new Date();
  
  if (isCompleted) {
    if (sub.decisionDate) {
      end = new Date(sub.decisionDate);
    } else {
      // Fallback: look for completed milestone nodes like '接收', 'Online'
      const completionNode = sub.timelineNodes?.find(n => 
        (n.name.includes('接收') || n.name.toLowerCase().includes('accept') || n.name.toLowerCase().includes('online')) && 
        n.completeDate
      );
      if (completionNode) {
        end = new Date(completionNode.completeDate);
      } else if (sub.updatedAt) {
        end = new Date(sub.updatedAt);
      }
    }
  }
  
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return {
    days: diffDays,
    isCompleted: isCompleted,
    startDateStr: start.toLocaleDateString(),
    endDateStr: end.toLocaleDateString()
  };
}

function computeNodeStatus(node) {
  if (node.completeDate || node.status === 'completed') return 'completed';
  if (node.status === 'danger' || node.status === 'blocked') return 'blocked';
  
  if (node.dueDate) {
    const dueTime = new Date(node.dueDate).getTime();
    const now = new Date(); now.setHours(0,0,0,0);
    const diffDays = Math.ceil((dueTime - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 7) return 'due_soon';
  }
  
  if (node.status === 'active') return 'in_progress';
  if (node.status === 'pending') return 'not_started';
  return 'upcoming';
}

function getNodeStatusLabel(status) {
  const keyMap = {
    completed: 'statusCompleted',
    blocked: 'statusBlocked',
    overdue: 'statusOverdue',
    due_soon: 'statusDueSoon',
    in_progress: 'statusInProgress',
    not_started: 'statusPlannedNotStarted',
    upcoming: 'statusUpcoming'
  };
  return t(keyMap[status] || 'statusUpcoming');
}

function autoSortNodes(nodes) {
  return [...nodes].sort((a, b) => {
    const getDate = (n) => n.completeDate || n.planDate || n.dueDate || n.createdAt || '';
    const da = getDate(a);
    const db = getDate(b);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return new Date(da) - new Date(db);
  });
}

function getCapsuleIcon(status, type) {
  if (status === 'completed') return '✓';
  if (status === 'blocked') return '✕';
  if (status === 'overdue') return '🔴';
  if (status === 'due_soon') return '⚠';
  if (status === 'in_progress') return '●';
  if (status === 'not_started' || status === 'upcoming') return '◯';
  if (status === 'milestone') return '⭐';
  return '◯';
}

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const locale = currentLanguage === 'zh' ? 'zh-CN' : 'en-US';
    return d.toLocaleDateString(locale, currentLanguage === 'zh'
      ? { month: 'numeric', day: 'numeric' }
      : { month: 'short', day: 'numeric' });
  } catch (e) {
    return '';
  }
}

function openStageDrawer(subId, nodeId) {
  const sub = db.submissions.find(s => s.id === subId);
  if (!sub) return;
  if (!Array.isArray(sub.timelineNodes)) sub.timelineNodes = [];

  const node = sub.timelineNodes.find(n => n.id === nodeId);
  if (!node) {
    showGlobalToast(t('eventNotFound'), 'error');
    renderDashboard();
    return;
  }

  const typeOptions = [
    { value: 'research', label: t('eventTypeResearch') },
    { value: 'writing', label: t('eventTypeWriting') },
    { value: 'submission', label: t('eventTypeSubmission') },
    { value: 'review', label: t('eventTypeReview') },
    { value: 'revision', label: t('eventTypeRevision') },
    { value: 'publication', label: t('eventTypePublication') },
    { value: 'special', label: t('specialException') }
  ];

  const keyOptions = [
    { value: 'auto', label: t('keyAuto') },
    { value: 'experiment_done', label: t('keyExperimentsDone') },
    { value: 'draft_done', label: t('keyDraftDone') },
    { value: 'submit', label: t('keySubmitted') },
    { value: 'r1_comments', label: t('keyR1Comments') },
    { value: 'r1_revised', label: t('keyR1Resubmitted') },
    { value: 'r2_comments', label: t('keyR2Comments') },
    { value: 'r2_revised', label: t('keyR2Resubmitted') },
    { value: 'accept', label: t('keyAccepted') },
    { value: 'online', label: t('keyOnlinePublished') }
  ];
  const eventDateValue = normalizeDateString(node.completeDate || node.planDate || node.dueDate || '');

  openModal(`
    <div class="modal-header">
      <h2>${t('editTimelineEvent')}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal" title="${escapeHTML(t('close'))}">×</button>
    </div>

    <div class="stage-editor">
      <div class="form-group">
        <label>${t('eventName')}</label>
        <input type="text" id="drawer-node-name" value="${escapeHTML(node.name || '')}" placeholder="${escapeHTML(t('eventPlaceholder'))}">
      </div>

      <div class="stage-editor-grid">
        <div class="form-group">
          <label>${t('type')}</label>
          <select id="drawer-node-type">${buildOptions(typeOptions, node.type || 'research')}</select>
        </div>
        <div class="form-group">
          <label>${t('keyEventMapping')}</label>
          <select id="drawer-node-key">${buildOptions(keyOptions, node.key || 'auto')}</select>
        </div>
        <div class="form-group">
          <label>${t('eventDate')}</label>
          <input type="date" id="drawer-node-date" value="${escapeHTML(eventDateValue)}">
        </div>
      </div>

      <div class="stage-quick-row">
        <button class="btn-secondary btn-sm" id="drawer-btn-date-today">${t('setToday')}</button>
        <button class="btn-secondary btn-sm" id="drawer-btn-clear-date">${t('clearDate')}</button>
      </div>
      <p class="text-muted" style="font-size:11px; line-height:1.5; margin-top:8px;">${t('eventDateHelp')}</p>

      <div class="form-group">
        <label>${t('notes')}</label>
        <textarea id="drawer-node-notes" placeholder="${escapeHTML(t('notesPlaceholder'))}">${escapeHTML(node.notes || '')}</textarea>
      </div>
    </div>

    <div class="stage-modal-actions">
      <button class="btn-danger" id="drawer-btn-delete">${t('delete')}</button>
      <button class="btn-primary" id="drawer-btn-save">${t('saveChanges')}</button>
    </div>
  `);

  const setDate = (inputId, offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    document.getElementById(inputId).value = d.toISOString().slice(0, 10);
  };

  document.getElementById('drawer-btn-date-today').onclick = () => setDate('drawer-node-date');
  document.getElementById('drawer-btn-clear-date').onclick = () => {
    document.getElementById('drawer-node-date').value = '';
  };

  document.getElementById('drawer-btn-save').onclick = async () => {
    const nextName = document.getElementById('drawer-node-name').value.trim();
    if (!nextName) {
      alert(t('eventNameRequired'));
      return;
    }

    node.name = nextName;
    node.type = document.getElementById('drawer-node-type').value;
    node.key = document.getElementById('drawer-node-key').value;
    const eventDate = normalizeDateString(document.getElementById('drawer-node-date').value);
    node.status = eventDate ? 'completed' : 'pending';
    node.planDate = '';
    node.dueDate = '';
    node.completeDate = eventDate;
    node.notes = document.getElementById('drawer-node-notes').value.trim();
    node.updatedAt = new Date().toISOString();

    const nodeKey = inferKey(node);
    if (nodeKey === 'submit') {
      sub.submissionDate = eventDate ? dateInputToIso(eventDate) : null;
    } else if (nodeKey === 'r1_comments') {
      sub.firstDecisionDate = eventDate ? dateInputToIso(eventDate) : null;
    } else if (nodeKey === 'accept' || nodeKey === 'online') {
      sub.decisionDate = eventDate ? dateInputToIso(eventDate) : null;
      if (eventDate) sub.status = nodeKey === 'online' ? 'published' : 'accepted';
    }
    normalizeSubmissionTimeline(sub);

    await window.storage.saveAll(db);
    closeModal();
    renderDashboard();
    showGlobalToast(tf('eventSavedToast', { name: node.name }), 'success');
  };

  document.getElementById('drawer-btn-delete').onclick = async () => {
    if (confirm(tf('confirmDeleteEvent', { name: node.name }))) {
      sub.timelineNodes = sub.timelineNodes.filter(n => n.id !== nodeId);
      await window.storage.saveAll(db);
      closeModal();
      renderDashboard();
      showGlobalToast(t('eventRemovedToast'), 'success');
    }
  };
}

// --- VIEW 2: AREAS & PROJECTS TREE ---
let collapsedAreas = {};

function renderProjectsTree() {
  const treeNodes = document.getElementById('projects-tree-nodes');
  treeNodes.innerHTML = '';

  if (db.projects.length === 0) {
    treeNodes.innerHTML = '<p class="empty-state">No projects loaded. Click + Add Project.</p>';
    return;
  }

  // Group by discipline
  const areas = {};
  db.projects.forEach(p => {
    const area = p.discipline || 'General Areas';
    if (!areas[area]) areas[area] = [];
    areas[area].push(p);
  });

  Object.keys(areas).forEach(areaName => {
    const isCollapsed = !!collapsedAreas[areaName];
    const areaBox = document.createElement('div');
    areaBox.className = 'tree-node-area';
    
    const count = areas[areaName].length;

    const titleRow = document.createElement('div');
    titleRow.className = 'area-title-row';
    titleRow.style.cursor = 'pointer';
    titleRow.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="chevron" style="display: inline-block; font-size: 8px; transition: transform 0.2s ease; transform: ${isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)'};">▶</span>
        <span class="folder-icon" style="font-size: 14px;">${isCollapsed ? '📁' : '📂'}</span>
        <span style="font-weight: 600;">${areaName}</span>
      </div>
      <span class="badge" style="font-size: 10px; padding: 2px 6px; border-radius: 99px; background: hsl(var(--accent-purple) / 0.12); color: hsl(var(--accent-purple)); border: 1px solid hsl(var(--accent-purple) / 0.2); font-weight: 700;">${count}</span>
    `;

    // Click to collapse / expand folder
    titleRow.addEventListener('click', () => {
      collapsedAreas[areaName] = !isCollapsed;
      renderProjectsTree();
    });
    
    const projectList = document.createElement('div');
    projectList.className = 'tree-project-nodes';
    projectList.style.display = isCollapsed ? 'none' : 'flex';
    projectList.style.flexDirection = 'column';
    projectList.style.gap = '4px';
    projectList.style.paddingLeft = '20px';
    projectList.style.borderLeft = '1px solid var(--glass-border)';
    projectList.style.marginLeft = '12px';
    projectList.style.marginTop = '4px';

    areas[areaName].forEach(proj => {
      const item = document.createElement('div');
      item.className = `project-node-item ${proj.id === selectedProjectId ? 'selected' : ''}`;
      
      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1;">
          <span style="font-size: 12px; opacity: 0.85;">🔬</span>
          <span style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap; font-size: 12px;" title="${proj.title}">${proj.title}</span>
        </div>
      `;

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedProjectId = proj.id;
        renderProjectsTree(); // Highlight selected card
        renderProjectDetails(proj);
      });
      projectList.appendChild(item);
    });

    areaBox.appendChild(titleRow);
    areaBox.appendChild(projectList);
    treeNodes.appendChild(areaBox);
  });
}

function renderProjectDetails(proj) {
  const detailPanel = document.getElementById('project-detail-panel');
  
  detailPanel.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <h2>${proj.title}</h2>
      <button class="btn-danger btn-icon" id="btn-delete-proj">🗑️</button>
    </div>
    
    <div class="detail-section">
      <label for="project-detail-title">Project Title</label>
      <input type="text" id="project-detail-title" value="${escapeHTML(proj.title || '')}">
    </div>
    
    <div class="detail-section">
      <label for="project-detail-discipline">Discipline Area</label>
      <input type="text" id="project-detail-discipline" value="${escapeHTML(proj.discipline || 'General Science')}">
    </div>
    
    <div class="detail-section">
      <label for="project-detail-hypothesis">Working Hypothesis</label>
      <textarea id="project-detail-hypothesis" rows="5">${escapeHTML(proj.hypothesis || '')}</textarea>
    </div>

    <div class="detail-section">
      <label for="project-detail-abstract">Abstract / Scope</label>
      <textarea id="project-detail-abstract" rows="7">${escapeHTML(proj.abstract || '')}</textarea>
    </div>

    <div class="detail-section">
      <button class="btn-primary" id="btn-save-proj-details">Save Project Details</button>
    </div>

    <div class="detail-section">
      <h4>Project Milestones</h4>
      <ul style="padding-left: 20px;" id="project-detail-milestones"></ul>
    </div>
  `;

  document.getElementById('btn-save-proj-details').addEventListener('click', async () => {
    const nextTitle = document.getElementById('project-detail-title').value.trim();
    const nextDiscipline = document.getElementById('project-detail-discipline').value.trim() || 'General Science';
    const nextHypothesis = document.getElementById('project-detail-hypothesis').value.trim();
    const nextAbstract = document.getElementById('project-detail-abstract').value.trim();

    if (!nextTitle) {
      alert('Project title is required');
      return;
    }

    proj.title = nextTitle;
    proj.discipline = nextDiscipline;
    proj.hypothesis = nextHypothesis;
    proj.abstract = nextAbstract;
    proj.updatedAt = new Date().toISOString();

    await window.storage.saveAll(db);
    renderProjectsTree();
    renderProjectDetails(proj);
    showGlobalToast('Project details saved.', 'success');
  });

  // Delete project trigger
  document.getElementById('btn-delete-proj').addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete this project and all associated tasks/records?')) {
      db.projects = db.projects.filter(p => p.id !== proj.id);
      db.tasks = db.tasks.filter(t => t.projectId !== proj.id);
      db.researchRecords = db.researchRecords.filter(r => r.projectId !== proj.id);
      selectedProjectId = null;
      await window.storage.saveAll(db);
      renderProjectsTree();
      document.getElementById('project-detail-panel').innerHTML = `
        <div class="empty-state">
          <svg class="svg-icon" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <h3>Select a project from the tree to view and edit its details.</h3>
        </div>
      `;
    }
  });

  // Render project milestones
  const milestonesEl = document.getElementById('project-detail-milestones');
  const projectMilestones = db.submissions.filter(s => s.projectId === proj.id);
  if (projectMilestones.length === 0) {
    milestonesEl.innerHTML = '<li style="font-size: 13px; color: hsl(var(--text-muted));">No associated papers or journal timelines synced yet.</li>';
  } else {
    projectMilestones.forEach((sub, index) => {
      const li = document.createElement('li');
      li.style.fontSize = '13px';
      li.innerHTML = `<strong>${index + 1}. Manuscript Submission:</strong> ${escapeHTML(getSubmissionJournalName(sub))} (${escapeHTML(String(sub.status || 'submitted'))})`;
      milestonesEl.appendChild(li);
    });
  }
}

// Add Project Dialog Trigger
document.getElementById('btn-add-project').addEventListener('click', () => {
  openModal(`
    <div class="modal-header">
      <h2>Add Scientific Project</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal">✕</button>
    </div>
    <div class="form-group">
      <label>Project Title</label>
      <input type="text" id="new-proj-title" placeholder="e.g. Ultra-conductive graphite synthesis">
    </div>
    <div class="form-group">
      <label>Discipline Area</label>
      <input type="text" id="new-proj-discipline" placeholder="e.g. Solid State Physics">
    </div>
    <div class="form-group">
      <label>Working Hypothesis</label>
      <textarea id="new-proj-hypothesis" placeholder="Describe what you want to prove..."></textarea>
    </div>
    <div class="form-group">
      <label>Scope / Abstract</label>
      <textarea id="new-proj-abstract" placeholder="Describe the scope of the project..."></textarea>
    </div>
    <button class="btn-primary w-full" id="btn-submit-project">Create Project</button>
  `);

  document.getElementById('btn-submit-project').addEventListener('click', async () => {
    const title = document.getElementById('new-proj-title').value.trim();
    const discipline = document.getElementById('new-proj-discipline').value.trim() || 'General Science';
    const hypothesis = document.getElementById('new-proj-hypothesis').value.trim();
    const abstract = document.getElementById('new-proj-abstract').value.trim();

    if (!title) {
      alert('Title is required');
      return;
    }

    const newProject = {
      id: 'proj_' + Math.random().toString(36).substring(2, 9),
      userId: 'user',
      areaId: null,
      title,
      shortTitle: null,
      discipline,
      abstract,
      hypothesis,
      objectives: [],
      keywords: [],
      tags: [],
      customFields: {},
      currentStage: 'Planning',
      status: 'planning',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.projects.push(newProject);
    await window.storage.saveAll(db);
    closeModal();
    renderProjectsTree();
    showGlobalToast('New Project Added!', 'success');
  });
});

// --- VIEW 3: RESEARCH RECORDS ---
function renderRecords() {
  const searchVal = document.getElementById('record-search').value.toLowerCase();
  const filterType = document.getElementById('record-filter-type').value;
  const tbody = document.getElementById('records-table-body');
  tbody.innerHTML = '';

  let filtered = [...db.researchRecords];
  
  if (filterType) {
    filtered = filtered.filter(r => r.recordType === filterType);
  }
  
  if (searchVal) {
    filtered = filtered.filter(r => 
      r.title.toLowerCase().includes(searchVal) ||
      (r.summary && r.summary.toLowerCase().includes(searchVal))
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No research records match the current filters.</td></tr>';
    return;
  }

  // Reset select-all checkbox on render
  const chkAll = document.getElementById('chk-records-select-all');
  if (chkAll) chkAll.checked = false;

  filtered.forEach(rec => {
    const tr = document.createElement('tr');
    
    // Find project title
    const proj = db.projects.find(p => p.id === rec.projectId);
    const projTitle = proj ? proj.title : 'Unlinked';
    const recordDate = rec.recordedDate || rec.occurredAt || rec.createdAt || rec.updatedAt || '';
    const recordDateText = recordDate && !isNaN(new Date(recordDate)) ? new Date(recordDate).toLocaleDateString() : '-';

    tr.innerHTML = `
      <td style="text-align: center;">
        <input type="checkbox" class="chk-record-row" data-id="${rec.id}" style="width: 14px; height: 14px; cursor: pointer; accent-color: hsl(var(--accent-purple));">
      </td>
      <td><strong>${rec.title}</strong></td>
      <td><span class="badge badge-purple">${rec.recordType}</span></td>
      <td>${projTitle}</td>
      <td>${recordDateText}</td>
      <td><div class="tags-cell">${(rec.tags || []).map(t => `<span class="badge badge-info">${t}</span>`).join('')}</div></td>
      <td>
        <button class="btn-secondary" style="padding: 4px 8px; font-size:11px;" id="btn-edit-rec-${rec.id}">✏️ Edit</button>
        <button class="btn-danger" style="padding: 4px 8px; font-size:11px;" id="btn-del-rec-${rec.id}">🗑️</button>
      </td>
    `;
    
    tbody.appendChild(tr);

    // Edit
    document.getElementById(`btn-edit-rec-${rec.id}`).addEventListener('click', () => {
      editRecordModal(rec);
    });

    // Delete
    document.getElementById(`btn-del-rec-${rec.id}`).addEventListener('click', async () => {
      if (confirm('Delete this research record?')) {
        db.researchRecords = db.researchRecords.filter(r => r.id !== rec.id);
        await window.storage.saveAll(db);
        renderRecords();
      }
    });
  });
}

// Hook records search filtering
document.getElementById('record-search').addEventListener('input', renderRecords);
document.getElementById('record-filter-type').addEventListener('change', renderRecords);

// Hook Select All checkbox
const chkAllRecords = document.getElementById('chk-records-select-all');
if (chkAllRecords) {
  chkAllRecords.addEventListener('change', (e) => {
    const rowCheckboxes = document.querySelectorAll('.chk-record-row');
    rowCheckboxes.forEach(cb => cb.checked = e.target.checked);
  });
}

// Hook Zotero Bulk Sync action button
const btnZoteroSync = document.getElementById('btn-zotero-sync');
if (btnZoteroSync) {
  btnZoteroSync.addEventListener('click', () => {
    const checkedBoxes = document.querySelectorAll('.chk-record-row:checked');
    const selectedIds = Array.from(checkedBoxes).map(cb => cb.getAttribute('data-id'));
    openZoteroSyncModal(selectedIds);
  });
}

// Add Record Modal
document.getElementById('btn-add-record').addEventListener('click', () => {
  openRecordFormModal(null);
});

function openRecordFormModal(record = null) {
  const isEdit = !!record;
  
  let projectOpts = `
    <option value="" ${!record || !record.projectId ? 'selected' : ''}>-- Uncategorized / Personal Notes --</option>
  ` + db.projects.map(p => `
    <option value="${p.id}" ${record && record.projectId === p.id ? 'selected' : ''}>${p.title}</option>
  `).join('');

  openModal(`
    <div class="modal-header">
      <h2>${isEdit ? 'Modify Research Record' : 'Log New Research Record'}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal">✕</button>
    </div>
    
    <div class="form-group">
      <label>Target Project</label>
      <select id="rec-proj-select">${projectOpts}</select>
    </div>

    <div class="form-group">
      <label>Record Title</label>
      <input type="text" id="rec-title" value="${isEdit ? record.title : ''}" placeholder="e.g. HPLC analysis of sample A">
    </div>

    <div class="grid-cols-2">
      <div class="form-group">
        <label>Record Type</label>
        <select id="rec-type">
          <option value="experiment" ${record && record.recordType === 'experiment' ? 'selected' : ''}>Experiment</option>
          <option value="simulation" ${record && record.recordType === 'simulation' ? 'selected' : ''}>Simulation</option>
          <option value="survey" ${record && record.recordType === 'survey' ? 'selected' : ''}>Survey</option>
          <option value="analysis" ${record && record.recordType === 'analysis' ? 'selected' : ''}>Analysis</option>
          <option value="literature_review" ${record && record.recordType === 'literature_review' ? 'selected' : ''}>Literature Review</option>
          <option value="other" ${record && record.recordType === 'other' ? 'selected' : ''}>Other</option>
        </select>
      </div>
      <div class="form-group">
        <label>Date Conducted</label>
        <input type="date" id="rec-date" value="${isEdit ? record.recordedDate.split('T')[0] : new Date().toISOString().split('T')[0]}">
      </div>
    </div>

    <div class="form-group">
      <label>Methodology / Experimental Conditions</label>
      <textarea id="rec-methodology" placeholder="Describe the method, code model, or tools...">${isEdit ? record.methodology || '' : ''}</textarea>
    </div>

    <div class="form-group">
      <label>Results & Discussion Summary</label>
      <textarea id="rec-summary" placeholder="Summary of outcomes and findings...">${isEdit ? record.summary || '' : ''}</textarea>
    </div>

    <!-- HIGH-FIDELITY DISCIPLINARY ATTRIBUTES EDITOR -->
    <div class="form-group" style="border: 1px solid var(--glass-border); padding: 12px; border-radius: 8px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <label style="margin-bottom:0;">🔬 Disciplinary Dynamic Attributes (JSONB)</label>
        <button class="btn-secondary" style="padding: 2px 8px; font-size:10px;" id="btn-add-attribute">+ Add Parameter</button>
      </div>
      <div id="attributes-list" style="display:flex; flex-direction:column; gap:6px;">
        <!-- Injected via dynamic attribute JS -->
      </div>
    </div>

    <button class="btn-primary w-full" style="margin-top: 12px;" id="btn-submit-record">${isEdit ? 'Save Changes' : 'Log Record'}</button>
  `);

  // Dynamically load existing attributes if editing
  const attrList = document.getElementById('attributes-list');
  if (isEdit && record.attributes) {
    Object.keys(record.attributes).forEach(key => {
      addAttributeRow(key, record.attributes[key]);
    });
  }

  // Add parameter event
  document.getElementById('btn-add-attribute').addEventListener('click', () => {
    addAttributeRow('', '');
  });

  function addAttributeRow(key = '', value = '') {
    const row = document.createElement('div');
    row.className = 'flex-row attr-row';
    row.style.gap = '6px';
    row.innerHTML = `
      <input type="text" class="attr-key" value="${key}" placeholder="Parameter (e.g. temperature_K)" style="flex:1;">
      <input type="text" class="attr-val" value="${value}" placeholder="Value (e.g. 1.65)" style="flex:1;">
      <button class="btn-danger btn-icon btn-remove-attr" style="width:28px; height:28px;">✕</button>
    `;
    attrList.appendChild(row);
    
    row.querySelector('.btn-remove-attr').addEventListener('click', () => row.remove());
  }

  // Submit record
  document.getElementById('btn-submit-record').addEventListener('click', async () => {
    const projectId = document.getElementById('rec-proj-select').value || null;
    const title = document.getElementById('rec-title').value.trim();
    const type = document.getElementById('rec-type').value;
    const date = document.getElementById('rec-date').value;
    const methodology = document.getElementById('rec-methodology').value.trim();
    const summary = document.getElementById('rec-summary').value.trim();

    if (!title) {
      alert('Title is required');
      return;
    }

    // Parse attributes
    const attributes = {};
    const keyInputs = document.querySelectorAll('.attr-key');
    const valInputs = document.querySelectorAll('.attr-val');
    
    keyInputs.forEach((kInput, idx) => {
      const k = kInput.value.trim();
      const v = valInputs[idx].value.trim();
      if (k && v) {
        // Try parsing numbers if float
        const parsedNum = parseFloat(v);
        attributes[k] = isNaN(parsedNum) ? v : parsedNum;
      }
    });

    if (isEdit) {
      record.projectId = projectId;
      record.title = title;
      record.recordType = type;
      record.recordedDate = new Date(date).toISOString();
      record.methodology = methodology;
      record.summary = summary;
      record.attributes = attributes;
      record.updatedAt = new Date().toISOString();
    } else {
      const newRec = {
        id: 'rec_' + Math.random().toString(36).substring(2, 9),
        userId: 'user',
        projectId,
        schemaTemplateId: null,
        title,
        recordType: type,
        methodology,
        recordedDate: new Date(date).toISOString(),
        attributes,
        dataPath: null,
        externalRef: null,
        summary,
        tags: ['manually-logged'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.researchRecords.push(newRec);
    }

    await window.storage.saveAll(db);
    closeModal();
    renderRecords();
    showGlobalToast(isEdit ? 'Record updated!' : 'Record logged!', 'success');
  });
}

function editRecordModal(rec) {
  openRecordFormModal(rec);
}

function getZoteroAuthorText(creators = []) {
  return creators
    .map(c => c.name || [c.firstName, c.lastName].filter(Boolean).join(' ').trim())
    .filter(Boolean)
    .join(', ');
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeDoi(value) {
  return String(value || '').trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
}

function extractDoiFromText(value) {
  const match = String(value || '').match(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
  return match ? normalizeDoi(match[0].replace(/[.,;)\]]+$/, '')) : '';
}

function getRecordDoi(record) {
  return normalizeDoi(record?.attributes?.doi || record?.attributes?.DOI || '');
}

function getProjectByCollectionName(collectionName) {
  const normalized = normalizeText(collectionName);
  if (!normalized) return null;
  return db.projects.find(project => {
    const title = normalizeText(project.title);
    const shortTitle = normalizeText(project.shortTitle);
    return title === normalized || shortTitle === normalized || title.includes(normalized) || normalized.includes(title);
  }) || null;
}

function getZoteroApiConfig(source, uid, key) {
  if (source === 'local') {
    return {
      baseUrl: 'http://127.0.0.1:23119/api/users/0',
      headers: { 'Zotero-API-Version': '3' }
    };
  }

  return {
    baseUrl: `https://api.zotero.org/users/${encodeURIComponent(uid)}`,
    headers: {
      'Zotero-API-Version': '3',
      'Zotero-API-Key': key
    }
  };
}

function appendZoteroQuery(path, params = {}) {
  const [basePath, query = ''] = path.split('?');
  const search = new URLSearchParams(query);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });
  const nextQuery = search.toString();
  return nextQuery ? `${basePath}?${nextQuery}` : basePath;
}

async function zoteroRequestRaw(config, path, options = {}) {
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...options,
    headers: {
      ...config.headers,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Zotero request failed ${response.status} ${response.statusText}${text ? `: ${text.slice(0, 180)}` : ''}`);
  }

  return response;
}

async function zoteroRequest(config, path, options = {}) {
  const response = await zoteroRequestRaw(config, path, options);
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return response.text();
  }
  return response.json();
}

async function zoteroFetchAll(config, path, limit = 100, maxResults = 2000) {
  const all = [];
  let start = 0;
  let total = Infinity;

  while (start < total && all.length < maxResults) {
    const response = await zoteroRequestRaw(config, appendZoteroQuery(path, { limit, start }));
    const page = await response.json();
    if (!Array.isArray(page)) return all;

    all.push(...page);
    const totalHeader = Number(response.headers.get('Total-Results'));
    total = Number.isFinite(totalHeader) ? totalHeader : (page.length < limit ? all.length : Infinity);
    if (page.length < limit) break;
    start += limit;
  }

  return all;
}

function parseZoteroCreators(value) {
  if (Array.isArray(value)) {
    return value
      .map(author => {
        if (!author) return null;
        if (typeof author === 'object') {
          const name = author.name || [author.firstName, author.lastName].filter(Boolean).join(' ').trim();
          return name ? { creatorType: 'author', name } : null;
        }
        return { creatorType: 'author', name: String(author).trim() };
      })
      .filter(creator => creator && creator.name);
  }

  const text = String(value || '').trim();
  if (!text) return [];
  const parts = text.includes(';')
    ? text.split(';')
    : text.split(/\s+\band\b\s+/i);

  return parts
    .map(part => part.trim())
    .filter(Boolean)
    .map(name => ({ creatorType: 'author', name }));
}

function compactZoteroData(data) {
  const compacted = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value) && value.length === 0) return;
    compacted[key] = value;
  });
  return compacted;
}

function getRecordAuthors(record) {
  const attrs = record.attributes || {};
  return attrs.authors || attrs.author || attrs.creators || '';
}

function getRecordYearOrDate(record) {
  const attrs = record.attributes || {};
  return attrs.date || attrs.year || record.recordedDate || record.occurredAt || record.createdAt || '';
}

function buildZoteroItemData(record, collectionKey = null) {
  const attrs = record.attributes || {};
  const doi = normalizeDoi(attrs.doi || attrs.DOI || '');
  const creators = parseZoteroCreators(getRecordAuthors(record));
  const dateValue = getRecordYearOrDate(record);
  const project = db.projects.find(p => p.id === record.projectId);
  const extraLines = [
    record.methodology ? `ResearchFlow method: ${record.methodology}` : '',
    record.recordType ? `ResearchFlow record type: ${record.recordType}` : '',
    project ? `ResearchFlow project: ${project.title}` : '',
    record.id ? `ResearchFlow record id: ${record.id}` : ''
  ].filter(Boolean);

  const itemData = compactZoteroData({
    itemType: 'journalArticle',
    title: record.title || 'Untitled ResearchFlow Record',
    creators,
    abstractNote: record.summary || record.content || '',
    publicationTitle: attrs.journal || attrs.publicationTitle || attrs.proceedingsTitle || attrs.publisher || 'ResearchFlow OS Import',
    DOI: doi,
    url: attrs.url || record.externalRef || '',
    date: dateValue ? String(dateValue).slice(0, 10) : '',
    tags: [...new Set([...(record.tags || []), 'researchflow-import'])]
      .filter(Boolean)
      .map(tag => ({ tag: String(tag) })),
    extra: extraLines.join('\n')
  });

  if (collectionKey) itemData.collections = [collectionKey];
  return itemData;
}

function getZoteroItemDoi(item) {
  return normalizeDoi(item?.data?.DOI || item?.data?.doi || '');
}

function getZoteroItemTitle(item) {
  return normalizeText(item?.data?.title || '');
}

function findMatchingZoteroItem(record, zoteroItems = []) {
  const attrs = record.attributes || {};
  const zoteroKey = attrs.zoteroKey || attrs.ZoteroKey || '';
  const doi = getRecordDoi(record);
  const title = normalizeText(record.title);

  return zoteroItems.find(item => {
    if (!item?.data) return false;
    if (zoteroKey && item.key === zoteroKey) return true;
    if (doi && getZoteroItemDoi(item) === doi) return true;
    return title && getZoteroItemTitle(item) === title;
  }) || null;
}

async function ensureZoteroCollection(config, collections, collectionName, log) {
  const existing = collections.find(c => normalizeText(c.data?.name) === normalizeText(collectionName));
  if (existing?.key) return existing.key;

  const createResult = await zoteroRequest(config, '/collections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([{ name: collectionName, parentCollection: false }])
  });

  const failed = createResult?.failed || {};
  if (Object.keys(failed).length) {
    throw new Error(`Failed to create Zotero collection "${collectionName}": ${JSON.stringify(failed)}`);
  }

  const collectionKey = createResult?.success?.['0'] || null;
  if (!collectionKey) throw new Error(`Zotero did not return a collection key for "${collectionName}".`);

  collections.push({ key: collectionKey, data: { name: collectionName } });
  if (log) log(`[COLLECTION] Created ${collectionName}.`, '#a0aec0');
  return collectionKey;
}

async function createZoteroItem(config, itemData) {
  const result = await zoteroRequest(config, '/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([itemData])
  });

  const failed = result?.failed || {};
  if (Object.keys(failed).length) {
    throw new Error(`Zotero rejected item "${itemData.title}": ${JSON.stringify(failed)}`);
  }

  const key = result?.success?.['0'] || null;
  if (!key) throw new Error(`Zotero did not return an item key for "${itemData.title}".`);
  return key;
}

function markRecordSyncedToZotero(record, itemKey, source) {
  record.attributes = record.attributes || {};
  record.attributes.zoteroKey = itemKey;
  record.attributes.zoteroSource = source;
  record.attributes.zoteroSyncedAt = new Date().toISOString();
  record.externalRef = `zotero://select/library/items/${itemKey}`;
  record.tags = [...new Set([...(record.tags || []), 'zotero-synced'])];
  record.updatedAt = new Date().toISOString();
}

function openZoteroSyncModal(selectedIds = []) {
  db.settings = db.settings || {};
  const zoteroUid = db.settings.zoteroUid || '';
  const zoteroKey = db.settings.zoteroKey || '';
  const zoteroSource = db.settings.zoteroSource || 'local';
  const defaultDirection = selectedIds.length ? 'push' : 'push-all';

  openModal(`
    <div class="modal-header">
      <h2>Zotero Synchronization</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal">x</button>
    </div>

    <div class="form-group">
      <div style="font-size: 12px; color: hsl(var(--text-muted)); margin-bottom: 12px; line-height: 1.5;">
        Import ResearchFlow literature records into Zotero, or pull Zotero references back into ResearchFlow. Local import requires Zotero desktop to be running with the local API available at 127.0.0.1:23119.
      </div>
      <div style="padding: 10px 12px; background: hsl(var(--accent-purple) / 0.08); border: 1px solid hsl(var(--accent-purple) / 0.2); border-radius: 8px; font-size:11px; color: hsl(var(--text-primary)); display: flex; align-items:center; gap:8px; margin-bottom:16px;">
        <span>Selected <strong>${selectedIds.length}</strong> record(s) out of <strong>${db.researchRecords.length}</strong> local records. The default action imports ${selectedIds.length ? 'selected records' : 'all local records'} into Zotero.</span>
      </div>
    </div>

    <div class="grid-cols-2" style="margin-bottom: 16px;">
      <div class="form-group">
        <label>Zotero Source</label>
        <select id="zotero-source">
          <option value="local" ${zoteroSource === 'local' ? 'selected' : ''}>Local Zotero Desktop (127.0.0.1:23119)</option>
          <option value="cloud" ${zoteroSource === 'cloud' ? 'selected' : ''}>Zotero Cloud API</option>
        </select>
      </div>
      <div class="form-group">
        <label>Sync Direction</label>
        <select id="zotero-direction">
          <option value="push" ${defaultDirection === 'push' ? 'selected' : ''}>Import Selected ResearchFlow Records -> Zotero</option>
          <option value="push-all" ${defaultDirection === 'push-all' ? 'selected' : ''}>Import ALL ResearchFlow Records -> Zotero</option>
          <option value="pull">Pull Zotero -> ResearchFlow Records</option>
        </select>
      </div>
    </div>

    <div class="grid-cols-2" style="margin-bottom: 16px;">
      <div class="form-group">
        <label>Zotero User ID (Cloud only)</label>
        <input type="text" id="zotero-uid" value="${escapeHTML(zoteroUid)}" placeholder="e.g. 1234567" style="font-family: monospace;">
      </div>
      <div class="form-group">
        <label>Zotero API Key (Cloud only)</label>
        <input type="password" id="zotero-key" value="${escapeHTML(zoteroKey)}" placeholder="Zotero cloud API key" style="font-family: monospace;">
      </div>
    </div>

    <div class="form-group" style="margin-bottom: 16px;">
      <label>Project Context Mapping</label>
      <select id="zotero-mapping">
        <option value="project-collections">Match Zotero collection names to local project titles</option>
        <option value="uncategorized">Import all as unlinked records</option>
      </select>
    </div>

    <div class="form-group">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <label style="margin-bottom:0; font-size:11px; font-weight:700; text-transform:uppercase; color:hsl(var(--accent-purple)); letter-spacing:0.5px;">Live Progress Log</label>
        <span id="terminal-badge" class="badge badge-info" style="font-size:9px;">Ready</span>
      </div>
      <div class="zotero-terminal-log" id="zotero-terminal" style="background:#0c0f12; color:#39ff14; font-family:'Courier New', monospace; padding:14px; border-radius:10px; border:1px solid rgba(255,255,255,0.08); height:220px; overflow-y:auto; font-size:11px; line-height:1.5; box-shadow: inset 0 0 12px rgba(0,255,0,0.12);">
        <div style="color:#718096;">[SYSTEM] Ready. Choose Local Zotero for desktop import, or Cloud API for remote sync.</div>
      </div>
    </div>

    <div style="display: flex; gap: 10px; margin-top: 16px;">
      <button class="btn-secondary" style="flex:1;" id="btn-save-zotero-creds">Save Settings</button>
      <button class="btn-primary" style="flex:2; font-weight: 700;" id="btn-start-zotero-sync">Start Zotero Sync</button>
    </div>
  `);

  const saveZoteroSettings = async () => {
    db.settings.zoteroSource = document.getElementById('zotero-source').value;
    db.settings.zoteroUid = document.getElementById('zotero-uid').value.trim();
    db.settings.zoteroKey = document.getElementById('zotero-key').value.trim();
    await window.storage.saveAll(db);
  };

  document.getElementById('btn-save-zotero-creds').addEventListener('click', async () => {
    await saveZoteroSettings();
    showGlobalToast('Zotero settings saved locally.', 'success');
  });

  document.getElementById('btn-start-zotero-sync').addEventListener('click', async () => {
    const source = document.getElementById('zotero-source').value;
    const uid = document.getElementById('zotero-uid').value.trim();
    const key = document.getElementById('zotero-key').value.trim();
    const direction = document.getElementById('zotero-direction').value;
    const mapping = document.getElementById('zotero-mapping').value;
    const term = document.getElementById('zotero-terminal');
    const badge = document.getElementById('terminal-badge');
    const btnSync = document.getElementById('btn-start-zotero-sync');

    const log = (text, color = '#39ff14') => {
      const div = document.createElement('div');
      div.style.color = color;
      div.textContent = text;
      term.appendChild(div);
      term.scrollTop = term.scrollHeight;
    };

    term.innerHTML = '';
    badge.textContent = 'Syncing';
    badge.className = 'badge badge-purple';
    btnSync.disabled = true;
    btnSync.textContent = 'Synchronizing...';

    try {
      if (source === 'cloud' && (!uid || !key)) {
        throw new Error('Zotero Cloud requires both User ID and API key. Use Local Zotero for desktop import without a key.');
      }

      await saveZoteroSettings();
      const config = getZoteroApiConfig(source, uid, key);
      log(`[START] Connecting to ${source === 'local' ? 'local Zotero desktop API' : 'Zotero Cloud API'}...`, '#4299e1');

      const collections = await zoteroFetchAll(config, '/collections');
      log(`[OK] Retrieved ${collections.length} collection(s).`, '#48bb78');

      if (direction === 'pull') {
        log('[PULL] Fetching top-level Zotero items...', '#4299e1');
        const items = await zoteroFetchAll(config, '/items/top');
        log(`[INFO] Retrieved ${items.length} top-level item(s).`, '#a0aec0');

        let importedCount = 0;
        let skippedCount = 0;
        const supportedTypes = new Set(['journalArticle', 'conferencePaper', 'book', 'bookSection', 'report', 'thesis', 'preprint', 'document']);

        for (const item of items) {
          if (!item?.data || !supportedTypes.has(item.data.itemType)) continue;
          const title = (item.data.title || '').trim();
          if (!title) continue;

          const doi = normalizeDoi(item.data.DOI || item.data.doi || '');
          const existing = db.researchRecords.find(record => {
            const sameKey = item.key && record.attributes?.zoteroKey === item.key;
            const sameDoi = doi && getRecordDoi(record) === doi;
            const sameTitle = normalizeText(record.title) === normalizeText(title);
            return sameKey || sameDoi || sameTitle;
          });

          if (existing) {
            skippedCount++;
            log(`[SKIP] Already exists: ${title}`, '#718096');
            continue;
          }

          let matchedProject = null;
          let collectionName = '';
          if (mapping === 'project-collections' && Array.isArray(item.data.collections) && item.data.collections.length) {
            const collection = collections.find(c => c.key === item.data.collections[0]);
            collectionName = collection?.data?.name || '';
            matchedProject = getProjectByCollectionName(collectionName);
          }

          const authors = getZoteroAuthorText(item.data.creators || []);
          const dateText = item.data.date || '';
          const yearMatch = String(dateText).match(/\d{4}/);
          const now = new Date().toISOString();
          const newRecord = {
            id: `rec_zot_${item.key || Math.random().toString(36).slice(2, 9)}`,
            userId: 'user',
            projectId: matchedProject?.id || null,
            schemaTemplateId: null,
            title,
            recordType: 'literature_review',
            discipline: matchedProject?.discipline || '',
            methodology: `Imported from ${source === 'local' ? 'local Zotero desktop' : 'Zotero Cloud'}. Authors: ${authors || 'Unknown'}. Journal: ${item.data.publicationTitle || item.data.proceedingsTitle || item.data.publisher || 'Unknown'}. Year: ${yearMatch ? yearMatch[0] : 'Unknown'}.`,
            summary: item.data.abstractNote || 'Imported from Zotero library.',
            rawData: null,
            content: item.data.extra || '',
            priority: 'medium',
            status: 'collected',
            attributes: {
              zoteroKey: item.key || '',
              zoteroVersion: item.version || null,
              itemType: item.data.itemType,
              doi,
              authors,
              journal: item.data.publicationTitle || item.data.proceedingsTitle || '',
              year: yearMatch ? Number(yearMatch[0]) : null,
              url: item.data.url || '',
              collection: collectionName
            },
            externalRef: item.key ? `zotero://select/items/${item.key}` : (item.data.url || (doi ? `https://doi.org/${doi}` : '')),
            tags: ['zotero-sync', source === 'local' ? 'local-zotero' : 'zotero-cloud'],
            occurredAt: now,
            createdAt: now,
            updatedAt: now
          };

          db.researchRecords.push(newRecord);
          importedCount++;
          log(`[IMPORTED] ${title}${matchedProject ? ` -> ${matchedProject.title}` : ' -> Unlinked'}`, '#48bb78');
        }

        if (importedCount > 0) await window.storage.saveAll(db);
        log(`[FINISHED] Imported ${importedCount}; skipped ${skippedCount}.`, '#48bb78');
        renderRecords();
      } else {
        const recordsToSync = direction === 'push-all'
          ? db.researchRecords
          : db.researchRecords.filter(record => selectedIds.includes(record.id));

        if (!recordsToSync.length) {
          log('[WARNING] No local records selected for import into Zotero.', '#ed8936');
        } else {
          log(`[IMPORT] Preparing ${recordsToSync.length} local record(s) for Zotero...`, '#4299e1');
        }

        const existingItems = await zoteroFetchAll(config, '/items/top');
        log(`[CHECK] Loaded ${existingItems.length} existing Zotero item(s) for duplicate detection.`, '#a0aec0');

        let createdCount = 0;
        let matchedCount = 0;
        let skippedCount = 0;
        let changedLocal = false;

        for (const record of recordsToSync) {
          if (!record.title || !record.title.trim()) {
            skippedCount++;
            log(`[SKIP] Local record ${record.id || ''} has no title.`, '#ed8936');
            continue;
          }

          const existingItem = findMatchingZoteroItem(record, existingItems);
          if (existingItem?.key) {
            markRecordSyncedToZotero(record, existingItem.key, source);
            matchedCount++;
            changedLocal = true;
            log(`[EXISTS] Matched existing Zotero item: ${record.title}`, '#718096');
            continue;
          }

          const project = db.projects.find(p => p.id === record.projectId);
          const collectionName = mapping === 'project-collections' && project ? project.title : 'ResearchFlow Imports';
          const collectionKey = await ensureZoteroCollection(config, collections, collectionName, log);
          const itemData = buildZoteroItemData(record, collectionKey);
          const itemKey = await createZoteroItem(config, itemData);

          markRecordSyncedToZotero(record, itemKey, source);
          existingItems.push({ key: itemKey, data: itemData });
          createdCount++;
          changedLocal = true;
          log(`[IMPORTED] ${record.title} -> Zotero item ${itemKey}`, '#48bb78');
        }

        if (changedLocal) {
          await window.storage.saveAll(db);
          renderRecords();
        }
        log(`[FINISHED] Zotero import complete. Created ${createdCount}; matched existing ${matchedCount}; skipped ${skippedCount}.`, '#48bb78');
      }

      badge.textContent = 'Success';
      badge.className = 'badge badge-success';
    } catch (err) {
      log(`[ERROR] ${err.message}`, 'hsl(var(--accent-rose))');
      if (source === 'local') {
        log('[HINT] Start Zotero desktop, then check Zotero Preferences -> Advanced -> Allow other applications on this computer to communicate with Zotero.', '#ed8936');
      }
      badge.textContent = 'Error';
      badge.className = 'badge badge-danger';
    } finally {
      btnSync.disabled = false;
      btnSync.textContent = 'Start Zotero Sync';
    }
  });
}

// --- VIEW 4: MANUSCRIPTS KANBAN BOARD ---
function renderKanban() {
  const columns = ['idea', 'drafting', 'submitted', 'accepted'];
  columns.forEach(col => {
    document.getElementById(`cards-${col}`).innerHTML = '';
  });

  const mCount = { idea: 0, drafting: 0, submitted: 0, accepted: 0 };

  db.manuscripts.forEach(m => {
    // Map granular status to simple column headers
    let col = 'idea';
    if (m.status === 'outline' || m.status === 'idea' || m.status === 'data_collection') col = 'idea';
    else if (m.status === 'drafting' || m.status === 'figure_preparation' || m.status === 'internal_review') col = 'drafting';
    else if (m.status === 'submitted' || m.status === 'under_review' || m.status === 'revision') col = 'submitted';
    else if (m.status === 'accepted' || m.status === 'published') col = 'accepted';

    mCount[col]++;

    const card = document.createElement('div');
    card.className = 'glass-card kanban-card';
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-id', m.id);

    card.innerHTML = `
      <h4>${m.title}</h4>
      <p>Target: <strong>${m.targetJournals?.[0] || 'TBD'}</strong></p>
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
        <select class="kanban-card-select" id="sel-man-status-${m.id}" style="width: auto; padding: 2px 4px !important; font-size: 10px !important; height: 24px; background:var(--input-bg); border:1px solid var(--input-border); border-radius:6px; color:hsl(var(--text-primary)); outline:none;">
          <option value="idea" ${m.status === 'idea' ? 'selected' : ''}>Idea</option>
          <option value="outline" ${m.status === 'outline' ? 'selected' : ''}>Outline</option>
          <option value="figure_preparation" ${m.status === 'figure_preparation' ? 'selected' : ''}>Figures</option>
          <option value="drafting" ${m.status === 'drafting' ? 'selected' : ''}>Drafting</option>
          <option value="internal_review" ${m.status === 'internal_review' ? 'selected' : ''}>Review</option>
          <option value="submitted" ${m.status === 'submitted' ? 'selected' : ''}>Submitted</option>
          <option value="accepted" ${m.status === 'accepted' ? 'selected' : ''}>Accepted</option>
        </select>
        <button class="btn-secondary" style="padding: 2px 6px; font-size:10px; height: 24px;" id="btn-edit-man-${m.id}">Edit</button>
      </div>
    `;

    // HTML5 Drag Event Listeners
    card.addEventListener('dragstart', (e) => {
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', m.id);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });

    document.getElementById(`cards-${col}`).appendChild(card);
    
    // Bind status change dropdown
    document.getElementById(`sel-man-status-${m.id}`).addEventListener('change', async (e) => {
      m.status = e.target.value;
      m.updatedAt = new Date().toISOString();
      await window.storage.saveAll(db);
      renderKanban();
      showGlobalToast('Manuscript status updated!', 'success');
    });

    // Bind edit button
    document.getElementById(`btn-edit-man-${m.id}`).addEventListener('click', () => {
      openManuscriptModal(m);
    });
  });

  columns.forEach(col => {
    document.getElementById(`count-${col}`).textContent = mCount[col];

    // HTML5 Column Drop Event Listeners
    const colCardsContainer = document.getElementById(`cards-${col}`);
    if (!colCardsContainer.dataset.dragBound) {
      colCardsContainer.dataset.dragBound = 'true';

      colCardsContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        colCardsContainer.classList.add('drag-over');
      });

      colCardsContainer.addEventListener('dragleave', () => {
        colCardsContainer.classList.remove('drag-over');
      });

      colCardsContainer.addEventListener('drop', async (e) => {
        e.preventDefault();
        colCardsContainer.classList.remove('drag-over');
        
        const manuscriptId = e.dataTransfer.getData('text/plain');
        const man = db.manuscripts.find(x => x.id === manuscriptId);
        if (man) {
          // Move status to the category column
          let newStatus = col;
          if (col === 'idea') newStatus = 'idea';
          else if (col === 'drafting') newStatus = 'drafting';
          else if (col === 'submitted') newStatus = 'submitted';
          else if (col === 'accepted') newStatus = 'accepted';

          man.status = newStatus;
          man.updatedAt = new Date().toISOString();
          await window.storage.saveAll(db);
          renderKanban();
          showGlobalToast(`Manuscript status updated to ${newStatus}!`, 'success');
        }
      });
    }
  });
}

// Add/Edit Manuscript Modal
document.getElementById('btn-add-manuscript').addEventListener('click', () => {
  openManuscriptModal(null);
});

function openManuscriptModal(man = null) {
  const isEdit = !!man;
  let projectOpts = db.projects.map(p => `
    <option value="${p.id}" ${man && man.projectId === p.id ? 'selected' : ''}>${p.title}</option>
  `).join('');

  openModal(`
    <div class="modal-header">
      <h2>${isEdit ? 'Edit Manuscript Metadata' : 'Add New Manuscript'}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal">✕</button>
    </div>
    
    <div class="form-group">
      <label>Linked Project Context</label>
      <select id="man-proj-select">${projectOpts}</select>
    </div>

    <div class="form-group">
      <label>Manuscript Title</label>
      <input type="text" id="man-title" value="${isEdit ? man.title : ''}" placeholder="e.g. Dynamic Synthesis of Transition Metal Carbides">
    </div>

    <div class="grid-cols-2">
      <div class="form-group">
        <label>Writing Status</label>
        <select id="man-status">
          <option value="idea" ${man && man.status === 'idea' ? 'selected' : ''}>Idea</option>
          <option value="outline" ${man && man.status === 'outline' ? 'selected' : ''}>Outline</option>
          <option value="figure_preparation" ${man && man.status === 'figure_preparation' ? 'selected' : ''}>Figures Prep</option>
          <option value="drafting" ${man && man.status === 'drafting' ? 'selected' : ''}>Drafting</option>
          <option value="internal_review" ${man && man.status === 'internal_review' ? 'selected' : ''}>Internal Review</option>
          <option value="submitted" ${man && man.status === 'submitted' ? 'selected' : ''}>Submitted</option>
          <option value="accepted" ${man && man.status === 'accepted' ? 'selected' : ''}>Accepted</option>
        </select>
      </div>
      <div class="form-group">
        <label>Target Journal</label>
        <input type="text" id="man-journal" value="${isEdit ? man.targetJournals?.[0] || '' : ''}" placeholder="e.g. Nature Materials">
      </div>
    </div>

    <div class="form-group">
      <label>Abstract Draft</label>
      <textarea id="man-abstract" placeholder="Outline manuscript abstract draft...">${isEdit ? man.abstract || '' : ''}</textarea>
    </div>

    <button class="btn-primary w-full" id="btn-submit-man">${isEdit ? 'Save Changes' : 'Create Manuscript'}</button>
  `);

  document.getElementById('btn-submit-man').addEventListener('click', async () => {
    const projectId = document.getElementById('man-proj-select').value;
    const title = document.getElementById('man-title').value.trim();
    const status = document.getElementById('man-status').value;
    const journal = document.getElementById('man-journal').value.trim();
    const abstract = document.getElementById('man-abstract').value.trim();

    if (!projectId || !title) {
      alert('Project context and title are required');
      return;
    }

    if (isEdit) {
      man.projectId = projectId;
      man.title = title;
      man.status = status;
      man.targetJournals = [journal];
      man.abstract = abstract;
      man.updatedAt = new Date().toISOString();
    } else {
      const newMan = {
        id: 'man_' + Math.random().toString(36).substring(2, 9),
        userId: 'user',
        projectId,
        title,
        shortTitle: null,
        manuscriptType: 'article',
        status,
        abstract,
        keywords: [],
        authors: [],
        correspondingAuthors: [],
        targetJournals: [journal],
        currentVersion: '1.0',
        plannedFigures: [],
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.manuscripts.push(newMan);
    }

    await window.storage.saveAll(db);
    closeModal();
    renderKanban();
    showGlobalToast('Manuscripts updated!', 'success');
  });
}

// --- VIEW 5: SUBMISSIONS & REBUTTAL MATRIX ---
function renderSubmissions() {
  const container = document.getElementById('submissions-list-container');
  container.innerHTML = '';

  if (db.submissions.length === 0) {
    container.innerHTML = '<p class="empty-state">No submissions tracked yet.</p>';
  } else {
    sortDashboardSubmissions(db.submissions).forEach((sub, index) => {
      const card = document.createElement('div');
      card.className = `glass-card submission-card-item ${sub.id === selectedSubmissionId ? 'selected' : ''}`;
      
      // Find linked manuscript
      const man = db.manuscripts.find(m => m.id === sub.manuscriptId);
      const manTitle = man ? man.title : 'Unknown Manuscript';
      const journalName = getSubmissionJournalName(sub);
      const statusText = String(sub.status || 'submitted').replace('_', ' ');

      card.innerHTML = `
        <div class="submission-card-heading">
          <span class="submission-index">${index + 1}</span>
          <h4>${escapeHTML(journalName)}</h4>
        </div>
        <p>Paper: ${escapeHTML(manTitle)}</p>
        <span class="badge badge-${statusText.includes('revision') ? 'warning' : 'purple'}">${escapeHTML(statusText)}</span>
      `;

      card.addEventListener('click', () => {
        selectedSubmissionId = sub.id;
        renderSubmissions();
        renderSubmissionDetails(sub);
      });

      container.appendChild(card);
    });
  }

  // Render journal portals section
  renderJournalPortals();
}

function renderJournalPortals() {
  const portalList = document.getElementById('journal-portals-list');
  if (!portalList) return;
  portalList.innerHTML = '';

  if (!db.settings) db.settings = {};
  if (!db.settings.journalPortals) {
    db.settings.journalPortals = [
      { id: 'acs', name: 'ACS', url: 'https://publish.acs.org/app/login?code=1000', color: '#002C6C', isDefault: true },
      { id: 'wiley', name: 'Wiley', url: 'https://submission.wiley.com/submission/dashboard', color: '#00A4E4', isDefault: true },
      { id: 'apl', name: 'APL', url: 'https://apl.peerx-press.org/cgi-bin/main.plex', color: '#D22630', isDefault: true },
      { id: 'nature', name: 'Nature', url: 'https://mts-ncomms.nature.com/cgi-bin/main.plex', color: '#B59E50', isDefault: true }
    ];
  }

  const portals = db.settings.journalPortals;

  if (portals.length === 0) {
    portalList.innerHTML = '<p class="empty-state" style="padding: 12px; font-size: 11px;">No journal portals saved.</p>';
    return;
  }

  portals.forEach(portal => {
    const card = document.createElement('a');
    card.className = 'portal-item-card';
    card.href = portal.url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';

    let domain = '';
    try {
      domain = new URL(portal.url).hostname;
    } catch (e) {
      domain = portal.url;
    }

    const initial = portal.name.charAt(0).toUpperCase();

    card.innerHTML = `
      <div class="portal-info">
        <div class="portal-avatar" style="background-color: ${portal.color || 'var(--accent-purple)'};">
          ${initial}
        </div>
        <div class="portal-text">
          <span class="portal-name">${portal.name}</span>
          <span class="portal-domain" title="${portal.url}">${domain}</span>
        </div>
      </div>
      <div class="portal-actions">
        <button class="btn-delete-portal" title="Delete Portal" data-id="${portal.id}">
          ✕
        </button>
      </div>
    `;

    // Hook up delete listener
    const deleteBtn = card.querySelector('.btn-delete-portal');
    deleteBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (confirm(`Are you sure you want to delete the portal for ${portal.name}?`)) {
        db.settings.journalPortals = db.settings.journalPortals.filter(p => p.id !== portal.id);
        await window.storage.saveAll(db);
        renderJournalPortals();
        showGlobalToast(`Portal "${portal.name}" deleted`, 'success');
      }
    });

    portalList.appendChild(card);
  });
}

function setupJournalPortalListeners() {
  const addPortalBtn = document.getElementById('btn-add-portal');
  if (addPortalBtn) {
    addPortalBtn.addEventListener('click', () => {
      openModal(`
        <div class="modal-header">
          <h2>Add Journal Submission Portal</h2>
          <button class="btn-secondary btn-icon" id="btn-close-modal">✕</button>
        </div>
        
        <div class="form-group">
          <label>Journal / Publisher Name</label>
          <input type="text" id="portal-name" placeholder="e.g. ACS, Wiley, Nature, APL">
        </div>

        <div class="form-group">
          <label>Portal Login URL</label>
          <input type="url" id="portal-url" placeholder="https://...">
        </div>

        <div class="form-group">
          <label>Brand Theme Color</label>
          <div style="display: flex; gap: 12px; align-items: center;">
            <input type="color" id="portal-color" value="#8b5cf6" style="width: 48px; height: 36px; border: none; border-radius: 6px; cursor: pointer; padding: 0; background: transparent;">
            <span style="font-size: 12px; color: hsl(var(--text-muted));">Pick custom color for brand avatar badge</span>
          </div>
        </div>

        <button class="btn-primary w-full" id="btn-save-portal" style="margin-top:12px;">Add Portal</button>
      `);

      const saveBtn = document.getElementById('btn-save-portal');
      if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
          const name = document.getElementById('portal-name').value.trim();
          const url = document.getElementById('portal-url').value.trim();
          const color = document.getElementById('portal-color').value;

          if (!name || !url) {
            alert('Please fill out all fields.');
            return;
          }

          try {
            new URL(url);
          } catch (err) {
            alert('Please enter a valid URL (e.g. https://example.com)');
            return;
          }

          const newPortal = {
            id: 'portal_' + Math.random().toString(36).substring(2, 9),
            name,
            url,
            color,
            isDefault: false
          };

          if (!db.settings.journalPortals) {
            db.settings.journalPortals = [];
          }
          db.settings.journalPortals.push(newPortal);
          await window.storage.saveAll(db);

          closeModal();
          renderJournalPortals();
          showGlobalToast(`Journal portal "${name}" added!`, 'success');
        });
      }
    });
  }
}

function renderSubmissionDetails(sub) {
  normalizeSubmissionTimeline(sub);
  const detailPanel = document.getElementById('submission-detail-panel');
  const man = db.manuscripts.find(m => m.id === sub.manuscriptId);
  const manAbstract = man ? man.abstract || '' : '';
  const journalName = getSubmissionJournalName(sub);
  const submissionDoi = getSubmissionDoi(sub);
  const articleUrl = getSubmissionArticleUrl(sub);
  const timelineAnalysis = analyzeSubmission(sub);
  const timelineSubmissionDate = normalizeDateString(sub.submissionDate || timelineAnalysis.submitDate);
  const timelineFirstDecisionDate = normalizeDateString(sub.firstDecisionDate || timelineAnalysis.r1Date);
  const timelineRevisionDueDate = normalizeDateString(sub.revisionDueDate);
  const timelineDecisionDate = normalizeDateString(sub.decisionDate || timelineAnalysis.acceptDate || timelineAnalysis.onlineDate);

  // Get active checklist schema
  const compliance = sub.complianceChecklist || {};

  // Cycle time duration calculations
  const cycle = getSubmissionCycleTime(sub);
  let cycleTimeHtml = '';
  
  if (cycle.isCompleted) {
    cycleTimeHtml = `
      <div style="display:flex; align-items:center; gap:10px; margin-top:12px; padding: 12px 16px; background: hsl(var(--accent-emerald) / 0.08); border: 1px solid hsl(var(--accent-emerald) / 0.2); border-radius: 10px;">
        <span style="font-size: 18px; filter: drop-shadow(0 2px 4px rgba(16,185,129,0.25));">🎉</span>
        <div style="display:flex; flex-direction:column; gap:2px; text-align:left;">
          <span style="font-size: 12px; font-weight:700; color:hsl(var(--accent-emerald));">Cycle Time Completed (Total Duration)</span>
          <span style="font-size: 11px; color:hsl(var(--text-muted)); line-height:1.4;">Manuscript submitted on <strong>${cycle.startDateStr}</strong> and accepted/published on <strong>${cycle.endDateStr}</strong>. Total submission duration: <strong style="color:hsl(var(--accent-emerald)); font-size:12px;">${cycle.days} days</strong>.</span>
        </div>
      </div>
    `;
  } else {
    cycleTimeHtml = `
      <div style="display:flex; align-items:center; gap:10px; margin-top:12px; padding: 12px 16px; background: hsl(var(--accent-cyan) / 0.08); border: 1px solid hsl(var(--accent-cyan) / 0.2); border-radius: 10px;">
        <span style="font-size: 18px; filter: drop-shadow(0 2px 4px rgba(6,182,212,0.25));">🕒</span>
        <div style="display:flex; flex-direction:column; gap:2px; text-align:left;">
          <span style="font-size: 12px; font-weight:700; color:hsl(var(--accent-cyan));">Submission Cycle Tracking</span>
          <span style="font-size: 11px; color:hsl(var(--text-muted)); line-height:1.4;">Manuscript submitted on <strong>${cycle.startDateStr}</strong>. Cumulative cycle time elapsed to current status: <strong style="color:hsl(var(--accent-cyan)); font-size:12px;">${cycle.days} days in review</strong>.</span>
        </div>
      </div>
    `;
  }

  detailPanel.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <h2>Journal Submission: ${escapeHTML(journalName)}</h2>
      <button class="btn-danger btn-icon" id="btn-delete-sub">🗑️</button>
    </div>

    <!-- Timeline indicators -->
    <div class="flex-row" style="margin-top: 6px;">
      <span class="badge badge-info">Current Stage: ${escapeHTML(String(sub.status || 'submitted').replace('_', ' '))}</span>
      <span class="recent-item-date">Tracked since: ${sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : t('noDate')}</span>
    </div>
    
    <!-- Cycle Time Stats Panel -->
    ${cycleTimeHtml}

    <div class="glass-card" style="margin-top: 16px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
        <div>
          <h3>${t('publicationLinkTitle')}</h3>
          <p class="text-muted" style="font-size:11px; line-height:1.5; margin-top:4px;">${t('doiLabel')} and article URL are shown on Dashboard timeline cards and open the paper page directly.</p>
        </div>
        ${articleUrl ? `<a class="doi-link" href="${escapeHTML(articleUrl)}" target="_blank" rel="noopener noreferrer">${t('articlePage')}</a>` : ''}
      </div>
      <div class="grid-cols-2" style="gap:10px; margin-top:12px;">
        <div class="form-group">
          <label>${t('doiLabel')}</label>
          <input type="text" id="sub-publication-doi" value="${escapeHTML(submissionDoi)}" placeholder="10.1002/adfm.202528029">
        </div>
        <div class="form-group">
          <label>${t('articleUrlLabel')}</label>
          <input type="url" id="sub-publication-url" value="${escapeHTML(articleUrl)}" placeholder="${t('articleUrlPlaceholder')}">
        </div>
        <div class="form-group" style="display:flex; align-items:flex-end; grid-column:1 / -1;">
          <button class="btn-primary w-full" id="btn-save-sub-publication">${t('savePublicationLink')}</button>
        </div>
      </div>
    </div>

    <div class="glass-card" style="margin-top: 16px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
        <div>
          <h3>⏱ ${t('timelineDateControlTitle')}</h3>
          <p class="text-muted" style="font-size:11px; line-height:1.5; margin-top:4px;">${t('timelineDateControlHelp')}</p>
        </div>
        <span class="badge badge-info">${t('timelineDateSource')}: ${escapeHTML(timelineAnalysis.submitDateSource)}</span>
      </div>
      <div class="grid-cols-2" style="gap:10px; margin-top:12px;">
        <div class="form-group">
          <label>${t('initialSubmissionDate')}</label>
          <input type="date" id="sub-timeline-submission-date" value="${escapeHTML(timelineSubmissionDate)}">
        </div>
        <div class="form-group">
          <label>${t('firstDecisionDate')}</label>
          <input type="date" id="sub-timeline-r1-date" value="${escapeHTML(timelineFirstDecisionDate)}">
        </div>
        <div class="form-group">
          <label>${t('revisionDueDateLabel')}</label>
          <input type="date" id="sub-timeline-revision-due" value="${escapeHTML(timelineRevisionDueDate)}">
        </div>
        <div class="form-group">
          <label>${t('completionDate')} / ${t('stateAccepted')}</label>
          <input type="date" id="sub-timeline-decision-date" value="${escapeHTML(timelineDecisionDate)}">
        </div>
        <div class="form-group">
          <label>${t('status')}</label>
          <select id="sub-timeline-status">
            <option value="submitted" ${sub.status === 'submitted' ? 'selected' : ''}>Submitted</option>
            <option value="under_review" ${sub.status === 'under_review' ? 'selected' : ''}>Under Review</option>
            <option value="revision" ${sub.status === 'revision' ? 'selected' : ''}>Revision</option>
            <option value="accepted" ${sub.status === 'accepted' ? 'selected' : ''}>Accepted</option>
            <option value="published" ${sub.status === 'published' ? 'selected' : ''}>Published</option>
            <option value="rejected" ${sub.status === 'rejected' ? 'selected' : ''}>Rejected</option>
          </select>
        </div>
        <div class="form-group" style="display:flex; align-items:flex-end;">
          <button class="btn-primary w-full" id="btn-save-sub-timeline">${t('saveTimelineDates')}</button>
        </div>
      </div>
    </div>

    <!-- Compliance Checklist Section -->
    <div class="glass-card" style="margin-top: 16px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h3>📋 Submission Compliance Checklist</h3>
        <button class="btn-secondary" style="padding:4px 10px; font-size:11px;" id="btn-import-guidelines">📖 Parse Guidelines</button>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;" id="compliance-checklist-container">
        <!-- Rendered dynamically -->
      </div>
    </div>

    <!-- Rebuttal Response Matrix Section -->
    <div class="glass-card" style="margin-top: 16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
        <h3>🤖 Peer Review Response Rebuttal Matrix</h3>
        <div style="display:flex; gap:6px;">
          <button class="btn-secondary" style="padding:4px 10px; font-size:11px;" id="btn-export-rebuttal-table">📤 Export LaTeX/MD Table</button>
          <button class="btn-primary" style="padding:4px 10px; font-size:11px;" id="btn-add-review-comment">+ Add Comment</button>
        </div>
      </div>
      <div class="rebuttal-matrix-container" id="rebuttal-matrix-container">
        <!-- JS Populated -->
      </div>
    </div>
  `;

  document.getElementById('btn-save-sub-publication').addEventListener('click', async () => {
    const doi = normalizeDoi(document.getElementById('sub-publication-doi').value);
    const url = document.getElementById('sub-publication-url').value.trim();
    sub.doi = doi || null;
    sub.articleUrl = url || (doi ? `https://doi.org/${doi}` : null);
    sub.updatedAt = new Date().toISOString();
    await window.storage.saveAll(db);
    renderDashboard();
    renderSubmissions();
    renderSubmissionDetails(sub);
    showGlobalToast(t('publicationLinkSaved'), 'success');
  });

  // Delete submission
  document.getElementById('btn-delete-sub').addEventListener('click', async () => {
    if (confirm('Delete tracking for this submission?')) {
      db.submissions = db.submissions.filter(s => s.id !== sub.id);
      selectedSubmissionId = null;
      await window.storage.saveAll(db);
      renderSubmissions();
      document.getElementById('submission-detail-panel').innerHTML = `
        <div class="empty-state">
          <svg class="svg-icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <h3>Select a submission to manage its checklist and rebuttal response matrix.</h3>
        </div>
      `;
    }
  });

  document.getElementById('btn-save-sub-timeline').addEventListener('click', async () => {
    const submissionDateValue = document.getElementById('sub-timeline-submission-date').value;
    const firstDecisionDateValue = document.getElementById('sub-timeline-r1-date').value;
    const revisionDueDateValue = document.getElementById('sub-timeline-revision-due').value;
    const decisionDateValue = document.getElementById('sub-timeline-decision-date').value;
    const nextStatus = document.getElementById('sub-timeline-status').value;

    sub.submissionDate = dateInputToIso(submissionDateValue);
    sub.firstDecisionDate = dateInputToIso(firstDecisionDateValue);
    sub.revisionDueDate = dateInputToIso(revisionDueDateValue);
    sub.decisionDate = dateInputToIso(decisionDateValue);
    sub.status = nextStatus;
    sub.updatedAt = new Date().toISOString();

    normalizeSubmissionTimeline(sub);
    await window.storage.saveAll(db);
    renderSubmissions();
    renderSubmissionDetails(sub);
    showGlobalToast(t('timelineDatesSaved'), 'success');
  });

  // Render compliance checkboxes
  const checklistBox = document.getElementById('compliance-checklist-container');
  const checklistKeys = sub.complianceChecklistKeys || [
    { key: 'cover_letter_ready', label: 'Cover Letter drafted' },
    { key: 'title_page_ready', label: 'Title page formatted' },
    { key: 'data_availability_statement', label: 'Data Availability statement' },
    { key: 'author_contribution', label: 'CRedIT Author statements' },
    { key: 'figure_resolution_checked', label: 'High-res figures checked' },
    { key: 'conflict_of_interest', label: 'Conflict of Interest statement' }
  ];

  checklistKeys.forEach(chk => {
    const isChecked = compliance[chk.key] === true;
    const label = document.createElement('label');
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.gap = '8px';
    label.style.cursor = 'pointer';
    label.style.fontSize = '12px';
    label.style.textTransform = 'none';
    label.style.color = 'hsl(var(--text-primary))';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = isChecked;
    input.style.accentColor = 'hsl(var(--accent-purple))';
    
    input.addEventListener('change', async () => {
      compliance[chk.key] = input.checked;
      sub.complianceChecklist = compliance;
      await window.storage.saveAll(db);
    });

    label.appendChild(input);
    label.appendChild(document.createTextNode(chk.label));
    checklistBox.appendChild(label);
  });

  // Render Rebuttal Response Comments rows
  const rebuttalBox = document.getElementById('rebuttal-matrix-container');
  
  // We'll search for reviewer comments associated with this submission in database
  // If not created yet, we support creating mock review responses
  if (!sub.reviewMatrix || sub.reviewMatrix.length === 0) {
    sub.reviewMatrix = [
      { id: 'rev_1', comment: 'The author needs to elaborate on the temperature dependency measurement and verify if 1.65K is calibrated.', response: '', recordId: '' }
    ];
  }

  function renderRebuttalRows() {
    rebuttalBox.innerHTML = '';
    
    if (sub.reviewMatrix.length === 0) {
      rebuttalBox.innerHTML = '<p class="empty-state">No reviewer comments recorded. Click + Add Reviewer Comment.</p>';
      return;
    }

    sub.reviewMatrix.forEach((matrixRow, idx) => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'rebuttal-matrix-row';

      rowDiv.innerHTML = `
        <!-- Left Side: Reviewer Comment -->
        <div style="display:flex; flex-direction:column; gap:6px;">
          <div class="rebuttal-col-label">Reviewer Comment #${idx + 1}</div>
          <textarea class="reviewer-cmt-text" placeholder="Paste reviewer comment..." style="min-height:80px;">${matrixRow.comment}</textarea>
          <div style="display:flex; gap:6px; margin-top:4px;">
            <button class="btn-secondary btn-ai-draft" style="font-size:10px; padding:2px 6px;" id="btn-ai-draft-${matrixRow.id}">🤖 AI Draft Response</button>
            <button class="btn-danger btn-icon" style="width:24px; height:24px; font-size:10px;" id="btn-del-matrix-${matrixRow.id}">✕</button>
          </div>
        </div>

        <!-- Right Side: Author Rebuttal Response -->
        <div style="display:flex; flex-direction:column; gap:6px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="rebuttal-col-label" style="margin-bottom:0;">Author Response Rebuttal</div>
            <button class="btn-secondary" style="font-size:10px; padding:2px 6px; height:20px; display:inline-flex; align-items:center;" id="btn-copy-resp-${matrixRow.id}">📋 Copy Draft</button>
          </div>
          <textarea class="author-resp-text" placeholder="Draft your professional response..." style="min-height:114px;" id="text-response-${matrixRow.id}">${matrixRow.response}</textarea>
        </div>
      `;

      rebuttalBox.appendChild(rowDiv);

      // Save on input change
      const cmtArea = rowDiv.querySelector('.reviewer-cmt-text');
      const respArea = rowDiv.querySelector('.author-resp-text');
      
      cmtArea.addEventListener('input', () => {
        matrixRow.comment = cmtArea.value;
        window.storage.saveAll(db);
      });

      respArea.addEventListener('input', () => {
        matrixRow.response = respArea.value;
        window.storage.saveAll(db);
      });

      // Copy draft rebuttal response trigger
      document.getElementById(`btn-copy-resp-${matrixRow.id}`).addEventListener('click', () => {
        const txt = respArea.value.trim();
        if (!txt) {
          showGlobalToast('Response draft is empty', 'warning');
          return;
        }
        navigator.clipboard.writeText(txt).then(() => {
          showGlobalToast('Response copied to clipboard!', 'success');
        }).catch(() => {
          showGlobalToast('Copy failed', 'danger');
        });
      });

      // AI Draft Response Trigger
      document.getElementById(`btn-ai-draft-${matrixRow.id}`).addEventListener('click', async () => {
        const cmtText = cmtArea.value.trim();
        if (!cmtText) {
          alert('Reviewer comment cannot be empty for AI generation.');
          return;
        }

        const draftBtn = document.getElementById(`btn-ai-draft-${matrixRow.id}`);
        draftBtn.disabled = true;
        draftBtn.textContent = 'Generating...';

        try {
          // Fetch any experimental record summary context for matching
          const matchedRecordText = db.researchRecords.map(r => `${r.title}: ${r.summary || ''}`).join('\n');
          const aiDraft = await window.aiCopilot.generateReviewResponse(cmtText, matchedRecordText, manAbstract);
          
          respArea.value = aiDraft;
          matrixRow.response = aiDraft;
          await window.storage.saveAll(db);
          showGlobalToast('Response draft generated successfully!', 'success');
        } catch (e) {
          alert(`AI error: ${e.message}. Setup your API credentials in settings.`);
        } finally {
          draftBtn.disabled = false;
          draftBtn.textContent = '🤖 AI Draft Response';
        }
      });

      // Delete Row
      document.getElementById(`btn-del-matrix-${matrixRow.id}`).addEventListener('click', async () => {
        sub.reviewMatrix = sub.reviewMatrix.filter(row => row.id !== matrixRow.id);
        await window.storage.saveAll(db);
        renderRebuttalRows();
      });
    });
  }

  // Bind add review comment
  document.getElementById('btn-add-review-comment').addEventListener('click', async () => {
    sub.reviewMatrix.push({
      id: 'rev_' + Math.random().toString(36).substring(2, 9),
      comment: '',
      response: '',
      recordId: ''
    });
    await window.storage.saveAll(db);
    renderRebuttalRows();
  });

  // Action: AI Guidelines Compliance Parser
  document.getElementById('btn-import-guidelines').addEventListener('click', () => {
    openModal(`
      <div class="modal-header">
        <h2>AI Journal Compliance Guidelines Parser</h2>
        <button class="btn-secondary btn-icon" id="btn-close-modal">✕</button>
      </div>
      <div class="form-group">
        <label>Journal Guideline / Author Instructions Text</label>
        <textarea id="guidelines-text" placeholder="Copy and paste guideline text copied from the journal's website (word limits, formatting requirements, file lists)..." style="min-height:180px;"></textarea>
      </div>
      <button class="btn-primary w-full" id="btn-submit-guidelines">🤖 Extract Custom Checklist</button>
    `);

    document.getElementById('btn-submit-guidelines').addEventListener('click', async () => {
      const text = document.getElementById('guidelines-text').value.trim();
      if (!text) {
        alert('Please paste some guideline text.');
        return;
      }

      const submitBtn = document.getElementById('btn-submit-guidelines');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="loader"></span> Extracting guidelines...';

      try {
        const systemPrompt = `You are a professional editorial scientific assistant. Analyze the journal guidelines provided and extract 5-7 most important specific, actionable compliance checklist items. Output ONLY in valid JSON. Response format:
        {
          "checklist": [
            { "key": "unique_snake_case_key", "label": "Concise instruction (e.g. Abstract under 150 words)" }
          ]
        }`;

        const aiRes = await window.aiCopilot.generateCompletion(text, systemPrompt, true);
        const parsed = JSON.parse(aiRes);

        if (Array.isArray(parsed.checklist)) {
          sub.complianceChecklistKeys = parsed.checklist;
          sub.complianceChecklist = {}; // reset checks
          await window.storage.saveAll(db);
          closeModal();
          renderSubmissionDetails(sub);
          showGlobalToast('Custom checklist compiled successfully!', 'success');
        } else {
          throw new Error('Invalid JSON format returned.');
        }
      } catch (e) {
        alert(`Guidelines parsing error: ${e.message}. Set your AI API keys in settings.`);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '🤖 Extract Custom Checklist';
      }
    });
  });

  // Action: Export LaTeX & Markdown Rebuttal Table
  document.getElementById('btn-export-rebuttal-table').addEventListener('click', () => {
    // Generate LaTeX Code
    let latexCode = `\\documentclass{article}\n` +
                    `\\usepackage{booktabs} % For formal lines\n` +
                    `\\usepackage{longtable} % For multi-page tables\n` +
                    `\\usepackage{xcolor} % For row shading\n` +
                    `\\definecolor{commentgray}{HTML}{F6F8FA}\n\n` +
                    `\\begin{document}\n\n` +
                    `\\begin{longtable}{p{0.46\\textwidth} p{0.46\\textwidth}}\n` +
                    `\\caption{Reviewer Comments and Author Rebuttals} \\\\ \n` +
                    `\\toprule\n` +
                    `\\textbf{Reviewer Comment} & \\textbf{Author Response Rebuttal} \\\\ \n` +
                    `\\midrule\n` +
                    `\\end{firsthead}\n` +
                    `\\toprule\n` +
                    `\\textbf{Reviewer Comment} & \\textbf{Author Response Rebuttal} \\\\ \n` +
                    `\\midrule\n` +
                    `\\end{head}\n` +
                    `\\bottomrule\n` +
                    `\\end{foot}\n` +
                    `\\bottomrule\n` +
                    `\\end{lastfoot}\n`;

    sub.reviewMatrix.forEach((matrixRow, idx) => {
      const escapedCmt = escapeLaTeX(matrixRow.comment || 'No comment text.');
      const escapedResp = escapeLaTeX(matrixRow.response || 'Rebuttal response draft in progress.');
      
      latexCode += `\\rowcolor{commentgray}\n` +
                   `{\\bf Reviewer Comment \\#${idx + 1}:} ${escapedCmt} &\n` +
                   `{\\bf Response:} ${escapedResp} \\\\ \\midrule\n`;
    });

    latexCode += `\\end{longtable}\n\n` +
                 `\\end{document}`;

    // Generate Markdown Code
    let mdCode = `| Reviewer Comment | Author Response Rebuttal |\n` +
                 `| --- | --- |\n`;
    sub.reviewMatrix.forEach((matrixRow, idx) => {
      const cleanCmt = (matrixRow.comment || '').replace(/\n/g, '<br>');
      const cleanResp = (matrixRow.response || '').replace(/\n/g, '<br>');
      mdCode += `| **Comment #${idx + 1}:** ${cleanCmt} | **Response:** ${cleanResp} |\n`;
    });

    openModal(`
      <div class="modal-header">
        <h2>Export Rebuttal Response Table</h2>
        <button class="btn-secondary btn-icon" id="btn-close-modal">✕</button>
      </div>
      
      <div style="display:flex; flex-direction:column; gap:16px;">
        <!-- LaTeX Card -->
        <div class="glass-card" style="padding:12px; display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <label style="margin-bottom:0;">📄 LaTeX longtable & booktabs Source Code</label>
            <button class="btn-secondary" style="font-size:10px; padding:2px 8px;" id="btn-copy-latex">📋 Copy LaTeX</button>
          </div>
          <pre id="code-latex" style="font-size:10px; background:var(--input-bg); padding:10px; border-radius:6px; overflow:auto; max-height:160px; color:hsl(var(--accent-purple)); border:1px solid var(--glass-border); line-height:1.4; font-family:monospace; user-select:all;">${escapeHTML(latexCode)}</pre>
        </div>

        <!-- MD Card -->
        <div class="glass-card" style="padding:12px; display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <label style="margin-bottom:0;">📝 Markdown Table Source Code</label>
            <button class="btn-secondary" style="font-size:10px; padding:2px 8px;" id="btn-copy-md">📋 Copy Markdown</button>
          </div>
          <pre id="code-md" style="font-size:10px; background:var(--input-bg); padding:10px; border-radius:6px; overflow:auto; max-height:120px; color:hsl(var(--accent-cyan)); border:1px solid var(--glass-border); line-height:1.4; font-family:monospace; user-select:all;">${escapeHTML(mdCode)}</pre>
        </div>
      </div>
    `);

    // Bind copy triggers inside modal
    document.getElementById('btn-copy-latex').addEventListener('click', () => {
      navigator.clipboard.writeText(latexCode).then(() => {
        showGlobalToast('LaTeX table code copied!', 'success');
      });
    });

    document.getElementById('btn-copy-md').addEventListener('click', () => {
      navigator.clipboard.writeText(mdCode).then(() => {
        showGlobalToast('Markdown table copied!', 'success');
      });
    });
  });

  // LaTeX Escaper Utility
  function escapeLaTeX(str) {
    if (!str) return '';
    return str
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/([&%#_{}])/g, '\\$1')
      .replace(/\^/g, '\\textasciicircum{}')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/\n/g, '\\\\ ')
      .replace(/\$/g, '\\$');
  }

  // HTML Escaper
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  renderRebuttalRows();
}

// Track New Submission trigger
document.getElementById('btn-add-submission').addEventListener('click', () => {
  let manOpts = db.manuscripts.map(m => `
    <option value="${m.id}">${m.title}</option>
  `).join('');

  openModal(`
    <div class="modal-header">
      <h2>${t('trackSubmissionTitle')}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal">✕</button>
    </div>
    
    <div class="form-group">
      <label>${t('manuscriptPaper')}</label>
      <select id="sub-man-select">${manOpts}</select>
    </div>

    <div class="form-group">
      <label>${t('targetJournalInput')}</label>
      <input type="text" id="sub-journal" placeholder="e.g. IEEE Transactions on Smart Grids">
    </div>

    <div class="form-group">
      <label>${t('initialSubmissionDate')}</label>
      <input type="date" id="sub-date" value="${new Date().toISOString().split('T')[0]}">
    </div>

    <div class="form-group">
      <label>${t('doiLabel')}</label>
      <input type="text" id="sub-doi" placeholder="10.1002/adfm.202528029">
    </div>

    <div class="form-group">
      <label>${t('articleUrlLabel')}</label>
      <input type="url" id="sub-article-url" placeholder="${t('articleUrlPlaceholder')}">
    </div>

    <button class="btn-primary w-full" id="btn-submit-sub">${t('trackSubmissionButton')}</button>
  `);

  document.getElementById('btn-submit-sub').addEventListener('click', async () => {
    const manuscriptId = document.getElementById('sub-man-select').value;
    const targetJournal = document.getElementById('sub-journal').value.trim();
    const subDate = document.getElementById('sub-date').value;
    const doi = normalizeDoi(document.getElementById('sub-doi').value);
    const articleUrl = document.getElementById('sub-article-url').value.trim();

    if (!manuscriptId || !targetJournal) {
      alert(t('manuscriptJournalRequired'));
      return;
    }

    const newSub = {
      id: 'sub_' + Math.random().toString(36).substring(2, 9),
      userId: 'user',
      manuscriptId,
      projectId: db.manuscripts.find(m => m.id === manuscriptId)?.projectId || null,
      targetJournal,
      journalUrl: null,
      doi: doi || null,
      articleUrl: articleUrl || (doi ? `https://doi.org/${doi}` : null),
      status: 'submitted',
      submissionDate: dateInputToIso(subDate),
      decisionDate: null,
      revisionDueDate: null,
      firstDecisionDate: null,
      complianceChecklist: {},
      reviewMatrix: [],
      timelineNodes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    normalizeSubmissionTimeline(newSub);
    db.submissions.push(newSub);
    await window.storage.saveAll(db);
    closeModal();
    renderSubmissions();
    showGlobalToast(t('submissionAddedToast'), 'success');
  });
});

// --- VIEW 6: EVIDENCE LOCKER ---
function renderEvidence() {
  const tbody = document.getElementById('evidence-table-body');
  tbody.innerHTML = '';

  if (db.evidence.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No evidence files linked to your projects.</td></tr>';
    return;
  }

  db.evidence.forEach(item => {
    const tr = document.createElement('tr');
    
    // Find linked project
    const proj = db.projects.find(p => p.id === item.projectId);
    const projTitle = proj ? proj.title : 'General Area';

    // Parse cloud provider mapping
    const fileProvider = db.settings?.syncProviders?.files?.provider || 'local';

    tr.innerHTML = `
      <td><strong>${item.title}</strong></td>
      <td><span class="badge badge-info">${item.evidenceType}</span></td>
      <td>${projTitle}</td>
      <td><span class="badge badge-purple">${fileProvider}</span></td>
      <td>${new Date(item.createdAt).toLocaleDateString()}</td>
      <td>
        <a href="${item.filePath}" target="_blank" class="btn-secondary" style="padding: 4px 8px; font-size:11px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; color: hsl(var(--accent-purple)) !important; border-color: hsl(var(--accent-purple) / 0.3);">🔗 View File</a>
        <button class="btn-danger" style="padding: 4px 8px; font-size:11px;" id="btn-del-ev-${item.id}">🗑️</button>
      </td>
    `;
    
    tbody.appendChild(tr);

    // Delete Evidence
    document.getElementById(`btn-del-ev-${item.id}`).addEventListener('click', async () => {
      if (confirm('Delete this linked evidence file record?')) {
        db.evidence = db.evidence.filter(e => e.id !== item.id);
        await window.storage.saveAll(db);
        renderEvidence();
      }
    });
  });
}

// Add evidence trigger
document.getElementById('btn-add-evidence').addEventListener('click', () => {
  let projectOpts = db.projects.map(p => `<option value="${p.id}">${p.title}</option>`).join('');

  openModal(`
    <div class="modal-header">
      <h2>Upload / Link Evidence File</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal">✕</button>
    </div>

    <div class="form-group">
      <label>Linked Project Context</label>
      <select id="ev-proj-select">${projectOpts}</select>
    </div>

    <div class="form-group">
      <label>Document / Evidence Title</label>
      <input type="text" id="ev-title" placeholder="e.g. Journal Acceptance Notification Letter">
    </div>

    <div class="form-group">
      <label>Document Source File</label>
      <input type="file" id="ev-file-picker">
    </div>

    <div class="form-group">
      <label>OR Enter External Reference URL</label>
      <input type="text" id="ev-url" placeholder="https://...">
    </div>

    <button class="btn-primary w-full" id="btn-submit-ev">Save Evidence</button>
  `);

  document.getElementById('btn-submit-ev').addEventListener('click', async () => {
    const projectId = document.getElementById('ev-proj-select').value;
    const title = document.getElementById('ev-title').value.trim();
    const filePicker = document.getElementById('ev-file-picker');
    const extUrl = document.getElementById('ev-url').value.trim();

    if (!projectId || !title) {
      alert('Project and title are required');
      return;
    }

    const submitBtn = document.getElementById('btn-submit-ev');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loader"></span> Uploading...';

    // Inject linear progress bar into modal UI
    const modalBody = submitBtn.parentElement;
    const progressContainer = document.createElement('div');
    progressContainer.style.marginTop = '12px';
    progressContainer.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; font-size:11px;">
        <span style="color:hsl(var(--text-muted)); font-size:10px;">Syncing file to cloud locker...</span>
        <span id="upload-pct-label" style="font-weight:bold; color:hsl(var(--accent-purple)); font-size:10px;">0%</span>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar-fill progress-bar-striped" id="upload-progress-fill" style="width: 0%;"></div>
      </div>
    `;
    modalBody.appendChild(progressContainer);

    const fillEl = document.getElementById('upload-progress-fill');
    const pctLabel = document.getElementById('upload-pct-label');

    let uploadPct = 0;
    const progressInterval = setInterval(() => {
      if (uploadPct < 85) {
        uploadPct += Math.floor(Math.random() * 15) + 5;
        if (uploadPct > 85) uploadPct = 85;
        fillEl.style.width = `${uploadPct}%`;
        pctLabel.textContent = `${uploadPct}%`;
      }
    }, 150);

    try {
      let filePath = extUrl;
      let fileSize = 0;

      // Handle raw file upload to multi-cloud file Sync provider
      if (filePicker.files.length > 0) {
        const file = filePicker.files[0];
        fileSize = file.size;
        
        // Convert to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const uploadRes = await window.storage.uploadFile(arrayBuffer, file.name, file.type);
        if (uploadRes.success) {
          filePath = uploadRes.file.url;
        } else {
          throw new Error(uploadRes.error);
        }
      }

      if (!filePath) {
        throw new Error('Please select a file or enter an external URL.');
      }

      clearInterval(progressInterval);
      fillEl.style.width = '100%';
      pctLabel.textContent = '100%';

      const newEv = {
        id: 'ev_' + Math.random().toString(36).substring(2, 9),
        userId: 'user',
        projectId,
        title,
        description: 'Evidence document saved via Options Dashboard',
        evidenceType: filePicker.files.length > 0 ? 'pdf' : 'url',
        filePath,
        fileSize,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.evidence.push(newEv);
      await window.storage.saveAll(db);
      
      setTimeout(() => {
        progressContainer.remove();
        closeModal();
        renderEvidence();
        showGlobalToast('Evidence saved and distributed to cloud storage!', 'success');
      }, 500);

    } catch (e) {
      clearInterval(progressInterval);
      progressContainer.remove();
      alert(`Upload/Link Error: ${e.message}`);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Evidence';
    }
  });
});

// --- VIEW 7: MULTI-CLOUD SETTINGS ---
function loadSettings() {
  const syncProviders = db.settings?.syncProviders || DEFAULT_DB.settings.syncProviders;
  const ai = db.settings?.ai || DEFAULT_DB.settings.ai;
  const profile = db.settings?.profile || DEFAULT_DB.settings.profile;

  const languageSelect = document.getElementById('ui-language');
  if (languageSelect) languageSelect.value = profile.language || currentLanguage || 'en';

  // Cloud routing
  document.getElementById('route-db').value = syncProviders.metadata.provider || 'local';
  document.getElementById('route-files').value = syncProviders.files.provider || 'local';

  // WebDAV
  document.getElementById('webdav-url').value = syncProviders.metadata.config?.url || '';
  document.getElementById('webdav-username').value = syncProviders.metadata.config?.username || '';
  document.getElementById('webdav-password').value = syncProviders.metadata.config?.password || '';

  // GitHub
  document.getElementById('github-token').value = syncProviders.metadata.config?.token || '';
  document.getElementById('github-repo').value = syncProviders.metadata.config?.repo || '';
  document.getElementById('github-branch').value = syncProviders.metadata.config?.branch || 'main';

  // AI
  document.getElementById('ai-provider').value = ai.provider || 'openai';
  document.getElementById('ai-endpoint').value = ai.endpoint || 'https://api.openai.com/v1';
  document.getElementById('ai-key').value = ai.apiKey || '';
  document.getElementById('ai-model').value = ai.model || 'gpt-4o';
  applyLanguage();
}

function setupSettingsListeners() {
  const languageSelect = document.getElementById('ui-language');
  if (languageSelect) {
    languageSelect.addEventListener('change', () => {
      currentLanguage = languageSelect.value;
      document.documentElement.lang = currentLanguage === 'zh' ? 'zh-CN' : 'en';
      applyLanguage();
      renderDashboard();
    });
  }

  const saveLanguageBtn = document.getElementById('btn-save-language');
  if (saveLanguageBtn) {
    saveLanguageBtn.addEventListener('click', async () => {
      db.settings = db.settings || {};
      db.settings.profile = db.settings.profile || {};
      db.settings.profile.language = document.getElementById('ui-language').value || 'en';
      currentLanguage = db.settings.profile.language;
      document.documentElement.lang = currentLanguage === 'zh' ? 'zh-CN' : 'en';
      await window.storage.saveAll(db);
      applyLanguage();
      renderDashboard();
      showGlobalToast(t('languageSaved'), 'success');
    });
  }

  // Save Mappings Button
  document.getElementById('btn-save-settings').addEventListener('click', async () => {
    const routeDb = document.getElementById('route-db').value;
    const routeFiles = document.getElementById('route-files').value;

    const webdavConfig = {
      url: document.getElementById('webdav-url').value.trim(),
      username: document.getElementById('webdav-username').value.trim(),
      password: document.getElementById('webdav-password').value.trim()
    };

    const githubConfig = {
      token: document.getElementById('github-token').value.trim(),
      repo: document.getElementById('github-repo').value.trim(),
      branch: document.getElementById('github-branch').value.trim() || 'main'
    };

    // Update settings structure complying with DEFAULT_DB
    db.settings.syncProviders = {
      metadata: {
        provider: routeDb,
        config: routeDb === 'webdav' ? webdavConfig : githubConfig
      },
      files: {
        provider: routeFiles,
        config: routeFiles === 'webdav' ? webdavConfig : githubConfig
      }
    };

    await window.storage.saveAll(db);
    showGlobalToast('Distributed cloud storage mappings saved!', 'success');
  });

  // Save AI Button
  document.getElementById('btn-save-ai').addEventListener('click', async () => {
    db.settings.ai = {
      provider: document.getElementById('ai-provider').value,
      endpoint: document.getElementById('ai-endpoint').value.trim(),
      apiKey: document.getElementById('ai-key').value.trim(),
      model: document.getElementById('ai-model').value.trim()
    };

    await window.storage.saveAll(db);
    showGlobalToast('AI Copilot settings updated!', 'success');
  });

  // Test WebDAV Connection
  document.getElementById('btn-test-webdav').addEventListener('click', async () => {
    const btn = document.getElementById('btn-test-webdav');
    btn.disabled = true;
    btn.textContent = 'Testing connection...';

    const config = {
      url: document.getElementById('webdav-url').value.trim(),
      username: document.getElementById('webdav-username').value.trim(),
      password: document.getElementById('webdav-password').value.trim()
    };

    const result = await window.storage.testConnection('webdav', config);
    if (result.success) {
      showGlobalToast('WebDAV drive connected successfully!', 'success');
    } else {
      alert(`WebDAV test failed: ${result.error}`);
    }
    btn.disabled = false;
    btn.textContent = 'Test WebDAV Connection';
  });

  // Test GitHub Connection
  document.getElementById('btn-test-github').addEventListener('click', async () => {
    const btn = document.getElementById('btn-test-github');
    btn.disabled = true;
    btn.textContent = 'Testing repo...';

    const config = {
      token: document.getElementById('github-token').value.trim(),
      repo: document.getElementById('github-repo').value.trim(),
      branch: document.getElementById('github-branch').value.trim() || 'main'
    };

    const result = await window.storage.testConnection('github', config);
    if (result.success) {
      showGlobalToast('GitHub repository sync mapping validated!', 'success');
    } else {
      alert(`GitHub test failed: ${result.error}`);
    }
    btn.disabled = false;
    btn.textContent = 'Test GitHub Repository';
  });

  // --- DATABASE BACKUP & IMPORT LISTENERS ---
  // Export Database
  document.getElementById('btn-export-db').addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `researchflow-export-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showGlobalToast('Database JSON exported!', 'success');
  });

  // Trigger File Import Dialog
  document.getElementById('btn-trigger-import').addEventListener('click', () => {
    document.getElementById('import-db-file').click();
  });

  // Handle Imported JSON File and Adapt Schema Format
  document.getElementById('import-db-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importJson = JSON.parse(event.target.result);
        
        function capitalize(str) {
          if (!str) return '';
          return str.charAt(0).toUpperCase() + str.slice(1);
        }

        // Clone current database structure (maintains user's credentials/settings if any)
        const newDb = JSON.parse(JSON.stringify(db));

        // 1. Convert Projects
        if (Array.isArray(importJson.projects)) {
          newDb.projects = importJson.projects.map(proj => ({
            id: proj.id,
            userId: proj.userId || 'user',
            areaId: proj.areaId || null,
            title: proj.title,
            shortTitle: proj.shortTitle || null,
            discipline: capitalize(proj.discipline) || (proj.area ? capitalize(proj.area.name) : 'General'),
            abstract: proj.description || '',
            hypothesis: proj.hypothesis || '',
            objectives: Array.isArray(proj.objectives) ? proj.objectives : [],
            keywords: Array.isArray(proj.keywords) ? proj.keywords : [],
            tags: Array.isArray(proj.tags) ? proj.tags : [],
            customFields: proj.customFields || {},
            currentStage: proj.currentStage || (proj.status === 'completed' ? 'Completed' : 'Planning'),
            status: proj.status || 'planning',
            createdAt: proj.createdAt,
            updatedAt: proj.updatedAt
          }));
        }

        // 2. Convert Research Records
        if (Array.isArray(importJson.researchRecords)) {
          newDb.researchRecords = importJson.researchRecords.map(rec => ({
            id: rec.id,
            userId: rec.userId || 'user',
            projectId: rec.projectId || null,
            title: rec.title,
            recordType: rec.recordType || 'note',
            discipline: rec.discipline || '',
            methodology: rec.methodology || '',
            summary: rec.summary || '',
            rawData: rec.rawData || null,
            content: rec.content || '',
            priority: rec.priority || 'medium',
            status: rec.status || 'idea',
            attributes: rec.attributes || {},
            tags: Array.isArray(rec.tags) ? rec.tags : [],
            occurredAt: rec.occurredAt || rec.createdAt,
            createdAt: rec.createdAt,
            updatedAt: rec.updatedAt
          }));
        }

        // 3. Convert Manuscripts
        if (Array.isArray(importJson.manuscripts)) {
          newDb.manuscripts = importJson.manuscripts.map(man => ({
            id: man.id,
            userId: man.userId || 'user',
            projectId: man.projectId || null,
            title: man.title,
            shortTitle: man.shortTitle || null,
            manuscriptType: man.manuscriptType || 'article',
            status: man.status || 'idea',
            abstract: man.abstract || '',
            keywords: Array.isArray(man.keywords) ? man.keywords : [],
            authors: Array.isArray(man.authors) ? man.authors : [],
            correspondingAuthors: Array.isArray(man.correspondingAuthors) ? man.correspondingAuthors : [],
            targetJournals: Array.isArray(man.targetJournals) 
              ? man.targetJournals 
              : (man.targetJournal ? [man.targetJournal] : []),
            currentVersion: man.currentVersion || '1.0',
            plannedFigures: Array.isArray(man.plannedFigures) ? man.plannedFigures : [],
            notes: man.notes || null,
            createdAt: man.createdAt,
            updatedAt: man.updatedAt
          }));
        }

        // 4. Convert Submissions
        if (Array.isArray(importJson.submissions)) {
          newDb.submissions = importJson.submissions.map(sub => {
            let compliance = {};
            if (sub.complianceChecklist && typeof sub.complianceChecklist === 'object' && !Array.isArray(sub.complianceChecklist)) {
              compliance = sub.complianceChecklist;
            }
            return {
              id: sub.id,
              userId: sub.userId || 'user',
              manuscriptId: sub.manuscriptId,
              projectId: sub.projectId || null,
              targetJournal: sub.targetJournal || sub.journalName || '',
              journalUrl: sub.journalUrl || sub.submissionUrl || null,
              doi: normalizeDoi(sub.doi || sub.DOI || extractDoiFromText(sub.notes || '')) || null,
              articleUrl: sub.articleUrl || sub.publicationUrl || sub.url || null,
              status: sub.status || 'submitted',
              submissionDate: sub.submissionDate || sub.submittedAt || null,
              decisionDate: sub.decisionDate || sub.decisionAt || null,
              firstDecisionDate: sub.firstDecisionDate || null,
              revisionDueDate: sub.revisionDueDate || sub.revisionDeadline || null,
              notes: sub.notes || null,
              complianceChecklist: compliance,
              reviewMatrix: Array.isArray(sub.reviewMatrix) 
                ? sub.reviewMatrix 
                : (Array.isArray(sub.reviewRounds) ? sub.reviewRounds : []),
              timelineNodes: Array.isArray(sub.timelineNodes) ? sub.timelineNodes : [],
              createdAt: sub.createdAt,
              updatedAt: sub.updatedAt
            };
          });
        }

        // 5. Convert Achievements
        if (Array.isArray(importJson.achievements)) {
          newDb.achievements = importJson.achievements.map(ach => ({
            id: ach.id,
            userId: ach.userId || 'user',
            title: ach.title,
            achievementType: ach.achievementType,
            description: ach.description || null,
            date: ach.date,
            role: ach.role,
            doi: ach.doi || null,
            url: ach.url || null,
            journal: ach.journal || null,
            volume: ach.volume || null,
            pages: ach.pages || null,
            impactSummary: ach.impactSummary || null,
            metadata: ach.metadata || {},
            tags: Array.isArray(ach.tags) ? ach.tags : [],
            createdAt: ach.createdAt,
            updatedAt: ach.updatedAt
          }));
        }

        // 6. Convert Evidence
        if (Array.isArray(importJson.evidence)) {
          newDb.evidence = importJson.evidence;
        }

        // 7. Convert Honors
        if (Array.isArray(importJson.honorOpportunities)) {
          newDb.honorOpportunities = importJson.honorOpportunities;
        }
        if (Array.isArray(importJson.honorApplications)) {
          newDb.honorApplications = importJson.honorApplications;
        }

        newDb.lastUpdated = Date.now();

        // Update database cache and storage state
        db = newDb;
        await window.storage.saveAll(db);

        // Reset file input
        e.target.value = '';

        showGlobalToast('Database JSON successfully imported and adapted!', 'success');
        
        // Refresh settings panel UI
        loadSettings();
      } catch (err) {
        alert(`Failed to import JSON: ${err.message}`);
        console.error(err);
      }
    };
    reader.readAsText(file);
  });
}

// --- DYNAMIC DIALOG MODAL CONTROLLER ---
const modal = document.getElementById('modal-container');
const modalContent = document.getElementById('modal-card-content');

function openModal(htmlContent) {
  modalContent.innerHTML = htmlContent;
  modalContent.classList.toggle('stage-modal-wide', htmlContent.includes('stage-editor'));
  modal.classList.add('active');
  
  // Auto-bind close trigger inside modal
  const closeBtn = document.getElementById('btn-close-modal');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
}

function closeModal() {
  modal.classList.remove('active');
}

function setupGlobalModalListeners() {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

// --- GLOBALLY ACCESSIBLE TOAST BANNER ---
function showGlobalToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `badge badge-${type === 'success' ? 'success' : 'danger'}`;
  toast.style.position = 'fixed';
  toast.style.bottom = '24px';
  toast.style.right = '24px';
  toast.style.zIndex = '999999';
  toast.style.padding = '10px 20px';
  toast.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.4)';
  toast.style.animation = 'slideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards';
  toast.style.fontSize = '13px';
  toast.textContent = message;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}
