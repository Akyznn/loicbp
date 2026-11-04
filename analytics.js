// analytics.js — mesure d'audience Umami (sans cookie, pas de bandeau RGPD)
// À inclure dans le <head> de chaque page, AVANT gate.js :
//   pages à la racine : <script src="analytics.js"></script>
//   tools/*.html      : <script src="../analytics.js"></script>
//
// Événements : ajouter data-umami-event="nom" sur un lien/bouton,
// ou appeler window.lbpTrack('nom', { cle: 'valeur' }) en JS.
(function () {
  // ▼ Coller ici le « Website ID » donné par Umami Cloud (Settings → Websites)
  var UMAMI_ID = '';
  // Ne compte que le vrai site (pas les tests en local)
  var DOMAINS = 'loicbp.fr,www.loicbp.fr';

  var queue = [];
  window.lbpTrack = function (name, data) {
    try {
      if (window.umami && window.umami.track) window.umami.track(name, data);
      else queue.push([name, data]);
    } catch (e) {}
  };

  if (!UMAMI_ID) return;

  var s = document.createElement('script');
  s.defer = true;
  s.src = 'https://cloud.umami.is/script.js';
  s.setAttribute('data-website-id', UMAMI_ID);
  s.setAttribute('data-domains', DOMAINS);
  s.onload = function () {
    var tries = 0;
    var t = setInterval(function () {
      if (window.umami && window.umami.track) {
        clearInterval(t);
        while (queue.length) { var a = queue.shift(); window.umami.track(a[0], a[1]); }
      } else if (++tries > 50) clearInterval(t);
    }, 200);
  };
  document.head.appendChild(s);
})();
