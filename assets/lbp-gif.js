/* =====================================================================
   lbp-gif.js — GIF animés pour les outils de la toolbox
   <script src="/assets/lbp-gif.js"></script>
   - LBP_GIF.decode(arrayBuffer, {maxSide, maxFrames}) → {W, H, frames:[{bmp, delay}], count, truncated}
       images recomposées (disposal géré), delay en ms
   - LBP_GIF.encode(frames, {delays, transparent, loop}) → Blob image/gif
       frames : tableau d'ImageData de même taille ; palette globale partagée
   Décodeur repris de tools/motion-studio.html ; encodeur gifenc 1.0.3 (MIT, Matt DesLauriers).
   ===================================================================== */
/* gifenc 1.0.3, MIT, Matt DesLauriers */
window.GIFENC=(function(){var X={signature:"GIF",version:"89a",trailer:59,extensionIntroducer:33,applicationExtensionLabel:255,graphicControlExtensionLabel:249,imageSeparator:44,signatureSize:3,versionSize:3,globalColorTableFlagMask:128,colorResolutionMask:112,sortFlagMask:8,globalColorTableSizeMask:7,applicationIdentifierSize:8,applicationAuthCodeSize:3,disposalMethodMask:28,userInputFlagMask:2,transparentColorFlagMask:1,localColorTableFlagMask:128,interlaceFlagMask:64,idSortFlagMask:32,localColorTableSizeMask:7};function F(t=256){let e=0,s=new Uint8Array(t);return{get buffer(){return s.buffer},reset(){e=0},bytesView(){return s.subarray(0,e)},bytes(){return s.slice(0,e)},writeByte(r){n(e+1),s[e]=r,e++},writeBytes(r,o=0,i=r.length){n(e+i);for(let c=0;c<i;c++)s[e++]=r[c+o]},writeBytesView(r,o=0,i=r.byteLength){n(e+i),s.set(r.subarray(o,o+i),e),e+=i}};function n(r){var o=s.length;if(o>=r)return;var i=1024*1024;r=Math.max(r,o*(o<i?2:1.125)>>>0),o!=0&&(r=Math.max(r,256));let c=s;s=new Uint8Array(r),e>0&&s.set(c.subarray(0,e),0)}}var O=12,J=5003,lt=[0,1,3,7,15,31,63,127,255,511,1023,2047,4095,8191,16383,32767,65535];function at(t,e,s,n,r=F(512),o=new Uint8Array(256),i=new Int32Array(J),c=new Int32Array(J)){let x=i.length,a=Math.max(2,n);o.fill(0),c.fill(0),i.fill(-1);let l=0,f=0,g=a+1,h=g,b=!1,w=h,_=(1<<w)-1,u=1<<g-1,k=u+1,B=u+2,p=0,A=s[0],z=0;for(let y=x;y<65536;y*=2)++z;z=8-z,r.writeByte(a),I(u);let d=s.length;for(let y=1;y<d;y++){t:{let m=s[y],v=(m<<O)+A,M=m<<z^A;if(i[M]===v){A=c[M];break t}let V=M===0?1:x-M;for(;i[M]>=0;)if(M-=V,M<0&&(M+=x),i[M]===v){A=c[M];break t}I(A),A=m,B<1<<O?(c[M]=B++,i[M]=v):(i.fill(-1),B=u+2,b=!0,I(u))}}return I(A),I(k),r.writeByte(0),r.bytesView();function I(y){for(l&=lt[f],f>0?l|=y<<f:l=y,f+=w;f>=8;)o[p++]=l&255,p>=254&&(r.writeByte(p),r.writeBytesView(o,0,p),p=0),l>>=8,f-=8;if((B>_||b)&&(b?(w=h,_=(1<<w)-1,b=!1):(++w,_=w===O?1<<w:(1<<w)-1)),y==k){for(;f>0;)o[p++]=l&255,p>=254&&(r.writeByte(p),r.writeBytesView(o,0,p),p=0),l>>=8,f-=8;p>0&&(r.writeByte(p),r.writeBytesView(o,0,p),p=0)}}}var $=at;function D(t,e,s){return t<<8&63488|e<<2&992|s>>3}function G(t,e,s,n){return t>>4|e&240|(s&240)<<4|(n&240)<<8}function j(t,e,s){return t>>4<<8|e&240|s>>4}function R(t,e,s){return t<e?e:t>s?s:t}function T(t){return t*t}function tt(t,e,s){var n=0,r=1e100;let o=t[e],i=o.cnt,c=o.ac,x=o.rc,a=o.gc,l=o.bc;for(var f=o.fw;f!=0;f=t[f].fw){let h=t[f],b=h.cnt,w=i*b/(i+b);if(!(w>=r)){var g=0;s&&(g+=w*T(h.ac-c),g>=r)||(g+=w*T(h.rc-x),!(g>=r)&&(g+=w*T(h.gc-a),!(g>=r)&&(g+=w*T(h.bc-l),!(g>=r)&&(r=g,n=f))))}}o.err=r,o.nn=n}function Q(){return{ac:0,rc:0,gc:0,bc:0,cnt:0,nn:0,fw:0,bk:0,tm:0,mtm:0,err:0}}function ut(t,e){let s=e==="rgb444"?4096:65536,n=new Array(s),r=t.length;if(e==="rgba4444")for(let o=0;o<r;++o){let i=t[o],c=i>>24&255,x=i>>16&255,a=i>>8&255,l=i&255,f=G(l,a,x,c),g=f in n?n[f]:n[f]=Q();g.rc+=l,g.gc+=a,g.bc+=x,g.ac+=c,g.cnt++}else if(e==="rgb444")for(let o=0;o<r;++o){let i=t[o],c=i>>16&255,x=i>>8&255,a=i&255,l=j(a,x,c),f=l in n?n[l]:n[l]=Q();f.rc+=a,f.gc+=x,f.bc+=c,f.cnt++}else for(let o=0;o<r;++o){let i=t[o],c=i>>16&255,x=i>>8&255,a=i&255,l=D(a,x,c),f=l in n?n[l]:n[l]=Q();f.rc+=a,f.gc+=x,f.bc+=c,f.cnt++}return n}function H(t,e,s={}){let{format:n="rgb565",clearAlpha:r=!0,clearAlphaColor:o=0,clearAlphaThreshold:i=0,oneBitAlpha:c=!1}=s;if(!t||!t.buffer)throw new Error("quantize() expected RGBA Uint8Array data");if(!(t instanceof Uint8Array)&&!(t instanceof Uint8ClampedArray))throw new Error("quantize() expected RGBA Uint8Array data");let x=new Uint32Array(t.buffer),a=s.useSqrt!==!1,l=n==="rgba4444",f=ut(x,n),g=f.length,h=g-1,b=new Uint32Array(g+1);for(var w=0,u=0;u<g;++u){let C=f[u];if(C!=null){var _=1/C.cnt;l&&(C.ac*=_),C.rc*=_,C.gc*=_,C.bc*=_,f[w++]=C}}T(e)/w<.022&&(a=!1);for(var u=0;u<w-1;++u)f[u].fw=u+1,f[u+1].bk=u,a&&(f[u].cnt=Math.sqrt(f[u].cnt));a&&(f[u].cnt=Math.sqrt(f[u].cnt));var k,B,p;for(u=0;u<w;++u){tt(f,u,!1);var A=f[u].err;for(B=++b[0];B>1&&(p=B>>1,!(f[k=b[p]].err<=A));B=p)b[B]=k;b[B]=u}var z=w-e;for(u=0;u<z;){for(var d;;){var I=b[1];if(d=f[I],d.tm>=d.mtm&&f[d.nn].mtm<=d.tm)break;d.mtm==h?I=b[1]=b[b[0]--]:(tt(f,I,!1),d.tm=u);var A=f[I].err;for(B=1;(p=B+B)<=b[0]&&(p<b[0]&&f[b[p]].err>f[b[p+1]].err&&p++,!(A<=f[k=b[p]].err));B=p)b[B]=k;b[B]=I}var y=f[d.nn],m=d.cnt,v=y.cnt,_=1/(m+v);l&&(d.ac=_*(m*d.ac+v*y.ac)),d.rc=_*(m*d.rc+v*y.rc),d.gc=_*(m*d.gc+v*y.gc),d.bc=_*(m*d.bc+v*y.bc),d.cnt+=y.cnt,d.mtm=++u,f[y.bk].fw=y.fw,f[y.fw].bk=y.bk,y.mtm=h}let M=[];var V=0;for(u=0;;++V){let L=R(Math.round(f[u].rc),0,255),C=R(Math.round(f[u].gc),0,255),Y=R(Math.round(f[u].bc),0,255),E=255;if(l){if(E=R(Math.round(f[u].ac),0,255),c){let st=typeof c=="number"?c:127;E=E<=st?0:255}r&&E<=i&&(L=C=Y=o,E=0)}let K=l?[L,C,Y,E]:[L,C,Y];if(xt(M,K)||M.push(K),(u=f[u].fw)==0)break}return M}function xt(t,e){for(let s=0;s<t.length;s++){let n=t[s],r=n[0]===e[0]&&n[1]===e[1]&&n[2]===e[2],o=n.length>=4&&e.length>=4?n[3]===e[3]:!0;if(r&&o)return!0}return!1}function U(t,e){var s=0,n;for(n=0;n<t.length;n++){let r=t[n]-e[n];s+=r*r}return s}function P(t,e){return e>1?Math.round(t/e)*e:t}function et(t,{roundRGB:e=5,roundAlpha:s=10,oneBitAlpha:n=null}={}){let r=new Uint32Array(t.buffer);for(let o=0;o<r.length;o++){let i=r[o],c=i>>24&255,x=i>>16&255,a=i>>8&255,l=i&255;if(c=P(c,s),n){let f=typeof n=="number"?n:127;c=c<=f?0:255}l=P(l,e),a=P(a,e),x=P(x,e),r[o]=c<<24|x<<16|a<<8|l<<0}}function nt(t,e,s="rgb565"){if(!t||!t.buffer)throw new Error("quantize() expected RGBA Uint8Array data");if(!(t instanceof Uint8Array)&&!(t instanceof Uint8ClampedArray))throw new Error("quantize() expected RGBA Uint8Array data");if(e.length>256)throw new Error("applyPalette() only works with 256 colors or less");let n=new Uint32Array(t.buffer),r=n.length,o=s==="rgb444"?4096:65536,i=new Uint8Array(r),c=new Array(o),x=s==="rgba4444";if(s==="rgba4444")for(let a=0;a<r;a++){let l=n[a],f=l>>24&255,g=l>>16&255,h=l>>8&255,b=l&255,w=G(b,h,g,f),_=w in c?c[w]:c[w]=gt(b,h,g,f,e);i[a]=_}else{let a=s==="rgb444"?j:D;for(let l=0;l<r;l++){let f=n[l],g=f>>16&255,h=f>>8&255,b=f&255,w=a(b,h,g),_=w in c?c[w]:c[w]=bt(b,h,g,e);i[l]=_}}return i}function gt(t,e,s,n,r){let o=0,i=1e100;for(let c=0;c<r.length;c++){let x=r[c],a=x[3],l=q(a-n);if(l>i)continue;let f=x[0];if(l+=q(f-t),l>i)continue;let g=x[1];if(l+=q(g-e),l>i)continue;let h=x[2];l+=q(h-s),!(l>i)&&(i=l,o=c)}return o}function bt(t,e,s,n){let r=0,o=1e100;for(let i=0;i<n.length;i++){let c=n[i],x=c[0],a=q(x-t);if(a>o)continue;let l=c[1];if(a+=q(l-e),a>o)continue;let f=c[2];a+=q(f-s),!(a>o)&&(o=a,r=i)}return r}function rt(t,e,s=5){if(!t.length||!e.length)return;let n=t.map(i=>i.slice(0,3)),r=s*s,o=t[0].length;for(let i=0;i<e.length;i++){let c=e[i];c.length<o?c=[c[0],c[1],c[2],255]:c.length>o?c=c.slice(0,3):c=c.slice();let x=N(n,c.slice(0,3),U),a=x[0],l=x[1];l>0&&l<=r&&(t[a]=c)}}function q(t){return t*t}function W(t,e,s=U){let n=Infinity,r=-1;for(let o=0;o<t.length;o++){let i=t[o],c=s(e,i);c<n&&(n=c,r=o)}return r}function N(t,e,s=U){let n=Infinity,r=-1;for(let o=0;o<t.length;o++){let i=t[o],c=s(e,i);c<n&&(n=c,r=o)}return[r,n]}function ot(t,e,s=U){return t[W(t,e,s)]}function ct(t={}){let{initialCapacity:e=4096,auto:s=!0}=t,n=F(e),r=5003,o=new Uint8Array(256),i=new Int32Array(r),c=new Int32Array(r),x=!1;return{reset(){n.reset(),x=!1},finish(){n.writeByte(X.trailer)},bytes(){return n.bytes()},bytesView(){return n.bytesView()},get buffer(){return n.buffer},get stream(){return n},writeHeader:a,writeFrame(l,f,g,h={}){let{transparent:b=!1,transparentIndex:w=0,delay:_=0,palette:u=null,repeat:k=0,colorDepth:B=8,dispose:p=-1}=h,A=!1;if(s?x||(A=!0,a(),x=!0):A=Boolean(h.first),f=Math.max(0,Math.floor(f)),g=Math.max(0,Math.floor(g)),A){if(!u)throw new Error("First frame must include a { palette } option");pt(n,f,g,u,B),it(n,u),k>=0&&dt(n,k)}let z=Math.round(_/10);wt(n,p,z,b,w);let d=Boolean(u)&&!A;ht(n,f,g,d?u:null),d&&it(n,u),yt(n,l,f,g,B,o,i,c)}};function a(){ft(n,"GIF89a")}}function wt(t,e,s,n,r){t.writeByte(33),t.writeByte(249),t.writeByte(4),r<0&&(r=0,n=!1);var o,i;n?(o=1,i=2):(o=0,i=0),e>=0&&(i=e&7),i<<=2;let c=0;t.writeByte(0|i|c|o),S(t,s),t.writeByte(r||0),t.writeByte(0)}function pt(t,e,s,n,r=8){let o=1,i=0,c=Z(n.length)-1,x=o<<7|r-1<<4|i<<3|c,a=0,l=0;S(t,e),S(t,s),t.writeBytes([x,a,l])}function dt(t,e){t.writeByte(33),t.writeByte(255),t.writeByte(11),ft(t,"NETSCAPE2.0"),t.writeByte(3),t.writeByte(1),S(t,e),t.writeByte(0)}function it(t,e){let s=1<<Z(e.length);for(let n=0;n<s;n++){let r=[0,0,0];n<e.length&&(r=e[n]),t.writeByte(r[0]),t.writeByte(r[1]),t.writeByte(r[2])}}function ht(t,e,s,n){if(t.writeByte(44),S(t,0),S(t,0),S(t,e),S(t,s),n){let r=0,o=0,i=Z(n.length)-1;t.writeByte(128|r|o|0|i)}else t.writeByte(0)}function yt(t,e,s,n,r=8,o,i,c){$(s,n,e,r,t,o,i,c)}function S(t,e){t.writeByte(e&255),t.writeByte(e>>8&255)}function ft(t,e){for(var s=0;s<e.length;s++)t.writeByte(e.charCodeAt(s))}function Z(t){return Math.max(Math.ceil(Math.log2(t)),1)}var Bt=ct;
return {GIFEncoder:ct,applyPalette:nt,quantize:H};})();

