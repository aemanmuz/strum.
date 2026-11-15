# strum. — Guitar Lessons with Aeman (V2.0)

A turquoise-and-white, beginner-friendly guitar web app built with **HTML, CSS and vanilla JavaScript**. No framework, account, database or paid service required.

## Features

- Standard E A D G B E tuning, playable strings and a 12-fret reference board
- 20 guitar chords grouped into easy, medium and hard, with playable chord samples
- 21 starter songs (English, Malaysian, Indonesian and original practice songs), including simplified practice progressions
- **My Songs:** add a song with title, artist, difficulty, chords and a pasted lyric/chord sheet; edit, delete, search and filter it later
- Paste in `[G]words [D]words`, or chord-only lines such as `G  D  Em  C`; the app displays them safely and keeps line spacing
- **Metronome:** 40–220 BPM, tempo presets, volume control, 3/4/6 beats per bar, tap tempo, start/stop and visual beat counters
- Week-by-week learning plan and **Aeman's personal tips for weeks 1–2, 3–4, 5–6, 7–10 and 11+**
- Journal, daily practice check-in, points, achievements and browser storage
- Backup and restore saved songs, lyrics, notes and progress using JSON files
- Mobile-friendly layout with light animations and reduced-motion support

## Project structure

```text
strum-guitar/
├── index.html               # Page structure, navigation, song form
├── css/
│   └── style.css            # Colours, layouts, animations, responsive rules
├── js/
│   ├── app.js               # Page rendering, buttons, forms, metronome UI
│   ├── chords.js            # Chord shapes, note names, diagrams
│   ├── songs.js             # Starter song list, safe sheet formatting
│   ├── progress.js          # Roadmap tips, points, saves, JSON backups
│   └── audio.js             # Web Audio tones and metronome scheduler
└── assets/
    ├── images/              # Place your own images here
    └── videos/              # Place your own demo videos here
```

## How to run locally

**VS Code:** Open the `strum-guitar` folder, install the optional **Live Server** extension, then right-click `index.html` and choose **Open with Live Server**.

**Or with Python:** Open a terminal inside the project folder and run:

```bash
python -m http.server 8000
```

Visit `http://localhost:8000` in your browser.

**Important:** Because V2 uses JavaScript ES modules (`type="module"`), **double-clicking `index.html` to open a `file://` page is not reliable**. Run it with a local web server or use GitHub Pages.

## Publish on GitHub Pages

1. Create a GitHub repository (for example `strum-guitar`).
2. Upload **all project files and folders**, keeping their paths intact.
3. Open the repository **Settings → Pages**.
4. Select **Deploy from a branch**, then `main` and `/ (root)`.
5. Open the Pages address GitHub provides once it is published.

No build tool, API keys, npm packages or Supabase setup is necessary.

## How learners add their own songs

1. Open **Songbook → Add a song**.
2. Enter the **title**, optionally the artist, language and difficulty.
3. Paste a chord-and-lyric sheet into the large text box (only material you have permission to use).
4. Enter chords like `G D Em C`, or leave the chord field blank to let the app detect common chords from bracketed or chord-only lines.
5. Click **Save song to my library**.
6. Use **My songs** or **Search** to find it, then **Edit** or **Delete** when needed.

The library is not a public lyric search engine. It does not download lyrics from external sites or publish user-pasted content. Built-in popular song entries contain **practice chords, not full copyrighted lyrics**.

## About saving data

- Progress, notes, custom songs and pasted lyrics are saved using **localStorage in the current browser**.
- There is **no user login or cross-device sync**. Saving on one device does not sync to another.
- For backups, open **Practice journal → Download backup (.json)**. Use **Restore from backup** to import a Strum V2 JSON backup into a browser. Restore **replaces** the current data in that browser.
- Strum automatically reads existing V1 progress if you deploy V2 to **the same site origin**. A different URL or domain has separate localStorage.
- Browser storage is limited. Long or numerous sheets may eventually fill it; export backups regularly.
- The metronome uses the Web Audio API, so it requires a supported browser and a user click to start sound. Avoid locking your screen while relying on its beat; background browser timers can be throttled.

## Where to make changes

| Want to change... | Edit... |
|---|---|
| Personal story, layout, pages or labels | `index.html` |
| Turquoise colours, fonts or animations | `css/style.css` |
| Chord shapes and fretboard | `js/chords.js` |
| Built-in song suggestions | `js/songs.js` |
| Weekly tips, milestones and saving | `js/progress.js` |
| Metronome click sound and scheduling | `js/audio.js` |
| Button behaviour, add-song form and rendering | `js/app.js` |

**Built by Mohd Aeman.**
