// gate.js — page d'accès à la toolbox (mot de passe + demande par e-mail)
// Protection côté navigateur : filtre les visiteurs, PAS sécurisé à 100 %.
// À inclure dans le <head> de la toolbox ET de chaque outil (après analytics.js) :
//   toolbox.html (racine) : <script src="gate.js"></script>
//   tools/*.html          : <script src="../gate.js"></script>
(function () {
  // ── Réglages ────────────────────────────────────────────────
  // SHA-256 du mot de passe. Pour en changer : ouvrir la console du navigateur et lancer
  // crypto.subtle.digest('SHA-256', new TextEncoder().encode('TON_MDP')).then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('')))
  var HASH = 'bcbd76ed94ed60dadeecdaf381cd44747a8b5f668ec46f2d8aa085aa7792351c';

  // URL du formulaire Brevo (Formulaires → Partager → code HTML → valeur de action="…").
  // Vide = le bloc « Recevoir le mot de passe » est masqué.
  var BREVO_FORM_URL = 'https://a9eb6ac0.sibforms.com/serve/MUIFABXKavQp-5DX5iZ5M-n5NUIt40zY0Vd-9EXR2gVBWB6PgVoIE6giRvxXljMsvq3tkrlYK7IW2YSKlFzjRpYhQSw-SD4MIgsiq7rG8Lv_thWSwpE8Sb-eDYO1fJ6u5wL0tfYJQX3rIbBsnnubjzbZIjtWLq6q2aBdzzIau0b8yvs1mm9x2hb2crYO0Ir_zgGqg3vdREDeRagd0Q==';

  // Message affiché après l'envoi (à adapter si le double opt-in est désactivé dans Brevo)
  var MSG_SENT = 'Envoyé. Regardez votre boîte mail (et les spams)&nbsp;: le mot de passe arrive.';
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
  font.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap';
  document.head.appendChild(font);

  var css = document.createElement('style');
  css.textContent = [
    '#lbp-gate{--g-a:#fdfdfd;--g-b:#efefef;--g-ink:#0f0f0f;--g-line:rgba(15,15,15,.28);--g-ease:cubic-bezier(.77,0,.175,1);',
    'position:fixed;inset:0;z-index:2147483000;overflow-y:auto;color-scheme:light;color:var(--g-ink);cursor:none;-webkit-font-smoothing:antialiased;',
    "background-color:var(--g-a);background-image:url('" + BASE + "assets/trame.svg?v=3'),conic-gradient(var(--g-b) 25%,var(--g-a) 0 50%,var(--g-b) 0 75%,var(--g-a) 0);",
    'background-size:1440px auto,22px 22px;background-position:-30px -20px,0 0;background-repeat:repeat,repeat}',
    '#lbp-gate,#lbp-gate *{box-sizing:border-box;margin:0;padding:0;font-family:"Instrument Serif",serif;font-weight:400;letter-spacing:normal;text-transform:none;line-height:normal}',
    '#lbp-gate a,#lbp-gate button,#lbp-gate input,#lbp-gate label{cursor:none}',
    '#lbp-gate .g-in{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:3.5rem 16px 2rem}',
    '#lbp-gate .g-small{font-size:clamp(.6rem,1vw,.72rem);letter-spacing:.22em;text-transform:uppercase;font-style:italic}',
    '#lbp-gate .g-label{opacity:0;transform:translateY(6px);animation:g-up .6s ease forwards .2s}',
    '#lbp-gate .g-tw{overflow:hidden;margin:.9rem 0 1.1rem}',
    '#lbp-gate .g-title{display:block;font-size:clamp(2.6rem,6.5vw,4.5rem);letter-spacing:-.03em;line-height:1;clip-path:inset(0 100% 0 0);animation:g-wipe .9s var(--g-ease) forwards .5s}',
    '#lbp-gate .g-rule{width:0;height:1px;background:var(--g-ink);margin:0 auto 1.8rem;animation:g-x .6s ease forwards 1.1s;max-width:360px}',
    '#lbp-gate .g-forms{width:100%;max-width:360px;opacity:0;transform:translateY(8px);animation:g-up .6s ease forwards 1.3s}',
    '#lbp-gate form{display:flex;flex-direction:column;align-items:center;gap:.8rem}',
    '#lbp-gate form[hidden]{display:none}',
    '#lbp-gate form.g-show{animation:g-up .4s ease both;opacity:0;transform:translateY(6px)}',
    '#lbp-gate .g-row{position:relative;width:100%;border-bottom:1px solid var(--g-line)}',
    '#lbp-gate .g-row::after{content:"";position:absolute;left:50%;bottom:-1px;width:0;height:1px;background:var(--g-ink);transition:width .4s var(--g-ease),left .4s var(--g-ease)}',
    '#lbp-gate .g-row:focus-within::after{left:0;width:100%}',
    '#lbp-gate input[type=email],#lbp-gate input[type=password]{-webkit-appearance:none;appearance:none;display:block;width:100%;background:transparent;border:0;border-radius:0;outline:0;box-shadow:none;color:var(--g-ink);font-size:1.25rem;text-align:center;padding:.3em 2.2rem .25em}',
    '#lbp-gate input::placeholder{color:var(--g-ink);opacity:.3;font-style:italic}',
    '#lbp-gate .g-go{position:absolute;right:0;bottom:0;top:0;width:2.2rem;display:flex;align-items:center;justify-content:flex-end;background:none;border:0;color:var(--g-ink);font-size:1.35rem;line-height:1;transition:transform .3s var(--g-ease),opacity .3s ease}',
    '#lbp-gate .g-go:hover,#lbp-gate .g-go:focus-visible{transform:translateX(4px)}',
    '#lbp-gate .g-go:focus-visible{outline:0}',
    '#lbp-gate .g-go[disabled]{opacity:.3}',
    '#lbp-gate .g-consent{display:flex;gap:.6em;align-items:flex-start;text-align:left;font-size:.82rem;line-height:1.3;opacity:.7}',
    '#lbp-gate .g-consent a{color:inherit;text-decoration:underline;text-underline-offset:2px}',
    '#lbp-gate input[type=checkbox]{-webkit-appearance:none;appearance:none;flex:none;width:11px;height:11px;margin-top:.15em;border:1px solid var(--g-ink);border-radius:0;background:transparent;display:grid;place-content:center}',
    '#lbp-gate input[type=checkbox]::before{content:"";width:5px;height:5px;background:var(--g-ink);transform:scale(0);transition:transform .2s ease}',
    '#lbp-gate input[type=checkbox]:checked::before{transform:scale(1)}',
    '#lbp-gate input[type=checkbox]:focus-visible{outline:1px solid var(--g-ink);outline-offset:3px}',
    '#lbp-gate .g-sw,#lbp-gate .g-back{position:relative;background:none;border:0;color:var(--g-ink);text-decoration:none;padding:.4em 0;font-size:clamp(.6rem,1vw,.72rem);letter-spacing:.2em;text-transform:uppercase;font-style:italic}',
    '#lbp-gate .g-sw{opacity:.55;margin-top:.2rem;transition:opacity .3s ease}',
    '#lbp-gate .g-sw:hover,#lbp-gate .g-sw:focus-visible{opacity:1}',
    '#lbp-gate .g-sw::after,#lbp-gate .g-back::after{content:"";position:absolute;bottom:0;left:0;width:0;height:1px;background:var(--g-ink);transition:width .3s ease}',
    '#lbp-gate .g-sw:hover::after,#lbp-gate .g-sw:focus-visible::after,#lbp-gate .g-back:hover::after,#lbp-gate .g-back:focus-visible::after{width:100%}',
    '#lbp-gate .g-sw:focus-visible,#lbp-gate a:focus-visible{outline:0}',
    '#lbp-gate .g-msg{min-height:1.2em;font-size:.95rem;font-style:italic}',
    '#lbp-gate .g-msg:empty{min-height:0;margin-top:-.8rem}',
    '#lbp-gate .g-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}',
    '#lbp-gate .g-back{position:fixed;top:clamp(1rem,2.5vw,1.8rem);right:clamp(1rem,2.5vw,1.8rem);z-index:2;opacity:0;transform:translateY(6px);animation:g-up .5s ease forwards 1.2s}',
    '#lbp-gate .g-cur{position:fixed;top:0;left:0;width:32px;height:auto;pointer-events:none;z-index:9999;transform:translate(-5px,-1px);will-change:left,top}',
    '#lbp-gate .g-fol{position:fixed;width:26px;height:26px;border-radius:50%;border:1px solid var(--g-ink);pointer-events:none;z-index:9998;transform:translate(-50%,-50%);opacity:.35;transition:width .25s ease,height .25s ease,opacity .25s ease}',
    '#lbp-gate.g-hover .g-fol{width:42px;height:42px;opacity:.12}',
    '#lbp-gate .g-shake{animation:g-shake .4s ease}',
    '@keyframes g-wipe{to{clip-path:inset(0 0% 0 0)}}',
    '@keyframes g-x{to{width:100%}}',
    '@keyframes g-up{to{opacity:1;transform:translateY(0)}}',
    '@keyframes g-shake{20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}',
    '@media (hover:none){#lbp-gate,#lbp-gate a,#lbp-gate button,#lbp-gate input,#lbp-gate label{cursor:auto}#lbp-gate .g-cur,#lbp-gate .g-fol{display:none}#lbp-gate input[type=email],#lbp-gate input[type=password]{font-size:16px}}',
    '@media (prefers-reduced-motion:reduce){#lbp-gate *{animation-duration:.01s!important;animation-delay:0s!important;transition:none!important}}'
  ].join('\n');
  document.head.appendChild(css);

  async function sha(s) {
    var b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [].map.call(new Uint8Array(b), function (x) { return x.toString(16).padStart(2, '0'); }).join('');
  }

  // Vue affichée en premier : e-mail (nouveaux visiteurs) ou mot de passe (déjà reçu)
  var VIEW_KEY = 'toolbox_view';
  function savedView() { try { return localStorage.getItem(VIEW_KEY); } catch (e) { return null; } }
  function saveView(v) { try { localStorage.setItem(VIEW_KEY, v); } catch (e) {} }

  function html() {
    var mail = BREVO_FORM_URL ?
      '<form id="g-mail" novalidate>' +
        '<label class="g-small" for="g-email">Recevoir le mot de passe</label>' +
        '<div class="g-row"><input id="g-email" type="email" name="EMAIL" placeholder="votre@email.fr" autocomplete="email" required>' +
          '<button class="g-go" type="submit" aria-label="Envoyer">→</button></div>' +
        '<div class="g-hp" aria-hidden="true"><input type="text" id="g-hp" tabindex="-1" autocomplete="off"></div>' +
        '<label class="g-consent"><input id="g-ok" type="checkbox" required>' +
          '<span>J’accepte de recevoir le mot de passe et, de temps en temps, des nouvelles des outils. Désinscription en un clic. ' +
          '<a href="' + BASE + 'mentions-legales.html#donnees-personnelles">Données personnelles</a></span></label>' +
        '<p class="g-msg" id="g-mail-msg" role="status" aria-live="polite"></p>' +
        '<button class="g-sw" type="button" data-view="pw">J’ai déjà le mot de passe →</button>' +
      '</form>' : '';

    return '' +
      '<img class="g-cur" src="' + BASE + 'assets/curseur-main.png" alt="" width="32" height="30" aria-hidden="true">' +
      '<div class="g-fol" aria-hidden="true"></div>' +
      '<a class="g-back" href="' + BASE + 'index.html">← Accueil</a>' +
      '<div class="g-in">' +
        '<p class="g-small g-label">Loic Bosse-Platière — loicbp.fr</p>' +
        '<div class="g-tw"><h1 class="g-title">toolbox</h1></div>' +
        '<div class="g-rule"></div>' +
        '<div class="g-forms">' + mail +
          '<form id="g-pw-form" novalidate>' +
            '<label class="g-small" for="g-pw">Mot de passe</label>' +
            '<div class="g-row"><input id="g-pw" type="password" placeholder="•••••" autocomplete="current-password">' +
              '<button class="g-go" type="submit" aria-label="Entrer">→</button></div>' +
            '<p class="g-msg" id="g-pw-msg" role="status" aria-live="polite"></p>' +
            (BREVO_FORM_URL ? '<button class="g-sw" type="button" data-view="mail">← Le recevoir par e-mail</button>' : '') +
          '</form>' +
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

    // ── Curseur main + follower (comme sur les autres pages)
    var cur = gate.querySelector('.g-cur'), fol = gate.querySelector('.g-fol');
    var mx = -100, my = -100, fx = -100, fy = -100, raf = 0;
    function onMove(e) { mx = e.clientX; my = e.clientY; cur.style.left = mx + 'px'; cur.style.top = my + 'px'; }
    document.addEventListener('mousemove', onMove);
    (function loop() {
      fx += (mx - fx) * 0.11; fy += (my - fy) * 0.11;
      fol.style.left = fx + 'px'; fol.style.top = fy + 'px';
      raf = requestAnimationFrame(loop);
    })();
    gate.querySelectorAll('a,button,input,label').forEach(function (el) {
      el.addEventListener('mouseenter', function () { gate.classList.add('g-hover'); });
      el.addEventListener('mouseleave', function () { gate.classList.remove('g-hover'); });
    });

    function open() {
      try { sessionStorage.setItem(KEY, HASH); } catch (err) {}
      cancelAnimationFrame(raf);
      document.removeEventListener('mousemove', onMove);
      gate.remove();
      hidden.forEach(function (h) { h[0].style.display = h[1]; });
    }

    // ── Mot de passe
    var pw = gate.querySelector('#g-pw'), pwMsg = gate.querySelector('#g-pw-msg');
    gate.querySelector('#g-pw-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!pw.value) { pw.focus(); return; }
      if ((await sha(pw.value)) === HASH) {
        track('gate-acces-ok');
        saveView('pw');
        open();
      } else {
        track('gate-mdp-faux');
        pwMsg.textContent = 'Non.';
        pw.value = '';
        pw.parentNode.classList.remove('g-shake'); void pw.offsetWidth; pw.parentNode.classList.add('g-shake');
        pw.focus();
      }
    });

    // ── Demande par e-mail (Brevo)
    var mailForm = gate.querySelector('#g-mail');
    if (mailForm) {
      var email = gate.querySelector('#g-email'), ok = gate.querySelector('#g-ok');
      var msg = gate.querySelector('#g-mail-msg'), btn = mailForm.querySelector('.g-go');
      email.addEventListener('focus', function once() { track('gate-email-focus'); email.removeEventListener('focus', once); });

      mailForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var v = email.value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { msg.textContent = 'Adresse e-mail invalide.'; email.focus(); return; }
        if (!ok.checked) { msg.textContent = 'Cochez la case pour recevoir le mot de passe.'; ok.focus(); return; }
        if (gate.querySelector('#g-hp').value) { msg.innerHTML = MSG_SENT; return; } // robot

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
        if (sent) {
          track('gate-email-envoye');
          saveView('pw');
          btn.disabled = false;
          msg.textContent = '';
          show('pw', MSG_SENT);
        } else {
          btn.disabled = false;
          msg.textContent = 'Ça n’a pas marché. Réessayez dans un instant.';
        }
      });
    }

    // ── Bascule e-mail ⇄ mot de passe
    var desktop = window.matchMedia('(hover: hover)').matches;
    function show(view, note) {
      var mf = gate.querySelector('#g-mail'), pf = gate.querySelector('#g-pw-form');
      if (!mf) view = 'pw';
      var on = view === 'mail' ? mf : pf, off = view === 'mail' ? pf : mf;
      if (off) { off.hidden = true; off.classList.remove('g-show'); }
      on.hidden = false;
      on.classList.remove('g-show'); void on.offsetWidth; on.classList.add('g-show');
      if (view === 'pw') pwMsg.innerHTML = note || '';
      if (desktop) on.querySelector('input').focus({ preventScroll: true });
    }
    gate.querySelectorAll('.g-sw').forEach(function (b) {
      b.addEventListener('click', function () { show(b.getAttribute('data-view')); if (!desktop) b.blur(); });
    });
    var first = savedView() === 'pw' || !BREVO_FORM_URL ? 'pw' : 'mail';
    var other = gate.querySelector(first === 'pw' ? '#g-mail' : '#g-pw-form');
    if (other) other.hidden = true;
    if (desktop) gate.querySelector(first === 'pw' ? '#g-pw' : '#g-email').focus({ preventScroll: true });
  });
})();
