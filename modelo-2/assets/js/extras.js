/* Círculo Salud — animaciones extra (modelos 2 y 3). JS puro, sin librerías. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Titular dividido en palabras (entrada escalonada) ---------- */
  $$('[data-split]').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map(function (w, i) {
      return '<span class="w" aria-hidden="true"><span style="--i:' + i + '">' + w + '</span></span>';
    }).join(' ');
    requestAnimationFrame(function () { el.classList.add('split-in'); });
  });

  /* ---------- Entradas por data-anim (up / left / right / zoom) ---------- */
  var anims = $$('[data-anim]');
  if (anims.length) {
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('anim-in'); io.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
      anims.forEach(function (el) { io.observe(el); });
    } else { anims.forEach(function (el) { el.classList.add('anim-in'); }); }
  }

  /* ---------- Contadores ---------- */
  var counters = $$('[data-count]');
  function runCount(el) {
    var to = parseInt(el.getAttribute('data-count'), 10) || 0, suf = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = to + suf; return; }
    var t0 = null, dur = 1600;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (counters.length) {
    if ('IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); } });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { cio.observe(el); });
    } else { counters.forEach(runCount); }
  }

  /* ---------- Barra de progreso de lectura ---------- */
  var bar = $('.scroll-progress');
  /* ---------- Parallax suave (blobs / formas) ---------- */
  var par = $$('.blob, .sh');
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
      if (!reduce) par.forEach(function (el, i) { el.style.translate = '0 ' + (y * (0.06 + i * 0.03)) + 'px'; });
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Resplandor que sigue al mouse en tarjetas ---------- */
  if (fine) {
    $$('[data-glow]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });

    /* ---------- Inclinación 3D del marco del video ---------- */
    $$('[data-tilt]').forEach(function (el) {
      var host = el.parentElement;
      host.addEventListener('pointermove', function (e) {
        var r = host.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateY(' + (x * 12) + 'deg) rotateX(' + (-y * 10) + 'deg)';
      });
      host.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });

    /* ---------- Botones magnéticos ---------- */
    $$('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.12) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.2) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- Pausar el video del inicio fuera de pantalla ---------- */
  var hv = $('.hero-video');
  if (hv && 'IntersectionObserver' in window) {
    if (reduce) { hv.removeAttribute('autoplay'); hv.pause(); hv.setAttribute('controls', ''); }
    else {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { var p = hv.play(); if (p && p.catch) p.catch(function () {}); } else { hv.pause(); } });
      }, { threshold: 0.2 }).observe(hv);
    }
  }
})();
