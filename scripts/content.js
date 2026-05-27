/**
 * ResearchFlow Companion - Content Scraper v2.1
 *
 * 分层PDF检测架构:
 *   层1: Meta标签扫描 (同步, ~1ms)
 *   层2: 平台专属DOM解析器 (~5ms)
 *   层3: 通用启发式PDF链接扫描 (~20ms)
 *   层4: Unpaywall API (由background.js异步执行, ~500ms)
 *
 * 所见即所得优化:
 *   - 脚本加载时立即扫描并将结果推送到 background tab cache
 *   - Sidepanel 通过缓存命中实现零延迟响应
 *   - 防重复注入保护：同页面只运行一次
 */

// ─── 防重复注入保护（executeScript 可能被调用多次）───────────────────────────
// 用 window.__rf_injected 做标志；用 IIFE 包裹，避免 throw 产生未捕获异常
(function rfContentScriptMain() {
  if (window.__rf_injected) {
    // 脚本已初始化：静默退出，不重复注册监听器和推送
    // 如果 background 需要刷新缓存，会发送 PUSH_TO_CACHE 消息
    return;
  }
  window.__rf_injected = true;

// ─── 消息监听器 ───────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 按需扫描（sidepanel fallback 路径）
  if (request.action === 'SCRAPE_PAGE') {
    try {
      const metadata = scrapeAcademicMetadata();
      pushToBackgroundCache(metadata);
      sendResponse(metadata);
    } catch (e) {
      console.error('[ResearchFlow] Scrape error:', e);
      sendResponse({
        title: document.title, doi: '', authors: [], abstract: '',
        pdfUrl: '', journal: '', sourceUrl: window.location.href,
        pubDate: '', siteType: 'generic'
      });
    }
    return true;
  }
  // background 请求重新推送缓存（tab 激活且缓存为空时触发）
  if (request.action === 'PUSH_TO_CACHE') {
    try {
      const metadata = scrapeAcademicMetadata();
      pushToBackgroundCache(metadata);
      sendResponse({ ok: true });
    } catch (e) {
      sendResponse({ ok: false });
    }
    return true;
  }
  return false; // 未处理的消息：不保持通道
});

// ─── 缓存推送辅助 ─────────────────────────────────────────────────────────────
function pushToBackgroundCache(metadata) {
  try {
    chrome.runtime.sendMessage(
      { action: 'CACHE_SCRAPE_RESULT', metadata, url: window.location.href },
      // 必须提供回调以消费 lastError，否则 MV3 会报 Unchecked runtime.lastError
      () => { void chrome.runtime.lastError; }
    );
  } catch (_) { /* 扩展上下文失效时忽略 */ }
}

// ─── 主入口 ──────────────────────────────────────────────────────────────────

function scrapeAcademicMetadata() {
  const url = window.location.href;
  const meta = {
    title:     document.title,
    doi:       '',
    authors:   [],
    abstract:  '',
    pdfUrl:    '',
    journal:   '',
    sourceUrl: url,
    pubDate:   '',
    siteType:  'generic'
  };

  // ── 层1: 标准 Meta 标签 (Dublin Core / Highwire Press) ──
  extractMetaTags(meta);

  // ── 层2: 平台专属解析器 ──
  const siteType = detectSiteType(url);
  meta.siteType = siteType;
  PLATFORM_SCRAPERS[siteType]?.(meta);

  // ── 层3: 通用启发式PDF链接检测 (当前两层均未找到PDF URL时触发) ──
  if (!meta.pdfUrl) {
    meta.pdfUrl = findPdfLinkHeuristic();
  }

  // ── 层3b: 通用DOI检测 (meta标签和专属解析器均未找到DOI时触发) ──
  if (!meta.doi) {
    meta.doi = findDoiOnPage();
  }

  // ── DOI 清理 ──
  if (meta.doi) {
    meta.doi = meta.doi
      .replace(/^doi:\s*/i, '')
      .replace(/^https?:\/\/doi\.org\//i, '')
      .replace(/[.,;)\s]+$/, '')
      .trim();
  }

  // ── 字符串清理 ──
  meta.title    = cleanString(meta.title);
  meta.abstract = cleanString(meta.abstract);

  return meta;
}

// ─── 平台识别 ────────────────────────────────────────────────────────────────

