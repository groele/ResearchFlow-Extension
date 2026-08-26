/**
 * ResearchFlow OS - Options Dashboard Controller
 * Manages full routing, CRUD forms, kanbans, timeline charts, and sync settings.
 */

let db = null;
let selectedProjectId = null;
let selectedSubmissionId = null;
let currentDashboardFilter = 'all'; // 'all', 'accepted', 'active'
let currentLanguage = 'en';
let isPipelineExpanded = false;
let pendingSubmissionCapture = null;
let submissionAutoSaveCleanup = null;
let acceptanceCelebrationCleanup = null;
let previousModalFocus = null;
let activeSharePreviewUrl = null;

const RF_OPTIONS_RENDER_VERSION = '7.3.4';
const SUBMISSION_ASSIST_STORAGE_KEY = 'researchflow_submission_assist';
const PENDING_SUBMISSION_DRAFT_KEY = 'researchflow_pending_submission_draft';
const PENDING_ACADEMIC_DRAFT_KEY = 'researchflow_pending_academic_draft';
const PRE_IMPORT_BACKUP_KEY = 'researchflow_pre_import_backup';
const SHARE_PREFS_STORAGE_KEY = 'researchflow_share_visibility';
const MAX_IMPORT_BYTES = 25 * 1024 * 1024;
const UI_THEME_OPTIONS = new Set(['system', 'light', 'dark']);

const I18N = {
  en: {
    dashboardNav: 'Dashboard Overview',
    manuscriptsNav: 'Manuscripts Kanban',
    submissionsNav: 'Submissions & Review',
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
    timelineSortedBySubmissionDate: 'Latest submissions first',
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
    timelineEvents: 'Timeline Events',
    manageEvents: 'Manage Events',
    shareJourney: 'Share journey',
    shareJourneyTitle: 'Submission journey',
    shareJourneyHelp: 'Generated locally. Nothing is uploaded until you choose to share it.',
    shareJourneySystem: 'Share image',
    shareJourneyDownload: 'Download PNG',
    shareJourneyCopy: 'Copy image',
    shareJourneyCopied: 'Share image copied to clipboard.',
    shareJourneyDownloaded: 'Share image downloaded.',
    shareJourneyReady: 'Share image is ready.',
    shareJourneyFailed: 'Could not generate the share image.',
    shareJourneyUnsupported: 'Image sharing is unavailable here. Download the PNG instead.',
    shareJourneyEyebrow: 'RESEARCHFLOW · SUBMISSION JOURNEY',
    shareJourneyStatus: 'CURRENT STATUS',
    shareJourneyDuration: 'DAYS IN THIS JOURNEY',
    shareJourneyTimeline: 'JOURNEY MILESTONES',
    shareJournalLabel: 'TARGET JOURNAL',
    shareJourneyNoEvents: 'No dated milestones yet',
    shareJourneyFooter: 'Built locally from your ResearchFlow timeline',
    shareVisibilityTitle: 'Visible information',
    shareVisibilityHelp: 'Your choices are remembered for the next image.',
    shareFieldTitle: 'Title',
    shareFieldJournal: 'Journal',
    shareFieldAuthor: 'First author',
    shareFieldStatus: 'Status',
    shareFieldDuration: 'Journey days',
    shareFieldDates: 'Milestone dates',
    shareFieldFooter: 'ResearchFlow footer',
    shareSizeTitle: 'Image size',
    shareSizePortrait: 'Mobile portrait · adaptive 1080 × 980–1350',
    shareSizeStory: 'Story · 1080 × 1920',
    shareSizeAuto: 'Adaptive long image',
    noEventYet: 'No event yet',
    addEventStart: 'Add an event to start tracking',
    clickAddEvent: 'Click here to add a timeline event for this manuscript.',
    clickEditEvent: 'Click to edit this event.',
    settingsTitle: 'Multi-Cloud Settings',
    settingsSubtitle: 'Control exactly how and where your private data is distributed.',
    settingsKicker: 'Workspace control',
    settingsTrustSummary: 'Data protection summary',
    settingsLocalFirst: 'Local database',
    settingsDeviceSecrets: 'Device-only credentials',
    settingsPreferencesAutosave: 'Optional cloud sync',
    settingsSecurityEyebrow: 'Privacy by architecture',
    settingsSecurityTitle: 'Your research data stays on this device by default.',
    settingsSecurityHelp: 'Cloud sync only starts after you choose and configure a provider. Passwords and tokens are excluded from database files, exports, and cloud payloads.',
    settingsRoutingEyebrow: 'Data destination',
    settingsRoutePrivacy: 'Secrets are stored only on this device.',
    settingsLocalEyebrow: 'Active route',
    settingsLocalTitle: 'Local cache only',
    settingsLocalHelp: 'Research data remains inside this Chrome profile until you export or select a cloud route.',
    settingsLocalPointAccount: 'No account required',
    settingsLocalPointSync: 'Manual cloud sync is off',
    settingsLocalPointBackup: 'JSON backup remains available',
    settingsProviderEyebrow: 'Provider credentials',
    settingsWebdavHelp: 'Connect a private WebDAV folder for the database JSON.',
    settingsCredentialNote: 'Credentials never enter exported or synchronized JSON.',
    settingsGithubHelp: 'Store the database JSON in a private repository branch.',
    settingsGithubCredentialNote: 'Use a repository-scoped token with Contents access.',
    settingsLanguageEyebrow: 'Interface',
    settingsAssistEyebrow: 'Browser intelligence',
    settingsBackupEyebrow: 'Data resilience',
    settingsBackupNote: 'A recoverable snapshot is kept before every valid import.',
    languageCardTitle: 'Interface Preferences',
    languageLabel: 'Display Language',
    languageHelp: 'Choose the language and appearance used across this workspace.',
    languageAutoSaved: 'Interface preferences are saved automatically.',
    appearanceLabel: 'Appearance',
    appearanceSystem: 'Follow system',
    appearanceLight: 'Light',
    appearanceDark: 'Dark',
    appearanceSaved: 'Appearance preference saved.',
    autoCloudSyncLabel: 'Automatic cloud sync',
    autoCloudSyncHelp: 'Sync valid cloud routes shortly after local changes are saved.',
    autoCloudSyncLocalHelp: 'Choose WebDAV or GitHub to enable automatic cloud sync.',
    submissionAssistTitle: 'Submission Portal Recognition',
    submissionAssistHelp: 'Show a quick-entry card when a supported journal submission system is detected.',
    submissionAssistToggle: 'Automatic detection',
    submissionAssistToggleHelp: 'Recognize supported portals without opening a popup or side panel.',
    submissionAssistCaptureToggle: 'Automatic information capture',
    submissionAssistCaptureHelp: 'Collect manuscript and workflow fields for human review. Passwords, email addresses, and files are excluded.',
    submissionAssistEnabled: 'Enabled',
    submissionAssistDisabled: 'Disabled',
    submissionAssistScopeHelp: 'Recognition runs only on supported submission domains.',
    submissionAssistReset: 'Reset ignored websites',
    submissionAssistNoneIgnored: 'No websites ignored.',
    submissionAssistIgnoredCount: '{count} website(s) ignored.',
    submissionAssistSaved: 'Submission portal recognition updated.',
    submissionAssistResetToast: 'Ignored submission websites reset.',
    detectedSubmissionPrefilled: 'Captured from {platform}. Review every field before creating the project.',
    captureReviewTitle: 'Review captured submission',
    captureReviewHelp: 'Nothing is saved yet. Check the detected fields, then confirm to create a linked project, manuscript, and submission record.',
    captureConfidence: 'Recognition confidence',
    captureFieldsDetected: '{count} fields detected',
    captureProjectTitle: 'New Project Name',
    captureProjectPlaceholder: 'e.g. Nano Letters submission — interface polarization',
    manuscriptIdLabel: 'Manuscript / Submission ID',
    capturedStatusLabel: 'Detected Workflow Status',
    firstAuthorLabel: 'First Author',
    firstAuthorHelp: 'Shown on the dashboard and kept with the linked manuscript.',
    firstAuthorPlaceholder: 'e.g. Alex Chen',
    firstAuthorNotSet: 'Not set',
    authorsLabel: 'Authors',
    abstractLabel: 'Abstract / Project Summary',
    keywordsLabel: 'Keywords',
    revisionDueLabel: 'Revision Due Date',
    confirmCreateProject: 'Confirm & Create Project',
    captureCreatedToast: 'New project, manuscript, and submission created after review.',
    captureExistingOpenedToast: 'This captured submission already exists. The existing record was opened.',
    confidenceHigh: 'High',
    confidenceMedium: 'Medium',
    confidenceLow: 'Needs review',
    cloudRoutingTitle: 'Distributed Cloud Storage Routing',
    webdavTitle: 'WebDAV Credentials',
    githubTitle: 'GitHub Private Repository Sync',
    backupTitle: 'Database Backup & Import',
    saveLanguage: 'Save Language',
    saveMappings: 'Save Storage Mapping',
    exportDb: 'Export Database',
    exportDiagnostics: 'Export Diagnostics',
    importJson: 'Import JSON',
    restoreImportBackup: 'Restore Pre-Import Backup',
    languageSaved: 'Language preference saved.',
    databaseExported: 'Database JSON exported!',
    diagnosticsExported: 'Privacy-safe diagnostics exported.',
    databaseImported: 'Database JSON imported successfully.',
    importBackupRestored: 'The database state from before the last import was restored.',
    noImportBackup: 'No pre-import backup is available on this device.',
    restoreImportConfirm: 'Restore the database state saved immediately before the last import? Current unsaved changes will be replaced.',
    importFileTooLarge: 'The selected backup is larger than 25 MB and was not opened.',
    invalidBackup: 'This file is not a recognized ResearchFlow database backup.',
    noUrgentEvents: 'No urgent review or timeline events.',
    noRecentRecords: 'No research records captured yet.',
    noPipelines: 'No manuscript submission pipelines in progress.',
    eventNameRequired: 'Event name is required.',
    zoteroSync: 'Import to Zotero',
    untitledEvent: 'Untitled Event',
    untitledManuscript: 'Untitled Manuscript',
    untitledProject: 'Untitled Project',
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
    keyEventPreset: 'Key Event',
    customEvent: 'Custom event',
    eventNotesShort: 'Notes',
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
    eventDateHelp: 'One timeline event only needs one date: the day this mapped event happened. Deadlines and source dates are managed in the Submission Entry Editor.',
    plannedDate: 'Planned Date',
    initialSubmissionDate: 'Initial Submission Date',
    deadlineDate: 'Deadline / Due Date',
    completionDate: 'Completion Date',
    firstDecisionDate: 'First Decision / R1 Date',
    revisionDueDateLabel: 'Revision Due Date',
    timelineDateSource: 'Date source',
    doiLabel: 'DOI',
    articlePage: 'Article page',
    doiNotSet: 'DOI not set',
    trackSubmissionTitle: 'Track Journal Submission',
    manuscriptPaper: 'Manuscript / Paper',
    targetJournalInput: 'Target Journal',
    articleUrlLabel: 'Article / Journal URL',
    articleUrlPlaceholder: 'https://doi.org/10.xxxx/xxxxx',
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
    manuscriptNotFound: 'Manuscript not found. Refreshing workspace.',
    manuscriptStatusUpdated: 'Manuscript status updated.',
    manuscriptStatusUpdatedTo: 'Manuscript status updated to {status}.',
    submissionNotFound: 'Submission not found. Refreshing dashboard.',
    eventNotFound: 'Event not found. Refreshing dashboard.',
    eventAddedToast: 'Added event "{name}".',
    eventSavedToast: 'Event "{name}" saved.',
    eventRemovedToast: 'Event removed from pipeline',
    confirmDeleteEvent: 'Are you sure you want to delete event "{name}"?',
    confirmUpdateEvent: 'This key event already exists. Update "{name}" instead of adding a duplicate?',
    statusRejected: 'Rejected',
    markRejected: 'Mark Rejected',
    transferToJournal: 'Transfer to New Journal',
    transferSubmissionTitle: 'Rejected: Submit to Another Journal',
    newTargetJournal: 'New Target Journal',
    rejectionDate: 'Rejection Date',
    rejectionNote: 'Decision note',
    transferButton: 'Create New Submission',
    rejectedToast: 'Submission marked rejected.',
    transferToast: 'New target journal submission created.',
    manuscriptsTitle: 'Manuscripts Kanban',
    manuscriptsSubtitle: 'Track your writing process from outline/drafting to final peer-review.',
    addManuscript: '+ Add Manuscript',
    kanbanIdea: 'Idea & Outline',
    kanbanDrafting: 'Drafting & Figures',
    kanbanSubmitted: 'Submitted',
    kanbanAccepted: 'Accepted / Published',
    submissionsPageTitle: 'Submissions & Peer Review Matrix',
    submissionsPageSubtitle: 'Draft rebuttal response matrices and checklist compliance reports.',
    activeSubmissionsTitle: 'Active Submissions',
    activeSubmissionsHelp: 'Select a row or its edit button; the right panel opens the editor under Workflow Context.',
    submissionEmptyDetail: 'Select a submission; the entry editor opens under Workflow Context.',
    journalPortalsTitle: 'Journal Portals',
    journalPortalsHelp: 'Open a saved portal or add another submission system.',
    trackNewSubmissionButton: '+ Track New Submission',
    submissionDetailKicker: 'Journal Submission',
    currentStageLabel: 'Current Stage',
    trackedSinceLabel: 'Tracked since',
    workflowContextTitle: 'Workflow Context',
    workflowNeedsLinking: 'Needs linking',
    linkManuscript: 'Link manuscript',
    linkSubmissionTitle: 'Link Submission to Manuscript',
    linkSubmissionHelp: 'Choose the manuscript that owns this submission record.',
    linkSubmissionConfirm: 'Link Submission',
    linkSubmissionSaved: 'Submission linked to the selected manuscript.',
    noManuscriptsToLink: 'No manuscripts are available. Create a manuscript first.',
    workflowLinkedFlow: 'Linked flow',
    workflowManuscriptLabel: 'Manuscript',
    workflowTimelineLabel: 'Timeline',
    workflowReviewerCommentsLabel: 'Reviewer Comments',
    relationshipSummaryLine: '{manuscript}: {timeline} timeline events, {comments} reviewer comments.',
    editableSummary: 'Editable Summary',
    editFields: 'Edit fields',
    jumpToEditor: 'Jump to editor',
    submissionEntryEditorTitle: 'Submission Entry Editor',
    submissionEntryEditorHelp: 'Edit the selected entry here. Changes are saved automatically as you type.',
    linkedManuscriptBadge: 'Linked manuscript',
    detachedSubmissionBadge: 'Detached submission',
    manuscriptSection: 'Manuscript',
    manuscriptTitleLabel: 'Manuscript Title',
    paperTitlePlaceholder: 'Paper title',
    submissionPortalUrl: 'Submission Portal URL',
    reviewTimingSection: 'Review Timing',
    publicationSection: 'Publication',
    submissionChecklistSection: 'Submission Checklist',
    peerReviewMatrixSection: 'Peer Review Response Matrix',
    addComment: 'Add Comment',
    reviewEditorHelp: 'Reviewer comments and author responses are saved automatically as you type.',
    autoSavePending: 'Waiting to save',
    autoSaveSaving: 'Saving changes…',
    autoSaveSaved: 'All changes saved',
    autoSaveInvalid: 'Check the highlighted field',
    autoSaveFailed: 'Auto-save failed. Your text remains in this form.',
    acceptanceCelebrationEyebrow: 'Milestone unlocked',
    acceptanceCelebrationTitle: 'Accepted — congratulations!',
    acceptanceCelebrationBody: '{title} has crossed an important research milestone.',
    transferRoundHelp: 'Close the current round and create the next target journal record in one step.',
    savedReviewPreviewTitle: 'Saved Review Preview',
    savedReviewPreviewHelp: 'Read-only snapshot kept in sync with the Submission Entry Editor.',
    exportTable: 'Export Table',
    emptyReviewEditor: 'No reviewer comments recorded. Add one here; it will save automatically.',
    emptyReviewPreview: 'No saved reviewer comments yet.',
    reviewerCommentLabel: 'Reviewer Comment #{count}',
    reviewerCommentPlaceholder: 'Paste reviewer comment...',
    authorResponseLabel: 'Author Response',
    authorResponsePlaceholder: 'Draft your professional response...',
    copy: 'Copy',
    removeComment: 'Remove comment',
    checklistLabel: 'Checklist',
    responsesLabel: 'Responses',
    responseSaved: 'Response saved',
    responsePending: 'Response pending',
    noCommentText: 'No comment text saved yet.',
    submissionEditsSaved: 'Submission edits saved.',
    confirmDeleteSubmission: 'Delete tracking for this submission?',
    confirmMarkRejected: 'Mark this submission as rejected?',
    deleteSubmissionTitle: 'Delete submission tracking',
    cycleTimeCompleted: 'Cycle Time Completed',
    cycleTimeCompletedText: 'Submitted {start}; accepted/published {end}. Total duration: {days} days.',
    submissionCycleTracking: 'Submission Cycle Tracking',
    submissionCycleText: 'Submitted {start}. Current elapsed time: {days} days in review.',
    publicationLinksKept: 'Publication links are kept for Accepted or Published submissions.',
    editorRenderFailedTitle: 'Submission editor failed to render',
    editorRenderFailedHelp: 'The submission detail template did not create the edit form. Reload the extension and report this state if it persists.',
    editorMounted: 'Edit form active v{version}',
    editorMissing: 'Edit form missing v{version}',
    noSubmissionsTracked: 'No submissions tracked yet.',
    portalEmpty: 'No journal portals saved.',
    portalDeleteTitle: 'Delete portal',
    portalDeleteConfirm: 'Are you sure you want to delete the portal for {name}?',
    portalDeletedToast: 'Portal "{name}" deleted',
    addPortalTitle: 'Add Journal Submission Portal',
    portalNameLabel: 'Journal / Publisher Name',
    portalNamePlaceholder: 'e.g. ACS, Wiley, Nature, APL',
    portalUrlLabel: 'Portal Login URL',
    portalColorLabel: 'Brand Theme Color',
    portalColorHelp: 'Pick custom color for brand avatar badge',
    addPortalButton: 'Add Portal',
    fillAllFields: 'Please fill out all fields.',
    validUrlRequired: 'Please enter a valid URL (e.g. https://example.com)',
    portalAddedToast: 'Journal portal "{name}" added.',
    storageRoutingHelp: 'Choose where the ResearchFlow metadata database is synchronized.',
    routeDbLabel: 'Database JSON Sync Destination',
    optionLocalCache: 'None (Local Cache Only)',
    optionWebDavDrive: 'WebDAV Drive (Jianguoyun, Nextcloud)',
    optionGithubRepo: 'GitHub Private Repository',
    localSyncSummary: 'Local-only mode: data stays on this device and manual cloud sync is disabled.',
    webdavSyncSummary: 'WebDAV mode: configure and test the WebDAV account shown below.',
    githubSyncSummary: 'GitHub mode: configure and test the private repository shown below.',
    webdavUrlLabel: 'WebDAV Server Base URL',
    usernameEmailLabel: 'Username / Email',
    appPasswordLabel: 'App-Specific Password',
    testWebdav: 'Test WebDAV Connection',
    githubPatLabel: 'GitHub Personal Access Token (PAT)',
    githubRepoLabel: 'Repository Name (owner/repo)',
    githubBranchLabel: 'Branch Name',
    testGithub: 'Test GitHub Repository',
    backupHelp: 'Export your research database to JSON, or import/migrate existing ResearchFlow JSON backups.',
    noReviewerCommentsExport: 'No reviewer comments to export.',
    latexDownloaded: 'LaTeX template downloaded.',
    currentJournalLabel: 'Current journal',
    transferModalHelp: 'This will mark the current submission as rejected and create a new active submission for the next journal.',
    validPortalUrlOrBlank: 'Please enter a valid portal URL, or leave it blank.',
    newManuscriptTitleLabel: 'New Manuscript Title',
    createNewManuscriptOption: '+ Create new manuscript...',
    targetJournalPlaceholder: 'e.g. Advanced Functional Materials',
    rejectionNotePlaceholder: 'Optional editor decision, scope mismatch, reviewer summary, or next-action note...',
    editManuscriptMetadata: 'Edit Manuscript Metadata',
    addNewManuscriptTitle: 'Add New Manuscript',
    writingStatus: 'Writing Status',
    statusIdea: 'Idea',
    statusOutline: 'Outline',
    statusFiguresPrep: 'Figures Prep',
    statusDrafting: 'Drafting',
    statusInternalReview: 'Internal Review',
    abstractDraft: 'Abstract Draft',
    abstractPlaceholder: 'Outline manuscript abstract draft...',
    createManuscript: 'Create Manuscript',
    academicCapturePrefilled: 'Scholar result captured for review. Confirm the fields before creating the manuscript.',
    scholarSourcePage: 'Scholar result / article URL',
    manuscriptTitleRequired: 'Enter a manuscript title before continuing.',
    academicCaptureChooseTitle: 'Choose a Scholar result',
    academicCaptureChooseHelp: 'Select the paper you intended to capture. Nothing is saved until you confirm the form.',
    academicCaptureSource: 'Capture source',
    academicCaptureConfidence: 'Detection confidence',
    academicCaptureDetected: 'results detected',
    academicDuplicateConfirm: 'A matching manuscript already exists. Update the existing record with the reviewed fields?',
    academicDuplicateUpdated: 'Existing manuscript updated without creating a duplicate.',
    academicCaptureSaved: 'Scholar manuscript reviewed and saved.'
  },
  zh: {
    dashboardNav: '仪表盘总览',
    manuscriptsNav: '手稿看板',
    submissionsNav: '投稿与审稿',
    settingsNav: '多云设置',
    syncLocal: '已同步（本地）',
    forceSync: '🔄 强制同步',
    dashboardTitle: '仪表盘总览',
    dashboardSubtitle: '集中查看科研进展、投稿状态和关键时间线。',
    acceptedPublished: '🎉 已接收 / 已发表',
    activeReview: '🕒 审稿中',
    totalSubmissions: '📊 投稿总数',
    clickToFilter: '点击筛选',
    timelineTitle: '📅 手稿流水线时间线',
    timelineSubtitle: '通过可视化手稿流水线跟踪实验、写作、投稿、修改、接收和发表。',
    timelineSortedBySubmissionDate: '按投稿时间排序',
    compact: '紧凑',
    expanded: '展开',
    allPipelines: '全部流水线',
    activePipelines: '进行中的审稿',
    acceptedPipelines: '已接收 / 已发表',
    metricExpSubmit: '平均 实验 → 投稿',
    metricSubmitToday: '未接收：投稿 → 今天',
    metricR1Today: '未接收：R1 → 今天',
    metricSubmitAccept: '已接收：投稿 → 接收',
    recentLogs: '⚡ 最近研究动态',
    timelineAlerts: '🔔 时间线提醒',
    addEvent: '+ 事件',
    latestEvent: '最新事件',
    timelineEvents: '时间线事件',
    manageEvents: '管理事件',
    shareJourney: '分享历程',
    shareJourneyTitle: '投稿历程分享图',
    shareJourneyHelp: '图片仅在本地生成，只有在你主动分享时才会离开设备。',
    shareJourneySystem: '分享图片',
    shareJourneyDownload: '下载 PNG',
    shareJourneyCopy: '复制图片',
    shareJourneyCopied: '分享图已复制到剪贴板。',
    shareJourneyDownloaded: '分享图已下载。',
    shareJourneyReady: '分享图已生成。',
    shareJourneyFailed: '分享图生成失败。',
    shareJourneyUnsupported: '当前环境无法直接分享图片，请下载 PNG。',
    shareJourneyEyebrow: 'RESEARCHFLOW · 投稿历程',
    shareJourneyStatus: '当前状态',
    shareJourneyDuration: '历程天数',
    shareJourneyTimeline: '关键节点',
    shareJournalLabel: '目标期刊',
    shareJourneyNoEvents: '暂无已记录日期的节点',
    shareJourneyFooter: '由 ResearchFlow 在本地根据你的时间线生成',
    shareVisibilityTitle: '显示内容',
    shareVisibilityHelp: '隐藏选择会自动保存，并沿用到下一张分享图。',
    shareFieldTitle: '题目',
    shareFieldJournal: '期刊',
    shareFieldAuthor: '第一作者',
    shareFieldStatus: '当前状态',
    shareFieldDuration: '历程天数',
    shareFieldDates: '节点日期',
    shareFieldFooter: 'ResearchFlow 页脚',
    shareSizeTitle: '图片尺寸',
    shareSizePortrait: '移动竖版 · 自适应 1080 × 980–1350',
    shareSizeStory: '全屏 · 1080 × 1920',
    shareSizeAuto: '自适应长图',
    noEventYet: '暂无事件',
    addEventStart: '添加事件开始跟踪',
    clickAddEvent: '点击此处为此手稿添加时间线事件。',
    clickEditEvent: '点击编辑此事件。',
    settingsTitle: '多云设置',
    settingsSubtitle: '精准控制私有数据的分发与存储位置。',
    settingsKicker: '工作区控制中心',
    settingsTrustSummary: '数据保护摘要',
    settingsLocalFirst: '数据库本地保存',
    settingsDeviceSecrets: '凭据仅限本设备',
    settingsPreferencesAutosave: '云同步按需开启',
    settingsSecurityEyebrow: '架构级隐私保护',
    settingsSecurityTitle: '研究数据默认仅保存在当前设备。',
    settingsSecurityHelp: '只有在你主动选择并配置云服务后才会同步；密码与令牌不会进入数据库文件、导出备份或云端同步载荷。',
    settingsRoutingEyebrow: '数据去向',
    settingsRoutePrivacy: '密码与令牌只保存在当前设备。',
    settingsLocalEyebrow: '当前存储方式',
    settingsLocalTitle: '仅使用本地缓存',
    settingsLocalHelp: '研究数据保存在当前 Chrome 配置文件中，直到你导出备份或选择云端同步。',
    settingsLocalPointAccount: '无需注册同步账号',
    settingsLocalPointSync: '云端手动同步已关闭',
    settingsLocalPointBackup: '仍可随时导出 JSON',
    settingsProviderEyebrow: '服务凭据',
    settingsWebdavHelp: '连接私有 WebDAV 文件夹，用于保存数据库 JSON。',
    settingsCredentialNote: '凭据不会进入导出文件或远程同步数据库。',
    settingsGithubHelp: '将数据库 JSON 保存到私有仓库的指定分支。',
    settingsGithubCredentialNote: '建议使用仅限目标仓库且具有 Contents 权限的令牌。',
    settingsLanguageEyebrow: '界面',
    settingsAssistEyebrow: '浏览器智能识别',
    settingsBackupEyebrow: '数据韧性',
    settingsBackupNote: '每次有效导入前都会保留一个可恢复快照。',
    languageCardTitle: '界面偏好',
    languageLabel: '显示语言',
    languageHelp: '设置整个工作区使用的语言与外观模式。',
    languageAutoSaved: '界面偏好修改后会自动保存。',
    appearanceLabel: '外观模式',
    appearanceSystem: '跟随系统',
    appearanceLight: '浅色',
    appearanceDark: '深色',
    appearanceSaved: '外观偏好已保存。',
    autoCloudSyncLabel: '自动云同步',
    autoCloudSyncHelp: '本地修改保存后，自动同步到已配置完成的云端。',
    autoCloudSyncLocalHelp: '选择 WebDAV 或 GitHub 后可启用自动云同步。',
    submissionAssistTitle: '投稿网站智能识别',
    submissionAssistHelp: '识别到支持的期刊投稿系统时，在网页内显示快捷录入卡片。',
    submissionAssistToggle: '自动识别投稿网站',
    submissionAssistToggleHelp: '无需弹窗或侧边栏，直接识别投稿系统。',
    submissionAssistCaptureToggle: '自动捕获投稿信息',
    submissionAssistCaptureHelp: '采集稿件与流程字段供人工核对；不会读取密码、邮箱和上传文件。',
    submissionAssistEnabled: '已启用',
    submissionAssistDisabled: '已关闭',
    submissionAssistScopeHelp: '仅在支持的投稿系统域名中运行识别。',
    submissionAssistReset: '恢复已忽略的网站',
    submissionAssistNoneIgnored: '当前没有忽略的网站。',
    submissionAssistIgnoredCount: '已忽略 {count} 个网站。',
    submissionAssistSaved: '投稿网站识别设置已更新。',
    submissionAssistResetToast: '已恢复所有被忽略的投稿网站。',
    detectedSubmissionPrefilled: '已从 {platform} 捕获信息，请逐项核对后再新建项目。',
    captureReviewTitle: '核对捕获的投稿信息',
    captureReviewHelp: '当前尚未保存。请人工核对识别字段，确认后再创建相互关联的项目、稿件和投稿记录。',
    captureConfidence: '识别置信度',
    captureFieldsDetected: '已识别 {count} 项信息',
    captureProjectTitle: '新建项目名称',
    captureProjectPlaceholder: '例如：Nano Letters 投稿—界面极化研究',
    manuscriptIdLabel: '稿件 / 投稿编号',
    capturedStatusLabel: '识别到的流程状态',
    firstAuthorLabel: '第一作者',
    firstAuthorHelp: '将在仪表盘条目中显示，并同步保存到关联稿件。',
    firstAuthorPlaceholder: '例如：陈晓明',
    firstAuthorNotSet: '未填写',
    authorsLabel: '作者',
    abstractLabel: '摘要 / 项目说明',
    keywordsLabel: '关键词',
    revisionDueLabel: '修回截止日期',
    confirmCreateProject: '确认并新建项目',
    captureCreatedToast: '已在人工核对后创建项目、稿件和投稿记录。',
    captureExistingOpenedToast: '该投稿已录入，已打开现有记录以避免重复创建。',
    confidenceHigh: '高',
    confidenceMedium: '中',
    confidenceLow: '需重点核对',
    cloudRoutingTitle: '分布式云存储路由',
    webdavTitle: 'WebDAV 凭据',
    githubTitle: 'GitHub 私有仓库同步',
    backupTitle: '数据库备份与导入',
    saveLanguage: '保存语言设置',
    saveMappings: '保存存储映射',
    exportDb: '导出数据库',
    exportDiagnostics: '导出诊断信息',
    importJson: '导入 JSON',
    restoreImportBackup: '恢复导入前备份',
    languageSaved: '语言偏好已保存。',
    databaseExported: '数据库 JSON 已导出！',
    diagnosticsExported: '已导出不含凭据的诊断信息。',
    databaseImported: '数据库 JSON 已成功导入。',
    importBackupRestored: '已恢复到上一次导入操作前的数据库状态。',
    noImportBackup: '当前设备上没有可恢复的导入前备份。',
    restoreImportConfirm: '确定恢复上一次导入前保存的数据库吗？当前未保存的更改将被替换。',
    importFileTooLarge: '所选备份超过 25 MB，未执行读取。',
    invalidBackup: '该文件不是可识别的 ResearchFlow 数据库备份。',
    noUrgentEvents: '暂无紧急审稿或时间线事件。',
    noRecentRecords: '暂无研究动态。',
    noPipelines: '暂无进行中的手稿投稿流水线。',
    eventNameRequired: '事件名称必填。',
    zoteroSync: '导入到 Zotero',
    untitledEvent: '未命名事件',
    untitledManuscript: '未命名手稿',
    untitledProject: '未命名项目',
    targetJournal: '目标期刊',
    typeNoEvent: '无事件',
    eventTypeResearch: '研究',
    eventTypeWriting: '写作',
    eventTypeSubmission: '投稿',
    eventTypeReview: '审稿',
    eventTypeRevision: '修改',
    eventTypePublication: '出版',
    eventTypeSpecial: '特殊',
    statusCompleted: '已完成',
    statusActive: '进行中',
    statusPending: '计划中',
    statusBlocked: '受阻',
    inlineAddTimelineEvent: '添加时间线事件',
    keyEventPreset: '关键事件',
    customEvent: '自定义事件',
    eventNotesShort: '备注',
    cancel: '取消',
    eventPlaceholder: '事件，如 收到 R1 审稿意见',
    noDate: '无日期',
    days: '天',
    dayUnitShort: '天',
    relativeToday: '今天',
    relativeDaysAgo: '{count} 天前',
    relativeInDays: '{count} 天后',
    nodesSaved: '已保存 {count} 个节点',
    expSubmitShort: '实验→投稿',
    keyEventRail: '关键事件轨',
    countingNow: '计时中',
    completedInterval: '已完成区间',
    displayPrepareLabel: '实验 → 投稿',
    displayPrepareCaption: '当前重点：完成投稿前周期。',
    displayAcceptedLabel: '投稿 → 接收',
    displayAcceptedCaption: '已接收手稿显示从投稿到接收的总时长。',
    displayR1Label: 'R1 审稿意见 → 今天',
    displayR1Caption: 'R1 意见已返回；活动窗口现在从第一次决定开始算起。',
    displayReviewLabel: '投稿 → 今天',
    displayReviewCaption: '尚未接收；继续计算投稿后的等待时长。',
    milestoneExperimentDone: '实验完成',
    milestoneSubmission: '投稿',
    milestoneAcceptance: '接收',
    milestoneR1Comments: 'R1 意见',
    milestoneToday: '今天',
    statePreparing: '准备中',
    stateOnline: '在线',
    stateAccepted: '已接收',
    stateAfterR1: 'R1 之后',
    stateUnderReview: '审稿中',
    stateSubmitted: '已投稿',
    stateNotSubmitted: '未投稿',
    stateSinceR1: '距 R1 {count} 天',
    stateSinceSubmit: '距投稿 {count} 天',
    defaultExperimentsCompleted: '实验完成',
    defaultDataOrganization: '数据整理',
    defaultDraftCompleted: '初稿完成',
    defaultManuscriptSubmitted: '手稿已投稿',
    defaultReviewCommentsR1: 'R1 审稿意见',
    defaultR1RevisionSubmitted: 'R1 修改稿已提交',
    defaultReviewCommentsR2: 'R2 审稿意见',
    defaultR2RevisionSubmitted: 'R2 修改稿已提交',
    defaultAccepted: '已接收',
    defaultOnlinePublication: '网络见刊',
    defaultProof: '校样',
    editTimelineEvent: '编辑时间线事件',
    close: '关闭',
    eventName: '事件名称',
    type: '类型',
    status: '状态',
    keyEventMapping: '关键事件映射',
    eventDate: '事件日期',
    eventDateHelp: '时间线事件仅需一个日期：事件发生日。截止日期在投稿编辑器中管理。',
    plannedDate: '计划日期',
    initialSubmissionDate: '首次投稿日期',
    deadlineDate: '截止日期',
    completionDate: '完成日期',
    firstDecisionDate: '首次决定 / R1 日期',
    revisionDueDateLabel: '修改截止日期',
    timelineDateSource: '日期来源',
    doiLabel: 'DOI',
    articlePage: '文章页面',
    doiNotSet: '未设置 DOI',
    trackSubmissionTitle: '跟踪期刊投稿',
    manuscriptPaper: '手稿 / 论文',
    targetJournalInput: '目标期刊',
    articleUrlLabel: '文章 / 期刊 URL',
    articleUrlPlaceholder: 'https://doi.org/10.xxxx/xxxxx',
    trackSubmissionButton: '跟踪投稿',
    manuscriptJournalRequired: '手稿和目标期刊为必填项',
    submissionAddedToast: '新投稿已添加到流水线！',
    dateSourceSubmission: '投稿记录',
    dateSourceTimeline: '时间线节点',
    dateSourceMissing: '未设置',
    planToday: '计划为今天',
    setToday: '设为今天',
    due14: '截止 +14天',
    markActive: '标记为进行中',
    markDoneToday: '今天标记完成',
    clearDates: '清除日期',
    clearDate: '清除日期',
    notes: '备注',
    notesPlaceholder: '决定细节、审稿截止日、系统备注或下一步...',
    delete: '删除',
    saveChanges: '保存更改',
    keyAuto: '自动识别',
    keyExperimentsDone: '关键：实验完成',
    keyDraftDone: '关键：初稿完成',
    keySubmitted: '关键：已投稿',
    keyR1Comments: '关键：R1 意见',
    keyR1Resubmitted: '关键：R1 已重投',
    keyR2Comments: '关键：R2 意见',
    keyR2Resubmitted: '关键：R2 已重投',
    keyAccepted: '关键：已接收',
    keyOnlinePublished: '关键：网络见刊',
    statusPlannedNotStarted: '计划中 / 未开始',
    statusInProgress: '进行中',
    statusBlockedException: '受阻 / 异常',
    statusOverdue: '已逾期',
    statusDueSoon: '即将到期',
    statusUpcoming: '未来计划',
    specialException: '特殊 / 异常',
    manuscriptNotFound: '未找到手稿记录，正在刷新工作区。',
    manuscriptStatusUpdated: '手稿状态已更新。',
    manuscriptStatusUpdatedTo: '手稿状态已更新为“{status}”。',
    submissionNotFound: '未找到投稿记录。正在刷新仪表盘。',
    eventNotFound: '未找到事件。正在刷新仪表盘。',
    eventAddedToast: '已添加事件“{name}”。',
    eventSavedToast: '已保存事件“{name}”。',
    eventRemovedToast: '已从流水线移除事件',
    confirmDeleteEvent: '确定要删除事件“{name}”吗？',
    confirmUpdateEvent: '此关键事件已存在。是否更新“{name}”而非重复添加？',
    statusRejected: '已拒稿',
    markRejected: '标记为拒稿',
    transferToJournal: '转投新期刊',
    transferSubmissionTitle: '拒稿：转投其他期刊',
    newTargetJournal: '新目标期刊',
    rejectionDate: '拒稿日期',
    rejectionNote: '决定备注',
    transferButton: '创建新投稿',
    rejectedToast: '已标记为拒稿。',
    transferToast: '新的目标期刊投稿已创建。',
    manuscriptsTitle: '手稿看板',
    manuscriptsSubtitle: '跟踪从提纲、写作到投稿和同行评审的全过程。',
    addManuscript: '+ 新建手稿',
    kanbanIdea: '想法与提纲',
    kanbanDrafting: '写作与图件',
    kanbanSubmitted: '已投稿',
    kanbanAccepted: '已接收 / 已发表',
    submissionsPageTitle: '投稿与同行评审矩阵',
    submissionsPageSubtitle: '集中管理审稿回复矩阵和投稿清单。',
    activeSubmissionsTitle: '进行中的投稿',
    activeSubmissionsHelp: '选择条目或编辑按钮；右侧会在工作流上下文下方打开编辑区。',
    submissionEmptyDetail: '选择一个投稿；编辑区会在工作流上下文下方打开。',
    journalPortalsTitle: '期刊入口',
    journalPortalsHelp: '打开已保存入口，或添加新的投稿系统。',
    trackNewSubmissionButton: '+ 跟踪新投稿',
    submissionDetailKicker: '期刊投稿',
    currentStageLabel: '当前阶段',
    trackedSinceLabel: '跟踪始于',
    workflowContextTitle: '工作流上下文',
    workflowNeedsLinking: '需要关联',
    linkManuscript: '关联手稿',
    linkSubmissionTitle: '将投稿关联到手稿',
    linkSubmissionHelp: '请选择此投稿记录所属的手稿。',
    linkSubmissionConfirm: '确认关联',
    linkSubmissionSaved: '投稿已关联到所选手稿。',
    noManuscriptsToLink: '暂无可关联手稿，请先新建手稿。',
    workflowLinkedFlow: '已关联流程',
    workflowManuscriptLabel: '手稿',
    workflowTimelineLabel: '时间线',
    workflowReviewerCommentsLabel: '审稿意见',
    relationshipSummaryLine: '“{manuscript}”：{timeline} 个时间线事件，{comments} 条审稿意见。',
    editableSummary: '可编辑摘要',
    editFields: '编辑字段',
    jumpToEditor: '前往编辑器',
    submissionEntryEditorTitle: '投稿记录编辑器',
    submissionEntryEditorHelp: '在此编辑选中的条目，填写内容会自动保存。',
    linkedManuscriptBadge: '已关联手稿',
    detachedSubmissionBadge: '未关联手稿',
    manuscriptSection: '手稿',
    manuscriptTitleLabel: '手稿题目',
    paperTitlePlaceholder: '论文题目',
    submissionPortalUrl: '投稿入口 URL',
    reviewTimingSection: '审稿时间线',
    publicationSection: '出版信息',
    submissionChecklistSection: '投稿清单',
    peerReviewMatrixSection: '同行评审回复矩阵',
    addComment: '添加审稿意见',
    reviewEditorHelp: '审稿意见和作者回复会在填写时自动保存。',
    autoSavePending: '等待保存',
    autoSaveSaving: '正在保存更改…',
    autoSaveSaved: '所有更改均已自动保存',
    autoSaveInvalid: '请检查当前填写内容',
    autoSaveFailed: '自动保存失败，当前填写内容仍保留在表单中。',
    acceptanceCelebrationEyebrow: '重要里程碑达成',
    acceptanceCelebrationTitle: '文章已接收，恭喜！',
    acceptanceCelebrationBody: '《{title}》跨过了一个重要的科研里程碑。',
    transferRoundHelp: '一步关闭当前轮次并创建下一个目标期刊记录。',
    savedReviewPreviewTitle: '已保存审稿预览',
    savedReviewPreviewHelp: '与投稿记录编辑器自动同步的只读快照。',
    exportTable: '导出表格',
    emptyReviewEditor: '暂未记录审稿意见；在此添加后将自动保存。',
    emptyReviewPreview: '暂无已保存的审稿意见。',
    reviewerCommentLabel: '审稿意见 #{count}',
    reviewerCommentPlaceholder: '粘贴审稿意见...',
    authorResponseLabel: '作者回复',
    authorResponsePlaceholder: '撰写你的专业回复...',
    copy: '复制',
    removeComment: '删除意见',
    checklistLabel: '清单',
    responsesLabel: '回复',
    responseSaved: '回复已保存',
    responsePending: '等待回复',
    noCommentText: '暂未保存意见文本。',
    submissionEditsSaved: '投稿编辑已保存。',
    confirmDeleteSubmission: '确定删除此投稿跟踪？',
    confirmMarkRejected: '确定将此投稿标记为拒稿？',
    deleteSubmissionTitle: '删除投稿跟踪',
    noReviewerCommentsExport: '暂无审稿意见可导出。',
    latexDownloaded: 'LaTeX 模板已下载。',
    currentJournalLabel: '当前期刊',
    transferModalHelp: '这会将当前投稿标记为拒稿，并为下一个期刊创建新的进行中投稿。',
    validPortalUrlOrBlank: '请输入有效的期刊入口 URL，或保持为空。',
    newManuscriptTitleLabel: '新手稿题目',
    createNewManuscriptOption: '+ 创建新手稿...',
    targetJournalPlaceholder: '例如：Advanced Functional Materials',
    rejectionNotePlaceholder: '可选的主编决定、范围不符说明、审稿总结或下一步操作备注...',
    editManuscriptMetadata: '编辑手稿元数据',
    addNewManuscriptTitle: '添加新手稿',
    writingStatus: '写作状态',
    statusIdea: '想法',
    statusOutline: '提纲',
    statusFiguresPrep: '图件准备',
    statusDrafting: '写作中',
    statusInternalReview: '内部评审',
    abstractDraft: '摘要草稿',
    abstractPlaceholder: '撰写手稿摘要草稿...',
    createManuscript: '创建手稿',
    academicCapturePrefilled: '已捕获学术搜索结果，请核对信息后创建手稿。',
    scholarSourcePage: '学术结果 / 文章链接',
    manuscriptTitleRequired: '请填写手稿题目后再继续。',
    academicCaptureChooseTitle: '选择要录入的学术结果',
    academicCaptureChooseHelp: '请选择你要捕获的论文；在核对表单并确认前不会写入数据库。',
    academicCaptureSource: '捕获来源',
    academicCaptureConfidence: '识别置信度',
    academicCaptureDetected: '条结果已识别',
    academicDuplicateConfirm: '检测到相同手稿。是否用当前核对后的信息更新已有记录，避免重复创建？',
    academicDuplicateUpdated: '已更新现有手稿，未创建重复条目。',
    academicCaptureSaved: 'Scholar 手稿已核对并保存。',
    storageRoutingHelp: '选择 ResearchFlow 元数据数据库的存储与同步位置。',
    routeDbLabel: '数据库 JSON 同步位置',
    optionLocalCache: '无（仅使用本地缓存）',
    optionWebDavDrive: 'WebDAV 网盘（坚果云、Nextcloud）',
    optionGithubRepo: 'GitHub 私有仓库',
    localSyncSummary: '仅本地模式：数据保存在当前设备，云端手动同步已停用。',
    webdavSyncSummary: 'WebDAV 模式：请在下方配置并测试 WebDAV 账户。',
    githubSyncSummary: 'GitHub 模式：请在下方配置并测试私有仓库。',
    webdavUrlLabel: 'WebDAV 服务器基础 URL',
    usernameEmailLabel: '用户名 / 邮箱',
    appPasswordLabel: '应用专用密码',
    testWebdav: '测试 WebDAV 连接',
    githubPatLabel: 'GitHub Personal Access Token（PAT）',
    githubRepoLabel: '仓库名称（所有者/仓库）',
    githubBranchLabel: '分支名称',
    testGithub: '测试 GitHub 仓库',
    backupHelp: '将研究数据库导出为 JSON，或导入并迁移现有的 ResearchFlow JSON 备份。'
  }
};

