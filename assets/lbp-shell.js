/* =====================================================================
   lbp-shell.js — comportements communs des outils de la toolbox
   (architecture Bavure). À charger en fin de <body> :
     <script src="/assets/lbp-shell.js"></script>
   Fournit :
   - le curseur main + l'anneau pointillé qui épouse liens et boutons
   - window.LBP : toast(), download(), busy(), onFile(), seg(), pasteFromClipboard(), svgFromText()
   ===================================================================== */
(function () {
  "use strict";

  /* ── curseur main + anneau pointillé ── */
  var NS = "http://www.w3.org/2000/svg";
  var cur = document.getElementById("cursor");
  if (!cur) {
    cur = document.createElement("img");
    cur.id = "cursor"; cur.alt = ""; cur.width = 32; cur.height = 30; cur.setAttribute("aria-hidden", "true");
    cur.onload = function () { document.documentElement.classList.add("cc"); };
    cur.onerror = function () { cur.remove(); };
    cur.src = "/assets/curseur-main.png";
    document.body.prepend(cur);
  }
  var ring = document.getElementById("ring");
  if (!ring) {
    ring = document.createElementNS(NS, "svg"); ring.id = "ring"; ring.setAttribute("aria-hidden", "true");
    ["rb", "rw"].forEach(function (c) { var r = document.createElementNS(NS, "rect"); r.setAttribute("class", c); ring.appendChild(r); });
    document.body.prepend(ring);
  }
  var rects = ring.querySelectorAll("rect");
  var mx = -100, my = -100, fx = -100, fy = -100, target = null;
  document.addEventListener("mouseleave", function () { document.body.classList.remove("has-cursor"); target = null; });
  document.addEventListener("mousemove", function (e) {
    document.body.classList.add("has-cursor"); mx = e.clientX; my = e.clientY;
    if (cur && cur.isConnected) { cur.style.left = mx + "px"; cur.style.top = my + "px"; }
  });
  document.addEventListener("mouseover", function (e) {
    target = e.target && e.target.closest ? e.target.closest("[data-ants], a, button") : null;
  });
  var PAD = 6, REST = 26, st = { x: -100, y: -100, w: REST, h: REST, r: REST / 2, o: .55 };
  (function frame() {
    fx += (mx - fx) * .11; fy += (my - fy) * .11;
    var g, k;
    if (target && target.isConnected) {
      var b = target.getBoundingClientRect();
      g = { x: b.left - PAD, y: b.top - PAD, w: b.width + PAD * 2, h: b.height + PAD * 2, r: 0, o: 1 }; k = .28;
    } else { g = { x: fx - REST / 2, y: fy - REST / 2, w: REST, h: REST, r: REST / 2, o: .55 }; k = .22; }
    for (var p in g) st[p] += (g[p] - st[p]) * k;
    var w = Math.max(st.w, 0), h = Math.max(st.h, 0), r = Math.min(Math.max(st.r, 0), w / 2, h / 2);
    rects.forEach(function (el) { el.setAttribute("x", st.x + .5); el.setAttribute("y", st.y + .5); el.setAttribute("width", w); el.setAttribute("height", h); el.setAttribute("rx", r); });
    ring.style.opacity = st.o;
    requestAnimationFrame(frame);
  })();

  /* ── utilitaires ── */
  var DL = null;   // téléchargement via Claude quand la page tourne en artefact
  try { if (window.claude && window.claude.use) window.claude.use("downloads").then(function (d) { DL = d; }).catch(function () {}); } catch (e) {}

  var LBP = window.LBP = {};

  // Message bleu temporaire en bas de l'écran
  LBP.toast = function (msg) {
    var t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2400);
  };

  // Télécharge un Blob (ou une chaîne)
  LBP.download = function (data, filename) {
    var blob = data instanceof Blob ? data : new Blob([data]);
    if (DL) {
      DL.save({ filename: filename, data: blob }).catch(function (e) { if (!e || e.code !== "declined") LBP.toast("Téléchargement impossible ici"); });
      return;
    }
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
  };

  // Voile flou pendant un calcul long : LBP.busy(true, "Calcul de l'export…") / LBP.busy(false)
  LBP.busy = function (on, label) {
    var b = document.querySelector(".busy");
    if (on && !b) { b = document.createElement("div"); b.className = "busy"; b.textContent = label || "Calcul…"; document.body.appendChild(b); }
    if (!on && b) b.remove();
  };

  // Glisser-déposer sur toute la fenêtre + collage (⌘V) : cb(file)
  LBP.onFile = function (cb, opts) {
    opts = opts || {};
    var accept = opts.accept || function (f) { return /^image\//.test(f.type) || /\.svg$/i.test(f.name || ""); };
    var overlay = null, depth = 0;
    var isFile = function (e) { return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types, "Files") >= 0; };
    window.addEventListener("dragenter", function (e) {
      if (!isFile(e)) return; e.preventDefault(); depth++;
      if (!overlay) { overlay = document.createElement("div"); overlay.className = "drop"; overlay.textContent = opts.label || "Déposez le fichier"; document.body.appendChild(overlay); }
    });
    window.addEventListener("dragover", function (e) { if (isFile(e)) e.preventDefault(); });
    window.addEventListener("dragleave", function () { if (--depth <= 0 && overlay) { overlay.remove(); overlay = null; depth = 0; } });
    window.addEventListener("drop", function (e) {
      if (!isFile(e)) return; e.preventDefault(); depth = 0;
      if (overlay) { overlay.remove(); overlay = null; }
      var f = e.dataTransfer.files[0];
      if (f && accept(f)) cb(f); else if (f) LBP.toast("Format non reconnu");
    });
    window.addEventListener("paste", function (e) {
      var t = e.target;
      if (t && (t.tagName === "TEXTAREA" || t.isContentEditable || (t.tagName === "INPUT" && /^(text|number|search|email|url|password)$/.test(t.type)))) return;
      var f = LBP.fileFromClipboardData(e.clipboardData, accept);
      if (f) { e.preventDefault(); cb(f); }
      else if (e.clipboardData && e.clipboardData.types && e.clipboardData.types.length) LBP.toast(PASTE_HELP);
    });
    LBP._onFileCb = cb; LBP._onFileAccept = accept;
  };

  /* ── Presse-papiers : copier-coller depuis Illustrator, Figma, Inkscape… ──
     Illustrator place le code SVG en texte (Préférences › Gestion du presse-papiers › SVG).
     On préfère toujours le SVG (vectoriel) à une image bitmap quand les deux sont là. */
  var PASTE_HELP = "Rien d'exploitable : dans Illustrator, activez Préférences › Presse-papiers › SVG";
  LBP.svgFromText = function (txt, name) {
    if (!txt) return null;
    var m = /<svg[\s\S]*<\/svg>/i.exec(txt);
    if (!m) return null;
    var head = /<\?xml[^>]*>/i.exec(txt);
    var code = m[0];
    if (!/xmlns=/.test(code.slice(0, code.indexOf(">")))) code = code.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
    return new File([(head ? head[0] + "\n" : "") + code], name || "presse-papiers.svg", { type: "image/svg+xml" });
  };
  LBP.fileFromClipboardData = function (cd, accept) {
    if (!cd) return null;
    accept = accept || LBP._onFileAccept || function () { return true; };
    var items = cd.items || [], i, f;
    for (i = 0; i < items.length; i++) if (items[i].kind === "file" && items[i].type === "image/svg+xml") { f = items[i].getAsFile(); if (f && accept(f)) return f; }
    var svg = LBP.svgFromText(cd.getData("image/svg+xml")) || LBP.svgFromText(cd.getData("text/plain")) || LBP.svgFromText(cd.getData("text/html"));
    if (svg && accept(svg)) return svg;
    for (i = 0; i < items.length; i++) if (items[i].kind === "file") { f = items[i].getAsFile(); if (f && accept(f)) return f; }
    return null;
  };
  // Bouton « Coller » (sans clavier, ou sur mobile) : lit le presse-papiers puis appelle cb(file)
  LBP.pasteFromClipboard = async function (cb) {
    cb = cb || LBP._onFileCb;
    var accept = LBP._onFileAccept || function () { return true; };
    if (!navigator.clipboard) { LBP.toast("Collez avec ⌘V / Ctrl+V"); return; }
    try {
      if (navigator.clipboard.read) {
        var items = await navigator.clipboard.read(), imgs = [];
        for (var i = 0; i < items.length; i++) {
          var it = items[i];
          for (var k = 0; k < it.types.length; k++) {
            var ty = it.types[k];
            if (ty === "image/svg+xml" || ty === "text/plain" || ty === "text/html") {
              var f = LBP.svgFromText(await (await it.getType(ty)).text());
              if (f && accept(f)) { cb(f); return; }
            } else if (/^image\//.test(ty)) imgs.push([it, ty]);
          }
        }
        if (imgs.length) {
          var b = await imgs[0][0].getType(imgs[0][1]);
          var fi = new File([b], "presse-papiers." + (imgs[0][1].split("/")[1] || "png"), { type: imgs[0][1] });
          if (accept(fi)) { cb(fi); return; }
        }
      } else {
        var f2 = LBP.svgFromText(await navigator.clipboard.readText());
        if (f2 && accept(f2)) { cb(f2); return; }
      }
      LBP.toast(PASTE_HELP);
    } catch (err) {
      LBP.toast("Accès refusé : collez avec ⌘V / Ctrl+V");
    }
  };

  // Boutons segmentés <div class="seg"><button data-v="a" aria-pressed="true">…</button>…</div> : cb(valeur)
  LBP.seg = function (el, cb) {
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-v]"); if (!b) return;
      Array.prototype.forEach.call(el.children, function (x) { x.setAttribute("aria-pressed", x === b); });
      cb(b.dataset.v);
    });
  };
})();
