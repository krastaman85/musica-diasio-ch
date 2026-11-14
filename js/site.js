/* musica.diasio.ch · D.IAsio
   Sala d'ascolto: video YouTube caricato solo al clic (youtube-nocookie), testo che segue la voce parola per parola,
   mappa del brano (energia misurata sul master), versi condivisibili con il punto esatto, barra d'ascolto. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  root.classList.add("js");
  var riduci = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DATI = {};
  try { DATI = JSON.parse(doc.getElementById("dati-brani").textContent); } catch (e) { DATI = {}; }

  function mmss(t) { t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ":" + ("0" + (t % 60)).slice(-2); }
  function $(sel, el) { return (el || doc).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(sel)); }

  /* Statistiche senza cookie (GoatCounter), con il dominio nel percorso per non mescolarle con libri.diasio.ch */
  window.goatcounter = { path: function (p) { return location.host + p; } };
  (function () {
    if (location.hostname !== "musica.diasio.ch") return;
    var s = doc.createElement("script");
    s.async = true; s.src = "https://gc.zgo.at/count.js";
    s.setAttribute("data-goatcounter", "https://diasio.goatcounter.com/count");
    doc.head.appendChild(s);
  })();
  function evento(nome, titolo) {
    try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: "musica/" + nome, title: titolo || nome, event: true }); } catch (e) {}
  }

  /* Testata: si scurisce dopo l'hero; la spirale ruota un poco con lo scorrimento */
  var top = $(".top"), disco = $(".disco img"), hero = $(".hero");
  var tick = false;
  function suScroll() {
    tick = false;
    var y = window.scrollY || 0;
    if (top) top.classList.toggle("scuro", y > (hero ? hero.offsetHeight * 0.55 : 60));
    if (disco && !riduci && hero) disco.style.setProperty("--sp", Math.min(1, y / hero.offsetHeight).toFixed(3));
  }
  window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(suScroll); } }, { passive: true });
  suScroll();

  /* Comparsa allo scorrimento */
  (function () {
    var els = $$(".rv");
    if (riduci || !("IntersectionObserver" in window)) { els.forEach(function (el) { el.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, fr = $$(".rv", el.parentNode).filter(function (x) { return x.parentNode === el.parentNode; });
        el.style.setProperty("--d", Math.min(fr.indexOf(el), 4) * 0.08 + "s");
        el.classList.add("in"); io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* Avviso breve */
  var avviso = $(".avviso"), avvisoT;
  function avvisa(msg) {
    if (!avviso) return;
    avviso.textContent = msg; avviso.classList.add("vis");
    clearTimeout(avvisoT); avvisoT = setTimeout(function () { avviso.classList.remove("vis"); }, 2600);
  }

  /* API di YouTube: caricata solo al primo play */
  var apiPromessa = null;
  function caricaApi() {
    if (window.YT && window.YT.Player) return Promise.resolve();
    if (apiPromessa) return apiPromessa;
    apiPromessa = new Promise(function (ok, ko) {
      var prima = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () { if (prima) prima(); ok(); };
      var s = doc.createElement("script");
      s.src = "https://www.youtube.com/iframe_api"; s.async = true;
      s.onerror = function () { apiPromessa = null; ko(new Error("api")); };
      doc.head.appendChild(s);
    });
    return apiPromessa;
  }

  var brani = [], inCorso = null, ultimo = null;

  function Brano(el) {
    var id = el.getAttribute("data-brano"), d = DATI[id];
    if (!d) return;
    var self = this;
    this.el = el; this.id = id; this.d = d;
    this.playerBox = $(".player", el); this.facade = $(".facade", el); this.facadeDa = $(".facade-da", el);
    this.mappa = $(".mappa", el); this.oraT = $(".ora-t", el); this.sezOra = $(".sez-ora", el);
    this.scroll = $(".testo-scroll", el); this.segui = true; this.manuale = -1e9;
    this.righe = $$(".riga", el).map(function (r) {
      return { el: r, s: +r.getAttribute("data-s"), e: +r.getAttribute("data-e"),
        w: $$(".w", r).map(function (w) { return { el: w, s: +w.getAttribute("data-s"), e: +w.getAttribute("data-e") }; }) };
    });
    this.sezEl = $$(".sez", el).map(function (s) { return { el: s, t: +s.getAttribute("data-t") }; });
    this.tacche = $$(".tacche li", el).map(function (s) { return { el: s, t: +s.getAttribute("data-t") }; });
    this.yt = null; this.stato = -1; this.base = 0; this.at = 0; this.grezzo = -1;
    this.attiva = -1; this.sez = -1; this.E = 0; this.H = 0; this.hi = 0; this.avvio = 0; this.ariaT = -1;
    this.fx = riduci ? null : new Effetti(el, id);

    this.facade.addEventListener("click", function (ev) { ev.preventDefault(); self.suona(self.avvio || 0); });
    this.righe.forEach(function (r) {
      $(".r-btn", r.el).addEventListener("click", function () { self.suona(Math.max(0, r.s - 0.25)); });
      $(".cond", r.el).addEventListener("click", function () { self.condividi(r); });
    });
    var segui = $(".segui-testo", el);
    if (segui) segui.addEventListener("click", function () {
      self.segui = !self.segui; segui.setAttribute("aria-pressed", String(self.segui));
      segui.textContent = self.segui ? "Il testo segue la voce" : "Testo fermo";
      if (self.segui) { self.manuale = -1e9; self.centra(self.attiva, true); }
    });
    ["wheel", "touchmove"].forEach(function (tipo) {
      self.scroll.addEventListener(tipo, function () { self.manuale = performance.now(); }, { passive: true });
    });
    this.mappaEventi();
  }

  Brano.prototype.ora = function () {
    if (!this.yt || !this.yt.getCurrentTime) return this.avvio || 0;
    var t = this.yt.getCurrentTime() || 0, now = performance.now();
    if (t !== this.grezzo) { this.grezzo = t; this.base = t; this.at = now; }
    if (this.stato === 1) {
      var r = (this.yt.getPlaybackRate && this.yt.getPlaybackRate()) || 1;
      return Math.min(this.d.durata, this.base + (now - this.at) / 1000 * r);
    }
    return this.base;
  };

  Brano.prototype.suona = function (t) {
    var self = this;
    t = Math.max(0, Math.min(this.d.durata - 0.5, t || 0));
    brani.forEach(function (b) { if (b !== self && b.yt && b.stato === 1) b.yt.pauseVideo(); });
    this.el.classList.add("vivo");
    if (this.yt && this.yt.seekTo) {
      this.yt.seekTo(t, true); this.yt.playVideo(); this.base = t; this.at = performance.now(); this.grezzo = -1;
      return;
    }
    if (this.caricando) { this.avvio = t; return; }
    this.caricando = true; this.avvio = t;
    this.playerBox.classList.add("carica");
    caricaApi().then(function () {
      var box = doc.createElement("div");
      self.playerBox.appendChild(box);
      self.yt = new window.YT.Player(box, {
        host: "https://www.youtube-nocookie.com",
        videoId: self.d.yt,
        playerVars: { autoplay: 1, start: Math.floor(self.avvio), rel: 0, playsinline: 1, modestbranding: 1, iv_load_policy: 3, cc_load_policy: 0, origin: location.origin },
        events: {
          onReady: function (ev) {
            self.playerBox.classList.add("attivo");
            if (self.avvio > 0.5) ev.target.seekTo(self.avvio, true);
            ev.target.playVideo();
            try { if (ev.target.unloadModule) ev.target.unloadModule("captions"); } catch (e) {} // i sottotitoli automatici coprirebbero il testo già nel video
            var f = self.playerBox.querySelector("iframe");
            if (f) f.setAttribute("title", "Video di " + self.d.titolo + " su YouTube");
          },
          onStateChange: function (ev) { self.cambiaStato(ev.data); }
        }
      });
      evento("play/" + self.id, "Play " + self.d.titolo);
    }).catch(function () {
      self.caricando = false;
      window.open("https://www.youtube.com/watch?v=" + self.d.yt + "&t=" + Math.floor(t) + "s", "_blank", "noopener");
    });
  };

  Brano.prototype.cambiaStato = function (s) {
    this.stato = s; this.grezzo = -1;
    if (s === 1) {
      inCorso = this; ultimo = this;
      var self = this;
      brani.forEach(function (b) { if (b !== self && b.yt && b.stato === 1) b.yt.pauseVideo(); });
      avviaCiclo();
    } else if (inCorso === this) {
      inCorso = null;
    }
    aggiornaBarra();
  };

  Brano.prototype.centra = function (i, subito) {
    if (i < 0 || !this.segui) return;
    if (performance.now() - this.manuale < 5000 && !subito) return;
    var r = this.righe[i].el, sc = this.scroll;
    var y = r.offsetTop - sc.clientHeight * 0.34;
    if (Math.abs(sc.scrollTop - y) > 4) sc.scrollTo({ top: Math.max(0, y), behavior: riduci ? "auto" : "smooth" });
  };

  Brano.prototype.disegna = function (t) {
    var d = this.d, n = this.righe.length, i, a = -1;
    // riga attiva: l'ultima iniziata, finché non arriva una pausa lunga
    for (i = 0; i < n; i++) { if (this.righe[i].s <= t + 0.05) a = i; else break; }
    if (a >= 0 && t > this.righe[a].e + 2.2) a = -1 - a; // tra due righe: nessuna attiva, ma quelle prima restano "già cantate"
    var cant = a >= 0 ? a : -a - 2;
    if (a !== this.attiva) {
      for (i = 0; i < n; i++) {
        var r = this.righe[i].el;
        r.classList.toggle("on", i === a);
        r.classList.toggle("gia", i <= cant && i !== a);
      }
      if (this.attiva >= 0) this.righe[this.attiva].w.forEach(function (w) { w.el.classList.add("sung"); w.el.style.removeProperty("--p"); w.el.classList.remove("now"); });
      this.attiva = a;
      if (a >= 0) { this.centra(a); aggiornaRigaBarra(this); }
    }
    if (a >= 0) {
      this.righe[a].w.forEach(function (w) {
        if (t >= w.e) { if (!w.el.classList.contains("sung")) { w.el.classList.add("sung"); w.el.classList.remove("now"); w.el.style.removeProperty("--p"); } }
        else if (t >= w.s) { w.el.classList.remove("sung"); w.el.classList.add("now"); w.el.style.setProperty("--p", ((t - w.s) / Math.max(0.05, w.e - w.s) * 100).toFixed(1) + "%"); }
        else { w.el.classList.remove("sung", "now"); w.el.style.removeProperty("--p"); }
      });
    }
    // sezione corrente
    var s = -1;
    for (i = 0; i < d.sezioni.length; i++) if (d.sezioni[i][0] <= t + 0.05) s = i;
    if (s !== this.sez) {
      this.sez = s;
      var nome = s >= 0 ? d.sezioni[s][1] : "";
      this.tacche.forEach(function (x, k) { x.el.classList.toggle("qui", k === s); });
      this.sezEl.forEach(function (x) { x.el.classList.toggle("qui", x.t === (s >= 0 ? d.sezioni[s][0] : -1)); });
      if (a < 0 && s >= 0 && this.segui && performance.now() - this.manuale > 5000) {
        var se = this.sezEl.filter(function (x) { return x.t === d.sezioni[s][0]; })[0];
        if (se) this.scroll.scrollTo({ top: Math.max(0, se.el.offsetTop - this.scroll.clientHeight * 0.3), behavior: riduci ? "auto" : "smooth" });
      }
      this.nomeSez = nome;
      if (this.sezOra && nome) this.sezOra.textContent = nome;
      if (a < 0) aggiornaRigaBarra(this);
    }
    // mappa e tempo
    var p = (100 * t / d.durata).toFixed(2) + "%";
    this.mappa.style.setProperty("--p", p);
    var sec = Math.floor(t);
    if (sec !== this.ariaT) {
      this.ariaT = sec;
      this.oraT.textContent = mmss(t);
      this.mappa.setAttribute("aria-valuenow", String(sec));
      this.mappa.setAttribute("aria-valuetext", mmss(t) + " di " + mmss(d.durata) + (this.nomeSez ? ", " + this.nomeSez : ""));
    }
    // energia e colpi
    var en = d.energia[Math.min(d.energia.length - 1, Math.floor(t * 10))] / 100 || 0;
    this.E += (en - this.E) * 0.18;
    while (this.hi < d.colpi.length && d.colpi[this.hi] < t - 0.4) this.hi++;
    if (this.hi < d.colpi.length && d.colpi[this.hi] <= t) { this.H = 1; this.hi++; if (this.fx) this.fx.colpo(this.E); }
    this.H *= 0.88;
    this.el.style.setProperty("--e", this.E.toFixed(3));
    this.el.style.setProperty("--h", this.H.toFixed(3));
    if (ultimo === this) barraProg.style.setProperty("--p", p);
  };

  Brano.prototype.condividi = function (r) {
    var testo = r.w.map(function (w) { return w.el.textContent; }).join(" ");
    var url = location.origin + location.pathname + "?t=" + Math.floor(r.s) + "#" + this.d.slug;
    var dati = { title: this.d.titolo + " · D.IAsio", text: "«" + testo + "»  D.IAsio, " + this.d.titolo, url: url };
    evento("condividi/" + this.id, "Condividi " + this.d.titolo);
    if (navigator.share) { navigator.share(dati).catch(function () {}); return; }
    var copia = dati.text + "\n" + url;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(copia).then(function () { avvisa("Verso e link copiati"); }, function () { prompt("Copia il link del verso:", url); });
    } else { prompt("Copia il link del verso:", url); }
  };

  Brano.prototype.mappaEventi = function () {
    var self = this, m = this.mappa, hov = doc.createElement("span"), giu = false;
    hov.className = "mappa-hover"; m.appendChild(hov);
    function tDa(ev) { var r = m.getBoundingClientRect(); return Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)) * self.d.durata; }
    function sezDi(t) { var n = ""; self.d.sezioni.forEach(function (s) { if (s[0] <= t) n = s[1]; }); return n; }
    m.addEventListener("pointermove", function (ev) {
      var t = tDa(ev); hov.textContent = mmss(t) + " · " + sezDi(t);
      hov.style.left = (100 * t / self.d.durata) + "%";
      if (giu) { self.disegna(t); }
    });
    m.addEventListener("pointerdown", function (ev) { giu = true; try { m.setPointerCapture(ev.pointerId); } catch (e) {} });
    m.addEventListener("pointerup", function (ev) { if (!giu) return; giu = false; self.suona(tDa(ev)); });
    m.addEventListener("pointercancel", function () { giu = false; });
    m.addEventListener("keydown", function (ev) {
      var t = self.yt ? self.ora() : (self.avvio || 0), k = ev.key, nuovo = null;
      if (k === "ArrowRight" || k === "ArrowUp") nuovo = t + 5;
      else if (k === "ArrowLeft" || k === "ArrowDown") nuovo = t - 5;
      else if (k === "PageUp") nuovo = t + 30;
      else if (k === "PageDown") nuovo = t - 30;
      else if (k === "Home") nuovo = 0;
      else if (k === "End") nuovo = self.d.durata - 3;
      else if (k === " " || k === "Enter") { ev.preventDefault(); if (self.yt && self.stato === 1) self.yt.pauseVideo(); else self.suona(t); return; }
      if (nuovo !== null) { ev.preventDefault(); self.suona(nuovo); }
    });
  };

  /* Effetti: schegge di vetro che girano in spirale (Spirale di vetro), braci e cenere (L'Archivio della Sete) */
  function Effetti(el, tipo) {
    this.c = $(".brano-fx", el); this.el = el; this.tipo = tipo;
    this.x = this.c.getContext("2d"); this.p = []; this.w = 0; this.h = 0;
    var self = this;
    this.misura = function () {
      var dpr = Math.min(1.5, window.devicePixelRatio || 1);
      self.w = el.clientWidth; self.h = el.clientHeight;
      self.c.width = Math.round(self.w * dpr); self.c.height = Math.round(self.h * dpr);
      self.x.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    this.misura();
    window.addEventListener("resize", this.misura);
  }
  Effetti.prototype.nuova = function (E, scoppio) {
    var w = this.w, h = this.h, p;
    if (this.tipo === "spirale") {
      var cx = w * 0.5, cy = h * 0.45, ang = Math.random() * Math.PI * 2, rag = (scoppio ? 40 : Math.max(w, h) * (0.45 + Math.random() * 0.3));
      p = { k: "s", cx: cx, cy: cy, a: ang, r: rag, dr: scoppio ? (1.6 + Math.random() * 3 + E * 4) : -(0.25 + Math.random() * 0.6 + E * 1.2), da: (0.002 + Math.random() * 0.004) * (Math.random() < 0.5 ? 1 : 1),
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.06, s: 3 + Math.random() * 9, v: 0, vita: 1, mor: scoppio ? 0.012 : 0.004 };
    } else {
      var brace = scoppio || Math.random() < 0.55;
      p = brace
        ? { k: "b", x: Math.random() * w, y: h * (0.75 + Math.random() * 0.3), vx: (Math.random() - 0.5) * 0.5, vy: -(0.5 + Math.random() * 1.2 + E * 1.8) * (scoppio ? 1.8 : 1), s: 1 + Math.random() * 2.4, vita: 1, mor: 0.004 + Math.random() * 0.006, f: Math.random() * 6 }
        : { k: "c", x: Math.random() * w, y: -10, vx: (Math.random() - 0.3) * 0.4, vy: 0.3 + Math.random() * 0.6, s: 1 + Math.random() * 2, vita: 1, mor: 0.002, f: Math.random() * 6 };
    }
    this.p.push(p);
  };
  Effetti.prototype.colpo = function (E) { for (var i = 0; i < 6 + E * 10; i++) this.nuova(E, true); };
  Effetti.prototype.passo = function (E, attivo) {
    var x = this.x, w = this.w, h = this.h, i, p;
    if (!w) return;
    x.clearRect(0, 0, w, h);
    if (attivo && this.p.length < 70 + E * 110 && Math.random() < 0.35 + E * 0.6) this.nuova(E, false);
    x.globalCompositeOperation = "lighter";
    for (i = this.p.length - 1; i >= 0; i--) {
      p = this.p[i];
      p.vita -= p.mor * (attivo ? 1 : 3);
      if (p.vita <= 0) { this.p.splice(i, 1); continue; }
      if (p.k === "s") {
        p.a += p.da * (1 + E * 2); p.r += p.dr; p.rot += p.vr;
        if (p.r < 6) { this.p.splice(i, 1); continue; }
        var px = p.cx + Math.cos(p.a) * p.r * 1.25, py = p.cy + Math.sin(p.a) * p.r * 0.72;
        x.save(); x.translate(px, py); x.rotate(p.rot);
        x.strokeStyle = "rgba(170,230,255," + (0.5 * p.vita * (0.5 + E)).toFixed(3) + ")"; x.lineWidth = 0.9;
        x.fillStyle = "rgba(127,220,255," + (0.07 * p.vita).toFixed(3) + ")";
        x.beginPath(); x.moveTo(0, -p.s); x.lineTo(p.s * 0.55, p.s * 0.8); x.lineTo(-p.s * 0.7, p.s * 0.3); x.closePath(); x.fill(); x.stroke();
        x.restore();
      } else {
        p.f += 0.1; p.x += p.vx + Math.sin(p.f) * 0.3; p.y += p.vy;
        if (p.y < -20 || p.y > h + 20) { this.p.splice(i, 1); continue; }
        if (p.k === "b") {
          var a = p.vita * (0.6 + 0.4 * Math.sin(p.f * 2)) * (0.5 + E * 0.8);
          var g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 4);
          g.addColorStop(0, "rgba(255,200,120," + a.toFixed(3) + ")"); g.addColorStop(0.4, "rgba(255,110,40," + (a * 0.5).toFixed(3) + ")"); g.addColorStop(1, "rgba(255,80,20,0)");
          x.fillStyle = g; x.beginPath(); x.arc(p.x, p.y, p.s * 4, 0, 6.283); x.fill();
        } else {
          x.fillStyle = "rgba(200,200,205," + (0.22 * p.vita).toFixed(3) + ")";
          x.fillRect(p.x, p.y, p.s, p.s * 0.6);
        }
      }
    }
    x.globalCompositeOperation = "source-over";
  };

  /* Barra d'ascolto */
  var barra = $(".barra"), barraProg = barra ? $(".barra-prog", barra) : doc.createElement("i");
  var barraTit = barra && $(".barra-titolo", barra), barraRiga = barra && $(".barra-riga", barra), barraInfo = barra && $(".barra-info", barra);
  var playerVisibile = {};
  function aggiornaBarra() {
    if (!barra) return;
    var b = ultimo;
    var mostra = b && b.yt && (b.stato === 1 || b.stato === 2 || b.stato === 3) && !playerVisibile[b.id];
    barra.hidden = !mostra;
    if (!b) return;
    barra.classList.toggle("ferma", b.stato !== 1);
    $(".barra-pp", barra).setAttribute("aria-label", b.stato === 1 ? "Pausa" : "Riprendi");
    barra.style.setProperty("--acc", getComputedStyle(b.el).getPropertyValue("--acc"));
    barraTit.textContent = b.d.titolo;
    barraInfo.setAttribute("href", "#" + b.d.slug);
    aggiornaRigaBarra(b);
  }
  function aggiornaRigaBarra(b) {
    if (!barra || ultimo !== b) return;
    if (b.attiva >= 0) barraRiga.textContent = b.righe[b.attiva].w.map(function (w) { return w.el.textContent; }).join(" ");
    else barraRiga.textContent = b.nomeSez ? "♪ " + b.nomeSez : "♪";
  }
  if (barra) {
    $(".barra-pp", barra).addEventListener("click", function () {
      var b = ultimo; if (!b || !b.yt) return;
      if (b.stato === 1) b.yt.pauseVideo(); else b.yt.playVideo();
    });
  }

  /* Ciclo di disegno: gira solo mentre un brano suona (o gli effetti si spengono) */
  var ciclo = false;
  function avviaCiclo() { if (!ciclo) { ciclo = true; requestAnimationFrame(frame); } }
  function frame() {
    var vivo = false;
    brani.forEach(function (b) {
      var attivo = b.yt && b.stato === 1;
      if (attivo) { b.disegna(b.ora()); vivo = true; }
      else if (b.H > 0.01 || b.E > 0.01) { b.E *= 0.94; b.H *= 0.85; b.el.style.setProperty("--e", b.E.toFixed(3)); b.el.style.setProperty("--h", b.H.toFixed(3)); vivo = true; }
      if (b.fx && b.visibile && (attivo || b.fx.p.length)) { b.fx.passo(b.E, attivo); vivo = vivo || b.fx.p.length > 0; }
    });
    if (vivo) requestAnimationFrame(frame); else ciclo = false;
  }

  /* Avvio */
  $$(".brano").forEach(function (el) { var b = new Brano(el); if (b.d) brani.push(b); });
  if ("IntersectionObserver" in window) {
    var ioP = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        var b = brani.filter(function (x) { return x.playerBox === en.target; })[0];
        if (b) { playerVisibile[b.id] = en.isIntersecting; aggiornaBarra(); }
      });
    }, { threshold: 0.25 });
    var ioB = new IntersectionObserver(function (es) {
      es.forEach(function (en) { var b = brani.filter(function (x) { return x.el === en.target; })[0]; if (b) b.visibile = en.isIntersecting; });
    });
    brani.forEach(function (b) { ioP.observe(b.playerBox); ioB.observe(b.el); b.visibile = true; });
  }

  if (/[?&]debug=1/.test(location.search)) window.__diasio = { brani: brani };

  /* Link a un verso: ?t=SECONDI#slug-del-brano */
  (function () {
    var q = /[?&]t=(\d+(?:\.\d+)?)/.exec(location.search), slug = location.hash.slice(1);
    if (!q || !slug) return;
    var b = brani.filter(function (x) { return x.d.slug === slug; })[0];
    if (!b) return;
    var t = +q[1], r = null;
    b.righe.forEach(function (x) { if (x.s <= t + 0.6) r = x; });
    b.avvio = Math.max(0, (r ? r.s : t) - 0.25);
    if (b.facadeDa) b.facadeDa.textContent = "Ascolta da " + mmss(b.avvio);
    if (r) {
      r.el.classList.add("scelta");
      b.scroll.scrollTop = Math.max(0, r.el.offsetTop - b.scroll.clientHeight * 0.3);
    }
    setTimeout(function () { b.el.scrollIntoView({ behavior: riduci ? "auto" : "smooth", block: "start" }); }, 250);
  })();
})();

