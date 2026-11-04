// gate.js — page d'accès à la toolbox (mot de passe + demande par e-mail)
// Protection côté navigateur : filtre les visiteurs, PAS sécurisé à 100 %.
// À inclure dans le <head> de la toolbox ET de chaque outil (après analytics.js) :
//   toolbox.html (racine) : <script src="gate.js"></script>
//   tools/*.html          : <script src="../gate.js"></script>
(function () {
  // ── Réglages ────────────────────────────────────────────────
  // SHA-256 du mot de passe. Pour en changer : ouvrir la console du navigateur et lancer
  // crypto.subtle.digest('SHA-256', new TextEncoder().encode('TON_MDP')).then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('')))
  var HASH = '057ba03d6c44104863dc7361fe4578965d1887360f90a0895882e58a6248fc86';

  // URL du formulaire Brevo (Formulaires → Partager → code HTML → valeur de action="…").
  // Vide = le bloc « Recevoir le mot de passe » est masqué.
  var BREVO_FORM_URL = '';

  // Message affiché après l'envoi (à adapter si le double opt-in est désactivé dans Brevo)
  var MSG_SENT = 'Envoyé. Confirmez votre adresse depuis le mail reçu&nbsp;: le mot de passe suit.';
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
    '#lbp-gate .g-in{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:clamp(4.5rem,9vw,6rem) 16px 3rem}',
    '#lbp-gate .g-small{font-size:clamp(.6rem,1vw,.72rem);letter-spacing:.22em;text-transform:uppercase;font-style:italic}',
    '#lbp-gate .g-label{opacity:0;transform:translateY(6px);animation:g-up .6s ease forwards .2s}',
    '#lbp-gate .g-tw{overflow:hidden;margin:1.4rem 0 1.6rem}',
    '#lbp-gate .g-title{display:block;font-size:clamp(3rem,11vw,8rem);letter-spacing:-.03em;line-height:1;clip-path:inset(0 100% 0 0);animation:g-wipe .9s var(--g-ease) forwards .5s}',
    '#lbp-gate .g-rule{width:0;height:1px;background:var(--g-ink);margin:0 auto 2.4rem;animation:g-x .6s ease forwards 1.1s;max-width:420px}',
    '#lbp-gate .g-forms{width:100%;max-width:420px;opacity:0;transform:translateY(8px);animation:g-up .6s ease forwards 1.3s}',
    '#lbp-gate form{display:flex;flex-direction:column;align-items:center;gap:1rem}',
    '#lbp-gate .g-field{position:relative;width:100%}',
    '#lbp-gate input[type=email],#lbp-gate input[type=password]{-webkit-appearance:none;appearance:none;display:block;width:100%;background:transparent;border:0;border-bottom:1px solid var(--g-line);border-radius:0;outline:0;box-shadow:none;color:var(--g-ink);font-size:clamp(1.25rem,2.2vw,1.5rem);text-align:center;padding:.35em 0 .3em;transition:border-color .3s ease}',
    '#lbp-gate input::placeholder{color:var(--g-ink);opacity:.3;font-style:italic}',
    '#lbp-gate .g-field::after{content:"";position:absolute;left:50%;bottom:0;width:0;height:1px;background:var(--g-ink);transition:width .4s var(--g-ease),left .4s var(--g-ease)}',
    '#lbp-gate .g-field:focus-within::after{left:0;width:100%}',
    '#lbp-gate .g-consent{display:flex;gap:.7em;align-items:flex-start;text-align:left;font-size:.95rem;line-height:1.3;opacity:.75}',
    '#lbp-gate .g-consent a{color:inherit;text-underline-offset:2px}',
    '#lbp-gate input[type=checkbox]{-webkit-appearance:none;appearance:none;flex:none;width:12px;height:12px;margin-top:.2em;border:1px solid var(--g-ink);border-radius:0;background:transparent;display:grid;place-content:center}',
    '#lbp-gate input[type=checkbox]::before{content:"";width:6px;height:6px;background:var(--g-ink);transform:scale(0);transition:transform .2s ease}',
    '#lbp-gate input[type=checkbox]:checked::before{transform:scale(1)}',
    '#lbp-gate input[type=checkbox]:focus-visible{outline:1px solid var(--g-ink);outline-offset:3px}',
    '#lbp-gate button,#lbp-gate .g-back,#lbp-gate .g-legal{position:relative;background:none;border:0;color:var(--g-ink);text-decoration:none;padding:.5em 0;font-size:clamp(.6rem,1vw,.72rem);letter-spacing:.2em;text-transform:uppercase;font-style:italic}',
    '#lbp-gate button::after,#lbp-gate .g-back::after,#lbp-gate .g-legal::after{content:"";position:absolute;bottom:0;left:0;width:0;height:1px;background:var(--g-ink);transition:width .3s ease}',
    '#lbp-gate button:hover::after,#lbp-gate button:focus-visible::after,#lbp-gate .g-back:hover::after,#lbp-gate .g-back:focus-visible::after,#lbp-gate .g-legal:hover::after,#lbp-gate .g-legal:focus-visible::after{width:100%}',
    '#lbp-gate button:focus-visible,#lbp-gate a:focus-visible{outline:0}',
    '#lbp-gate button[disabled]{opacity:.35}',
    '#lbp-gate .g-msg{min-height:1.3em;font-size:1rem;font-style:italic}',
    '#lbp-gate .g-or{display:flex;align-items:center;gap:1rem;margin:2.2rem 0;opacity:.45}',
    '#lbp-gate .g-or::before,#lbp-gate .g-or::after{content:"";flex:1;height:1px;background:var(--g-ink)}',
    '#lbp-gate .g-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}',
    '#lbp-gate .g-back{position:fixed;top:clamp(1rem,2.5vw,1.8rem);right:clamp(1rem,2.5vw,1.8rem);z-index:2;opacity:0;transform:translateY(6px);animation:g-up .5s ease forwards 1.2s}',
    '#lbp-gate .g-legal{margin-top:2.6rem;opacity:.55}',
    '#lbp-gate .g-cur{position:fixed;top:0;left:0;width:32px;height:auto;pointer-events:none;z-index:9999;transform:translate(-5px,-1px);will-change:left,top}',
    '#lbp-gate .g-fol{position:fixed;width:26px;height:26px;border-radius:50%;border:1px solid var(--g-ink);pointer-events:none;z-index:9998;transform:translate(-50%,-50%);opacity:.35;transition:width .25s ease,height .25s ease,opacity .25s ease}',
    '#lbp-gate.g-hover .g-fol{width:42px;height:42px;opacity:.12}',
    '#lbp-gate .g-shake{animation:g-shake .4s ease}',
    '@keyframes g-wipe{to{clip-path:inset(0 0% 0 0)}}',
    '@keyframes g-x{to{width:100%}}',
    '@keyframes g-up{to{opacity:1;transform:translateY(0)}}',
    '@keyframes g-shake{20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}',
    '@media (hover:none){#lbp-gate,#lbp-gate a,#lbp-gate button,#lbp-gate input,#lbp-gate label{cursor:auto}#lbp-gate .g-cur,#lbp-gate .g-fol{display:none}}',
    '@media (prefers-reduced-motion:reduce){#lbp-gate *{animation-duration:.01s!important;animation-delay:0s!important;transition:none!important}}'
  ].join('\n');
  document.head.appendChild(css);

  async function sha(s) {
    var b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [].map.call(new Uint8Array(b), function (x) { return x.toString(16).padStart(2, '0'); }).join('');
  }

  function html() {
    var mail = BREVO_FORM_URL ?
      '<form id="g-mail" novalidate>' +
        '<p class="g-small">Recevoir le mot de passe</p>' +
        '<div class="g-field"><input id="g-email" type="email" name="EMAIL" placeholder="votre@email.fr" autocomplete="email" required aria-label="Adresse e-mail"></div>' +
        '<div class="g-hp" aria-hidden="true"><input type="text" id="g-hp" tabindex="-1" autocomplete="off"></div>' +
        '<label class="g-consent"><input id="g-ok" type="checkbox" required>' +
          '<span>J’accepte que Loïc Bosse-Platière utilise mon e-mail pour m’envoyer le mot de passe et, de temps en temps, des nouvelles de ses outils. Désinscription en un clic.</span></label>' +
        '<button type="submit">Envoyer →</button>' +
        '<p class="g-msg" id="g-mail-msg" role="status" aria-live="polite"></p>' +
      '</form>' +
      '<div class="g-or g-small">ou</div>' : '';

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
            '<p class="g-small">' + (BREVO_FORM_URL ? 'J’ai déjà le mot de passe' : 'Mot de passe') + '</p>' +
            '<div class="g-field"><input id="g-pw" type="password" placeholder="•••••" autocomplete="current-password" aria-label="Mot de passe"></div>' +
            '<button type="submit">Entrer →</button>' +
            '<p class="g-msg" id="g-pw-msg" role="status" aria-live="polite"></p>' +
          '</form>' +
        '</div>' +
        '<a class="g-legal" href="' + BASE + 'mentions-legales.html#donnees-personnelles">Données personnelles</a>' +
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
      var msg = gate.querySelector('#g-mail-msg'), btn = mailForm.querySelector('button');
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
        fd.append('OPT_IN', '1');
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
          mailForm.querySelectorAll('.g-field,.g-consent,button').forEach(function (el) { el.style.display = 'none'; });
          msg.innerHTML = MSG_SENT;
        } else {
          btn.disabled = false;
          msg.textContent = 'Ça n’a pas marché. Réessayez dans un instant.';
        }
      });
    }

    if (window.matchMedia('(hover: hover)').matches) (gate.querySelector('#g-email') || pw).focus({ preventScroll: true });
  });
})();
