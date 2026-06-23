(function initResearchFlowUiUtils(root) {
  const DOI_PATTERN = /(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i;

  function cleanDoiFromText(value) {
    if (!value) return '';
    const match = String(value).match(DOI_PATTERN);
    if (!match) return '';
    return match[1]
      .replace(/^doi:\s*/i, '')
      .replace(/^https?:\/\/doi\.org\//i, '')
      .replace(/[.,;)\s]+$/, '')
      .trim();
  }

  function cleanResearchTitle(value) {
    if (!value) return '';
    return String(value)
      .replace(/^(arXiv|PubMed|bioRxiv|Nature|Science|IEEE|Springer|Wiley|ACS)\s*(:|：|-)\s*/i, '')
      .replace(/\s*\|\s*.*$/g, '')
      .replace(/\s*-\s*PubMed$/i, '')
      .trim();
  }

  function normalizeFeedbackType(type) {
    if (type === 'success') return 'success';
    if (type === 'danger' || type === 'error') return 'danger';
    if (type === 'info') return 'info';
    return 'warning';
  }

  function getToastBadgeClass(type) {
    return `badge badge-${normalizeFeedbackType(type)}`;
  }

  function getTabKey(tab) {
    if (!tab) return '';
    return `${tab.id || 'active'}:${tab.url || ''}`;
  }

  function toDateInputValue(value, fallbackValue = '') {
    if (!value) return fallbackValue;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return fallbackValue;
    return parsed.toISOString().slice(0, 10);
  }

  function toNoonIsoDate(value) {
    const inputValue = toDateInputValue(value);
    return inputValue ? `${inputValue}T12:00:00.000Z` : null;
  }

  function getRecordFormMode(record = null, options = {}) {
    const isDuplicate = Boolean(record && options.duplicate);
    const isEdit = Boolean(record && !isDuplicate);
    if (isDuplicate) {
      return {
        isEdit: false,
        isDuplicate: true,
        title: 'Duplicate Research Record',
        submitLabel: 'Create Copy'
      };
    }
    if (isEdit) {
      return {
        isEdit: true,
        isDuplicate: false,
        title: 'Modify Research Record',
        submitLabel: 'Save Changes'
      };
    }
    return {
      isEdit: false,
      isDuplicate: false,
      title: 'Log New Research Record',
      submitLabel: 'Log Record'
    };
  }

  function shouldAutoCapture(state) {
    return Boolean(
      state &&
      state.capturePaneActive &&
      !state.scrapeButtonDisabled &&
      !state.formDirty &&
      state.activeTabKey &&
      state.activeTabKey !== state.lastCapturedTabKey
    );
  }

  function shouldNotifyMetadataCaptureFailure(state) {
    return Boolean(state && !state.isAutomaticCapture);
  }

  function buildSubmissionIdentityUpdate(values = {}) {
    const title = String(values.title || '').trim();
    const journal = String(values.journal || '').trim();
    const journalUrl = String(values.journalUrl || '').trim();

    if (!title) {
      return { ok: false, error: 'Manuscript title is required.' };
    }

    if (journalUrl) {
      try {
        new URL(journalUrl);
      } catch (_) {
        return { ok: false, error: 'Journal URL must be a valid URL.' };
      }
    }

    return { ok: true, title, journal, journalUrl };
  }

  function buildSubmissionEditCenterUpdate(values = {}) {
    const identity = buildSubmissionIdentityUpdate(values);
    if (!identity.ok) return identity;

    const articleUrl = String(values.articleUrl || '').trim();
    if (articleUrl) {
      try {
        new URL(articleUrl);
      } catch (_) {
        return { ok: false, error: 'Article URL must be a valid URL.' };
      }
    }

    const allowedStatuses = new Set([
      'submitted',
      'under_review',
      'revision',
      'accepted',
      'published',
      'rejected'
    ]);
    const status = String(values.status || 'submitted').trim();

    return {
      ok: true,
      title: identity.title,
      journal: identity.journal,
      journalUrl: identity.journalUrl,
      status: allowedStatuses.has(status) ? status : 'submitted',
      submissionDate: String(values.submissionDate || '').trim(),
      firstDecisionDate: String(values.firstDecisionDate || '').trim(),
      revisionDueDate: String(values.revisionDueDate || '').trim(),
      decisionDate: String(values.decisionDate || '').trim(),
      doi: cleanDoiFromText(values.doi) || String(values.doi || '').trim(),
      articleUrl
    };
  }

  function buildSubmissionEditSyncPlan(values = {}) {
    const update = buildSubmissionEditCenterUpdate(values);
    if (!update.ok) return update;

    const isPublicationStatus = update.status === 'accepted' || update.status === 'published';
    const doi = cleanDoiFromText(update.doi) || String(update.doi || '').trim();
    const articleUrl = update.articleUrl || (doi ? `https://doi.org/${doi}` : '');
    const decisionDate = toNoonIsoDate(update.decisionDate);
    const firstDecisionDate = toNoonIsoDate(update.firstDecisionDate);

    return {
      ok: true,
      manuscriptPatch: {
        title: update.title,
        targetJournals: update.journal ? [update.journal] : []
      },
      detachedSubmissionTitle: update.title,
      submissionPatch: {
        targetJournal: update.journal || null,
        journalUrl: update.journalUrl || null,
        submissionDate: toNoonIsoDate(update.submissionDate),
        firstDecisionDate,
        revisionDueDate: toNoonIsoDate(update.revisionDueDate),
        decisionDate,
        status: update.status
      },
      publicationPatch: isPublicationStatus
        ? {
            doi: doi || null,
            articleUrl: articleUrl || null
          }
        : null,
      shouldClearPublication: !isPublicationStatus,
      shouldMarkRejected: update.status === 'rejected',
      rejectionDate: update.status === 'rejected'
        ? (update.decisionDate || update.firstDecisionDate || '')
        : ''
    };
  }

  function buildSubmissionCreateMode(values = {}) {
    const selectedManuscriptId = String(values.selectedManuscriptId || '').trim();
    const targetJournal = String(values.targetJournal || '').trim();
    const title = String(values.newManuscriptTitle || '').trim();
    const isNew = selectedManuscriptId === '__new__';

    if (!targetJournal) {
      return { ok: false, error: 'Target journal is required.' };
    }
    if (isNew && !title) {
      return { ok: false, error: 'Manuscript title is required.' };
    }
    if (!isNew && !selectedManuscriptId) {
      return { ok: false, error: 'Select or create a manuscript first.' };
    }

    return {
      ok: true,
      mode: isNew ? 'new' : 'existing',
      manuscriptId: isNew ? '' : selectedManuscriptId,
      targetJournal,
      title
    };
  }

  const api = {
    cleanDoiFromText,
    cleanResearchTitle,
    normalizeFeedbackType,
    getToastBadgeClass,
    getTabKey,
    toDateInputValue,
    getRecordFormMode,
    shouldAutoCapture,
    shouldNotifyMetadataCaptureFailure,
    buildSubmissionIdentityUpdate,
    buildSubmissionEditCenterUpdate,
    buildSubmissionEditSyncPlan,
    buildSubmissionCreateMode
  };

  root.RFUI = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
