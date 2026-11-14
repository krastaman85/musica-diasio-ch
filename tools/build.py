#!/usr/bin/env python3
"""Genera index.html di musica.diasio.ch dai dati in tools/brani.py e tools/dati/.

Uso: python3 tools/build.py   (dalla cartella del repo)
Il testo dei brani finisce nell'HTML (leggibile senza JavaScript e dai motori di ricerca);
tempi delle parole, energia e colpi finiscono in un blocco JSON letto da js/site.js.
"""
import html
import json
import math
from pathlib import Path

RADICE = Path(__file__).resolve().parent.parent
DATI = RADICE / "tools" / "dati"
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from brani import BRANI  # noqa: E402

VERSIONE = "20261114a"
SITO = "https://musica.diasio.ch/"


def mmss(t):
    t = max(0, int(round(t)))
    return f"{t // 60}:{t % 60:02d}"


def iso_durata(t):
    t = int(round(t))
    return f"PT{t // 60}M{t % 60}S"


def e(s):
    return html.escape(s, quote=True)


def carica(b):
    righe = json.loads((DATI / b["righe"]).read_text(encoding="utf-8"))
    colpi = json.loads((DATI / b["colpi"]).read_text(encoding="utf-8"))
    out = []
    for r in righe:
        parole = r["parole"]
        toks = r["testo"].split()
        testi = toks if len(toks) == len(parole) else [p["w"] for p in parole]
        out.append({
            "s": round(r["inizio"], 2), "e": round(r["fine"], 2), "v": r["voce"],
            "w": [[t, round(p["s"], 2), round(p["e"], 2)] for t, p in zip(testi, parole)],
            "testo": r["testo"],
        })
    # energia: 30 al secondo -> 10 al secondo, 0-100 (percentile 98 = 100)
    en = colpi["energia"]
    fps = len(en) / b["durata"]
    passo = max(1, round(fps / 10))
    e10 = [max(en[i:i + passo]) for i in range(0, len(en), passo)]
    rif = sorted(e10)[int(len(e10) * 0.98)] or 1
    e10 = [min(100, round(100 * x / rif)) for x in e10]
    forti = sorted(h[1] for h in colpi["hits"])
    soglia = forti[int(len(forti) * 0.72)]
    hits = [round(h[0], 2) for h in colpi["hits"] if h[1] >= soglia]
    return out, e10, hits, 10


def onda(e10, durata, n=480):
    """Percorso SVG simmetrico (viewBox 0 0 1000 100) dell'energia del brano."""
    pts = []
    for i in range(n + 1):
        t = durata * i / n
        k = min(len(e10) - 1, int(t * 10))
        lo, hi = max(0, k - 2), min(len(e10), k + 3)
        v = sum(e10[lo:hi]) / (hi - lo)
        a = 4 + 44 * math.sqrt(v / 100)
        pts.append((1000 * i / n, a))
    su = " ".join(f"{x:.1f},{50 - a:.1f}" for x, a in pts)
    giu = " ".join(f"{x:.1f},{50 + a:.1f}" for x, a in reversed(pts))
    return f"M{su} L{giu} Z"


def voce_classe(v):
    return "v-" + v


def blocco_testo(b, righe):
    sez = list(b["sezioni"])
    parti = []
    si = 0
    for r in righe:
        while si < len(sez) and sez[si][0] <= r["s"] + 0.05:
            t, nome, nota = sez[si]
            parti.append(f'<p class="sez" data-t="{t}"><span class="sez-n">{e(nome)}</span> <span class="sez-t">{mmss(t)}</span></p>')
            if nota:
                parti.append(f'<p class="nota" data-t="{t}">{e(nota)}</p>')
            si += 1
        parole = " ".join(f'<span class="w" data-s="{p[1]}" data-e="{p[2]}">{e(p[0])}</span>' for p in r["w"])
        parti.append(
            f'<div class="riga {voce_classe(r["v"])}" data-s="{r["s"]}" data-e="{r["e"]}">'
            f'<button class="r-btn" type="button"><span class="r-t" aria-hidden="true">{mmss(r["s"])}</span>'
            f'<span class="sr">Ascolta da {mmss(r["s"])}: </span>{parole}</button>'
            f'<button class="cond" type="button" aria-label="Condividi questo verso" title="Condividi questo verso">'
            f'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg></button></div>'
        )
    while si < len(sez):
        t, nome, nota = sez[si]
        parti.append(f'<p class="sez" data-t="{t}"><span class="sez-n">{e(nome)}</span> <span class="sez-t">{mmss(t)}</span></p>')
        if nota:
            parti.append(f'<p class="nota" data-t="{t}">{e(nota)}</p>')
        si += 1
    return "\n".join(parti)


