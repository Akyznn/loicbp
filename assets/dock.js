/* Dock (footer) — partagé par toutes les pages sauf l'accueil en maintenance.
   Inclure dans une page :  <link rel="stylesheet" href="/assets/dock.css">  +  <script src="/assets/dock.js" defer></script>

   Avec index2 (page d'accueil des projets), le dock communique par événements :
   – « lbp:work »          → la page affiche la grille (sinon : on va sur la page work)
   – « lbp:open-project »  → la page ouvre la fiche (sinon : on va sur la page du projet)
   – window.lbpDock.setWorkActive(bool) / .el / .trashButton  (utilisés par index2) */
(function () {
  'use strict';

  const CFG = {
    workUrl: '/work.html',                 // page « work »
    projectUrl: slug => '/index2.html#' + slug,
    toolboxUrl: '/toolbox.html',
    legalUrl: '/mentions-legales.html',
    instagram: 'l0icbp',
    email: 'contact@loicbp.fr',
    // Formulaire de contact : clé Web3Forms (gratuit, web3forms.com). Vide → le message s'ouvre dans l'application mail.
    formKey: '',
    formEndpoint: 'https://api.web3forms.com/submit',
    toolsInDock: 4
  };

  const ICON = {
    work: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1"/></svg>',
    tools: '<svg viewBox="0 0 24 24"><path d="M14.7 6.3a4 4 0 0 0-5.2 5.2L4 17v3h3l5.5-5.5a4 4 0 0 0 5.2-5.2l-2.6 2.6-2.4-.6-.6-2.4z"/></svg>',
    mail: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/></svg>',
    insta: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.8" cy="7.2" r=".6" fill="currentColor"/></svg>',
    legal: '<svg viewBox="0 0 24 24"><path d="M7 3.5h7l4 4v13H7z"/><path d="M14 3.5v4h4M9.5 12h6M9.5 15h6M9.5 18h4"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/><g class="trash-empty-ico"><path d="M10 10.5v6.5M14 10.5v6.5"/></g><g class="trash-full"><path d="M9 11.5l2.5-2 2 1.5 2-1.6M8.6 14.5h6.8"/></g></svg>'
  };

  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const mobile = matchMedia('(max-width: 720px), (hover: none)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const path = location.pathname.replace(/\/+$/, '/') ;

  /* ───────── Construction ───────── */
  document.documentElement.classList.add('has-dock');
  const nav = document.createElement('nav');
  nav.id = 'dock';
  nav.setAttribute('aria-label', 'Raccourcis');
  nav.innerHTML = `
    <div class="dock-bar">
      <a class="dock-item" data-k="work" href="${CFG.workUrl}" data-label="work" aria-label="work — tous les projets" data-umami-event="dock-work">${ICON.work}<i class="dock-dot"></i></a>
      <button class="dock-item" data-k="tools" data-panel="tools" type="button" data-label="toolbox" aria-label="toolbox" aria-expanded="false" data-umami-event="dock-toolbox">${ICON.tools}<i class="dock-dot"></i></button>
      <span class="dock-sep" aria-hidden="true"></span>
      <button class="dock-item" data-k="mail" data-panel="mail" type="button" data-label="contact" aria-label="Écrire un message" aria-expanded="false" data-umami-event="dock-contact">${ICON.mail}<i class="dock-dot"></i></button>
      <button class="dock-item" data-k="insta" data-panel="insta" type="button" data-label="instagram" aria-label="Instagram" aria-expanded="false" data-umami-event="dock-instagram">${ICON.insta}<i class="dock-dot"></i></button>
      <button class="dock-item" data-k="legal" data-panel="legal" type="button" data-label="mentions légales" aria-label="Mentions légales" aria-expanded="false" data-umami-event="dock-mentions">${ICON.legal}<i class="dock-dot"></i></button>
      <span class="dock-sep" aria-hidden="true"></span>
      <button class="dock-item" data-k="trash" data-panel="trash" type="button" data-label="corbeille" aria-label="Corbeille" aria-expanded="false" data-umami-event="dock-corbeille">${ICON.trash}<i class="dock-dot"></i></button>
    </div>
    <div class="dock-panel" role="dialog" hidden></div>`;
  document.body.appendChild(nav);

  const bar = nav.querySelector('.dock-bar');
  const panel = nav.querySelector('.dock-panel');
  const items = [...nav.querySelectorAll('.dock-item')];
  const byK = k => nav.querySelector(`[data-k="${k}"]`);

  // Page en cours : point sous l'icône
  if (/toolbox\.html$/.test(path)) byK('tools').classList.add('is-current');
  if (/work\.html$/.test(path)) byK('work').classList.add('is-current');
  if (/mentions-legales\.html$/.test(path)) byK('legal').classList.add('is-current');

  // « work » : la page d'accueil des projets affiche sa grille ; ailleurs, le lien mène à la page work
  byK('work').addEventListener('click', e => {
    closePanel();
    const ev = new CustomEvent('lbp:work', { cancelable: true });
    if (!window.dispatchEvent(ev)) e.preventDefault();
  });

  /* ───────── Panneaux ───────── */
  const cache = {};
  let openK = null, closeT;

  const head = (title, sub, extra) =>
    `<div class="dp-head"><span class="dp-title">${esc(title)}</span><span class="dp-sub">${esc(sub || '')}</span>${extra || ''}</div>`;

  // Corbeille : projets marqués "corbeille": true dans projets.json
  let projectsP = null;
  const loadProjects = () => projectsP || (projectsP = fetch('/assets/projets.json').then(r => r.json()).catch(() => []));
  loadProjects().then(all => nav.classList.toggle('has-trash', all.some(p => p.corbeille)));

  function buildTrash() {
    const el = document.createElement('div');
    el.innerHTML = head('corbeille', '') + '<div class="dp-grid"></div><p class="dp-empty" hidden>La corbeille est vide.</p>';
    loadProjects().then(all => {
      const list = all.filter(p => p.corbeille);
      const grid = el.querySelector('.dp-grid');
      list.forEach(p => {
        const b = document.createElement('a');
        b.className = 'dp-item'; b.href = CFG.projectUrl(p.slug);
        b.innerHTML = `<span class="dp-thumb"><img alt="" draggable="false" src="/assets/projets/thumbs/${esc(p.slug)}.webp"></span><span class="dp-label">${esc(p.titre)}</span>`;
        b.addEventListener('click', e => {
          const ev = new CustomEvent('lbp:open-project', { cancelable: true, detail: { slug: p.slug, from: b.querySelector('img') } });
          if (!window.dispatchEvent(ev)) { e.preventDefault(); closePanel(); }
        });
        grid.appendChild(b);
      });
      grid.style.setProperty('--cols', Math.max(1, Math.min(4, list.length)));
      grid.hidden = !list.length;
      el.querySelector('.dp-empty').hidden = !!list.length;
      el.querySelector('.dp-sub').textContent = list.length ? list.length + ' élément' + (list.length > 1 ? 's' : '') : '';
      place();
    });
    return el;
  }

  // Toolbox : les 4 premiers outils + « voir toute la toolbox »
  function loadTools() {
    if (window.LBP_TOOLS) return Promise.resolve(window.LBP_TOOLS);
    return new Promise(res => {
      const s = document.createElement('script');
      s.src = '/assets/tools.js'; s.onload = () => res(window.LBP_TOOLS || []); s.onerror = () => res([]);
      document.head.appendChild(s);
    });
  }
  function buildTools() {
    const el = document.createElement('div');
    el.innerHTML = head('toolbox', '') + '<div class="dp-grid dp-tools"></div>' +
      `<div class="dp-foot"><a class="dp-btn" href="${CFG.toolboxUrl}" data-umami-event="dock-toolbox-tout">voir toute la toolbox →</a></div>`;
    loadTools().then(list => {
      const grid = el.querySelector('.dp-grid');
      list.filter(t => t.img).slice(0, CFG.toolsInDock).forEach(t => {
        const a = document.createElement('a');
        a.className = 'dp-item'; a.href = '/' + t.file;
        a.setAttribute('data-umami-event', 'ouverture-outil'); a.setAttribute('data-umami-event-outil', t.name);
        a.innerHTML = `<span class="dp-thumb"><img alt="" draggable="false" loading="lazy" src="/${esc(t.img)}"></span><span class="dp-label">${esc(t.name.split(' — ')[0])}</span>`;
        grid.appendChild(a);
      });
      el.querySelector('.dp-sub').textContent = list.length + ' outils';
      place();
    });
    return el;
  }

  // Contact : formulaire (Web3Forms si une clé est renseignée, sinon l'application mail)
  function buildMail() {
    const el = document.createElement('div');
    el.innerHTML = head('contact', CFG.email) + `
      <form class="dp-form" novalidate>
        <label>nom<input name="name" autocomplete="name" required></label>
        <label>e-mail<input name="email" type="email" autocomplete="email" required></label>
        <label>message<textarea name="message" rows="5" required></textarea></label>
        <input class="dp-hp" type="checkbox" name="botcheck" tabindex="-1" autocomplete="off" aria-hidden="true">
        <div class="dp-row"><span class="dp-status" aria-live="polite"></span><button class="dp-btn" type="submit">envoyer</button></div>
      </form>`;
    const form = el.querySelector('form'), status = el.querySelector('.dp-status'), btn = el.querySelector('button[type=submit]');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form));
      if (d.botcheck) return;
      if (!d.name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email) || !d.message.trim()) {
        status.textContent = 'Il manque ton nom, ton e-mail ou ton message.'; return;
      }
      const mailto = () => {
        const body = d.message + '\n\n— ' + d.name + ' <' + d.email + '>';
        location.href = 'mailto:' + CFG.email + '?subject=' + encodeURIComponent('Message depuis loicbp.fr') + '&body=' + encodeURIComponent(body);
      };
      try { window.umami && umami.track('contact-envoi'); } catch (err) {}
      if (!CFG.formKey) { status.textContent = 'Ton application mail s’ouvre…'; mailto(); return; }
      btn.disabled = true; status.textContent = 'Envoi…';
      try {
        const r = await fetch(CFG.formEndpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ access_key: CFG.formKey, subject: 'Message depuis loicbp.fr', from_name: d.name, name: d.name, email: d.email, message: d.message })
        });
        const j = await r.json();
        if (!j.success) throw new Error(j.message);
        form.reset(); status.textContent = 'Message envoyé, merci !';
      } catch (err) {
        status.textContent = 'L’envoi n’a pas marché — ton application mail s’ouvre.'; mailto();
      } finally { btn.disabled = false; }
    });
    return el;
  }

  // Instagram : aperçu du profil + bouton « ouvrir »
  function buildInsta() {
    const el = document.createElement('div');
    el.className = 'dp-insta';
    el.innerHTML = head('@' + CFG.instagram, '') +
      `<iframe title="Aperçu du profil Instagram @${esc(CFG.instagram)}" loading="lazy" src="https://www.instagram.com/${esc(CFG.instagram)}/embed/" referrerpolicy="strict-origin-when-cross-origin"></iframe>` +
      `<p class="dp-note">Aperçu chargé depuis Instagram.</p>`;
    // L'iframe Instagram capte la souris : la page ne reçoit plus ses mouvements et le curseur custom se fige.
    // Au-dessus de l'aperçu, on masque donc le curseur custom (le curseur normal d'Instagram prend le relais).
    const fr = el.querySelector('iframe');
    fr.addEventListener('mouseenter', () => document.documentElement.classList.add('cursor-off'));
    fr.addEventListener('mouseleave', () => document.documentElement.classList.remove('cursor-off'));
    el.querySelector('.dp-head').insertAdjacentHTML('beforeend',
      `<a class="dp-btn" href="https://instagram.com/${esc(CFG.instagram)}" target="_blank" rel="noopener" data-umami-event="clic-instagram">ouvrir</a>`);
    return el;
  }

  // Mentions légales : le contenu de la page, dans le panneau
  function buildLegal() {
    const el = document.createElement('div');
    el.innerHTML = head('mentions légales', '') + '<div class="dp-legal" tabindex="0"><p>Chargement…</p></div>';
    el.querySelector('.dp-head').insertAdjacentHTML('beforeend', `<a class="dp-btn" href="${CFG.legalUrl}">en page</a>`);
    fetch(CFG.legalUrl).then(r => r.text()).then(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const main = doc.querySelector('main') || doc.body;
      main.querySelectorAll('.back, script, style').forEach(n => n.remove());
      el.querySelector('.dp-legal').innerHTML = main.innerHTML;
      place();
    }).catch(() => { el.querySelector('.dp-legal').innerHTML = `<p><a href="${CFG.legalUrl}">Ouvrir les mentions légales</a></p>`; });
    return el;
  }

  const BUILD = { trash: buildTrash, tools: buildTools, mail: buildMail, insta: buildInsta, legal: buildLegal };
  const LABEL = { trash: 'Corbeille', tools: 'toolbox', mail: 'Contact', insta: 'Instagram', legal: 'Mentions légales' };

  function place() {
    if (!openK) return;
    const d = nav.getBoundingClientRect(), b = byK(openK).getBoundingClientRect();
    const w = panel.offsetWidth, cx = b.left + b.width / 2;
    const left = clamp(cx - w / 2, 8, innerWidth - w - 8);
    panel.style.left = (left - d.left) + 'px';
    panel.style.setProperty('--ox', (cx - left) + 'px');
  }

  function openPanel(k) {
    clearTimeout(closeT);
    if (openK) byK(openK).setAttribute('aria-expanded', 'false');
    openK = k;
    if (!cache[k]) cache[k] = BUILD[k]();
    panel.replaceChildren(cache[k]);
    panel.setAttribute('aria-label', LABEL[k]);
    panel.hidden = false;
    byK(k).setAttribute('aria-expanded', 'true');
    panel.classList.remove('open');
    place();
    requestAnimationFrame(() => panel.classList.add('open'));
    if (k === 'mail') setTimeout(() => { const i = panel.querySelector('input[name=name]'); i && fine.matches && i.focus({ preventScroll: true }); }, 200);
  }
  function closePanel(refocus) {
    if (!openK) return;
    const k = openK; openK = null;
    byK(k).setAttribute('aria-expanded', 'false');
    panel.classList.remove('open');
    closeT = setTimeout(() => { panel.hidden = true; }, 380);
    document.documentElement.classList.remove('cursor-off');
    if (refocus) byK(k).focus({ preventScroll: true });
  }

  nav.querySelectorAll('[data-panel]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.panel;
    openK === k ? closePanel() : openPanel(k);
  }));
  document.addEventListener('pointerdown', e => { if (openK && !nav.contains(e.target)) closePanel(); });
  window.addEventListener('keydown', e => {
    if (openK && e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); closePanel(true); }
  }, true);
  addEventListener('resize', place);

  /* ───────── Grossissement façon Magic UI (40 → 60 px dans un rayon de 140 px, ressort) ───────── */
  const DOCK = { mag: 20, dist: 140 };
  const spring = items.map(() => ({ s: 0, v: 0 }));
  let mx = Infinity;
  bar.addEventListener('mousemove', e => { mx = e.clientX; });
  bar.addEventListener('mouseleave', () => { mx = Infinity; });
  let base = 40;
  const readBase = () => { base = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dock-size')) || 40; };
  readBase(); addEventListener('resize', readBase);
  function step() {
    const on = fine.matches && !reduce.matches && !mobile.matches;
    items.forEach((it, k) => {
      const st = spring[k];
      if (!st.s) st.s = base;
      let target = base;
      if (on && mx !== Infinity) {
        const r = it.getBoundingClientRect(), d = Math.abs(mx - (r.left + r.width / 2));
        if (d < DOCK.dist) target = base + DOCK.mag * (1 - d / DOCK.dist);
      }
      for (let n = 0; n < 4; n++) {           // raideur 150, amortissement 12, masse 0,1 — 4 sous-pas
        const a = (-150 * (st.s - target) - 12 * st.v) / 0.1;
        st.v += a / 240; st.s += st.v / 240;
      }
      if (Math.abs(st.s - target) < 0.05 && Math.abs(st.v) < 0.05) { st.s = target; st.v = 0; }
      const px = st.s.toFixed(2) + 'px';
      if (it.style.width !== px) { it.style.width = px; it.style.height = px; }
    });
    if (openK) place();
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);

  /* ───────── API pour index2 ───────── */
  window.lbpDock = {
    el: nav,
    trashButton: byK('trash'),
    setWorkActive(on) { byK('work').classList.toggle('is-current', !!on); },
    close: closePanel
  };
  window.dispatchEvent(new CustomEvent('lbp:dock-ready'));
})();
