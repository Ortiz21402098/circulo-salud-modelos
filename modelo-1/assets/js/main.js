/* =========================================================
   Círculo Salud — comportamiento del sitio (sin dependencias)
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     CONFIGURACIÓN
     - whatsapp: número en formato internacional, sin + ni espacios.
     - turnosEndpoint: URL que recibe la solicitud de turno (POST, JSON).
       Hoy está vacío: el formulario solo arma el mensaje y abre WhatsApp.
       Cuando se agregue el backend PHP, poner por ejemplo 'api/turnos.php'
       y la solicitud se guardará antes de abrir WhatsApp.
     --------------------------------------------------------- */
  var CONFIG = {
    whatsapp: '5493512038991',
    turnosEndpoint: ''
  };

  var MOTIVOS = {
    odontologia: [
      'Primera consulta / control', 'Odontología general', 'Implantología', 'Prótesis dental',
      'Odontopediatría', 'Ortodoncia', 'Endodoncia', 'Periodoncia', 'Cirugía oral', 'Estética dental', 'Urgencia', 'Otro'
    ],
    kinesiologia: [
      'Primera consulta / evaluación', 'Lesión muscular o tendinosa', 'Esguince o lesión ligamentaria',
      'Fractura o rehabilitación postquirúrgica', 'Tendinitis o bursitis', 'Artrosis o afección articular',
      'Cervicalgia o lumbalgia', 'Lesión deportiva', 'Rigidez o limitación de movilidad', 'Otro'
    ]
  };
  var SERVICIO_LABEL = { odontologia: 'Odontología', kinesiologia: 'Kinesiología' };
  var FRANJA_LABEL = { manana: 'por la mañana', tarde: 'por la tarde', indistinto: 'cualquier horario' };

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

  /* ---------- Formulario de turnos ---------- */
  var form = $('#form-turno');
  if (form) {
    var servicioInputs = $$('input[name="servicio"]', form);
    var motivo = $('#motivo');
    var obra = $('#obra_social');
    var fecha = $('#fecha');
    var okBox = $('#turno-ok');
    var okLink = $('#turno-ok-link');

    // Fecha mínima: hoy
    var t = new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    fecha.min = t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate());

    function currentServicio() {
      var c = servicioInputs.filter(function (i) { return i.checked; })[0];
      return c ? c.value : '';
    }
    function fillMotivos() {
      var s = currentServicio();
      motivo.innerHTML = '';
      var first = document.createElement('option');
      first.value = ''; first.textContent = s ? 'Elegí una opción (opcional)' : 'Primero elegí el servicio';
      motivo.appendChild(first);
      (MOTIVOS[s] || []).forEach(function (m) {
        var o = document.createElement('option'); o.value = m; o.textContent = m; motivo.appendChild(o);
      });
      motivo.disabled = !s;
      obra.setAttribute('list', s ? 'os-' + s : 'os-odontologia');
    }
    servicioInputs.forEach(function (i) { i.addEventListener('change', fillMotivos); });
    fillMotivos();

    // Preselección desde la URL: turnos.html?servicio=kinesiologia
    var qs = new URLSearchParams(location.search);
    var pre = qs.get('servicio');
    if (pre && MOTIVOS[pre]) {
      servicioInputs.forEach(function (i) { i.checked = i.value === pre; });
      fillMotivos();
    }

    function setError(name, msg) {
      var field = form.querySelector('[data-field="' + name + '"]');
      if (!field) return;
      field.classList.toggle('has-error', !!msg);
      var e = $('.err', field);
      if (e) e.textContent = msg || '';
    }
    function clearErrors() { $$('[data-field]', form).forEach(function (f) { f.classList.remove('has-error'); var e = $('.err', f); if (e) e.textContent = ''; }); }

    function clean(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }

    function collect() {
      var fd = new FormData(form);
      return {
        nombre: clean(fd.get('nombre')),
        telefono: clean(fd.get('telefono')),
        dni: clean(fd.get('dni')).replace(/\D/g, ''),
        servicio: currentServicio(),
        motivo: clean(fd.get('motivo')),
        obra_social: clean(fd.get('obra_social')),
        nro_afiliado: clean(fd.get('nro_afiliado')),
        fecha_preferida: clean(fd.get('fecha')),
        franja: clean(fd.get('franja')) || 'indistinto',
        comentarios: clean(fd.get('comentarios')),
        consentimiento: !!fd.get('consentimiento'),
        origen: 'web',
        enviado_el: new Date().toISOString()
      };
    }

    function validate(d) {
      var ok = true, first = null;
      function bad(name, msg) { setError(name, msg); ok = false; if (!first) first = name; }
      if (d.nombre.length < 3 || d.nombre.indexOf(' ') === -1) bad('nombre', 'Escribí tu nombre y apellido.');
      if (d.telefono.replace(/\D/g, '').length < 8) bad('telefono', 'Ingresá un número de WhatsApp o teléfono válido.');
      if (d.dni && (d.dni.length < 7 || d.dni.length > 9)) bad('dni', 'El DNI debe tener entre 7 y 9 números.');
      if (!d.servicio) bad('servicio', 'Elegí Odontología o Kinesiología.');
      if (d.fecha_preferida) {
        var dt = new Date(d.fecha_preferida + 'T12:00:00');
        var dow = dt.getDay();
        if (dow === 0 || dow === 6) bad('fecha', 'Atendemos de lunes a viernes. Elegí un día hábil.');
        else if (d.fecha_preferida < fecha.min) bad('fecha', 'Elegí una fecha de hoy en adelante.');
      }
      if (!d.consentimiento) bad('consentimiento', 'Necesitamos tu conformidad para continuar.');
      if (first) {
        var el = form.querySelector('[data-field="' + first + '"]');
        var target = el && (el.querySelector('input,select,textarea') || el);
        if (target && target.focus) target.focus({ preventScroll: false });
      }
      return ok;
    }

    function ddmmyyyy(iso) { var p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }

    function buildMessage(d) {
      var l = ['Hola, quiero solicitar un turno en Círculo Salud.', ''];
      l.push('• Nombre: ' + d.nombre);
      l.push('• Servicio: ' + SERVICIO_LABEL[d.servicio] + (d.motivo ? ' (' + d.motivo + ')' : ''));
      l.push('• Obra social: ' + (d.obra_social || 'Particular / sin obra social') + (d.nro_afiliado ? ' — Afiliado ' + d.nro_afiliado : ''));
      if (d.fecha_preferida) l.push('• Día preferido: ' + ddmmyyyy(d.fecha_preferida) + ' (' + FRANJA_LABEL[d.franja] + ')');
      else l.push('• Horario preferido: ' + FRANJA_LABEL[d.franja]);
      if (d.comentarios) l.push('• Comentarios: ' + d.comentarios);
      return l.join('\n');
    }

    function postJSON(url, data) {
      var ctrl = 'AbortController' in window ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 5000) : null;
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: ctrl ? ctrl.signal : undefined
      }).finally(function () { if (timer) clearTimeout(timer); });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.website && form.website.value) return;          // antispam: campo trampa
      clearErrors();
      var data = collect();
      if (!validate(data)) return;

      var waUrl = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(buildMessage(data));
      var btn = $('button[type="submit"]', form);
      btn.disabled = true;

      var save = CONFIG.turnosEndpoint
        ? postJSON(CONFIG.turnosEndpoint, data).catch(function () { /* igual seguimos por WhatsApp */ })
        : Promise.resolve();

      save.then(function () {
        okLink.href = waUrl;
        form.classList.add('is-sent');
        okBox.classList.add('show');
        okBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(function () { window.location.href = waUrl; }, 1100);
      });
    });
  }
})();
