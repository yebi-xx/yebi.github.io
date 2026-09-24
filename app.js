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
  function sealSvg(cls) {
    /* 手绘线稿火漆印：不规则蜡封边缘 + 内圈 + 四角星浮雕，1px 线宽 */
    return '<svg class="dlogo-icon seal ' + (cls || '') + '" width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" aria-hidden="true">' +
      '<path stroke-width="1" d="M15 1.9c2.5-.3 4.8.8 6.7 1.7 1.9.8 3.7 1.9 4.7 3.7 1 1.8.7 3.9 1 5.9.3 2 .9 3.9.2 5.8-.7 2-2.3 3.2-3.8 4.5-1.5 1.3-3.1 2.6-5.1 2.7-1.9.1-3.7-.9-5.5-1.4-1.8-.5-3.8-.5-5.3-1.6-1.5-1.1-2.3-3-2.9-4.8-.7-1.8-1.7-3.5-1.3-5.4.4-1.9 1.9-3.3 3.1-4.7 1.2-1.5 2.1-3.4 3.8-4.3 1.7-.9 3.6-.3 5.4-.4z"/>' +
      '<circle cx="15" cy="15" r="10.2" stroke-width="1"/>' +
      '<path stroke-width="1" d="M15 9.6l1.5 3.9 3.9 1.5-3.9 1.5-1.5 3.9-1.5-3.9-3.9-1.5 3.9-1.5z"/>' +
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
        return '<div class="wrow" onclick="openFile(\'' + ev.slug + '\', this)">' +
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
      (eventRows('特别活动') + teaserRowHtml()),
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
      '<span class="dm-teaser" id="dmTeaser"></span><span class="dm-right">EST. BY 耶比大雄 · AMOR FATI</span>' +
      '</div>' +
      '<div class="dleft">' +
      '<div class="dlogo">' + sealSvg() + '<h1><span>一期</span><span>一會</span></h1></div>' +
      '<div class="dsub">After the Curtain Call</div>' +
      '<div class="ddash"><em></em><span>✦</span></div>' +
      '<div class="damor">' + esc(D.site.subtitle) + '<span> — ' + esc(D.site.subtitleNote) + '</span></div>' +
      '<div class="dmeta">「 ' + esc(D.site.tagline) + ' 」</div>' +
      '<div class="dstats">EVENTS ' + D.events.length + ' · WORKS ' + allWorks + ' · AUTHORS ' + authorCount + '</div>' +
      '</div>' +
      '<div class="dright">' + eventWin + salonWin + guestWin + '</div>' +
      '<div class="dfoot">本站收录由耶比大雄主催的瓷右企划产出归档。产出均保留原帖直达链接，请多多去原帖点赞评论支持老师。</div>' +
      '</div>' + lightboxHtml();

    makeStarsIn(document.getElementById('dstars'));
    initDrag();
    initParallax();
    initFallingStars();
    initAmor();
    initTeaser();
    window.scrollTo(0, 0);
  }

  /* ---------- 减弱动态偏好 ---------- */
  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ---------- 视差层（桌面端 only，lag 0.08） ---------- */
  function initParallax() {
    if (reducedMotion()) return;
    if (!window.matchMedia('(min-width: 861px) and (hover: hover)').matches) return;
    var stars = document.querySelector('.dstars');
    var left = document.querySelector('.dleft');
    if (!stars || !left) return;
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    function onMove(e) {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }
    function loop() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      stars.style.transform = 'translate3d(' + (cx * 10).toFixed(2) + 'px,' + (cy * 10).toFixed(2) + 'px,0)';
      left.style.setProperty('--px', (-cx * 4).toFixed(2) + 'px');
      left.style.setProperty('--py', (-cy * 4).toFixed(2) + 'px');
      raf = requestAnimationFrame(loop);
    }
    document.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(loop);
    window.__cleanups.push(function () {
      document.removeEventListener('mousemove', onMove);
      if (raf) cancelAnimationFrame(raf);
    });
  }

  /* ---------- 落星交互（全端，≤30 颗同活） ---------- */
  var aliveStars = [];
  function spawnStar(x, y) {
    if (reducedMotion()) return;
    var el = document.createElement('div');
    el.className = 'spawn-star';
    var size = 3 + Math.random() * 3;
    var rot = (Math.random() * 30 - 15).toFixed(1);
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.innerHTML = '<svg width="' + size.toFixed(1) + '" height="' + size.toFixed(1) + '" viewBox="0 0 12 12" style="transform:rotate(' + rot + 'deg)"><path d="M6 .8l1.3 3.9 3.9 1.3-3.9 1.3L6 11.2 4.7 7.3.8 6l3.9-1.3z" fill="#E8E4DC"/></svg>';
    document.body.appendChild(el);
    aliveStars.push(el);
    if (aliveStars.length > 30) {
      var oldest = aliveStars.shift();
      oldest.classList.add('early');
      setTimeout(function () { if (oldest.parentNode) oldest.remove(); }, 420);
    }
    setTimeout(function () {
      var i = aliveStars.indexOf(el);
      if (i > -1) aliveStars.splice(i, 1);
      if (el.parentNode) el.remove();
    }, 2600);
  }

  function initFallingStars() {
    if (reducedMotion()) return;
    var desktopEl = document.querySelector('.desktop');
    if (!desktopEl) return;
    function onTap(e) {
      var t = e.target;
      if (t.closest && t.closest('a, button, .win, .dmenu')) return;
      spawnStar(e.clientX, e.clientY);
    }
    desktopEl.addEventListener('click', onTap);
    window.__cleanups.push(function () {
      desktopEl.removeEventListener('click', onTap);
    });
  }

  /* ---------- 彩蛋：a-m-o-r 流星雨（1.5s） ---------- */
  function meteorShower() {
    if (reducedMotion()) return;
    if (document.querySelector('.meteors')) return;
    var box = document.createElement('div');
    box.className = 'meteors';
    for (var i = 0; i < 10; i++) {
      var m = document.createElement('i');
      m.className = 'meteor';
      m.style.top = (4 + Math.random() * 32) + '%';
      m.style.left = (35 + Math.random() * 60) + '%';
      m.style.setProperty('--dl', (i * 0.11 + Math.random() * 0.08).toFixed(2) + 's');
      m.style.setProperty('--d', (0.55 + Math.random() * 0.3).toFixed(2) + 's');
      box.appendChild(m);
    }
    document.body.appendChild(box);
    setTimeout(function () { box.remove(); }, 1700);
  }

  function initAmor() {
    if (reducedMotion()) return;
    var buf = '';
    function onKey(e) {
      if (e.key && e.key.length === 1) {
        buf = (buf + e.key.toLowerCase()).slice(-4);
        if (buf === 'amor') {
          buf = '';
          meteorShower();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    window.__cleanups.push(function () {
      document.removeEventListener('keydown', onKey);
    });
  }

  /* 星点：细碎 + 闪烁 */
  function makeStarsIn(box) {
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
  /* ============================================================
     LOVE LETTER 预告系统（三阶段全自动 · 数据驱动）
     ============================================================ */
  function fmtMD(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
    return m ? (+m[2]) + '.' + (+m[3]) : '';
  }

  function teaserState() {
    var t = D.site.teaser;
    if (!t || !t.reveal_date) return null;
    var now = Date.now();
    var rv = new Date(t.reveal_date.replace(' ', 'T')).getTime();
    var st = new Date(t.event_start.replace(' ', 'T')).getTime();
    var en = new Date(t.event_end.replace(' ', 'T')).getTime();
    var DAY = 86400000;
    var phase = now < rv ? 1 : (now < st ? 2 : (now <= en ? 3 : 0));
    if (!phase) return null;
    return {
      t: t, phase: phase,
      daysReveal: Math.max(0, Math.ceil((rv - now) / DAY)),
      daysOpen: Math.max(0, Math.ceil((st - now) / DAY)),
      progress: Math.min(1, Math.max(0.03, 1 - Math.max(0, Math.ceil((rv - now) / DAY)) / 60))
    };
  }

  function teaserStatusText(st) {
    if (st.phase === 1) return 'NEXT: LOVE LETTER // T-' + st.daysReveal + 'D';
    if (st.phase === 2) return 'NEXT: LOVE LETTER // T-' + st.daysOpen + 'D';
    return 'NOW OPEN: LOVE LETTER // ' + fmtMD(st.t.event_start) + '—' + fmtMD(st.t.event_end);
  }

  function teaserCdText(st) {
    if (st.phase === 1) return 'T-MINUS ' + st.daysReveal + ' DAYS // REVEAL ' + fmtMD(st.t.reveal_date);
    if (st.phase === 2) return 'T-MINUS ' + st.daysOpen + ' DAYS // OPEN ' + fmtMD(st.t.event_start);
    return 'NOW OPEN // ' + fmtMD(st.t.event_start) + '—' + fmtMD(st.t.event_end);
  }

  /* Event_.txt 末尾的预告/锁定行 */
  function teaserRowHtml() {
    var st = teaserState();
    if (!st) return '';
    if (st.phase === 1) {
      return '<div class="wrow tlock"><span class="w-idx">LOCK</span>' +
        '<span class="w-name">' + esc(st.t.short) + ' // DECRYPTING…</span>' +
        '<span class="tlock-bar"><i style="width:' + Math.round(st.progress * 100) + '%"></i></span></div>';
    }
    return '<div class="wrow" onclick="openTeaserWin()"><span class="w-idx">▶</span>' +
      '<span class="w-name">' + esc(st.t.name) + '</span>' +
      '<span class="w-items"><i class="new-dot"></i>NEW</span></div>';
  }

  window.openTeaserWin = function () {
    var st = teaserState();
    if (!st || document.getElementById('teaserWin')) return;
    window.closeTeaserWin(true);
    var win = document.createElement('div');
    win.className = 'teaser-win';
    win.id = 'teaserWin';
    var inner = '';
    if (st.phase === 1) {
      inner = '<div class="tw-type"><span id="twType"></span><i class="tw-caret"></i></div>' +
        '<div class="tw-quote">「 ' + esc(st.t.quote) + ' 」</div>' +
        '<div class="tw-cd" id="twCd">' + esc(teaserCdText(st)) + '</div>';
    } else {
      inner = (st.t.poster ? '<div class="tw-poster"><img src="' + esc(st.t.poster) + '" alt="poster"></div>' : '') +
        '<div class="tw-type"><span>' + esc(st.t.name) + '</span>' + (st.phase === 2 ? '<i class="new-dot tw-new"></i>' : '') + '</div>' +
        (st.t.announcement_text ? '<div class="tw-announce">' + esc(st.t.announcement_text) + '</div>' :
          '<div class="tw-quote">「 ' + esc(st.t.quote) + ' 」</div>') +
        '<div class="tw-cd" id="twCd">' + esc(teaserCdText(st)) + '</div>';
    }
    win.innerHTML =
      '<div class="tw-bar"><span class="tw-file">INCOMING_TRANSMISSION.exe</span>' +
      '<span class="ww-btns"><i></i><i></i><i class="wx" onclick="closeTeaserWin()"></i></span></div>' +
      '<div class="tw-body">' + inner + '</div>' +
      '<div class="tw-foot"><span class="tw-mark" onclick="closeTeaserWin()">MARK THE DATE ←</span></div>';
    document.body.appendChild(win);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { win.classList.add('open'); });
    });
    /* 打字机（≤2s，点击跳过） */
    if (st.phase === 1) {
      var name = st.t.name, pos = 0, done = false;
      var el = win.querySelector('#twType');
      var iv = setInterval(function () {
        if (done) return;
        pos++;
        el.textContent = name.slice(0, pos);
        if (pos >= name.length) { done = true; clearInterval(iv); }
      }, 28);
      var skip = function () {
        if (done) return;
        done = true; clearInterval(iv);
        el.textContent = name;
      };
      win.addEventListener('click', skip);
      window.__cleanups.push(function () { clearInterval(iv); });
    }
    /* 倒计时逐秒跳动（与状态栏同源） */
    var cdIv = setInterval(function () {
      var s2 = teaserState();
      var cd = document.getElementById('twCd');
      var dm = document.getElementById('dmTeaser');
      if (!s2) { clearInterval(cdIv); if (cd) cd.textContent = '—'; return; }
      if (cd) cd.textContent = teaserCdText(s2);
      if (dm) dm.textContent = teaserStatusText(s2);
    }, 1000);
    window.__cleanups.push(function () { clearInterval(cdIv); });
  };

  window.closeTeaserWin = function (silent) {
    var win = document.getElementById('teaserWin');
    if (win) {
      win.classList.add('closing');
      setTimeout(function () { win.remove(); }, 300);
    }
    if (!silent) {
      var mail = document.getElementById('mailIcon');
      if (mail) mail.classList.add('shown');
    }
  };

  function initTeaser() {
    var st = teaserState();
    var desk = document.querySelector('.desktop');
    /* 状态栏常驻（全期） */
    var dm = document.getElementById('dmTeaser');
    if (dm) {
      dm.textContent = st ? teaserStatusText(st) : '';
      if (st) {
        var dmIv = setInterval(function () {
          var s2 = teaserState();
          if (!s2) { dm.textContent = ''; clearInterval(dmIv); return; }
          dm.textContent = teaserStatusText(s2);
        }, 1000);
        window.__cleanups.push(function () { clearInterval(dmIv); });
      }
    }
    if (!st || !desk) return;
    /* 桌面信封图标 Mail_.exe */
    var mail = document.createElement('div');
    mail.className = 'mail-icon' + (st.phase === 1 ? ' blink' : '');
    mail.id = 'mailIcon';
    mail.innerHTML = '<svg width="22" height="16" viewBox="0 0 22 16" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><rect x="1" y="1" width="20" height="14"/><path d="M1 3l10 7L21 3"/></svg><span>Mail_.exe</span>';
    mail.onclick = window.openTeaserWin;
    desk.appendChild(mail);
    /* 自动弹窗：每阶段每 session 一次 */
    var key = 'll_auto_' + st.phase;
    var seen = false;
    try { seen = sessionStorage.getItem(key) === '1'; } catch (e) {}
    if (!seen) {
      var delay = st.phase === 1 ? 2000 : 1200;
      var to = setTimeout(function () {
        try { sessionStorage.setItem(key, '1'); } catch (e) {}
        window.openTeaserWin();
      }, delay);
      window.__cleanups.push(function () { clearTimeout(to); });
    }
  }

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

  /* ============================================================
     活动子页面 · 深色纸质档案终端（ARCHIVAL TERMINAL，全活动共用）
     ============================================================ */
  function renderEventBrut(ev) {
    var counts = { 'ALL': ev.works.length };
    ev.works.forEach(function (w) {
      var c = w.cp || '无CP';
      counts[c] = (counts[c] || 0) + 1;
    });
    var cps = ['ALL'].concat(Object.keys(counts).filter(function (k) { return k !== 'ALL'; }));
    var filtered = worksFiltered(ev);
    var byNo = {};
    ev.works.forEach(function (w) { byNo[w.no] = w; });

    /* FULL INDEX 登记簿 */
    var rowsHtml = '', lastStrip = null;
    filtered.forEach(function (w) {
      var stripKey = w.day ? ('D|' + w.day) : (w.group ? ('G|' + w.group) : null);
      if (stripKey && stripKey !== lastStrip) {
        lastStrip = stripKey;
        rowsHtml += '<div class="tr-strip">' + esc(w.day || w.group) + '</div>';
      }
      var no = String(w.no).padStart(2, '0');
      var mainTitle = w.title
        ? '《' + w.title + '》'
        : (w.song ? '♪ ' + w.song : (w.time ? w.time : esc(w.author || '匿名')));
      var authorBit = (w.title || w.song || w.time)
        ? '<span class="tr-author">— ' + esc(w.author || '匿名') + '</span>'
        : '';
      rowsHtml += '<div class="tr-row" data-no="' + w.no + '">' +
        '<span class="tr-star">✦</span>' +
        '<span class="tr-cp">CP 索引 // ' + esc(w.cp || '—') + '</span>' +
        '<span class="tr-no">NO.' + no + ' / ' + esc(ev.archive_prefix) + '-AR-' + no + '</span>' +
        '<span class="tr-main">' + mainTitle + authorBit + '</span>' +
        '<span class="tr-lead"><i></i></span>' +
        '<span class="tr-form">' + esc(w.form) + '</span>' +
        '</div>';
    });

    var drawersHtml = cps.map(function (c) {
      var active = (c === 'ALL' && state.cp === '全部') || (c === state.cp);
      return '<button class="tr-drawer' + (active ? ' active' : '') + '" data-cp="' + esc(c) + '">' +
        '<span>' + esc(c) + '</span><b>' + counts[c] + '</b></button>';
    }).join('');
    var selectHtml = cps.map(function (c) {
      var sel = (c === 'ALL' && state.cp === '全部') || (c === state.cp);
      return '<option value="' + esc(c) + '"' + (sel ? ' selected' : '') + '>' + esc(c) + ' (' + counts[c] + ')</option>';
    }).join('');

    app.innerHTML =
      '<div class="term">' +
      '<div class="term-stars" id="tstars"></div>' +
      '<div class="term-bar">' +
      '<span class="tb-left">一期一會 // ARCHIVE TERMINAL</span>' +
      '<span class="tb-mid">' + esc(ev.source_file) + ' &gt; ' + ev.event_no + '_' + esc(ev.event_name) + '</span>' +
      '<span class="tb-right">ARCHIVED: ' + ev.items_count + ' · LOST: ' + ev.lost_count + '</span>' +
      '</div>' +
      '<div class="term-board" id="termBoard">' +
      '<header class="tb-head">' +
      '<div class="tb-headinfo">' + esc(ev.event_name_en) + ' / ' + (ev.date ? esc(ev.date) : '—') + ' / ' + ev.items_count + ' ITEMS / ' + ev.guests_count + ' GUESTS</div>' +
      '<h1>' + esc(ev.event_name) + '</h1>' +
      (ev.theme_quote ? '<div class="tb-note"><span class="tb-tape"></span>' + esc(ev.theme_quote) + '</div>' : '') +
      '</header>' +
      '<div class="tr-index">FULL INDEX — ' + filtered.length + ' RECORDS</div>' +
      (rowsHtml ? '<div class="tr-list" id="trList">' + rowsHtml + '</div>' : '<div class="tr-empty">没有符合条件的记录</div>') +
      '<div class="tr-drawers">' + drawersHtml + '</div>' +
      '<select class="tr-select" id="cpSelect">' + selectHtml + '</select>' +
      '<div class="tb-foot" onclick="backToDesktop()">BACK TO DESKTOP ←</div>' +
      '</div>' +
      lightboxHtml();

    /* 交互 */
    var listEl = document.getElementById('trList');
    if (listEl) {
      listEl.addEventListener('click', function (e) {
        var row = e.target.closest ? e.target.closest('.tr-row') : null;
        if (!row) return;
        var w = byNo[+row.getAttribute('data-no')];
        if (w) openWorkWin(ev, w);
      });
    }
    var drawers = document.querySelectorAll('.tr-drawer');
    for (var j = 0; j < drawers.length; j++) {
      drawers[j].onclick = function () {
        state.cp = this.getAttribute('data-cp') === 'ALL' ? '全部' : this.getAttribute('data-cp');
        renderEvent(ev.slug);
      };
    }
    var sel = document.getElementById('cpSelect');
    if (sel) {
      sel.onchange = function () {
        state.cp = this.value === 'ALL' ? '全部' : this.value;
        renderEvent(ev.slug);
      };
    }
    makeStarsIn(document.getElementById('tstars'));
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
      lines.innerHTML = '<path d="' + d + '" fill="none" stroke="#9aa0a8" stroke-width="1" stroke-dasharray="4 5" opacity=".5"/>';
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
     转场：深色档案纸从点击处展开（PAPER EXPAND, 350ms）
     ============================================================ */
  var suppressRoute = false;

  window.openFile = function (slug, el) {
    if (document.querySelector('.paper-fly')) return;
    var rect = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    var cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    var cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    var fly = document.createElement('div');
    fly.className = 'paper-fly';
    fly.style.left = (cx - 40) + 'px';
    fly.style.top = (cy - 14) + 'px';
    document.body.appendChild(fly);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { fly.classList.add('expand'); });
    });
    setTimeout(function () {
      renderEvent(slug);
      suppressRoute = true;
      location.hash = '#/event/' + slug;
      fly.classList.add('fade');
      setTimeout(function () { fly.remove(); }, 320);
    }, 360);
  };

  window.backToDesktop = function () {
    var board = document.getElementById('termBoard');
    if (board) {
      board.classList.add('leaving');
      setTimeout(function () { location.hash = '#/'; }, 260);
    } else {
      location.hash = '#/';
    }
  };

  window.closeWorkWin = function () {
    var w = document.getElementById('workWin');
    if (w) w.remove();
  };

  /* ---------- 纸质详情窗（单一实例，纸窗弹出 250ms / 章落纸震 200ms） ---------- */
  function openWorkWin(ev, w) {
    window.closeWorkWin();
    var no = String(w.no).padStart(2, '0');
    var titleText = w.title || (w.song ? '♪ ' + w.song : (w.time ? w.time + ' · ' + (w.author || '匿名') : '未命名'));

    var leftCol;
    if (w.form !== '文' && w.preview_url) {
      leftCol = '<div class="ww-media"><img src="' + w.preview_url + '" alt="预览" loading="lazy"></div>';
    } else if (w.excerpt) {
      leftCol = '<div class="ww-quote">“ ' + esc(w.excerpt) + ' ”</div>';
    } else if (w.preview_url) {
      leftCol = '<div class="ww-media"><img src="' + w.preview_url + '" alt="预览" loading="lazy"></div>';
    } else {
      leftCol = '<div class="ww-noex">（无摘录 · 原文见原帖）</div>';
    }

    var win = document.createElement('div');
    win.className = 'work-win';
    win.id = 'workWin';
    win.innerHTML =
      '<div class="ww-bar">' +
      '<span class="ww-file">WORK_' + esc(ev.archive_prefix) + '-AR-' + no + '.txt</span>' +
      '<span class="ww-btns"><i></i><i></i><i class="wx" onclick="closeWorkWin()"></i></span>' +
      '</div>' +
      '<div class="ww-body">' +
      '<div class="ww-left">' + leftCol + '</div>' +
      '<div class="ww-right">' +
      '<div class="ww-title">' + esc(titleText) + '</div>' +
      '<div class="ww-meta">' +
      '<div class="ww-row"><span>CP</span><i></i><b>' + esc(w.cp || '—') + '</b></div>' +
      '<div class="ww-row"><span>FORM</span><i></i><b>' + esc(w.form) + '</b></div>' +
      '<div class="ww-row"><span>AUTHOR</span><i></i><b>' + esc(w.author || '匿名') + '</b></div>' +
      '<div class="ww-row"><span>NO.</span><i></i><b>' + no + '</b></div>' +
      (w.paro ? '<div class="ww-row"><span>PARO</span><i></i><b>' + esc(w.paro) + '</b></div>' : '') +
      (w.time && w.title ? '<div class="ww-row"><span>TIME</span><i></i><b>' + esc(w.time) + '</b></div>' : '') +
      (w.note ? '<div class="ww-row"><span>NOTE</span><i></i><b>' + esc(w.note) + '</b></div>' : '') +
      '</div>' +
      '<a class="ww-open' + (w.original_lost ? ' dead' : '') + '" href="' + (w.original_url || '#') + '" target="_blank" rel="noopener"' + (w.original_lost ? ' onclick="event.preventDefault()"' : '') + '>OPEN ORIGINAL →</a>' +
      '</div>' +
      '<div class="ww-seals">' +
      '<div class="ww-seal"><span>ARCHIVED</span>' + (w.archived_date ? '<em>' + esc(w.archived_date) + '</em>' : '') + '</div>' +
      (w.original_lost ? '<div class="ww-lost">ORIGINAL LOST</div>' : '') +
      '</div>' +
      '</div>';
    document.body.appendChild(win);
  }

  /* ---------- 路由 ---------- */
  window.__cleanups = window.__cleanups || [];
  function route() {
    if (suppressRoute) { suppressRoute = false; return; }
    /* 清理上一页的全局监听（视差/落星/彩蛋） */
    for (var i = 0; i < window.__cleanups.length; i++) {
      try { window.__cleanups[i](); } catch (err) {}
    }
    window.__cleanups = [];
    aliveStars = [];
    var h = location.hash || '#/';
    if (h.indexOf('#/event/') === 0) renderEvent(h.slice(8));
    else if (h === '#/authors') renderAuthors();
    else renderHome();
  }
  window.addEventListener('hashchange', route);
  route();
})();