(function () {
  "use strict";
function gifLzw(minCode, data, npix) {
  const out = new Uint8Array(npix), clear = 1 << minCode, eoi = clear + 1;
  let size = minCode + 1, mask = (1 << size) - 1, next = eoi + 1;
  const prefix = new Int16Array(4096), suffix = new Uint8Array(4096), stack = new Uint8Array(4097);
  for (let i = 0; i < clear; i++) { prefix[i] = -1; suffix[i] = i; }
  let datum = 0, bits = 0, prev = -1, first = 0, op = 0, sp = 0, i = 0;
  outer: while (op < npix) {
    while (bits < size) { if (i >= data.length) break outer; datum |= data[i++] << bits; bits += 8; }
    const code = datum & mask; datum >>>= size; bits -= size;
    if (code === clear) { size = minCode + 1; mask = (1 << size) - 1; next = eoi + 1; prev = -1; continue; }
    if (code === eoi) break;
    if (prev === -1) { if (code >= clear) break; out[op++] = suffix[code]; prev = code; first = code; continue; }
    let c = code;
    if (code >= next) { stack[sp++] = first; c = prev; }
    while (c >= clear) { stack[sp++] = suffix[c]; c = prefix[c]; if (sp > 4096) break outer; }
    first = suffix[c]; stack[sp++] = first;
    if (next < 4096) { prefix[next] = prev; suffix[next] = first; next++; if ((next & mask) === 0 && next < 4096) { size++; mask = (1 << size) - 1; } }
    prev = code;
    while (sp > 0 && op < npix) out[op++] = stack[--sp];
  }
  return out;
}
function parseGif(buf) {
  const d = new Uint8Array(buf), r16 = p => d[p] | (d[p + 1] << 8);
  if (String.fromCharCode(d[0], d[1], d[2]) !== 'GIF') throw new Error('Ce fichier n\'est pas un GIF valide.');
  const W = r16(6), H = r16(8), flags = d[10]; let p = 13, gct = null;
  if (flags & 0x80) { const n = 2 << (flags & 7); gct = d.subarray(p, p + n * 3); p += n * 3; }
  const frames = []; let gce = { disposal: 0, delay: 0, trans: -1 };
  const skip = () => { while (p < d.length && d[p]) p += d[p] + 1; p++; };
  while (p < d.length) {
    const b = d[p++];
    if (b === 0x3B) break;
    if (b === 0x21) {
      const label = d[p++];
      if (label === 0xF9) { const pf = d[p + 1]; gce = { disposal: (pf >> 2) & 7, delay: r16(p + 2), trans: (pf & 1) ? d[p + 4] : -1 }; p += d[p] + 1; skip(); }
      else skip();
      continue;
    }
    if (b === 0x2C) {
      const x = r16(p), y = r16(p + 2), w = r16(p + 4), h = r16(p + 6), f = d[p + 8]; p += 9;
      let ct = gct; if (f & 0x80) { const n = 2 << (f & 7); ct = d.subarray(p, p + n * 3); p += n * 3; }
      const minCode = d[p++]; let len = 0, q = p; while (q < d.length && d[q]) { len += d[q]; q += d[q] + 1; }
      const data = new Uint8Array(len); let o = 0; while (p < d.length && d[p]) { const n = d[p]; data.set(d.subarray(p + 1, p + 1 + n), o); o += n; p += n + 1; } p++;
      let idx = gifLzw(minCode, data, w * h);
      if (f & 0x40) { const out = new Uint8Array(w * h); let row = 0; for (const [s, st] of [[0, 8], [4, 8], [2, 4], [1, 2]]) for (let yy = s; yy < h; yy += st) { out.set(idx.subarray(row * w, row * w + w), yy * w); row++; } idx = out; }
      frames.push({ x, y, w, h, ct, idx, ...gce });
      gce = { disposal: 0, delay: 0, trans: -1 };
      continue;
    }
    break;
  }
  return { W, H, frames };
}

  async function decode(buf, opts) {
    opts = opts || {};
    var P = parseGif(buf), W = P.W, H = P.H;
    var n = Math.min(P.frames.length, opts.maxFrames || 300);
    if (!n) throw new Error("Ce GIF ne contient aucune image.");
    var k = Math.min(1, (opts.maxSide || 1600) / Math.max(W, H), Math.sqrt(400e6 / (W * H * 4 * n)));
    var ow = Math.max(1, Math.round(W * k)), oh = Math.max(1, Math.round(H * k));
    var c = document.createElement("canvas"); c.width = W; c.height = H;
    var ctx = c.getContext("2d", { willReadFrequently: true });
    var pc = document.createElement("canvas"), pctx = pc.getContext("2d");
    var frames = [], prev = null, saved = null;
    for (var i = 0; i < n; i++) {
      var f = P.frames[i];
      if (prev) { if (prev.disposal === 2) ctx.clearRect(prev.x, prev.y, prev.w, prev.h); else if (prev.disposal === 3 && saved) ctx.putImageData(saved, 0, 0); }
      saved = f.disposal === 3 ? ctx.getImageData(0, 0, W, H) : null;
      if (f.w && f.h && f.ct) {
        pc.width = f.w; pc.height = f.h;
        var img = pctx.createImageData(f.w, f.h), px = img.data, ct = f.ct, nc = ct.length / 3;
        for (var j = 0; j < f.idx.length; j++) {
          var ci = f.idx[j]; if (ci === f.trans || ci >= nc) continue;
          var o = j * 4; px[o] = ct[ci * 3]; px[o + 1] = ct[ci * 3 + 1]; px[o + 2] = ct[ci * 3 + 2]; px[o + 3] = 255;
        }
        pctx.putImageData(img, 0, 0); ctx.drawImage(pc, f.x, f.y);
      }
      var cc = document.createElement("canvas"); cc.width = ow; cc.height = oh;
      var cx = cc.getContext("2d"); cx.imageSmoothingQuality = "high"; cx.drawImage(c, 0, 0, ow, oh);
      frames.push({ bmp: cc, delay: (f.delay < 2 ? 10 : f.delay) * 10 });
      prev = f;
      if (i % 15 === 14) await new Promise(function (r) { setTimeout(r, 0); });
    }
    return { W: ow, H: oh, frames: frames, count: n, truncated: P.frames.length > n };
  }

  // frames : ImageData[] ; palette globale calculée sur un échantillon d'images
  async function encode(frames, opts) {
    opts = opts || {};
    var E = window.GIFENC, W = frames[0].width, H = frames[0].height, tr = !!opts.transparent;
    var fmt = tr ? "rgba4444" : "rgb565";
    var step = Math.max(1, Math.floor(frames.length / 8)), parts = [];
    for (var i = 0; i < frames.length; i += step) parts.push(frames[i].data);
    var all = new Uint8ClampedArray(parts.reduce(function (s, p) { return s + p.length; }, 0)), off = 0;
    parts.forEach(function (p) { all.set(p, off); off += p.length; });
    var palette = E.quantize(all, 256, { format: fmt, oneBitAlpha: tr ? 100 : false, clearAlpha: tr, clearAlphaThreshold: 100 });
    var ti = tr ? palette.findIndex(function (c) { return c[3] === 0; }) : -1;
    var gif = E.GIFEncoder();
    for (var f = 0; f < frames.length; f++) {
      var d = frames[f].data;
      if (tr) for (var q = 3; q < d.length; q += 4) d[q] = d[q] < 100 ? 0 : 255;
      var idx = E.applyPalette(d, palette, fmt);
      gif.writeFrame(idx, W, H, {
        palette: f === 0 ? palette : undefined,
        delay: (opts.delays && opts.delays[f]) || 100,
        repeat: opts.loop === false ? -1 : 0,
        transparent: ti >= 0, transparentIndex: Math.max(0, ti), dispose: tr ? 2 : -1
      });
      if (opts.onProgress) opts.onProgress(f + 1, frames.length);
      if (f % 4 === 3) await new Promise(function (r) { setTimeout(r, 0); });
    }
    gif.finish();
    return new Blob([gif.bytesView()], { type: "image/gif" });
  }

  window.LBP_GIF = { decode: decode, encode: encode, parse: parseGif };
})();
