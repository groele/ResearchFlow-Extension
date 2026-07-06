const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const popupJs = read('scripts/popup.js');
const sidepanelJs = read('scripts/sidepanel.js');
const optionsHtml = read('pages/options.html');

[
  ['POPUP_I18N', popupJs],
  ['applyPopupLanguage', popupJs],
  ["db.settings?.profile?.language || 'en'", popupJs],
  ["pt('saveCapturedNote')", popupJs],
  ["pt('paperFound'", popupJs],
  ['SIDE_I18N', sidepanelJs],
  ['applySidepanelLanguage', sidepanelJs],
  ["db.settings?.profile?.language || 'en'", sidepanelJs],
  ["st('captureActivePage')", sidepanelJs],
  ["st('couldNotReadMetadata')", sidepanelJs]
].forEach(([needle, source]) => {
  assert(source.includes(needle), `${needle} should be present in localized UI code`);
});

[
  'Personal Research OS',
  'Personal Research OS',
  'Save Captured Note',
  '保存采集笔记',
  'Could not read page metadata. Try refreshing.',
  '无法读取页面元数据，请刷新后重试。',
  'Structured Reading Notes',
  '结构化阅读笔记'
].forEach(text => {
  assert(
    popupJs.includes(text) || sidepanelJs.includes(text),
    `localized UI dictionaries should include "${text}"`
  );
});

assert(
  optionsHtml.includes('v1.2.14 Companion'),
  'options page should display the updated extension version'
);

console.log('i18n-ui tests passed');
