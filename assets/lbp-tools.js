/* =====================================================================
   lbp-tools.js — habille un outil de la toolbox avec la DA de Bavure.
   À charger EN SYNCHRONE dans le <head> (pas de defer/async), avant les
   scripts de l'outil :   <script src="/assets/lbp-tools.js"></script>
   gate.js le charge aussi automatiquement pour les pages /tools/.
   ===================================================================== */
(function () {
  'use strict';
  if (window.__lbpTools) return;
  window.__lbpTools = true;

  var file = (location.pathname.split('/').pop() || '').replace(/\.html?$/i, '').toLowerCase();
  // Nom de fichier → identifiant de skin + titre d'onglet
  var TOOLS = {
    'typo': ['typo', 'atelier typo'],
    'relief1': ['relief1', 'relief'],
    'pixascii': ['pixascii', 'trame'],
    'feuillete': ['feuillete', 'feuilleté'],
    'perspemock': ['perspemock', 'perspective'],
    'padc': ['padc', 'découpe'],
    'motion-logo': ['motion-logo', 'tracé'],
    'motion-studio': ['motion-studio', 'motion studio'],
    'embossage': ['embossage', 'embossage'],
    'imposition': ['imposition', 'imposition'],
    'rendu': ['rendu', 'studio rendu'],
    'stickers': ['stickers', 'perspective 3d'],
    'raster': ['raster', 'atelier raster']
  };
  if (file === 'bavure') return;                 // déjà dans la DA
  var t = TOOLS[file] || (/\/tools\//.test(location.pathname) ? ['generic', null] : null);
  if (!t) return;

  var root = document.documentElement;
  root.setAttribute('data-lbp', t[0]);
  root.setAttribute('data-theme', 'light');      // coupe les thèmes sombres des outils
  if (t[1]) document.title = 'lbp — ' + t[1];

  // Styles en document.write : ils bloquent les scripts de l'outil le temps de charger,
  // donc les couleurs lues en JS (timeline, vignettes) sont déjà celles de la DA.
  document.write(
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Piazzolla:ital@0;1&display=swap">' +
    '<link rel="stylesheet" href="/assets/lbp-tools.css?v=3">'
  );
  if (!document.querySelector('link[rel~=icon]')) {
    document.write('<link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" href="/favicon.svg" type="image/svg+xml">');
  }

  /* ── Couleurs dessinées dans les canvas (impossibles à atteindre en CSS) ── */
  if (t[0] === 'perspemock') {
    // fond de scène sombre → transparent (laisse voir le damier), repères recolorés
    var MAP = {
      '#5b6cff': '#2A3DFF', 'rgba(91,108,255,.7)': 'rgba(42,61,255,.7)',
      'rgba(255,255,255,.35)': 'rgba(15,15,15,.3)', 'rgba(255,255,255,.45)': 'rgba(15,15,15,.45)',
      '#ebe8e2': '#0f0f0f', '#d9d8d4': '#fdfdfd', '#c4c3bf': '#efefef'
    };
    var origGet = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type) {
      var ctx = origGet.apply(this, arguments);
      if (type !== '2d' || !ctx || ctx.__lbp || !(this.id === 'view' || (this.width === 16 && this.height === 16))) return ctx;
      ctx.__lbp = true;
      var P = CanvasRenderingContext2D.prototype;
      var fd = Object.getOwnPropertyDescriptor(P, 'fillStyle'), sd = Object.getOwnPropertyDescriptor(P, 'strokeStyle');
      var clearNext = false;
      Object.defineProperty(ctx, 'fillStyle', {
        get: function () { return fd.get.call(this); },
        set: function (v) { clearNext = v === '#242528'; fd.set.call(this, typeof v === 'string' && MAP[v] ? MAP[v] : v); }
      });
      Object.defineProperty(ctx, 'strokeStyle', {
        get: function () { return sd.get.call(this); },
        set: function (v) { sd.set.call(this, typeof v === 'string' && MAP[v] ? MAP[v] : v); }
      });
      var fr = P.fillRect;
      ctx.fillRect = function (x, y, w, h) { if (clearNext) { clearNext = false; return this.clearRect(x, y, w, h); } return fr.call(this, x, y, w, h); };
      return ctx;
    };
  }
  if ((t[0] === 'relief1' || t[0] === 'embossage') && window.WebGLRenderingContext) {
    // fond gris de la vue 3D → gris cadre de la DA (#c9c9c9)
    var cc = WebGLRenderingContext.prototype.clearColor;
    WebGLRenderingContext.prototype.clearColor = function (r, g, b, a) {
      if (Math.abs(r - 0.553) < 0.01 || Math.abs(r - 0.145) < 0.01) { r = g = b = 0.788; }
      return cc.call(this, r, g, b, a);
    };
  }

  /* ── Lien retour, curseur main et anneau pointillé ── */
  var base = /\/tools\//.test(location.pathname) ? '../' : '';
  function ready() {
    // ancien bouton « ← Toolbox » noir
    var old = document.querySelectorAll('a[aria-label="Retour toolbox"]');
    for (var i = 0; i < old.length; i++) old[i].remove();

    var back = document.createElement('a');
    back.className = 'lbp-back';
    back.href = base + 'toolbox.html';
    back.textContent = '← toolbox';
    back.setAttribute('data-umami-event', 'retour-toolbox');
    var host = document.querySelector('header.top, header.topbar, #top, body > header, #panel > header, .app > header, body > .app > header, aside > .brand');
    if (host) host.insertBefore(back, host.firstChild);
    else { back.classList.add('lbp-float'); document.body.appendChild(back); }

    if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    // la page mot de passe (gate.js) a son propre curseur : on attend qu'elle se ferme
    (function wait() { if (document.getElementById('lbp-gate')) setTimeout(wait, 250); else cursor(); })();
  }
  function cursor() {
    var cur = document.createElement('img');
    cur.id = 'lbp-cursor'; cur.alt = ''; cur.width = 32; cur.height = 30; cur.setAttribute('aria-hidden', 'true');
    cur.onload = function () { root.classList.add('lbp-cc'); };
    cur.onerror = function () { cur.remove(); };
    cur.src = '/assets/curseur-main.png';
    var NS = 'http://www.w3.org/2000/svg';
    var ring = document.createElementNS(NS, 'svg'); ring.id = 'lbp-ring'; ring.setAttribute('aria-hidden', 'true');
    var rb = document.createElementNS(NS, 'rect'), rw = document.createElementNS(NS, 'rect');
    rb.setAttribute('class', 'rb'); rw.setAttribute('class', 'rw'); ring.appendChild(rb); ring.appendChild(rw);
    document.body.appendChild(ring); document.body.appendChild(cur);

    // Les fenêtres modales (<dialog>) passent dans la « couche du dessus » du navigateur,
    // au-dessus de tout z-index : curseur et anneau y vont aussi (popover), et y reviennent
    // à chaque ouverture de fenêtre pour rester devant.
    var canPop = typeof cur.showPopover === 'function';
    function front() {
      if (!canPop) return;
      [ring, cur].forEach(function (el) {
        try { if (el.matches(':popover-open')) el.hidePopover(); el.showPopover(); } catch (e) {}
      });
    }
    if (canPop) {
      ring.setAttribute('popover', 'manual'); cur.setAttribute('popover', 'manual');
      front();
      new MutationObserver(function (list) {
        for (var i = 0; i < list.length; i++) if (list[i].target.tagName === 'DIALOG') { setTimeout(front, 0); return; }
      }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });
    } else {
      // navigateur sans popover : curseur natif dans les fenêtres modales
      document.addEventListener('mouseover', function (e) {
        if (e.target.closest && e.target.closest('dialog[open]')) root.classList.add('lbp-native');
      });
    }

    // Sur les zones de travail (canvas, champs texte), l'outil garde son propre curseur
    var NATIVE = 'canvas, textarea, input[type=text], input[type=number], input[type=email], input:not([type]), [contenteditable], .curve, .bez, #lbp-gate';
    var TARGET = '[data-ants], a, button, .btn, label.check, select';
    var mx = -100, my = -100, fx = -100, fy = -100, target = null;
    document.addEventListener('mousemove', function (e) {
      root.classList.add('lbp-on');
      mx = e.clientX; my = e.clientY;
      cur.style.left = mx + 'px'; cur.style.top = my + 'px';
    }, { passive: true });
    document.addEventListener('mouseover', function (e) {
      var el = e.target && e.target.closest ? e.target : null;
      var nat = el && el.closest(NATIVE);
      root.classList.toggle('lbp-native', !!nat);
      target = nat ? null : (el && el.closest(TARGET));
    });
    document.documentElement.addEventListener('mouseleave', function () { root.classList.remove('lbp-on'); target = null; });
    var PAD = 6, REST = 26, st = { x: -100, y: -100, w: REST, h: REST, r: REST / 2, o: .55 };
    (function frame() {
      fx += (mx - fx) * .11; fy += (my - fy) * .11;
      var g, k, native = root.classList.contains('lbp-native') || !root.classList.contains('lbp-on');
      if (target && target.isConnected) {
        var b = target.getBoundingClientRect();
        g = { x: b.left - PAD, y: b.top - PAD, w: b.width + PAD * 2, h: b.height + PAD * 2, r: 0, o: 1 }; k = .28;
      } else { g = { x: fx - REST / 2, y: fy - REST / 2, w: REST, h: REST, r: REST / 2, o: native ? 0 : .55 }; k = .22; }
      for (var p in g) st[p] += (g[p] - st[p]) * k;
      var w = Math.max(st.w, 0), h = Math.max(st.h, 0), r = Math.min(Math.max(st.r, 0), w / 2, h / 2);
      [rb, rw].forEach(function (el) { el.setAttribute('x', st.x + .5); el.setAttribute('y', st.y + .5); el.setAttribute('width', w); el.setAttribute('height', h); el.setAttribute('rx', r); });
      ring.style.opacity = st.o < .01 ? 0 : st.o;
      requestAnimationFrame(frame);
    })();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
