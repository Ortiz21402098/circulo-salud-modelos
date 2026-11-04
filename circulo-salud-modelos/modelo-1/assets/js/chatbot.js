/* =========================================================
   Círculo Salud — Asistente de turnos (chatbot)
   Funciona en el navegador, sin servidor ni IA: guía al paciente con
   preguntas cortas y, al final, abre WhatsApp con el mensaje ya escrito.
   Se abre desde cualquier elemento con el atributo  data-chat-open
   (ej.: el ícono de WhatsApp). Opcional: data-chat-service="odontologia".

   CONFIGURACIÓN
   - whatsapp: número en formato internacional, sin + ni espacios.
   - turnosEndpoint: URL que recibe la solicitud (POST, JSON). Hoy vacío:
     no se guarda nada y solo se abre WhatsApp. Con el backend PHP, poner
     por ejemplo 'api/turnos.php' y la solicitud se guardará antes de abrir WhatsApp.
   ========================================================= */
(function () {
  'use strict';

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
      'Cervicalgia o lumbalgia', 'Lesión deportiva', 'Rigidez o limitación de movilidad', 'Drenaje linfático manual', 'Otro'
    ]
  };
  var OBRAS = {"odontologia": ["Galeno", "Medifé", "Swiss Medical", "Prevención Salud", "Boreal", "Sancor Salud", "Avalian", "Omint", "Federada Salud", "Ostamma", "Medicus", "Caja de Abogados", "Agente de Propaganda Médica", "Ciencias Económicas"], "kinesiologia": ["Avalian", "AMICOS", "AMUR", "APROSS", "Banco de Córdoba", "Caja de Abogados", "Caja Notarial", "CPCE", "D.A.S.P.U.", "D.A.S.U.T.E.N.", "Federada Salud (25 de Junio)", "Gráficos – Personal de la Ind. Gráfica", "Gilsa SRL – Integral Salud", "Jerárquicos Salud", "ART La Holando", "A.R.T. La Segunda", "Luis Pasteur", "Madereros", "Medicus", "Medifé – Cobertura Médica", "Asoc. Escles. San Pedro", "OSETYA", "OSITAC", "OSPEDYC", "OSPEDYM", "OSPES", "OSSEG Seguros", "Prevención Salud", "ART Prevención", "SADAIC", "Sancor Seguros Íntegros", "Unimed", "Ensalud", "Boreal Cobertura de Salud S.A.", "OSMATA – Sanitas Salud", "OSDOP/SADOP – Servired", "OSADEF", "Ampara Salud", "OSPIL", "Griff Salud S.A.", "IOSFA", "Premedic", "TV Salud", "ART Provincia", "La Segunda Personas", "OSPÍA", "Poder Judicial", "Asoc. Arg. Mutual del Motociclista", "O.P.D.E.A.", "Sancor Salud", "RAS (Red Arg. Sanat)", "OSPECOR", "OSSOELSAC – Rerum Salud", "Luz y Fuerza (Regional LyF OSFATLyF – OSPLyF)", "Colonia Suiza", "ART Mutual Rural", "Grupo Roisa Docto Red"]};
  var SERVICIO_LABEL = { odontologia: 'Odontología', kinesiologia: 'Kinesiología' };
  var PROFESIONALES = {
    odontologia: ['Dra. Florencia Santolino', 'Dra. Lourdes Mercau', 'Dra. Agustina Llugdar'],
    kinesiologia: ['Lic. Karina Pavón']
  };
  var INDISTINTO = 'Indistinto (la primera disponible)';
  var DIAS = ['Lo antes posible', 'Esta semana', 'La semana próxima'];
  var FRANJAS = ['Por la mañana', 'Por la tarde', 'Cualquier horario'];
  var PARTICULAR = 'Particular / sin obra social';

  var doc = document;
  function norm(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); }
  function clean(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function waUrl(text) { return 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(text); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function ddmmyyyy(s) { var p = s.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }

  /* ---------------- estado ---------------- */
  var STEPS = ['servicio', 'profesional', 'motivo', 'os', 'dia', 'franja', 'nombre'];
  var state, panel, log, ctl, opener = null, isOpen = false, shown = 0, dateMode = false, sent = false;

  function reset(service) {
    state = { answers: {}, step: 0 };
    shown = 0; dateMode = false; sent = false;
    if (service && MOTIVOS[service]) { setServicio(service); }
  }

  // Al elegir servicio: en Kinesiología la profesional es una sola, se asigna y se salta la pregunta.
  function setServicio(v) {
    state.answers.servicio = v;
    if (PROFESIONALES[v].length === 1) { state.answers.profesional = PROFESIONALES[v][0]; state.step = STEPS.indexOf('motivo'); }
    else { state.step = STEPS.indexOf('profesional'); }
  }

  function ask(step) {
    var s = state.answers.servicio;
    switch (step) {
      case 'servicio': return '¿Para qué servicio querés el turno?';
      case 'profesional': return s === 'odontologia' ? '¿Con qué odontóloga querés atenderte?' : '';
      case 'motivo': return 'Perfecto, ' + SERVICIO_LABEL[s] + '. ¿Cuál es el motivo de la consulta?';
      case 'os': return '¿Tenés obra social o prepaga? Escribí el nombre para buscarla o elegí una opción.';
      case 'dia': return '¿Qué día te viene mejor? Atendemos de lunes a viernes.';
      case 'franja': return '¿En qué horario preferís? Atendemos de 8 a 20 hs.';
      case 'nombre': return 'Último paso: ¿cuál es tu nombre y apellido?';
    }
  }

  /* ---------------- mensaje de WhatsApp ---------------- */
  function buildMessage(a) {
    var l = ['Hola, quiero solicitar un turno en Círculo Salud.', ''];
    l.push('• Nombre: ' + a.nombre);
    l.push('• Servicio: ' + SERVICIO_LABEL[a.servicio] + (a.motivo && a.motivo !== 'Otro' ? ' (' + a.motivo + ')' : ''));
    l.push('• Profesional: ' + a.profesional);
    l.push('• Obra social: ' + a.os);
    l.push('• Día preferido: ' + a.dia);
    l.push('• Horario preferido: ' + a.franja.toLowerCase());
    return l.join('\n');
  }

  /* ---------------- DOM del panel ---------------- */
  function build() {
    panel = el('section', 'cb-panel');
    panel.id = 'cb-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Asistente de turnos de Círculo Salud');
    panel.hidden = true;

    var head = el('header', 'cb-head');
    var av = el('span', 'cb-avatar');
    av.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-5l-5 4v-4h-2a2 2 0 0 1 -2 -2v-8a2 2 0 0 1 2 -2"/><path d="M9.5 9.5v.01"/><path d="M14.5 9.5v.01"/><path d="M9.5 13c.667 .667 1.333 1 2.5 1s1.833 -.333 2.5 -1"/></svg>';
    var tt = el('div', 'cb-title');
    tt.appendChild(el('strong', null, 'Asistente de turnos'));
    tt.appendChild(el('span', null, 'Círculo Salud · te guío en un minuto'));
    var bRestart = el('button', 'cb-icbtn'); bRestart.type = 'button'; bRestart.setAttribute('aria-label', 'Empezar de nuevo');
    bRestart.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4"/><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"/></svg>';
    var bClose = el('button', 'cb-icbtn'); bClose.type = 'button'; bClose.setAttribute('aria-label', 'Cerrar el asistente');
    bClose.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6l-12 12"/><path d="M6 6l12 12"/></svg>';
    head.appendChild(av); head.appendChild(tt); head.appendChild(bRestart); head.appendChild(bClose);

    log = el('div', 'cb-log');
    log.setAttribute('role', 'log');
    log.setAttribute('aria-live', 'polite');
    ctl = el('div', 'cb-ctl');

    var foot = el('div', 'cb-foot');
    var fl = el('a', null, '¿Preferís escribir directo? Abrí WhatsApp');
    fl.href = waUrl('Hola, quiero hacer una consulta en Círculo Salud.');
    fl.target = '_blank'; fl.rel = 'noopener';
    foot.appendChild(fl);

    panel.appendChild(head); panel.appendChild(log); panel.appendChild(ctl); panel.appendChild(foot);
    doc.body.appendChild(panel);

    bClose.addEventListener('click', function () { close(true); });
    bRestart.addEventListener('click', function () { reset(); render(true); });
  }

  function bubble(who, node, animate) {
    var row = el('div', 'cb-row ' + who + (animate ? ' new' : ''));
    var b = el('div', 'cb-msg');
    if (typeof node === 'string') b.textContent = node; else b.appendChild(node);
    row.appendChild(b);
    log.appendChild(row);
  }

  function answerText(key) {
    var a = state.answers[key];
    return key === 'servicio' ? SERVICIO_LABEL[a] : a;
  }

  function summaryNode(a) {
    var box = el('div', 'cb-sum');
    box.appendChild(el('p', 'cb-sum-t', 'Revisá tu solicitud:'));
    var ul = el('ul');
    [['Nombre', a.nombre], ['Servicio', SERVICIO_LABEL[a.servicio] + (a.motivo && a.motivo !== 'Otro' ? ' · ' + a.motivo : '')], ['Profesional', a.profesional],
     ['Obra social', a.os], ['Día', a.dia], ['Horario', a.franja]].forEach(function (r) {
      var li = el('li'); li.appendChild(el('span', null, r[0])); li.appendChild(el('strong', null, r[1])); ul.appendChild(li);
    });
    box.appendChild(ul);
    return box;
  }

  /* ---------------- acciones ---------------- */
  function answer(key, value) {
    if (key === 'servicio') { setServicio(value); dateMode = false; render(true); return; }
    state.answers[key] = value;
    state.step = STEPS.indexOf(key) + 1;
    dateMode = false;
    render(true);
  }
  function back() {
    if (sent) return;
    if (dateMode) { dateMode = false; render(false); return; }
    if (state.step <= 0) return;
    state.step--;
    if (STEPS[state.step] === 'profesional' && state.answers.servicio && PROFESIONALES[state.answers.servicio].length === 1) {
      delete state.answers.profesional; state.step--;       // paso automático: volver al servicio
    }
    delete state.answers[STEPS[state.step]];
    render(false);
  }

  function chip(label, fn, cls) {
    var b = el('button', 'cb-chip' + (cls ? ' ' + cls : ''), label);
    b.type = 'button';
    b.addEventListener('click', fn);
    return b;
  }
  function backChip() { return chip('← Volver', back, 'ghost'); }

  function textForm(opts) {
    var f = el('form', 'cb-form');
    f.noValidate = true;
    var inp = el('input');
    inp.type = opts.type || 'text';
    inp.placeholder = opts.placeholder || '';
    inp.maxLength = opts.max || 120;
    inp.autocomplete = opts.autocomplete || 'off';
    inp.setAttribute('aria-label', opts.label);
    if (opts.min) inp.min = opts.min;
    var go = el('button', 'cb-send'); go.type = 'submit'; go.setAttribute('aria-label', 'Enviar');
    go.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14l11 -11"/><path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5"/></svg>';
    var err = el('p', 'cb-err'); err.setAttribute('role', 'alert');
    f.appendChild(inp); f.appendChild(go);
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = opts.onSubmit(clean(inp.value));
      if (msg) { err.textContent = msg; inp.focus(); }
    });
    if (opts.onInput) inp.addEventListener('input', function () { err.textContent = ''; opts.onInput(inp.value); });
    return { form: f, input: inp, err: err };
  }

  function controls() {
    ctl.innerHTML = '';
    var a = state.answers, wrap, focusEl = null;

    if (state.step >= STEPS.length) {              // resumen
      wrap = el('div', 'cb-chips');
      var go = el('button', 'cb-chip wa', 'Continuar en WhatsApp');
      go.type = 'button';
      go.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9"/><path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1"/></svg><span>Continuar en WhatsApp</span>';
      go.addEventListener('click', function () { finish(); });
      wrap.appendChild(go);
      wrap.appendChild(chip('Empezar de nuevo', function () { reset(); render(true); }, 'ghost'));
      ctl.appendChild(wrap);
      var legal = el('p', 'cb-legal');
      legal.innerHTML = 'Al continuar se abre WhatsApp con este mensaje y lo enviás vos. Tu turno queda sujeto a confirmación. <a href="privacidad.html" target="_blank" rel="noopener">Política de privacidad</a>.';
      ctl.appendChild(legal);
      focusEl = go;
    } else {
      var step = STEPS[state.step];
      if (step === 'servicio') {
        wrap = el('div', 'cb-chips');
        wrap.appendChild(chip('Odontología', function () { answer('servicio', 'odontologia'); }));
        wrap.appendChild(chip('Kinesiología', function () { answer('servicio', 'kinesiologia'); }));
        var other = chip('Otra consulta', function () { openWa('Hola, quiero hacer una consulta en Círculo Salud.'); }, 'ghost');
        wrap.appendChild(other);
        ctl.appendChild(wrap);
        focusEl = wrap.firstChild;
      } else if (step === 'profesional') {
        wrap = el('div', 'cb-chips');
        PROFESIONALES[a.servicio].forEach(function (n) { wrap.appendChild(chip(n, function () { answer('profesional', n); })); });
        wrap.appendChild(chip('Me es indistinto', function () { answer('profesional', INDISTINTO); }, 'ghost'));
        wrap.appendChild(backChip());
        ctl.appendChild(wrap);
        focusEl = wrap.firstChild;
      } else if (step === 'motivo') {
        wrap = el('div', 'cb-chips scroll');
        MOTIVOS[a.servicio].forEach(function (m) { wrap.appendChild(chip(m, function () { answer('motivo', m); })); });
        wrap.appendChild(backChip());
        ctl.appendChild(wrap);
        focusEl = wrap.firstChild;
      } else if (step === 'os') {
        var sug = el('div', 'cb-chips');
        var t = textForm({
          label: 'Obra social', placeholder: 'Escribí tu obra social…', max: 80,
          onSubmit: function (v) { if (!v) return 'Escribí el nombre o elegí una opción.'; answer('os', v); },
          onInput: function (v) { paintSug(v); }
        });
        function paintSug(v) {
          sug.innerHTML = '';
          var q = norm(v);
          if (!q) {
            sug.appendChild(chip('Particular', function () { answer('os', PARTICULAR); }));
            sug.appendChild(chip('No sé / lo consulto', function () { answer('os', 'A consultar'); }));
            sug.appendChild(backChip());
            return;
          }
          var found = OBRAS[a.servicio].filter(function (n) { return norm(n).indexOf(q) !== -1; }).slice(0, 5);
          found.forEach(function (n) { sug.appendChild(chip(n, function () { answer('os', n); })); });
          if (!found.length) sug.appendChild(el('p', 'cb-hint', 'No la encontramos en la lista; igual podés enviarla y te confirmamos la cobertura.'));
        }
        paintSug('');
        ctl.appendChild(sug); ctl.appendChild(t.form); ctl.appendChild(t.err);
        focusEl = t.input;
      } else if (step === 'dia') {
        if (!dateMode) {
          wrap = el('div', 'cb-chips');
          DIAS.forEach(function (d) { wrap.appendChild(chip(d, function () { answer('dia', d); })); });
          wrap.appendChild(chip('Elegir una fecha', function () { dateMode = true; render(false); }));
          wrap.appendChild(backChip());
          ctl.appendChild(wrap);
          focusEl = wrap.firstChild;
        } else {
          var min = iso(new Date());
          var t2 = textForm({
            type: 'date', label: 'Fecha preferida', min: min,
            onSubmit: function (v) {
              if (!v) return 'Elegí una fecha.';
              if (v < min) return 'Elegí una fecha de hoy en adelante.';
              var dow = new Date(v + 'T12:00:00').getDay();
              if (dow === 0 || dow === 6) return 'Atendemos de lunes a viernes. Elegí un día hábil.';
              answer('dia', ddmmyyyy(v));
            }
          });
          ctl.appendChild(el('p', 'cb-hint', 'Elegí el día que te viene mejor (lunes a viernes).'));
          ctl.appendChild(t2.form); ctl.appendChild(t2.err);
          var w2 = el('div', 'cb-chips'); w2.appendChild(backChip()); ctl.appendChild(w2);
          focusEl = t2.input;
        }
      } else if (step === 'franja') {
        wrap = el('div', 'cb-chips');
        FRANJAS.forEach(function (f) { wrap.appendChild(chip(f, function () { answer('franja', f); })); });
        wrap.appendChild(backChip());
        ctl.appendChild(wrap);
        focusEl = wrap.firstChild;
      } else if (step === 'nombre') {
        var t3 = textForm({
          label: 'Nombre y apellido', placeholder: 'Nombre y apellido', max: 80, autocomplete: 'name',
          onSubmit: function (v) {
            if (v.length < 3 || v.indexOf(' ') === -1) return 'Escribí tu nombre y apellido.';
            answer('nombre', v);
          }
        });
        ctl.appendChild(t3.form); ctl.appendChild(t3.err);
        var w3 = el('div', 'cb-chips'); w3.appendChild(backChip()); ctl.appendChild(w3);
        focusEl = t3.input;
      }
    }
    return focusEl;
  }

  /* ---------------- render ---------------- */
  function render(animate) {
    log.innerHTML = '';
    var a = state.answers;
    bubble('bot', '¡Hola! Soy el asistente de Círculo Salud. Te ayudo a preparar tu turno y lo confirmás por WhatsApp con una persona del equipo.', false);
    var limit = Math.min(state.step, STEPS.length);
    for (var i = 0; i < limit; i++) {
      var k = STEPS[i];
      if (!(k in a) && k !== 'servicio') continue;
      var isNew = animate && i >= shown;
      if (k === 'profesional' && PROFESIONALES[a.servicio].length === 1) {
        bubble('bot', 'En ' + SERVICIO_LABEL[a.servicio] + ' te atiende la ' + a.profesional + '.', isNew);
        continue;
      }
      bubble('bot', ask(k), isNew);
      bubble('user', answerText(k), isNew);
    }
    if (state.step >= STEPS.length) {
      bubble('bot', '¡Genial, ' + a.nombre.split(' ')[0] + '! Con estos datos armé tu solicitud.', animate);
      bubble('bot', summaryNode(a), animate);
    } else {
      bubble('bot', ask(STEPS[state.step]), animate);
    }
    shown = limit;
    var f = controls();
    log.scrollTop = log.scrollHeight;
    if (f && isOpen && f.focus) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } }
  }

  /* ---------------- salida a WhatsApp ---------------- */
  function openWa(text) {
    var url = waUrl(text);
    var w = window.open(url, '_blank');
    if (w) { try { w.opener = null; } catch (e) { /* nada */ } } else { window.location.href = url; }
    return url;
  }

  function finish() {
    var a = state.answers;
    var msg = buildMessage(a);
    var url = openWa(msg);
    sent = true;
    if (CONFIG.turnosEndpoint && window.fetch) {
      try {
        fetch(CONFIG.turnosEndpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
          body: JSON.stringify({
            nombre: a.nombre, servicio: a.servicio, motivo: a.motivo, obra_social: a.os,
            fecha_preferida: a.dia, franja: a.franja, consentimiento: true, origen: 'web', enviado_el: new Date().toISOString()
          })
        }).catch(function () { /* igual seguimos por WhatsApp */ });
      } catch (e) { /* nada */ }
    }
    var d = el('div');
    d.appendChild(el('p', null, 'Listo. Enviá el mensaje en WhatsApp y una persona del equipo te confirma día y horario.'));
    var l = el('a', 'cb-link', 'Si no se abrió WhatsApp, tocá acá');
    l.href = url; l.target = '_blank'; l.rel = 'noopener';
    d.appendChild(l);
    bubble('bot', d, true);
    ctl.innerHTML = '';
    var w = el('div', 'cb-chips');
    w.appendChild(chip('Pedir otro turno', function () { reset(); render(true); }, 'ghost'));
    ctl.appendChild(w);
    log.scrollTop = log.scrollHeight;
  }

  /* ---------------- abrir / cerrar ---------------- */
  function open(service, from) {
    if (!panel) build();
    if (from) opener = from;
    if (!isOpen || service) {
      if (!state || sent || (service && MOTIVOS[service] && state.answers.servicio !== service)) reset(service);
    }
    panel.hidden = false;
    void panel.offsetWidth;
    panel.classList.add('is-open');
    isOpen = true;
    setPressed(true);
    render(false);
  }
  function close(returnFocus) {
    if (!panel || !isOpen) return;
    panel.classList.remove('is-open');
    panel.hidden = true;
    isOpen = false;
    setPressed(false);
    if (returnFocus && opener && opener.focus) opener.focus();
  }
  function setPressed(v) {
    var n = doc.querySelectorAll('[data-chat-open]');
    for (var i = 0; i < n.length; i++) n[i].setAttribute('aria-expanded', v ? 'true' : 'false');
  }

  /* ---------------- eventos globales ---------------- */
  doc.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-chat-open]') : null;
    if (!t) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;   // permitir abrir el enlace aparte
    e.preventDefault();
    if (isOpen && !t.getAttribute('data-chat-service')) { close(true); return; }
    open(t.getAttribute('data-chat-service'), t);
  });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen) close(true); });

  if (location.hash === '#turno') open();
})();
