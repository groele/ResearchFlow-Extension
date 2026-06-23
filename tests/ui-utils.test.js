const assert = require('node:assert/strict');

const RFUI = require('../scripts/ui-utils.js');

assert.equal(RFUI.cleanDoiFromText('https://doi.org/10.1038/s41586-024-12345-6.'), '10.1038/s41586-024-12345-6');
assert.equal(RFUI.cleanDoiFromText(undefined), '');

assert.equal(RFUI.cleanResearchTitle(undefined), '');
assert.equal(RFUI.cleanResearchTitle('Nature: Example Paper | Nature'), 'Example Paper');
assert.equal(RFUI.cleanResearchTitle('PubMed - A precise result - PubMed'), 'A precise result');

assert.equal(RFUI.getToastBadgeClass('success'), 'badge badge-success');
assert.equal(RFUI.getToastBadgeClass('danger'), 'badge badge-danger');
assert.equal(RFUI.getToastBadgeClass('error'), 'badge badge-danger');
assert.equal(RFUI.getToastBadgeClass('info'), 'badge badge-info');
assert.equal(RFUI.getToastBadgeClass('unknown'), 'badge badge-warning');

assert.equal(RFUI.shouldAutoCapture({
  capturePaneActive: true,
  scrapeButtonDisabled: false,
  formDirty: false,
  activeTabKey: '1:https://example.com/a',
  lastCapturedTabKey: ''
}), true);

assert.equal(RFUI.shouldAutoCapture({
  capturePaneActive: true,
  scrapeButtonDisabled: false,
  formDirty: true,
  activeTabKey: '1:https://example.com/a',
  lastCapturedTabKey: ''
}), false);

assert.equal(RFUI.shouldAutoCapture({
  capturePaneActive: true,
  scrapeButtonDisabled: false,
  formDirty: false,
  activeTabKey: '1:https://example.com/a',
  lastCapturedTabKey: '1:https://example.com/a'
}), false);

console.log('ui-utils tests passed');
