# Photo Setup Guide

## Where to put photos

Create an `assets/` folder inside the project and copy your photos there.

```
ethereal-glass-valentine/
├── assets/
│   ├── photo1.jpg   ← your first photo
│   ├── photo2.jpg   ← your second photo
│   └── photo3.jpg   ← your third photo
├── index.html
├── styles.css
├── script.js
├── config.json
└── README.md
```

## What photos work best

- **Format:** JPG, PNG, or WebP (JPGs load fastest)
- **Size:** 800×800 to 1200×1200px is perfect — big enough to look crisp, small enough to load quickly
- **Aspect:** Square or 4:3 works best in the Polaroid frames
- **Content:** Candid moments, sunsets, coffee dates, silly selfies, places you've visited together

## Step-by-step

1. Pick 3–6 favorite photos of you two together
2. Rename them to `photo1.jpg`, `photo2.jpg`, `photo3.jpg` (or whatever filenames you prefer)
3. Copy them into `ethereal-glass-valentine/assets/`
4. Open `config.json` and set the `file` field for each memory:

```json
"memoryPhotos": [
  { "caption": "Our first sunset walk", "file": "photo1.jpg" },
  { "caption": "Coffee and giggles", "file": "photo2.jpg" },
  { "caption": "That rainy day we got lost", "file": "photo3.jpg" }
]
```

5. Refresh the page — your photos will appear in the Polaroid gallery with hand-drawn frame styling

## Pro tips

- **Compress first:** Use [TinyPNG](https://tinypng.com) or ImageOptim to keep file sizes under 200KB each — smooth scrolling on mobile
- **Consistent vibes:** Warm-filtered or soft-contrast photos complement the pastel glass aesthetic best
- **Privacy:** If you don't want the original filenames preserved, rename them generically (`memory1.jpg`, etc.)
- **No oversizing:** Avoid 4K+ images — the browser scales them down anyway, wasting bandwidth

That's it. Drop, rename, update config, done.