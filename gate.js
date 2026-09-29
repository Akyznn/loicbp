// gate.js — mini-protection par mot de passe (côté navigateur, PAS sécurisé à 100 %)
// À inclure dans le <head> de la toolbox ET de chaque outil :
// <script src="gate.js"></script>
(function () {
  // SHA-256 du mot de passe. Par défaut : "changeme"
  // Pour changer : ouvre la console du navigateur et lance
  // crypto.subtle.digest('SHA-256', new TextEncoder().encode('TON_MDP')).then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('')))
  var HASH = '057ba03d6c44104863dc7361fe4578965d1887360f90a0895882e58a6248fc86';
  var KEY = 'toolbox_ok';

  function unlocked() {
    try { return sessionStorage.getItem(KEY) === HASH; } catch (e) { return false; }
  }
  if (unlocked()) return;

  document.documentElement.style.visibility = 'hidden';

  async function sha(s) {
    var b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [].map.call(new Uint8Array(b), function (x) { return x.toString(16).padStart(2, '0'); }).join('');
  }

  window.addEventListener('DOMContentLoaded', function () {
    // masque le contenu, garde l'overlay visible
    Array.prototype.forEach.call(document.body.children, function (el) { el.style.display = 'none'; });
    document.documentElement.style.visibility = 'visible';

    var box = document.createElement('div');
    box.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#111;font-family:system-ui,sans-serif';
    box.innerHTML = '<div style="text-align:center"><input id="gate-pw" type="password" placeholder="•••••" autocomplete="off" style="font-size:18px;padding:12px 16px;border-radius:10px;border:1px solid #444;background:#1c1c1c;color:#fff;text-align:center;outline:none"><div id="gate-err" style="color:#e66;height:20px;margin-top:10px;font-size:14px"></div></div>';
    document.body.appendChild(box);

    var input = document.getElementById('gate-pw');
    input.focus();
    input.addEventListener('keydown', async function (e) {
      if (e.key !== 'Enter') return;
      if ((await sha(input.value)) === HASH) {
        try { sessionStorage.setItem(KEY, HASH); } catch (err) {}
        location.reload();
      } else {
        document.getElementById('gate-err').textContent = 'Non.';
        input.value = '';
      }
    });
  });
})();
