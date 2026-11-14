# musica.diasio.ch: memoria di progetto

Ultimo aggiornamento: 3 novembre 2026 (creazione del sito).

## Cos'è
Pagina artista di **D.IAsio** (rap conscious dal Ticino; stesso autore dei romanzi firmati «D. Iasio» su libri.diasio.ch). Repo pubblico `krastaman85/musica-diasio-ch`, GitHub Pages con `CNAME` = `musica.diasio.ch`. Il DNS su Hostpoint deve avere il record CNAME `musica` → `krastaman85.github.io` (come `libri`).

## Regole dell'utente
- Italiano, risposte operative; distinguere dati e inferenze; dire cosa fa l'utente e cosa fa Claude.
- **Mai nominare lo strumento musicale usato** (né nei testi del sito né nei metadati). Dicitura fissa nel piè di pagina: «Testi di D.IAsio. Musica e immagini create con l’ausilio di strumenti IA.»
- Il merge o il push su `main` pubblica. Nessun token o Secret nei file.
- Testi dei brani: solo quelli approvati (da `righe.json` dei sorgenti del video karaoke in Drive, `Audio e Video D. Iasio/1 Musica con licenza/Singoli/<brano>/05 - Video/<brano> - sorgenti video.zip`). Non inventare versi.

## Struttura
- `index.html` è generato: `python3 tools/build.py` (modello `tools/modello.html`, dati `tools/brani.py`, `tools/dati/*-righe.json` e `*-colpi.json`). Dopo modifiche a css/js aggiornare `VERSIONE` in `tools/build.py` e rilanciare (aggiorna anche privacy e 404).
- `js/site.js`: YouTube IFrame API caricata solo al clic (host `youtube-nocookie.com`), testo sincronizzato parola per parola, mappa del brano (energia a 10 valori al secondo), effetti su canvas (schegge per Spirale, braci per Archivio), barra d'ascolto, link ai versi `?t=SECONDI#slug`, GoatCounter (`diasio`, percorsi con il dominio davanti; eventi `musica/play/<id>` e `musica/condividi/<id>`). `?debug=1` espone `window.__diasio`.
- Brani: `archivio` (L'Archivio della Sete, YouTube `AfqDMkfEWsQ`, 3:56) e `spirale` (Spirale di vetro, `GMXOeERJDZ0`, 5:21). I video 16:9 partono con l'audio a 0 s (durate verificate con ffprobe), quindi nessuno scarto tra video e testo.
- Prova reale del 3/11 in Chrome sul PC: play da un verso, testo in sincrono con il karaoke del video, barra d'ascolto ok. In cloud YouTube non parte (Chromium senza accesso): provare sul PC con `python -m http.server` nella copia `C:\Users\krast\OneDrive\Documenti\GitHub\musica-diasio-ch`.
- Immagini: scene dei videoclip (Firefly) ridotte in `img/`; logo `img/diasio-logo.svg` dal pacchetto «D.IAsio-logo» (Drive, cartella di Spirale di vetro). Font locali, licenza SIL OFL.