function t(key) {
  return I18N[currentLanguage]?.[key] || I18N.en[key] || key;
}

function normalizeThemePreference(value) {
  const normalized = String(value || 'system').trim().toLowerCase();
  return UI_THEME_OPTIONS.has(normalized) ? normalized : 'system';
}

function applyThemePreference(value) {
  const theme = normalizeThemePreference(value);
  if (theme === 'system') {
    delete document.documentElement.dataset.theme;
    document.documentElement.style.colorScheme = 'light dark';
  } else {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }
  return theme;
}

function isDarkThemeActive() {
  const explicitTheme = document.documentElement.dataset.theme;
  if (explicitTheme) return explicitTheme === 'dark';
  return Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches);
}

function tf(key, vars = {}) {
  return t(key).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '');
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeSubmissionStatus(value) {
  const normalized = normalizeText(value).replace(/[\s-]+/g, '_');
  const aliases = {
    accept: 'accepted',
    accepted: 'accepted',
    online: 'published',
    publication: 'published',
    published: 'published',
    underreview: 'under_review',
    in_review: 'under_review',
    review: 'under_review',
    revise: 'revision',
    revision_required: 'revision',
    resubmit: 'revision',
    reject: 'rejected',
    rejected: 'rejected',
    submit: 'submitted'
  };
  const canonical = aliases[normalized] || normalized;
  return ['submitted', 'under_review', 'revision', 'accepted', 'published', 'rejected'].includes(canonical)
    ? canonical
    : 'submitted';
}

function normalizeSubmissionStatuses(database) {
  let changed = false;
  (database?.submissions || []).forEach((submission) => {
    const canonical = normalizeSubmissionStatus(submission.status);
    if (submission.status !== canonical) {
      submission.status = canonical;
      submission.updatedAt = new Date().toISOString();
      changed = true;
    }
  });
  return changed;
}

function normalizeDoi(value) {
  return String(value || '').trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
}

function extractDoiFromText(value) {
  const match = String(value || '').match(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
  return match ? normalizeDoi(match[0].replace(/[.,;)\]]+$/, '')) : '';
}

function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

function setAllText(selector, value) {
  document.querySelectorAll(selector).forEach(el => { el.textContent = value; });
}

function setPlaceholder(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute('placeholder', value);
}

function setTitle(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute('title', value);
}

function setOptionText(selector, value, text) {
  const option = document.querySelector(`${selector} option[value="${value}"]`);
  if (option) option.textContent = text;
}

function setTableHeaderText(selector, index, value) {
  const header = document.querySelectorAll(`${selector} th`)[index];
  if (header) header.textContent = value;
}

function setNavText(selector, value) {
  const el = document.querySelector(selector);
  if (!el) return;
  const icon = el.querySelector('svg');
  el.innerHTML = '';
  if (icon) el.appendChild(icon);
  el.appendChild(document.createTextNode(value));
}

function setButtonText(selector, value) {
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
  setNavText('.nav-item[data-view="view-manuscripts"]', t('manuscriptsNav'));
  setNavText('.nav-item[data-view="view-submissions"]', t('submissionsNav'));
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
  updatePipelineViewToggle();
  setText('#dashboard-filter-label', getDashboardFilterLabel());
  const summaryCards = document.querySelectorAll('.timeline-summary-header .summary-card .label');
  if (summaryCards[0]) summaryCards[0].textContent = t('metricExpSubmit');
  if (summaryCards[1]) summaryCards[1].textContent = t('metricSubmitToday');
  if (summaryCards[2]) summaryCards[2].textContent = t('metricR1Today');
  if (summaryCards[3]) summaryCards[3].textContent = t('metricSubmitAccept');
  const recentHeads = document.querySelectorAll('#view-dashboard .recent-box h3');
  if (recentHeads[0]) recentHeads[0].textContent = t('timelineAlerts');

  setText('#view-manuscripts .view-header h1', t('manuscriptsTitle'));
  setText('#view-manuscripts .view-header .text-muted', t('manuscriptsSubtitle'));
  setButtonText('#btn-add-manuscript', t('addManuscript'));
  setText('.kanban-col[data-status="idea"] .col-header h3', `💡 ${t('kanbanIdea')}`);
  setText('.kanban-col[data-status="drafting"] .col-header h3', `📝 ${t('kanbanDrafting')}`);
  setText('.kanban-col[data-status="submitted"] .col-header h3', `🚀 ${t('kanbanSubmitted')}`);
  setText('.kanban-col[data-status="accepted"] .col-header h3', `🎉 ${t('kanbanAccepted')}`);

  setText('#view-submissions .view-header h1', t('submissionsPageTitle'));
  setText('#view-submissions .view-header .text-muted', t('submissionsPageSubtitle'));
  setText('.portal-dock-title', t('journalPortalsTitle'));
  setText('#portal-dock-help', t('journalPortalsHelp'));
  setTitle('#btn-add-portal', t('addPortalTitle'));
  setButtonText('#btn-add-submission', t('trackNewSubmissionButton'));
  setText('.submission-list-head h3', t('activeSubmissionsTitle'));
  setText('.submission-list-head .text-muted', t('activeSubmissionsHelp'));
  setText('#submission-detail-panel .empty-state h3', t('submissionEmptyDetail'));

  setText('#view-settings .view-header h1', t('settingsTitle'));
  setText('#view-settings .view-header .text-muted', t('settingsSubtitle'));
  setText('#settings-kicker', t('settingsKicker'));
  document.querySelector('.settings-trust-strip')?.setAttribute('aria-label', t('settingsTrustSummary'));
  setText('#settings-local-first-label', t('settingsLocalFirst'));
  setText('#settings-device-secret-label', t('settingsDeviceSecrets'));
  setText('#settings-autosave-label', t('settingsPreferencesAutosave'));
  setText('#settings-security-eyebrow', t('settingsSecurityEyebrow'));
  setText('#settings-security-title', t('settingsSecurityTitle'));
  setText('#settings-security-help', t('settingsSecurityHelp'));
  setText('#settings-routing-eyebrow', t('settingsRoutingEyebrow'));
  setText('#settings-route-privacy-note', t('settingsRoutePrivacy'));
  setText('#settings-local-eyebrow', t('settingsLocalEyebrow'));
  setText('#settings-local-title', t('settingsLocalTitle'));
  setText('#settings-local-help', t('settingsLocalHelp'));
  setText('#settings-local-point-account', t('settingsLocalPointAccount'));
  setText('#settings-local-point-sync', t('settingsLocalPointSync'));
  setText('#settings-local-point-backup', t('settingsLocalPointBackup'));
  setText('#settings-webdav-eyebrow', t('settingsProviderEyebrow'));
  setText('#settings-webdav-help', t('settingsWebdavHelp'));
  setText('#settings-credential-note', t('settingsCredentialNote'));
  setText('#settings-github-eyebrow', t('settingsProviderEyebrow'));
  setText('#settings-github-help', t('settingsGithubHelp'));
  setText('#settings-github-credential-note', t('settingsGithubCredentialNote'));
  setText('#settings-language-eyebrow', t('settingsLanguageEyebrow'));
  setText('#settings-assist-eyebrow', t('settingsAssistEyebrow'));
  setText('#settings-backup-eyebrow', t('settingsBackupEyebrow'));
  setText('#settings-backup-note', t('settingsBackupNote'));
  setText('#settings-language-card h3', t('languageCardTitle'));
  setText('label[for="ui-language"]', t('languageLabel'));
  setText('label[for="ui-theme"]', t('appearanceLabel'));
  setOptionText('#ui-theme', 'system', t('appearanceSystem'));
  setOptionText('#ui-theme', 'light', t('appearanceLight'));
  setOptionText('#ui-theme', 'dark', t('appearanceDark'));
  setText('#language-help', t('languageHelp'));
  setText('#language-auto-save-status', t('languageAutoSaved'));
  setText('#auto-cloud-sync-label', t('autoCloudSyncLabel'));
  setText('#settings-submission-assist-card h3', t('submissionAssistTitle'));
  setText('#submission-assist-help', t('submissionAssistHelp'));
  setText('#submission-assist-toggle-label', t('submissionAssistToggle'));
  setText('#submission-assist-toggle-help', t('submissionAssistToggleHelp'));
  setText('#submission-assist-capture-label', t('submissionAssistCaptureToggle'));
  setText('#submission-assist-capture-help', t('submissionAssistCaptureHelp'));
  setText('#submission-assist-scope-help', t('submissionAssistScopeHelp'));
  setButtonText('#btn-reset-submission-assist', t('submissionAssistReset'));
  setText('#settings-cloud-card h3', t('cloudRoutingTitle'));
  setText('#settings-webdav-card h3', t('webdavTitle'));
  setText('#settings-github-card h3', t('githubTitle'));
  setText('#settings-backup-card h3', t('backupTitle'));
  setText('#settings-cloud-card .text-muted', t('storageRoutingHelp'));
  setText('label[for="route-db"]', t('routeDbLabel'));
  setOptionText('#route-db', 'local', t('optionLocalCache'));
  setOptionText('#route-db', 'webdav', t('optionWebDavDrive'));
  setOptionText('#route-db', 'github', t('optionGithubRepo'));
  setButtonText('#btn-save-settings', t('saveMappings'));
  setText('label[for="webdav-url"]', t('webdavUrlLabel'));
  setText('label[for="webdav-username"]', t('usernameEmailLabel'));
  setText('label[for="webdav-password"]', t('appPasswordLabel'));
  setButtonText('#btn-test-webdav', t('testWebdav'));
  setText('label[for="github-token"]', t('githubPatLabel'));
  setText('label[for="github-repo"]', t('githubRepoLabel'));
  setText('label[for="github-branch"]', t('githubBranchLabel'));
  setButtonText('#btn-test-github', t('testGithub'));
  setText('#settings-backup-card .text-muted', t('backupHelp'));
  setButtonText('#btn-export-db', t('exportDb'));
  setButtonText('#btn-export-diagnostics', t('exportDiagnostics'));
  setButtonText('#btn-trigger-import', t('importJson'));
  setButtonText('#btn-restore-import-backup', t('restoreImportBackup'));
  updateSyncProviderVisibility();
}

