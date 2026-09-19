/* Locally rendered submission posters. Measurement and drawing share one layout. */
(function (root) {
  const FONT = '"Microsoft YaHei UI", "PingFang SC", "Segoe UI", sans-serif';
  const DISPLAY = 'Georgia, "Songti SC", "Microsoft YaHei", serif';
  const THEMES = {
    paper: { background: '#e9efed', paper: '#ffffff', ink: '#193039', muted: '#60767c', line: '#dce6e2', accent: '#167660', wash: '#f0f6f3' },
    blueprint: { background: '#e5edf8', paper: '#f9fbff', ink: '#183b63', muted: '#556f8e', line: '#cad8e9', accent: '#235fbc', wash: '#edf3fb' },
    minimal: { background: '#ffffff', paper: '#ffffff', ink: '#222222', muted: '#666666', line: '#e3e3e3', accent: '#292929', wash: '#f6f6f6' },
    ink: { background: '#07131b', paper: '#10232d', ink: '#eef6f2', muted: '#a0b7bd', line: '#304951', accent: '#8bd8bc', wash: '#192f39' }
  };
  const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  const glyphs = text => segmenter ? Array.from(segmenter.segment(text), item => item.segment) : Array.from(text);

  function wrapText(ctx, value, width, maxLines = Infinity) {
    const input = String(value || '').replace(/\s+/g, ' ').trim();
    if (!input) return [];
    const lines = [];
    let line = '';
    // Keep English words together, splitting overlong words and CJK text by grapheme.
    const tokens = input.match(/[^\s\u2e80-\u9fff]+\s*|[\u2e80-\u9fff]\s*/gu) || [input];
    for (const token of tokens) {
      if (ctx.measureText((line + token).trimEnd()).width <= width) { line += token; continue; }
      if (line.trim()) { lines.push(line.trim()); line = ''; }
      if (ctx.measureText(token.trim()).width <= width) { line = token.trimStart(); continue; }
      for (const glyph of glyphs(token.trim())) {
        if (line && ctx.measureText(line + glyph).width > width) { lines.push(line); line = ''; }
        line += glyph;
      }
    }
    if (line.trim()) lines.push(line.trim());
    if (lines.length <= maxLines) return lines;
    const result = lines.slice(0, maxLines);
    const last = glyphs(result[result.length - 1]);
    while (last.length && ctx.measureText(last.join('') + '…').width > width) last.pop();
    result[result.length - 1] = last.join('').trimEnd() + '…';
    return result;
  }

  function buildLayout(ctx, model, preferences = {}) {
    const v = { title: true, journal: true, author: true, status: true, duration: true, dates: true, footer: true, ...preferences };
    const palette = THEMES[v.appearance] || THEMES.paper;
    const zh = model.language === 'zh';
    const minimal = v.appearance === 'minimal';
    const blueprint = v.appearance === 'blueprint';
    const width = 720;
    const left = 48;
    const right = 672;
    const blocks = [];
    const text = (role, value, x, y, maxWidth, size, weight = 400, color = palette.ink, maxLines = 1, display = false) => {
      const font = `${weight} ${size}px ${display ? DISPLAY : FONT}`;
      ctx.font = font;
      const lines = wrapText(ctx, value, maxWidth, maxLines);
      const lineHeight = Math.ceil(size * 1.36);
      lines.forEach((line, i) => blocks.push({ kind: 'text', role, text: line, x, y: y + i * lineHeight, width: maxWidth, height: lineHeight, font, color }));
      return lines.length * lineHeight;
    };
    const rule = y => blocks.push({ kind: 'line', x: left, y, x2: right, y2: y, color: palette.line });
    const allEvents = Array.isArray(model.events) ? model.events : [];
    const events = allEvents.length > 64 ? [allEvents[0], ...allEvents.slice(-63)] : allEvents;
    const omitted = allEvents.length - events.length;
    let y = 48;
    blocks.push({ kind: 'rect', x: left, y: y + 2, width: 28, height: 4, color: palette.accent });
    text('eyebrow', zh ? '科研手记 / 投稿历程' : 'FIELD NOTES / SUBMISSION JOURNEY', left + 40, y - 5, 580, 13, 600, palette.muted);
    y += 47;
    if (minimal && v.title && model.title) {
      y += text('title', model.title, left, y, 624, 32, 600, palette.ink, 6) + 24;
    }
    if (v.journal && model.journal) {
      text('journal-label', zh ? '投稿期刊' : 'THE JOURNAL', left, y, 624, 11, 700, palette.accent);
      y += 24;
      y += text('journal', model.journal, left, y, 624, minimal ? 23 : blueprint ? 32 : zh ? 34 : 38, blueprint ? 600 : 400, palette.ink, 3, !zh && !minimal && !blueprint) + 24;
    }
    if (!minimal && v.title && model.title) {
      y += text('title', model.title, left, y, 624, 27, 600, palette.ink, 6) + 20;
    }
    if (v.author && model.author) {
      y += text('author', `${zh ? '第一作者' : 'First author'}  /  ${model.author}`, left, y, 624, 15, 400, palette.muted, 2) + 16;
    }
    const headerBottom = y + 8;
    rule(headerBottom);
    y = headerBottom + 26;
    if (v.duration || v.status) {
      const both = v.duration && v.status;
      const columnWidth = both ? 294 : 624;
      let metricHeight = 0;
      const metricBackground = blueprint ? { kind: 'rect', x: left - 16, y: y - 12, width: 656, height: 156, color: palette.wash, radius: 8 } : null;
      if (metricBackground) blocks.push(metricBackground);
      if (v.duration) {
        text('duration-label', zh ? '历程天数' : 'DAYS IN THIS JOURNEY', left, y, columnWidth, 12, 600, palette.muted);
        const valid = Number.isFinite(model.duration) && model.duration >= 0;
        const number = valid ? String(model.duration) : '—';
        text('duration', number, left - 2, y + 22, columnWidth - 50, 60, 400, palette.accent, 1, true);
        ctx.font = `400 60px ${DISPLAY}`;
        if (valid) text('duration-unit', zh ? '天' : 'days', Math.min(left + ctx.measureText(number).width + 12, left + columnWidth - 48), y + 63, 48, 14, 500, palette.muted);
        const captionHeight = text('duration-caption', model.durationLabel || '', left, y + 108, columnWidth, 13, 400, palette.muted, 2);
        metricHeight = 108 + captionHeight;
      }
      if (v.status) {
        const x = both ? 378 : left;
        if (both) blocks.push({ kind: 'line', x: 350, y: y + 2, x2: 350, y2: y + 122, color: palette.line });
        text('status-label', zh ? '当前进展' : 'CURRENT CHAPTER', x, y, columnWidth, 12, 600, palette.muted);
        const statusHeight = text('status', model.status || '—', x, y + 37, columnWidth, 26, 600, palette.ink, 2);
        metricHeight = Math.max(metricHeight, 37 + statusHeight + 24);
      }
      if (metricBackground) metricBackground.height = metricHeight + 26;
      y += metricHeight + 26;
      rule(y);
      y += 32;
    }
    text('timeline-label', zh ? '一步一步，记录科研历程' : 'The journey, step by step.', left, y, 456, 21, 600);
    text('timeline-count', `${events.length} ${zh ? '个节点' : 'milestones'}`, 535, y + 5, 137, 13, 500, palette.muted);
    y += 52;
    const timelineStart = y;
    if (!events.length) {
      blocks.push({ kind: 'rect', x: left, y, width: 624, height: 108, color: palette.wash, radius: 12 });
      text('empty', zh ? '故事刚刚开始' : 'Every journey begins somewhere.', left + 24, y + 22, 576, 21, 600);
      text('empty-help', zh ? '添加带日期的节点后，即可生成时间线。' : 'Add a dated milestone to begin your timeline.', left + 24, y + 62, 576, 15, 400, palette.muted);
      y += 128;
    }
    const railX = v.dates ? 186 : 62;
    const contentX = railX + 30;
    const rowCenters = [];
    events.forEach((event, index) => {
      if (omitted && index === 1) {
        text('omitted', zh ? `另有 ${omitted} 个节点未展示` : `${omitted} earlier milestones not shown`, contentX, y, right - contentX, 13, 500, palette.muted, 2);
        y += 48;
      }
      const nameHeight = text('event-name', event.name || (zh ? '未命名节点' : 'Untitled milestone'), contentX, y, right - contentX, minimal ? 18 : 20, 600, palette.ink, 2);
      const meta = [event.typeLabel, event.dateKindLabel].filter(Boolean).join(' · ');
      const metaHeight = text('event-meta', meta, contentX, y + nameHeight + 6, right - contentX, 12, 500, palette.muted, 2);
      const rowHeight = Math.max(minimal ? 64 : 76, nameHeight + metaHeight + (minimal ? 20 : 28));
      if (v.dates) {
        text('event-date', event.dateLabel || '—', left, y + 1, 122, 17, 600, palette.ink, 2);
        text('event-year', event.yearLabel || '', left, y + 49, 122, 12, 400, palette.muted);
      }
      rowCenters.push(y + 12);
      blocks.push({ kind: 'node', x: railX, y: y + 12, completed: event.completed, square: blueprint, color: palette.accent, background: palette.paper });
      y += rowHeight;
    });
    if (rowCenters.length > 1) blocks.unshift({ kind: 'line', x: railX, y: rowCenters[0], x2: railX, y2: rowCenters[rowCenters.length - 1], color: palette.line });
    const timelineBottom = y;
    let height = Math.ceil(y + (v.footer ? 90 : 40));
    const minHeight = v.size === 'story' ? 1280 : v.size === 'auto' ? 0 : 900;
    height = Math.max(minHeight, height);
    // Very short stories use deliberate whitespace below the timeline, never stretched rows.
    if (v.footer) {
      rule(height - 84);
      text('footer-brand', 'RESEARCHFLOW', left, height - 61, 260, 13, 700, palette.ink);
      text('footer-note', zh ? '每一步，都值得记录。' : 'Every step is worth recording.', 355, height - 61, 317, 13, 400, palette.muted);
    }
    return { width, height, palette, appearance: v.appearance, blocks, headerBottom, timelineStart, timelineBottom, omitted, eventCount: events.length };
  }

  function render(model, preferences = {}) {
    const canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is unavailable');
    const layout = buildLayout(ctx, model, preferences);
    const renderScale = 2;
    canvas.width = layout.width * renderScale;
    canvas.height = layout.height * renderScale;
    ctx = canvas.getContext('2d');
    ctx.scale(renderScale, renderScale);
    ctx.fillStyle = layout.palette.background;
    ctx.fillRect(0, 0, layout.width, layout.height);
    ctx.beginPath();
    ctx.roundRect(16, 16, layout.width - 32, layout.height - 32, layout.appearance === 'minimal' ? 0 : 16);
    ctx.fillStyle = layout.palette.paper;
    ctx.fill();
    ctx.textBaseline = 'top';
    for (const block of layout.blocks) {
      ctx.fillStyle = block.color;
      ctx.strokeStyle = block.color;
      ctx.lineWidth = 1;
      if (block.kind === 'text') { ctx.font = block.font; ctx.fillText(block.text, block.x, block.y); }
      if (block.kind === 'line') { ctx.beginPath(); ctx.moveTo(block.x, block.y); ctx.lineTo(block.x2, block.y2); ctx.stroke(); }
      if (block.kind === 'rect') {
        ctx.beginPath(); ctx.roundRect(block.x, block.y, block.width, block.height, block.radius || 0); ctx.fill();
      }
      if (block.kind === 'node') {
        ctx.beginPath();
        if (block.square) ctx.rect(block.x - 5, block.y - 5, 10, 10);
        else ctx.arc(block.x, block.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = block.completed ? block.color : block.background;
        ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
      }
    }
    return { canvas, layout };
  }
  const api = { wrapText, buildLayout, render };
  root.RFShareCard = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
