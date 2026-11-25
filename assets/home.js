/* Accueil des projets (index2.html) et page work (work.html) — script partagé.
   work.html = <html data-page="work"> : grille seule, sans composition éparpillée. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const stage = $('#stage'), cluster = $('#cluster'), btnWork = $('#btn-work');
  const tag = $('#tag'), peek = $('#peek'), peekImg = $('img', peek);
  const modal = $('#modal'), frame = $('.m-frame'), media = $('.m-media');
  const mTitle = $('.m-title'), mMeta = $('.m-meta'), mText = $('.m-text');
  const mNav = $('.m-nav'), mCount = $('.m-count');
  const cursorEl = $('#cursor');

  // Page « work » (work.html) : même code, grille seule ; index2.html : composition éparpillée + bascule
  const PAGE_WORK = document.documentElement.dataset.page === 'work';
  const HOME_URL = 'index2.html', WORK_URL = 'work.html';
  const mqMobile = matchMedia('(max-width: 720px), (hover: none)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  let allProjects = [], trashProjects = [];   // trashProjects : affichés par le dock
  let projects = [], cards = [], plan = [], base = [], world = [];
  const planes = {}, ptags = {}, planeT = {}, prings = {};
  let mode = 'scatter';           // 'scatter' | 'work'
  let isMobile = mqMobile.matches;
  let current = null, imgIndex = 0, pushedOpen = false;
  let mx = innerWidth / 2, my = innerHeight / 2;

  const track = (n, d) => { try { window.lbpTrack && window.lbpTrack(n, d); } catch (e) {} };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* Générateur pseudo-aléatoire à graine fixe : même composition à chaque visite pour une taille d'écran donnée */
  function rng(seed) {
    return () => {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* Plans de profondeur. La molette déplace la « mise au point » (focus) sans fin :
     le plan net est à taille réelle ; derrière, il rapetisse et se floute ; devant, il grossit, se floute et disparaît…
     puis réapparaît tout au fond : les plans défilent en boucle les uns derrière les autres. */
  const NPLANS = 3, WRAP = 0.7;               // un plan passé à 0,7 plan devant la caméra repart au fond
  const depthOf = pl => (((pl - focus + WRAP) % NPLANS) + NPLANS) % NPLANS - WRAP;   // ∈ [−0,7 ; 2,3[
  function planeLook(d) {                     // d = profondeur relative au plan net
    if (d >= 0) {
      const back = clamp((NPLANS - WRAP - d) / 0.35, 0, 1);   // fondu d'apparition tout au fond
      return { s: 1 / (1 + 0.3 * d), blur: Math.min(d * 2.6, 6.5), op: back };
    }
    return { s: 1 - d * 0.65, blur: Math.min(-d * 7, 9), op: clamp(1 + d * 1.6, 0, 1) };
  }
  let focus = 1, focusT = 1;
  /* Nouvelle composition à chaque chargement (répartition dans les plans + placement),
     stable ensuite pendant la visite (redimensionnement, aller-retour « work »). */
  const SEED = (Math.random() * 2 ** 31) | 0;
  /* Perspective atmosphérique des plans du fond (valeurs atteintes deux plans derrière) — à régler ici */
  const ATMO = { sat: 0.7, contrast: 0.35, light: 0.12 };
  const darkNow = document.documentElement.dataset.theme === 'dark';   // mode sombre : seulement si forcé (?theme=dark)

  const thumb = p => 'assets/projets/thumbs/' + p.slug + '.webp';
  const images = p => (p.images && p.images.length ? p.images : [p.cover]).map(x => typeof x === 'string' ? { src: x } : x);
  const meta = p => [(p.disciplines || []).join(', '), p.cadre, p.annee].filter(Boolean).join(' / ');

  /* ───────── Construction ───────── */
  function build() {
    const r = rng(SEED);
    for (let k = NPLANS; k >= 1; k--) {
      const el = document.createElement('div');
      el.className = 'plane'; el.dataset.plan = k;
      const pt = document.createElement('div');
      pt.className = 'ptag'; pt.setAttribute('aria-hidden', 'true');
      el.appendChild(pt); ptags[k] = pt;
      const NS = 'http://www.w3.org/2000/svg', ps = document.createElementNS(NS, 'svg');
      ps.setAttribute('class', 'pring'); ps.setAttribute('aria-hidden', 'true');
      ['rb', 'rw'].forEach(c => { const rc = document.createElementNS(NS, 'rect'); rc.setAttribute('class', c); ps.appendChild(rc); });
      el.appendChild(ps); prings[k] = ps;
      stage.appendChild(el); planes[k] = el;
    }
    projects.forEach((p, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'card';
      b.dataset.slug = p.slug;
      b.setAttribute('aria-label', p.titre + (p.annee ? ' (' + p.annee + ')' : ''));
      const ratio = p.cover ? p.cover.w / p.cover.h : 1.6;
      // Format de la vignette = format de l'image, inscrit dans un carré (bornes 0,56 → 2,2 pour les formats extrêmes)
      const rr = clamp(ratio, 0.56, 2.2);
      base.push(rr >= 1 ? { w: 1, h: 1 / rr } : { w: rr, h: 1 });
      const img = new Image();
      img.src = thumb(p); img.alt = ''; img.decoding = 'async'; img.draggable = false;
      if (ratio > 2.6 || ratio < 0.4) img.className = 'contain';
      const inner = document.createElement('span');
      inner.className = 'card-in';
      inner.appendChild(img);
      b.appendChild(inner);
      b.addEventListener('click', () => {
        if (suppressClick) { suppressClick = false; return; }   // fin d'un glisser-déposer : pas d'ouverture
        const d = depthOf(plan[i]);
        if (mode === 'scatter' && !isMobile && Math.abs(d) > 0.4) {   // projet flou : on rejoint son plan
          focusT = Math.round(focus + d); hidePeek(); return;
        }
        open(p.slug, { from: b });
      });
      b.addEventListener('mouseenter', () => showPeek(p, i));
      b.addEventListener('mouseleave', hidePeek);
      b.addEventListener('pointerdown', e => dragStart(e, i));
      cards.push(b);
      plan.push(0);
    });
    // Répartition sur 3 plans : "plan": 1|2|3 dans projets.json pour l'imposer, sinon tirage (≈ 8 / 9 / 8)
    const auto = [];
    projects.forEach((p, i) => { if ([1, 2, 3].includes(p.plan)) plan[i] = p.plan; else auto.push(i); });
    for (let k = auto.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [auto[k], auto[j]] = [auto[j], auto[k]]; }
    auto.forEach((i, n) => { plan[i] = 1 + Math.floor(n * 3 / auto.length); });
    plan.forEach((pl, i) => { cards[i].dataset.plan = pl; planes[pl].appendChild(cards[i]); });
  }

  /* ───────── Mise en page ───────── */
  function metrics() {
    const vw = document.documentElement.clientWidth, vh = innerHeight;
    const L = cluster.getBoundingClientRect().width;
    // S = côté du carré dans lequel s'inscrit chaque vignette (premier plan / grille)
    const S = isMobile
      ? Math.floor((vw - 2 * 16 - 14) / 2)
      : Math.round(clamp(vw * 0.105, 128, 185));
    return { vw, vh, L, LH: L * 0.2285, S };
  }

  /* Boîte englobante du groupe logo + boutons, relative à son origine */
  /* Orbite des boutons autour du logo (ellipse, en largeurs de logo) — un tour complet en `period` secondes.
     Angles de départ repris de la maquette. L'orbite entière (+ taille des boutons) est la zone de sécurité :
     aucun projet n'y apparaît. */
  const ORBIT = { rx: 0.78, ry: 0.34, period: 120 };
  const orbitBtns = [
    { el: $('.b-toolbox'), a: -112 * Math.PI / 180 },
    { el: $('.b-contact'), a: 147 * Math.PI / 180 },
    { el: $('.b-work'), a: 51 * Math.PI / 180 }
  ];
  let orbitPhase = 0, orbitLast = performance.now();
  function orbitStep(now) {
    const dt = Math.min(0.1, (now - orbitLast) / 1000); orbitLast = now;
    // pause quand on survole ou cible un bouton (on ne court pas après un bouton qui bouge)
    const paused = reduce.matches || cluster.matches(':hover') || cluster.contains(document.activeElement);
    if (!paused) orbitPhase += dt * Math.PI * 2 / ORBIT.period;
    orbitBtns.forEach(b => {
      const a = b.a + orbitPhase;
      b.el.style.setProperty('--dx', (ORBIT.rx * Math.cos(a)).toFixed(4));
      b.el.style.setProperty('--dy', (ORBIT.ry * Math.sin(a)).toFixed(4));
    });
  }
  function clusterBox() {
    const L = cluster.getBoundingClientRect().width, LH = L * 0.2285;
    let bw = 0, bh = 0;
    orbitBtns.forEach(b => { bw = Math.max(bw, b.el.offsetWidth / 2); bh = Math.max(bh, b.el.offsetHeight / 2); });
    bw *= 1.3; bh *= 1.3;                                    // taille au survol
    const cx = 0.5 * L, cy = 0.114 * L;
    return {
      x0: Math.min(0, cx - ORBIT.rx * L - bw), x1: Math.max(L, cx + ORBIT.rx * L + bw),
      y0: Math.min(0, cy - ORBIT.ry * L - bh), y1: Math.max(LH, cy + ORBIT.ry * L + bh)
    };
  }

  function gap(a, b) {
    const dx = Math.max(a.x0 - b.x1, b.x0 - a.x1);
    const dy = Math.max(a.y0 - b.y1, b.y0 - a.y1);
    if (dx < 0 && dy < 0) return Math.max(dx, dy);  // chevauchement → négatif
    return Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  }

  /* Éparpillé : chaque plan est réparti tout autour du logo.
     – L'écran est découpé en secteurs angulaires autour du centre, autant que de projets dans le plan :
       une vignette par secteur → chaque plan couvre gauche, droite, haut et bas, jamais d'un seul côté.
     – Les secteurs sont décalés d'un plan à l'autre, pour que les plans s'intercalent.
     – Dans son secteur, la vignette prend la place la plus dégagée parmi quelques essais.
     – Une marge de sécurité tout autour de l'écran : rien ne naît collé aux bords. */
  function scatterLayout(m, excl) {
    const r = rng(SEED + 1);
    const cx = m.vw / 2, cy = m.vh / 2;
    const MX = Math.max(48, m.vw * 0.05), MY = Math.max(40, m.vh * 0.07);   // marges de sécurité (bords)
    const bottomRes = Math.max(MY, dockReserve());                             // en bas : la place du dock
    const cyA = (MY + m.vh - bottomRes) / 2;                                   // centre de la zone disponible
    const zone = { x0: excl.x0 - m.S * 0.18, y0: excl.y0 - m.S * 0.15, x1: excl.x1 + m.S * 0.18, y1: excl.y1 + m.S * 0.15 };
    const proj = (b, s) => ({ x0: cx + (b.x0 - cx) * s, x1: cx + (b.x1 - cx) * s, y0: cy + (b.y0 - cy) * s, y1: cy + (b.y1 - cy) * s });
    const cross = m.S * 0.12;                        // léger chevauchement toléré entre deux plans
    const TAU = Math.PI * 2;
    const shuffle = a => { for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; };

    const placed = [], out = [];
    const turn0 = r() * TAU;
    for (let pl = 1; pl <= NPLANS; pl++) {
      const ids = shuffle(cards.map((c, i) => i).filter(i => plan[i] === pl));
      const n = ids.length; if (!n) continue;
      const sector = TAU / n;
      const offset = turn0 + (pl - 1) * sector / NPLANS;     // plans intercalés
      const s0 = planeLook(pl - 1).s;
      ids.forEach((i, k) => {
        const w = base[i].w * m.S, hgt = base[i].h * m.S;
        // demi-étendue disponible pour le CENTRE de la vignette, marges comprises
        const hx = Math.max(10, m.vw / 2 - MX - w / 2), hy = Math.max(10, (m.vh - MY - bottomRes) / 2 - hgt / 2);
        let best = null, bestScore = -Infinity;
        for (let t = 0; t < 70; t++) {
          const a = offset + (k + 0.12 + r() * 0.76) * sector;           // reste dans son secteur
          // Angle pris dans un carré normalisé puis étiré au format de l'écran : les secteurs gauche/droite
          // ne sont pas écrasés par la largeur de l'écran
          const ca = Math.cos(a), sa = Math.sin(a);
          const f = (0.34 + 0.66 * Math.sqrt(r())) / Math.max(Math.abs(ca), Math.abs(sa));
          const px = cx + ca * f * hx, py = cyA + sa * f * hy;
          const box = { x0: px - w / 2, y0: py - hgt / 2, x1: px + w / 2, y1: py + hgt / 2 };
          const pb = proj(box, s0);
          let s = Math.min(gap(box, zone), gap(pb, zone)) * 1.2;
          for (const q of placed) {
            if (q.pl === pl) s = Math.min(s, gap(box, q.w));
            s = Math.min(s, gap(pb, q.p) + (q.pl === pl ? 0 : cross));
            if (s < bestScore) break;
          }
          if (s > bestScore) { bestScore = s; best = { w: box, p: pb, pl }; }
        }
        placed.push(best);
        out[i] = { x: best.w.x0, y: best.w.y0 };
      });
    }
    // Positions déplacées à la main (glisser-déposer) pendant la visite
    const saved = loadPos();
    projects.forEach((p, i) => { const s = saved[p.slug]; if (s) out[i] = { x: s[0] * m.vw, y: s[1] * m.vh }; });
    return out;
  }

  function gridLayout(m, top) {
    // Grille de cases carrées : chaque vignette est centrée dans sa case
    const g = isMobile ? 14 : Math.round(m.S * 0.2);
    const side = isMobile ? 16 : 48;
    const cols = isMobile ? 2 : clamp(Math.floor((m.vw - 2 * side + g) / (m.S + g)), 1, 5);
    const totalW = cols * m.S + (cols - 1) * g;
    const x0 = (m.vw - totalW) / 2;
    const pos = projects.map((p, i) => ({
      x: x0 + (i % cols) * (m.S + g) + (m.S - base[i].w * m.S) / 2,
      y: top + Math.floor(i / cols) * (m.S + g) + (m.S - base[i].h * m.S) / 2
    }));
    const rows = Math.ceil(projects.length / cols);
    return { pos, height: top + rows * (m.S + g) - g + (isMobile ? 48 : 96) + dockReserve() };
  }

  function apply(animate) {
    document.documentElement.classList.toggle('lock', !(isMobile || mode === 'work'));   // avant la mesure (barre de défilement)
    const m = metrics();
    document.documentElement.style.setProperty('--S', m.S + 'px');
    cards.forEach((c, i) => { c.style.width = (base[i].w * m.S) + 'px'; c.style.height = (base[i].h * m.S) + 'px'; });
    const work = isMobile || mode === 'work';
    btnWork.setAttribute('aria-pressed', String(work));

    const box = clusterBox();
    const minCy = m.LH / 2 - box.y0 + (isMobile ? 14 : 18);       // l'orbite ne sort jamais par le haut
    const cy = work ? Math.max(minCy, isMobile ? 0 : clamp(m.vh * 0.12, 72, 120)) : m.vh / 2;
    const ox = m.vw / 2 - m.L / 2, oy = cy - m.LH / 2;
    const excl = { x0: ox + box.x0, y0: oy + box.y0, x1: ox + box.x1, y1: oy + box.y1 };

    let pos, height;
    stage.classList.toggle('scatter', !work);
    if (work) ({ pos, height } = gridLayout(m, excl.y1 + (isMobile ? 36 : 64)));
    else { pos = scatterLayout(m, excl); height = m.vh; }

    const anim = animate && !reduce.matches;
    stage.classList.toggle('anim', anim);
    cluster.style.transition = anim ? 'transform .95s var(--ease)' : 'none';
    cluster.style.transform = `translate(${ox}px, ${oy}px)`;
    world = pos;
    Object.values(planes).forEach(pn => { pn.style.transformOrigin = `${m.vw / 2}px ${m.vh / 2}px`; });
    cards.forEach((c, i) => {
      c.style.transitionDelay = anim ? (i * 14) + 'ms' : '0ms';
      c.style.transform = `translate(${pos[i].x}px, ${pos[i].y}px)`;
    });
    if (work) Object.values(planes).forEach(pn => { pn.style.transform = ''; pn.style.filter = ''; pn.style.opacity = ''; pn.style.zIndex = ''; pn.classList.remove('off'); });
    planeCache = {};
    clearTimeout(animT);
    if (anim) animT = setTimeout(() => stage.classList.remove('anim'), 1400);
    stage.style.height = height + 'px';
  }

  let animT, planeCache = {};
  function setMode(next, { push = true, animate = true } = {}) {
    if (PAGE_WORK && next !== 'work') { location.href = HOME_URL; return; }
    if (next === mode) return;
    mode = next;
    if (mode === 'scatter' && scrollY > 0) scrollTo(0, 0);
    if (push) history.pushState({ mode }, '', urlFor(null));
    hidePeek();
    apply(animate);
  }

  btnWork.addEventListener('click', () => {
    if (PAGE_WORK || isMobile) { scrollTo({ top: 0, behavior: reduce.matches ? 'auto' : 'smooth' }); return; }
    setMode(mode === 'work' ? 'scatter' : 'work');
  });

  $('.logo').addEventListener('click', e => {
    if (PAGE_WORK) return;                    // page work : le logo ramène à l'accueil (lien normal)
    e.preventDefault();
    if (current) close();
    setMode('scatter');
  });

  /* ───────── Survol : étiquette + aperçu ───────── */
  let tx = mx, ty = my, px = mx, py = my, peeking = false, peekIdx = -1;
  function showPeek(p, i) {
    peekIdx = i;
    if (isMobile || !fine.matches || current || (drag && drag.moved)) return;
    tag.textContent = p.titre;
    Object.values(ptags).forEach(t => t.classList.remove('on'));
    ptags[plan[i]].textContent = p.titre;
    peekImg.src = thumb(p);
    sizePeek(p.cover ? p.cover.w / p.cover.h : 1.6);
    startPeekLoop(p);
    if (!peeking) { tx = px = mx; ty = py = my; }
    peeking = true;
    document.body.classList.add('peeking');
  }
  /* Projet à plusieurs images : elles défilent dans l'aperçu, coupe franche, comme un GIF.
     Les miniatures (assets/projets/<projet>/thumbs/) sont préchargées au survol ; une image pas encore prête est sautée. */
  const PEEK_FRAME = 360;   // durée d'une image (ms)
  const thumbOf = src => /\.svg($|\?)/i.test(src) ? src : src.replace(/\/([^/]+)\.[a-z0-9]+$/i, '/thumbs/$1.webp');
  let peekLoop = null;
  // L'aperçu prend le format de chaque photo, inscrit dans un carré de 1,5 × la taille des vignettes
  function sizePeek(r0) {
    const S15 = metrics().S * 1.5, rr = clamp(r0 || 1.6, 0.5, 2.6);
    peekImg.style.width = (rr >= 1 ? S15 : S15 * rr) + 'px';
    peekImg.style.height = (rr >= 1 ? S15 / rr : S15) + 'px';
    peekImg.style.objectFit = r0 > 2.6 || r0 < 0.5 ? 'contain' : 'cover';
  }
  function startPeekLoop(p) {
    clearInterval(peekLoop); peekLoop = null;
    const list = images(p);
    if (list.length < 2 || reduce.matches) return;
    const frames = list.map((it, k) => {
      const src = k === 0 ? thumb(p) : thumbOf(it.src);
      const im = new Image(); im.src = src;
      const ratio = it.w && it.h ? it.w / it.h : (k === 0 && p.cover ? p.cover.w / p.cover.h : 0);
      return { src, im, ratio, vector: /\.svg($|\?)/i.test(src) };
    });
    let k = 0;
    peekLoop = setInterval(() => {
      for (let n = 1; n <= frames.length; n++) {
        const f = frames[(k + n) % frames.length];
        if (f.im.complete && f.im.naturalWidth) {
          k = (k + n) % frames.length;
          peekImg.src = f.src;
          sizePeek(f.ratio || f.im.naturalWidth / f.im.naturalHeight);
          if (f.vector) peekImg.style.objectFit = 'contain';
          peekImg.style.background = f.vector ? '#fff' : '';
          return;
        }
      }
    }, PEEK_FRAME);
  }
  function hidePeek() { clearInterval(peekLoop); peekLoop = null; peekImg.style.background = ''; peeking = false; document.body.classList.remove('peeking'); Object.values(ptags).forEach(t => t.classList.remove('on')); }

  /* ───────── Boucle d'animation : curseur, étiquette, aperçu, parallaxe ───────── */
  let parX = 0, parY = 0;

  // Molette / pavé tactile : on traverse les plans (avec un léger aimantage sur chaque plan)
  let snapT;
  addEventListener('wheel', e => {
    if (mode !== 'scatter' || isMobile || current) return;
    if (e.target.closest && e.target.closest('#dock')) return;   // molette dans le dock (mentions légales…) : défilement normal
    e.preventDefault();
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    focusT += dy * 0.0024;
    clearTimeout(snapT);
    snapT = setTimeout(() => { focusT = Math.round(focusT); }, 180);
  }, { passive: false });

  /* ───────── Glisser-déposer des vignettes (état éparpillé) ───────── */
  let drag = null, suppressClick = false;
  const POS_KEY = 'lbp-index2-pos';
  try { sessionStorage.removeItem(POS_KEY); } catch (e) {}   // nouvelle composition → on oublie les déplacements
  function loadPos() { try { return JSON.parse(sessionStorage.getItem(POS_KEY)) || {}; } catch (e) { return {}; } }
  function savePos(slug, x, y) {
    try { const s = loadPos(); s[slug] = [x / innerWidth, y / innerHeight]; sessionStorage.setItem(POS_KEY, JSON.stringify(s)); } catch (e) {}
  }
  function dragStart(e, i) {
    if (mode !== 'scatter' || isMobile || e.button !== 0 || current) return;
    if (Math.abs(depthOf(plan[i])) > 0.4) return;            // les projets flous ne se déplacent pas
    if (e.pointerType === 'mouse') e.preventDefault();      // sinon le navigateur « attrape » l'image
    suppressClick = false;
    drag = { i, sx: e.clientX, sy: e.clientY, x0: world[i].x, y0: world[i].y, moved: false, id: e.pointerId };
  }
  addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    const c = cards[drag.i];
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < 6) return;
      drag.moved = true;
      c.classList.add('dragging');
      try { c.setPointerCapture(drag.id); } catch (err) {}
      hidePeek();
    }
    const s = planeLook(depthOf(plan[drag.i])).s;          // le déplacement suit la souris, quel que soit le plan
    const w = c.offsetWidth, hh = c.offsetHeight;
    world[drag.i] = {
      x: clamp(drag.x0 + dx / s, -w * 0.4, innerWidth - w * 0.6),
      y: clamp(drag.y0 + dy / s, -hh * 0.4, innerHeight - hh * 0.6)
    };
    c.style.transform = `translate(${world[drag.i].x}px, ${world[drag.i].y}px)`;
  });
  function dragEnd(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    if (drag.moved) {
      const c = cards[drag.i];
      c.classList.remove('dragging');
      c.classList.add('dropping');
      setTimeout(() => c.classList.remove('dropping'), 460);
      savePos(projects[drag.i].slug, world[drag.i].x, world[drag.i].y);
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 50);
    }
    drag = null;
  }
  addEventListener('pointerup', dragEnd);
  addEventListener('pointercancel', dragEnd);
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    mx = e.clientX; my = e.clientY;
    cursorEl.style.left = mx + 'px'; cursorEl.style.top = my + 'px';
    document.body.classList.add('has-cursor');
  }, { passive: true });
  document.addEventListener('mouseleave', () => document.body.classList.remove('has-cursor'));

  /* ───────── Sélection « Photoshop » ───────── */
  const ring = $('#ring'), rects = ring.querySelectorAll('rect');
  // Contour exact du logo : on clone chaque tracé en deux calques (noir + blanc)
  document.querySelectorAll('[data-ants="contour"] svg').forEach(svg => {
    const NS = 'http://www.w3.org/2000/svg', g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'ants');
    svg.querySelectorAll('path, polygon').forEach(sh => ['ab', 'aw'].forEach(cls => {
      const c = document.createElementNS(NS, sh.tagName);
      ['d', 'points'].forEach(a => sh.hasAttribute(a) && c.setAttribute(a, sh.getAttribute(a)));
      c.setAttribute('class', cls); g.appendChild(c);
    }));
    svg.appendChild(g);
  });
  let antTarget = null;
  function setAnt(el) {
    if (el === antTarget) return;
    if (antTarget) antTarget.classList.remove('ants-on');
    antTarget = el;
    if (el && el.dataset.ants === 'contour') el.classList.add('ants-on');
  }
  const pickAnt = el => el && el.closest && !el.closest('#dock') ? el.closest('[data-ants], a, button') : null;   // le dock a son propre effet (grossissement)
  document.addEventListener('mouseover', e => setAnt(pickAnt(e.target)));
  document.addEventListener('mouseleave', () => setAnt(null));
  document.addEventListener('focusin', e => { const t = pickAnt(e.target); if (t && t.matches(':focus-visible')) setAnt(t); });
  document.addEventListener('focusout', () => setAnt(null));
  const REST = 26, APAD = 6;
  const ant = { x: -100, y: -100, w: REST, h: REST, r: REST / 2, o: 0 };
  let fx = -100, fy = -100;
  function ringStep() {
    fx += (mx - fx) * 0.11; fy += (my - fy) * 0.11;
    let t = antTarget, farCard = null;
    // projet flou : le cadre est dessiné DANS son plan (flou + passe sous les plans proches) ; le rond s'efface
    if (t && t.classList.contains('card') && mode === 'scatter' && !isMobile && Math.abs(depthOf(+t.dataset.plan)) > 0.4) farCard = t;
    for (const k2 in prings) {
      const on = farCard && +farCard.dataset.plan === +k2;
      if (on) {
        const i = cards.indexOf(farCard), P = 6, wv = farCard.offsetWidth + P * 2, hv = farCard.offsetHeight + P * 2;
        const ps = prings[k2];
        ps.setAttribute('width', wv); ps.setAttribute('height', hv);
        ps.style.transform = `translate(${world[i].x - P}px, ${world[i].y - P}px)`;
        ps.querySelectorAll('rect').forEach(rc => { rc.setAttribute('x', 0.5); rc.setAttribute('y', 0.5); rc.setAttribute('width', wv - 1); rc.setAttribute('height', hv - 1); });
      }
      prings[k2].classList.toggle('on', !!on);
    }
    if (t && (drag && drag.moved)) t = null;
    let g, k;
    if (farCard) { g = { x: fx, y: fy, w: 0, h: 0, r: 0, o: 0 }; k = 0.25; }
    else if (t && t.dataset.ants === 'contour') { g = { x: fx, y: fy, w: 0, h: 0, r: 0, o: 0 }; k = 0.25; }
    else if (t && t.isConnected && !t.closest('[hidden]')) {
      const b = t.getBoundingClientRect();
      g = { x: b.left - APAD, y: b.top - APAD, w: b.width + APAD * 2, h: b.height + APAD * 2, r: 0, o: 1 }; k = 0.28;
    } else { g = { x: fx - REST / 2, y: fy - REST / 2, w: REST, h: REST, r: REST / 2, o: document.body.classList.contains('has-cursor') ? 0.55 : 0 }; k = 0.22; }
    for (const p in g) ant[p] += (g[p] - ant[p]) * k;
    const w = Math.max(ant.w, 0), hh = Math.max(ant.h, 0), rr = Math.min(Math.max(ant.r, 0), w / 2, hh / 2);
    rects.forEach(el => {
      el.setAttribute('x', ant.x + 0.5); el.setAttribute('y', ant.y + 0.5);
      el.setAttribute('width', w); el.setAttribute('height', hh); el.setAttribute('rx', rr);
    });
    ring.style.opacity = ant.o < 0.01 ? 0 : ant.o;
  }

  function frameLoop(now) {
    orbitStep(now || performance.now());
    if (fine.matches) ringStep();
    if (peeking) {
      // Projet hors du plan net : titre seul, placé DANS son plan (flou et taille du plan, sous les plans plus proches)
      const far = mode === 'scatter' && !isMobile && peekIdx >= 0 && Math.abs(depthOf(plan[peekIdx])) > 0.4;
      document.body.classList.toggle('peek-far', far);
      // Étiquette : au-dessus du curseur, avec un léger retard
      tx += (mx - tx) * 0.16; ty += (my - ty) * 0.16;
      if (far) {
        const pl = plan[peekIdx], T = planeT[pl], pt = ptags[pl];
        if (T) {
          // coordonnées écran → coordonnées du plan (inverse de translate + scale autour du centre)
          const ox = innerWidth / 2, oy = innerHeight / 2;
          const lx = ox + (tx - ox - T.tx) / T.s, ly = oy + (ty - oy - T.ty) / T.s;
          pt.style.transform = `translate(${lx - pt.offsetWidth / 2}px, ${ly - pt.offsetHeight - 12 / T.s}px)`;
        }
        pt.classList.add('on');
      } else {
        Object.values(ptags).forEach(t => t.classList.remove('on'));
        const tw = tag.offsetWidth, th = tag.offsetHeight;
        const lx = clamp(tx - tw / 2, 6, innerWidth - tw - 6), ly = clamp(ty - th - 12, 6, innerHeight - th - 6);
        tag.style.transform = `translate(${lx}px, ${ly}px)`;
      }
      // Aperçu : collé au curseur, bascule de côté pour ne jamais sortir de l'écran
      px += (mx - px) * 0.45; py += (my - py) * 0.45;
      const pw = peek.offsetWidth, ph = peek.offsetHeight;
      let ax = px + 36; if (ax + pw > innerWidth - 8) ax = px - 20 - pw;
      const ay = clamp(py + 8, 8, innerHeight - ph - 8);
      peek.style.transform = `translate(${ax}px, ${ay}px)`;
    }
    // Plans (état éparpillé) : mise au point à la molette + parallaxe douce à la souris
    if (mode === 'scatter' && !isMobile) {
      const on = fine.matches && !reduce.matches && !current;
      const gx = on ? (mx / innerWidth - 0.5) : 0, gy = on ? (my / innerHeight - 0.5) : 0;
      parX += (gx - parX) * 0.06; parY += (gy - parY) * 0.06;
      focus += (focusT - focus) * (reduce.matches ? 1 : 0.1);
      if (Math.abs(focusT - focus) < 0.0005) focus = focusT;
      for (let pl = 1; pl <= NPLANS; pl++) {
        const d = depthOf(pl), L = planeLook(d), pn = planes[pl];
        planeT[pl] = { s: L.s, tx: -parX * 40 * L.s, ty: -parY * 28 * L.s };
        const tf = `translate(${(-parX * 40 * L.s).toFixed(1)}px, ${(-parY * 28 * L.s).toFixed(1)}px) scale(${L.s.toFixed(4)})`;
        // Derrière le plan net : flou + perspective atmosphérique (couleurs éteintes, contraste adouci, voile clair)
        const a = clamp(d, 0, 2) / 2;
        const fl = L.blur > 0.05
          ? `blur(${L.blur.toFixed(2)}px)` + (a > 0.01 ? ` saturate(${(1 - ATMO.sat * a).toFixed(3)}) contrast(${(1 - ATMO.contrast * a).toFixed(3)}) brightness(${(1 + (darkNow ? -1.6 : 1) * ATMO.light * a).toFixed(3)})` : '')
          : 'none';
        const z = String(Math.round(50 - d * 10));            // le plan le plus proche passe devant
        const key = tf + fl + L.op.toFixed(3) + z;
        if (planeCache[pl] === key) continue;
        planeCache[pl] = key;
        pn.style.transform = tf; pn.style.filter = fl; pn.style.opacity = L.op.toFixed(3); pn.style.zIndex = z;
        pn.classList.toggle('off', L.op < 0.35);
      }
    }
    requestAnimationFrame(frameLoop);
  }

  /* ───────── Fiche projet ───────── */
  function urlFor(slug) {
    const base = location.pathname + location.search;
    if (PAGE_WORK) return slug ? base + '#' + slug : base;
    if (mode === 'work' && !isMobile) return base + (slug ? '#work/' + slug : '#work');
    return slug ? base + '#' + slug : base;
  }

  // Affiche d'abord la vignette (déjà en cache), puis la grande image une fois chargée :
  // jamais l'image du projet précédent pendant l'ouverture
  /* Chaque photo est un calque à part : la nouvelle arrive en fondu PENDANT que l'ancienne s'efface,
     puis l'ancienne est retirée. Plus jamais deux photos superposées, même en défilant vite
     ou avec un logo à fond transparent. */
  let imgToken = 0;
  function clearMedia() {
    imgToken++;
    media.querySelectorAll('img').forEach(n => n.remove());
    media.style.backgroundImage = 'none';
  }
  function setMediaSrc(full, low, alt) {
    const token = ++imgToken;
    const vector = /\.svg($|\?)/i.test(full);
    // 1re ouverture : la vignette (en cache) sert de fond immédiat, sauf pour un logo vectoriel
    media.style.backgroundImage = low && !vector ? `url("${low}")` : 'none';
    const olds = [...media.querySelectorAll('img')];
    const layer = new Image();
    layer.alt = alt || ''; layer.decoding = 'async'; layer.draggable = false;
    if (vector) layer.className = 'is-vector';
    media.appendChild(layer);
    const show = () => {
      if (token !== imgToken) { layer.remove(); return; }     // une autre photo a été demandée entre-temps
      layer.classList.add('loaded');
      olds.forEach(o => { o.classList.add('out'); setTimeout(() => o.remove(), 460); });
      setTimeout(() => { if (token === imgToken) media.style.backgroundImage = 'none'; }, 460);
    };
    layer.onload = show; layer.onerror = show;
    layer.src = full;
    if (layer.complete && layer.naturalWidth) requestAnimationFrame(show);
  }
  // Taille de la zone image : format de la photo, inscrit dans le plus grand cadre possible à l'écran
  let curRatio = 16 / 9;
  function sizeMedia(ratio, animate) {
    if (!ratio || !isFinite(ratio)) return;
    curRatio = ratio;
    const pad = isMobile ? 16 : 26;
    const maxW = isMobile ? innerWidth - 24 - pad : Math.min(innerWidth * 0.62, 1000) - pad;
    const maxH = isMobile
      ? innerHeight - 24 - 130 - pad / 2
      : Math.min(innerHeight - 48 - 96 - pad / 2, innerHeight * 0.7, 760);
    let w = maxW, hh = w / ratio;
    if (hh > maxH) { hh = maxH; w = hh * ratio; }
    // Surface plafonnée : un visuel panoramique ne s'ouvre pas plus « gros » qu'un vertical ou un carré
    const maxArea = maxH * maxH * 1.2;
    if (!isMobile && w * hh > maxArea) { hh = Math.sqrt(maxArea / ratio); w = hh * ratio; }
    if (!animate) media.style.transition = 'none';
    media.style.width = Math.round(w) + 'px';
    media.style.height = Math.round(hh) + 'px';
    if (!animate) { void media.offsetWidth; media.style.transition = ''; }
  }
  const ratioOf = (img, i) => img.w && img.h ? img.w / img.h
    : (i === 0 && current.cover && img.src === current.cover.src ? current.cover.w / current.cover.h : null);

  function showImage(i, fade) {
    const list = images(current);
    imgIndex = (i + list.length) % list.length;
    const it = list[imgIndex], known = ratioOf(it, imgIndex);
    if (known) sizeMedia(known, fade);
    else {   // format inconnu (pas de w/h dans projets.json) : on le lit sur l'image une fois chargée
      const tok = imgToken + 1, probe = new Image();
      probe.onload = () => { if (tok === imgToken) sizeMedia(probe.naturalWidth / probe.naturalHeight, true); };
      probe.src = it.src;
    }
    const altTxt = current.titre + (list.length > 1 ? ' — image ' + (imgIndex + 1) + ' sur ' + list.length : '');
    setMediaSrc(list[imgIndex].src, fade ? null : thumb(current), altTxt);   // vignette en fond seulement à l'ouverture
    mCount.textContent = (imgIndex + 1) + ' / ' + list.length;
    // précharge la suivante
    if (list.length > 1) { const n = new Image(); n.src = list[(imgIndex + 1) % list.length].src; }
  }

  /* Morph vignette → fiche : la fiche est réduite UNIFORMÉMENT à la largeur de la vignette (aucune déformation
     de l'image ni du texte) et découpée à sa hauteur (la légende est masquée sous la découpe), puis tout s'ouvre. */
  function morphKeyframes(el) {
    const r = el.getBoundingClientRect(), f = frame.getBoundingClientRect();
    const s = r.width / f.width;
    const hidden = Math.max(0, f.height - r.height / s);
    return [
      { transform: `translate(${r.left - f.left}px, ${r.top - f.top}px) scale(${s})`, clipPath: `inset(0px 0px ${hidden}px 0px round ${4 / s}px)` },
      { transform: 'none', clipPath: 'inset(0px 0px 0px 0px round 5px)' }
    ];
  }
  const EASE_OPEN = 'cubic-bezier(0.16, 1, 0.3, 1)';     // départ vif, arrivée très douce
  const EASE_CLOSE = 'cubic-bezier(0.65, 0, 0.35, 1)';

  let lastFocus = null, closeAnim = null;
  // Termine proprement une fermeture en cours (sinon la fiche précédente réapparaît une image)
  function endClose() {
    if (closeAnim) { closeAnim.onfinish = null; closeAnim.cancel(); closeAnim = null; }
    modal.classList.remove('leaving');
    cards.forEach(c => c.classList.remove('is-open'));
  }
  function open(slug, { from = null, push = true } = {}) {
    const proj = allProjects.find(p => p.slug === slug);
    if (!proj) return;
    const i = projects.indexOf(proj);                       // −1 pour un projet de la corbeille
    endClose();
    current = proj;
    const card = from || cards[i] || (dockApi() && dockApi().trashButton);
    lastFocus = card;
    hidePeek();

    mTitle.textContent = current.titre;
    mMeta.textContent = meta(current);
    mText.textContent = current.accroche || '';
    mNav.hidden = images(current).length < 2;
    clearMedia();
    showImage(0, false);

    modal.hidden = false;
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => modal.classList.add('shown'));
    if (push) { history.pushState({ open: slug }, '', urlFor(slug)); pushedOpen = true; }
    track('projet', { slug });

    const visible = card && card.getBoundingClientRect().bottom > 0 && card.getBoundingClientRect().top < innerHeight;
    if (!reduce.matches && visible) {
      modal.classList.add('entering');
      frame.animate(morphKeyframes(card), { duration: 760, easing: EASE_OPEN });
      if (cards.includes(card)) card.classList.add('is-open');
      clearTimeout(open.t);
      open.t = setTimeout(() => modal.classList.remove('entering'), 360);   // légende et × arrivent pendant la fin du mouvement
    } else {
      modal.classList.remove('entering');
      frame.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
    }
    frame.focus({ preventScroll: true });
  }

  function close({ fromPop = false } = {}) {
    if (!current) return;
    if (!fromPop) {
      if (pushedOpen) { history.back(); return; }          // popstate rappellera close()
      history.replaceState({ mode }, '', urlFor(null));
    }
    pushedOpen = false;
    const i = projects.indexOf(current);
    const card = cards[i] || (dockApi() && dockApi().trashButton);   // projet de la corbeille : il y retourne
    current = null;
    const done = () => {
      const refocus = lastFocus && document.activeElement && modal.contains(document.activeElement);
      document.body.classList.remove('modal-open');
      modal.hidden = true;            // masquée AVANT de retirer l'animation (fill: forwards) → aucune image résiduelle
      endClose();
      clearMedia();
      if (refocus) lastFocus.focus({ preventScroll: true });
    };
    const r = card && card.getBoundingClientRect();
    const visible = r && r.bottom > 0 && r.top < innerHeight;
    modal.classList.remove('shown');
    frame.getAnimations().forEach(an => an.cancel());   // fermeture pendant l'ouverture : on repart de l'état ouvert
    if (!reduce.matches && visible) {
      modal.classList.add('leaving');
      clearTimeout(open.t); modal.classList.remove('entering');
      closeAnim = frame.animate(morphKeyframes(card).reverse(), { duration: 520, easing: EASE_CLOSE, fill: 'forwards' });
    } else {
      closeAnim = frame.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' });
    }
    closeAnim.onfinish = done;
  }

  modal.addEventListener('click', e => { if (e.target === modal) close(); });   // clic en dehors du cadre
  $('.m-prev').addEventListener('click', () => showImage(imgIndex - 1, true));
  $('.m-next').addEventListener('click', () => showImage(imgIndex + 1, true));
  media.addEventListener('click', e => {
    if (!current || images(current).length < 2) return;
    const r = media.getBoundingClientRect();
    showImage(imgIndex + (e.clientX < r.left + r.width / 2 ? -1 : 1), true);
  });
  // Balayage (tactile)
  let sx = null, sy = null;
  media.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; });
  media.addEventListener('pointerup', e => {
    if (sx === null || !current) return;
    const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
    if (e.pointerType !== 'mouse' && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) && images(current).length > 1) {
      showImage(imgIndex + (dx < 0 ? 1 : -1), true);
    }
  });

  // Clavier : Échap, flèches, et Tab qui reste dans la fiche
  document.addEventListener('keydown', e => {
    if (!current) {
      if (mode !== 'scatter' || isMobile) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); focusT = Math.round(focusT) + 1; }
      if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); focusT = Math.round(focusT) - 1; }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowLeft' && images(current).length > 1) showImage(imgIndex - 1, true);
    else if (e.key === 'ArrowRight' && images(current).length > 1) showImage(imgIndex + 1, true);
    else if (e.key === 'Tab') {
      const f = [...modal.querySelectorAll('button')].filter(b => !b.closest('[hidden]'));
      if (!f.length) { e.preventDefault(); return; }
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ───────── Adresse (#work, #slug, #work/slug) et bouton retour ───────── */
  function parseHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (PAGE_WORK) { const sl = h.replace(/^work\/?/, ''); return { mode: 'work', slug: sl || null }; }
    if (h === 'work' || h.startsWith('work/')) return { mode: 'work', slug: h.split('/')[1] || null };
    return { mode: 'scatter', slug: h || null };
  }
  addEventListener('popstate', () => {
    const s = parseHash();
    if (current && (!s.slug || s.slug !== current.slug)) close({ fromPop: true });
    setMode(s.mode, { push: false });
    if (s.slug && (!current || current.slug !== s.slug)) open(s.slug, { push: false });
  });

  /* ───────── Redimensionnement ───────── */
  let rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { isMobile = mqMobile.matches; apply(false); if (current) sizeMedia(curRatio, false); }, 120);
  });

  /* ───────── Dock (assets/dock.js) ───────── */
  // Le dock est partagé par toutes les pages ; ici il pilote la grille et ouvre les fiches sans recharger.
  const dockApi = () => window.lbpDock || null;
  function dockReserve() {
    const d = document.getElementById('dock');
    return (d ? d.getBoundingClientRect().height : 58) + 16 + 28;
  }
  // « work » du dock : ouvre la page work.html (lien normal). Déjà dessus : retour en haut de la grille.
  addEventListener('lbp:work', e => {
    e.preventDefault();                          // déjà sur la page des projets : ni rechargement, ni changement de disposition
    scrollTo({ top: 0, behavior: reduce.matches ? 'auto' : 'smooth' });
  });
  addEventListener('lbp:open-project', e => {
    if (!allProjects.length) return;                   // projets pas encore chargés : le lien fait le travail
    e.preventDefault();
    open(e.detail.slug, { from: e.detail.from });
  });
  addEventListener('lbp:dock-ready', () => { if (projects.length) apply(false); });

  /* ───────── Démarrage ───────── */
  (async () => {
    // place le logo tout de suite (avant le chargement des projets) : aucun saut au rafraîchissement
    mode = parseHash().mode;
    apply(false);
    try { allProjects = await (await fetch('assets/projets.json')).json(); }
    catch (e) { console.error('projets.json introuvable', e); return; }
    // "corbeille": true → le projet n'est pas sur la scène, seulement dans la corbeille du dock
    projects = allProjects.filter(p => !p.corbeille);
    trashProjects = allProjects.filter(p => p.corbeille);
    build();
    const s = parseHash();
    mode = s.mode;
    apply(false);
    requestAnimationFrame(() => {
      cards.forEach((c, i) => { c.style.transitionDelay = (i * 25) + 'ms'; });
      stage.classList.add('ready');
      if (s.slug) open(s.slug, { push: false });
    });
    requestAnimationFrame(frameLoop);
    // Re-calcul une fois la police Allo chargée (la taille des boutons change la zone réservée au logo)
    document.fonts && document.fonts.ready.then(() => apply(false));
  })();
})();