function refreshActiveViewForLanguage() {
  const activeViewId = document.querySelector('.content-view.active')?.id || 'view-dashboard';
  if (activeViewId === 'view-dashboard') renderDashboard();
  if (activeViewId === 'view-manuscripts') renderKanban();
  if (activeViewId === 'view-submissions') renderSubmissions();
  if (activeViewId === 'view-settings') loadSettings().catch(console.error);
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
      const mainContent = document.querySelector('.main-content');
      if (mainContent) mainContent.scrollTop = 0;

      // Trigger tab-specific loaders
      if (targetView === 'view-dashboard') renderDashboard();
      if (targetView === 'view-manuscripts') renderKanban();
      if (targetView === 'view-submissions') renderSubmissions();
      if (targetView === 'view-settings') loadSettings().catch(console.error);
    });
  });

  // Load Database
  db = await window.storage.loadAll();
  applyThemePreference(db.settings?.profile?.theme || 'system');
  currentLanguage = db.settings?.profile?.language || 'en';
  document.documentElement.lang = currentLanguage === 'zh' ? 'zh-CN' : 'en';

  // Dynamic Database Migration: Translate Chinese nodes to English & filter out '手稿定稿'
  let dbMigrationChanged = false;
  if (db && db.submissions) {
    dbMigrationChanged = normalizeSubmissionStatuses(db) || dbMigrationChanged;
    db.submissions.forEach(sub => {
      if (sub.timelineNodes && sub.timelineNodes.length > 0) {
        const originalLength = sub.timelineNodes.length;
        // Filter out '手稿定稿'
        sub.timelineNodes = sub.timelineNodes.filter(node => {
          const nameTrimmed = (node.name || '').trim();
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
          const nameTrimmed = (node.name || '').trim();
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

    dbMigrationChanged = clearUnacceptedPublicationLinks(db) || dbMigrationChanged;
    dbMigrationChanged = syncManuscriptStatusesFromSubmissions(db) || dbMigrationChanged;

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
        let updateChanged = normalizeSubmissionStatuses(db);
        db.submissions.forEach(sub => {
          if (sub.timelineNodes && sub.timelineNodes.length > 0) {
            const origLen = sub.timelineNodes.length;
            sub.timelineNodes = sub.timelineNodes.filter(node => {
              const nameTrimmed = (node.name || '').trim();
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
              const nameTrimmed = (node.name || '').trim();
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

      if (clearUnacceptedPublicationLinks(db)) {
        window.storage.saveAll(db).catch(console.error);
      }
      if (syncManuscriptStatusesFromSubmissions(db)) {
        window.storage.saveAll(db).catch(console.error);
      }

      updateSyncStatus('success', 'Synced');

      // Reload active view
      const activeNav = document.querySelector('.nav-item.active');
      if (activeNav) {
        const viewId = activeNav.getAttribute('data-view');
        if (viewId === 'view-dashboard') renderDashboard();
        if (viewId === 'view-manuscripts') renderKanban();
        if (viewId === 'view-submissions') renderSubmissions();
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
  const requestedMode = new URL(window.location.href).searchParams.get('mode');
  if (requestedMode === 'academic-capture') {
    await consumePendingAcademicDraft();
  } else {
    await consumePendingSubmissionDraft();
  }

  // Pipeline View Toggle and Drawer Event Listeners
  initializePipelineViewMode();
  const btnToggle = document.getElementById('btn-pipeline-view-toggle');
  if (btnToggle) {
    btnToggle.addEventListener('click', () => {
      setPipelineViewMode(!isPipelineExpanded);
    });
  }

});

function initializePipelineViewMode() {
  chrome.storage.local.get(['researchflow_pipeline_expanded'], (result) => {
    setPipelineViewMode(Boolean(result.researchflow_pipeline_expanded), { persist: false });
  });
}

function setPipelineViewMode(expanded, options = {}) {
  isPipelineExpanded = Boolean(expanded);
  const container = document.getElementById('dashboard-gantt');
  if (container) container.classList.toggle('expanded', isPipelineExpanded);
  updatePipelineViewToggle();
  if (options.persist !== false) {
    chrome.storage.local.set({ researchflow_pipeline_expanded: isPipelineExpanded });
  }
}

function updatePipelineViewToggle() {
  const container = document.getElementById('dashboard-gantt');
  if (container) container.classList.toggle('expanded', isPipelineExpanded);

  const label = document.getElementById('pipeline-view-label');
  if (label) label.textContent = isPipelineExpanded ? t('expanded') : t('compact');

  const icon = document.getElementById('pipeline-view-icon');
  if (icon) icon.textContent = isPipelineExpanded ? '▦' : '▤';

  const button = document.getElementById('btn-pipeline-view-toggle');
  if (button) {
    button.classList.toggle('active', isPipelineExpanded);
    button.setAttribute('aria-pressed', String(isPipelineExpanded));
  }
}

function buildDefaultSubmissionTimeline(submission) {
  const stamp = Date.now();
  const definitions = [
    ['Experiments Completed', 'research', 'completed'],
    ['Data Organization', 'research', 'completed'],
    ['Draft Completed', 'writing', 'completed'],
    ['Manuscript Submitted', 'submission', 'active'],
    ['Review Comments R1', 'review', 'pending'],
    ['R1 Revision Submitted', 'revision', 'pending'],
    ['Accepted', 'publication', 'pending'],
    ['Online Publication', 'publication', 'pending']
  ];
  return definitions.map(([name, type, status], index) => ({
    id: `node_${index + 1}_${submission.id}_${stamp}`,
    name,
    type,
    planDate: '',
    completeDate: '',
    dueDate: '',
    status,
    notes: ''
  }));
}

function roundedRectPath(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, Math.min(radius, width / 2, height / 2));
}

function canvasTextLines(ctx, text, maxWidth) {
  const value = String(text || '').trim();
  if (!value) return [];
  const lines = [];
  let line = '';
  const hasWordSpaces = /\s/.test(value);
  const tokens = hasWordSpaces ? value.split(/\s+/) : Array.from(value);
  tokens.forEach((token) => {
    const next = `${line}${hasWordSpaces && line ? ' ' : ''}${token}`;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line.trim());
      line = token;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line.trim());
  return lines;
}

function drawWrappedCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines = Infinity) {
  let lines = canvasTextLines(ctx, text, maxWidth);
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    let finalLine = lines[maxLines - 1];
    while (finalLine && ctx.measureText(`${finalLine}…`).width > maxWidth) finalLine = finalLine.slice(0, -1);
    lines[maxLines - 1] = `${finalLine}…`;
  }
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return lines.length;
}

function drawEllipsizedCanvasText(ctx, text, x, y, maxWidth) {
  const value = String(text || '').trim();
  if (!value || maxWidth <= 0) return '';
  if (ctx.measureText(value).width <= maxWidth) {
    ctx.fillText(value, x, y);
    return value;
  }
  let clipped = value;
  const ellipsis = String.fromCharCode(8230);
  while (clipped && ctx.measureText(clipped + ellipsis).width > maxWidth) clipped = clipped.slice(0, -1);
  const result = clipped + ellipsis;
  ctx.fillText(result, x, y);
  return result;
}

function formatShareDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return new Intl.DateTimeFormat(currentLanguage === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric', month: 'short', day: '2-digit'
  }).format(date);
}

function getSubmissionShareEvents(submission) {
  return autoSortNodes(submission.timelineNodes || [])
    .map(node => ({
      name: getTimelineNodeDisplayName(node),
      date: getNodeDate(node),
      type: node.type || 'special',
      status: computeNodeStatus(node)
    }))
    .filter(event => event.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function normalizeShareVisibility(value = {}) {
  const size = ['portrait', 'story', 'auto'].includes(value.size) ? value.size : 'portrait';
  return {
    title: value.title !== false,
    journal: value.journal !== false,
    author: value.author !== false,
    status: value.status !== false,
    duration: value.duration !== false,
    dates: value.dates !== false,
    footer: value.footer !== false,
    size
  };
}
function createSubmissionShareCanvas(submission, visibility = {}) {
  const visible = normalizeShareVisibility(visibility);
  const manuscript = db?.manuscripts?.find(item => item.id === submission.manuscriptId);
  const title = manuscript?.title || submission.title || t('untitledManuscript');
  const journal = getSubmissionJournalName(submission);
  const firstAuthor = getSubmissionFirstAuthor(submission, manuscript);
  const analysis = analyzeSubmission(submission);
  const events = getSubmissionShareEvents(submission);
  const totalNodesCount = (submission.timelineNodes || []).length || events.length || 1;
  const isZh = (typeof currentLanguage !== 'undefined' && currentLanguage === 'zh');

  const canvasWidth = 1080;
  const portraitContentHeight = 640
    + events.length * 76
    + (visible.title ? 150 : 0)
    + (visible.journal ? 48 : 0)
    + (visible.author ? 34 : 0)
    + (visible.status || visible.duration ? 120 : 0);
  const canvasHeight = visible.size === 'story'
    ? 1920
    : (visible.size === 'auto'
      ? Math.max(1080, Math.round(720 + events.length * 96))
      : Math.min(1350, Math.max(980, portraitContentHeight)));
  const width = canvasWidth;
  const height = canvasHeight;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable');

  // Crisp text rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const ink = '#0f172a';
  const inkSecondary = '#334155';
  const canvasBg = '#f3f7fc';
  const muted = '#64748b';
  const subtle = '#94a3b8';
  const paper = '#ffffff';
  const accent = analysis.accepted ? '#059669' : '#2563eb';
  const font = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", "Segoe UI", -apple-system, sans-serif';
  const displayFont = font;
  const shareTypeColors = {
    research: { main: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: isZh ? '研究' : 'Research' },
    writing: { main: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', label: isZh ? '写作' : 'Writing' },
    submission: { main: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', label: isZh ? '投稿' : 'Submission' },
    review: { main: '#d97706', bg: '#fffbeb', border: '#fde68a', label: isZh ? '审稿' : 'Review' },
    revision: { main: '#ea580c', bg: '#fff7ed', border: '#fed7aa', label: isZh ? '修回' : 'Revision' },
    publication: { main: '#059669', bg: '#ecfdf5', border: '#a7f3d0', label: isZh ? '出版' : 'Publication' },
    special: { main: '#64748b', bg: '#f8fafc', border: '#e2e8f0', label: isZh ? '节点' : 'Milestone' }
  };

  // 1. Outer Canvas Background
  const canvasGradient = ctx.createLinearGradient(0, 0, width, height);
  canvasGradient.addColorStop(0, '#ffffff');
  canvasGradient.addColorStop(0.3, '#f8fafd');
  canvasGradient.addColorStop(1, canvasBg);
  ctx.fillStyle = canvasGradient;
  ctx.fillRect(0, 0, width, height);

  // 2. Poster Container Card (Padded & Floating)
  const cardX = 36;
  const cardY = 32;
  const cardW = width - 72; // 1008
  const cardH = height - 64;
  const innerX = 72;
  const innerW = width - 144; // 936
  const innerRight = innerX + innerW; // 1008

  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 12;
  roundedRectPath(ctx, cardX, cardY, cardW, cardH, 22);
  ctx.fillStyle = paper;
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Top Accent Gradient Bar on Card
  ctx.save();
  roundedRectPath(ctx, cardX, cardY, cardW, cardH, 22);
  ctx.clip();
  const signalGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
  signalGradient.addColorStop(0, '#2563eb');
  signalGradient.addColorStop(0.5, '#06b6d4');
  signalGradient.addColorStop(1, '#10b981');
  ctx.fillStyle = signalGradient;
  ctx.fillRect(cardX, cardY, cardW, 5);
  ctx.restore();

  // 3. Top Header: RF / 01 Badge + Date
  const headerY = cardY + 24;
  roundedRectPath(ctx, innerX, headerY, 80, 26, 6);
  ctx.fillStyle = 'rgba(37, 99, 235, 0.08)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(37, 99, 235, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#2563eb';
  ctx.font = `800 12px ${font}`;
  ctx.textAlign = 'center';
  ctx.fillText('RF / 01', innerX + 40, headerY + 18);
  ctx.textAlign = 'left';

  ctx.textAlign = 'right';
  ctx.fillStyle = muted;
  ctx.font = `700 14px ${font}`;
  ctx.fillText(formatShareDate(new Date()), innerRight, headerY + 18);
  ctx.textAlign = 'left';

  let cursorY = headerY + 40;

  // 4. Hero Section: Journal & Title
  const showJournal = visible.journal && journal;
  const showTitle = visible.title;
  const showAuthor = visible.author && firstAuthor;

  if (showJournal || showTitle || showAuthor) {
    if (showJournal && !showTitle) {
      // Compact sleek Journal & Status Hero Banner
      const heroCardH = 92;
      roundedRectPath(ctx, innerX, cursorY, innerW, heroCardH, 14);
      const journalBg = ctx.createLinearGradient(innerX, cursorY, innerRight, cursorY + heroCardH);
      journalBg.addColorStop(0, '#0c192e');
      journalBg.addColorStop(0.55, '#162a45');
      journalBg.addColorStop(1, '#1e3a8a');
      ctx.fillStyle = journalBg;
      ctx.fill();

      // Glowing left accent
      ctx.fillStyle = '#2dd4bf';
      ctx.beginPath();
      ctx.roundRect(innerX, cursorY, 6, heroCardH, [14, 0, 0, 14]);
      ctx.fill();

      // Left info
      ctx.fillStyle = 'rgba(186, 230, 253, 0.9)';
      ctx.font = `800 12px ${font}`;
      ctx.fillText(t('shareJournalLabel'), innerX + 24, cursorY + 28);

      ctx.fillStyle = '#ffffff';
      ctx.font = `800 30px ${displayFont}`;
      drawEllipsizedCanvasText(ctx, journal, innerX + 24, cursorY + 64, innerW - 240);

      // Right status pill in hero
      const statusLabel = getSubmissionStatusLabel(submission.status);
      ctx.font = `700 13px ${font}`;
      const stW = ctx.measureText(statusLabel).width + 36;
      const stX = innerRight - stW - 20;

      roundedRectPath(ctx, stX, cursorY + 26, stW, 36, 18);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(stX + 16, cursorY + 44, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(statusLabel, stX + 26, cursorY + 49);

      cursorY += heroCardH + 18;
    } else {
      // Full Hero with Title
      if (showJournal) {
        const journalCardH = 84;
        roundedRectPath(ctx, innerX, cursorY, innerW, journalCardH, 12);
        const journalBg = ctx.createLinearGradient(innerX, cursorY, innerRight, cursorY + journalCardH);
        journalBg.addColorStop(0, '#0c192e');
        journalBg.addColorStop(1, '#1e3a8a');
        ctx.fillStyle = journalBg;
        ctx.fill();

        ctx.fillStyle = '#2dd4bf';
        ctx.beginPath();
        ctx.roundRect(innerX, cursorY, 5, journalCardH, [12, 0, 0, 12]);
        ctx.fill();

        ctx.fillStyle = 'rgba(186, 230, 253, 0.85)';
        ctx.font = `800 12px ${font}`;
        ctx.fillText(t('shareJournalLabel'), innerX + 22, cursorY + 25);

        ctx.fillStyle = '#ffffff';
        ctx.font = `800 30px ${displayFont}`;
        drawEllipsizedCanvasText(ctx, journal, innerX + 22, cursorY + 58, innerW - 44);
        cursorY += journalCardH + 14;
      }

      if (showTitle) {
        ctx.fillStyle = ink;
        ctx.font = `800 36px ${displayFont}`;
        const titleLineCount = drawWrappedCanvasText(ctx, title, innerX, cursorY + 36, innerW, 46, 3);
        cursorY += 36 + (titleLineCount - 1) * 46 + 16;
      }

      if (showAuthor) {
        ctx.font = `700 13px ${font}`;
        const labelW = ctx.measureText(t('firstAuthorLabel')).width;
        ctx.font = `600 15px ${font}`;
        const authorW = ctx.measureText(firstAuthor).width;
        const authorPillW = labelW + authorW + 30;

        roundedRectPath(ctx, innerX, cursorY, authorPillW, 30, 8);
        ctx.fillStyle = 'rgba(37, 99, 235, 0.06)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(37, 99, 235, 0.16)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#2563eb';
        ctx.font = `700 13px ${font}`;
        ctx.fillText(t('firstAuthorLabel'), innerX + 10, cursorY + 20);

        ctx.fillStyle = inkSecondary;
        ctx.font = `600 15px ${font}`;
        ctx.fillText(firstAuthor, innerX + 10 + labelW + 10, cursorY + 20);
        cursorY += 40;
      }
    }

    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(innerX, cursorY + 2, innerW, 1.5);
    cursorY += 18;
  }

  // 5. Key Metrics: Dashboard Stat Cards
  const duration = analysis.display?.value;
  const showMetrics = visible.status || visible.duration;

  if (showMetrics) {
    const cardH = 100;
    const both = visible.duration && visible.status;
    const colW = both ? (innerW - 18) / 2 : innerW;

    if (visible.duration) {
      roundedRectPath(ctx, innerX, cursorY, colW, cardH, 12);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Top mini accent indicator
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(innerX + 22, cursorY, 36, 3);

      ctx.fillStyle = muted;
      ctx.font = `700 13px ${font}`;
      ctx.fillText(t('shareJourneyDuration'), innerX + 22, cursorY + 28);

      const durationStr = duration === null || duration === undefined ? '—' : String(duration);
      ctx.fillStyle = ink;
      ctx.font = `800 44px ${displayFont}`;
      ctx.fillText(durationStr, innerX + 22, cursorY + 74);
      const numW = ctx.measureText(durationStr).width;

      if (duration !== null && duration !== undefined) {
        ctx.fillStyle = accent;
        ctx.font = `800 16px ${font}`;
        ctx.fillText(t('days'), innerX + 22 + numW + 8, cursorY + 70);
      }

      ctx.textAlign = 'right';
      ctx.fillStyle = subtle;
      ctx.font = `600 12px ${font}`;
      ctx.fillText(isZh ? '自启动至今' : 'Active tracking', innerX + colW - 22, cursorY + 70);
      ctx.textAlign = 'left';
    }

    if (visible.status) {
      const statusX = visible.duration ? innerX + colW + 18 : innerX;
      roundedRectPath(ctx, statusX, cursorY, colW, cardH, 12);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = analysis.accepted ? '#059669' : '#0891b2';
      ctx.fillRect(statusX + 22, cursorY, 36, 3);

      ctx.fillStyle = muted;
      ctx.font = `700 13px ${font}`;
      ctx.fillText(t('shareJourneyStatus'), statusX + 22, cursorY + 28);

      const statusText = getSubmissionStatusLabel(submission.status);
      ctx.font = `800 16px ${font}`;
      const stW = ctx.measureText(statusText).width;
      const pillW = Math.min(colW - 44, stW + 38);

      roundedRectPath(ctx, statusX + 22, cursorY + 42, pillW, 34, 8);
      ctx.fillStyle = analysis.accepted ? '#ecfdf5' : '#eff6ff';
      ctx.fill();
      ctx.strokeStyle = analysis.accepted ? '#a7f3d0' : '#bfdbfe';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(statusX + 22 + 13, cursorY + 59, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = analysis.accepted ? '#065f46' : '#1e40af';
      ctx.font = `800 16px ${font}`;
      ctx.fillText(statusText, statusX + 22 + 24, cursorY + 65);

      ctx.textAlign = 'right';
      ctx.fillStyle = subtle;
      ctx.font = `600 12px ${font}`;
      ctx.fillText(isZh ? '当前流程' : 'Current stage', statusX + colW - 22, cursorY + 70);
      ctx.textAlign = 'left';
    }

    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(innerX, cursorY + cardH + 14, innerW, 1.5);
    cursorY += cardH + 30;
  }

  // 6. Timeline Milestones Section
  ctx.fillStyle = ink;
  ctx.font = `800 20px ${font}`;
  ctx.fillText(t('shareJourneyTimeline'), innerX, cursorY + 4);

  // Progress Pill Badge
  roundedRectPath(ctx, innerRight - 88, cursorY - 14, 88, 24, 12);
  ctx.fillStyle = '#f1f5f9';
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#475569';
  ctx.font = `700 13px ${font}`;
  ctx.textAlign = 'center';
  ctx.fillText(`${String(events.length).padStart(2, '0')} / ${String(totalNodesCount).padStart(2, '0')}`, innerRight - 44, cursorY + 2);
  ctx.textAlign = 'left';

  cursorY += 22;

  const footerSpace = visible.footer ? 60 : 20;
  const availableTimelineHeight = (cardY + cardH) - cursorY - footerSpace;

  // Render bottom Journey Summary Card when there are fewer nodes
  const shouldRenderSummaryCard = events.length <= 5 && availableTimelineHeight > (events.length * 72 + 130);
  const summaryCardH = shouldRenderSummaryCard ? 104 : 0;
  const timelineUsableHeight = availableTimelineHeight - summaryCardH - (shouldRenderSummaryCard ? 16 : 0);

  const minRowGap = 64;
  const maxRowGap = shouldRenderSummaryCard ? 100 : (visible.size === 'story' ? 200 : 160);
  const rowGap = events.length > 1
    ? Math.min(maxRowGap, Math.max(minRowGap, (timelineUsableHeight - 50) / (events.length - 1)))
    : 72;
  const compactTimeline = rowGap < 78;
  const denseTimeline = events.length >= 7;

  const railX = innerX + 28;
  const firstY = cursorY + 28;
  const lastY = firstY + Math.max(0, events.length - 1) * rowGap;

  if (events.length > 1) {
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(railX, firstY);
    ctx.lineTo(railX, lastY);
    ctx.stroke();
  }

  if (!events.length) {
    roundedRectPath(ctx, innerX, cursorY + 16, innerW, 72, 10);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.fillStyle = muted;
    ctx.font = `600 15px ${font}`;
    ctx.fillText(t('shareJourneyNoEvents'), innerX + 24, cursorY + 56);
  } else {
    events.forEach((event, index) => {
      const y = firstY + index * rowGap;
      const typeStyle = shareTypeColors[event.type] || shareTypeColors.special;
      const contentX = railX + 32;
      const rowW = innerRight - contentX;
      const rowCardH = denseTimeline ? 54 : (compactTimeline ? 56 : 64);
      const rowCardY = y - rowCardH / 2;

      // Soft Milestone Row Container Card
      roundedRectPath(ctx, contentX, rowCardY, rowW, rowCardH, 10);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.strokeStyle = '#eef2f6';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Outer Numbered Milestone Circle
      ctx.fillStyle = paper;
      ctx.beginPath();
      ctx.arc(railX, y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = typeStyle.main;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = ink;
      ctx.font = `800 12px ${font}`;
      ctx.textAlign = 'center';
      ctx.fillText(String(index + 1).padStart(2, '0'), railX, y + 4);
      ctx.textAlign = 'left';

      // Event Type Tag Pill inside row card
      ctx.font = `700 13px ${font}`;
      const tagText = typeStyle.label;
      const tagW = ctx.measureText(tagText).width + 14;
      roundedRectPath(ctx, contentX + 14, y - 11, tagW, 22, 5);
      ctx.fillStyle = typeStyle.bg;
      ctx.fill();
      ctx.strokeStyle = typeStyle.border;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = typeStyle.main;
      ctx.fillText(tagText, contentX + 21, y + 4);

      // Event Name
      const nameX = contentX + 14 + tagW + 12;
      const maxNameW = visible.dates ? rowW - tagW - 180 : rowW - tagW - 36;
      ctx.fillStyle = ink;
      ctx.font = `700 ${denseTimeline ? 16 : 18}px ${font}`;
      drawEllipsizedCanvasText(ctx, event.name, nameX, y + 5, maxNameW);

      // Event Date Badge on the Right
      if (visible.dates) {
        const dateText = formatShareDate(event.date);
        ctx.font = `700 13px ${font}`;
        const dateW = ctx.measureText(dateText).width + 20;
        const dateX = innerRight - dateW - 12;

        roundedRectPath(ctx, dateX, y - 12, dateW, 24, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = muted;
        ctx.fillText(dateText, dateX + 10, y + 4);
      }
    });

    // Milestone Summary Insights Card at the Bottom
    if (shouldRenderSummaryCard && events.length > 0) {
      const sumY = lastY + 38;
      const sumH = Math.min(104, (cardY + cardH) - sumY - footerSpace - 8);
      if (sumH >= 80) {
        roundedRectPath(ctx, innerX, sumY, innerW, sumH, 12);
        ctx.fillStyle = '#f8fafc';
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = accent;
        ctx.fillRect(innerX + 20, sumY, 32, 3);

        ctx.fillStyle = ink;
        ctx.font = `800 12px ${font}`;
        ctx.fillText(isZh ? '科研里程碑阶段小结' : 'MILESTONE SUMMARY', innerX + 20, sumY + 24);

        const colW = (innerW - 40) / 3;
        const firstEvent = events[0];
        const lastEvent = events[events.length - 1];

        // Col 1: First Milestone
        const c1X = innerX + 20;
        ctx.fillStyle = muted;
        ctx.font = `600 11px ${font}`;
        ctx.fillText(isZh ? '起步节点' : 'Start Milestone', c1X, sumY + 46);
        ctx.fillStyle = ink;
        ctx.font = `700 13px ${font}`;
        ctx.fillText(formatShareDate(firstEvent?.date), c1X, sumY + 68);

        // Col 2: Latest Milestone
        const c2X = c1X + colW;
        ctx.fillStyle = muted;
        ctx.font = `600 11px ${font}`;
        ctx.fillText(isZh ? '当前进展' : 'Latest Milestone', c2X, sumY + 46);
        ctx.fillStyle = ink;
        ctx.font = `700 13px ${font}`;
        drawWrappedCanvasText(ctx, lastEvent?.name || '—', c2X, sumY + 68, colW - 20, 16, 1);

        // Col 3: Stage Span
        const c3X = c2X + colW;
        ctx.fillStyle = muted;
        ctx.font = `600 11px ${font}`;
        ctx.fillText(isZh ? '阶段历时' : 'Stage Span', c3X, sumY + 46);
        const spanDays = getDaysDiff(firstEvent?.date, lastEvent?.date);
        ctx.fillStyle = accent;
        ctx.font = `800 16px ${font}`;
        ctx.fillText(spanDays !== null ? `${spanDays} ${t('days')}` : '—', c3X, sumY + 68);
      }
    }
  }

  // 7. Footer Branding & Privacy Attribution
  if (visible.footer) {
    const footerY = (cardY + cardH) - 24;
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(innerX, footerY - 16, innerW, 1);

    // Mini Logo Icon
    roundedRectPath(ctx, innerX, footerY - 11, 16, 16, 4);
    const logoGrad = ctx.createLinearGradient(innerX, footerY - 11, innerX + 16, footerY + 5);
    logoGrad.addColorStop(0, '#2563eb');
    logoGrad.addColorStop(1, '#06b6d4');
    ctx.fillStyle = logoGrad;
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = `800 8px ${font}`;
    ctx.textAlign = 'center';
    ctx.fillText('RF', innerX + 8, footerY + 1);
    ctx.textAlign = 'left';

    ctx.fillStyle = ink;
    ctx.font = `800 13px ${font}`;
    ctx.fillText('RESEARCHFLOW', innerX + 24, footerY + 2);

    ctx.fillStyle = subtle;
    ctx.font = `600 11px ${font}`;
    ctx.fillText('•  JOURNEY MAP', innerX + 150, footerY + 2);

    ctx.fillStyle = subtle;
    ctx.font = `500 11px ${font}`;
    ctx.textAlign = 'right';
    ctx.fillText(t('shareJourneyFooter'), innerRight, footerY + 2);
    ctx.textAlign = 'left';
  }

  return { canvas, title };
}

function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG encoding failed')), 'image/png', 0.96);
  });
}

function safeShareFileName(title) {
  const base = String(title || 'submission-journey')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 72);
  return `${base || 'submission-journey'}-journey.png`;
}

function downloadShareBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function openSubmissionSharePreview(submissionId, triggerButton) {
  const submission = db.submissions.find(item => item.id === submissionId);
  if (!submission) return;
  if (triggerButton) {
    triggerButton.disabled = true;
    triggerButton.setAttribute('aria-busy', 'true');
  }

  try {
    const stored = await chrome.storage.local.get([SHARE_PREFS_STORAGE_KEY]);
    let visibility = normalizeShareVisibility(stored?.[SHARE_PREFS_STORAGE_KEY]);
    let currentBlob = null;
    let currentFileName = '';
    let currentTitle = '';
    let previewRenderId = 0;
    const fields = [
      ['title', 'shareFieldTitle'],
      ['journal', 'shareFieldJournal'],
      ['author', 'shareFieldAuthor'],
      ['status', 'shareFieldStatus'],
      ['duration', 'shareFieldDuration'],
      ['dates', 'shareFieldDates'],
      ['footer', 'shareFieldFooter']
    ];
    const visibilityControls = fields.map(([key, labelKey]) => `
      <label class="share-visibility-chip">
        <input type="checkbox" data-share-field="${key}" ${visibility[key] ? 'checked' : ''}>
        <span class="share-visibility-check" aria-hidden="true">✓</span>
        <span>${escapeHTML(t(labelKey))}</span>
      </label>
    `).join('');

    openModal(`
      <div class="share-preview-shell">
        <div class="share-preview-header">
          <div>
            <span class="share-preview-kicker">ResearchFlow / Share Studio</span>
            <h2>${escapeHTML(t('shareJourneyTitle'))}</h2>
            <p>${escapeHTML(t('shareJourneyHelp'))}</p>
          </div>
          <button class="btn-icon share-preview-close" id="btn-close-modal" type="button" aria-label="${escapeHTML(t('close'))}">×</button>
        </div>
        <div class="share-preview-workbench">
          <aside class="share-visibility-panel" aria-label="${escapeHTML(t('shareVisibilityTitle'))}">
            <div class="share-visibility-heading">
              <strong>${escapeHTML(t('shareVisibilityTitle'))}</strong>
              <small>${escapeHTML(t('shareVisibilityHelp'))}</small>
            </div>
            <div class="share-visibility-list">${visibilityControls}</div>
            <label class="share-size-control" for="share-image-size">
              <span>${escapeHTML(t('shareSizeTitle'))}</span>
              <select id="share-image-size">
                <option value="portrait" ${visibility.size === 'portrait' ? 'selected' : ''}>${escapeHTML(t('shareSizePortrait'))}</option>
                <option value="story" ${visibility.size === 'story' ? 'selected' : ''}>${escapeHTML(t('shareSizeStory'))}</option>
                <option value="auto" ${visibility.size === 'auto' ? 'selected' : ''}>${escapeHTML(t('shareSizeAuto'))}</option>
              </select>
            </label>
          </aside>
          <div class="share-preview-frame" data-render-state="idle" aria-live="polite">
            <div class="share-preview-loading" data-share-loading>${escapeHTML(t('shareJourneyReady'))}</div>
            <img alt="${escapeHTML(t('shareJourneyTitle'))}">
          </div>
        </div>
        <div class="share-preview-actions">
          <span class="share-local-note">● ${escapeHTML(t('shareJourneyHelp'))}</span>
          <button class="btn-primary" id="btn-share-system" type="button">${escapeHTML(t('shareJourneySystem'))}</button>
          <button class="btn-secondary" id="btn-share-download" type="button">${escapeHTML(t('shareJourneyDownload'))}</button>
          <button class="btn-secondary" id="btn-share-copy" type="button">${escapeHTML(t('shareJourneyCopy'))}</button>
        </div>
      </div>
    `);

    const image = modalContent.querySelector('.share-preview-frame img');
    const previewFrame = modalContent.querySelector('.share-preview-frame');
    const loading = modalContent.querySelector('[data-share-loading]');
    const renderPreview = async () => {
      const renderId = ++previewRenderId;
      previewFrame.dataset.renderState = 'rendering';
      previewFrame.dataset.shareSize = visibility.size;
      loading.hidden = false;
      image.classList.add('is-rendering');
      const { canvas, title } = createSubmissionShareCanvas(submission, visibility);
      const blob = await canvasToPngBlob(canvas);
      const nextUrl = URL.createObjectURL(blob);
      if (renderId !== previewRenderId) {
        URL.revokeObjectURL(nextUrl);
        return;
      }
      const previousUrl = activeSharePreviewUrl;
      activeSharePreviewUrl = nextUrl;
      currentBlob = blob;
      currentTitle = title;
      currentFileName = safeShareFileName(title);
      await new Promise((resolve, reject) => {
        image.onload = () => {
          loading.hidden = true;
          image.classList.remove('is-rendering');
          previewFrame.dataset.renderState = 'ready';
          previewFrame.scrollTo({ top: 0, left: 0 });
          if (previousUrl) URL.revokeObjectURL(previousUrl);
          resolve();
        };
        image.onerror = () => reject(new Error('Share image preview failed to load'));
        image.src = nextUrl;
      });
    };

    const renderPreviewSafe = async () => {
      const requestedRenderId = previewRenderId + 1;
      try {
        await renderPreview();
      } catch (error) {
        if (requestedRenderId !== previewRenderId) return;
        loading.hidden = true;
        image.classList.remove('is-rendering');
        previewFrame.dataset.renderState = 'error';
        currentBlob = null;
        showGlobalToast(t('shareJourneyFailed'), 'warning');
      }
    };

    const persistShareVisibility = async () => {
      try {
        await chrome.storage.local.set({ [SHARE_PREFS_STORAGE_KEY]: visibility });
      } catch {
        showGlobalToast(t('shareJourneyFailed'), 'warning');
      }
    };

    await renderPreviewSafe();
    modalContent.querySelectorAll('[data-share-field]').forEach((control) => {
      control.addEventListener('change', async () => {
        previewFrame.dataset.renderState = 'pending';
        loading.hidden = false;
        image.classList.add('is-rendering');
        visibility = normalizeShareVisibility({
          ...visibility,
          [control.dataset.shareField]: control.checked
        });
        await persistShareVisibility();
        await renderPreviewSafe();
      });
    });
    document.getElementById('share-image-size')?.addEventListener('change', async (event) => {
      previewFrame.dataset.renderState = 'pending';
      loading.hidden = false;
      image.classList.add('is-rendering');
      visibility = normalizeShareVisibility({ ...visibility, size: event.target.value });
      await persistShareVisibility();
      await renderPreviewSafe();
    });

    const systemButton = document.getElementById('btn-share-system');
    const canSystemShare = Boolean(navigator.share && navigator.canShare);
    if (!canSystemShare) systemButton.hidden = true;
    systemButton?.addEventListener('click', async () => {
      if (!currentBlob) return;
      const file = new File([currentBlob], currentFileName, { type: 'image/png' });
      if (!navigator.canShare?.({ files: [file] })) {
        showGlobalToast(t('shareJourneyUnsupported'), 'warning');
        return;
      }
      try {
        await navigator.share({ files: [file], title: t('shareJourneyTitle'), text: currentTitle });
      } catch (error) {
        if (error?.name !== 'AbortError') showGlobalToast(t('shareJourneyUnsupported'), 'warning');
      }
    });
    document.getElementById('btn-share-download')?.addEventListener('click', () => {
      if (!currentBlob) return;
      downloadShareBlob(currentBlob, currentFileName);
      showGlobalToast(t('shareJourneyDownloaded'), 'success');
    });
    const copyButton = document.getElementById('btn-share-copy');
    const canCopyImage = Boolean(window.ClipboardItem && navigator.clipboard?.write);
    if (!canCopyImage) copyButton.hidden = true;
    copyButton?.addEventListener('click', async () => {
      if (!currentBlob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': currentBlob })]);
        showGlobalToast(t('shareJourneyCopied'), 'success');
      } catch {
        downloadShareBlob(currentBlob, currentFileName);
        showGlobalToast(t('shareJourneyDownloaded'), 'success');
      }
    });
    showGlobalToast(t('shareJourneyReady'), 'success');
  } catch (error) {
    console.error(error);
    showGlobalToast(t('shareJourneyFailed'), 'error');
  } finally {
    if (triggerButton) {
      triggerButton.disabled = false;
      triggerButton.removeAttribute('aria-busy');
    }
  }
}

// --- DASHBOARD Lifecycle Filters ---
function setupDashboardFilterListeners() {
  const cardAccepted = document.getElementById('card-filter-accepted');
  const cardActive = document.getElementById('card-filter-active');
  const cardAll = document.getElementById('card-filter-all');

  if (!cardAccepted || !cardActive || !cardAll) return;

  const clearActiveClasses = () => {
    [cardAccepted, cardActive, cardAll].forEach(card => {
      card.classList.remove('active');
      card.setAttribute('aria-pressed', 'false');
    });
  };

  cardAccepted.addEventListener('click', () => {
    currentDashboardFilter = 'accepted';
    clearActiveClasses();
    cardAccepted.classList.add('active');
    cardAccepted.setAttribute('aria-pressed', 'true');
    renderDashboard();
  });

  cardActive.addEventListener('click', () => {
    currentDashboardFilter = 'active';
    clearActiveClasses();
    cardActive.classList.add('active');
    cardActive.setAttribute('aria-pressed', 'true');
    renderDashboard();
  });

  cardAll.addEventListener('click', () => {
    currentDashboardFilter = 'all';
    clearActiveClasses();
    cardAll.classList.add('active');
    cardAll.setAttribute('aria-pressed', 'true');
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
      syncBtn.innerHTML = t('forceSync');
      updateSyncProviderVisibility();
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
  rejection: { color: "#b91c1c", labelKey: "statusRejected" },
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

function escapeLatex(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([&%#_{}])/g, '\\$1')
    .replace(/\$/g, '\\$')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\n/g, '\\\\ ');
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

function buildTimelineEventManager(sub, options = {}) {
  const nodes = autoSortNodes(sub.timelineNodes || []);
  if (!nodes.length) return '';
  const inModal = options.inModal === true;

  const items = nodes.map(node => {
    const computedStatus = computeNodeStatus(node);
    const meta = getTimelineTypeMeta(node.type);
    const date = getNodeDate(node);
    return `
      <div class="timeline-event-chip ${inModal ? 'modal-event-chip' : ''}" data-node-id="${escapeHTML(node.id)}" style="--event-color:${meta.color}">
        <button class="timeline-event-main btn-event-edit" type="button" data-sub-id="${escapeHTML(sub.id)}" data-node-id="${escapeHTML(node.id)}" title="${escapeHTML(t('clickEditEvent'))}">
          <span class="timeline-event-dot"></span>
          <span class="timeline-event-text">
            <strong>${escapeHTML(getTimelineNodeDisplayName(node))}</strong>
            <small>${date ? escapeHTML(formatShortDate(date)) : t('noDate')} · ${escapeHTML(getNodeStatusLabel(computedStatus))}</small>
          </span>
        </button>
        <button class="timeline-event-delete btn-event-delete" type="button" data-sub-id="${escapeHTML(sub.id)}" data-node-id="${escapeHTML(node.id)}" title="${escapeHTML(t('delete'))}">×</button>
      </div>
    `;
  }).join('');

  return `
    <div class="timeline-event-manager ${inModal ? 'modal-event-manager' : ''}">
      <div class="timeline-event-manager-head">${t('timelineEvents')}</div>
      <div class="timeline-event-list">${items}</div>
    </div>
  `;
}

function openTimelineEventManager(subId) {
  const sub = db.submissions.find(s => s.id === subId);
  if (!sub) {
    showGlobalToast(t('submissionNotFound'), 'error');
    return;
  }

  openModal(`
    <div class="modal-header">
      <h2>${t('timelineEvents')}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal" title="${escapeHTML(t('close'))}">×</button>
    </div>
    ${buildTimelineEventManager(sub, { inModal: true }) || `<p class="empty-state">${t('noEventYet')}</p>`}
  `);

  modalContent.querySelectorAll('.btn-event-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal();
      openStageDrawer(btn.getAttribute('data-sub-id'), btn.getAttribute('data-node-id'));
    });
  });

  modalContent.querySelectorAll('.btn-event-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const latestSub = db.submissions.find(s => s.id === btn.getAttribute('data-sub-id'));
      const nodeId = btn.getAttribute('data-node-id');
      const node = latestSub?.timelineNodes?.find(n => n.id === nodeId);
      if (!latestSub || !node) {
        showGlobalToast(t('eventNotFound'), 'error');
        closeModal();
        renderDashboard();
        return;
      }
      if (!confirm(tf('confirmDeleteEvent', { name: getTimelineNodeDisplayName(node) }))) return;
      deleteTimelineNode(latestSub, nodeId);
      syncManuscriptStatusFromSubmission(latestSub);
      await window.storage.saveAll(db);
      closeModal();
      renderDashboard();
      renderKanban();
      renderSubmissions();
      showGlobalToast(t('eventRemovedToast'), 'success');
    });
  });
}

function deleteTimelineNode(sub, nodeId) {
  if (!sub || !Array.isArray(sub.timelineNodes)) return null;
  const node = sub.timelineNodes.find(n => n.id === nodeId);
  if (!node) return null;
  const key = inferKey(node);

  sub.timelineNodes = sub.timelineNodes.filter(n => n.id !== nodeId);

  if (key === 'submit') {
    sub.submissionDate = null;
    if (sub.status === 'submitted') sub.status = 'under_review';
  } else if (key === 'r1_comments') {
    sub.firstDecisionDate = null;
    sub.revisionDueDate = null;
    if (sub.status === 'revision') sub.status = 'under_review';
  } else if (key === 'accept' || key === 'online') {
    sub.decisionDate = null;
    sub.acceptedAt = null;
    sub.publishedAt = null;
    if (sub.status === 'accepted' || sub.status === 'published') {
      sub.status = getTimelineNodeByKey(sub, 'r1_comments') ? 'revision' : 'under_review';
    }
    clearPublicationLinkFields(sub);
    clearPublicationTimelineCompletion(sub);
  } else if (key === 'rejected') {
    sub.rejectedAt = null;
    sub.rejectionNote = '';
    if (sub.status === 'rejected') {
      sub.status = getTimelineNodeByKey(sub, 'r1_comments') ? 'revision' : 'under_review';
    }
  }

  sub.updatedAt = new Date().toISOString();
  return node;
}

function buildOptions(options, selectedValue) {
  return options.map(option => {
    const value = typeof option === 'string' ? option : option.value;
    const label = typeof option === 'string' ? option : option.label;
    return `<option value="${escapeHTML(value)}" ${value === selectedValue ? 'selected' : ''}>${escapeHTML(label)}</option>`;
  }).join('');
}

function getInlineEventPresets() {
  return [
    { key: 'submit', label: t('defaultManuscriptSubmitted'), name: 'Manuscript Submitted', type: 'submission' },
    { key: 'r1_comments', label: t('defaultReviewCommentsR1'), name: 'Review Comments R1', type: 'review' },
    { key: 'r1_revised', label: t('defaultR1RevisionSubmitted'), name: 'R1 Revision Submitted', type: 'revision' },
    { key: 'r2_comments', label: t('defaultReviewCommentsR2'), name: 'Review Comments R2', type: 'review' },
    { key: 'r2_revised', label: t('defaultR2RevisionSubmitted'), name: 'R2 Revision Submitted', type: 'revision' },
    { key: 'accept', label: t('defaultAccepted'), name: 'Accepted', type: 'publication' },
    { key: 'online', label: t('defaultOnlinePublication'), name: 'Online Publication', type: 'publication' },
    { key: 'rejected', label: t('statusRejected'), name: 'Rejected', type: 'rejection' },
    { key: 'experiment_done', label: t('defaultExperimentsCompleted'), name: 'Experiments Completed', type: 'research' },
    { key: 'draft_done', label: t('defaultDraftCompleted'), name: 'Draft Completed', type: 'writing' },
    { key: 'custom', label: t('customEvent'), name: '', type: 'review' }
  ];
}

function getInlineEventPreset(key) {
  return getInlineEventPresets().find(preset => preset.key === key) || getInlineEventPresets()[0];
}

function buildInlineStageEditor(subId) {
  const keyOptions = getInlineEventPresets().map(preset => ({ value: preset.key, label: preset.label }));
  const typeOptions = [
    { value: 'research', label: t('eventTypeResearch') },
    { value: 'writing', label: t('eventTypeWriting') },
    { value: 'submission', label: t('eventTypeSubmission') },
    { value: 'review', label: t('eventTypeReview') },
    { value: 'revision', label: t('eventTypeRevision') },
    { value: 'rejection', label: t('statusRejected') },
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
        <select class="inline-stage-key" title="${escapeHTML(t('keyEventPreset'))}">${buildOptions(keyOptions, 'submit')}</select>
        <input type="text" class="inline-stage-name" value="${escapeHTML(t('defaultManuscriptSubmitted'))}" placeholder="${escapeHTML(t('eventPlaceholder'))}">
        <input type="date" class="inline-stage-date" value="${todayString()}">
        <select class="inline-stage-type">${buildOptions(typeOptions, 'submission')}</select>
        <input type="text" class="inline-stage-notes" placeholder="${escapeHTML(t('eventNotesShort'))}">
        <button class="btn-primary btn-sm btn-inline-stage-save" type="button">${t('addEvent').replace('+ ', '')}</button>
      </div>
    </div>
  `;
}

function toggleInlineStageEditor(card, shouldOpen = null) {
  const editor = card?.querySelector('.inline-stage-editor');
  if (!editor) return;
  if (shouldOpen !== false) setPipelineViewMode(true);
  editor.hidden = shouldOpen === null ? !editor.hidden : !shouldOpen;
  if (!editor.hidden) {
    syncInlineStagePreset(editor);
    const nameInput = editor.querySelector('.inline-stage-name');
    if (nameInput) nameInput.focus();
  }
}

function syncInlineStagePreset(editor) {
  const keySelect = editor.querySelector('.inline-stage-key');
  const nameInput = editor.querySelector('.inline-stage-name');
  const typeSelect = editor.querySelector('.inline-stage-type');
  if (!keySelect || !nameInput || !typeSelect) return;

  const preset = getInlineEventPreset(keySelect.value);
  if (preset.key !== 'custom') {
    nameInput.value = t(defaultTimelineNameKeys[preset.name] || '') || preset.label || preset.name;
    typeSelect.value = preset.type;
  } else if (nameInput.readOnly) {
    nameInput.value = '';
  }
  nameInput.readOnly = preset.key !== 'custom';
  typeSelect.disabled = preset.key !== 'custom';
}

function applyInlineEventToSubmission(sub, key, eventDate, note = '') {
  const isoDate = dateInputToIso(eventDate);
  if (key === 'submit') {
    sub.submissionDate = isoDate;
    if (!hasPublicationStatus(sub) && sub.status !== 'rejected') sub.status = 'submitted';
  } else if (key === 'r1_comments' || key === 'r2_comments') {
    if (key === 'r1_comments') sub.firstDecisionDate = isoDate;
    if (!hasPublicationStatus(sub) && sub.status !== 'rejected') sub.status = 'revision';
  } else if (key === 'r1_revised' || key === 'r2_revised') {
    if (!hasPublicationStatus(sub) && sub.status !== 'rejected') sub.status = 'under_review';
  } else if (key === 'accept' || key === 'online') {
    sub.decisionDate = isoDate;
    sub.status = key === 'online' ? 'published' : 'accepted';
    if (key === 'accept') sub.acceptedAt = isoDate;
    if (key === 'online') {
      sub.publishedAt = isoDate;
      sub.acceptedAt = sub.acceptedAt || isoDate;
    }
  } else if (key === 'rejected') {
    markSubmissionRejected(sub, eventDate, note);
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

  const selectedKey = editor.querySelector('.inline-stage-key')?.value || 'custom';
  const preset = getInlineEventPreset(selectedKey);
  const name = editor.querySelector('.inline-stage-name').value.trim() || preset.name;
  const eventDate = editor.querySelector('.inline-stage-date').value || todayString();
  const type = editor.querySelector('.inline-stage-type').value;
  const notes = editor.querySelector('.inline-stage-notes')?.value.trim() || '';

  if (!name) {
    alert(t('eventNameRequired'));
    editor.querySelector('.inline-stage-name').focus();
    return;
  }

  if (!Array.isArray(sub.timelineNodes)) sub.timelineNodes = [];
  let node = null;
  const nodeKey = selectedKey === 'custom' ? 'auto' : selectedKey;

  if (selectedKey === 'rejected') {
    const existingRejected = getTimelineNodeByKey(sub, 'rejected');
    if (existingRejected && !confirm(tf('confirmUpdateEvent', { name: getTimelineNodeDisplayName(existingRejected) }))) {
      return;
    }
    markSubmissionRejected(sub, eventDate, notes);
    node = getTimelineNodeByKey(sub, 'rejected');
  } else {
    node = selectedKey === 'custom' ? null : getTimelineNodeByKey(sub, selectedKey);
    if (node && selectedKey !== 'custom' && node.completeDate) {
      const shouldUpdate = confirm(tf('confirmUpdateEvent', { name: getTimelineNodeDisplayName(node) }));
      if (!shouldUpdate) return;
    }
    const nodeValues = {
      key: nodeKey,
      name,
      type,
      status: 'completed',
      planDate: '',
      dueDate: '',
      completeDate: eventDate,
      notes
    };

    if (node) {
      Object.assign(node, nodeValues, { updatedAt: new Date().toISOString() });
    } else {
      node = createTimelineNode(subId, nodeValues);
      sub.timelineNodes.push(node);
    }
    applyInlineEventToSubmission(sub, nodeKey, eventDate, notes);
  }

  normalizeSubmissionTimeline(sub);
  syncManuscriptStatusFromSubmission(sub);
  await window.storage.saveAll(db);
  renderDashboard();
  renderKanban();
  renderSubmissions();
  showGlobalToast(tf('eventAddedToast', { name: getTimelineNodeDisplayName(node) }), 'success');
}

function inferKey(node) {
  if (node.key && node.key !== 'auto') return node.key;
  const t = `${node.name || ''} ${node.notes || ''}`.toLowerCase();
  if (/reject|rejected|decline|declined|拒稿|拒绝|退稿/.test(t) || node.type === 'rejection') return 'rejected';
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
      status: decisionDate && hasPublicationStatus(sub) ? 'completed' : 'pending',
      completeDate: decisionDate && hasPublicationStatus(sub) ? decisionDate : ''
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
  if (decisionDate && hasPublicationStatus(sub)) {
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
    const nodeDate = node ? normalizeDateString(window.RFUI.getTimelineEventDate(node, key)) : null;
    if (key === 'submit') return normalizeDateString(sub.submissionDate) || nodeDate;
    if (key === 'r1_comments') return normalizeDateString(sub.firstDecisionDate) || nodeDate;
    if (key === 'accept' || key === 'online') {
      return normalizeDateString(sub.decisionDate) && hasPublicationStatus(sub)
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
  const accepted = Boolean(acceptDate) || hasPublicationStatus(sub);

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
  const isDarkMode = isDarkThemeActive();
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

function hasPublicationStatus(sub) {
  const status = normalizeSubmissionStatus(sub?.status);
  return status === 'accepted' || status === 'published';
}

function canHavePublicationLink(sub) {
  if (!sub) return false;
  if (hasPublicationStatus(sub)) return true;
  if (normalizeDateString(sub.acceptedAt || sub.publishedAt)) return true;
  return isAcceptedSubmission(sub);
}

function clearPublicationLinkFields(sub) {
  if (!sub) return false;
  let changed = false;
  ['doi', 'DOI', 'articleDoi', 'articleUrl', 'publicationUrl', 'journalArticleUrl'].forEach(field => {
    if (sub[field]) {
      sub[field] = null;
      changed = true;
    }
  });
  return changed;
}

function clearPublicationTimelineCompletion(sub) {
  if (!sub || !Array.isArray(sub.timelineNodes)) return false;
  let changed = false;
  sub.timelineNodes.forEach(node => {
    if (inferKey(node) !== 'accept' && inferKey(node) !== 'online') return;
    if (node.completeDate) {
      node.completeDate = '';
      changed = true;
    }
    if (node.status === 'completed') {
      node.status = 'pending';
      changed = true;
    }
  });
  return changed;
}

function clearUnacceptedPublicationLinks(database) {
  if (!database || !Array.isArray(database.submissions)) return false;
  let changed = false;
  database.submissions.forEach(sub => {
    if (!canHavePublicationLink(sub)) {
      changed = clearPublicationLinkFields(sub) || changed;
    }
  });
  return changed;
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
  if (!canHavePublicationLink(sub)) return '';

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

function normalizeAuthorName(author) {
  if (typeof author === 'string') return author.trim();
  if (!author || typeof author !== 'object') return '';
  return String(author.name || author.fullName || author.displayName || '').trim();
}

function firstAuthorFromList(authors) {
  if (Array.isArray(authors)) {
    return normalizeAuthorName(authors.find(author => normalizeAuthorName(author)));
  }
  const value = String(authors || '').trim();
  if (!value) return '';
  return value.split(/\s*(?:;|；|\n|\band\b)\s*/i)[0].trim();
}

function getSubmissionFirstAuthor(sub, manuscript = null) {
  const man = manuscript || db?.manuscripts?.find(item => item.id === sub?.manuscriptId);
  return String(
    sub?.firstAuthor ||
    man?.firstAuthor ||
    firstAuthorFromList(man?.authors) ||
    firstAuthorFromList(sub?.authors) ||
    ''
  ).trim();
}

function getSubmissionArticleUrl(sub) {
  if (!canHavePublicationLink(sub)) return '';

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
    if (submittedA !== submittedB) return submittedB - submittedA;

    const da = getNodeDate(getLatestTimelineNode(a.timelineNodes || [])) || a.updatedAt || a.createdAt || '';
    const db = getNodeDate(getLatestTimelineNode(b.timelineNodes || [])) || b.updatedAt || b.createdAt || '';
    return new Date(db || 0) - new Date(da || 0);
  });
}

function normalizeSyncedPublicationStatus(status) {
  const normalized = normalizeText(status);
  if (normalized === 'accept') return 'accepted';
  return normalized;
}

function isSubmissionLifecycleStatus(status) {
  return ['submitted', 'under_review', 'revision', 'accepted', 'published'].includes(normalizeSyncedPublicationStatus(status));
}

function getSubmissionLifecycleRank(status) {
  const ranks = {
    submitted: 1,
    under_review: 2,
    revision: 3,
    accepted: 4,
    published: 5
  };
  return ranks[normalizeSyncedPublicationStatus(status)] || 0;
}

function getLinkedActiveSubmissions(manuscriptId, database = db) {
  return (database?.submissions || []).filter(sub => sub.manuscriptId === manuscriptId && sub.status !== 'rejected');
}

function syncLinkedSubmissionsFromManuscript(manuscript, database = db) {
  if (!manuscript || !isSubmissionLifecycleStatus(manuscript.status)) return false;
  const nextStatus = normalizeSyncedPublicationStatus(manuscript.status);
  let changed = false;

  getLinkedActiveSubmissions(manuscript.id, database).forEach(sub => {
    if (sub.status !== nextStatus) {
      sub.status = nextStatus;
      sub.updatedAt = new Date().toISOString();
      if (nextStatus !== 'accepted' && nextStatus !== 'published') {
        clearPublicationLinkFields(sub);
        clearPublicationTimelineCompletion(sub);
      }
      normalizeSubmissionTimeline(sub);
      changed = true;
    }
  });

  return changed;
}

function setManuscriptStatus(manuscript, status, { syncSubmissions = true, database = db } = {}) {
  if (!manuscript) return false;
  const nextStatus = normalizeSyncedPublicationStatus(status);
  let changed = false;
  if (manuscript.status !== nextStatus) {
    manuscript.status = nextStatus;
    manuscript.updatedAt = new Date().toISOString();
    changed = true;
  }
  if (syncSubmissions) {
    changed = syncLinkedSubmissionsFromManuscript(manuscript, database) || changed;
  }
  return changed;
}

async function persistManuscriptStatusChange(manuscript, nextStatus) {
  const liveManuscript = db.manuscripts.find(item => item.id === manuscript.id);
  if (!liveManuscript) throw new Error(t('manuscriptNotFound'));
  const previousStatus = normalizeSyncedPublicationStatus(liveManuscript.status);
  const workingDatabase = typeof structuredClone === 'function'
    ? structuredClone(db)
    : JSON.parse(JSON.stringify(db));
  const workingManuscript = workingDatabase.manuscripts.find(item => item.id === manuscript.id);
  if (!workingManuscript) throw new Error(t('manuscriptNotFound'));

  setManuscriptStatus(workingManuscript, nextStatus, { database: workingDatabase });
  const savedDatabase = await window.storage.saveAll(workingDatabase, { mergeOnConflict: true });
  db = savedDatabase || workingDatabase;
  const savedManuscript = db.manuscripts.find(item => item.id === manuscript.id);
  if (!savedManuscript) throw new Error(t('manuscriptNotFound'));
  Object.assign(manuscript, savedManuscript);

  return {
    manuscript: savedManuscript,
    shouldCelebrate: window.RFUI.shouldCelebrateAcceptance(
      previousStatus,
      normalizeSyncedPublicationStatus(savedManuscript.status)
    )
  };
}

function syncManuscriptStatusFromSubmission(submission) {
  if (!submission || !isSubmissionLifecycleStatus(submission.status)) return false;
  const manuscript = db?.manuscripts?.find(man => man.id === submission.manuscriptId);
  if (!manuscript) return false;
  return setManuscriptStatus(manuscript, submission.status, { syncSubmissions: false });
}

function syncManuscriptStatusesFromSubmissions(database) {
  if (!database || !Array.isArray(database.manuscripts) || !Array.isArray(database.submissions)) return false;
  let changed = false;
  database.manuscripts.forEach(manuscript => {
    const linked = database.submissions
      .filter(sub => sub.manuscriptId === manuscript.id && sub.status !== 'rejected' && isSubmissionLifecycleStatus(sub.status))
      .sort((a, b) => getSubmissionLifecycleRank(b.status) - getSubmissionLifecycleRank(a.status) || getSubmissionSortTime(b) - getSubmissionSortTime(a));
    const strongest = linked[0];
    if (!strongest) return;
    const nextStatus = normalizeSyncedPublicationStatus(strongest.status);
    if (getSubmissionLifecycleRank(nextStatus) > getSubmissionLifecycleRank(manuscript.status)) {
      manuscript.status = nextStatus;
      manuscript.updatedAt = new Date().toISOString();
      changed = true;
    }
  });
  return changed;
}

function createRejectedTimelineNode(sub, rejectionDate, note = '') {
  if (!Array.isArray(sub.timelineNodes)) sub.timelineNodes = [];
  const existing = sub.timelineNodes.find(node => inferKey(node) === 'rejected');
  const date = rejectionDate || todayString();
  const values = {
    key: 'rejected',
    name: 'Rejected',
    type: 'rejection',
    status: 'blocked',
    planDate: '',
    dueDate: '',
    completeDate: date,
    notes: note
  };

  if (existing) {
    Object.assign(existing, values, { updatedAt: new Date().toISOString() });
    return existing;
  }

  const node = createTimelineNode(sub.id, values);
  sub.timelineNodes.push(node);
  return node;
}

function markSubmissionRejected(sub, rejectionDate = todayString(), note = '') {
  if (!sub) return false;
  const isoDate = dateInputToIso(rejectionDate);
  sub.status = 'rejected';
  sub.decisionDate = isoDate;
  sub.firstDecisionDate = sub.firstDecisionDate || isoDate;
  sub.rejectedAt = isoDate;
  sub.rejectionNote = note || sub.rejectionNote || '';
  if (note) sub.notes = [sub.notes, `Rejected: ${note}`].filter(Boolean).join('\n');
  clearPublicationLinkFields(sub);
  clearPublicationTimelineCompletion(sub);
  createRejectedTimelineNode(sub, rejectionDate, note);
  sub.updatedAt = new Date().toISOString();
  return true;
}

function getNextSubmissionRound(manuscriptId) {
  const rounds = (db?.submissions || [])
    .filter(sub => sub.manuscriptId === manuscriptId)
    .map(sub => Number(sub.roundIndex) || 1);
  return rounds.length ? Math.max(...rounds) + 1 : 1;
}

function createTransferredSubmission(sourceSub, targetJournal, submissionDate = todayString(), journalUrl = '') {
  const manuscript = db.manuscripts.find(m => m.id === sourceSub.manuscriptId);
  const now = new Date().toISOString();
  const newSub = {
    id: 'sub_' + Math.random().toString(36).substring(2, 9),
    userId: sourceSub.userId || 'user',
    manuscriptId: sourceSub.manuscriptId,
    projectId: sourceSub.projectId || manuscript?.projectId || null,
    targetJournal,
    journalUrl: journalUrl || null,
    doi: null,
    articleUrl: null,
    status: 'submitted',
    submissionDate: dateInputToIso(submissionDate),
    decisionDate: null,
    revisionDueDate: null,
    firstDecisionDate: null,
    previousSubmissionId: sourceSub.id,
    previousJournal: getSubmissionJournalName(sourceSub),
    firstAuthor: getSubmissionFirstAuthor(sourceSub, manuscript) || null,
    roundIndex: getNextSubmissionRound(sourceSub.manuscriptId),
    complianceChecklist: {},
    complianceChecklistKeys: Array.isArray(sourceSub.complianceChecklistKeys) ? sourceSub.complianceChecklistKeys : undefined,
    reviewMatrix: [],
    timelineNodes: [],
    notes: `Transferred after rejection from ${getSubmissionJournalName(sourceSub)}.`,
    createdAt: now,
    updatedAt: now
  };
  normalizeSubmissionTimeline(newSub);
  return newSub;
}

function getSubmissionBadgeClass(sub) {
  const status = normalizeSyncedPublicationStatus(sub?.status || 'submitted');
  if (status === 'rejected') return 'danger';
  if (status === 'revision') return 'warning';
  if (status === 'accepted' || status === 'published') return 'success';
  return 'purple';
}

// --- VIEW 1: DASHBOARD OVERVIEW ---
// --- VIEW 1: DASHBOARD OVERVIEW ---
function renderDashboard() {
  // Calculate interactive stats counts
  const visibleSubmissions = db.submissions.filter(s => s.status !== 'rejected');
  let timelineChanged = false;
  visibleSubmissions.forEach(sub => {
    if (!Array.isArray(sub.timelineNodes) || sub.timelineNodes.length === 0) {
      sub.timelineNodes = buildDefaultSubmissionTimeline(sub);
      timelineChanged = true;
    }
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
      const displayIndex = submissionsList.length - index;
      const man = db.manuscripts.find(m => m.id === sub.manuscriptId);
      const manTitle = man ? man.title : t('untitledManuscript');
      const journalName = getSubmissionJournalName(sub);
      const firstAuthor = getSubmissionFirstAuthor(sub, man);

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
            <span class="submission-index">${displayIndex}</span>
            <div class="journal">${escapeHTML(journalName)}</div>
          </div>
          <h3 class="project-title" title="${escapeHTML(manTitle)}">${escapeHTML(manTitle)}</h3>
          <div class="project-meta">
            <span>${tf('nodesSaved', { count: sub.timelineNodes.length })}</span>
            <span>${t('timelineSortedBySubmissionDate')}: ${a.submitDate ? escapeHTML(formatShortDate(a.submitDate)) : t('noDate')}</span>
            <span>${t('expSubmitShort')} ${a.expToSubmit === null ? "—" : a.expToSubmit + t('dayUnitShort')}</span>
            <span>${t('timelineDateSource')}: ${escapeHTML(a.submitDateSource)}</span>
            <span class="pipeline-first-author ${firstAuthor ? '' : 'is-empty'}" title="${escapeHTML(t('firstAuthorLabel'))}: ${escapeHTML(firstAuthor || t('firstAuthorNotSet'))}">
              <span class="pipeline-first-author-label">${escapeHTML(t('firstAuthorLabel'))}:</span>
              <strong>${escapeHTML(firstAuthor || t('firstAuthorNotSet'))}</strong>
            </span>
          </div>
          <div class="pipeline-link-row">
            ${doiHtml}
          </div>
          <div class="pipeline-actions" style="margin-top: 12px; display: flex; gap: 8px;">
            <button class="btn-secondary btn-sm btn-pipeline-add" data-sub-id="${escapeHTML(sub.id)}">${t('addEvent')}</button>
            <button class="btn-secondary btn-sm btn-pipeline-manage" data-sub-id="${escapeHTML(sub.id)}">${t('manageEvents')}</button>
            <button class="btn-secondary btn-sm btn-pipeline-share" data-sub-id="${escapeHTML(sub.id)}" title="${escapeHTML(t('shareJourney'))}" aria-label="${escapeHTML(t('shareJourney'))}: ${escapeHTML(manTitle)}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></svg>
              <span>${escapeHTML(t('shareJourney'))}</span>
            </button>
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

    ganttBox.querySelectorAll('.btn-pipeline-manage').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openTimelineEventManager(btn.getAttribute('data-sub-id'));
      });
    });

    ganttBox.querySelectorAll('.btn-pipeline-share').forEach(btn => {
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        openSubmissionSharePreview(btn.getAttribute('data-sub-id'), btn);
      });
    });

    ganttBox.querySelectorAll('.inline-stage-key').forEach(select => {
      select.addEventListener('change', () => {
        syncInlineStagePreset(select.closest('.inline-stage-editor'));
      });
    });

    ganttBox.querySelectorAll('.btn-inline-stage-save').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await saveInlineStageEvent(btn.closest('.inline-stage-editor'));
      });
    });
  }




  // 2. Recent Research Logs (Removed)

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
      const completionNode = sub.timelineNodes?.find(n => {
        if (!n.name || !n.completeDate) return false;
        const nodeName = n.name.toLowerCase();
        return n.name.includes('接收') || nodeName.includes('accept') || nodeName.includes('online');
      });
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
      if (eventDate && !hasPublicationStatus(sub) && sub.status !== 'rejected') sub.status = 'submitted';
    } else if (nodeKey === 'r1_comments') {
      sub.firstDecisionDate = eventDate ? dateInputToIso(eventDate) : null;
    } else if (nodeKey === 'accept' || nodeKey === 'online') {
      sub.decisionDate = eventDate ? dateInputToIso(eventDate) : null;
      if (eventDate) sub.status = nodeKey === 'online' ? 'published' : 'accepted';
    }
    normalizeSubmissionTimeline(sub);
    syncManuscriptStatusFromSubmission(sub);

    await window.storage.saveAll(db);
    closeModal();
    renderDashboard();
    showGlobalToast(tf('eventSavedToast', { name: node.name }), 'success');
  };

  document.getElementById('drawer-btn-delete').onclick = async () => {
    if (confirm(tf('confirmDeleteEvent', { name: node.name }))) {
      deleteTimelineNode(sub, nodeId);
      syncManuscriptStatusFromSubmission(sub);
      await window.storage.saveAll(db);
      closeModal();
      renderDashboard();
      renderKanban();
      renderSubmissions();
      showGlobalToast(t('eventRemovedToast'), 'success');
    }
  };
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
    card.className = `glass-card kanban-card kanban-status-${normalizeKanbanStatusClass(m.status)}`;
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-id', m.id);

    card.innerHTML = `
      <div class="kanban-card-title-row">
        <h4>${escapeHTML(m.title)}</h4>
        <span class="kanban-status-pill">${escapeHTML(getManuscriptStatusLabel(m.status))}</span>
      </div>
      <p>Target: <strong>${m.targetJournals?.[0] || 'TBD'}</strong></p>
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
        <select class="kanban-card-select" id="sel-man-status-${m.id}" style="width: auto; padding: 2px 4px !important; font-size: 10px !important; height: 24px; background:var(--input-bg); border:1px solid var(--input-border); border-radius:6px; color:hsl(var(--text-primary)); outline:none;">
          <option value="idea" ${m.status === 'idea' ? 'selected' : ''}>Idea</option>
          <option value="outline" ${m.status === 'outline' ? 'selected' : ''}>Outline</option>
          <option value="figure_preparation" ${m.status === 'figure_preparation' ? 'selected' : ''}>Figures</option>
          <option value="drafting" ${m.status === 'drafting' ? 'selected' : ''}>Drafting</option>
          <option value="internal_review" ${m.status === 'internal_review' ? 'selected' : ''}>Review</option>
          <option value="submitted" ${m.status === 'submitted' ? 'selected' : ''}>Submitted</option>
          <option value="under_review" ${m.status === 'under_review' ? 'selected' : ''}>Under Review</option>
          <option value="revision" ${m.status === 'revision' ? 'selected' : ''}>Revision</option>
          <option value="accepted" ${m.status === 'accepted' ? 'selected' : ''}>Accepted</option>
          <option value="published" ${m.status === 'published' ? 'selected' : ''}>Published</option>
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
      try {
        const result = await persistManuscriptStatusChange(m, e.target.value);
        renderKanban();
        renderDashboard();
        renderSubmissions();
        showGlobalToast(t('manuscriptStatusUpdated'), 'success');
        if (result.shouldCelebrate) {
          showAcceptanceCelebration({ title: result.manuscript.title, manuscriptId: result.manuscript.id });
        }
      } catch (error) {
        console.error('Manuscript status save failed:', error);
        renderKanban();
        showGlobalToast(error.message || t('autoSaveFailed'), 'error');
      }
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

          try {
            const result = await persistManuscriptStatusChange(man, newStatus);
            renderKanban();
            renderDashboard();
            renderSubmissions();
            showGlobalToast(tf('manuscriptStatusUpdatedTo', { status: getManuscriptStatusLabel(newStatus) }), 'success');
            if (result.shouldCelebrate) {
              showAcceptanceCelebration({ title: result.manuscript.title, manuscriptId: result.manuscript.id });
            }
          } catch (error) {
            console.error('Manuscript status drop save failed:', error);
            renderKanban();
            showGlobalToast(error.message || t('autoSaveFailed'), 'error');
          }
        }
      });
    }
  });
}

function normalizeKanbanStatusClass(status) {
  const normalized = normalizeText(status || 'idea').replace(/_/g, '-');
  if (['idea', 'outline', 'data-collection'].includes(normalized)) return normalized;
  if (['figure-preparation', 'drafting', 'internal-review'].includes(normalized)) return normalized;
  if (['submitted', 'under-review', 'revision'].includes(normalized)) return normalized;
  if (['accepted', 'published'].includes(normalized)) return normalized;
  return 'idea';
}

function getManuscriptStatusLabel(status) {
  const labels = {
    idea: 'Idea',
    outline: 'Outline',
    data_collection: 'Data',
    figure_preparation: 'Figures',
    drafting: 'Drafting',
    internal_review: 'Review',
    submitted: 'Submitted',
    under_review: 'Under Review',
    revision: 'Revision',
    accepted: 'Accepted',
    published: 'Published'
  };
  return labels[status] || String(status || 'Idea').replace(/_/g, ' ');
}

function getSubmissionStatusLabel(status) {
  const canonicalStatus = normalizeSubmissionStatus(status);
  const labels = {
    submitted: t('stateSubmitted'),
    under_review: t('stateUnderReview'),
    revision: t('eventTypeRevision'),
    accepted: t('stateAccepted'),
    published: currentLanguage === 'zh' ? '已发表' : 'Published',
    rejected: t('statusRejected')
  };
  return labels[canonicalStatus] || String(canonicalStatus || t('stateSubmitted')).replace(/_/g, ' ');
}

// Add/Edit Manuscript Modal
document.getElementById('btn-add-manuscript').addEventListener('click', () => {
  openManuscriptModal(null);
});

function splitAcademicAuthors(value) {
  if (Array.isArray(value)) return value.map(normalizeAuthorName).filter(Boolean);
  const text = String(value || '').trim();
  if (!text) return [];
  let authors = text
    .split(/\s*(?:;|；|\n|\band\b|、)\s*/i)
    .map(author => author.trim())
    .filter(Boolean);
  if (authors.length === 1 && text.includes(',')) {
    const commaAuthors = text.split(/\s*,\s*/).map(author => author.trim()).filter(Boolean);
    if (
      commaAuthors.length > 1
      && commaAuthors.length <= 30
      && commaAuthors.every(author => author.split(/\s+/).length <= 6)
    ) {
      authors = commaAuthors;
    }
  }
  return authors;
}

function normalizeAcademicTitle(value) {
  return normalizeText(value).replace(/[^\p{L}\p{N}]+/gu, '');
}

function normalizeAcademicUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    url.hash = '';
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid']
      .forEach(key => url.searchParams.delete(key));
    return url.href.replace(/\/$/, '').toLowerCase();
  } catch (_) {
    return '';
  }
}

function findAcademicManuscriptMatch({ title, doi, articleUrl }) {
  const normalizedDoi = normalizeDoi(doi);
  const normalizedUrl = normalizeAcademicUrl(articleUrl);
  const normalizedTitle = normalizeAcademicTitle(title);
  return db.manuscripts.find(manuscript => {
    const manuscriptDoi = normalizeDoi(manuscript.doi);
    if (normalizedDoi && manuscriptDoi && normalizedDoi === manuscriptDoi) return true;
    const manuscriptUrl = normalizeAcademicUrl(manuscript.articleUrl);
    if (normalizedUrl && manuscriptUrl && normalizedUrl === manuscriptUrl) return true;
    return normalizedTitle
      && normalizedTitle.length >= 16
      && normalizedTitle === normalizeAcademicTitle(manuscript.title);
  }) || null;
}

function academicCaptureProvenance(prefill) {
  if (!prefill) return null;
  return {
    sourceType: prefill.sourceType || 'google-scholar-mirror',
    sourceHost: prefill.sourceHost || '',
    sourcePageUrl: prefill.sourcePageUrl || '',
    pdfUrl: prefill.pdfUrl || '',
    confidenceScore: Number(prefill.confidenceScore) || 0,
    capturedAt: new Date().toISOString(),
    reviewedByUser: true
  };
}

function buildAcademicCaptureSummary(prefill) {
  if (!prefill) return '';
  const source = prefill.sourceHost || prefill.sourceType || 'Google Scholar';
  const confidence = Math.max(0, Math.min(Number(prefill.confidenceScore) || 0, 100));
  return `
    <section class="academic-capture-review" aria-label="${escapeHTML(t('academicCaptureSource'))}">
      <div class="academic-capture-review-icon" aria-hidden="true">S</div>
      <div>
        <strong>${escapeHTML(t('academicCaptureSource'))}</strong>
        <span>${escapeHTML(source)}</span>
      </div>
      <div class="academic-capture-confidence">
        <strong>${escapeHTML(t('academicCaptureConfidence'))}</strong>
        <span>${confidence}%</span>
      </div>
    </section>
  `;
}

function openManuscriptModal(man = null, prefill = null) {
  const isEdit = !!man;
  const initialTitle = isEdit ? man.title : prefill?.title;
  const initialJournal = isEdit ? man.targetJournals?.[0] : prefill?.publication;
  const initialAbstract = isEdit ? man.abstract : prefill?.abstract;
  const initialAuthors = isEdit
    ? (Array.isArray(man.authors) ? man.authors.join('; ') : man.authors)
    : (Array.isArray(prefill?.authorList) && prefill.authorList.length
      ? prefill.authorList.join('; ')
      : prefill?.authors);
  const initialDoi = isEdit ? man.doi : prefill?.doi;
  const initialArticleUrl = isEdit ? man.articleUrl : (prefill?.articleUrl || prefill?.pdfUrl);
  const initialStatus = isEdit ? man.status : (prefill ? 'published' : 'idea');
  openModal(`
    <div class="modal-header">
      <h2>${escapeHTML(isEdit ? t('editManuscriptMetadata') : t('addNewManuscriptTitle'))}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal">✕</button>
    </div>

    ${buildAcademicCaptureSummary(prefill)}

    <div class="form-group">
      <label>${escapeHTML(t('manuscriptTitleLabel'))}</label>
      <input type="text" id="man-title" value="${escapeHTML(initialTitle || '')}" placeholder="${escapeHTML(t('paperTitlePlaceholder'))}">
    </div>

    <div class="grid-cols-2">
      <div class="form-group">
        <label>${escapeHTML(t('writingStatus'))}</label>
        <select id="man-status">
          <option value="idea" ${initialStatus === 'idea' ? 'selected' : ''}>${escapeHTML(t('statusIdea'))}</option>
          <option value="outline" ${initialStatus === 'outline' ? 'selected' : ''}>${escapeHTML(t('statusOutline'))}</option>
          <option value="figure_preparation" ${initialStatus === 'figure_preparation' ? 'selected' : ''}>${escapeHTML(t('statusFiguresPrep'))}</option>
          <option value="drafting" ${initialStatus === 'drafting' ? 'selected' : ''}>${escapeHTML(t('statusDrafting'))}</option>
          <option value="internal_review" ${initialStatus === 'internal_review' ? 'selected' : ''}>${escapeHTML(t('statusInternalReview'))}</option>
          <option value="submitted" ${initialStatus === 'submitted' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('submitted'))}</option>
          <option value="under_review" ${initialStatus === 'under_review' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('under_review'))}</option>
          <option value="revision" ${initialStatus === 'revision' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('revision'))}</option>
          <option value="accepted" ${initialStatus === 'accepted' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('accepted'))}</option>
          <option value="published" ${initialStatus === 'published' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('published'))}</option>
        </select>
      </div>
      <div class="form-group">
        <label>${escapeHTML(t('targetJournalInput'))}</label>
        <input type="text" id="man-journal" value="${escapeHTML(initialJournal || '')}" placeholder="${escapeHTML(t('targetJournalPlaceholder'))}">
      </div>
    </div>

    <div class="form-group">
      <label>${escapeHTML(t('authorsLabel'))}</label>
      <input type="text" id="man-authors" value="${escapeHTML(initialAuthors || '')}" placeholder="A. Researcher; B. Scientist">
    </div>

    <div class="grid-cols-2">
      <div class="form-group">
        <label>${escapeHTML(t('doiLabel'))}</label>
        <input type="text" id="man-doi" value="${escapeHTML(initialDoi || '')}" placeholder="10.xxxx/xxxxx">
      </div>
      <div class="form-group">
        <label>${escapeHTML(t('scholarSourcePage'))}</label>
        <input type="url" id="man-article-url" value="${escapeHTML(initialArticleUrl || '')}" placeholder="https://…">
      </div>
    </div>

    <div class="form-group">
      <label>${escapeHTML(t('abstractDraft'))}</label>
      <textarea id="man-abstract" placeholder="${escapeHTML(t('abstractPlaceholder'))}">${escapeHTML(initialAbstract || '')}</textarea>
    </div>

    <button class="btn-primary w-full" id="btn-submit-man">${escapeHTML(isEdit ? t('saveChanges') : t('createManuscript'))}</button>
  `);

  document.getElementById('btn-submit-man').addEventListener('click', async () => {
    const title = document.getElementById('man-title').value.trim();
    const status = document.getElementById('man-status').value;
    const journal = document.getElementById('man-journal').value.trim();
    const authors = splitAcademicAuthors(document.getElementById('man-authors').value);
    const doi = normalizeDoi(document.getElementById('man-doi').value);
    const articleUrl = document.getElementById('man-article-url').value.trim();
    const abstract = document.getElementById('man-abstract').value.trim();

    if (!title) {
      alert(t('manuscriptTitleRequired'));
      return;
    }

    const duplicate = !isEdit && prefill
      ? findAcademicManuscriptMatch({ title, doi, articleUrl })
      : null;
    if (duplicate && !confirm(t('academicDuplicateConfirm'))) return;

    const targetManuscript = isEdit ? man : duplicate;
    if (targetManuscript) {
      // The manuscript editor no longer exposes project context. Preserve a
      // legacy relationship on edits so existing records remain intact, while
      // new manuscripts stay independent of the retired project framework.
      targetManuscript.title = title;
      setManuscriptStatus(targetManuscript, status);
      targetManuscript.targetJournals = journal ? [journal] : [];
      targetManuscript.abstract = abstract;
      targetManuscript.authors = authors;
      targetManuscript.firstAuthor = authors[0] || targetManuscript.firstAuthor || null;
      targetManuscript.doi = doi || null;
      targetManuscript.articleUrl = articleUrl || null;
      if (prefill) targetManuscript.academicCaptureProvenance = academicCaptureProvenance(prefill);
      targetManuscript.updatedAt = new Date().toISOString();
    } else {
      const newMan = {
        id: 'man_' + Math.random().toString(36).substring(2, 9),
        userId: 'user',
        title,
        shortTitle: null,
        manuscriptType: 'article',
        status,
        abstract,
        keywords: [],
        authors,
        firstAuthor: authors[0] || null,
        correspondingAuthors: [],
        targetJournals: journal ? [journal] : [],
        doi: doi || null,
        articleUrl: articleUrl || null,
        academicCaptureProvenance: academicCaptureProvenance(prefill),
        currentVersion: '1.0',
        plannedFigures: [],
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.manuscripts.push(newMan);
    }

    await window.storage.saveAll(db);
    if (prefill) await chrome.storage.local.remove(PENDING_ACADEMIC_DRAFT_KEY);
    closeModal();
    renderKanban();
    renderDashboard();
    renderSubmissions();
    showGlobalToast(
      duplicate
        ? t('academicDuplicateUpdated')
        : (prefill ? t('academicCaptureSaved') : 'Manuscripts updated!'),
      'success'
    );
  });
}

// --- VIEW 5: SUBMISSIONS & REBUTTAL MATRIX ---
function focusSubmissionEditCenter() {
  const detailPanel = document.getElementById('submission-detail-panel');
  const editCenter = detailPanel?.querySelector('#submission-entry-editor-panel');
  const titleInput = editCenter?.querySelector('#sub-edit-title');
  if (!detailPanel || !editCenter) return;

  const panelRect = detailPanel.getBoundingClientRect();
  const editorRect = editCenter.getBoundingClientRect();
  const targetTop = Math.max(detailPanel.scrollTop + editorRect.top - panelRect.top - 12, 0);
  if (typeof detailPanel.scrollTo === 'function') {
    detailPanel.scrollTo({ top: targetTop, behavior: 'smooth' });
  } else {
    detailPanel.scrollTop = targetTop;
  }

  editCenter.classList.remove('submission-edit-center-focused');
  void editCenter.offsetWidth;
  editCenter.classList.add('submission-edit-center-focused');
  window.setTimeout(() => editCenter.classList.remove('submission-edit-center-focused'), 2400);

  if (titleInput) {
    window.requestAnimationFrame(() => {
      try {
        titleInput.focus({ preventScroll: true });
      } catch (error) {
        titleInput.focus();
      }
      titleInput.select();
    });
  }
}

function openSubmissionForEditing(sub, options = {}) {
  selectedSubmissionId = sub.id;
  renderSubmissions();
  renderSubmissionDetails(sub);
  if (options.focusEditCenter) {
    requestAnimationFrame(focusSubmissionEditCenter);
  }
}

function getDefaultSubmissionChecklistKeys() {
  return [
    { key: 'cover_letter_ready', label: 'Cover Letter drafted' },
    { key: 'title_page_ready', label: 'Title page formatted' },
    { key: 'data_availability_statement', label: 'Data Availability statement' },
    { key: 'author_contribution', label: 'CRedIT Author statements' },
    { key: 'figure_resolution_checked', label: 'High-res figures checked' },
    { key: 'conflict_of_interest', label: 'Conflict of Interest statement' }
  ];
}

function getSubmissionChecklistKeys(sub) {
  return Array.isArray(sub?.complianceChecklistKeys) && sub.complianceChecklistKeys.length > 0
    ? sub.complianceChecklistKeys
    : getDefaultSubmissionChecklistKeys();
}

function getSubmissionReviewMatrixRows(sub) {
  if (Array.isArray(sub?.reviewMatrix)) return sub.reviewMatrix;
  if (Array.isArray(sub?.rebuttalMatrix)) return sub.rebuttalMatrix;
  return [];
}

function collectSubmissionChecklistFromEditor() {
  const compliance = {};
  document.querySelectorAll('#sub-edit-compliance-checklist-container [data-checklist-key]').forEach(input => {
    compliance[input.dataset.checklistKey] = input.checked;
  });
  return compliance;
}

function collectSubmissionChecklistKeysFromEditor() {
  return Array.from(document.querySelectorAll('#sub-edit-compliance-checklist-container [data-checklist-key]')).map(input => ({
    key: input.dataset.checklistKey,
    label: input.dataset.checklistLabel || input.dataset.checklistKey
  }));
}

function collectSubmissionReviewMatrixFromEditor() {
  return Array.from(document.querySelectorAll('#sub-edit-review-matrix-container .submission-edit-review-row')).map((row, index) => ({
    id: row.dataset.reviewId || `rev_${Date.now()}_${index}`,
    comment: row.querySelector('.sub-edit-review-comment')?.value || '',
    response: row.querySelector('.sub-edit-review-response')?.value || '',
    recordId: row.dataset.recordId || ''
  }));
}

function createSubmissionReviewEditorRow(row = {}, index = 0) {
  const safeId = String(row.id || `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const rowDiv = document.createElement('div');
  rowDiv.className = 'submission-edit-review-row';
  rowDiv.dataset.reviewId = safeId;
  rowDiv.dataset.recordId = row.recordId || '';
  rowDiv.innerHTML = `
    <div class="submission-edit-review-field">
      <div class="submission-edit-review-label">${escapeHTML(tf('reviewerCommentLabel', { count: index + 1 }))}</div>
      <textarea class="sub-edit-review-comment" placeholder="${escapeHTML(t('reviewerCommentPlaceholder'))}">${escapeHTML(row.comment || '')}</textarea>
      <div class="submission-edit-review-actions">
        <button type="button" class="btn-danger btn-icon btn-delete-review-row" title="${escapeHTML(t('removeComment'))}">
          <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
    <div class="submission-edit-review-field">
      <div class="submission-edit-review-label-row">
        <div class="submission-edit-review-label">${escapeHTML(t('authorResponseLabel'))}</div>
        <button type="button" class="btn-secondary btn-copy-review-response">
          <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span>${escapeHTML(t('copy'))}</span>
        </button>
      </div>
      <textarea class="sub-edit-review-response" placeholder="${escapeHTML(t('authorResponsePlaceholder'))}">${escapeHTML(row.response || '')}</textarea>
    </div>
  `;
  return rowDiv;
}

function reindexSubmissionReviewEditorRows(container) {
  container.querySelectorAll('.submission-edit-review-row').forEach((row, index) => {
    const label = row.querySelector('.submission-edit-review-label');
    if (label) label.textContent = tf('reviewerCommentLabel', { count: index + 1 });
  });
}

function renderSubmissionChecklistEditor(sub, checklistKeys) {
  const checklistBox = document.getElementById('sub-edit-compliance-checklist-container');
  if (!checklistBox) return;
  const compliance = sub.complianceChecklist && typeof sub.complianceChecklist === 'object' && !Array.isArray(sub.complianceChecklist)
    ? sub.complianceChecklist
    : {};
  checklistBox.innerHTML = '';
  checklistKeys.forEach(chk => {
    const label = document.createElement('label');
    label.className = 'submission-edit-check-item';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = compliance[chk.key] === true;
    input.dataset.checklistKey = chk.key;
    input.dataset.checklistLabel = chk.label;

    label.appendChild(input);
    label.appendChild(document.createTextNode(chk.label));
    checklistBox.appendChild(label);
  });
}

function renderSubmissionReviewMatrixEditor(sub, manAbstract) {
  const reviewBox = document.getElementById('sub-edit-review-matrix-container');
  const addButton = document.getElementById('btn-add-review-comment');
  if (!reviewBox) return;
  const rows = getSubmissionReviewMatrixRows(sub);
  reviewBox.innerHTML = '';
  if (rows.length === 0) {
    reviewBox.innerHTML = `<p class="empty-state">${escapeHTML(t('emptyReviewEditor'))}</p>`;
  } else {
    rows.forEach((row, index) => {
      reviewBox.appendChild(createSubmissionReviewEditorRow(row, index));
    });
  }

  if (addButton) {
    addButton.addEventListener('click', () => {
      const empty = reviewBox.querySelector('.empty-state');
      if (empty) reviewBox.innerHTML = '';
      reviewBox.appendChild(createSubmissionReviewEditorRow({ comment: '', response: '', recordId: '' }, reviewBox.querySelectorAll('.submission-edit-review-row').length));
      reviewBox.dispatchEvent(new CustomEvent('submission-autosave-request', {
        bubbles: true,
        detail: { immediate: true }
      }));
    });
  }

  reviewBox.addEventListener('click', async event => {
    const copyButton = event.target.closest('.btn-copy-review-response');
    if (copyButton) {
      const row = copyButton.closest('.submission-edit-review-row');
      const responseText = row?.querySelector('.sub-edit-review-response')?.value.trim() || '';
      if (!responseText) {
        showGlobalToast(t('responsePending'), 'warning');
        return;
      }
      try {
        await navigator.clipboard.writeText(responseText);
        showGlobalToast(t('copy'), 'success');
      } catch (_) {
        showGlobalToast('Copy failed', 'danger');
      }
      return;
    }

    const deleteButton = event.target.closest('.btn-delete-review-row');
    if (deleteButton) {
      const row = deleteButton.closest('.submission-edit-review-row');
      row?.remove();
      reindexSubmissionReviewEditorRows(reviewBox);
      if (reviewBox.querySelectorAll('.submission-edit-review-row').length === 0) {
        reviewBox.innerHTML = `<p class="empty-state">${escapeHTML(t('emptyReviewEditor'))}</p>`;
      }
      reviewBox.dispatchEvent(new CustomEvent('submission-autosave-request', {
        bubbles: true,
        detail: { immediate: true }
      }));
      return;
    }

  });
}

function renderSubmissionReviewPreview(sub, checklistKeys) {
  const previewBox = document.getElementById('submission-review-preview');
  if (!previewBox) return;
  const compliance = sub.complianceChecklist && typeof sub.complianceChecklist === 'object' && !Array.isArray(sub.complianceChecklist)
    ? sub.complianceChecklist
    : {};
  const completedChecks = checklistKeys.filter(chk => compliance[chk.key] === true).length;
  const reviewRows = getSubmissionReviewMatrixRows(sub);
  const reviewPreview = reviewRows.length
    ? reviewRows.map((row, index) => `
        <div class="submission-review-preview-row">
          <strong>${escapeHTML(tf('reviewerCommentLabel', { count: index + 1 }))}</strong>
          <p>${escapeHTML(row.comment || t('noCommentText'))}</p>
          <span>${escapeHTML(row.response ? t('responseSaved') : t('responsePending'))}</span>
        </div>
      `).join('')
    : `<p class="empty-state">${escapeHTML(t('emptyReviewPreview'))}</p>`;
  previewBox.innerHTML = `
    <div class="workflow-context-grid submission-review-preview-grid">
      <div class="workflow-context-item"><span>${escapeHTML(t('checklistLabel'))}</span><strong>${completedChecks}/${checklistKeys.length}</strong></div>
      <div class="workflow-context-item"><span>${escapeHTML(t('workflowReviewerCommentsLabel'))}</span><strong>${reviewRows.length}</strong></div>
      <div class="workflow-context-item"><span>${escapeHTML(t('responsesLabel'))}</span><strong>${reviewRows.filter(row => row.response).length}/${reviewRows.length}</strong></div>
    </div>
    <div class="submission-review-preview-list">${reviewPreview}</div>
  `;
}

function getSubmissionEditValues(prefix) {
  return {
    title: document.getElementById(`${prefix}-title`).value,
    firstAuthor: document.getElementById(`${prefix}-first-author`)?.value || '',
    journal: document.getElementById(`${prefix}-journal`).value,
    journalUrl: document.getElementById(`${prefix}-journal-url`).value,
    status: document.getElementById(`${prefix}-status`).value,
    submissionDate: document.getElementById(`${prefix}-submission-date`).value,
    firstDecisionDate: document.getElementById(`${prefix}-r1-date`).value,
    revisionDueDate: document.getElementById(`${prefix}-revision-due`).value,
    decisionDate: document.getElementById(`${prefix}-decision-date`).value,
    doi: document.getElementById(`${prefix}-doi`).value,
    articleUrl: document.getElementById(`${prefix}-article-url`).value,
    complianceChecklist: collectSubmissionChecklistFromEditor(),
    complianceChecklistKeys: collectSubmissionChecklistKeysFromEditor(),
    reviewMatrix: collectSubmissionReviewMatrixFromEditor()
  };
}

function applySubmissionEditSync(sub, man, syncPlan) {
  if (man) {
    Object.assign(man, syncPlan.manuscriptPatch);
    man.updatedAt = new Date().toISOString();
  } else {
    sub.title = syncPlan.detachedSubmissionTitle;
  }

  Object.assign(sub, syncPlan.submissionPatch);

  if (syncPlan.shouldMarkRejected) {
    markSubmissionRejected(sub, syncPlan.rejectionDate || todayString());
  } else {
    sub.status = syncPlan.submissionPatch.status;
  }

  if (syncPlan.submissionPatch.status === 'accepted') {
    sub.acceptedAt = sub.decisionDate || sub.acceptedAt || new Date().toISOString();
  } else if (syncPlan.submissionPatch.status === 'published') {
    sub.publishedAt = sub.decisionDate || sub.publishedAt || new Date().toISOString();
    sub.acceptedAt = sub.acceptedAt || sub.publishedAt;
  }

  if (syncPlan.publicationPatch) {
    const doi = normalizeDoi(syncPlan.publicationPatch.doi);
    sub.doi = doi || null;
    sub.articleUrl = syncPlan.publicationPatch.articleUrl || (doi ? `https://doi.org/${doi}` : null);
  } else if (syncPlan.shouldClearPublication) {
    clearPublicationLinkFields(sub);
    clearPublicationTimelineCompletion(sub);
  }

  sub.updatedAt = new Date().toISOString();
  normalizeSubmissionTimeline(sub);
  syncManuscriptStatusFromSubmission(sub);
}

function refreshSubmissionStatusPresentation(sub) {
  const detailPanel = document.getElementById('submission-detail-panel');
  if (!detailPanel || detailPanel.dataset.currentSubmissionId !== sub.id) return;

  const status = normalizeSubmissionStatus(sub.status);
  const statusText = getSubmissionStatusLabel(status);
  const badgeClass = window.RFUI.getSubmissionStatusBadgeClass(status);
  detailPanel.querySelectorAll('[data-submission-status-badge]').forEach(badge => {
    badge.className = badgeClass;
    badge.textContent = badge.dataset.submissionStatusBadge === 'stage'
      ? `${t('currentStageLabel')}: ${statusText}`
      : statusText;
  });

  const summary = detailPanel.querySelector('[data-submission-status-summary]');
  if (summary) {
    const analysis = analyzeSubmission(sub);
    const submitDate = normalizeDateString(sub.submissionDate || analysis.submitDate);
    summary.textContent = `${getSubmissionJournalName(sub)} / ${statusText} / ${t('milestoneSubmission')} ${submitDate || t('noDate')}`;
  }

  const cycle = getSubmissionCycleTime(sub);
  const cycleCard = detailPanel.querySelector('[data-submission-cycle-card]');
  if (cycleCard) {
    cycleCard.classList.toggle('submission-cycle-card-complete', cycle.isCompleted);
    cycleCard.classList.toggle('submission-cycle-card-active', !cycle.isCompleted);
    const label = cycleCard.querySelector('[data-submission-cycle-label]');
    const text = cycleCard.querySelector('[data-submission-cycle-text]');
    const icon = cycleCard.querySelector('.submission-cycle-icon');
    if (label) label.textContent = t(cycle.isCompleted ? 'cycleTimeCompleted' : 'submissionCycleTracking');
    if (text) {
      text.textContent = cycle.isCompleted
        ? tf('cycleTimeCompletedText', { start: cycle.startDateStr, end: cycle.endDateStr, days: cycle.days })
        : tf('submissionCycleText', { start: cycle.startDateStr, days: cycle.days });
    }
    if (icon) {
      icon.innerHTML = cycle.isCompleted
        ? '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>'
        : '<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>';
    }
  }
}

async function saveSubmissionEditFromValues(sub, prefix, options = {}) {
  const editValues = getSubmissionEditValues(prefix);
  const syncPlan = window.RFUI.buildSubmissionEditSyncPlan(editValues);
  if (!syncPlan.ok) {
    if (options.alertOnError !== false) alert(syncPlan.error);
    if (typeof options.onValidationError === 'function') options.onValidationError(syncPlan.error);
    return false;
  }

  const liveSub = db.submissions.find(item => item.id === sub.id);
  if (!liveSub) throw new Error(t('submissionNotFound'));
  const previousStatus = normalizeSubmissionStatus(liveSub.status);
  const workingDatabase = typeof structuredClone === 'function'
    ? structuredClone(db)
    : JSON.parse(JSON.stringify(db));
  const workingSub = workingDatabase.submissions.find(item => item.id === sub.id);
  if (!workingSub) throw new Error(t('submissionNotFound'));
  const workingMan = workingDatabase.manuscripts.find(item => item.id === workingSub.manuscriptId);

  applySubmissionEditSync(workingSub, workingMan, syncPlan);
  const firstAuthor = String(editValues.firstAuthor || '').trim().slice(0, 160);
  workingSub.firstAuthor = firstAuthor || null;
  if (workingMan) workingMan.firstAuthor = firstAuthor || null;
  workingSub.complianceChecklist = editValues.complianceChecklist;
  workingSub.complianceChecklistKeys = editValues.complianceChecklistKeys;
  workingSub.reviewMatrix = editValues.reviewMatrix;
  const savedDatabase = await window.storage.saveAll(workingDatabase, {
    mergeOnConflict: options.mergeOnConflict === true
  });
  db = savedDatabase || workingDatabase;
  const savedSub = db.submissions.find(item => item.id === sub.id);
  if (!savedSub) throw new Error(t('submissionNotFound'));
  Object.assign(sub, savedSub);

  const shouldCelebrate = window.RFUI.shouldCelebrateAcceptance(
    previousStatus,
    normalizeSubmissionStatus(savedSub.status)
  );
  renderDashboard();
  renderKanban();
  renderSubmissions();
  if (options.renderDetails !== false) renderSubmissionDetails(savedSub);
  else refreshSubmissionStatusPresentation(savedSub);
  if (options.notify !== false) showGlobalToast(t('submissionEditsSaved'), 'success');
  if (shouldCelebrate) showAcceptanceCelebration(savedSub);
  return true;
}

function setupSubmissionAutoSave(sub) {
  submissionAutoSaveCleanup?.();
  const editCenter = document.getElementById('submission-entry-editor-panel');
  const status = editCenter?.querySelector('[data-submission-autosave-status]');
  if (!editCenter || !status) return;

  let debounceTimer = null;
  let revision = 0;
  let saveChain = Promise.resolve();
  let lastSavedSnapshot = JSON.stringify(getSubmissionEditValues('sub-edit'));
  const debounceMs = 650;

  const setStatus = (state, message, detail = '') => {
    if (!editCenter.isConnected) return;
    status.dataset.state = state;
    status.title = detail || '';
    const label = status.querySelector('[data-submission-autosave-label]');
    if (label) label.textContent = message;
  };

  const persist = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    const requestedRevision = revision;
    setStatus('saving', t('autoSaveSaving'));

    saveChain = saveChain
      .catch(() => {})
      .then(async () => {
        if (!editCenter.isConnected) return;
        const currentSnapshot = JSON.stringify(getSubmissionEditValues('sub-edit'));
        if (currentSnapshot === lastSavedSnapshot) {
          if (requestedRevision === revision) setStatus('saved', t('autoSaveSaved'));
          return;
        }
        let validationError = '';
        const saved = await saveSubmissionEditFromValues(sub, 'sub-edit', {
          alertOnError: false,
          renderDetails: false,
          notify: false,
          mergeOnConflict: true,
          onValidationError: error => {
            validationError = error;
          }
        });
        if (!editCenter.isConnected) return;
        if (!saved) {
          setStatus('invalid', t('autoSaveInvalid'), validationError);
          return;
        }
        lastSavedSnapshot = currentSnapshot;
        if (requestedRevision === revision) {
          setStatus('saved', t('autoSaveSaved'));
          renderSubmissionReviewPreview(sub, getSubmissionChecklistKeys(sub));
        }
      })
      .catch(error => {
        console.error('Submission auto-save failed:', error);
        setStatus('error', t('autoSaveFailed'), String(error?.message || error || ''));
      });
  };

  const requestSave = ({ immediate = false } = {}) => {
    revision += 1;
    if (debounceTimer) clearTimeout(debounceTimer);
    setStatus('pending', t('autoSavePending'));
    if (immediate) {
      persist();
    } else {
      debounceTimer = window.setTimeout(persist, debounceMs);
    }
  };

  editCenter.addEventListener('input', event => {
    const control = event.target;
    if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) return;
    if (control.type === 'checkbox' || control.type === 'radio') return;
    requestSave();
  });

  editCenter.addEventListener('change', event => {
    const control = event.target;
    if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement)) return;
    requestSave({ immediate: true });
  });

  editCenter.addEventListener('submission-autosave-request', event => {
    requestSave({ immediate: event.detail?.immediate !== false });
  });

  const flushPendingSave = () => {
    if (debounceTimer) persist();
  };
  const flushWhenHidden = () => {
    if (document.visibilityState === 'hidden') flushPendingSave();
  };
  window.addEventListener('pagehide', flushPendingSave);
  document.addEventListener('visibilitychange', flushWhenHidden);
  submissionAutoSaveCleanup = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    window.removeEventListener('pagehide', flushPendingSave);
    document.removeEventListener('visibilitychange', flushWhenHidden);
    submissionAutoSaveCleanup = null;
  };
}

