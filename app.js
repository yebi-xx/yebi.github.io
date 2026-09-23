(function () {
  var D = window.SITE_DATA;
  var app = document.getElementById('app');
  var state = { cp: '全部', q: '', catFilter: 'all' };
  var zCounter = 10;

  /* ---------- 工具 ---------- */
  function esc(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function authorOf(name) {
    for (var i = 0; i < D.authors.length; i++) if (D.authors[i].name === name) return D.authors[i];
    return null;
  }
  function authorHomepage(name) {
    var a = authorOf(name);
    return a ? a.homepage : '#';
  }
  function flagHtml(w) {
    var h = '';
    if (w.flags) {
      if (w.flags.bg) h += '<span class="flag">BG</span>';
      if (w.flags['果设']) h += '<span class="flag">果设</span>';
      if (w.flags['三创']) h += '<span class="flag">三创</span>';
    }
    if (w.title && w.title.indexOf('🚗') > -1) h += '<span class="flag nsfw">🚗</span>';
    return h ? '<span class="work-flags">' + h + '</span>' : '';
  }
  function paroText(w) {
    var parts = [];
    if (w.paro) parts.push(w.paro);
    if (w.flags && w.flags['三创']) parts.push('三创');
    return parts.join(' · ');
  }
  function workTitleText(w) {
    if (w.title) return esc(w.title);
    return '<span style="opacity:.55;font-weight:400">（未命名，见原帖）</span>';
  }
  function isCosmos(ev) { return ev.style === 'cosmos'; }
  function archiveNo(i) { return 'CY-AR-' + String(i + 1).padStart(3, '0'); }

  /* ---------- 月相 SVG ---------- */
  function moonSvg(i, n, color) {
    var gold = color || '#8a94a6', dark = 'rgba(216,214,209,.95)';
    if (i === 0 || i === n - 1) {
      return '<svg class="moon" viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" fill="' + dark + '" stroke="' + gold + '" stroke-width="1.4" stroke-opacity=".8"/></svg>';
    }
    if (i === Math.floor((n - 1) / 2) && n % 2 === 1) return '<svg class="moon" viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" fill="' + gold + '"/></svg>';
    var t = i / (n - 1);
    var p = t < 0.5 ? t * 2 : (1 - t) * 2;
    var rx = 15 * Math.sin(p * Math.PI / 2) * 0.999 + 0.001;
    var litRight = t < 0.5;
    var d = litRight
      ? 'M20,5 A' + rx.toFixed(2) + ',15 0 0 1 20,35 A' + rx.toFixed(2) + ',15 0 0 0 20,5 Z'
      : 'M20,5 A' + rx.toFixed(2) + ',15 0 0 0 20,35 A' + rx.toFixed(2) + ',15 0 0 1 20,5 Z';
    return '<svg class="moon" viewBox="0 0 40 40"><clipPath id="mc' + i + '"><circle cx="20" cy="20" r="15"/></clipPath>' +
      '<circle cx="20" cy="20" r="15" fill="' + dark + '" stroke="' + gold + '" stroke-width="1.4" stroke-opacity=".8"/>' +
      '<path d="' + d + '" fill="' + gold + '" clip-path="url(#mc' + i + ')"/></svg>';
  }

  /* ---------- 星空画布 ---------- */
  function startStarfield() {
    var c = document.getElementById('starfield');
    if (!c) return;
    var ctx = c.getContext('2d'), stars = [], W, H;
    function resize() {
      W = c.width = window.innerWidth; H = c.height = window.innerHeight;
      stars = [];
      var n = Math.min(220, Math.floor(W * H / 9000));
      for (var i = 0; i < n; i++) {
        stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + 0.3, a: Math.random() * 0.5 + 0.25, sp: Math.random() * 0.015 + 0.004, ph: Math.random() * Math.PI * 2 });
      }
    }
    window.addEventListener('resize', resize);
    resize();
    (function tick() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.ph += s.sp;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(226,233,248,' + (s.a * (0.6 + 0.4 * Math.sin(s.ph))).toFixed(3) + ')';
        ctx.fill();
      }
      requestAnimationFrame(tick);
    })();
  }

  function grainHtml() {
    return '<div class="grain"></div>';
  }

  /* ---------- 导航 / 页脚 ---------- */
  function navHtml(active) {
    function cls(k) { return k === active ? ' class="active"' : ''; }
    return '<nav class="rnav"><div class="rnav-inner">' +
      '<a href="#/"' + cls('home') + '>[ 首页 ]</a>' +
      '<a href="#/"' + cls('event') + '>[ 卷宗 ]</a>' +
      '<a href="#/authors"' + cls('authors') + '>[ 名录 ]</a>' +
      '<span class="rnav-seal">一期一會<br>档案馆</span>' +
      '</div></nav>';
  }
  function footerHtml(dark) {
    if (dark) {
      return '<footer class="cosmos-footer"><div class="f-title">一期一會 · 瓷右企划产出归档</div>' +
        '<div class="f-note">产出版权归原作者所有 · 本站仅作索引 · ' + esc(D.site.subtitle) + '</div></footer>';
    }
    return '<footer class="rfooter"><span>© 2026 一期一會档案局</span>' +
      '<span>THIS ARCHIVE IS A LIVING SYSTEM</span>' +
      '<span>AMOR FATI — ' + esc(D.site.subtitle) + '</span></footer>';
  }
  function lightboxHtml() {
    return '<div class="lightbox" id="lightbox" onclick="this.classList.remove(\'open\')"><img src="" alt="预览"></div>' +
      '<div class="modal-mask" id="modalMask" onclick="closeModal()"></div>' +
      '<div class="modal" id="modal"></div>';
  }

  /* ============================================================
     首页 · 复古电脑桌面（RETRO DESKTOP）
     ============================================================ */
  function pixelFolderSvg() {
    return '<svg class="dlogo-icon" width="40" height="34" viewBox="0 0 20 17" shape-rendering="crispEdges">' +
      '<rect x="1" y="3" width="18" height="13" fill="#c9c9cf"/>' +
      '<rect x="1" y="3" width="18" height="1" fill="#eeeeF2"/>' +
      '<rect x="1" y="15" width="18" height="1" fill="#55555e"/>' +
      '<rect x="1" y="3" width="1" height="13" fill="#eeeeF2"/>' +
      '<rect x="18" y="3" width="1" height="13" fill="#55555e"/>' +
      '<rect x="2" y="1" width="8" height="3" fill="#c9c9cf"/>' +
      '<rect x="2" y="1" width="8" height="1" fill="#eeeeF2"/>' +
      '<rect x="3" y="6" width="14" height="8" fill="#0B0B0D"/>' +
      '<rect x="4" y="7" width="6" height="1" fill="#8a8a95"/>' +
      '<rect x="4" y="9" width="10" height="1" fill="#6a6a75"/>' +
      '<rect x="4" y="11" width="8" height="1" fill="#55555e"/>' +
      '</svg>';
  }

  function winHtml(id, file, bodyHtml, style, delay) {
    return '<div class="win" id="' + id + '" style="' + (style || '') + '">' +
      '<div class="win-bar">' +
      '<span class="win-file">' + file + '</span>' +
      '<span class="win-btns"><i></i><i></i><i class="wx"></i></span>' +
      '</div>' +
      '<div class="win-body" style="animation-delay:' + (delay || 0) + 's">' + bodyHtml + '</div>' +
      '</div>';
  }

  function eventRows(cat) {
    return D.events.filter(function (ev) { return ev.category === cat; })
      .map(function (ev) {
        var idx = String(D.events.indexOf(ev) + 1).padStart(2, '0');
        return '<div class="wrow" onclick="openEnvelope(\'' + ev.slug + '\')">' +
          '<span class="w-idx">' + idx + '</span>' +
          '<span class="w-name">' + esc(ev.title) + '</span>' +
          '<span class="w-items">' + ev.works.length + ' ITEMS</span></div>';
      }).join('');
  }

  function renderHome() {
    var allWorks = 0, allAuthors = {};
    D.events.forEach(function (e) {
      allWorks += e.works.length;
      e.works.forEach(function (w) { if (w.author) allAuthors[w.author] = 1; });
    });
    var authorCount = Object.keys(allAuthors).length;

    var guestNames = D.authors.slice(0, 60).map(function (a) {
      return '<span>' + esc(a.name) + '</span>';
    }).join('');

    var eventWin = winHtml('winEvent', 'Event_.txt — 瓷右特别活动',
      eventRows('特别活动'),
      'left:2%;top:4%;width:56%;', 0);
    var salonWin = winHtml('winSalon', 'Salon_.txt — 瓷右产出沙龙',
      eventRows('产出沙龙'),
      'left:10%;top:44%;width:52%;', 1.6);
    var guestWin = winHtml('winGuest', 'Guest.chr — 参企老师名录',
      '<div class="wg-stats">' + authorCount + ' GUESTS REGISTERED · ' + allWorks + ' WORKS TOTAL</div>' +
      '<div class="wg-list">' + guestNames + '</div>' +
      '<a class="wg-more" href="#/authors">[ 打开完整名录 → ]</a>',
      'right:0;top:16%;width:38%;', 3.1);

    app.innerHTML =
      '<div class="desktop">' +
      '<div class="dstars" id="dstars"></div>' +
      '<div class="dclouds"></div>' +
      '<div class="dmenu">' +
      '<span class="dm-logo">一期一會 ARCHIVE</span>' +
      '<a href="#/">[ 桌面 ]</a>' +
      '<a href="#/authors">[ 名录 ]</a>' +
      '<span class="dm-right">EST. BY 耶比大雄 · AMOR FATI</span>' +
      '</div>' +
      '<div class="dleft">' +
      '<div class="dlogo">' + pixelFolderSvg() + '<h1>一期一會</h1></div>' +
      '<div class="dsub">After the Curtain Call</div>' +
      '<div class="ddash"><em></em><span>✦</span></div>' +
      '<div class="damor">' + esc(D.site.subtitle) + '<span> — ' + esc(D.site.subtitleNote) + '</span></div>' +
      '<div class="dmeta">「 ' + esc(D.site.tagline) + ' 」</div>' +
      '<div class="dstats">EVENTS ' + D.events.length + ' · WORKS ' + allWorks + ' · AUTHORS ' + authorCount + '</div>' +
      '</div>' +
      '<div class="dright">' + eventWin + salonWin + guestWin + '</div>' +
      '<div class="dfoot">本站收录由耶比大雄主催的瓷右企划产出归档。产出均保留原帖直达链接，请多多去原帖点赞评论支持老师。</div>' +
      '</div>' + lightboxHtml();

    makeStars();
    initDrag();
    window.scrollTo(0, 0);
  }

  /* 星点：细碎 + 闪烁 */
  function makeStars() {
    var box = document.getElementById('dstars');
    if (!box) return;
    var n = 90, html = '';
    for (var i = 0; i < n; i++) {
      var x = Math.random() * 100;
      var y = Math.random() * 78;
      var s = (Math.random() * 1.6 + 1).toFixed(1);
      var d = (Math.random() * 4).toFixed(2);
      var dur = (Math.random() * 3 + 2.2).toFixed(2);
      var o = (Math.random() * 0.5 + 0.3).toFixed(2);
      html += '<span style="left:' + x + '%;top:' + y + '%;width:' + s + 'px;height:' + s + 'px;' +
        'animation-delay:' + d + 's;animation-duration:' + dur + 's;opacity:' + o + '"></span>';
    }
    box.innerHTML = html;
  }

  /* 窗口拖拽 + 置顶 */
  function initDrag() {
    var wins = document.querySelectorAll('.win');
    for (var i = 0; i < wins.length; i++) {
      (function (win) {
        var bar = win.querySelector('.win-bar');
        bar.addEventListener('mousedown', function (e) {
          if (window.innerWidth < 861) return; // 移动端不拖
          e.preventDefault();
          win.style.zIndex = ++zCounter;
          win.classList.add('dragging');
          var rect = win.getBoundingClientRect();
          var parentRect = win.parentElement.getBoundingClientRect();
          var offX = e.clientX - rect.left, offY = e.clientY - rect.top;
          function move(ev) {
            var x = ev.clientX - parentRect.left - offX;
            var y = ev.clientY - parentRect.top - offY;
            x = Math.max(-40, Math.min(x, parentRect.width - rect.width + 40));
            y = Math.max(0, Math.min(y, parentRect.height - 40));
            win.style.left = x + 'px';
            win.style.top = y + 'px';
            win.style.right = 'auto';
          }
          function up() {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            win.classList.remove('dragging');
          }
          document.addEventListener('mousemove', move);
          document.addEventListener('mouseup', up);
        });
        win.addEventListener('mousedown', function () {
          win.style.zIndex = ++zCounter;
        });
      })(wins[i]);
    }
  }

  /* ---------- 活动详情 ---------- */
  function worksFiltered(ev) {
    return ev.works.filter(function (w) {
      var okCp = state.cp === '全部' || w.cp === state.cp;
      var q = state.q.trim().toLowerCase();
      var okQ = !q || ((w.title || '') + (w.author || '') + (w.paro || '') + (w.cp || '')).toLowerCase().indexOf(q) > -1;
      return okCp && okQ;
    });
  }
  function cpOptions(ev) {
    var cps = ['全部'];
    ev.works.forEach(function (w) { if (w.cp && cps.indexOf(w.cp) < 0) cps.push(w.cp); });
    return cps;
  }
  function renderEvent(slug) {
    var ev = null;
    D.events.forEach(function (e) { if (e.slug === slug) ev = e; });
    if (!ev) { renderHome(); return; }
    renderEventBrut(ev);
  }

  /* --- 宇宙主题（瞬息全宇宙） --- */
  function renderEventCosmos(ev) {
    var cps = cpOptions(ev);
    var filtered = worksFiltered(ev);
    var moons = '';
    for (var i = 0; i < 9; i++) moons += moonSvg(i, 9, '#d4b06a');

    var worksHtml = filtered.map(function (w, i) {
      return '<article class="cwork"><div class="cwork-top">' +
        '<span class="cwork-idx">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="cwork-cp">' + esc(w.cp || '无CP标注') + '</span>' +
        '<span class="cwork-title">' + workTitleText(w) + '<a class="ext" href="' + w.url + '" target="_blank" rel="noopener">原帖 ↗</a></span>' +
        flagHtml(w) + '</div>' +
        '<div class="cwork-author">by <a href="' + authorHomepage(w.author) + '" target="_blank" rel="noopener">' + esc(w.author || '匿名') + '</a></div>' +
        (paroText(w) ? '<div class="cwork-paro">设定 // ' + esc(paroText(w)) + '</div>' : '') +
        ((w.preview || w.excerpt) ? '<div class="cwork-main">' +
          (w.preview ? '<div class="cwork-preview" onclick="openLightbox(this)"><img src="' + w.preview + '" alt="预览" loading="lazy"></div>' : '') +
          (w.excerpt ? '<div style="flex:1;min-width:200px"><div class="cwork-excerpt">' + esc(w.excerpt) + '</div>' +
            '<span class="excerpt-toggle" onclick="toggleExcerpt(this)">展开摘录 ▾</span></div>' : '') +
          '</div>' : '') +
        '</article>';
    }).join('');

    app.innerHTML =
      '<canvas id="starfield"></canvas>' +
      '<div class="cosmos-wrap" style="background:#060b1c;min-height:100vh;color:#e8ecf5">' +
      navHtml('event') +
      '<section class="cosmos-hero">' +
      '<div class="c-kicker">' + esc(ev.type) + ' — ARCHIVE OF EVERY UNIVERSE</div>' +
      '<h2>' + esc(ev.title.replace('瓷右产出沙龙 · ', '')) + '</h2>' +
      '<div class="c-theme">主题 // ' + esc(ev.theme) + '</div>' +
      '<div class="c-tagline">「 ' + esc(ev.tagline) + ' 」</div>' +
      '<div class="moon-row">' + moons + '</div>' +
      '<div class="cosmos-rule"></div>' +
      '<div class="cosmos-stats">' +
      '<div><div class="num">' + ev.works.length + '</div><div class="lbl">产出 WORKS</div></div>' +
      '<div><div class="num">' + ev.stats.authors + '</div><div class="lbl">参企老师 AUTHORS</div></div>' +
      '<div><div class="num">' + cps.length + '</div><div class="lbl">CP 向 SHIPS</div></div>' +
      '</div></section>' +
      '<div class="cosmos-body">' +
      '<a class="cosmos-back" href="#/">← 返回 · 一期一會</a>' +
      '<div class="file-tab"><span class="ft-label">卷宗 FILE</span>' +
      '<span class="ft-no">' + archiveNo(D.events.indexOf(ev)) + '</span>' +
      '<span class="ft-note">原件保存于 LOFTER · 点击「原帖 ↗」直达支持</span></div>' +
      '<div class="cosmos-toolbar">' +
      '<div class="chips">' + cps.map(function (c) {
        return '<button class="chip' + (c === state.cp ? ' active' : '') + '" data-cp="' + esc(c) + '">' + esc(c) + '</button>';
      }).join('') + '</div>' +
      '<div class="search-box"><input id="searchInput" placeholder="搜索标题 / 作者 / paro…" value="' + esc(state.q) + '"></div>' +
      '<div class="cosmos-count">当前显示 ' + filtered.length + ' / ' + ev.works.length + ' 条产出 · 点击「原帖 ↗」直达 LOFTER 支持老师</div>' +
      '</div>' +
      (worksHtml ? '<div class="cosmos-works">' + worksHtml + '</div>' : '<div class="empty">这个宇宙暂时没有符合条件的产出，换个筛选试试～</div>') +
      '</div>' + footerHtml(true) + '</div>' + lightboxHtml();

    var chips = document.querySelectorAll('.chip');
    for (var j = 0; j < chips.length; j++) {
      chips[j].onclick = function () { state.cp = this.getAttribute('data-cp'); renderEvent(ev.slug); };
    }
    var si = document.getElementById('searchInput');
    si.oninput = function () { state.q = this.value; renderEvent(ev.slug); var el = document.getElementById('searchInput'); el.focus(); el.setSelectionRange(el.value.length, el.value.length); };
    startStarfield();
    window.scrollTo(0, 0);
  }

  /* ============================================================
     内页 · 打孔档案卡模板（深石板灰 + 虚线语言）
     ============================================================ */
  function tagRow(label, value, isLink, href) {
    if (!value) return '';
    var v = isLink
      ? '<a href="' + href + '" target="_blank" rel="noopener">' + esc(value) + ' ↗</a>'
      : esc(value);
    return '<div class="ac-tag"><span>' + label + '</span><i></i>' + v + '</div>';
  }

  function renderEventBrut(ev) {
    var cps = cpOptions(ev);
    var filtered = worksFiltered(ev);
    var evNo = String(D.events.indexOf(ev) + 1).padStart(3, '0');

    var cardsHtml = '', lastGroup = null;
    filtered.forEach(function (w, i) {
      var gkey = (w.day ? 'D' + w.day : '') + '|' + (w.group || '');
      if (gkey !== lastGroup) {
        lastGroup = gkey;
        if (w.day) cardsHtml += '<div class="ac-day">' + esc(w.day) + '</div>';
        if (w.group) cardsHtml += '<div class="ac-group">' + esc(w.group) + '</div>';
      }
      var no = String(i + 1).padStart(2, '0');
      var hasTitle = !!w.title;
      var titleText = hasTitle ? w.title : (w.song ? '♪ ' + w.song : (w.time ? w.time + ' · ' + (w.author || '匿名') : '未命名'));

      /* 左栏 TAGS */
      var tags = '';
      tags += tagRow('TIME', w.time || null);
      tags += tagRow('FORM', w.form || '文');
      tags += tagRow('CP', w.cp || null);
      if (w.paro) tags += tagRow('PARO', w.paro);
      if (w.flags && w.flags['三创']) tags += tagRow('TYPE', '三创');
      if (w.flags && w.flags['果设']) tags += tagRow('TYPE', '果设');
      if (w.flags && w.flags.bg) tags += tagRow('TYPE', 'BG');
      tags += tagRow('AUTHOR', w.author || '匿名', authorOf(w.author) != null, authorHomepage(w.author));
      if (w.song && hasTitle) tags += tagRow('SONG', w.song);
      if (w.note) tags += tagRow('NOTE', w.note);
      var linkBtn = w.url
        ? '<a class="ac-linkbtn" href="' + w.url + '" target="_blank" rel="noopener">OPEN ORIGINAL ↗</a>'
        : '<span class="ac-linkbtn dead">ORIGINAL LOST</span>';

      /* 右栏 TEXT */
      var textCol;
      if (w.excerpt) {
        textCol = '<div class="ac-text serif">' + esc(w.excerpt) + '</div>' +
          '<span class="excerpt-toggle" onclick="toggleExcerpt(this)">展开摘录 ▾</span>';
      } else if (w.preview) {
        textCol = '<div class="ac-img" onclick="openLightbox(this)"><img src="' + w.preview + '" alt="预览" loading="lazy"></div>' +
          '<div class="ac-imgnote">预览为图片 · 文字提取待补</div>';
      } else {
        textCol = '<div class="ac-empty">（无预览 · 点击左侧 OPEN ORIGINAL 查看）</div>';
      }

      cardsHtml +=
        '<article class="acard">' +
        '<span class="ac-hole" style="top:16%"></span>' +
        '<span class="ac-hole" style="top:32%"></span>' +
        '<span class="ac-hole" style="top:50%"></span>' +
        '<span class="ac-hole" style="top:68%"></span>' +
        '<span class="ac-hole" style="top:84%"></span>' +
        '<div class="ac-col ac-left">' +
        '<div class="ac-head"><span>TAGS</span><em>档案</em></div>' +
        '<div class="ac-title">' + esc(titleText) + '</div>' +
        tags + linkBtn +
        '</div>' +
        '<div class="ac-divider"></div>' +
        '<div class="ac-col ac-right">' +
        '<div class="ac-head"><span>TEXT</span><em>正文</em></div>' +
        textCol +
        '</div>' +
        '<div class="ac-foot"><span>CP 索引 // ' + esc(w.cp || '无') + '</span><i></i><span>NO.' + no + ' / ' + filtered.length + '</span><i></i><span>CY-AR-' + evNo + '</span></div>' +
        '</article>';
    });

    app.innerHTML =
      '<div class="slate">' +
      '<div class="sl-head">' +
      '<a class="sl-back" href="#/">← 返回桌面</a>' +
      '<div class="sl-titlebox">' +
      '<div class="sl-no">FILE CY-AR-' + evNo + ' — ' + esc(ev.category) + '</div>' +
      '<h2>' + esc(ev.title) + '</h2>' +
      '<div class="sl-meta">「 ' + esc(ev.tagline) + ' 」</div>' +
      '</div>' +
      '<div class="sl-tools">' +
      '<div class="sl-chips">' + cps.map(function (c) {
        return '<button class="sl-chip' + (c === state.cp ? ' active' : '') + '" data-cp="' + esc(c) + '">' + esc(c) + '</button>';
      }).join('') + '</div>' +
      '<div class="sl-search"><input id="searchInput" placeholder="搜索标题 / 作者 / paro…" value="' + esc(state.q) + '"></div>' +
      '<div class="sl-count">' + filtered.length + ' / ' + ev.works.length + ' RECORDS</div>' +
      '</div>' +
      '</div>' +
      '<div class="sl-list">' +
      (cardsHtml || '<div class="sl-none">没有符合条件的产出，换个筛选试试～</div>') +
      '<div class="sl-scroll">SCROLL DOWN ↓</div>' +
      '</div>' +
      lightboxHtml();

    var chips = document.querySelectorAll('.sl-chip');
    for (var j = 0; j < chips.length; j++) {
      chips[j].onclick = function () { state.cp = this.getAttribute('data-cp'); renderEvent(ev.slug); };
    }
    var si = document.getElementById('searchInput');
    si.oninput = function () { state.q = this.value; renderEvent(ev.slug); var el = document.getElementById('searchInput'); el.focus(); el.setSelectionRange(el.value.length, el.value.length); };
    window.scrollTo(0, 0);
  }

  /* ============================================================
     参企名录 · 星空星座页（STARRY GUESTBOOK）
     ============================================================ */
  var starData = [];      // {name,x,y,size,count,events,works}
  var starNeighbors = {}; // name -> [names]
  var lastTapStar = null;

  function seededRand(i) {
    var x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function buildStarData() {
    var map = {};
    D.events.forEach(function (e) {
      e.works.forEach(function (w) {
        if (!w.author) return;
        if (!map[w.author]) map[w.author] = { author: w.author, works: [] };
        map[w.author].works.push({ ev: e, w: w });
      });
    });
    var names = Object.keys(map).sort();
    // 邻星：共同参加过同一场活动
    var byEvent = {};
    names.forEach(function (n) {
      var evs = {};
      map[n].works.forEach(function (x) { evs[x.ev.id] = 1; });
      Object.keys(evs).forEach(function (eid) {
        (byEvent[eid] = byEvent[eid] || []).push(n);
      });
    });
    names.forEach(function (n) {
      var set = {};
      map[n].works.forEach(function (x) {
        (byEvent[x.ev.id] || []).forEach(function (m) { if (m !== n) set[m] = 1; });
      });
      starNeighbors[n] = Object.keys(set);
    });
    // 固定布局（种子随机，每次进入一致）
    starData = names.map(function (n, i) {
      var count = map[n].works.length;
      return {
        name: n,
        x: 4 + seededRand(i * 2 + 1) * 90,
        y: 10 + seededRand(i * 2 + 2) * 76,
        size: Math.min(2 + count * 1.4, 8),
        count: count,
        works: map[n].works
      };
    });
  }

  function renderAuthors() {
    buildStarData();
    lastTapStar = null;

    var starsHtml = starData.map(function (s, i) {
      return '<div class="star" data-i="' + i + '" style="left:' + s.x + '%;top:' + s.y + '%">' +
        '<span class="star-dot" style="width:' + s.size + 'px;height:' + s.size + 'px;animation-delay:' + (seededRand(i * 3 + 5) * 4).toFixed(2) + 's"></span>' +
        '<span class="star-name">' + esc(s.name) + '</span>' +
        '</div>';
    }).join('');

    app.innerHTML =
      '<div class="starry">' +
      '<div class="st-menu">' +
      '<a href="#/">[ 桌面 ]</a>' +
      '<span class="st-count">' + starData.length + ' STARS</span>' +
      '</div>' +
      '<div class="st-sky" id="stSky">' +
      '<svg class="st-lines" id="stLines" preserveAspectRatio="none"></svg>' +
      starsHtml +
      '</div>' +
      '<div class="st-gwin" id="stGwin"></div>' +
      '<div class="st-foot">they lit the night, one by one.</div>' +
      '</div>' + lightboxHtml();

    /* 悬停/点按交互（事件委托） */
    var sky = document.getElementById('stSky');
    var lines = document.getElementById('stLines');
    var gwin = document.getElementById('stGwin');

    function clearAll() {
      lines.innerHTML = '';
      var act = sky.querySelectorAll('.star.active, .star.linked');
      for (var k = 0; k < act.length; k++) act[k].classList.remove('active', 'linked');
    }

    function lightStar(el) {
      clearAll();
      var s = starData[+el.getAttribute('data-i')];
      el.classList.add('active');
      var rect = sky.getBoundingClientRect();
      var x1 = s.x / 100 * rect.width, y1 = s.y / 100 * rect.height;
      var d = '';
      starNeighbors[s.name].forEach(function (nb) {
        var j = -1;
        for (var t = 0; t < starData.length; t++) if (starData[t].name === nb) { j = t; break; }
        if (j < 0) return;
        var ns = starData[j];
        var x2 = ns.x / 100 * rect.width, y2 = ns.y / 100 * rect.height;
        d += 'M' + x1.toFixed(1) + ',' + y1.toFixed(1) + ' L' + x2.toFixed(1) + ',' + y2.toFixed(1) + ' ';
        sky.children[j + 1] && sky.children[j + 1].classList && sky.children[j + 1].classList.add('linked');
      });
      lines.innerHTML = '<path d="' + d + '" fill="none" stroke="#9aa0a8" stroke-width="1" stroke-dasharray="4 5" opacity=".55"/>';
    }

    function openGuestWin(el) {
      var s = starData[+el.getAttribute('data-i')];
      var a = authorOf(s.name);
      var evCount = {};
      s.works.forEach(function (x) { evCount[x.ev.title] = 1; });
      var evs = Object.keys(evCount);
      gwin.innerHTML =
        '<div class="gw-bar"><span class="gw-file">' + esc(s.name) + '</span>' +
        '<span class="gw-btns"><i></i><i></i><i class="wx" onclick="closeGuestWin()"></i></span></div>' +
        '<div class="gw-body">' +
        '<div class="gw-stats">' + s.works.length + ' WORKS · ' + evs.length + ' EVENTS</div>' +
        '<div class="gw-evs">' + evs.map(esc).join(' · ') + '</div>' +
        (a && a.homepage ? '<a class="gw-home" href="' + a.homepage + '" target="_blank" rel="noopener">⌂ 老师主页 ↗</a>' : '') +
        '<div class="gw-works">' +
        s.works.map(function (x) {
          var t = x.w.title || (x.w.song ? '♪ ' + x.w.song : (x.w.time ? x.w.time + ' 时刻产出' : '（未命名）'));
          return '<a class="gw-work" href="' + (x.w.url || '#') + '" target="_blank" rel="noopener"' + (x.w.url ? '' : ' onclick="event.preventDefault()" style="opacity:.45"') + '>' +
            '<span class="gw-t">' + esc(t) + '</span>' +
            '<span class="gw-c">' + esc(x.ev.title.replace('瓷右产出沙龙 · ', '').replace(' · 瓷右', '')) + (x.w.cp ? ' · ' + esc(x.w.cp) : '') + '</span></a>';
        }).join('') +
        '</div></div>';
      gwin.classList.add('open');
    }

    sky.addEventListener('mouseover', function (e) {
      var el = e.target.closest ? e.target.closest('.star') : null;
      if (el && !el.classList.contains('active')) lightStar(el);
    });
    sky.addEventListener('mouseleave', clearAll);
    sky.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('.star') : null;
      if (!el) return;
      /* 手机：第一次点=亮起连线，第二次点=开窗；桌面直接开窗 */
      if (window.innerWidth <= 860 && lastTapStar !== el) {
        lastTapStar = el;
        lightStar(el);
        return;
      }
      lastTapStar = null;
      lightStar(el);
      openGuestWin(el);
    });
    window.scrollTo(0, 0);
  }

  window.closeGuestWin = function () {
    var g = document.getElementById('stGwin');
    if (g) g.classList.remove('open');
  };

  /* ---------- 全局函数 ---------- */
  window.openAuthor = function (i) {
    var it = window.__authorList[i];
    var a = authorOf(it.author);
    var modal = document.getElementById('modal');
    modal.innerHTML = '<button class="modal-close" onclick="closeModal()">×</button>' +
      '<div class="rm-head"><span>AUTHOR FILE</span><span>在册 INDEXED</span></div>' +
      '<h3>' + esc(it.author) + '</h3>' +
      (a ? '<a class="modal-home" href="' + a.homepage + '" target="_blank" rel="noopener">⌂ 访问老师 LOFTER 主页 ↗</a>' : '') +
      '<div class="modal-works">' +
      it.works.map(function (x) {
        return '<div class="mwork"><a class="t" href="' + x.w.url + '" target="_blank" rel="noopener">' + workTitleText(x.w) + '</a>' +
          '<div class="c">' + esc(x.ev.title) + ' · ' + esc(x.w.cp || '') + (x.w.paro ? ' · ' + esc(x.w.paro) : '') + '</div></div>';
      }).join('') + '</div>';
    modal.classList.add('open');
    document.getElementById('modalMask').classList.add('open');
  };
  window.closeModal = function () {
    document.getElementById('modal').classList.remove('open');
    document.getElementById('modalMask').classList.remove('open');
  };
  window.openLightbox = function (el) {
    var lb = document.getElementById('lightbox');
    lb.querySelector('img').src = el.querySelector('img').src;
    lb.classList.add('open');
  };
  window.toggleExcerpt = function (el) {
    var ex = el.previousElementSibling;
    ex.classList.toggle('open');
    el.textContent = ex.classList.contains('open') ? '收起摘录 ▴' : '展开摘录 ▾';
  };

  /* ============================================================
     档案袋过渡页（ENVELOPE TRANSITION）
     ============================================================ */
  var suppressRoute = false;

  window.openEnvelope = function (slug) {
    var ev = null;
    D.events.forEach(function (e) { if (e.slug === slug) ev = e; });
    if (!ev) { location.hash = '#/event/' + slug; return; }
    if (document.getElementById('envOverlay')) return;

    var no = String(D.events.indexOf(ev) + 1).padStart(3, '0');
    var overlay = document.createElement('div');
    overlay.className = 'env-overlay';
    overlay.id = 'envOverlay';
    overlay.innerHTML =
      '<div class="envelope">' +
      '<div class="env-inside"></div>' +
      '<div class="env-flap"><span class="env-flap-left">YE BI</span><span class="env-flap-right">' + esc(D.site.subtitle) + '</span></div>' +
      /* 棉线绕扣 + 吊牌 */
      '<svg class="env-knot" viewBox="0 0 140 210" aria-hidden="true">' +
      '<circle cx="70" cy="34" r="16" fill="#3a3a3e"/><circle cx="70" cy="34" r="6.5" fill="#C9C9C7"/>' +
      '<circle cx="70" cy="100" r="16" fill="#3a3a3e"/><circle cx="70" cy="100" r="6.5" fill="#C9C9C7"/>' +
      '<path class="env-string" d="M70 116 C 26 142, 46 178, 80 186" fill="none" stroke="#3a3a3e" stroke-width="2.5"/>' +
      '<g class="env-tag" transform="translate(52 182) rotate(9)">' +
      '<rect x="0" y="0" width="64" height="42" rx="2" fill="#3a3a3e"/>' +
      '<circle cx="32" cy="8" r="3.5" fill="#C9C9C7"/>' +
      '<text x="32" y="29" text-anchor="middle" font-size="12" fill="#C9C9C7" font-family="Songti SC, STSong, serif" letter-spacing="1">一期一會</text>' +
      '</g></svg>' +
      /* 收件人：活动标题（袋身中部，解线全程可见） */
      '<div class="env-to"><span>TO //</span>' + esc(ev.title) + '</div>' +
      /* 左下登记表 */
      '<div class="env-form">' +
      '<div class="ef-row"><span>Archive No.</span><i></i><b>' + no + '</b></div>' +
      '<div class="ef-row"><span>Created By</span><i></i><b>\u8036\u6bd4</b></div>' +
      '<div class="ef-row"><span>Category</span><i></i><b>' + esc(ev.category) + '</b></div>' +
      '<div class="ef-row"><span>Period</span><i></i><b>2020\u20132026</b></div>' +
      '<div class="ef-row"><span>Status</span><i></i><b>OPEN</b></div>' +
      '</div>' +
      /* 右下 */
      '<div class="env-rightbox">' +
      '<div class="er-icon"><svg width="34" height="26" viewBox="0 0 34 26"><rect x="1" y="1" width="32" height="24" fill="none" stroke="#3a3a3e" stroke-width="1.5"/><path d="M1 8 L17 16 L33 8" fill="none" stroke="#3a3a3e" stroke-width="1.5"/></svg><em>FULL ARCHIVE</em></div>' +
      '<div class="er-arrow">\u2192</div>' +
      '<div class="er-line">FROM STAGE<br>TO MEMORY</div>' +
      '</div>' +
      '<div class="env-hint">\u70b9\u51fb\u68c9\u7ebf \u00b7 \u5f00\u542f\u6863\u6848</div>' +
      '</div>';
    document.body.appendChild(overlay);

    var done = false;
    function untie() {
      if (done) return;
      done = true;
      overlay.classList.add('untying');
      setTimeout(function () {
        renderEvent(slug);
        suppressRoute = true;
        location.hash = '#/event/' + slug;
        overlay.classList.add('leaving');
        setTimeout(function () { overlay.remove(); }, 650);
      }, 1000);
    }
    overlay.querySelector('.env-knot').addEventListener('click', untie);
    overlay.querySelector('.env-hint').addEventListener('click', untie);
  };

  /* ---------- 路由 ---------- */
  function route() {
    if (suppressRoute) { suppressRoute = false; return; }
    var h = location.hash || '#/';
    if (h.indexOf('#/event/') === 0) renderEvent(h.slice(8));
    else if (h === '#/authors') renderAuthors();
    else renderHome();
  }
  window.addEventListener('hashchange', route);
  route();
})();
