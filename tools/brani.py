# Dati dei brani di musica.diasio.ch (letti da tools/build.py).
# Testi e tempi: righe.json dei sorgenti del video karaoke (testo approvato, tempo di ogni parola).
# Energia e colpi: colpi.json (misurati sul FLAC). Il video YouTube parte con l'audio a 0 s: OFFSET = 0.

BRANI = [
    {
        "id": "archivio",
        "slug": "larchivio-della-sete",
        "yt": "AfqDMkfEWsQ",
        "titolo": "L’Archivio della Sete",
        "lato": "Lato A · ultimo singolo",
        "genere": "Conscious hip hop · boom bap",
        "durata": 236.04,
        "anno": "2026",
        "poster": "img/poster-archivio.webp",
        "fondo": "img/fondo-archivio.webp",
        "concept": (
            "Una società che ha sete di tutto: di consumo, di successo, di storie da vendere. "
            "Socrate alla cassa di un discount, la biblioteca di Alessandria che brucia in ogni feed, "
            "un vincente che conta i propri attacchi di panico come un perito contabile. "
            "E la domanda più scomoda: chi racconta il dolore degli altri lo salva o lo vende?"
        ),
        "righe": "archivio-righe.json",
        "colpi": "archivio-colpi.json",
        "sezioni": [
            (0, "Intro", "Crepitio del vinile, pianoforte scordato, archi."),
            (10.1, "Strofa 1", ""),
            (43.5, "Ritornello", ""),
            (76.8, "Strofa 2", ""),
            (109.6, "Ritornello", ""),
            (141.9, "Strofa 3", "Un taglio di silenzio, poi la voce di un ragazzo, come un vocale."),
            (154.1, "Strofa 4", ""),
            (176.5, "Ritornello", ""),
            (209.4, "Outro", ""),
            (219.6, "Finale", "Il battito sfuma con il pianoforte."),
        ],
        "voci": [("rap", "rap"), ("coro", "ritornello"), ("falsetto", "falsetto"), ("ragazzo", "la voce del ragazzo"), ("outro", "parlato")],
    },
    {
        "id": "spirale",
        "slug": "spirale-di-vetro",
        "yt": "GMXOeERJDZ0",
        "titolo": "Spirale di vetro",
        "lato": "Lato B · primo singolo",
        "genere": "Progressive metal · jazz rap",
        "durata": 321.37,
        "anno": "2026",
        "poster": "img/poster-spirale.webp",
        "fondo": "img/fondo-spirale.webp",
        "concept": (
            "Un uomo di vetro scende una spirale senza fondo. La ragione scivola, l’ego si gonfia, "
            "lo specchio si rompe: rap serrato su un beat jazz, poi l’abisso in scream e growl, "
            "un flamenco sussurrato, la risalita in falsetto. Alla fine resta un respiro sul vetro."
        ),
        "righe": "spirale-righe.json",
        "colpi": "spirale-colpi.json",
        "sezioni": [
            (0, "Intro", "Violoncello solo, una nota lunga e funebre. Poi il beat jazz e il basso a sette corde."),
            (94.0, "Strofa 1", ""),
            (116.5, "Pre-ritornello", ""),
            (124.2, "Esplosione", "Riff death metal, blast beat, un violino neoclassico sopra il caos."),
            (140.4, "Ritornello", ""),
            (162.8, "Flamenco", "Silenzio. Poi una chitarra flamenca nervosa e il violino."),
            (178.1, "Strofa 2", ""),
            (193.2, "Crescendo", "Chitarre lente, violoncello e viola: un muro sinfonico."),
            (208.1, "Strofa 3", ""),
            (231.1, "Breakdown", "Dissonanza totale, in sette ottavi."),
            (254.9, "Ponte", ""),
            (285.8, "Outro", "Basso fretless, violino, poi un respiro che si spezza."),
        ],
        "voci": [("rap", "rap"), ("scream", "scream"), ("growl", "growl"), ("sussurro", "sussurro"), ("pulita", "voce pulita"), ("falsetto", "falsetto")],
    },
]
