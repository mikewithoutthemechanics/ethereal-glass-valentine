# Ethereal Glass Valentine — Starter Kit

A romantic, artistic web app for Candice with glassmorphic aesthetic, floating particle effects, and interactive love letter experience.

## ✨ Features

- Frosted glass cards with backdrop blur
- Animated gradient backgrounds (lavender → soft blue → pink)
- Floating bokeh/particle system
- Interactive "Will you be my Valentine?" with growing Yes button
- Personalizable config (no code changes needed)
- Typewriter-revealed love letter
- Polaroid-style memory gallery
- Heartbeat countdown timer
- Mobile-first, responsive, PWA-ready
- Smooth spring animations via CSS custom properties

## 🎨 Aesthetic Palette

- Background: linear gradient 135° from #e0c3fc → #8ec5fc → #ffb6b9
- Cards: rgba(255, 255, 255, 0.25) + backdrop-filter: blur(16px)
- Text: #2d2d2d on light, #f5f5f5 on dark glass
- Accents: #ff8fa3 (coral), #b5ead7 (mint), #c7ceea (lavender)

## 🚀 Quick Start

1. **Clone/Download** these files to a folder
2. **Customize** `config.json` — put Candice's name, your messages, photos
3. **Open** `index.html` in a browser (or deploy to Netlify/Vercel)
4. **Share** the link with her!

## 📁 File Structure

```
ethereal-glass-valentine/
├── index.html
├── styles.css
├── script.js
├── config.json
├── README.md
└── assets/
    └── (put photos here: photo1.jpg, photo2.jpg...)
```

## 🔧 Customization (edit `config.json` only)

```json
{
  "herName": "Candice",
  "yourName": "Michael",
  "tagline": "A digital love letter, crafted with glass and light.",
  "mainMessage": "From the moment our eyes first met, my world has had a new hue...",
  "reasons": [
    "Your laugh is my favorite sound",
    "You see beauty in the smallest things",
    "Your heart is the gentlest place I know"
  ],
  "memoryPhotos": [
    { "caption": "Our first sunset walk", "file": "photo1.jpg" },
    { "caption": "Coffee and giggles", "file": "photo2.jpg" }
  ],
  "countdownDate": "2026-02-14T00:00:00",
  "theme": {
    "bgStart": "#e0c3fc",
    "bgMid": "#8ec5fc",
    "bgEnd": "#ffb6b9",
    "glassOpacity": 0.25,
    "primaryAccent": "#ff8fa3"
  }
}
```

No need to touch HTML/JS unless you want to add sections.

## 📱 Mobile-First

Works beautifully on phones — try it in portrait mode. The "Yes" button grows with each polite "No" click, and the countdown ticks in real time.

## 🌐 Deploy Free in 2 Minutes

1. Push to GitHub
2. Go to [Netlify Drop](https://app.netlify.com/drop) — drag the folder
3. Share the live link

Or connect your repo for auto-deploys on updates.

## 💡 Ideas to Expand

- Add ambient piano track (Tita AI TTS-generated snippet)
- Include a mini quiz: "How well do you know me?"
- Create an RSVP form that emails you when she accepts
- Add AR selfie filter (Spark AR / Snapchat lens link)
- Voice memo section — record 3-second sweet notes

## ⚖️ License

MIT — remix, personalize, share the love.

---

Made with glass, light, and a little JavaScript magic.