function renderSubmissions() {
  const container = document.getElementById('submissions-list-container');
  container.innerHTML = '';

  if (db.submissions.length === 0) {
    container.innerHTML = `<p class="empty-state">${escapeHTML(t('noSubmissionsTracked'))}</p>`;
    selectedSubmissionId = null;
  } else {
    const sortedSubmissions = sortDashboardSubmissions(db.submissions);
    if (!sortedSubmissions.some(sub => sub.id === selectedSubmissionId)) {
      selectedSubmissionId = sortedSubmissions[0].id;
    }
    const selectedSubmission = sortedSubmissions.find(sub => sub.id === selectedSubmissionId) || sortedSubmissions[0];

    sortedSubmissions.forEach((sub, index) => {
      const displayIndex = sortedSubmissions.length - index;
      const card = document.createElement('div');
      card.className = `glass-card submission-card-item ${sub.id === selectedSubmissionId ? 'selected' : ''}`;

      // Find linked manuscript
      const man = db.manuscripts.find(m => m.id === sub.manuscriptId);
      const manTitle = man ? man.title : (sub.title || t('untitledManuscript'));
      const journalName = getSubmissionJournalName(sub);
      const statusText = getSubmissionStatusLabel(sub.status || 'submitted');
      const transferText = sub.previousJournal
        ? `<span class="submission-card-meta">${escapeHTML(t('transferToJournal'))}: ${escapeHTML(sub.previousJournal)}</span>`
        : '';

      card.innerHTML = `
        <div class="submission-card-heading">
          <div class="submission-card-title-group">
            <span class="submission-index">${displayIndex}</span>
            <div class="submission-card-copy">
              <h4>${escapeHTML(journalName)}</h4>
              <p class="submission-card-title">${escapeHTML(manTitle)}</p>
            </div>
          </div>
          <button class="btn-secondary btn-icon submission-card-edit btn-edit-submission" data-sub-id="${escapeHTML(sub.id)}" title="${escapeHTML(t('editFields'))}">
            <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
          </button>
        </div>
        <div class="submission-card-footer">
          <span class="${window.RFUI.getSubmissionStatusBadgeClass(sub.status)}">${escapeHTML(statusText)}</span>
          ${transferText}
        </div>
      `;

      card.addEventListener('click', () => {
        openSubmissionForEditing(sub);
      });

      const editButton = card.querySelector('.btn-edit-submission');
      editButton.addEventListener('click', (event) => {
        event.stopPropagation();
        openSubmissionForEditing(sub, { focusEditCenter: true });
      });

      container.appendChild(card);
    });

    const detailPanel = document.getElementById('submission-detail-panel');
    if (detailPanel?.dataset.currentSubmissionId !== selectedSubmission.id) {
      renderSubmissionDetails(selectedSubmission);
    }
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
    portalList.innerHTML = `<p class="empty-state" style="padding: 12px; font-size: 11px;">${escapeHTML(t('portalEmpty'))}</p>`;
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
    card.title = `${portal.name} - ${domain}`;

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
        <button class="btn-delete-portal" title="${escapeHTML(t('portalDeleteTitle'))}" data-id="${portal.id}">
          ✕
        </button>
      </div>
    `;

    // Hook up delete listener
    const deleteBtn = card.querySelector('.btn-delete-portal');
    deleteBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (confirm(tf('portalDeleteConfirm', { name: portal.name }))) {
        db.settings.journalPortals = db.settings.journalPortals.filter(p => p.id !== portal.id);
        await window.storage.saveAll(db);
        renderJournalPortals();
        showGlobalToast(tf('portalDeletedToast', { name: portal.name }), 'success');
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
          <h2>${escapeHTML(t('addPortalTitle'))}</h2>
          <button class="btn-secondary btn-icon" id="btn-close-modal">✕</button>
        </div>

        <div class="form-group">
          <label>${escapeHTML(t('portalNameLabel'))}</label>
          <input type="text" id="portal-name" placeholder="${escapeHTML(t('portalNamePlaceholder'))}">
        </div>

        <div class="form-group">
          <label>${escapeHTML(t('portalUrlLabel'))}</label>
          <input type="url" id="portal-url" placeholder="https://...">
        </div>

        <div class="form-group">
          <label>${escapeHTML(t('portalColorLabel'))}</label>
          <div style="display: flex; gap: 12px; align-items: center;">
            <input type="color" id="portal-color" value="#8b5cf6" style="width: 48px; height: 36px; border: none; border-radius: 6px; cursor: pointer; padding: 0; background: transparent;">
            <span style="font-size: 12px; color: hsl(var(--text-muted));">${escapeHTML(t('portalColorHelp'))}</span>
          </div>
        </div>

        <button class="btn-primary w-full" id="btn-save-portal" style="margin-top:12px;">${escapeHTML(t('addPortalButton'))}</button>
      `);

      const saveBtn = document.getElementById('btn-save-portal');
      if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
          const name = document.getElementById('portal-name').value.trim();
          const url = document.getElementById('portal-url').value.trim();
          const color = document.getElementById('portal-color').value;

          if (!name || !url) {
            alert(t('fillAllFields'));
            return;
          }

          try {
            new URL(url);
          } catch (err) {
            alert(t('validUrlRequired'));
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
          showGlobalToast(tf('portalAddedToast', { name }), 'success');
        });
      }
    });
  }
}