function detectSiteType(url) {
  if (url.includes('arxiv.org'))                                        return 'arxiv';
  if (url.includes('biorxiv.org') || url.includes('medrxiv.org'))      return 'biorxiv';
  if (url.includes('pubmed.ncbi.nlm.nih.gov'))                         return 'pubmed';
  if (url.includes('pmc.ncbi.nlm.nih.gov'))                            return 'pmc';
  if (url.includes('nature.com'))                                       return 'nature';
  if (url.includes('ieeexplore.ieee.org'))                              return 'ieee';
  if (url.includes('link.springer.com') || url.includes('springer.com')) return 'springer';
  if (url.includes('sciencedirect.com') || url.includes('elsevier.com')) return 'sciencedirect';
  if (url.includes('dl.acm.org'))                                       return 'acm';
  if (url.includes('onlinelibrary.wiley.com') || url.includes('wiley.com')) return 'wiley';
  if (url.includes('journals.plos.org') || url.includes('plosone.org')) return 'plos';
  if (url.includes('ssrn.com'))                                         return 'ssrn';
  if (url.includes('researchgate.net'))                                 return 'researchgate';
  if (url.includes('semanticscholar.org'))                              return 'semanticscholar';
  if (url.includes('scholar.google.com'))                               return 'scholar';
  if (url.includes('overleaf.com'))                                     return 'overleaf';
  if (url.includes('science.org') || url.includes('sciencemag.org'))   return 'science';
  if (url.includes('cell.com'))                                         return 'cell';
  if (url.includes('aps.org') || url.includes('journals.aps.org'))     return 'aps';
  if (url.includes('tandfonline.com'))                                  return 'tandfonline';
  return 'generic';
}

// ─── 平台专属解析器注册表 ────────────────────────────────────────────────────

