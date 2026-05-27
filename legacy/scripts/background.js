/**
 * ResearchFlow Companion - Background Service Worker v2.1 (Manifest V3)
 *
 * 所见即所得核心架构:
 *   ① Tab级内存缓存 (tabCache): 页面加载完成 → 预注入脚本 → 立即扫描 → 缓存结果
 *   ② GET_CACHED_SCRAPE: Sidepanel 优先查缓存，命中则 0ms 响应
 *   ③ CACHE_SCRAPE_RESULT: content.js 主动推送结果
 *   ④ Unpaywall 异步兜底 (不阻塞主流程)
 *
 * 性能目标: 点击 "Capture" → <30ms 显示结果 (缓存命中路径)
 */

importScripts('storage.js');

// ─── Tab级内存缓存 ────────────────────────────────────────────────────────────
// key: `${tabId}:${url}`, value: { metadata, timestamp }
// 注意: Service Worker 重启后缓存清空，自动降级为按需扫描
const tabCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5分钟 TTL

// 记录已成功注入 content.js 的 tab ID，避免重复注入尝试
const injectedTabs = new Set();

// Tab 关闭或刷新时清除记录
chrome.tabs.onRemoved.addListener((tabId) => {
  injectedTabs.delete(tabId);
  // 同时清除缓存
  for (const key of tabCache.keys()) {
    if (key.startsWith(`${tabId}:`)) tabCache.delete(key);
  }
});

function cacheSet(tabId, url, metadata) {
  // 每个Tab只保留最新结果，避免无限增长
  // 先删除同 tabId 的旧条目
  for (const key of tabCache.keys()) {
    if (key.startsWith(`${tabId}:`)) tabCache.delete(key);
  }
  tabCache.set(`${tabId}:${url}`, { metadata, timestamp: Date.now() });
}

function cacheGet(tabId, url) {
  const entry = tabCache.get(`${tabId}:${url}`);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    tabCache.delete(`${tabId}:${url}`);
    return null;
  }
  return entry.metadata;
}

// ─── 1. 安装与初始化 ──────────────────────────────────────────────────────────

self.addEventListener('install', () => {
  console.log('[ResearchFlow] Service Worker installing...');
  self.skipWaiting();
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('[ResearchFlow] Extension installed.');

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'capture-highlight-note',
      title: 'Log selection as Research Record Note',
      contexts: ['selection']
    });
  });

  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});

// ─── 2. Tab 预注入与缓存热身 ─────────────────────────────────────────────────

/**
 * 判断 URL 是否为学术页面（值得预注入）
 * 跳过浏览器内置页、扩展页、空白页等
 */
function isAcademicUrl(url) {
  if (!url) return false;
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) return false;
  if (url.startsWith('about:') || url.startsWith('data:') || url.startsWith('file://')) return false;
  if (url === 'https://newtab' || url.startsWith('edge://')) return false;

  // 已知学术域名 → 最高优先级
  const ACADEMIC_PATTERNS = [
    'arxiv.org', 'biorxiv.org', 'medrxiv.org',
    'pubmed.ncbi.nlm.nih.gov', 'pmc.ncbi.nlm.nih.gov',
    'nature.com', 'ieeexplore.ieee.org',
    'link.springer.com', 'springer.com/article',
    'sciencedirect.com', 'dl.acm.org',
    'onlinelibrary.wiley.com', 'journals.plos.org',
    'ssrn.com', 'researchgate.net',
    'semanticscholar.org', 'science.org',
    'cell.com', 'journals.aps.org', 'tandfonline.com',
    'academic.oup.com', 'royalsocietypublishing.org',
    'frontiersin.org', 'mdpi.com', 'hindawi.com',
    'cambridge.org/core', 'jstage.jst.go.jp'
  ];

  return ACADEMIC_PATTERNS.some(p => url.includes(p));
}

/**
 * 预注入 content.js 并触发缓存热身
 * 使用 injectedTabs Set 追踪已注入状态，避免自己侧产生一切错误
 */
async function preInjectAndCache(tabId, url) {
  if (!tabId || !url) return;
  if (!isAcademicUrl(url)) return;

  // 如果已有新鲜缓存，跳过
  if (cacheGet(tabId, url)) return;

  if (injectedTabs.has(tabId)) {
    // 脚本已注入但缓存为空（SW 重启导致缓存丢失）— 请内容脚本重新推送
    chrome.tabs.sendMessage(tabId, { action: 'PUSH_TO_CACHE' }, () => {
      void chrome.runtime.lastError; // 消费错误，如页面已卸载则徽略
    });
    return;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['scripts/content.js']
    });
    // 注入成功，标记该 tab
    injectedTabs.add(tabId);
    // content.js 会自动执行 proactiveInit() → pushToBackgroundCache()
    // 缓存会通过 CACHE_SCRAPE_RESULT 消息异步填充，这里无需额外操作
  } catch (err) {
    const msg = (err?.message || '').toLowerCase();
    // 以下均属于正常情况：页面受限 / 安全策略阻止 / Tab 已关闭
    const isBenign = (
      msg.includes('cannot access') ||
      msg.includes('no tab') ||
      msg.includes('frame') ||
      msg.includes('no frame') ||
      msg.includes('receiving end') ||
      msg.includes('connection') ||
      msg.includes('closed') ||
      // 脚本已注入（IIFE guard 返回无错误，但如果有其他错误则记录日志）
      msg.includes('script') && msg.includes('injected')
    );
    if (!isBenign) {
      // 确实的错误，输出警告但不报错
      console.warn('[ResearchFlow] preInjectAndCache failed:', err.message, 'tabId:', tabId);
    }
  }
}