function openLinkSubmissionModal(submission) {
  const manuscripts = Array.isArray(db.manuscripts) ? db.manuscripts : [];
  if (manuscripts.length === 0) {
    showGlobalToast(t('noManuscriptsToLink'), 'warning');
    return;
  }

  const manuscriptOptions = manuscripts
    .slice()
    .sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')))
    .map(manuscript => `
      <option value="${escapeHTML(manuscript.id)}">${escapeHTML(manuscript.title || t('untitledManuscript'))}</option>
    `)
    .join('');

  openModal(`
    <div class="modal-header">
      <div>
        <h2>${escapeHTML(t('linkSubmissionTitle'))}</h2>
        <p class="text-muted">${escapeHTML(t('linkSubmissionHelp'))}</p>
      </div>
      <button class="btn-secondary btn-icon" id="btn-close-modal" aria-label="${escapeHTML(t('cancel'))}">✕</button>
    </div>
    <div class="form-group">
      <label for="submission-link-manuscript">${escapeHTML(t('workflowManuscriptLabel'))}</label>
      <select id="submission-link-manuscript">${manuscriptOptions}</select>
    </div>
    <button type="button" class="btn-primary w-full" id="btn-confirm-submission-link">
      ${escapeHTML(t('linkSubmissionConfirm'))}
    </button>
  `);

  document.getElementById('btn-confirm-submission-link').addEventListener('click', async () => {
    const manuscriptId = document.getElementById('submission-link-manuscript').value;
    const manuscript = db.manuscripts.find(item => item.id === manuscriptId);
    if (!manuscript) return;
    submission.manuscriptId = manuscript.id;
    submission.projectId = manuscript.projectId || submission.projectId || null;
    submission.updatedAt = new Date().toISOString();
    await window.storage.saveAll(db);
    closeModal();
    renderDashboard();
    renderKanban();
    renderSubmissions();
    showGlobalToast(t('linkSubmissionSaved'), 'success');
  });
}

