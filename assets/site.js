/* 23 Family Dance Studio: shared behaviour (language, navigation, booking -> Telegram) */
(function () {
  'use strict';
  var D = document;
  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  /* ------------------------------------------------------------ language */
  var LANG = 'ru';
  try { LANG = localStorage.getItem('lang') || 'ru'; } catch (e) {}
  if (LANG !== 'ru' && LANG !== 'lv') LANG = 'ru';
  var DICT = window.LV_DICT || {};
  var PATTERNS = [
    [/^\[ ОТОБРАЖЕНО: (\d+) ИЗ (\d+) МАТЕРИАЛОВ \]$/, '[ PARĀDĪTI: $1 NO $2 MATERIĀLIEM ]']
  ];
  function norm(x) { return x.replace(/\s+/g, ' ').trim(); }
  function tr(ru) {
    if (LANG !== 'lv') return ru;
    var k = norm(ru);
    if (DICT[k]) return DICT[k];
    for (var i = 0; i < PATTERNS.length; i++) {
      if (PATTERNS[i][0].test(k)) return k.replace(PATTERNS[i][0], PATTERNS[i][1]);
    }
    return ru;
  }
  function T(ru, lv) { return LANG === 'lv' ? lv : ru; }

  var busy = false;
  function translateNode(n) {
    if (n.nodeType === 3) {
      var p = n.parentNode;
      if (!p || /^(SCRIPT|STYLE|PRE|TEXTAREA)$/.test(p.nodeName) || (p.closest && p.closest('[data-no-i18n]'))) return;
      var cur = n.data;
      if (n.__ru === undefined) {
        if (!/[А-Яа-я]/.test(cur) && LANG === 'lv') return;
        if (!/[А-Яа-я]/.test(cur)) return;
        n.__ru = cur;
      }
      if (LANG === 'lv') {
        var k = norm(n.__ru);
        var v = DICT[k];
        if (!v) { for (var i = 0; i < PATTERNS.length; i++) if (PATTERNS[i][0].test(k)) { v = k.replace(PATTERNS[i][0], PATTERNS[i][1]); break; } }
        if (v) {
          var lead = (n.__ru.match(/^\s*/) || [''])[0], trail = (n.__ru.match(/\s*$/) || [''])[0];
          if (n.data !== lead + v + trail) n.data = lead + v + trail;
        } else if (n.data !== n.__ru) n.data = n.__ru;
      } else if (n.data !== n.__ru) n.data = n.__ru;
    } else if (n.nodeType === 1) {
      if (/^(SCRIPT|STYLE)$/.test(n.nodeName)) return;
      ['placeholder', 'title', 'alt', 'aria-label'].forEach(function (a) {
        if (!n.hasAttribute(a)) return;
        var key = '__ru_' + a;
        var cur = n.getAttribute(a);
        if (n[key] === undefined) { if (!/[А-Яа-я]/.test(cur)) return; n[key] = cur; }
        var out = LANG === 'lv' ? (DICT[norm(n[key])] || n[key]) : n[key];
        if (cur !== out) n.setAttribute(a, out);
      });
      for (var c = n.firstChild; c; c = c.nextSibling) translateNode(c);
    }
  }
  function applyLang() {
    busy = true;
    D.documentElement.lang = LANG;
    translateNode(D.body);
    var titles = {
      'index.html': ['23 Family Dance Studio — танцы в Риге и Саласпилсе', '23 Family Dance Studio — dejas Rīgā un Salaspilī'],
      'prices-riga.html': ['Цены — Rīga | 23 Family', 'Cenas — Rīga | 23 Family'],
      'prices-salaspils.html': ['Цены — Salaspils | 23 Family', 'Cenas — Salaspils | 23 Family'],
      'schedule-riga.html': ['Расписание — Rīga | 23 Family', 'Grafiks — Rīga | 23 Family'],
      'schedule-salaspils.html': ['Расписание — Salaspils | 23 Family', 'Grafiks — Salaspils | 23 Family'],
      'halls.html': ['Залы | 23 Family', 'Zāles | 23 Family'],
      'gallery.html': ['Галерея | 23 Family', 'Galerija | 23 Family'],
      'reviews.html': ['Отзывы | 23 Family', 'Atsauksmes | 23 Family'],
      'booking.html': ['Запись | 23 Family', 'Pieteikšanās | 23 Family'],
      'booking-done.html': ['Заявка | 23 Family', 'Pieteikums | 23 Family']
    };
    var tt = titles[page] || titles['index.html'];
    D.title = LANG === 'lv' ? tt[1] : tt[0];
    // switcher look
    var on = ['bg-primary-container', 'text-on-primary-container'];
    var off = ['text-on-surface-variant'];
    D.querySelectorAll('header button[data-lang]').forEach(function (b) {
      var active = b.getAttribute('data-lang') === LANG;
      on.forEach(function (c) { b.classList.toggle(c, active); });
      off.forEach(function (c) { b.classList.toggle(c, !active); });
    });
    busy = false;
  }
  function setLang(l) {
    LANG = l;
    try { localStorage.setItem('lang', l); } catch (e) {}
    applyLang();
    D.dispatchEvent(new CustomEvent('langchange'));
  }
  if (window.MutationObserver) {
    new MutationObserver(function (muts) {
      if (busy || LANG !== 'lv') return;
      busy = true;
      muts.forEach(function (m) {
        if (m.type === 'characterData') translateNode(m.target);
        m.addedNodes && m.addedNodes.forEach(translateNode);
      });
      busy = false;
    }).observe(D.documentElement, { childList: true, subtree: true, characterData: true });
  }

  /* ------------------------------------------------------------ header / nav */
  function initHeader() {
    var hdr = D.querySelector('header');
    if (!hdr) return;
    // language buttons
    hdr.querySelectorAll('button').forEach(function (b) {
      var t = b.textContent.trim();
      if (t === 'RU' || t === 'LV') {
        b.setAttribute('data-lang', t.toLowerCase());
        b.addEventListener('click', function () { setLang(t.toLowerCase()); });
      }
    });
    // remember the city
    var cm = page.match(/-(riga|salaspils)\.html$/);
    try { if (cm) localStorage.setItem('city', cm[1]); } catch (e) {}
    var city = 'riga';
    try { city = localStorage.getItem('city') || 'riga'; } catch (e) {}
    if (cm) city = cm[1];
    D.querySelectorAll('header nav a, footer a, #mobile-menu a').forEach(function (a) {
      var h = a.getAttribute('href') || '';
      if (/^schedule-(riga|salaspils)\.html$/.test(h)) a.setAttribute('href', 'schedule-' + city + '.html');
      if (/^prices-(riga|salaspils)\.html$/.test(h)) a.setAttribute('href', 'prices-' + city + '.html');
    });
    // active link
    var map = { 'schedule-riga.html': 'schedule', 'schedule-salaspils.html': 'schedule', 'prices-riga.html': 'pricing', 'prices-salaspils.html': 'pricing', 'halls.html': 'studios', 'gallery.html': 'gallery', 'reviews.html': 'reviews' };
    var nav = hdr.querySelector('nav');
    if (nav && map[page]) {
      var act = (nav.getAttribute('data-active-classes') || '').split(/\s+/).filter(Boolean);
      var link = nav.querySelector('a[data-path="' + map[page] + '"]');
      if (link) {
        link.classList.remove('text-on-surface-variant');
        act.forEach(function (c) { link.classList.add(c); });
        link.setAttribute('aria-current', 'page');
      }
    }
    // mobile menu
    if (nav) {
      var right = hdr.querySelector('[data-lang]');
      right = right ? right.parentNode.parentNode : null;
      var btn = D.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Menu');
      btn.setAttribute('aria-expanded', 'false');
      btn.className = 'xl:hidden flex items-center justify-center p-space-xs bg-surface-container-high text-on-surface shadow-[2px_2px_0px_#000000]';
      btn.innerHTML = '<span class="material-symbols-outlined">menu</span>';
      var panel = D.createElement('div');
      panel.id = 'mobile-menu';
      panel.className = 'hidden xl:hidden absolute left-0 right-0 top-full z-50 flex-col gap-space-xs p-space-md bg-surface-container-lowest border-t border-outline-variant';
      nav.querySelectorAll('a').forEach(function (a) {
        var c = a.cloneNode(true);
        c.className = 'block px-space-sm py-space-sm font-label-lg text-label-lg uppercase tracking-wider text-on-surface hover:bg-surface-container';
        panel.appendChild(c);
      });
      var bk = D.createElement('a');
      bk.href = 'booking.html';
      bk.className = 'block text-center mt-space-xs px-space-md py-space-sm bg-primary-container text-on-primary-container font-label-lg text-label-lg uppercase tracking-wider shadow-[4px_4px_0px_#000000]';
      bk.textContent = 'Записаться на пробное';
      panel.appendChild(bk);
      hdr.appendChild(panel);
      if (right) right.insertBefore(btn, right.firstChild); else hdr.firstElementChild.appendChild(btn);
      btn.addEventListener('click', function () {
        var open = panel.classList.toggle('hidden');
        panel.classList.toggle('flex', !open);
        btn.setAttribute('aria-expanded', String(!open));
        btn.firstChild.textContent = open ? 'menu' : 'close';
      });
      panel.addEventListener('click', function (e) { if (e.target.closest('a')) { panel.classList.add('hidden'); panel.classList.remove('flex'); btn.firstChild.textContent = 'menu'; } });
    }
  }

  /* ------------------------------------------------------------ data */
  var TRAINERS = {
    liana: { name: 'Liana', ph: '37127192855', disp: '+371 27192855' },
    anastasiia: { name: 'Anastasiia', ph: '37120529284', disp: '+371 20529284' }
  };
  var HALLS = {
    riga: { name: 'RĪGA', addr: 'Jāņa Daliņa iela 8, Rīga' },
    salaspils: { name: 'SALASPILS', addr: 'Skolas iela 10, Salaspils' }
  };
  // s: [[weekday 0=Sun..6=Sat, 'HH:MM'], ...]
  var GROUPS = {
    riga: [
      { n: 'MINI', age: '2-4 года', cat: 'kids', tr: 'anastasiia', s: [[2, '18:00'], [4, '18:00']] },
      { n: 'BABY', age: '5-7 лет', cat: 'kids', tr: 'anastasiia', s: [[2, '17:00'], [4, '17:00']] },
      { n: 'JUNIOR', age: '8-10 лет', cat: 'juniors', tr: 'anastasiia', s: [[2, '19:00'], [4, '19:00']] },
      { n: 'HIP-HOP KIDS', age: '7-10 лет', cat: 'juniors', tr: 'liana', s: [[1, '18:00'], [5, '17:00']] },
      { n: 'TEENAGERS', age: '13-17 лет', cat: 'teens', tr: 'liana', s: [[1, '17:00'], [3, '17:00']] },
      { n: 'HIGH HEELS', age: '25+', cat: 'adults', tr: 'liana', s: [[1, '13:30'], [3, '13:30']] },
      { n: 'HIGH HEELS PRO', age: '18+', cat: 'adults', tr: 'liana', s: [[1, '19:00'], [3, '19:00']] },
      { n: 'DANCEHALL', age: '30+', cat: 'adults', tr: 'liana', s: [[1, '20:00'], [3, '20:00']] },
      { n: 'HIGH HEELS NEW', age: '18+', cat: 'adults', tr: 'liana', s: [[1, '12:30'], [3, '12:30']] }
    ],
    salaspils: [
      { n: 'MINI', age: '2-4 года', cat: 'kids', tr: 'anastasiia', s: [[1, '18:00'], [3, '18:00']] },
      { n: 'BABY', age: '5-7 лет', cat: 'kids', tr: 'anastasiia', s: [[1, '19:00'], [3, '19:00']] },
      { n: 'JUNIOR', age: '8-10 лет', cat: 'juniors', tr: 'anastasiia', s: [[1, '17:00'], [3, '17:00']] },
      { n: 'MIDDLE', age: '11-13 лет', cat: 'teens', tr: 'liana', s: [[2, '16:00'], [4, '16:00']] },
      { n: 'TEENAGERS', age: '14-17 лет', cat: 'teens', tr: 'liana', s: [[2, '17:00'], [4, '17:00']] },
      { n: 'HIP-HOP BOY', age: '7-11 лет', cat: 'juniors', tr: 'liana', s: [[2, '18:00'], [4, '18:00']] },
      { n: 'HIGH HEELS', age: '18+', cat: 'adults', tr: 'liana', s: [[2, '19:00'], [4, '19:00']] },
      { n: 'DANCEHALL', age: '18+', cat: 'adults', tr: 'liana', s: [[2, '20:00'], [4, '20:00']] }
    ]
  };
  var WD = { ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'], lv: ['Sv', 'Pr', 'Ot', 'Tr', 'Ce', 'Pk', 'Se'] };
  var MON = { ru: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'], lv: ['jan', 'feb', 'mar', 'apr', 'mai', 'jūn', 'jūl', 'aug', 'sep', 'okt', 'nov', 'dec'] };
  function wd(i) { return WD[LANG][i]; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dayStr(g) {
    return g.s.map(function (x) { return wd(x[0]); }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ');
  }
  function timeStr(g) {
    var t = g.s.map(function (x) { return x[1]; });
    var same = t.every(function (x) { return x === t[0]; });
    return same ? t[0] : g.s.map(function (x) { return wd(x[0]) + ' ' + x[1]; }).join(' · ');
  }
  function findGroup(hall, q) {
    if (!q) return null;
    var nq = q.toLowerCase().replace(/[^a-zа-я0-9]/g, '');
    var list = GROUPS[hall] || [];
    for (var i = 0; i < list.length; i++) {
      var ng = list[i].n.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (ng === nq) return list[i];
    }
    for (var j = 0; j < list.length; j++) {
      var n2 = list[j].n.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (nq.indexOf(n2) === 0 || n2.indexOf(nq) === 0) return list[j];
    }
    return null;
  }
  function trainerFor(g, key) { return TRAINERS[key || (g && g.tr) || 'liana']; }

  /* ------------------------------------------------------------ booking message */
  function buildMessage(b) {
    var L = b.lang === 'lv';
    var lines = [];
    lines.push(L ? 'Labdien! Vēlos pieteikties uz izmēģinājuma nodarbību 23 Family.' : 'Здравствуйте! Хочу записаться на пробное занятие в 23 Family.');
    lines.push((L ? 'Zāle: ' : 'Зал: ') + b.hallName + ' (' + b.addr + ')');
    lines.push((L ? 'Grupa: ' : 'Группа: ') + b.groupLabel);
    if (b.slotLabel) lines.push((L ? 'Datums un laiks: ' : 'Дата и время: ') + b.slotLabel);
    lines.push((L ? 'Vārds: ' : 'Имя: ') + b.name);
    if (b.age) lines.push((L ? 'Dejotāja vecums: ' : 'Возраст танцора: ') + b.age);
    lines.push((L ? 'Tālrunis: ' : 'Телефон: ') + b.phone);
    if (b.social) lines.push('Telegram/Instagram: ' + b.social);
    if (b.promo) lines.push(L ? 'Akcija «Atved draugu»: jā' : 'Акция «Приведи друга»: да');
    if (b.plan) lines.push((L ? 'Interesē abonements: ' : 'Интересует абонемент: ') + b.plan);
    return lines.join('\n');
  }

  var PLAN_NAMES = { FAMILY: 'FAMILY', MIX: 'MIX', MONTH: { ru: 'на месяц', lv: 'mēneša' } };
  function planLabel(p) {
    if (!p) return '';
    var v = PLAN_NAMES[p];
    if (v && typeof v === 'object') return v[LANG];
    return v || p;
  }

  /* ------------------------------------------------------------ booking page */
  var CARD_STYLE = 'background: linear-gradient(145deg, rgb(62, 18, 21) 0%, rgb(92, 24, 30) 100%); border: 1px solid rgba(230, 215, 206, 0.35); color: rgb(245, 235, 225);';
  function initBooking() {
    var form = D.getElementById('booking-form');
    if (!form) return;
    var params = new URLSearchParams(location.search);
    var st = { hall: params.get('hall') || (function () { try { return localStorage.getItem('city'); } catch (e) { return null; } })() || 'riga', group: null, age: 'all', slot: null, free: params.get('q') || '', trainer: params.get('trainer'), plan: params.get('plan'), promo: params.get('promo') === 'friend' };
    if (!HALLS[st.hall]) st.hall = 'riga';
    var q = params.get('q');

    var grid = D.getElementById('group-grid');
    var strip = D.getElementById('date-strip');
    var pills = D.getElementById('time-pills');
    var hint = D.getElementById('date-hint');
    var friendWrap = D.getElementById('friend-wrap');
    var friendNote = D.getElementById('friend-note');
    var friendBox = D.getElementById('friend_promo');

    function ageOf(g) { return g.age; }
    function dates(g) {
      var out = [], now = new Date();
      for (var i = 0; i < 35 && out.length < 6; i++) {
        var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
        var dow = d.getDay();
        g.s.forEach(function (x) {
          if (x[0] !== dow) return;
          var hm = x[1].split(':');
          var at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), +hm[0], +hm[1]);
          if (at > now) out.push({ d: d, t: x[1], dow: dow });
        });
      }
      return out;
    }
    function slotLabel(s) { return wd(s.dow) + ' ' + pad(s.d.getDate()) + '.' + pad(s.d.getMonth() + 1) + ', ' + s.t; }

    function setRadioHall() {
      D.querySelectorAll('input[name="studio_hall"]').forEach(function (r) { r.checked = r.value === st.hall; });
    }
    function renderGroups() {
      var list = GROUPS[st.hall].filter(function (g) { return st.age === 'all' || g.cat === st.age; });
      grid.innerHTML = '';
      list.forEach(function (g) {
        var idx = GROUPS[st.hall].indexOf(g);
        var tn = TRAINERS[g.tr].name;
        var lab = D.createElement('label');
        lab.className = 'cursor-pointer block';
        lab.innerHTML = '<input class="peer sr-only" name="dance_direction" type="radio" value="' + idx + '">' +
          '<div class="p-space-sm bg-surface-container transition-all shadow-md flex items-center justify-between" style="' + CARD_STYLE + '">' +
          '<div class="flex flex-col"><div class="flex flex-wrap items-center gap-space-xs">' +
          '<span class="font-headline-sm text-headline-sm text-on-surface leading-tight">' + g.n + '</span>' +
          '<span class="bg-primary-container text-on-primary-container px-1 font-label-sm text-label-sm"></span></div>' +
          '<span class="font-label-sm text-label-sm text-secondary mt-0.5" data-no-i18n></span></div>' +
          '<span class="material-symbols-outlined text-primary text-xl">radio_button_unchecked</span></div>';
        lab.querySelector('.bg-primary-container').textContent = g.age;
        lab.querySelector('[data-no-i18n]').textContent = tn + ' — ' + dayStr(g) + ' · ' + timeStr(g);
        var inp = lab.querySelector('input');
        if (st.group === g) inp.checked = true;
        inp.addEventListener('change', function () { st.group = g; st.free = ''; st.trainer = null; st.slot = null; renderDates(); mark(); summary(); });
        grid.appendChild(lab);
      });
      mark();
    }
    function mark() {
      grid.querySelectorAll('input').forEach(function (i) {
        var ic = i.parentNode.querySelector('.material-symbols-outlined');
        ic.textContent = i.checked ? 'radio_button_checked' : 'radio_button_unchecked';
      });
    }
    function renderDates() {
      strip.innerHTML = ''; pills.innerHTML = ''; hint.textContent = '';
      if (!st.group) { hint.textContent = st.free ? T('Для этого направления время уточнит тренер.', 'Šī virziena laiku precizēs treneris.') : T('Сначала выберите группу.', 'Vispirms izvēlieties grupu.'); return; }
      var ds = dates(st.group);
      ds.forEach(function (s, i) {
        var lab = D.createElement('label');
        lab.className = 'cursor-pointer';
        lab.innerHTML = '<input class="peer sr-only" name="booking_day" type="radio" value="' + i + '">' +
          '<div class="p-space-xs text-center bg-surface-container shadow-sm" style="' + CARD_STYLE + '">' +
          '<span class="font-label-sm text-label-sm block uppercase opacity-70">' + wd(s.dow) + '</span>' +
          '<span class="font-headline-md text-headline-md block font-bold leading-none mt-1">' + pad(s.d.getDate()) + '</span>' +
          '<span class="font-label-sm text-label-sm block mt-1">' + MON[LANG][s.d.getMonth()] + '</span></div>';
        var inp = lab.querySelector('input');
        inp.addEventListener('change', function () {
          st.slot = s;
          pills.innerHTML = '<span class="font-label-sm text-label-sm text-secondary uppercase mr-space-xs">' + T('ВРЕМЯ:', 'LAIKS:') + '</span>' +
            '<span class="px-space-md py-space-xs font-label-md text-label-md uppercase font-bold block shadow-sm" style="background:#E6D7CE;color:#2b0a0d">' + s.t + '</span>';
          summary();
        });
        strip.appendChild(lab);
      });
      if (ds.length) { var first = strip.querySelector('input'); first.checked = true; first.dispatchEvent(new Event('change')); }
    }
    function summary() {
      var set = function (id, v) { var e = D.getElementById(id); if (e) { e.textContent = v; e.setAttribute('data-no-i18n', ''); } };
      set('sum-hall', HALLS[st.hall].name + ' (' + HALLS[st.hall].addr.split(',')[0] + ')');
      set('sum-group', st.group ? st.group.n + ' (' + tr(st.group.age) + ')' : (st.free || '—'));
      var tk = st.trainer || (st.group ? st.group.tr : 'liana');
      set('sum-trainer', TRAINERS[tk].name);
      set('sum-slot', st.slot ? slotLabel(st.slot) : '—');
      if (friendWrap) friendWrap.style.display = st.hall === 'salaspils' ? '' : 'none';
      if (friendNote) friendNote.style.display = st.hall === 'salaspils' ? '' : 'none';
      if (st.hall !== 'salaspils' && friendBox) friendBox.checked = false;
    }
    function changeHall(h) {
      st.hall = h; st.group = null; st.slot = null;
      setRadioHall(); renderGroups(); renderDates(); summary();
    }
    D.querySelectorAll('input[name="studio_hall"]').forEach(function (r) { r.addEventListener('change', function () { changeHall(r.value); }); });
    D.querySelectorAll('.age-chip').forEach(function (c) {
      c.addEventListener('click', function () {
        st.age = c.getAttribute('data-age');
        D.querySelectorAll('.age-chip').forEach(function (x) {
          var on = x === c;
          x.classList.toggle('bg-secondary-fixed', on); x.classList.toggle('text-on-secondary-fixed', on); x.classList.toggle('font-bold', on);
          x.classList.toggle('bg-surface-container', !on); x.classList.toggle('text-on-surface-variant', !on);
        });
        renderGroups();
      });
    });
    var first = D.querySelector('.age-chip[data-age="all"]');
    if (first) { first.classList.add('bg-secondary-fixed', 'text-on-secondary-fixed', 'font-bold'); first.classList.remove('bg-surface-container', 'text-on-surface-variant'); }

    setRadioHall();
    st.group = q ? findGroup(st.hall, q) : null;
    if (st.group) st.free = '';
    if (friendBox && st.promo && st.hall === 'salaspils') friendBox.checked = true;
    renderGroups(); renderDates(); summary();
    D.addEventListener('langchange', function () { renderGroups(); if (st.group) { var si = st.slot; renderDates(); } summary(); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var g = st.group;
      if (!g && !st.free) { alert(T('Выберите группу.', 'Izvēlieties grupu.')); grid.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      if (g && !st.slot) { alert(T('Выберите дату занятия.', 'Izvēlieties nodarbības datumu.')); return; }
      var v = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ''; };
      var phone = v('f_phone');
      if (phone.replace(/\D/g, '').length < 8) { alert(T('Проверьте номер телефона.', 'Pārbaudiet tālruņa numuru.')); return; }
      var tk = st.trainer || (g ? g.tr : 'liana');
      var data = {
        lang: LANG, hall: st.hall, hallName: HALLS[st.hall].name, addr: HALLS[st.hall].addr,
        groupLabel: g ? g.n + ' (' + tr(g.age) + ')' : st.free,
        group: g ? g.n : '', slotLabel: st.slot ? slotLabel(st.slot) : '',
        name: v('f_name'), age: v('f_age'), phone: phone, social: v('f_social'),
        promo: !!(friendBox && friendBox.checked), plan: planLabel(st.plan), trainer: tk
      };
      try { sessionStorage.setItem('booking23', JSON.stringify(data)); } catch (er) {}
      location.href = 'booking-done.html';
    });
  }

  /* ------------------------------------------------------------ home trial form */
  function initTrialForm() {
    var f = D.getElementById('trial-form');
    if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var hall = (f.querySelector('input[name="hall"]:checked') || {}).value || 'riga';
      var sel = f.querySelector('select');
      var dirText = sel.value || sel.options[sel.selectedIndex].text;
      var q = dirText.split('(')[0].trim();
      var g = findGroup(hall, q.replace(/ dance$/i, ''));
      var phone = f.querySelector('[name="f_phone"]').value.trim();
      if (phone.replace(/\D/g, '').length < 8) { alert(T('Проверьте номер телефона.', 'Pārbaudiet tālruņa numuru.')); return; }
      var tk = g ? g.tr : (/mini|baby/i.test(q) ? 'anastasiia' : 'liana');
      var data = {
        lang: LANG, hall: hall, hallName: HALLS[hall].name, addr: HALLS[hall].addr,
        groupLabel: g ? g.n + ' (' + tr(g.age) + ')' : dirText,
        group: g ? g.n : '', slotLabel: g ? dayStr(g) + ', ' + timeStr(g) : '',
        name: f.querySelector('[name="f_name"]').value.trim(), age: '', phone: phone, social: '', promo: false, plan: '', trainer: tk
      };
      try { sessionStorage.setItem('booking23', JSON.stringify(data)); } catch (er) {}
      location.href = 'booking-done.html';
    });
  }

  /* ------------------------------------------------------------ booking-done */
  function initDone() {
    var pre = D.getElementById('msg-preview');
    if (!pre) return;
    var b = null;
    try { b = JSON.parse(sessionStorage.getItem('booking23') || 'null'); } catch (e) {}
    if (!b) { location.replace('booking.html'); return; }
    var tk = TRAINERS[b.trainer] || TRAINERS.liana;
    function render() {
      var msg = buildMessage(Object.assign({}, b, { lang: LANG }));
      pre.textContent = msg;
      var set = function (id, v) { var e = D.getElementById(id); if (e) { e.textContent = v; e.setAttribute('data-no-i18n', ''); } };
      set('done-hall', b.hallName); set('done-addr', b.addr); set('done-group', b.groupLabel);
      set('done-slot', b.slotLabel ? b.slotLabel.split(',')[0] : T('ПО РАСПИСАНИЮ', 'PĒC GRAFIKA'));
      set('done-slot-note', b.slotLabel && b.slotLabel.indexOf(',') > -1 ? b.slotLabel.split(',').slice(1).join(',').trim() : T('Тренировка по расписанию группы', 'Nodarbība pēc grupas grafika'));
      set('done-trainer', tk.name + ' ' + tk.disp);
      var link = D.getElementById('tg-send');
      if (link) link.href = 'https://t.me/+' + tk.ph + '?text=' + encodeURIComponent(msg);
    }
    var idEl = D.getElementById('done-id');
    if (idEl) idEl.textContent = '#23FAM-' + String(Date.now()).slice(-5);
    render();
    D.addEventListener('langchange', render);
    var cp = D.getElementById('copy-msg');
    if (cp) cp.addEventListener('click', function () {
      var done = function () { cp.textContent = T('Скопировано ✓', 'Nokopēts ✓'); setTimeout(function () { cp.textContent = T('Скопировать сообщение', 'Kopēt ziņu'); }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(pre.textContent).then(done, done); else done();
    });
  }

  /* ------------------------------------------------------------ booking links with context */
  function enhanceBookingLinks() {
    var hallOf = (page.match(/-(riga|salaspils)\.html$/) || [])[1] || '';
    // schedule cards -> group
    D.querySelectorAll('.schedule-card a[href^="booking.html"]').forEach(function (a) {
      var card = a.closest('.schedule-card');
      var w = D.createTreeWalker(card, NodeFilter.SHOW_TEXT), n, name = '';
      while ((n = w.nextNode())) { var t = n.data.trim(); if (/^[A-Z][A-Z \-]{2,}$/.test(t)) { name = t; break; } }
      if (name) a.setAttribute('href', 'booking.html?hall=' + hallOf + '&q=' + encodeURIComponent(name));
    });
    // home direction cards -> direction
    D.querySelectorAll('#directions-section a[href^="booking.html"]').forEach(function (a) {
      var el = a.parentElement, h = null;
      while (el && !(h = el.querySelector('h3'))) el = el.parentElement;
      if (h) a.setAttribute('href', 'booking.html?q=' + encodeURIComponent(h.textContent.trim()));
    });
  }

  /* ------------------------------------------------------------ go */
  function init() {
    initHeader();
    enhanceBookingLinks();
    initBooking();
    initTrialForm();
    initDone();
    applyLang();
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init); else init();
})();
