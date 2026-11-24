// Liste des outils de la toolbox — source unique, utilisée par toolbox.html et par le dock.
// Un objet par outil · img = capture 960×600 dans assets/previews/
// Les 4 premiers apparaissent dans le panneau « toolbox » du dock.
window.LBP_TOOLS = [
  { name: "Atelier Raster — trames, pointillé, couches", file: "tools/raster.html", img: "assets/previews/raster.webp", desc: "stochastique, trame AM, dithering, pointillisme, séparation riso" },
  { name: "Outils GIF et Perspective", file: "tools/stickers.html", img: "assets/previews/stickers.webp", desc: "cf titre lol" },
  { name: "Motion Studio", file: "tools/motion-studio.html", img: "assets/previews/motion-studio.webp", desc: "" },
  { name: "Atelier typo", file: "tools/typo.html", img: "assets/previews/typo.webp", desc: "" },
  { name: "PNG/SVG vers STL — extruder une image en STL imprimable", file: "tools/relief1.html", img: "assets/previews/relief1.webp", desc: "3D en gros" },
  { name: "Embossage — matrices mâle / femelle depuis un SVG", file: "tools/embossage.html", img: "assets/previews/embossage.webp", desc: "avec tolérance" },
  { name: "TRAME — image → ASCII/PIXEL", file: "tools/pixascii.html", img: "assets/previews/pixascii.webp", desc: "" },
  { name: "Feuilleté — animation image par image", file: "tools/feuillete.html", img: "assets/previews/feuillete.webp", desc: "" },
  { name: "Perspective — outil de mockup", file: "tools/perspemock.html", img: "assets/previews/perspemock.webp", desc: "" },
  { name: "Découpe en bloc", file: "tools/padc.html", img: "assets/previews/padc.webp", desc: "" },
  { name: "Motion · animation de logos", file: "tools/motion-logo.html", img: "assets/previews/motion-logo.webp", desc: "" },
  { name: "Imposition — PDF en livret", file: "tools/imposition.html", img: "assets/previews/imposition.webp", desc: "livret, cahiers, zine" },
  { name: "Studio Rendu — rendu 3D réaliste", file: "tools/rendu.html", img: "", desc: "OBJ/STL, matériaux, path tracing, PNG sans fond" }
];
