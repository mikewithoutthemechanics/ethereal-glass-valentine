# Cinematic Upgrade Guide

## What's next (optional polish)

### 1. Ambience — add a gentle piano score
- Upload a royalty-free piano track to `assets/audio/ambient.mp3`
- Add a speaker icon to toggle sound on/off
- Use Web Audio API for volume fade on envelope open

### 2. Depth of Field + Bloom (Three.js post-processing)
```html
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js"></script>
```
Then enable: `composer = new EffectComposer(renderer);` + bloom pass.

### 3. Screen-space particles (floating glitter/dust)
Use a second full-screen canvas with additive blending, spawn thousands of tiny white particles that drift in 3D space.

### 4. Parallax photo gallery
On scroll, photos float upward at different speeds — separate z-layers.

### 5. Letter write-on effect
Instead of typing on texture, render each glyph as a 3D mesh and animate along path.

### 6. Mobile touch tweaks
Reduce particle count on low-end devices: `if (/Android|iPhone/.test(navigator.userAgent)) particleCount = 20;`

### 7. AR preview link
Add a button: "View in AR" → opens a `.usdz` model of the envelope (generate via Blender -> export).

Want me to implement any of these? Most impactful would be **post-processing bloom + ambient piano**.