// Tab 激活时预注入
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab?.status === 'complete') {
      preInjectAndCache(tabId, tab.url);
    }
  } catch (_) {}
});

// Tab 加载完成时预注入
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab?.url) {
    preInjectAndCache(tabId, tab.url);
  }
});

// ─── 3. 消息路由 ─────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // 3a. content.js 主动推送扫描结果到缓存
  if (request.action === 'CACHE_SCRAPE_RESULT') {
    const tabId = sender.tab?.id;
    const url = request.url || sender.tab?.url;
    if (tabId && url && request.metadata) {
      cacheSet(tabId, url, request.metadata);
    }
    sendResponse({ ok: true });
    return true;
  }

  // 3b. Sidepanel 查询缓存（命中则 0ms 响应）
  if (request.action === 'GET_CACHED_SCRAPE') {
    const cached = cacheGet(request.tabId, request.url);
    if (cached) {
      sendResponse({ hit: true, metadata: cached });
    } else {
      sendResponse({ hit: false });
    }
    return true;
  }

  // 3c. 强制数据库同步
  if (request.action === 'TRIGGER_SYNC') {
    storage.syncDatabaseNow()
      .then(res  => sendResponse(res))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // 3d. Unpaywall 开放获取 PDF 查询（由 sidepanel 发起，结果异步推送）
  if (request.action === 'FETCH_PDF_VIA_UNPAYWALL') {
    const { doi } = request;
    if (!doi) {
      sendResponse({ success: false, reason: 'no_doi' });
      return true;
    }

    fetchUnpaywallPdf(doi)
      .then(pdfUrl => {
        if (pdfUrl) {
          chrome.runtime.sendMessage({
            action: 'PDF_URL_FOUND',
            source: 'unpaywall',
            pdfUrl,
            doi
          }).catch(() => {});
        }
        sendResponse({ success: !!pdfUrl, pdfUrl: pdfUrl || '' });
      })
      .catch(err => {
        console.warn('[ResearchFlow] Unpaywall error:', err.message);
        sendResponse({ success: false, reason: err.message });
      });
    return true;
  }

});

// ─── 4. 右键菜单：高亮文本捕获 ───────────────────────────────────────────────

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'capture-highlight-note' || !info.selectionText) return;

  try {
    const db = await storage.loadAll();

    let projectId = db.projects[0]?.id;
    if (!projectId) {
      projectId = 'proj_general';
      db.projects.push({
        id: projectId,
        userId: 'user',
        title: 'General In-Context Notes',
        discipline: 'General Science',
        hypothesis: '',
        abstract: 'General folder for research highlights captured from the web',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    const highlightedRecord = {
      id: 'rec_' + Math.random().toString(36).substring(2, 9),
      userId: 'user',
      projectId,
      schemaTemplateId: null,
      title: `Captured Highlight: ${(tab.title || '').slice(0, 30)}...`,
      recordType: 'literature_review',
      methodology: `Scraped directly from page ${tab.url}`,
      recordedDate: new Date().toISOString(),
      attributes: {
        highlightedQuote: info.selectionText,
        sourceUrl: tab.url
      },
      dataPath: tab.url,
      externalRef: null,
      summary: `"${info.selectionText}"`,
      tags: ['web-highlight'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.researchRecords.push(highlightedRecord);
    await storage.saveAll(db);
    console.log('[ResearchFlow] Highlight record logged.');
  } catch (e) {
    console.error('[ResearchFlow] Error logging highlight:', e);
  }
});

// ─── 5. Unpaywall API 查询 ────────────────────────────────────────────────────

/**
 * 通过 Unpaywall 免费 API 查找开放获取 PDF URL
 * 文档: https://unpaywall.org/products/api
 * @param {string} doi
 * @returns {Promise<string>} pdfUrl 或 ''
 */
async function fetchUnpaywallPdf(doi) {
  const cleanDoi = doi.replace(/^https?:\/\/doi\.org\//i, '').trim();
  if (!cleanDoi) return '';

  const url = `https://api.unpaywall.org/v2/${encodeURIComponent(cleanDoi)}?email=researchflow-companion@users.tool`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeout);

    if (!res.ok) {
      if (res.status === 404) return '';
      throw new Error(`Unpaywall HTTP ${res.status}`);
    }

    const data = await res.json();

    const best = data.best_oa_location;
    if (best?.url_for_pdf) return best.url_for_pdf;
    if (best?.url)         return best.url;

    if (Array.isArray(data.oa_locations)) {
      for (const loc of data.oa_locations) {
        if (loc.url_for_pdf) return loc.url_for_pdf;
      }
      if (data.oa_locations[0]?.url) return data.oa_locations[0].url;
    }

    return '';
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      console.warn('[ResearchFlow] Unpaywall request timed out:', cleanDoi);
    }
    return '';
  }
}