def blocco_brano(b, righe, e10):
    d = b["durata"]
    tacche = "".join(
        f'<li style="left:{100 * t / d:.2f}%" data-t="{t}" title="{e(n)} · {mmss(t)}"></li>' for t, n, _ in b["sezioni"]
    )
    punti = "".join(f'<i style="left:{100 * r["s"] / d:.2f}%"></i>' for r in righe)
    legenda = "".join(f'<li class="v-{k}"><i></i>{e(n)}</li>' for k, n in b["voci"])
    path = onda(e10, d)
    yt = f"https://www.youtube.com/watch?v={b['yt']}"
    return f'''
<article class="brano t-{b["id"]}" id="{b["slug"]}" data-brano="{b["id"]}" aria-labelledby="t-{b["id"]}">
<div class="brano-fondo" aria-hidden="true" style="background-image:url('{b["fondo"]}')"></div>
<canvas class="brano-fx" aria-hidden="true"></canvas>
<div class="wrap">
<header class="brano-head rv">
<p class="lato">{e(b["lato"])}</p>
<h3 id="t-{b["id"]}" class="titolo">{e(b["titolo"])}</h3>
<ul class="meta"><li>{e(b["genere"])}</li><li>{mmss(d)}</li><li>{e(b.get("etichetta", "Singolo · " + b["anno"]))}</li></ul>
<p class="concept">{e(b["concept"])}</p>
</header>
<div class="brano-grid">
<div class="stage rv">
<div class="player" data-yt="{b["yt"]}">
<a class="facade" href="{yt}" rel="noopener" aria-label="Guarda il video di {e(b["titolo"])}">
<img src="{b["poster"]}" width="1600" height="900" alt="" loading="lazy" decoding="async">
<span class="play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg></span>
<span class="facade-lbl"><span class="facade-da">Guarda il video</span> · {mmss(d)}</span>
</a>
</div>
<div class="mappa" role="slider" tabindex="0" aria-label="Posizione nel brano {e(b["titolo"])}" aria-valuemin="0" aria-valuemax="{round(d)}" aria-valuenow="0" aria-valuetext="0:00 di {mmss(d)}">
<svg viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true"><path class="onda" d="{path}"/><path class="onda fatta" d="{path}"/></svg>
<div class="punti" aria-hidden="true">{punti}</div>
<div class="testa" aria-hidden="true"></div>
</div>
<div class="mappa-sotto"><span class="sez-ora">{e(b["sezioni"][0][1])}</span><ol class="tacche" aria-hidden="true">{tacche}</ol><span class="ora"><span class="ora-t">0:00</span> / {mmss(d)}</span></div>
<ul class="legenda" aria-label="Voci del brano">{legenda}</ul>
<div class="azioni">
<a class="btn piccolo" href="{yt}" rel="noopener">Apri su YouTube</a>
<button class="btn piccolo segui-testo" type="button" aria-pressed="true">Il testo segue la voce</button>
</div>
</div>
<div class="testo rv" lang="it">
<p class="testo-head"><span>Testo</span><span class="testo-firma">Parole di D.IAsio</span></p>
<div class="testo-scroll" tabindex="0" aria-label="Testo di {e(b["titolo"])}">
{blocco_testo(b, righe)}
</div>
</div>
</div>
</div>
</article>'''


def main():
    dati_js = {}
    brani_html = {"qm": [], "singoli": []}
    ld = []
    for b in BRANI:
        righe, e10, hits, _ = carica(b)
        brani_html[b.get("sezione", "singoli")].append(blocco_brano(b, righe, e10))
        dati_js[b["id"]] = {
            "yt": b["yt"], "titolo": b["titolo"], "slug": b["slug"], "durata": b["durata"],
            "sezioni": [[t, n] for t, n, _ in b["sezioni"]],
            "righe": [[r["s"], r["e"]] for r in righe],
            "energia": e10, "colpi": hits,
        }
        ld.append({
            "@type": "MusicRecording", "name": b["titolo"].replace("’", "'"), "duration": iso_durata(b["durata"]),
            "inLanguage": "it", "genre": b["genere"], "url": SITO + "#" + b["slug"],
            "byArtist": {"@id": SITO + "#artista"}, "sameAs": f"https://www.youtube.com/watch?v={b['yt']}",
        })
    ld_tutto = {
        "@context": "https://schema.org",
        "@graph": [{
            "@type": "MusicGroup", "@id": SITO + "#artista", "name": "D.IAsio", "url": SITO,
            "genre": ["Hip hop", "Conscious rap", "Progressive metal", "Jazz rap"],
            "foundingLocation": {"@type": "Place", "name": "Ticino, Svizzera"},
            "image": SITO + "img/og.jpg",
            "sameAs": ["https://www.youtube.com/@D.IAsio_music", "https://www.instagram.com/_d.iasio_/", "https://libri.diasio.ch/"],
        }, {
            "@type": "MusicAlbum", "name": "Quinta Muraria", "byArtist": {"@id": SITO + "#artista"},
            "url": SITO + "#quinta-muraria", "image": SITO + "img/cover-quinta-muraria.webp", "inLanguage": "it",
            "track": [{"@type": "MusicRecording", "name": "Spirale di vetro", "url": SITO + "#spirale-di-vetro"},
                      {"@type": "MusicRecording", "name": "Venerdì Nero", "url": SITO + "#venerdi-nero"}],
        }] + ld,
    }
    modello = (RADICE / "tools" / "modello.html").read_text(encoding="utf-8")
    pagina = (modello
              .replace("{{BRANI_QM}}", "\n".join(brani_html["qm"]))
              .replace("{{BRANI_SINGOLI}}", "\n".join(brani_html["singoli"]))
              .replace("{{DATI}}", json.dumps(dati_js, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/"))
              .replace("{{LD}}", json.dumps(ld_tutto, ensure_ascii=False).replace("</", "<\\/"))
              .replace("{{V}}", VERSIONE))
    (RADICE / "index.html").write_text(pagina, encoding="utf-8")
    for p in (RADICE / "privacy" / "index.html", RADICE / "404.html"):
        if p.exists():
            t = p.read_text(encoding="utf-8")
            import re
            t = re.sub(r"\?v=\d{8}[a-z]?", "?v=" + VERSIONE, t)
            p.write_text(t, encoding="utf-8")
    print("index.html scritto:", len(pagina) // 1024, "KB")


if __name__ == "__main__":
    main()
