/* =========================================================
   Círculo Salud — comportamiento del sitio (sin dependencias)
   ========================================================= */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var norm = function (s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); };

  /* ---------- Año del footer ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Menú móvil ---------- */
  var toggle = $('.nav-toggle');
  var nav = $('#site-nav');
  function closeNav() {
    if (!nav) return;
    nav.classList.remove('is-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) closeNav();
    });
  }

  /* ---------- Sombra del header al hacer scroll ---------- */
  var header = $('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 6); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Animaciones de entrada ---------- */
  var reveals = $$('.reveal');
  if (reveals.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Tabs (Servicios / Obras sociales) ---------- */
  $$('[data-tabs]').forEach(function (group) {
    var tabs = $$('[role="tab"]', group);
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });

    function select(i, setHash) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (panels[k]) panels[k].hidden = !on;
      });
      if (setHash && tabs[i].dataset.tab && history.replaceState) {
        history.replaceState(null, '', '#' + tabs[i].dataset.tab);
      }
      document.dispatchEvent(new CustomEvent('tabchange', { detail: { index: i } }));
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i, true); });
      t.addEventListener('keydown', function (e) {
        var k = null;
        if (e.key === 'ArrowRight') k = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft') k = (i - 1 + tabs.length) % tabs.length;
        if (k !== null) { e.preventDefault(); tabs[k].focus(); select(k, true); }
      });
    });

    function fromHash() {
      var h = location.hash.replace('#', '');
      for (var k = 0; k < tabs.length; k++) if (tabs[k].dataset.tab === h) return k;
      return 0;
    }
    select(fromHash(), false);
    window.addEventListener('hashchange', function () { select(fromHash(), false); });
  });

  /* ---------- Buscador de obras sociales ---------- */
  var osInput = $('#os-search');
  if (osInput) {
    var chips = $$('.os-chip');
    chips.forEach(function (c) { c.dataset.n = norm(c.textContent); });
    var update = function () {
      var q = norm(osInput.value);
      $$('.panel').forEach(function (p) {
        if (!p.querySelector('.os-chip')) return;
        var visible = 0;
        $$('.os-chip', p).forEach(function (c) {
          var show = !q || c.dataset.n.indexOf(q) !== -1;
          c.hidden = !show;
          if (show) visible++;
        });
        var count = $('.os-count', p);
        var empty = $('.os-empty', p);
        if (count) count.textContent = q
          ? visible + (visible === 1 ? ' resultado' : ' resultados')
          : $$('.os-chip', p).length + ' obras sociales y coberturas';
        if (empty) empty.hidden = visible !== 0;
      });
    };
    osInput.addEventListener('input', update);
    update();
  }

  /* ---------- Lightbox ---------- */
  var lbLinks = $$('[data-lightbox]');
  if (lbLinks.length) {
    var lb = document.createElement('div');
    lb.className = 'lb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Imagen ampliada');
    lb.innerHTML = '<figure style="margin:0;display:contents"><img alt=""><figcaption></figcaption></figure>' +
      '<button type="button" aria-label="Cerrar"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6l-12 12"/><path d="M6 6l12 12"/></svg></button>';
    document.body.appendChild(lb);
    var lbImg = $('img', lb), lbCap = $('figcaption', lb), lbBtn = $('button', lb), lastFocus = null;
    var close = function () { lb.classList.remove('open'); if (lastFocus) lastFocus.focus(); };
    lbLinks.forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        lastFocus = a;
        lbImg.src = a.getAttribute('href');
        lbImg.alt = a.getAttribute('data-lightbox') || '';
        lbCap.textContent = a.getAttribute('data-lightbox') || '';
        lb.classList.add('open');
        lbBtn.focus();
      });
    });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.closest('button')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && lb.classList.contains('open')) close(); });
  }
})();
