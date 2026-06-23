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

  const api = {
    cleanDoiFromText,
    cleanResearchTitle,
    normalizeFeedbackType,
    getToastBadgeClass,
    getTabKey,
    shouldAutoCapture
  };

  root.RFUI = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
