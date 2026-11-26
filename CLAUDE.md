# loicbp.fr — consignes pour Claude

Site perso de Loïc (graphiste). Hébergé sur GitHub Pages, domaine www.loicbp.fr.
Loïc est le directeur artistique : on respecte sa DA, et toute déviation se demande avant
(pas d'invention, pas de proposition délirante).

## DA générale
- Typo **Allo** (`/assets/fonts/AlloVariable.woff2`, `font-variation-settings:"ROND" 20`) pour les titres,
  boutons, valeurs chiffrées ; **Piazzolla** (Google Fonts) pour tout le reste.
- Textes en **minuscules**, jamais en capitales. Interlettrage serré sur les titres.
- Encre `#0f0f0f`, bleu `#2A3DFF` (unique couleur d'accent), fond damier `#fdfdfd`/`#efefef` + `assets/trame.svg`.
- Sélection de texte : fond bleu, texte blanc. Liens/boutons : pas de soulignement, surlignage bleu.
- **Pas de mode sombre.** Animations sobres et rapides.

## Créer un nouvel outil de la toolbox
Tout nouvel outil reprend **l'architecture visuelle de Bavure** (`tools/bavure.html`) :
titre en haut à gauche, scène centrée sur le damier, panneau de réglages flou à droite,
dock d'actions en bas, curseur main + anneau pointillé.

1. **Partir de `tools/_modele.html`** (copie renommée en minuscules, sans accent, dans `tools/`).
   Il est déjà câblé : gate.js, analytics.js, polices, `assets/lbp-shell.css`, `assets/lbp-shell.js`.
2. **Ne pas réécrire la coquille** : la mise en page et les composants viennent de
   `assets/lbp-shell.css`. Le `<style>` de l'outil ne contient que ce qui lui est propre.
3. Composants à utiliser (classes de lbp-shell.css) :
   - en-tête `header.top` (h1 + sous-titre de trois mots en italique) et `a.back` « ← toolbox » ;
   - scène `main.stage > .sheet > .frame > canvas#out`, état vide `.empty` (cadre pointillé animé) ;
   - panneau `aside.panel` → groupes `section.grp` avec `h2` (+ dé bleu `.dice` pour randomiser le groupe),
     réglages `.ctl` (label + `.val` + range), `.ctl.wide` (select), `.ctl.inline` (case à cocher),
     `.seg` (boutons segmentés, `aria-pressed`), `.swatches`/`.sw` (pastilles couleur), `.hint`, `.stats` ;
   - boutons `.btn` (bleu plein) et `.btn.ghost` (bleu filaire) ;
   - dock `nav.dock` → `.di` (icône ronde, info-bulle via `data-label`), `.di.key` pour l'export, `.sep`.
4. Comportements communs via `window.LBP` (lbp-shell.js) : `LBP.toast(msg)`, `LBP.download(blob, nom)`,
   `LBP.busy(true|false, texte)`, `LBP.onFile(cb)` (glisser-déposer + ⌘V, y compris le SVG copié
   dans Illustrator), `LBP.pasteFromClipboard(cb)` (bouton « coller » du dock), `LBP.seg(el, cb)`.
5. Toujours prévoir : une **démo** en un clic, l'**import par glisser-déposer et collage**,
   un **export** (PNG en priorité, SVG si vectoriel), des réglages par défaut qui donnent
   déjà un beau résultat, un affichage correct sur mobile (le shell gère la mise en page).
6. Titre d'onglet `lbp — nom`, interface et messages en français, vouvoiement comme dans Bavure.
7. Référencer l'outil dans `assets/tools.js` (nom, fichier, capture, description courte)
   et ajouter une capture **960×600 .webp** dans `assets/previews/` (outil ouvert avec la démo).

## Anciens outils
Les outils antérieurs à Bavure gardent leur propre mise en page ; ils sont habillés aux couleurs
et typos de la DA par `assets/lbp-tools.js` + `assets/lbp-tools.css` (une ligne dans leur `<head>`).
Ne pas charger cette couche dans un outil construit sur `lbp-shell`.