function renderSubmissionDetails(sub) {
  sub.status = normalizeSubmissionStatus(sub.status);
  normalizeSubmissionTimeline(sub);
  const detailPanel = document.getElementById('submission-detail-panel');
  const man = db.manuscripts.find(m => m.id === sub.manuscriptId);
  const project = db.projects.find(item => item.id === (sub.projectId || man?.projectId));
  const relationship = window.RFUI.buildSubmissionRelationshipSummary({
    submission: sub,
    manuscript: man,
    project,
    records: db.researchRecords
  });
  const manuscriptTitle = man ? man.title : (sub.title || t('untitledManuscript'));
  const manAbstract = man ? man.abstract || '' : '';
  const firstAuthor = getSubmissionFirstAuthor(sub, man);
  const journalName = getSubmissionJournalName(sub);
  const submissionJournalUrl = sub.journalUrl || sub.submissionUrl || '';
  const submissionDoi = getSubmissionDoi(sub);
  const articleUrl = getSubmissionArticleUrl(sub);
  const timelineAnalysis = analyzeSubmission(sub);
  const timelineSubmissionDate = normalizeDateString(sub.submissionDate || timelineAnalysis.submitDate);
  const timelineFirstDecisionDate = normalizeDateString(sub.firstDecisionDate || timelineAnalysis.r1Date);
  const timelineRevisionDueDate = normalizeDateString(sub.revisionDueDate);
  const timelineDecisionDate = normalizeDateString(sub.decisionDate || timelineAnalysis.acceptDate || timelineAnalysis.onlineDate);
  const statusText = getSubmissionStatusLabel(sub.status || 'submitted');
  const statusBadgeClass = window.RFUI.getSubmissionStatusBadgeClass(sub.status || 'submitted');
  const relationshipSummaryLine = tf('relationshipSummaryLine', {
    manuscript: relationship.manuscriptTitle,
    timeline: relationship.timelineNodeCount,
    comments: relationship.reviewerCommentCount
  });

  // Cycle time duration calculations
  const cycle = getSubmissionCycleTime(sub);
  let cycleTimeHtml = '';

  if (cycle.isCompleted) {
    cycleTimeHtml = `
      <div class="submission-cycle-card submission-cycle-card-complete" data-submission-cycle-card>
        <span class="submission-cycle-icon" aria-hidden="true">
          <svg class="svg-icon" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
        </span>
        <div class="submission-cycle-copy">
          <span class="submission-cycle-label" data-submission-cycle-label>${escapeHTML(t('cycleTimeCompleted'))}</span>
          <span data-submission-cycle-text>${tf('cycleTimeCompletedText', { start: `<strong>${escapeHTML(cycle.startDateStr)}</strong>`, end: `<strong>${escapeHTML(cycle.endDateStr)}</strong>`, days: `<strong>${cycle.days}</strong>` })}</span>
        </div>
      </div>
    `;
  } else {
    cycleTimeHtml = `
      <div class="submission-cycle-card submission-cycle-card-active" data-submission-cycle-card>
        <span class="submission-cycle-icon" aria-hidden="true">
          <svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>
        </span>
        <div class="submission-cycle-copy">
          <span class="submission-cycle-label" data-submission-cycle-label>${escapeHTML(t('submissionCycleTracking'))}</span>
          <span data-submission-cycle-text>${tf('submissionCycleText', { start: `<strong>${escapeHTML(cycle.startDateStr)}</strong>`, days: `<strong>${cycle.days}</strong>` })}</span>
        </div>
      </div>
    `;
  }

  detailPanel.innerHTML = `
    <div class="submission-detail-hero">
      <div class="submission-detail-heading">
        <span class="submission-detail-kicker">${escapeHTML(t('submissionDetailKicker'))}</span>
        <h2>${escapeHTML(journalName)}</h2>
      </div>
      <button class="btn-danger btn-icon submission-delete-button" id="btn-delete-sub" title="${escapeHTML(t('deleteSubmissionTitle'))}">
        <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      </button>
    </div>

    <!-- Timeline indicators -->
    <div class="submission-detail-meta">
      <span class="${statusBadgeClass}" data-submission-status-badge="stage">${escapeHTML(t('currentStageLabel'))}: ${escapeHTML(statusText)}</span>
      <span class="recent-item-date">${escapeHTML(t('trackedSinceLabel'))}: ${sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : t('noDate')}</span>
    </div>

    <div class="glass-card workflow-context-card" data-submission-workflow-context="true">
      <div class="workflow-context-head">
        <div class="submission-work-title">
          <span class="submission-work-icon" aria-hidden="true">
            <svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 3v18"/><path d="M5 8h14"/><path d="M5 16h14"/><circle cx="12" cy="8" r="2"/><circle cx="12" cy="16" r="2"/></svg>
          </span>
          <div>
            <h3>${escapeHTML(t('workflowContextTitle'))}</h3>
            <p>${escapeHTML(relationshipSummaryLine)}</p>
          </div>
        </div>
        <div class="workflow-context-actions">
          ${relationship.isOrphanSubmission ? `
            <span class="badge badge-warning">${escapeHTML(t('workflowNeedsLinking'))}</span>
            <button type="button" class="btn-secondary workflow-link-button" id="btn-link-submission-manuscript">
              ${escapeHTML(t('linkManuscript'))}
            </button>
          ` : `<span class="badge badge-success">${escapeHTML(t('workflowLinkedFlow'))}</span>`}
        </div>
      </div>
      <div class="workflow-context-grid">
        <div class="workflow-context-item">
          <span>${escapeHTML(t('workflowManuscriptLabel'))}</span>
          <strong>${escapeHTML(relationship.manuscriptTitle)}</strong>
        </div>
        <div class="workflow-context-item">
          <span>${escapeHTML(t('workflowTimelineLabel'))}</span>
          <strong>${relationship.completedTimelineNodeCount}/${relationship.timelineNodeCount}</strong>
        </div>
        <div class="workflow-context-item">
          <span>${escapeHTML(t('workflowReviewerCommentsLabel'))}</span>
          <strong>${relationship.reviewerCommentCount}</strong>
        </div>
      </div>
      <div class="workflow-edit-summary" data-editor-summary="true">
        <div class="workflow-edit-summary-copy">
          <span class="workflow-edit-summary-kicker">${escapeHTML(t('editableSummary'))}</span>
          <strong>${escapeHTML(manuscriptTitle)}</strong>
          <p data-submission-status-summary>${escapeHTML(journalName)} / ${escapeHTML(statusText)} / ${escapeHTML(t('milestoneSubmission'))} ${escapeHTML(timelineSubmissionDate || t('noDate'))}</p>
        </div>
        <div class="workflow-edit-summary-actions">
          <button type="button" class="btn-secondary workflow-edit-summary-button" id="btn-focus-edit-center" aria-controls="submission-entry-editor-panel">
            <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            <span>${escapeHTML(t('jumpToEditor'))}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="glass-card submission-edit-center submission-entry-editor-card" id="submission-entry-editor-panel" data-side-entry-editor="true">
      <div class="submission-edit-center-head">
        <div class="submission-edit-title-row">
          <span class="submission-edit-emblem" aria-hidden="true">
            <svg class="svg-icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="18" x2="13" y2="18"/></svg>
          </span>
          <div>
            <h3>${escapeHTML(t('submissionEntryEditorTitle'))}</h3>
            <p>${escapeHTML(t('submissionEntryEditorHelp'))}</p>
          </div>
        </div>
        <div class="submission-edit-badges">
          <span class="badge badge-purple">${escapeHTML(man ? t('linkedManuscriptBadge') : t('detachedSubmissionBadge'))}</span>
          <span class="${statusBadgeClass}" data-submission-status-badge="editor">${escapeHTML(statusText)}</span>
          ${articleUrl ? `<a class="doi-link" href="${escapeHTML(articleUrl)}" target="_blank" rel="noopener noreferrer">${t('articlePage')}</a>` : ''}
        </div>
      </div>

      <div class="submission-edit-section">
        <div class="submission-edit-section-head">
          <span class="submission-edit-section-icon" aria-hidden="true">
            <svg class="svg-icon" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </span>
          <span>${escapeHTML(t('manuscriptSection'))}</span>
        </div>
        <div class="submission-edit-grid submission-edit-grid-identity">
          <div class="form-group submission-edit-title-field">
            <label>${escapeHTML(t('manuscriptTitleLabel'))}</label>
            <input type="text" id="sub-edit-title" value="${escapeHTML(manuscriptTitle)}" placeholder="${escapeHTML(t('paperTitlePlaceholder'))}">
          </div>
          <div class="form-group">
            <label>${t('targetJournalInput')}</label>
            <input type="text" id="sub-edit-journal" value="${escapeHTML(journalName)}" placeholder="${escapeHTML(t('targetJournalInput'))}">
          </div>
          <div class="form-group">
            <label>${escapeHTML(t('submissionPortalUrl'))}</label>
            <input type="url" id="sub-edit-journal-url" value="${escapeHTML(submissionJournalUrl)}" placeholder="https://...">
          </div>
          <div class="form-group">
            <label>${t('status')}</label>
            <select id="sub-edit-status">
              <option value="submitted" ${sub.status === 'submitted' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('submitted'))}</option>
              <option value="under_review" ${sub.status === 'under_review' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('under_review'))}</option>
              <option value="revision" ${sub.status === 'revision' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('revision'))}</option>
              <option value="accepted" ${sub.status === 'accepted' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('accepted'))}</option>
              <option value="published" ${sub.status === 'published' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('published'))}</option>
              <option value="rejected" ${sub.status === 'rejected' ? 'selected' : ''}>${escapeHTML(getSubmissionStatusLabel('rejected'))}</option>
            </select>
          </div>
        </div>
        <div class="submission-first-author-module">
          <div class="submission-first-author-identity">
            <span class="submission-first-author-index" aria-hidden="true">1</span>
            <div>
              <label for="sub-edit-first-author">${escapeHTML(t('firstAuthorLabel'))}</label>
              <small>${escapeHTML(t('firstAuthorHelp'))}</small>
            </div>
          </div>
          <input type="text" id="sub-edit-first-author" value="${escapeHTML(firstAuthor)}" placeholder="${escapeHTML(t('firstAuthorPlaceholder'))}">
        </div>
      </div>

      <div class="submission-edit-section">
        <div class="submission-edit-section-head">
          <span class="submission-edit-section-icon" aria-hidden="true">
            <svg class="svg-icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </span>
          <span>${escapeHTML(t('reviewTimingSection'))}</span>
        </div>
        <div class="submission-edit-grid submission-edit-grid-dates">
          <div class="form-group">
            <label>${t('initialSubmissionDate')}</label>
            <input type="date" id="sub-edit-submission-date" value="${escapeHTML(timelineSubmissionDate)}">
          </div>
          <div class="form-group">
            <label>${t('firstDecisionDate')}</label>
            <input type="date" id="sub-edit-r1-date" value="${escapeHTML(timelineFirstDecisionDate)}">
          </div>
          <div class="form-group">
            <label>${t('revisionDueDateLabel')}</label>
            <input type="date" id="sub-edit-revision-due" value="${escapeHTML(timelineRevisionDueDate)}">
          </div>
          <div class="form-group">
            <label>${t('completionDate')} / ${t('stateAccepted')}</label>
            <input type="date" id="sub-edit-decision-date" value="${escapeHTML(timelineDecisionDate)}">
          </div>
        </div>
      </div>

      <div class="submission-edit-section">
        <div class="submission-edit-section-head">
          <span class="submission-edit-section-icon" aria-hidden="true">
            <svg class="svg-icon" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.43"/><path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.33-1.33"/></svg>
          </span>
          <span>${escapeHTML(t('publicationSection'))}</span>
        </div>
        <div class="submission-edit-grid submission-edit-grid-publication">
          <div class="form-group">
            <label>${t('doiLabel')}</label>
            <input type="text" id="sub-edit-doi" value="${escapeHTML(submissionDoi)}" placeholder="10.1002/adfm.202528029">
          </div>
          <div class="form-group">
            <label>${t('articleUrlLabel')}</label>
            <input type="url" id="sub-edit-article-url" value="${escapeHTML(articleUrl)}" placeholder="${t('articleUrlPlaceholder')}">
          </div>
        </div>
      </div>

      <div class="submission-edit-section submission-edit-checklist-section">
        <div class="submission-edit-section-head submission-edit-section-head-row">
          <div class="submission-edit-section-title">
            <span class="submission-edit-section-icon" aria-hidden="true">
              <svg class="svg-icon" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </span>
            <span>${escapeHTML(t('submissionChecklistSection'))}</span>
          </div>
        </div>
        <div class="submission-checklist-grid submission-edit-checklist-grid" id="sub-edit-compliance-checklist-container"></div>
      </div>

      <div class="submission-edit-section submission-edit-review-section">
        <div class="submission-edit-section-head submission-edit-section-head-row">
          <div class="submission-edit-section-title">
            <span class="submission-edit-section-icon" aria-hidden="true">
              <svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8"/><path d="M8 13h5"/></svg>
            </span>
            <span>${escapeHTML(t('peerReviewMatrixSection'))}</span>
          </div>
          <button class="btn-primary submission-work-button" id="btn-add-review-comment">
            <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>${escapeHTML(t('addComment'))}</span>
          </button>
        </div>
        <div class="submission-edit-review-help">${escapeHTML(t('reviewEditorHelp'))}</div>
        <div class="submission-edit-review-container" id="sub-edit-review-matrix-container"></div>
      </div>

      <div class="submission-edit-savebar">
        <p>${escapeHTML(t('timelineDateSource'))}: ${escapeHTML(timelineAnalysis.submitDateSource)}. ${escapeHTML(t('publicationLinksKept'))}</p>
        <div class="submission-autosave-status" data-submission-autosave-status data-state="saved" role="status" aria-live="polite">
          <span class="submission-autosave-dot" aria-hidden="true"></span>
          <span data-submission-autosave-label>${escapeHTML(t('autoSaveSaved'))}</span>
        </div>
      </div>
    </div>

    <div class="glass-card submission-action-card" style="margin-top: 12px;">
      <div class="submission-action-copy">
        <span class="submission-action-icon" aria-hidden="true">
          <svg class="svg-icon" viewBox="0 0 24 24"><path d="M4 12h14"/><path d="m12 6 6 6-6 6"/><path d="M4 5v14"/></svg>
        </span>
        <div>
          <h3>${t('transferToJournal')}</h3>
          <p>${escapeHTML(t('transferRoundHelp'))}</p>
        </div>
      </div>
      <div class="submission-action-buttons">
        <button class="btn-secondary" id="btn-mark-sub-rejected">
          <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><line x1="8" y1="8" x2="16" y2="16"/><line x1="16" y1="8" x2="8" y2="16"/></svg>
          <span>${t('markRejected')}</span>
        </button>
        <button class="btn-primary" id="btn-transfer-submission">
          <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h11v11"/><path d="M18 7 6 19"/></svg>
          <span>${t('transferToJournal')}</span>
        </button>
        </div>
    </div>

    <!-- Cycle Time Stats Panel -->
    ${cycleTimeHtml}

    <!-- Saved review preview and exports -->
    <div class="glass-card submission-work-card submission-readonly-review-card" style="margin-top: 16px;">
      <div class="submission-work-head">
        <div class="submission-work-title">
          <span class="submission-work-icon" aria-hidden="true">
            <svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8"/><path d="M8 13h5"/></svg>
          </span>
          <div>
            <h3>${escapeHTML(t('savedReviewPreviewTitle'))}</h3>
            <p>${escapeHTML(t('savedReviewPreviewHelp'))}</p>
          </div>
        </div>
        <div class="submission-work-actions">
          <button class="btn-secondary submission-work-button" id="btn-export-rebuttal-table">
            <svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>${escapeHTML(t('exportTable'))}</span>
          </button>
        </div>
      </div>
      <div class="submission-review-preview" id="submission-review-preview"></div>
    </div>
  `;

  const workflowContextCard = detailPanel.querySelector('[data-submission-workflow-context="true"]');
  const editCenter = detailPanel.querySelector('.submission-edit-center');
  if (workflowContextCard && editCenter && workflowContextCard.nextElementSibling !== editCenter) {
    workflowContextCard.insertAdjacentElement('afterend', editCenter);
  }
  if (workflowContextCard && !detailPanel.querySelector('.submission-edit-center')) {
    workflowContextCard.insertAdjacentHTML('afterend', `
      <div class="glass-card submission-edit-center submission-edit-center-error">
        <div class="submission-edit-center-head">
          <div class="submission-edit-title-row">
            <span class="submission-edit-emblem" aria-hidden="true">
              <svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </span>
            <div>
              <h3>${escapeHTML(t('editorRenderFailedTitle'))}</h3>
              <p>${escapeHTML(t('editorRenderFailedHelp'))}</p>
            </div>
          </div>
        </div>
      </div>
    `);
  }
  const editorMounted = Boolean(detailPanel.querySelector('#sub-edit-title') && detailPanel.querySelector('[data-submission-autosave-status]'));
  detailPanel.dataset.rfRenderVersion = RF_OPTIONS_RENDER_VERSION;
  detailPanel.dataset.rfEditorMounted = editorMounted ? 'true' : 'false';
  detailPanel.dataset.currentSubmissionId = sub.id;
  detailPanel.scrollTop = 0;

  const focusEditButton = document.getElementById('btn-focus-edit-center');
  if (focusEditButton) {
    focusEditButton.addEventListener('click', (event) => {
      event.preventDefault();
      focusSubmissionEditCenter();
    });
  }

  document.getElementById('btn-mark-sub-rejected').addEventListener('click', async () => {
    if (!confirm(t('confirmMarkRejected'))) return;
    markSubmissionRejected(sub, todayString());
    await window.storage.saveAll(db);
    renderDashboard();
    renderKanban();
    renderSubmissions();
    renderSubmissionDetails(sub);
    showGlobalToast(t('rejectedToast'), 'success');
  });

  document.getElementById('btn-transfer-submission').addEventListener('click', () => {
    openTransferSubmissionModal(sub);
  });

  // Delete submission
  document.getElementById('btn-delete-sub').addEventListener('click', async () => {
    if (confirm(t('confirmDeleteSubmission'))) {
      window.storage.recordEntityDeletion(db, 'submissions', sub.id);
      syncManuscriptStatusesFromSubmissions(db);
      selectedSubmissionId = null;
      await window.storage.saveAll(db);
      renderDashboard();
      renderKanban();
      renderSubmissions();
      document.getElementById('submission-detail-panel').innerHTML = `
        <div class="empty-state">
          <svg class="svg-icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <h3>${escapeHTML(t('submissionEmptyDetail'))}</h3>
        </div>
      `;
    }
  });

  const checklistKeys = getSubmissionChecklistKeys(sub);
  renderSubmissionChecklistEditor(sub, checklistKeys);
  renderSubmissionReviewMatrixEditor(sub, manAbstract);
  renderSubmissionReviewPreview(sub, checklistKeys);
  setupSubmissionAutoSave(sub);

  // Action: Export LaTeX & Markdown Rebuttal Table
  document.getElementById('btn-export-rebuttal-table').addEventListener('click', () => {
    const savedReviewRows = getSubmissionReviewMatrixRows(sub);
    if (savedReviewRows.length === 0) {
      showGlobalToast(t('noReviewerCommentsExport'), 'warning');
      return;
    }
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

    savedReviewRows.forEach((matrixRow, idx) => {
      const escapedCmt = escapeLatex(matrixRow.comment || '');
      const escapedResp = escapeLatex(matrixRow.response || '');

      latexCode += `\\rowcolor{commentgray}\n` +
                   `{\\bf Reviewer Comment \\#${idx + 1}:} ${escapedCmt} &\n` +
                   `{\\bf Response:} ${escapedResp} \\\\ \\midrule\n`;
    });

    latexCode += `\\end{longtable}\n\n` +
                 `\\end{document}`;

    // Trigger download
    const blob = new Blob([latexCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rebuttal_matrix_${sub.id}.tex`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showGlobalToast(t('latexDownloaded'), 'success');
  });
}

function openTransferSubmissionModal(sourceSub) {
  const sourceJournal = getSubmissionJournalName(sourceSub);
  const today = todayString();
  openModal(`
    <div class="modal-header">
      <h2>${t('transferSubmissionTitle')}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal">✕</button>
    </div>

    <div class="glass-card" style="margin-bottom:12px;">
      <p style="font-size:12px; margin:0;">${escapeHTML(t('currentJournalLabel'))}: <strong>${escapeHTML(sourceJournal)}</strong></p>
      <p class="text-muted" style="font-size:11px; margin-top:4px;">${escapeHTML(t('transferModalHelp'))}</p>
    </div>

    <div class="grid-cols-2" style="gap:10px;">
      <div class="form-group">
        <label>${t('rejectionDate')}</label>
        <input type="date" id="transfer-rejection-date" value="${today}">
      </div>
      <div class="form-group">
        <label>${t('milestoneSubmission')}</label>
        <input type="date" id="transfer-submission-date" value="${today}">
      </div>
    </div>

    <div class="form-group">
      <label>${t('newTargetJournal')}</label>
      <input type="text" id="transfer-target-journal" placeholder="${escapeHTML(t('targetJournalPlaceholder'))}">
    </div>

    <div class="form-group">
      <label>${escapeHTML(t('submissionPortalUrl'))}</label>
      <input type="url" id="transfer-journal-url" placeholder="https://...">
    </div>

    <div class="form-group">
      <label>${t('rejectionNote')}</label>
      <textarea id="transfer-rejection-note" rows="3" placeholder="${escapeHTML(t('rejectionNotePlaceholder'))}"></textarea>
    </div>

    <button class="btn-primary w-full" id="btn-create-transfer-sub">${t('transferButton')}</button>
  `);

  document.getElementById('btn-create-transfer-sub').addEventListener('click', async () => {
    const targetJournal = document.getElementById('transfer-target-journal').value.trim();
    const rejectionDate = document.getElementById('transfer-rejection-date').value || today;
    const submissionDate = document.getElementById('transfer-submission-date').value || today;
    const journalUrl = document.getElementById('transfer-journal-url').value.trim();
    const rejectionNote = document.getElementById('transfer-rejection-note').value.trim();

    if (!targetJournal) {
      alert(t('manuscriptJournalRequired'));
      return;
    }

    if (journalUrl) {
      try {
        new URL(journalUrl);
      } catch (e) {
        alert(t('validPortalUrlOrBlank'));
        return;
      }
    }

    markSubmissionRejected(sourceSub, rejectionDate, rejectionNote);
    const newSub = createTransferredSubmission(sourceSub, targetJournal, submissionDate, journalUrl);
    db.submissions.push(newSub);
    syncManuscriptStatusFromSubmission(newSub);
    selectedSubmissionId = newSub.id;

    await window.storage.saveAll(db);
    closeModal();
    renderDashboard();
    renderKanban();
    renderSubmissions();
    renderSubmissionDetails(newSub);
    showGlobalToast(t('transferToast'), 'success');
  });
}

function normalizeCapturedSubmissionStatus(value) {
  const normalized = String(value || '').trim().toLowerCase().replace('-', '_');
  if (['submitted', 'under_review', 'revision', 'accepted', 'rejected'].includes(normalized)) return normalized;
  return 'submitted';
}

function captureConfidenceLabel(level) {
  if (level === 'high') return t('confidenceHigh');
  if (level === 'medium') return t('confidenceMedium');
  return t('confidenceLow');
}

function findExistingCapturedSubmission({ externalManuscriptId, manuscriptTitle, targetJournal, sourceOrigin }) {
  return window.RFUI.findCapturedSubmissionMatch({
    submissions: db.submissions,
    manuscripts: db.manuscripts,
    capture: { externalManuscriptId, manuscriptTitle, targetJournal, sourceOrigin }
  });
}

function buildSubmissionCaptureReview(draft) {
  if (!draft) return '';
  const suggestedProject = [
    draft.manuscriptTitle || t('untitledManuscript'),
    draft.targetJournal ? `— ${draft.targetJournal}` : ''
  ].filter(Boolean).join(' ');
  const status = normalizeCapturedSubmissionStatus(draft.workflowStage);
  const statusOptions = [
    ['submitted', t('stateSubmitted')],
    ['under_review', t('stateUnderReview')],
    ['revision', t('eventTypeRevision')],
    ['accepted', t('stateAccepted')],
    ['rejected', t('statusRejected')]
  ].map(([value, label]) => (
    `<option value="${value}" ${value === status ? 'selected' : ''}>${escapeHTML(label)}</option>`
  )).join('');

  return `
    <section class="submission-capture-review" id="submission-capture-review">
      <div class="capture-review-heading">
        <div class="capture-review-mark" aria-hidden="true">✓</div>
        <div>
          <div class="capture-review-title-line">
            <h3>${escapeHTML(t('captureReviewTitle'))}</h3>
            <span class="capture-confidence capture-confidence-${escapeHTML(draft.confidenceLevel || 'low')}">
              ${escapeHTML(t('captureConfidence'))} · ${escapeHTML(captureConfidenceLabel(draft.confidenceLevel))} ${Number(draft.confidenceScore) || 0}%
            </span>
          </div>
          <p>${escapeHTML(t('captureReviewHelp'))}</p>
          <span class="capture-fields-count">${escapeHTML(tf('captureFieldsDetected', { count: Number(draft.detectedFieldCount) || 0 }))}</span>
        </div>
      </div>

      <div class="form-group capture-project-field">
        <label>${escapeHTML(t('captureProjectTitle'))}</label>
        <input type="text" id="sub-capture-project-title" value="${escapeHTML(suggestedProject)}" placeholder="${escapeHTML(t('captureProjectPlaceholder'))}">
      </div>

      <div class="grid-cols-2 capture-review-grid">
        <div class="form-group">
          <label>${escapeHTML(t('manuscriptIdLabel'))}</label>
          <input type="text" id="sub-capture-manuscript-id" value="${escapeHTML(draft.manuscriptId || '')}">
        </div>
        <div class="form-group">
          <label>${escapeHTML(t('capturedStatusLabel'))}</label>
          <select id="sub-capture-status">${statusOptions}</select>
        </div>
        <div class="form-group">
          <label>${escapeHTML(t('revisionDueLabel'))}</label>
          <input type="date" id="sub-capture-revision-due" value="${escapeHTML(draft.revisionDueDate || '')}">
        </div>
        <div class="form-group">
          <label>${escapeHTML(t('keywordsLabel'))}</label>
          <input type="text" id="sub-capture-keywords" value="${escapeHTML(draft.keywords || '')}">
        </div>
      </div>

      <div class="form-group">
        <label>${escapeHTML(t('authorsLabel'))}</label>
        <input type="text" id="sub-capture-authors" value="${escapeHTML(draft.authors || '')}">
      </div>
      <div class="form-group">
        <label>${escapeHTML(t('abstractLabel'))}</label>
        <textarea id="sub-capture-abstract" rows="4">${escapeHTML(draft.abstract || '')}</textarea>
      </div>
    </section>
  `;
}

// Track New Submission trigger
document.getElementById('btn-add-submission').addEventListener('click', () => {
  const captureDraft = pendingSubmissionCapture;
  let manOpts = db.manuscripts.map(m => `
    <option value="${escapeHTML(m.id)}">${escapeHTML(m.title || t('untitledManuscript'))}</option>
  `).join('');
  manOpts += `<option value="__new__">${escapeHTML(t('createNewManuscriptOption'))}</option>`;
  const defaultManuscriptMode = captureDraft
    ? '__new__'
    : (db.manuscripts.length === 0 ? '__new__' : (db.manuscripts[0]?.id || '__new__'));
  manOpts = manOpts.replace(`value="${escapeHTML(defaultManuscriptMode)}"`, `value="${escapeHTML(defaultManuscriptMode)}" selected`);
  openModal(`
    <div class="modal-header">
      <h2>${t('trackSubmissionTitle')}</h2>
      <button class="btn-secondary btn-icon" id="btn-close-modal">✕</button>
    </div>

    ${buildSubmissionCaptureReview(captureDraft)}

    <div class="form-group">
      <label>${t('manuscriptPaper')}</label>
      <select id="sub-man-select">${manOpts}</select>
    </div>

    <div class="quick-new-manuscript-panel" id="sub-new-manuscript-panel" ${defaultManuscriptMode === '__new__' ? '' : 'hidden'}>
      <div class="form-group">
        <label>${escapeHTML(t('newManuscriptTitleLabel'))}</label>
        <input type="text" id="sub-new-man-title" placeholder="${escapeHTML(t('paperTitlePlaceholder'))}">
      </div>
    </div>

    <div class="submission-first-author-module submission-first-author-create">
      <div class="submission-first-author-identity">
        <span class="submission-first-author-index" aria-hidden="true">1</span>
        <div>
          <label for="sub-first-author">${escapeHTML(t('firstAuthorLabel'))}</label>
          <small>${escapeHTML(t('firstAuthorHelp'))}</small>
        </div>
      </div>
      <input type="text" id="sub-first-author" value="${escapeHTML(captureDraft?.firstAuthor || firstAuthorFromList(captureDraft?.authors) || '')}" placeholder="${escapeHTML(t('firstAuthorPlaceholder'))}">
    </div>

    <div class="form-group">
      <label>${t('targetJournalInput')}</label>
      <input type="text" id="sub-journal" placeholder="${escapeHTML(t('targetJournalPlaceholder'))}">
    </div>

    <div class="form-group">
      <label>${escapeHTML(t('submissionPortalUrl'))}</label>
      <input type="url" id="sub-journal-url" placeholder="https://...">
    </div>

    <div class="form-group">
      <label>${t('initialSubmissionDate')}</label>
      <input type="date" id="sub-date" value="${new Date().toISOString().split('T')[0]}">
    </div>

    <button class="btn-primary w-full" id="btn-submit-sub">${captureDraft ? t('confirmCreateProject') : t('trackSubmissionButton')}</button>
  `);

  const manuscriptSelect = document.getElementById('sub-man-select');
  const newManuscriptPanel = document.getElementById('sub-new-manuscript-panel');
  manuscriptSelect.addEventListener('change', () => {
    newManuscriptPanel.hidden = manuscriptSelect.value !== '__new__';
  });
  if (captureDraft) {
    manuscriptSelect.disabled = true;
    manuscriptSelect.setAttribute('aria-describedby', 'submission-capture-review');
  }

  document.getElementById('btn-submit-sub').addEventListener('click', async () => {
    const createMode = window.RFUI.buildSubmissionCreateMode({
      selectedManuscriptId: manuscriptSelect.value,
      newManuscriptTitle: document.getElementById('sub-new-man-title')?.value || '',
      targetJournal: document.getElementById('sub-journal').value
    });
    const subDate = document.getElementById('sub-date').value;
    const journalUrl = document.getElementById('sub-journal-url').value.trim();
    const firstAuthor = document.getElementById('sub-first-author').value.trim().slice(0, 160);
    const captureProjectTitle = document.getElementById('sub-capture-project-title')?.value.trim() || '';

    if (!createMode.ok) {
      alert(createMode.error);
      return;
    }
    if (captureDraft && !captureProjectTitle) {
      alert(t('captureProjectTitle'));
      return;
    }
    if (journalUrl) {
      try {
        const parsedPortalUrl = new URL(journalUrl);
        if (!/^https?:$/.test(parsedPortalUrl.protocol)) throw new Error('unsupported protocol');
      } catch (_) {
        alert(t('validPortalUrlOrBlank'));
        return;
      }
    }

    if (captureDraft) {
      const existingSubmission = findExistingCapturedSubmission({
        externalManuscriptId: document.getElementById('sub-capture-manuscript-id')?.value,
        manuscriptTitle: createMode.title,
        targetJournal: createMode.targetJournal,
        sourceOrigin: captureDraft.sourceOrigin
      });
      if (existingSubmission) {
        selectedSubmissionId = existingSubmission.id;
        await chrome.storage.local.remove(PENDING_SUBMISSION_DRAFT_KEY);
        closeModal();
        renderDashboard();
        renderKanban();
        renderSubmissions();
        showGlobalToast(t('captureExistingOpenedToast'), 'success');
        return;
      }
    }

    let manuscriptId = createMode.manuscriptId;
    let capturedProject = null;
    if (captureDraft) {
      capturedProject = window.RFCore.upsertProject(db, {
        title: captureProjectTitle,
        discipline: createMode.targetJournal,
        hypothesis: '',
        abstract: document.getElementById('sub-capture-abstract')?.value.trim() || '',
        status: 'active'
      });
      if (capturedProject && Array.isArray(capturedProject.tags) && !capturedProject.tags.includes('submission-capture')) {
        capturedProject.tags.push('submission-capture');
      }
    }

    if (createMode.mode === 'new') {
      const capturedAuthors = (document.getElementById('sub-capture-authors')?.value || '')
        .split(/[;,，；]\s*/)
        .map(name => name.trim())
        .filter(Boolean);
      const capturedKeywords = (document.getElementById('sub-capture-keywords')?.value || '')
        .split(/[;,，；]\s*/)
        .map(keyword => keyword.trim())
        .filter(Boolean);
      const capturedStatus = normalizeCapturedSubmissionStatus(
        document.getElementById('sub-capture-status')?.value || captureDraft?.workflowStage
      );
      const newMan = {
        id: 'man_' + Math.random().toString(36).substring(2, 9),
        userId: 'user',
        projectId: capturedProject?.id || document.getElementById('sub-new-man-project')?.value || null,
        title: createMode.title,
        shortTitle: null,
        manuscriptType: 'article',
        status: captureDraft ? capturedStatus : 'submitted',
        abstract: document.getElementById('sub-capture-abstract')?.value.trim() || '',
        keywords: capturedKeywords,
        authors: capturedAuthors,
        firstAuthor: firstAuthor || null,
        correspondingAuthors: [],
        targetJournals: [createMode.targetJournal],
        currentVersion: '1.0',
        plannedFigures: [],
        notes: captureDraft
          ? `Created from a reviewed ${captureDraft.platformName || 'submission portal'} capture.`
          : 'Created inline while tracking a new submission',
        externalManuscriptId: document.getElementById('sub-capture-manuscript-id')?.value.trim() || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.manuscripts.push(newMan);
      manuscriptId = newMan.id;
    }
    const linkedManuscript = db.manuscripts.find(m => m.id === manuscriptId);
    if (linkedManuscript && firstAuthor) {
      linkedManuscript.firstAuthor = firstAuthor;
      linkedManuscript.updatedAt = new Date().toISOString();
    }

    const newSub = {
      id: 'sub_' + Math.random().toString(36).substring(2, 9),
      userId: 'user',
      manuscriptId,
      projectId: capturedProject?.id || db.manuscripts.find(m => m.id === manuscriptId)?.projectId || null,
      targetJournal: createMode.targetJournal,
      journalUrl: journalUrl || null,
      doi: null,
      articleUrl: null,
      status: captureDraft
        ? normalizeCapturedSubmissionStatus(document.getElementById('sub-capture-status')?.value)
        : 'submitted',
      submissionDate: dateInputToIso(subDate),
      decisionDate: null,
      revisionDueDate: document.getElementById('sub-capture-revision-due')?.value
        ? dateInputToIso(document.getElementById('sub-capture-revision-due').value)
        : null,
      firstDecisionDate: null,
      complianceChecklist: {},
      reviewMatrix: [],
      timelineNodes: [],
      externalManuscriptId: document.getElementById('sub-capture-manuscript-id')?.value.trim() || null,
      firstAuthor: firstAuthor || null,
      captureProvenance: captureDraft ? {
        source: 'submission-portal',
        platformId: captureDraft.platformId || '',
        platformName: captureDraft.platformName || '',
        sourceOrigin: captureDraft.sourceOrigin || '',
        capturedAt: new Date().toISOString(),
        confidenceScore: Number(captureDraft.confidenceScore) || 0,
        reviewedByUser: true
      } : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    normalizeSubmissionTimeline(newSub);
    db.submissions.push(newSub);
    syncManuscriptStatusFromSubmission(newSub);
    selectedSubmissionId = newSub.id;
    await window.storage.saveAll(db);
    if (captureDraft) await chrome.storage.local.remove(PENDING_SUBMISSION_DRAFT_KEY);
    closeModal();
    renderDashboard();
    renderKanban();
    renderSubmissions();
    showGlobalToast(t(captureDraft ? 'captureCreatedToast' : 'submissionAddedToast'), 'success');
  });
});

async function consumePendingSubmissionDraft() {
  const stored = await chrome.storage.local.get([PENDING_SUBMISSION_DRAFT_KEY]);
  const draft = stored?.[PENDING_SUBMISSION_DRAFT_KEY];
  if (!draft) return;

  if (!draft.expiresAt || Number(draft.expiresAt) < Date.now()) {
    await chrome.storage.local.remove(PENDING_SUBMISSION_DRAFT_KEY);
    return;
  }

  const submissionNav = document.querySelector('.nav-item[data-view="view-submissions"]');
  submissionNav?.click();
  pendingSubmissionCapture = draft;
  document.getElementById('btn-add-submission')?.click();
  document.body.classList.add('submission-capture-mode');
  modalContent?.classList.add('submission-capture-card');

  const journalInput = document.getElementById('sub-journal');
  const journalUrlInput = document.getElementById('sub-journal-url');
  const dateInput = document.getElementById('sub-date');
  const manuscriptSelect = document.getElementById('sub-man-select');
  const manuscriptTitleInput = document.getElementById('sub-new-man-title');
  if (!journalInput || !journalUrlInput || !dateInput || !manuscriptSelect || !manuscriptTitleInput) return;

  manuscriptSelect.value = '__new__';
  manuscriptSelect.dispatchEvent(new Event('change', { bubbles: true }));
  manuscriptTitleInput.value = String(draft.manuscriptTitle || '').trim();
  journalInput.value = String(draft.targetJournal || '').trim();
  journalUrlInput.value = String(draft.journalUrl || '').trim();
  if (draft.submissionDate) dateInput.value = draft.submissionDate;

  if (!manuscriptTitleInput.value) {
    manuscriptTitleInput.focus();
  } else {
    document.getElementById('sub-capture-project-title')?.focus();
  }

  showGlobalToast(tf('detectedSubmissionPrefilled', {
    platform: draft.platformName || draft.targetJournal || 'submission portal'
  }), 'success');
}

async function consumePendingAcademicDraft() {
  const stored = await chrome.storage.local.get([PENDING_ACADEMIC_DRAFT_KEY]);
  const draft = stored?.[PENDING_ACADEMIC_DRAFT_KEY];
  if (!draft) return;

  if (!draft.expiresAt || Number(draft.expiresAt) < Date.now()) {
    await chrome.storage.local.remove(PENDING_ACADEMIC_DRAFT_KEY);
    return;
  }

  document.querySelector('.nav-item[data-view="view-manuscripts"]')?.click();
  const results = Array.isArray(draft.results) && draft.results.length
    ? draft.results
    : [draft];
  if (results.length > 1) {
    openAcademicCaptureChooser(draft, results);
  } else {
    openManuscriptModal(null, results[0]);
    enableAcademicCaptureLayout();
    showGlobalToast(t('academicCapturePrefilled'), 'success');
  }
}

function enableAcademicCaptureLayout() {
  document.body.classList.add('academic-capture-mode');
  modalContent?.classList.add('academic-capture-card');
}

function openAcademicCaptureChooser(draft, results) {
  openModal(`
    <div class="modal-header">
      <div>
        <h2>${escapeHTML(t('academicCaptureChooseTitle'))}</h2>
        <p class="text-muted academic-capture-chooser-help">${escapeHTML(t('academicCaptureChooseHelp'))}</p>
      </div>
      <button class="btn-secondary btn-icon" id="btn-close-modal" aria-label="${escapeHTML(t('close'))}">✕</button>
    </div>
    <section class="academic-capture-chooser" aria-label="${escapeHTML(t('academicCaptureChooseTitle'))}">
      <div class="academic-capture-count">
        <strong>${results.length}</strong> ${escapeHTML(t('academicCaptureDetected'))}
        <span>${escapeHTML(draft.sourceHost || '')}</span>
      </div>
      <div class="academic-capture-result-list">
        ${results.map((result, index) => `
          <button type="button" class="academic-capture-result" data-academic-result-index="${index}">
            <span class="academic-result-index">${String(index + 1).padStart(2, '0')}</span>
            <span class="academic-result-copy">
              <strong>${escapeHTML(result.title || t('untitledManuscript'))}</strong>
              <span>${escapeHTML(result.authors || '')}</span>
              <small>${escapeHTML(result.publication || result.articleUrl || '')}</small>
            </span>
            <span class="academic-result-arrow" aria-hidden="true">→</span>
          </button>
        `).join('')}
      </div>
    </section>
  `);
  enableAcademicCaptureLayout();
  modalContent.querySelectorAll('[data-academic-result-index]').forEach(button => {
    button.addEventListener('click', () => {
      const result = results[Number(button.dataset.academicResultIndex)];
      if (!result) return;
      openManuscriptModal(null, result);
      enableAcademicCaptureLayout();
      showGlobalToast(t('academicCapturePrefilled'), 'success');
    });
  });
}

// --- VIEW 6: MULTI-CLOUD SETTINGS ---
function normalizeSubmissionAssistSettings(value = {}) {
  return {
    enabled: value.enabled !== false,
    captureDetailsEnabled: value.captureDetailsEnabled !== false,
    disabledOrigins: Array.isArray(value.disabledOrigins) ? value.disabledOrigins : [],
    snoozedUntil: value.snoozedUntil && typeof value.snoozedUntil === 'object'
      ? value.snoozedUntil
      : {}
  };
}

function updateSubmissionAssistIgnoredCount(state) {
  const countNode = document.getElementById('submission-assist-ignored-count');
  const stateNode = document.getElementById('submission-assist-state-label');
  const card = document.getElementById('settings-submission-assist-card');
  const enabled = state.enabled !== false;
  const count = state.disabledOrigins.length;
  if (countNode) {
    countNode.textContent = count
      ? tf('submissionAssistIgnoredCount', { count })
      : t('submissionAssistNoneIgnored');
  }
  if (stateNode) stateNode.textContent = enabled ? t('submissionAssistEnabled') : t('submissionAssistDisabled');
  if (card) card.classList.toggle('is-enabled', enabled);
}

async function loadSubmissionAssistSettings() {
  const stored = await chrome.storage.local.get([SUBMISSION_ASSIST_STORAGE_KEY]);
  const state = normalizeSubmissionAssistSettings(stored?.[SUBMISSION_ASSIST_STORAGE_KEY]);
  const checkbox = document.getElementById('submission-assist-enabled');
  const captureCheckbox = document.getElementById('submission-assist-capture-enabled');
  if (checkbox) checkbox.checked = state.enabled;
  if (captureCheckbox) {
    captureCheckbox.checked = state.captureDetailsEnabled;
    captureCheckbox.disabled = !state.enabled;
  }
  updateSubmissionAssistIgnoredCount(state);
  return state;
}

async function saveSubmissionAssistSettings(state) {
  const normalized = normalizeSubmissionAssistSettings(state);
  await chrome.storage.local.set({ [SUBMISSION_ASSIST_STORAGE_KEY]: normalized });
  updateSubmissionAssistIgnoredCount(normalized);
  return normalized;
}

function updateSyncProviderVisibility() {
  const routeSelect = document.getElementById('route-db');
  if (!routeSelect) return;
  const provider = routeSelect.value || 'local';
  document.querySelectorAll('[data-sync-provider]').forEach((card) => {
    const isActive = card.dataset.syncProvider === provider;
    card.hidden = !isActive;
    card.setAttribute('aria-hidden', String(!isActive));
  });

  const summary = document.getElementById('sync-route-summary');
  if (summary) {
    const summaryKey = provider === 'webdav'
      ? 'webdavSyncSummary'
      : (provider === 'github' ? 'githubSyncSummary' : 'localSyncSummary');
    summary.textContent = t(summaryKey);
    summary.dataset.provider = provider;
  }

  const syncButton = document.getElementById('btn-manual-sync');
  const localOnly = provider === 'local';
  if (syncButton) {
    syncButton.disabled = localOnly;
    syncButton.title = localOnly ? t('localSyncSummary') : t('forceSync');
  }

  const autoSyncToggle = document.getElementById('auto-cloud-sync');
  const autoSyncControl = document.getElementById('settings-auto-sync-control');
  const autoSyncHelp = document.getElementById('auto-cloud-sync-help');
  if (autoSyncToggle) {
    autoSyncToggle.disabled = localOnly;
    autoSyncToggle.checked = localOnly
      ? false
      : autoSyncToggle.dataset.savedValue !== 'false';
  }
  if (autoSyncControl) autoSyncControl.classList.toggle('is-disabled', localOnly);
  if (autoSyncHelp) {
    autoSyncHelp.textContent = t(localOnly ? 'autoCloudSyncLocalHelp' : 'autoCloudSyncHelp');
  }
}

async function loadSettings() {
  const syncProviders = db.settings?.syncProviders || DEFAULT_DB.settings.syncProviders;
  const profile = db.settings?.profile || DEFAULT_DB.settings.profile;
  const credentials = await window.storage.loadSyncCredentials();

  const languageSelect = document.getElementById('ui-language');
  if (languageSelect) languageSelect.value = currentLanguage || profile.language || 'en';
  const themeSelect = document.getElementById('ui-theme');
  if (themeSelect) themeSelect.value = normalizeThemePreference(profile.theme);

  const autoSyncToggle = document.getElementById('auto-cloud-sync');
  if (autoSyncToggle) {
    const autoSyncEnabled = syncProviders.metadata.autoSync !== false;
    autoSyncToggle.dataset.savedValue = String(autoSyncEnabled);
    autoSyncToggle.checked = autoSyncEnabled;
  }

  // Cloud routing
  document.getElementById('route-db').value = syncProviders.metadata.provider || 'local';
  updateSyncProviderVisibility();

  // WebDAV
  document.getElementById('webdav-url').value = syncProviders.metadata.config?.url || '';
  document.getElementById('webdav-username').value = credentials.webdav?.username || '';
  document.getElementById('webdav-password').value = credentials.webdav?.password || '';

  // GitHub
  document.getElementById('github-token').value = credentials.github?.token || '';
  document.getElementById('github-repo').value = syncProviders.metadata.config?.repo || '';
  document.getElementById('github-branch').value = syncProviders.metadata.config?.branch || 'main';

  loadSubmissionAssistSettings().catch(console.error);
  applyLanguage();
}

function setupSettingsListeners() {
  const submissionAssistToggle = document.getElementById('submission-assist-enabled');
  const submissionCaptureToggle = document.getElementById('submission-assist-capture-enabled');
  if (submissionAssistToggle) {
    submissionAssistToggle.addEventListener('change', async () => {
      const enabled = submissionAssistToggle.checked;
      const state = await loadSubmissionAssistSettings();
      state.enabled = enabled;
      await saveSubmissionAssistSettings(state);
      submissionAssistToggle.checked = enabled;
      if (submissionCaptureToggle) submissionCaptureToggle.disabled = !enabled;
      showGlobalToast(t('submissionAssistSaved'), 'success');
    });
  }

  const linkSubmissionButton = document.getElementById('btn-link-submission-manuscript');
  if (linkSubmissionButton) {
    linkSubmissionButton.addEventListener('click', () => openLinkSubmissionModal(sub));
  }
  if (submissionCaptureToggle) {
    submissionCaptureToggle.addEventListener('change', async () => {
      const captureDetailsEnabled = submissionCaptureToggle.checked;
      const state = await loadSubmissionAssistSettings();
      state.captureDetailsEnabled = captureDetailsEnabled;
      await saveSubmissionAssistSettings(state);
      submissionCaptureToggle.checked = captureDetailsEnabled;
      showGlobalToast(t('submissionAssistSaved'), 'success');
    });
  }

  const resetSubmissionAssistButton = document.getElementById('btn-reset-submission-assist');
  if (resetSubmissionAssistButton) {
    resetSubmissionAssistButton.addEventListener('click', async () => {
      const state = await loadSubmissionAssistSettings();
      state.disabledOrigins = [];
      state.snoozedUntil = {};
      await saveSubmissionAssistSettings(state);
      showGlobalToast(t('submissionAssistResetToast'), 'success');
    });
  }

  const languageSelect = document.getElementById('ui-language');
  if (languageSelect) {
    languageSelect.addEventListener('change', async () => {
      currentLanguage = languageSelect.value;
      document.documentElement.lang = currentLanguage === 'zh' ? 'zh-CN' : 'en';
      db.settings = db.settings || {};
      db.settings.profile = db.settings.profile || {};
      db.settings.profile.language = currentLanguage;
      applyLanguage();
      refreshActiveViewForLanguage();
      languageSelect.disabled = true;
      try {
        await window.storage.saveAll(db);
      } finally {
        languageSelect.disabled = false;
      }
      showGlobalToast(t('languageSaved'), 'success');
    });
  }

  const themeSelect = document.getElementById('ui-theme');
  if (themeSelect) {
    themeSelect.addEventListener('change', async () => {
      const previousTheme = normalizeThemePreference(db.settings?.profile?.theme);
      const nextTheme = applyThemePreference(themeSelect.value);
      db.settings = db.settings || {};
      db.settings.profile = db.settings.profile || {};
      db.settings.profile.theme = nextTheme;
      themeSelect.disabled = true;
      try {
        await window.storage.saveAll(db);
      } catch (error) {
        db.settings.profile.theme = previousTheme;
        themeSelect.value = previousTheme;
        applyThemePreference(previousTheme);
        throw error;
      } finally {
        themeSelect.disabled = false;
      }
      showGlobalToast(t('appearanceSaved'), 'success');
    });
  }

  const routeSelect = document.getElementById('route-db');
  routeSelect.addEventListener('change', updateSyncProviderVisibility);

  const autoSyncToggle = document.getElementById('auto-cloud-sync');
  if (autoSyncToggle) {
    autoSyncToggle.addEventListener('change', () => {
      autoSyncToggle.dataset.savedValue = String(autoSyncToggle.checked);
    });
  }

  // Save Mappings Button
  document.getElementById('btn-save-settings').addEventListener('click', async () => {
    const routeDb = document.getElementById('route-db').value;

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
    const selectedConfig = routeDb === 'webdav'
      ? webdavConfig
      : (routeDb === 'github' ? githubConfig : {});
    const autoSync = document.getElementById('auto-cloud-sync')?.dataset.savedValue !== 'false';
    const configurationIssue = window.storage.getSyncConfigurationIssue({
      provider: routeDb,
      config: selectedConfig
    });
    if (configurationIssue) {
      showGlobalToast(configurationIssue, 'error');
      updateSyncStatus('error', 'Configuration Required');
      return;
    }

    await window.storage.saveSyncCredentials(routeDb, selectedConfig);
    const publicConfig = window.storage.getPublicSyncConfig(routeDb, selectedConfig);

    // Credentials are device-local and never enter the synchronized database.
    db.settings.syncProviders = {
      metadata: {
        provider: routeDb,
        config: publicConfig,
        autoSync
      }
    };

    await window.storage.saveAll(db);
    updateSyncProviderVisibility();
    showGlobalToast('Cloud database mapping saved!', 'success');
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
    const safeDb = window.storage.sanitizeDatabaseForExternalUse(db);
    const exportBlob = new Blob([JSON.stringify(safeDb, null, 2)], { type: 'application/json;charset=utf-8' });
    const exportUrl = URL.createObjectURL(exportBlob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", exportUrl);
    downloadAnchor.setAttribute("download", `researchflow-export-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setTimeout(() => URL.revokeObjectURL(exportUrl), 0);
    showGlobalToast(t('databaseExported'), 'success');
  });

  document.getElementById('btn-export-diagnostics').addEventListener('click', async () => {
    const metadataRoute = db?.settings?.syncProviders?.metadata || { provider: 'local', config: {} };
    const effectiveRoute = await window.storage.getEffectiveMetadataProvider(db);
    const diagnosticReport = {
      generatedAt: new Date().toISOString(),
      extension: {
        name: chrome.runtime.getManifest?.().name || 'ResearchFlow Companion',
        version: chrome.runtime.getManifest?.().version || RF_OPTIONS_RENDER_VERSION,
        schemaVersion: Number(db.schemaVersion) || null,
        revision: Number(db.revision) || 0
      },
      runtime: {
        language: currentLanguage,
        online: navigator.onLine,
        platform: navigator.platform || '',
        userAgent: navigator.userAgent || ''
      },
      database: {
        lastUpdated: db.updatedAt || null,
        counts: {
          projects: db.projects?.length || 0,
          manuscripts: db.manuscripts?.length || 0,
          submissions: db.submissions?.length || 0,
          tasks: db.tasks?.length || 0
        }
      },
      synchronization: {
        provider: metadataRoute.provider || 'local',
        configurationValid: !window.storage.getSyncConfigurationIssue(effectiveRoute)
      },
      capture: {
        submissionRecognitionEnabled: document.getElementById('submission-assist-enabled')?.checked !== false,
        detailedCaptureEnabled: document.getElementById('submission-assist-capture-enabled')?.checked !== false
      },
      privacy: {
        credentialsIncluded: false,
        manuscriptMetadataIncluded: false
      }
    };
    const diagnosticBlob = new Blob(
      [JSON.stringify(diagnosticReport, null, 2)],
      { type: 'application/json;charset=utf-8' }
    );
    const diagnosticUrl = URL.createObjectURL(diagnosticBlob);
    const anchor = document.createElement('a');
    anchor.href = diagnosticUrl;
    anchor.download = `researchflow-diagnostics-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(diagnosticUrl), 0);
    showGlobalToast(t('diagnosticsExported'), 'success');
  });

  // Trigger File Import Dialog
  document.getElementById('btn-trigger-import').addEventListener('click', () => {
    document.getElementById('import-db-file').click();
  });

  document.getElementById('btn-restore-import-backup').addEventListener('click', async () => {
    const result = await new Promise((resolve) => {
      chrome.storage.local.get([PRE_IMPORT_BACKUP_KEY], resolve);
    });
    const backup = result?.[PRE_IMPORT_BACKUP_KEY];
    if (!backup?.database) {
      showGlobalToast(t('noImportBackup'), 'error');
      return;
    }
    if (!confirm(t('restoreImportConfirm'))) return;

    try {
      const normalizedBackup = await window.storage.ensureDbShape(backup.database, { stamp: false });
      db = await window.storage.saveAll(normalizedBackup);
      await renderAllViews();
      await loadSettings();
      showGlobalToast(t('importBackupRestored'), 'success');
    } catch (err) {
      console.error('Failed to restore pre-import backup.', err);
      showGlobalToast(err.message || t('invalidBackup'), 'error');
    }
  });

  // Handle Imported JSON File and Adapt Schema Format
  document.getElementById('import-db-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      e.target.value = '';
      showGlobalToast(t('importFileTooLarge'), 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importJson = JSON.parse(event.target.result);
        const recognizedCollections = [
          'projects',
          'researchRecords',
          'manuscripts',
          'submissions',
          'tasks',
          'achievements',
          'honorOpportunities',
          'honorApplications'
        ];
        if (
          !importJson
          || typeof importJson !== 'object'
          || Array.isArray(importJson)
          || !recognizedCollections.some((key) => Array.isArray(importJson[key]))
        ) {
          throw new Error(t('invalidBackup'));
        }

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
            firstAuthor: man.firstAuthor || firstAuthorFromList(man.authors) || null,
            correspondingAuthors: Array.isArray(man.correspondingAuthors) ? man.correspondingAuthors : [],
            targetJournals: Array.isArray(man.targetJournals)
              ? man.targetJournals
              : (man.targetJournal ? [man.targetJournal] : []),
            doi: normalizeDoi(man.doi || man.DOI || '') || null,
            articleUrl: String(man.articleUrl || '').trim() || null,
            academicCaptureProvenance: man.academicCaptureProvenance
              && typeof man.academicCaptureProvenance === 'object'
              && !Array.isArray(man.academicCaptureProvenance)
              ? {
                  sourceType: String(man.academicCaptureProvenance.sourceType || '').slice(0, 40),
                  sourceHost: String(man.academicCaptureProvenance.sourceHost || '').slice(0, 255),
                  sourcePageUrl: String(man.academicCaptureProvenance.sourcePageUrl || '').slice(0, 2000),
                  pdfUrl: String(man.academicCaptureProvenance.pdfUrl || '').slice(0, 2000),
                  confidenceScore: Number(man.academicCaptureProvenance.confidenceScore) || 0,
                  capturedAt: man.academicCaptureProvenance.capturedAt || null,
                  reviewedByUser: man.academicCaptureProvenance.reviewedByUser === true
                }
              : null,
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
            const status = sub.status || 'submitted';
            const importedSubmission = {
              status,
              acceptedAt: sub.acceptedAt || null,
              publishedAt: sub.publishedAt || null,
              decisionDate: sub.decisionDate || sub.decisionAt || null,
              timelineNodes: Array.isArray(sub.timelineNodes) ? sub.timelineNodes : []
            };
            const keepPublicationLink = canHavePublicationLink(importedSubmission);
            const doi = keepPublicationLink
              ? normalizeDoi(sub.doi || sub.DOI || extractDoiFromText(sub.notes || ''))
              : '';
            return {
              id: sub.id,
              userId: sub.userId || 'user',
              manuscriptId: sub.manuscriptId,
              projectId: sub.projectId || null,
              firstAuthor: sub.firstAuthor || firstAuthorFromList(sub.authors) || null,
              targetJournal: sub.targetJournal || sub.journalName || '',
              journalUrl: sub.journalUrl || sub.submissionUrl || null,
              doi: doi || null,
              articleUrl: keepPublicationLink ? (sub.articleUrl || sub.publicationUrl || sub.url || null) : null,
              status,
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

        // 6. Convert Honors
        if (Array.isArray(importJson.honorOpportunities)) {
          newDb.honorOpportunities = importJson.honorOpportunities;
        }
        if (Array.isArray(importJson.honorApplications)) {
          newDb.honorApplications = importJson.honorApplications;
        }
        if (Array.isArray(importJson.tasks)) {
          newDb.tasks = importJson.tasks;
        }

        syncManuscriptStatusesFromSubmissions(newDb);
        const normalizedImport = await window.storage.ensureDbShape(newDb, { stamp: false });
        const safeCurrentDb = window.storage.sanitizeDatabaseForExternalUse(db);
        await new Promise((resolve, reject) => {
          chrome.storage.local.set({
            [PRE_IMPORT_BACKUP_KEY]: {
              database: safeCurrentDb,
              createdAt: new Date().toISOString(),
              sourceFileName: String(file.name || '').slice(0, 260)
            }
          }, () => {
            if (chrome.runtime.lastError) {
              reject(new Error(`Unable to create the pre-import backup: ${chrome.runtime.lastError.message}`));
              return;
            }
            resolve();
          });
        });

        // Only replace the in-memory cache after parsing, conversion,
        // normalization and recovery-backup creation have all succeeded.
        db = await window.storage.saveAll(normalizedImport);
        await renderAllViews();
        await loadSettings();
        showGlobalToast(t('databaseImported'), 'success');
      } catch (err) {
        console.error('Failed to import database JSON.', err);
        showGlobalToast(err.message || t('invalidBackup'), 'error');
      } finally {
        e.target.value = '';
      }
    };
    reader.onerror = () => {
      e.target.value = '';
      showGlobalToast(t('invalidBackup'), 'error');
    };
    reader.readAsText(file);
  });
}

// --- DYNAMIC DIALOG MODAL CONTROLLER ---
const modal = document.getElementById('modal-container');
const modalContent = document.getElementById('modal-card-content');

function openModal(htmlContent) {
  if (!modal.classList.contains('active')) {
    const activeElement = document.activeElement;
    previousModalFocus = activeElement instanceof HTMLElement && !modal.contains(activeElement)
      ? activeElement
      : null;
  }
  modalContent.innerHTML = htmlContent;
  modalContent.classList.toggle('stage-modal-wide', htmlContent.includes('stage-editor'));
  modalContent.classList.toggle('share-preview-card', htmlContent.includes('share-preview-shell'));
  const isCaptureReview = htmlContent.includes('submission-capture-review')
    || htmlContent.includes('academic-capture-review')
    || htmlContent.includes('academic-capture-chooser');
  modalContent.setAttribute('aria-modal', String(!isCaptureReview));
  const heading = modalContent.querySelector('h2');
  if (heading) {
    if (!heading.id) heading.id = `modal-title-${Date.now()}`;
    modalContent.setAttribute('aria-labelledby', heading.id);
  } else {
    modalContent.removeAttribute('aria-labelledby');
  }
  modal.inert = false;
  modal.removeAttribute('inert');
  modal.setAttribute('aria-hidden', 'false');
  modal.classList.add('active');

  // Auto-bind close trigger inside modal
  const closeBtn = document.getElementById('btn-close-modal');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  window.requestAnimationFrame(() => {
    const initialFocus = modalContent.querySelector('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])');
    (initialFocus || modalContent).focus();
  });
}

function closeModal() {
  const restoreTarget = previousModalFocus?.isConnected && !modal.contains(previousModalFocus)
    ? previousModalFocus
    : null;
  if (restoreTarget) {
    restoreTarget.focus({ preventScroll: true });
  }
  const focusedElement = document.activeElement;
  if (focusedElement instanceof HTMLElement && modal.contains(focusedElement)) {
    focusedElement.blur();
  }

  modal.inert = true;
  modal.setAttribute('inert', '');
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  modalContent.classList.remove('submission-capture-card');
  modalContent.classList.remove('academic-capture-card');
  modalContent.classList.remove('share-preview-card');
  if (activeSharePreviewUrl) {
    URL.revokeObjectURL(activeSharePreviewUrl);
    activeSharePreviewUrl = null;
  }
  document.body.classList.remove('submission-capture-mode');
  document.body.classList.remove('academic-capture-mode');
  pendingSubmissionCapture = null;
  const url = new URL(window.location.href);
  if (url.searchParams.has('mode')) {
    url.searchParams.delete('mode');
    window.history.replaceState({}, '', url);
  }
  previousModalFocus = null;
}

function setupGlobalModalListeners() {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('active')) closeModal();
  });
}

function showAcceptanceCelebration(submission) {
  acceptanceCelebrationCleanup?.();

  const manuscript = db.manuscripts.find(item => item.id === submission.manuscriptId);
  const title = String(manuscript?.title || submission.title || t('untitledManuscript')).trim();
  const layer = document.createElement('div');
  layer.className = 'acceptance-celebration';
  layer.dataset.acceptanceCelebration = 'active';
  layer.setAttribute('role', 'status');
  layer.setAttribute('aria-live', 'assertive');
  layer.setAttribute('aria-atomic', 'true');

  const particles = document.createElement('div');
  particles.className = 'acceptance-confetti-field';
  particles.setAttribute('aria-hidden', 'true');

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  if (!reducedMotion) {
    const colors = ['#059669', '#10b981', '#06b6d4', '#f59e0b', '#fbbf24', '#f97316'];
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < 54; index += 1) {
      const particle = document.createElement('i');
      particle.className = 'acceptance-confetti-piece';
      particle.dataset.shape = index % 4 === 0 ? 'round' : 'strip';
      particle.style.setProperty('--confetti-x', `${Math.random() * 100}vw`);
      particle.style.setProperty('--confetti-drift', `${(Math.random() - 0.5) * 34}vw`);
      particle.style.setProperty('--confetti-rotate', `${540 + Math.random() * 900}deg`);
      particle.style.setProperty('--confetti-delay', `${Math.random() * 0.55}s`);
      particle.style.setProperty('--confetti-duration', `${2.25 + Math.random() * 1.15}s`);
      particle.style.setProperty('--confetti-color', colors[index % colors.length]);
      fragment.appendChild(particle);
    }
    particles.appendChild(fragment);
  }

  const banner = document.createElement('div');
  banner.className = 'acceptance-celebration-banner';

  const seal = document.createElement('span');
  seal.className = 'acceptance-celebration-seal';
  seal.setAttribute('aria-hidden', 'true');
  seal.innerHTML = `
    <svg viewBox="0 0 24 24">
      <path d="M7 12.4 10.2 16 17.4 8.2"></path>
      <circle cx="12" cy="12" r="9"></circle>
    </svg>
  `;

  const copy = document.createElement('span');
  copy.className = 'acceptance-celebration-copy';
  const eyebrow = document.createElement('small');
  eyebrow.textContent = t('acceptanceCelebrationEyebrow');
  const heading = document.createElement('strong');
  heading.textContent = t('acceptanceCelebrationTitle');
  const body = document.createElement('span');
  body.textContent = tf('acceptanceCelebrationBody', { title });
  copy.append(eyebrow, heading, body);
  banner.append(seal, copy);
  layer.append(particles, banner);
  document.body.appendChild(layer);

  let removeTimer = null;
  const leaveTimer = window.setTimeout(() => {
    layer.classList.add('is-leaving');
    removeTimer = window.setTimeout(() => cleanup(), 520);
  }, reducedMotion ? 2400 : 3300);

  const cleanup = () => {
    clearTimeout(leaveTimer);
    if (removeTimer) clearTimeout(removeTimer);
    layer.remove();
    if (acceptanceCelebrationCleanup === cleanup) acceptanceCelebrationCleanup = null;
  };
  acceptanceCelebrationCleanup = cleanup;
}

// --- GLOBALLY ACCESSIBLE TOAST BANNER ---
function showGlobalToast(message, type = 'success') {
  let toast = document.querySelector('[data-global-toast]');
  if (!toast) {
    toast = document.createElement('div');
    toast.dataset.globalToast = 'true';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.zIndex = '999999';
    toast.style.padding = '10px 20px';
    toast.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.4)';
    toast.style.fontSize = '13px';
    document.body.appendChild(toast);
  }

  clearTimeout(toast._hideTimer);
  clearTimeout(toast._removeTimer);
  toast.className = `badge badge-${type === 'success' ? 'success' : 'danger'}`;
  toast.style.opacity = '1';
  toast.style.transition = 'none';
  toast.style.animation = 'slideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards';
  toast.textContent = message;

  toast._hideTimer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.25s ease';
    toast._removeTimer = setTimeout(() => toast.remove(), 250);
  }, 3000);
}