/* Venerdì Nero: conto alla rovescia fino alla Premiere (27/11/2026 19:00, ora svizzera) e loop verticale */
(function () {
  var c = document.querySelector(".conto");
  if (c) {
    var fine = Date.parse(c.getAttribute("data-uscita")), u = {};
    ["g", "o", "m", "s"].forEach(function (k) { u[k] = c.querySelector('[data-u="' + k + '"]'); });
    var cta = document.querySelector(".vn-cta");
    var giro = function () {
      var d = Math.floor((fine - Date.now()) / 1000);
      if (isNaN(fine) || d <= 0) {
        c.classList.add("uscito");
        if (cta) cta.textContent = "Guarda il video su YouTube";
        return false;
      }
      var p = function (n) { return (n < 10 ? "0" : "") + n; };
      u.g.textContent = p(Math.floor(d / 86400)); u.o.textContent = p(Math.floor(d % 86400 / 3600));
      u.m.textContent = p(Math.floor(d % 3600 / 60)); u.s.textContent = p(d % 60);
      return true;
    };
    if (giro()) { var t = setInterval(function () { if (!giro()) clearInterval(t); }, 1000); }
  }
  var v = document.querySelector(".vetrina-video");
  if (v && !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) && "IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else { v.pause(); } });
    }, { threshold: 0.25 }).observe(v);
  }
})();