const PLATFORM_SCRAPERS = {

  arxiv(meta) {
    meta.journal = 'arXiv';
    // 标题
    const titleEl = document.querySelector('h1.title, h1.arxiv-title');
    if (titleEl) meta.title = titleEl.textContent.replace(/^title:\s*/i, '').trim();
    // 作者
    const authorEls = document.querySelectorAll('.authors a, .arxiv-authors a');
    if (authorEls.length > 0) meta.authors = Array.from(authorEls).map(el => el.textContent.trim()).filter(Boolean);
    // 摘要
    const absEl = document.querySelector('blockquote.abstract');
    if (absEl) meta.abstract = absEl.textContent.replace(/^abstract:\s*/i, '').trim();
    // PDF URL — 优先读取页面链接，否则构造
    const pdfLink = document.querySelector(
      'a.download-pdf, .extra-services .full-text a[href*="/pdf"], a[href*="arxiv.org/pdf"]'
    );
    if (pdfLink) {
      meta.pdfUrl = pdfLink.href;
    } else {
      const m = window.location.href.match(/(?:abs|html)\/([^?#]+)/);
      if (m) meta.pdfUrl = `https://arxiv.org/pdf/${m[1]}.pdf`;
    }
    // DOI (arXiv论文DOI格式: 10.48550/arXiv.xxxx.xxxxx)
    if (!meta.doi) {
      const m = window.location.href.match(/abs\/(\d{4}\.\d{4,5}(?:v\d+)?)/);
      if (m) meta.doi = `10.48550/arXiv.${m[1]}`;
    }
    // 发表日期
    const dateEl = document.querySelector('.dateline, .submission-history');
    if (dateEl) meta.pubDate = dateEl.textContent.replace(/\s+/g, ' ').trim().substring(0, 60);
  },

  biorxiv(meta) {
    meta.journal = window.location.href.includes('medrxiv.org') ? 'medRxiv' : 'bioRxiv';
    // 摘要
    const absEl = document.querySelector('.section.abstract p, #abstract p, .abstract-content p');
    if (absEl && !meta.abstract) meta.abstract = absEl.textContent.trim();
    // PDF (meta citation_pdf_url 通常已涵盖; 备用选择器)
    if (!meta.pdfUrl) {
      const pdfEl = document.querySelector('a.article-dl-pdf-link, a[href$=".full.pdf"], a[href*="/full.pdf"]');
      if (pdfEl) meta.pdfUrl = pdfEl.href;
    }
    // 日期
    const dateEl = document.querySelector('.pub-date, .article-date');
    if (dateEl && !meta.pubDate) meta.pubDate = dateEl.textContent.trim();
  },

  pubmed(meta) {
    meta.journal = document.querySelector('.journal-actions-trigger')?.textContent?.trim() || meta.journal;
    // 标题
    const titleEl = document.querySelector('h1.heading-title, .article-details h1');
    if (titleEl) meta.title = titleEl.textContent.trim();
    // 作者
    const authorEls = document.querySelectorAll('.authors-list-item .full-name, .authors .author-list-item button');
    if (authorEls.length > 0) meta.authors = Array.from(authorEls).map(el => el.textContent.trim()).filter(Boolean);
    // 摘要
    const absEl = document.querySelector('#eng-abstract, .abstract-content, #abstract .abstract-content');
    if (absEl) meta.abstract = absEl.textContent.replace(/\s+/g, ' ').trim();
    // DOI
    const doiEl = document.querySelector('.citation-doi, a[data-ga-category="full-text-links"][href*="doi.org"]');
    if (doiEl && !meta.doi) meta.doi = (doiEl.textContent || doiEl.href || '').trim();
    // PDF/Full text link — PubMed本身无PDF，指向期刊
    const ftLink = document.querySelector('.full-text-links-list a, a[data-ga-category="full-text-links"]');
    if (ftLink && !meta.pdfUrl) meta.pdfUrl = ftLink.href;
    // 日期
    const dateEl = document.querySelector('.cit, span.citation-year');
    if (dateEl && !meta.pubDate) meta.pubDate = dateEl.textContent.trim().substring(0, 20);
  },

  pmc(meta) {
    meta.journal = document.querySelector('.fm-jrnl, .jrnl')?.textContent?.trim() || meta.journal;
    const absEl = document.querySelector('#abstract p, .abstract p');
    if (absEl && !meta.abstract) meta.abstract = absEl.textContent.trim();
    // PMC 提供免费PDF
    const pdfEl = document.querySelector('a[href*="pdf"], a.pdf-link, .pdf-link a');
    if (pdfEl && !meta.pdfUrl) meta.pdfUrl = pdfEl.href;
  },

  nature(meta) {
    meta.journal = document.querySelector('.c-article-info-details [data-test="journal-title"], .app-article-masthead__journal a')?.textContent?.trim() || 'Nature';
    // 标题
    const titleEl = document.querySelector('h1.c-article-title, h1[data-article-title]');
    if (titleEl) meta.title = titleEl.textContent.trim();
    // 作者
    const authorEls = document.querySelectorAll('li.c-article-author-list__item a, .c-article-author-list a');
    if (authorEls.length > 0) meta.authors = Array.from(authorEls).map(el => el.textContent.trim()).filter(Boolean);
    // 摘要
    const absEl = document.querySelector('#Abs1-content p, section[data-title="Abstract"] p, .c-article-section__content p');
    if (absEl && !meta.abstract) meta.abstract = absEl.textContent.trim();
    // PDF
    const pdfEl = document.querySelector(
      'a[data-article-pdf], a.c-article-item__pdf-button, a[href*="/articles/"][href$=".pdf"], ' +
      'a.c-pdf-download__link, [data-track-action="download pdf"] a, a[data-track-action="download pdf"]'
    );
    if (pdfEl) meta.pdfUrl = pdfEl.href;
    // DOI
    const doiEl = document.querySelector('a[data-track-action="view doi"], .c-article-info-details a[href*="doi.org"]');
    if (doiEl && !meta.doi) meta.doi = doiEl.href;
    // 日期
    const dateEl = document.querySelector('time[itemprop="datePublished"], .c-article-info-details time');
    if (dateEl && !meta.pubDate) meta.pubDate = dateEl.getAttribute('datetime') || dateEl.textContent.trim();
  },

  ieee(meta) {
    meta.journal = document.querySelector('.stats-document-abstract-publishedIn a, .publication-title')?.textContent?.trim() || 'IEEE';
    // IEEE使用React渲染，数据可能在 script 标签中
    // 优先从页面JSON-LD提取
    const ldJson = extractJsonLd();
    if (ldJson) {
      if (ldJson.name && !meta.title)              meta.title    = ldJson.name;
      if (ldJson.description && !meta.abstract)    meta.abstract = ldJson.description;
      if (ldJson.author && !meta.authors?.length) {
        meta.authors = Array.isArray(ldJson.author)
          ? ldJson.author.map(a => a.name || a).filter(Boolean)
          : [ldJson.author];
      }
    }
    // 标题备用
    const titleEl = document.querySelector('h1.document-title span, h1.title, .document-title');
    if (titleEl && !meta.title) meta.title = titleEl.textContent.trim();
    // 摘要
    const absEl = document.querySelector('.abstract-text .u-mb-1, div.abstract-text');
    if (absEl && !meta.abstract) meta.abstract = absEl.textContent.replace(/^abstract:\s*/i, '').trim();
    // PDF — IEEE有直接PDF按钮
    const pdfEl = document.querySelector(
      'a.pdf-btn-link, a[href*="/stamp/stamp.jsp"], a[href*="ieeexplore.ieee.org"][href*=".pdf"], ' +
      '.pdf-btn a, button.xpl-btn-pdf + a, a[aria-label*="PDF"]'
    );
    if (pdfEl) {
      // stamp.jsp链接需要转换
      let href = pdfEl.href || '';
      if (href.includes('stamp/stamp.jsp') && href.includes('arnumber=')) {
        const arnMatch = href.match(/arnumber=(\d+)/);
        if (arnMatch) href = `https://ieeexplore.ieee.org/stamp/stamp.jsp?arnumber=${arnMatch[1]}`;
      }
      meta.pdfUrl = href;
    }
    // 日期
    const dateEl = document.querySelector('.doc-abstract-pubdate, .u-pb-1.doc-abstract-pubdate');
    if (dateEl && !meta.pubDate) meta.pubDate = dateEl.textContent.trim();
  },

  springer(meta) {
    meta.journal = document.querySelector('.app-article-masthead__journal a, .ArticleContext__journalTitle a, #journal-title')?.textContent?.trim() || 'Springer';
    // 标题
    const titleEl = document.querySelector('h1.ArticleTitle, h1.c-article-title, h1[data-test="article-title"]');
    if (titleEl) meta.title = titleEl.textContent.trim();
    // 作者
    const authorEls = document.querySelectorAll('.authors__list .authors__name, a.c-article-author-list__item');
    if (authorEls.length > 0) meta.authors = Array.from(authorEls).map(el => el.textContent.trim()).filter(Boolean);
    // 摘要
    const absEl = document.querySelector('#Abs1-content p, section#Abs1 p, .AbstractSection p');
    if (absEl && !meta.abstract) meta.abstract = absEl.textContent.trim();
    // PDF
    const pdfEl = document.querySelector(
      'a.c-pdf-download__link, a[data-track-action="Book PDF"], a[href*=".pdf"][data-track-action], ' +
      'a.pdf-download-btn, a[data-test="pdf-link"]'
    );
    if (pdfEl) meta.pdfUrl = pdfEl.href;
    // DOI
    const doiEl = document.querySelector('a[href*="doi.org/10."], .c-bibliographic-information__value a[href*="doi.org"]');
    if (doiEl && !meta.doi) meta.doi = doiEl.href;
    // 日期
    const dateEl = document.querySelector('time[itemprop="datePublished"], .c-article-info-details time');
    if (dateEl && !meta.pubDate) meta.pubDate = dateEl.getAttribute('datetime') || dateEl.textContent.trim();
  },

  sciencedirect(meta) {
    meta.journal = document.querySelector('.publication-title-link, .js-publication-title')?.textContent?.trim() || 'Elsevier';
    // ScienceDirect大量使用React，优先JSON-LD
    const ldJson = extractJsonLd();
    if (ldJson) {
      if (ldJson.name && !meta.title)           meta.title    = ldJson.name;
      if (ldJson.description && !meta.abstract) meta.abstract = ldJson.description;
    }
    // 标题备用
    const titleEl = document.querySelector('h1.title-text, span.title-text, h1[class*="ArticleTitle"]');
    if (titleEl && !meta.title) meta.title = titleEl.textContent.trim();
    // 作者
    const authorEls = document.querySelectorAll('.author-name span.given-name, .authors-group .author');
    if (authorEls.length > 0 && !meta.authors?.length) {
      meta.authors = Array.from(authorEls).map(el => el.textContent.trim()).filter(Boolean);
    }
    // 摘要
    const absEl = document.querySelector('.abstract.author p, div.abstract p, #abstracts p');
    if (absEl && !meta.abstract) meta.abstract = absEl.textContent.trim();
    // PDF
    const pdfEl = document.querySelector(
      'a.pdf-download, a[href*="pdfft"], button[data-aa-button="PDF download"], ' +
      'a[class*="download-pdf"], a[href*="/pii/"][href*="pdf"]'
    );
    if (pdfEl) meta.pdfUrl = pdfEl.href;
    // DOI
    const doiEl = document.querySelector('a.anchor.doi, a[href*="doi.org/10."]');
    if (doiEl && !meta.doi) meta.doi = doiEl.href;
  },

  acm(meta) {
    meta.journal = document.querySelector('.epub-section__title, .issue-item__detail a')?.textContent?.trim() || 'ACM';
    // 标题
    const titleEl = document.querySelector('h1.citation__title, .citation__title');
    if (titleEl) meta.title = titleEl.textContent.trim();
    // 作者
    const authorEls = document.querySelectorAll('.author-name, .loa a[title]');
    if (authorEls.length > 0) meta.authors = Array.from(authorEls).map(el => (el.getAttribute('title') || el.textContent).trim()).filter(Boolean);
    // 摘要
    const absEl = document.querySelector('.abstractSection p, section#abstract p');
    if (absEl && !meta.abstract) meta.abstract = absEl.textContent.trim();
    // PDF
    const pdfEl = document.querySelector('a.btn--pdf, a[href*="/doi/pdf/"], a[href$=".pdf"][class*="pdf"]');
    if (pdfEl) meta.pdfUrl = pdfEl.href;
    // DOI
    const doiEl = document.querySelector('a[href*="doi.org/10."]');
    if (doiEl && !meta.doi) meta.doi = doiEl.href;
    // 日期
    const dateEl = document.querySelector('.issue-item__detail .dot-separator');
    if (dateEl && !meta.pubDate) meta.pubDate = dateEl.textContent.trim();
  },

  wiley(meta) {
    meta.journal = document.querySelector('.journal-banner-title, .productTitle a, .journal-title')?.textContent?.trim() || 'Wiley';
    // 标题
    const titleEl = document.querySelector('h1.citation__title, h1[class*="article-title"]');
    if (titleEl) meta.title = titleEl.textContent.trim();
    // 作者
    const authorEls = document.querySelectorAll('.loa-authors .accordion-tabbed__tab-mobile a, .author-name');
    if (authorEls.length > 0) meta.authors = Array.from(authorEls).map(el => el.textContent.trim()).filter(Boolean);
    // 摘要
    const absEl = document.querySelector('section.article-section.article-section__abstract p, .article-section__content p');
    if (absEl && !meta.abstract) meta.abstract = absEl.textContent.trim();
    // PDF
    const pdfEl = document.querySelector(
      'a.article-support-text[href*="pdf"], a[href*="epdf"], a.pdf-download, ' +
      'a[data-track="PDF download"], a[class*="pdf-download"]'
    );
    if (pdfEl) meta.pdfUrl = pdfEl.href;
    // DOI
    const doiEl = document.querySelector('a[href*="doi.org/10."]');
    if (doiEl && !meta.doi) meta.doi = doiEl.href;
  },

  plos(meta) {
    meta.journal = document.querySelector('#breadcrumb li:nth-child(2) a, .journal-name')?.textContent?.trim() || 'PLOS';
    // 摘要
    const absEl = document.querySelector('.abstract-content p, #artText .abstract p');
    if (absEl && !meta.abstract) meta.abstract = absEl.textContent.trim();
    // PDF
    const pdfEl = document.querySelector(
      'a[data-interactable-type="download-pdf"], a.btn-pdf, a[href*="type=printable"], ' +
      'a[id*="downloadPdf"], a[href*="/article/file"][href*="type=printable"]'
    );
    if (pdfEl) meta.pdfUrl = pdfEl.href;
    // 构造PDF URL (PLOS有固定格式)
    if (!meta.pdfUrl && meta.doi) {
      meta.pdfUrl = `https://journals.plos.org/plosone/article/file?id=${encodeURIComponent(meta.doi)}&type=printable`;
    }
  },

  ssrn(meta) {
    meta.journal = 'SSRN';
    // 标题
    const titleEl = document.querySelector('h1[itemprop="name"], .paper-title h1');
    if (titleEl) meta.title = titleEl.textContent.trim();
    // 作者
    const authorEls = document.querySelectorAll('.authors a[href*="author="], .author-name');
    if (authorEls.length > 0) meta.authors = Array.from(authorEls).map(el => el.textContent.trim()).filter(Boolean);
    // 摘要
    const absEl = document.querySelector('.abstract-text p, [class*="abstract"] p');
    if (absEl && !meta.abstract) meta.abstract = absEl.textContent.trim();
    // PDF
    const pdfEl = document.querySelector('a.abstractDownloadLink[href*="pdf"], a[href*="delivery.php"], a.ssrn-link[href*="pdf"]');
    if (pdfEl) meta.pdfUrl = pdfEl.href;
    // DOI
    const doiEl = document.querySelector('a[href*="doi.org/10."]');
    if (doiEl && !meta.doi) meta.doi = doiEl.href;
  },

  researchgate(meta) {
    meta.journal = 'ResearchGate';
    // ResearchGate 重度JavaScript渲染，尝试从meta和JSON-LD提取
    const ldJson = extractJsonLd();
    if (ldJson) {
      if (ldJson.name && !meta.title)           meta.title    = ldJson.name;
      if (ldJson.description && !meta.abstract) meta.abstract = ldJson.description;
    }
    // 标题备用
    const titleEl = document.querySelector('[class*="research-detail-header-section"] h1');
    if (titleEl && !meta.title) meta.title = titleEl.textContent.trim();
    // PDF
    const pdfEl = document.querySelector(
      'a[data-testid="pdf-link"], a[class*="download"][href*="pdf"], ' +
      'a[href*="/publication/"][href*="/fulltext/"]'
    );
    if (pdfEl) meta.pdfUrl = pdfEl.href;
  },

  semanticscholar(meta) {
    meta.journal = 'Semantic Scholar';
    const titleEl = document.querySelector('h1[data-test-id="paper-detail-title"], h1.paper-detail-title');
    if (titleEl) meta.title = titleEl.textContent.trim();
    const absEl = document.querySelector('[data-test-id="paper-abstract"] p, .abstract__text');
    if (absEl && !meta.abstract) meta.abstract = absEl.textContent.trim();
    // PDF via Open Access
    const pdfEl = document.querySelector('a[data-heap-id*="pdf"], a[href*="pdf"][class*="flex-row"]');
    if (pdfEl) meta.pdfUrl = pdfEl.href;
  },

  scholar(meta) {
    meta.journal = meta.journal || 'Google Scholar';
    // Google Scholar结果页面 — 仅尝试提取标题/PDF链接
    const titleEl = document.querySelector('#gs_res_ccl_mid .gs_rt a, h3.gs_rt a');
    if (titleEl) { meta.title = titleEl.textContent.trim(); meta.pdfUrl = titleEl.href; }
    const pdfEl = document.querySelector('.gs_or_ggsm a[href*=".pdf"], a.gs_ggs a');
    if (pdfEl) meta.pdfUrl = pdfEl.href;
  },

  science(meta) {
    meta.journal = document.querySelector('.journal-banner span, .core-self-citation .title')?.textContent?.trim() || 'Science';
    const absEl = document.querySelector('.section.abstract p, #abstract p');
    if (absEl && !meta.abstract) meta.abstract = absEl.textContent.trim();
    const pdfEl = document.querySelector('a[href*="/doi/pdf/"], a.c-pdf-download__link, a[data-article-pdf]');
    if (pdfEl) meta.pdfUrl = pdfEl.href;
  },

  cell(meta) {
    meta.journal = document.querySelector('.journal-title, .publication-title')?.textContent?.trim() || 'Cell Press';
    const absEl = document.querySelector('.abstract p, #abstract p');
    if (absEl && !meta.abstract) meta.abstract = absEl.textContent.trim();
    const pdfEl = document.querySelector('a.pdf-download, a[href*="/pdf"], a[class*="pdf"]');
    if (pdfEl) meta.pdfUrl = pdfEl.href;
  },

  aps(meta) {
    meta.journal = document.querySelector('.pub-name, .journal-name')?.textContent?.trim() || 'APS';
    const absEl = document.querySelector('#abstract p, .abstract p');
    if (absEl && !meta.abstract) meta.abstract = absEl.textContent.trim();
    const pdfEl = document.querySelector('a[href*=".pdf"][class*="download"], a[href*="PhysRev"][href*=".pdf"]');
    if (pdfEl) meta.pdfUrl = pdfEl.href;
  },

  tandfonline(meta) {
    meta.journal = document.querySelector('.journal-heading a, #journalInfoTitle')?.textContent?.trim() || 'T&F Online';
    const absEl = document.querySelector('.abstractSection p, .NLM_abstract p');
    if (absEl && !meta.abstract) meta.abstract = absEl.textContent.trim();
    const pdfEl = document.querySelector('a[href*="/doi/pdf/"], a.pdf-download, a[data-track="PDF download"]');
    if (pdfEl) meta.pdfUrl = pdfEl.href;
    const doiEl = document.querySelector('a[href*="doi.org/10."]');
    if (doiEl && !meta.doi) meta.doi = doiEl.href;
  },

  overleaf(meta) {
    const nameEl = document.querySelector('.project-name, [data-testid="project-name"]');
    if (nameEl) meta.title = nameEl.textContent.trim();
  },

  generic(meta) {
    // 通用解析: 尝试 JSON-LD 提取
    const ldJson = extractJsonLd();
    if (ldJson) {
      if (ldJson.headline && !meta.title)        meta.title    = ldJson.headline;
      if (ldJson.name && !meta.title)            meta.title    = ldJson.name;
      if (ldJson.description && !meta.abstract)  meta.abstract = ldJson.description;
      if (ldJson.author && !meta.authors?.length) {
        const authors = Array.isArray(ldJson.author) ? ldJson.author : [ldJson.author];
        meta.authors = authors.map(a => (typeof a === 'object' ? a.name : a)).filter(Boolean);
      }
    }
  }
};

// ─── 层1: 标准 Meta 标签提取 ─────────────────────────────────────────────────

function extractMetaTags(meta) {
  const getMetaContent = (names) => {
    for (const name of names) {
      const byName = document.querySelector(`meta[name="${name}"]`);
      if (byName?.content) return byName.content;
      const byProp = document.querySelector(`meta[property="${name}"]`);
      if (byProp?.content) return byProp.content;
    }
    return '';
  };

  // 批量作者标签
  const authorTags = document.querySelectorAll('meta[name="citation_author"], meta[name="dc.creator"], meta[name="author"]');
  const authorArr = [];
  authorTags.forEach(tag => {
    const v = tag.getAttribute('content');
    if (v && !authorArr.includes(v)) authorArr.push(v);
  });

  meta.title   = getMetaContent(['citation_title', 'dc.title', 'og:title', 'twitter:title']) || meta.title;
  meta.doi     = getMetaContent(['citation_doi', 'dc.identifier', 'dc.identifier.doi', 'prism.doi']) || meta.doi;
  meta.authors = authorArr.length > 0 ? authorArr : meta.authors;
  meta.abstract= getMetaContent(['citation_abstract', 'dc.description', 'description', 'og:description']) || meta.abstract;
  meta.pdfUrl  = getMetaContent(['citation_pdf_url']) || meta.pdfUrl;
  meta.journal = getMetaContent(['citation_journal_title', 'dc.relation.journal', 'citation_conference_title', 'prism.publicationName']) || meta.journal;
  meta.pubDate = getMetaContent(['citation_publication_date', 'citation_date', 'dc.date', 'prism.publicationDate']) || meta.pubDate;
}

// ─── 层2辅助: JSON-LD 结构化数据提取 ────────────────────────────────────────

function extractJsonLd() {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent);
      // 支持直接对象或数组
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        // 匹配ScholarlyArticle, Article, BlogPosting
        if (item['@type'] && /Article|ScholarlyArticle|BlogPosting/i.test(item['@type'])) {
          return item;
        }
      }
      // 如果没有匹配类型，返回第一个有 name/headline 的对象
      for (const item of items) {
        if (item.name || item.headline) return item;
      }
    } catch (_) { /* JSON parse error, skip */ }
  }
  return null;
}

