// gate.js — page d'accès à la toolbox (digicode + demande du code par e-mail)
// Protection côté navigateur : filtre les visiteurs, PAS sécurisé à 100 %.
// À inclure dans le <head> de la toolbox ET de chaque outil (après analytics.js) :
//   toolbox.html (racine) : <script src="gate.js"></script>
//   tools/*.html          : <script src="../gate.js"></script>
(function () {
  // ── Réglages ────────────────────────────────────────────────
  // Nombre de chiffres du digicode
  var DIGITS = 6;

  // SHA-256 du code. Pour en changer : ouvrir la console du navigateur et lancer
  // crypto.subtle.digest('SHA-256', new TextEncoder().encode('123456')).then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('')))
  // Code actuel : 000000 (donné à la fin de mentions-legales.html)
  var HASH = '91b4d142823f7d20c5f08df69122de43f35f057a988d9619f6d3138485c9a203';

  // Anti-acharnement : après MAX_TRIES erreurs, clavier bloqué LOCK_S secondes
  var MAX_TRIES = 5, LOCK_S = 30;

  // URL du formulaire Brevo (Formulaires → Partager → code HTML → valeur de action="…").
  // Vide = le bloc « Recevoir le code » est masqué.
  var BREVO_FORM_URL = 'https://a9eb6ac0.sibforms.com/serve/MUIFABXKavQp-5DX5iZ5M-n5NUIt40zY0Vd-9EXR2gVBWB6PgVoIE6giRvxXljMsvq3tkrlYK7IW2YSKlFzjRpYhQSw-SD4MIgsiq7rG8Lv_thWSwpE8Sb-eDYO1fJ6u5wL0tfYJQX3rIbBsnnubjzbZIjtWLq6q2aBdzzIau0b8yvs1mm9x2hb2crYO0Ir_zgGqg3vdREDeRagd0Q==';

  // Message affiché après l'envoi (à adapter si le double opt-in est désactivé dans Brevo)
  var MSG_SENT = 'Envoyé. Regardez votre boîte mail (et les spams)&nbsp;: le code arrive.';
  // ────────────────────────────────────────────────────────────

  var KEY = 'toolbox_ok';
  function unlocked() {
    try { return sessionStorage.getItem(KEY) === HASH; } catch (e) { return false; }
  }
  if (unlocked()) return;

  // Racine du site, déduite de l'emplacement de gate.js (marche depuis /tools/ aussi)
  var me = document.currentScript;
  var BASE = me && me.src ? me.src.replace(/gate\.js(\?.*)?$/, '') : '';

  function track(name, data) { try { if (window.lbpTrack) window.lbpTrack(name, data); } catch (e) {} }

  document.documentElement.style.visibility = 'hidden';

  var font = document.createElement('link');
  font.rel = 'stylesheet';
  font.href = 'https://fonts.googleapis.com/css2?family=Piazzolla:ital,wght@0,400;1,400&display=swap';
  document.head.appendChild(font);
  var allo = document.createElement('style');           // Allo (titres, chiffres) : chargé ici aussi, pour les pages d'outils
  allo.textContent = '@font-face{font-family:"Allo";src:url("' + BASE + 'assets/fonts/AlloVariable.woff2") format("woff2");font-weight:100 900;font-style:normal;font-display:swap}';
  document.head.appendChild(allo);

  var ALLO = 'font-family:"Allo","Piazzolla",sans-serif;font-variation-settings:"ROND" 20;';
  var css = document.createElement('style');
  css.textContent = [
    '#lbp-gate{--g-a:#fdfdfd;--g-b:#efefef;--g-ink:#0f0f0f;--g-blue:#2A3DFF;--g-line:rgba(15,15,15,.18);--g-ease:cubic-bezier(.77,0,.175,1);--g-out:cubic-bezier(.23,1,.32,1);--g-ant:4px;--g-ant-s:.4s;',
    'position:fixed;inset:0;z-index:2147483000;overflow-y:auto;color-scheme:light;color:var(--g-ink);-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent;',
    "background-color:var(--g-a);background-image:url('" + BASE + "assets/trame.svg?v=3'),conic-gradient(var(--g-b) 25%,var(--g-a) 0 50%,var(--g-b) 0 75%,var(--g-a) 0);",
    'background-size:1440px auto,22px 22px;background-position:-30px -20px,0 0;background-repeat:repeat,repeat}',
    '#lbp-gate,#lbp-gate *{box-sizing:border-box;margin:0;padding:0;font-family:"Piazzolla",serif;font-weight:400;letter-spacing:normal;text-transform:none;line-height:normal}',
    '#lbp-gate ::selection{background:var(--g-blue);color:#fff}',
    '@media (hover:hover) and (pointer:fine){#lbp-gate.g-cc,#lbp-gate.g-cc a,#lbp-gate.g-cc button,#lbp-gate.g-cc input,#lbp-gate.g-cc label{cursor:none}}',
    '#lbp-gate .g-in{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:4.5rem 16px 2.5rem}',
    '#lbp-gate .g-small{font-style:italic;font-size:clamp(.86rem,1.15vw,.98rem);letter-spacing:.01em}',
    '#lbp-gate .g-label{opacity:0;transform:translateY(6px);animation:g-up .6s ease forwards .2s}',
    '#lbp-gate .g-tw{overflow:hidden;margin:.7rem 0 1.6rem;padding:0 .1em}',
    '#lbp-gate .g-title{display:inline-block;' + ALLO + 'font-weight:700;font-optical-sizing:auto;font-size:clamp(2.6rem,6.5vw,4.5rem);letter-spacing:-.035em;line-height:1;clip-path:inset(0 100% 0 0);animation:g-wipe .9s var(--g-ease) forwards .5s}',
    '#lbp-gate .g-forms{width:100%;max-width:360px;opacity:0;transform:translateY(8px);animation:g-up .6s ease forwards 1s}',
    '#lbp-gate .g-view{display:flex;flex-direction:column;align-items:center;gap:.9rem}',
    '#lbp-gate .g-view[hidden]{display:none}',
    '#lbp-gate .g-view.g-show{animation:g-up .35s ease both;opacity:0;transform:translateY(6px)}',

    // ── digicode : cases
    '#lbp-gate .g-slots{display:flex;gap:8px;justify-content:center}',
    '#lbp-gate .g-slot{position:relative;width:40px;height:52px;border-radius:3px;background:rgba(253,253,253,.85);box-shadow:inset 0 0 0 1px var(--g-line);display:grid;place-items:center;transition:background-color .2s ease,box-shadow .2s ease}',
    '#lbp-gate .g-slot i{width:10px;height:10px;border-radius:50%;background:var(--g-ink);transform:scale(0);transition:transform .22s var(--g-out),background-color .2s ease}',
    '#lbp-gate .g-slot.g-on i{transform:scale(1)}',
    '#lbp-gate .g-slot svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;opacity:0;transition:opacity .15s ease}',
    '#lbp-gate .g-slot rect{fill:none;stroke-width:1;stroke-dasharray:var(--g-ant) var(--g-ant)}',
    '#lbp-gate .g-slot .rb{stroke:#0f0f0f;animation:g-march var(--g-ant-s) linear infinite}',
    '#lbp-gate .g-slot .rw{stroke:#fff;stroke-dashoffset:var(--g-ant);animation:g-march-w var(--g-ant-s) linear infinite}',
    '#lbp-gate .g-slot.g-cur-slot{box-shadow:none}',
    '#lbp-gate .g-slot.g-cur-slot svg{opacity:1}',
    '#lbp-gate .g-slots.g-ok .g-slot{background:var(--g-blue);box-shadow:inset 0 0 0 1px var(--g-blue)}',
    '#lbp-gate .g-slots.g-ok .g-slot i{background:#fff}',

    // ── digicode : clavier
    '#lbp-gate .g-pad{display:grid;grid-template-columns:repeat(3,64px);gap:10px;justify-content:center;margin-top:.3rem}',
    '#lbp-gate .g-k{' + ALLO + 'font-weight:700;font-size:26px;letter-spacing:-.02em;line-height:1;height:64px;border:0;border-radius:3px;background:var(--g-a);color:var(--g-blue);box-shadow:inset 0 0 0 1.5px var(--g-blue);display:grid;place-items:center;transform:scale(var(--s,1));transition:transform .3s var(--g-out),background-color .15s ease,color .15s ease;touch-action:manipulation;user-select:none;-webkit-user-select:none}',
    '@media (hover:hover){#lbp-gate .g-k:hover{--s:1.06}}',
    '#lbp-gate .g-k:active,#lbp-gate .g-k.g-press{background:var(--g-blue);color:#fff;--s:.96;transition-duration:.08s}',
    '#lbp-gate .g-k:focus-visible{outline:1px solid var(--g-ink);outline-offset:3px}',
    '#lbp-gate .g-k svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}',
    '#lbp-gate .g-k.g-0{grid-column:2}',
    '#lbp-gate .g-pad.g-lock .g-k{opacity:.3;pointer-events:none}',

    '#lbp-gate .g-msg{min-height:1.3em;font-size:.95rem;font-style:italic}',
    '#lbp-gate .g-msg:empty{min-height:0;margin-top:-.9rem}',
    '#lbp-gate .g-shake{animation:g-shake .4s ease}',

    // ── demande par e-mail
    '#lbp-gate .g-row{position:relative;width:100%;border-bottom:1px solid rgba(15,15,15,.28);display:flex;align-items:center;gap:8px}',
    '#lbp-gate .g-row::after{content:"";position:absolute;left:50%;bottom:-1px;width:0;height:1px;background:var(--g-blue);transition:width .4s var(--g-ease),left .4s var(--g-ease)}',
    '#lbp-gate .g-row:focus-within::after{left:0;width:100%}',
    '#lbp-gate input[type=email]{-webkit-appearance:none;appearance:none;display:block;flex:1;min-width:0;background:transparent;border:0;border-radius:0;outline:0;box-shadow:none;color:var(--g-ink);font-size:1.2rem;text-align:left;padding:.3em 0 .3em}',
    '#lbp-gate input::placeholder{color:var(--g-ink);opacity:.3;font-style:italic}',
    '#lbp-gate .g-btn{' + ALLO + 'font-weight:700;font-size:14px;letter-spacing:-.01em;line-height:1;flex:none;background:var(--g-blue);color:#fff;border:0;border-radius:3px;padding:.52em .62em .56em;margin-bottom:6px;box-shadow:inset 0 0 0 1.5px var(--g-blue);transform:scale(var(--s,1));transition:transform .3s var(--g-out),opacity .2s ease}',
    '#lbp-gate .g-btn:hover,#lbp-gate .g-btn:focus-visible{--s:1.08}',
    '#lbp-gate .g-btn:focus-visible{outline:1px solid var(--g-ink);outline-offset:3px}',
    '#lbp-gate .g-btn[disabled]{opacity:.35}',
    '#lbp-gate .g-consent{display:flex;gap:.6em;align-items:flex-start;text-align:left;font-size:.85rem;line-height:1.3;opacity:.7}',
    '#lbp-gate .g-consent a{color:inherit;text-decoration:none;background:linear-gradient(var(--g-blue),var(--g-blue)) 0 100%/100% 1px no-repeat;transition:background-size .25s var(--g-out),color .15s ease}',
    '#lbp-gate .g-consent a:hover,#lbp-gate .g-consent a:focus-visible{background-size:100% 100%;color:#fff;outline:0}',
    '#lbp-gate input[type=checkbox]{-webkit-appearance:none;appearance:none;flex:none;width:14px;height:14px;margin-top:.1em;border-radius:3px;background:var(--g-a);box-shadow:inset 0 0 0 1.5px var(--g-blue);display:grid;place-content:center;transition:background-color .15s ease}',
    '#lbp-gate input[type=checkbox]::before{content:"";width:7px;height:4px;border:solid #fff;border-width:0 0 1.6px 1.6px;transform:translateY(-1px) rotate(-45deg) scale(0);transition:transform .2s var(--g-out)}',
    '#lbp-gate input[type=checkbox]:checked{background:var(--g-blue)}',
    '#lbp-gate input[type=checkbox]:checked::before{transform:translateY(-1px) rotate(-45deg) scale(1)}',
    '#lbp-gate input[type=checkbox]:focus-visible{outline:1px solid var(--g-ink);outline-offset:3px}',
    '#lbp-gate .g-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}',

    // ── liens : surlignage bleu (pas de soulignement)
    '#lbp-gate .g-sw,#lbp-gate .g-back{position:relative;border:0;color:var(--g-ink);text-decoration:none;font-style:italic;font-size:clamp(.86rem,1.15vw,.98rem);letter-spacing:.01em;padding:.15em .35em;margin-inline:-.35em;background:linear-gradient(var(--g-blue),var(--g-blue)) 0 50%/0% 100% no-repeat;transition:background-size .25s var(--g-out),color .15s ease,opacity .25s ease}',
    '#lbp-gate .g-sw{opacity:.55;margin-top:.3rem}',
    '#lbp-gate .g-sw:hover,#lbp-gate .g-sw:focus-visible,#lbp-gate .g-back:hover,#lbp-gate .g-back:focus-visible{background-size:100% 100%;color:#fff;opacity:1;outline:0}',
    '#lbp-gate .g-back{position:fixed;top:clamp(1rem,2.5vw,1.8rem);right:clamp(1rem,2.5vw,1.8rem);z-index:2;opacity:0;transform:translateY(6px);animation:g-up .5s ease forwards 1.2s}',

    // ── curseur main + anneau pointillé (comme la toolbox)
    '#lbp-gate .g-cur{position:fixed;top:0;left:0;width:32px;height:auto;pointer-events:none;z-index:9999;transform:translate(-5px,-1px);opacity:0;transition:opacity .2s}',
    '#lbp-gate.g-has .g-cur{opacity:1}',
    '#lbp-gate .g-ring{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9998;overflow:visible}',
    '#lbp-gate:not(.g-cc) .g-ring{display:none}',
    '#lbp-gate .g-ring rect{fill:none;stroke-width:1;stroke-dasharray:var(--g-ant) var(--g-ant)}',
    '#lbp-gate .g-ring .rb{stroke:#0f0f0f;animation:g-march var(--g-ant-s) linear infinite}',
    '#lbp-gate .g-ring .rw{stroke:#fff;stroke-dashoffset:var(--g-ant);animation:g-march-w var(--g-ant-s) linear infinite}',

    '@keyframes g-wipe{to{clip-path:inset(0 0% 0 0)}}',
    '@keyframes g-up{to{opacity:1;transform:translateY(0)}}',
    '@keyframes g-shake{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}',
    '@keyframes g-march{to{stroke-dashoffset:calc(var(--g-ant)*-2)}}',
    '@keyframes g-march-w{to{stroke-dashoffset:calc(var(--g-ant)*-1)}}',
    '@media (hover:none),(pointer:coarse){#lbp-gate .g-cur,#lbp-gate .g-ring{display:none}#lbp-gate input[type=email]{font-size:16px}#lbp-gate .g-pad{grid-template-columns:repeat(3,72px);gap:12px}#lbp-gate .g-k{height:72px}}',
    '@media (max-height:640px){#lbp-gate .g-in{padding-top:3.5rem}#lbp-gate .g-tw{margin-bottom:1rem}#lbp-gate .g-pad{grid-template-columns:repeat(3,56px)}#lbp-gate .g-k{height:52px;font-size:22px}}',
    '@media (prefers-reduced-motion:reduce){#lbp-gate *{animation-duration:.01s!important;animation-delay:0s!important;transition:none!important}}'
  ].join('\n');
  document.head.appendChild(css);

  async function sha(s) {
    var b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [].map.call(new Uint8Array(b), function (x) { return x.toString(16).padStart(2, '0'); }).join('');
  }

  // Vue affichée en premier : e-mail (nouveaux visiteurs) ou digicode (code déjà reçu)
  var VIEW_KEY = 'toolbox_view';
  function savedView() { try { return localStorage.getItem(VIEW_KEY); } catch (e) { return null; } }
  function saveView(v) { try { localStorage.setItem(VIEW_KEY, v); } catch (e) {} }

  // Compteur d'erreurs (survit au rechargement de la page)
  var LOCK_KEY = 'toolbox_lock';
  function lockState() { try { return JSON.parse(localStorage.getItem(LOCK_KEY)) || { n: 0, until: 0 }; } catch (e) { return { n: 0, until: 0 }; } }
  function saveLock(s) { try { localStorage.setItem(LOCK_KEY, JSON.stringify(s)); } catch (e) {} }

  var ANTS = '<svg aria-hidden="true"><rect class="rb" x=".5" y=".5" width="98%" height="98%" rx="3"/><rect class="rw" x=".5" y=".5" width="98%" height="98%" rx="3"/></svg>';
  var BACKSPACE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h10.5A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5H9l-6-7Z"/><path d="m12.5 9.5 5 5M17.5 9.5l-5 5"/></svg>';

  function html() {
    var slots = '';
    for (var i = 0; i < DIGITS; i++) slots += '<span class="g-slot"><i></i>' + ANTS + '</span>';
    var keys = '';
    for (var d = 1; d <= 9; d++) keys += '<button class="g-k" type="button" data-k="' + d + '">' + d + '</button>';
    keys += '<button class="g-k g-0" type="button" data-k="0">0</button>' +
            '<button class="g-k" type="button" data-k="del" aria-label="Effacer le dernier chiffre">' + BACKSPACE + '</button>';

    var mail = BREVO_FORM_URL ?
      '<form class="g-view" id="g-mail" novalidate>' +
        '<label class="g-small" for="g-email">Recevoir le code d’accès</label>' +
        '<div class="g-row"><input id="g-email" type="email" name="EMAIL" placeholder="votre@email.fr" autocomplete="email" required>' +
          '<button class="g-btn" type="submit">envoyer</button></div>' +
        '<div class="g-hp" aria-hidden="true"><input type="text" id="g-hp" tabindex="-1" autocomplete="off"></div>' +
        '<label class="g-consent"><input id="g-ok" type="checkbox" required>' +
          '<span>J’accepte de recevoir le code et, de temps en temps, des nouvelles des outils. Désinscription en un clic. ' +
          '<a href="' + BASE + 'mentions-legales.html#donnees-personnelles">Données personnelles</a></span></label>' +
        '<p class="g-msg" id="g-mail-msg" role="status" aria-live="polite"></p>' +
        '<button class="g-sw" type="button" data-view="code">J’ai déjà le code →</button>' +
      '</form>' : '';

    return '' +
      '<img class="g-cur" src="' + BASE + 'assets/curseur-main.png" alt="" width="32" height="30" aria-hidden="true">' +
      '<svg class="g-ring" aria-hidden="true"><rect class="rb"/><rect class="rw"/></svg>' +
      '<a class="g-back" href="' + BASE + 'index.html">← Accueil</a>' +
      '<div class="g-in">' +
        '<p class="g-small g-label">Loic Bosse-Platière — loicbp.fr</p>' +
        '<div class="g-tw"><h1 class="g-title" data-ants>toolbox</h1></div>' +
        '<div class="g-forms">' + mail +
          '<div class="g-view" id="g-code">' +
            '<p class="g-small" id="g-code-l">Code d’accès</p>' +
            '<div class="g-slots" id="g-slots" role="status" aria-live="polite" aria-label="0 chiffre saisi sur ' + DIGITS + '">' + slots + '</div>' +
            '<p class="g-msg" id="g-code-msg" role="alert"></p>' +
            '<div class="g-pad" id="g-pad" role="group" aria-labelledby="g-code-l">' + keys + '</div>' +
            (BREVO_FORM_URL ? '<button class="g-sw" type="button" data-view="mail">← Le recevoir par e-mail</button>' : '') +
          '</div>' +
        '</div>' +
      '</div>';
  }

  window.addEventListener('DOMContentLoaded', function () {
    var hidden = [];
    Array.prototype.forEach.call(document.body.children, function (el) {
      hidden.push([el, el.style.display]);
      el.style.display = 'none';
    });

    var gate = document.createElement('div');
    gate.id = 'lbp-gate';
    gate.innerHTML = html();
    document.body.appendChild(gate);
    document.documentElement.style.visibility = 'visible';
    var $ = function (s) { return gate.querySelector(s); };

    // ── Curseur main + anneau pointillé qui se pose sur l'élément survolé
    var cur = $('.g-cur'), ring = $('.g-ring'), rects = ring.querySelectorAll('rect');
    cur.onload = function () { gate.classList.add('g-cc'); };
    if (cur.complete && cur.naturalWidth) gate.classList.add('g-cc');
    var mx = -100, my = -100, fx = -100, fy = -100, target = null, raf = 0;
    var PAD = 6, REST = 26, st = { x: -100, y: -100, w: REST, h: REST, r: REST / 2, o: .55 };
    function onMove(e) { gate.classList.add('g-has'); mx = e.clientX; my = e.clientY; cur.style.left = mx + 'px'; cur.style.top = my + 'px'; }
    function onOver(e) { target = e.target && e.target.closest ? e.target.closest('#lbp-gate [data-ants], #lbp-gate a, #lbp-gate button, #lbp-gate .g-row') : null; }
    function onLeave() { gate.classList.remove('g-has'); target = null; }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseleave', onLeave);
    (function frame() {
      fx += (mx - fx) * .11; fy += (my - fy) * .11;
      var g, k;
      if (target && target.isConnected && target.offsetParent !== null) {
        var b = target.getBoundingClientRect();
        g = { x: b.left - PAD, y: b.top - PAD, w: b.width + PAD * 2, h: b.height + PAD * 2, r: 0, o: 1 }; k = .28;
      } else { g = { x: fx - REST / 2, y: fy - REST / 2, w: REST, h: REST, r: REST / 2, o: .55 }; k = .22; }
      for (var p in g) st[p] += (g[p] - st[p]) * k;
      var w = Math.max(st.w, 0), h = Math.max(st.h, 0), r = Math.min(Math.max(st.r, 0), w / 2, h / 2);
      rects.forEach(function (el) { el.setAttribute('x', st.x + .5); el.setAttribute('y', st.y + .5); el.setAttribute('width', w); el.setAttribute('height', h); el.setAttribute('rx', r); });
      ring.style.opacity = st.o;
      raf = requestAnimationFrame(frame);
    })();

    function open() {
      try { sessionStorage.setItem(KEY, HASH); } catch (err) {}
      saveLock({ n: 0, until: 0 });
      cancelAnimationFrame(raf);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('keydown', onKey);
      gate.remove();
      hidden.forEach(function (h) { h[0].style.display = h[1]; });
    }

    // ── Digicode
    var codeView = $('#g-code'), slotsEl = $('#g-slots'), slots = gate.querySelectorAll('.g-slot');
    var pad = $('#g-pad'), cMsg = $('#g-code-msg');
    var code = '', busy = false, lockTimer = 0;

    function render() {
      slots.forEach(function (s, i) {
        s.classList.toggle('g-on', i < code.length);
        s.classList.toggle('g-cur-slot', i === code.length && !busy);
      });
      slotsEl.setAttribute('aria-label', code.length + (code.length > 1 ? ' chiffres saisis' : ' chiffre saisi') + ' sur ' + DIGITS);
    }

    function lockLeft() { return Math.ceil((lockState().until - Date.now()) / 1000); }
    function lockUI() {
      clearInterval(lockTimer);
      var left = lockLeft();
      if (left <= 0) { pad.classList.remove('g-lock'); return false; }
      pad.classList.add('g-lock');
      var tick = function () {
        var l = lockLeft();
        if (l <= 0) { clearInterval(lockTimer); pad.classList.remove('g-lock'); cMsg.textContent = ''; saveLock({ n: 0, until: 0 }); return; }
        cMsg.textContent = 'Trop d’essais. Réessayez dans ' + l + ' s.';
      };
      tick(); lockTimer = setInterval(tick, 1000);
      return true;
    }

    async function check() {
      busy = true; render();
      var ok = (await sha(code)) === HASH;
      if (ok) {
        track('gate-acces-ok');
        saveView('code');
        slotsEl.classList.add('g-ok');
        cMsg.textContent = '';
        setTimeout(open, 380);
        return;
      }
      track('gate-mdp-faux');
      var s = lockState(); s.n++;
      if (s.n >= MAX_TRIES) { s.until = Date.now() + LOCK_S * 1000; s.n = 0; }
      saveLock(s);
      slotsEl.classList.remove('g-shake'); void slotsEl.offsetWidth; slotsEl.classList.add('g-shake');
      setTimeout(function () {
        code = ''; busy = false; render();
        if (!lockUI()) cMsg.textContent = 'Non.';
      }, 420);
    }

    function press(k) {
      if (busy || pad.classList.contains('g-lock')) return;
      if (k === 'del') { code = code.slice(0, -1); render(); return; }
      if (code.length >= DIGITS) return;
      if (!code.length) cMsg.textContent = '';
      code += k; render();
      if (code.length === DIGITS) check();
    }
    function flash(k) {
      var b = pad.querySelector('[data-k="' + k + '"]');
      if (!b) return;
      b.classList.add('g-press');
      setTimeout(function () { b.classList.remove('g-press'); }, 120);
    }
    pad.addEventListener('click', function (e) {
      var b = e.target.closest('[data-k]'); if (!b) return;
      press(b.getAttribute('data-k'));
      if (e.detail) b.blur();                         // clic souris/doigt : pas d'anneau de focus qui reste
    });

    // Clavier physique : chiffres (rangée du haut et pavé), retour arrière
    function onKey(e) {
      if (codeView.hidden || e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); flash(e.key); press(e.key); }
      else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); flash('del'); press('del'); }
      else if (e.key === 'Escape') { code = ''; render(); }
    }
    document.addEventListener('keydown', onKey);

    // ── Demande par e-mail (Brevo)
    var mailForm = $('#g-mail');
    if (mailForm) {
      var email = $('#g-email'), ok = $('#g-ok');
      var msg = $('#g-mail-msg'), btn = mailForm.querySelector('.g-btn');
      email.addEventListener('focus', function once() { track('gate-email-focus'); email.removeEventListener('focus', once); });

      mailForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var v = email.value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { msg.textContent = 'Adresse e-mail invalide.'; email.focus(); return; }
        if (!ok.checked) { msg.textContent = 'Cochez la case pour recevoir le code.'; ok.focus(); return; }
        if ($('#g-hp').value) { msg.innerHTML = MSG_SENT; return; } // robot

        btn.disabled = true;
        msg.textContent = 'Envoi…';
        var fd = new FormData();
        fd.append('EMAIL', v);
        fd.append('email_address_check', '');
        fd.append('locale', 'fr');
        var url = BREVO_FORM_URL + (BREVO_FORM_URL.indexOf('?') < 0 ? '?' : '&') + 'isAjax=1';
        var sent = false;
        try {
          var r = await fetch(url, { method: 'POST', body: fd });
          var j = await r.json().catch(function () { return {}; });
          sent = r.ok && j.success !== false;
        } catch (err) {
          // Brevo refuse parfois la lecture de la réponse (CORS) : on envoie quand même, sans la lire
          try { await fetch(url, { method: 'POST', body: fd, mode: 'no-cors' }); sent = true; } catch (err2) {}
        }
        btn.disabled = false;
        if (sent) {
          track('gate-email-envoye');
          saveView('code');
          msg.textContent = '';
          show('code', MSG_SENT);
        } else {
          msg.textContent = 'Ça n’a pas marché. Réessayez dans un instant.';
        }
      });
    }

    // ── Bascule e-mail ⇄ digicode
    var desktop = window.matchMedia('(hover: hover)').matches;
    function show(view, note) {
      if (!mailForm) view = 'code';
      var on = view === 'mail' ? mailForm : codeView, off = view === 'mail' ? codeView : mailForm;
      if (off) { off.hidden = true; off.classList.remove('g-show'); }
      on.hidden = false;
      on.classList.remove('g-show'); void on.offsetWidth; on.classList.add('g-show');
      if (view === 'code') { code = ''; render(); if (!lockUI()) cMsg.innerHTML = note || ''; }
      else if (desktop) email.focus({ preventScroll: true });
    }
    gate.querySelectorAll('.g-sw').forEach(function (b) {
      b.addEventListener('click', function () { show(b.getAttribute('data-view')); if (!desktop) b.blur(); });
    });

    var sv = savedView();
    var first = sv === 'code' || sv === 'pw' || !BREVO_FORM_URL ? 'code' : 'mail';   // 'pw' = ancienne valeur (mot de passe)
    var other = first === 'code' ? mailForm : codeView;
    if (other) other.hidden = true;
    render(); lockUI();
    if (first === 'mail' && desktop) email.focus({ preventScroll: true });
  });
})();
