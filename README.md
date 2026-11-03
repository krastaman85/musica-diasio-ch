# musica.diasio.ch

Pagina artista di **D.IAsio**, rap conscious dal Ticino: i due video di YouTube con il testo che segue la voce parola per parola, la mappa del brano e i versi condivisibili.

## Come è fatto

- Sito statico su GitHub Pages (`CNAME` = `musica.diasio.ch`), senza framework.
- `index.html` è **generato** da `tools/build.py` (modello in `tools/modello.html`, dati in `tools/brani.py` e `tools/dati/`). Non modificarlo a mano: cambia il modello o i dati e rilancia `python3 tools/build.py`.
- `css/site.css`, `js/site.js`, font in `fonts/` (Unbounded, IBM Plex, Cormorant Garamond, Oswald, Anton, UnifrakturMaguntia: licenza SIL OFL), immagini in `img/`.
- YouTube si carica solo al clic, dal dominio `youtube-nocookie.com`, con la IFrame API. Statistiche GoatCounter (codice `diasio`, percorsi con il dominio davanti).

## Aggiungere un brano

1. Dai sorgenti del video karaoke copiare `righe.json` (testo e tempi delle parole) e `colpi.json` (energia e colpi) in `tools/dati/` come `<id>-righe.json` e `<id>-colpi.json`.
2. Aggiungere il brano in `tools/brani.py` (ID YouTube, durata, sezioni, voci, poster e fondo in `img/`).
3. `python3 tools/build.py`, controllare la pagina con un server locale (`python3 -m http.server`), poi commit.

## Link a un verso

`https://musica.diasio.ch/?t=SECONDI#slug-del-brano` apre la pagina sul brano, evidenzia il verso e fa partire il video da lì al primo play.