// ─── 层3: 通用启发式 PDF 链接检测 ───────────────────────────────────────────

function findPdfLinkHeuristic() {
  // 对页面上所有链接评分，取得分最高的
  const candidates = [];
  const allLinks = document.querySelectorAll('a[href]');

  for (const link of allLinks) {
    const href = link.href || '';
    const text = (link.textContent || '').toLowerCase().trim();
    const title = (link.getAttribute('title') || '').toLowerCase();
    const ariaLabel = (link.getAttribute('aria-label') || '').toLowerCase();
    const cls = (link.className || '').toLowerCase();

    // 跳过无效链接
    if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href === '#') continue;
    // 跳过导航/社交链接
    if (/twitter|facebook|linkedin|youtube|reddit|github|mailto|login|register|signup|subscribe/i.test(href)) continue;

    let score = 0;

    // 高置信度指标
    if (/\.pdf($|\?)/i.test(href))                            score += 40;
    if (/\/pdf\//i.test(href))                                score += 25;
    if (/\/pdf$/i.test(href))                                 score += 25;
    if (/download.*pdf|pdf.*download/i.test(href))            score += 20;
    if (/fulltext|full.text|full_text/i.test(href))           score += 15;
    if (/pdfft|epdf|stamp\/stamp/i.test(href))                score += 30;
    if (/\/doi\/pdf\//i.test(href))                           score += 35;
    if (/type=printable/i.test(href))                         score += 20;

    // 文本/标签指标
    if (/\bpdf\b/i.test(text))                                score += 20;
    if (/download.*pdf|pdf.*download/i.test(text))            score += 25;
    if (/full.?text/i.test(text))                             score += 10;
    if (/\bpdf\b/i.test(title) || /\bpdf\b/i.test(ariaLabel)) score += 15;

    // CSS类名指标
    if (/pdf/i.test(cls))                                     score += 15;
    if (/download/i.test(cls))                                score += 5;

    if (score >= 20) candidates.push({ href, score });
  }

  if (candidates.length === 0) return '';
  // 返回得分最高的
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].href;
}

// ─── DOI 快速检测（优先级由高到低，避免全文扫描） ─────────────────────────

const DOI_REGEX = /\b(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i;

function findDoiOnPage() {
  const match = (str) => {
    if (!str) return '';
    const m = str.match(DOI_REGEX);
    return m ? m[1].replace(/[.,;)\s]+$/, '') : '';
  };

  // 1. URL中直接提取
  let doi = match(window.location.href);
  if (doi) return doi;

  // 2. 页面标题
  doi = match(document.title);
  if (doi) return doi;

  // 3. DOI链接 (a[href*="doi.org"])
  const doiLinks = document.querySelectorAll('a[href*="doi.org/10."]');
  for (const link of doiLinks) {
    doi = match(link.href);
    if (doi) return doi;
  }

  // 4. 常见DOI容器元素（精准选择器，快速）
  const doiSelectors = [
    '[data-doi]', '.doi', '.doi-link', '.citation-doi', '.article-doi',
    '.publication-doi', '#doi', 'span[class*="doi"]', 'p[class*="doi"]',
    'a[class*="doi"]', '[class*="article-info"] a[href*="10."]'
  ];
  for (const sel of doiSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      if (sel === '[data-doi]') {
        const attr = el.getAttribute('data-doi');
        if (attr) return attr;
      }
      doi = match(el.textContent);
      if (doi) return doi;
    }
  }

  // 5. 最终降级: 仅扫描页面前3000字符（比原来的30000减少90%）
  if (document.body) {
    const snippet = document.body.innerText?.substring(0, 3000) || '';
    doi = match(snippet);
    if (doi) return doi;
  }

  return '';
}

// ─── 通用工具函数 ─────────────────────────────────────────────────────────────

function cleanString(str) {
  if (!str) return '';
  return str.replace(/\s+/g, ' ').trim();
}

// ─── 主动推送：脚本加载时立即扫描并缓存结果 ─────────────────────────────────
// 使用 requestIdleCallback 避免阻塞页面渲染，但保持快速响应（最长 800ms）
(function proactiveInit() {
  const run = () => {
    try {
      const metadata = scrapeAcademicMetadata();
      pushToBackgroundCache(metadata);
    } catch (_) { /* 忽略受限页面 */ }
  };
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(run, { timeout: 800 });
  } else {
    setTimeout(run, 0);
  }
})();

// ─── IIFE 闭合 ───────────────────────────────────────────────────────────────
})(); // rfContentScriptMain IIFE 结束
