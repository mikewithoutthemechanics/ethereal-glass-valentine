/**
 * Ethereal Glass Valentine — Cinematic Edition (Mobile-First)
 * 3D envelope with graceful CSS fallback for low-end / mobile WebGL issues
 */

// ═══════════════════════════════════════════════════════════════════════════
// Device Detection
// ═══════════════════════════════════════════════════════════════════════════

const IS_MOBILE = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const IS_LOW_END = IS_MOBILE || navigator.hardwareConcurrency <= 4;
const USE_THREE = !IS_LOW_END && (() => {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch { return false; }
})();

// ═══════════════════════════════════════════════════════════════════════════
// Globals
// ═══════════════════════════════════════════════════════════════════════════

let CONFIG;
let scene, camera, renderer, composer, bloomPass;
let envelopeGroup, letterMesh;
let isEnvelopeOpen = false;
let raycaster, mouse;
const clock = new THREE.Clock();

// Audio
let audioCtx, audioGain, ambientSource;
let audioEnabled = true;

// CSS fallback state
let envelopeOpenedCSS = false;

// ═══════════════════════════════════════════════════════════════════════════
// Config Loading
// ═══════════════════════════════════════════════════════════════════════════

async function loadConfig() {
  try {
    const resp = await fetch('config.json');
    CONFIG = await resp.json();
  } catch (e) {
    CONFIG = {
      herName: 'Candice',
      yourName: 'Michael',
      tagline: 'A digital love letter, crafted with glass and light.',
      invitationLine: 'To the one who came out of nowhere',
      secretDateLine: 'Will you go on a secret date with me?',
      mainMessage: 'From the moment our eyes first met, my world has had a new hue. Every day with you feels like stepping into a dream painted in softer colors, warmer light.',
      reasons: ['Your laugh is my favorite sound', 'You see beauty in the smallest things', 'Your heart is the gentlest place I know', 'You believe in me even when I doubt', 'Our quiet mornings are my sanctuary'],
      memoryPhotos: [],
      countdownDate: '2026-02-14T00:00:00',
      theme: { bgStart: '#e0c3fc', bgMid: '#8ec5fc', bgEnd: '#ffb6b9', glassOpacity: 0.25, primaryAccent: '#ff8fa3', textDark: '#2d2d2d', textLight: '#f5f5f5' }
    };
  }
  applyTheme();
}

function applyTheme() {
  const root = document.documentElement;
  const t = CONFIG.theme;
  root.style.setProperty('--bg-start', t.bgStart);
  root.style.setProperty('--bg-mid', t.bgMid);
  root.style.setProperty('--bg-end', t.bgEnd);
  root.style.setProperty('--glass-opacity', String(t.glassOpacity));
  root.style.setProperty('--primary', t.primaryAccent);
  root.style.setProperty('--text-dark', t.textDark);
  root.style.setProperty('--text-light', t.textLight);
}

// ═══════════════════════════════════════════════════════════════════════════
// Bootstrap — choose 3D or CSS fallback
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  seedText();

  // Show fallback envelope by default, hide if Three.js loads successfully
  const fallbackEnv = document.getElementById('fallback-envelope');
  fallbackEnv.classList.remove('hidden');
  document.getElementById('fallbackInvitation').textContent = CONFIG.invitationLine;
  document.getElementById('fallbackYourName').textContent = CONFIG.yourName;

  initParticles();
  startCountdown();

  if (USE_THREE) {
    // Hide fallback, init Three.js
    fallbackEnv.classList.add('hidden');
    initThree();
    initScroll();
    console.log('🚀 Using Three.js 3D envelope');
  } else {
    console.log('📱 Mobile/low-end device — CSS fallback envelope active');
    initCSSEnvelope();
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// CSS Fallback Envelope (mobile)
// ═══════════════════════════════════════════════════════════════════════════

function initCSSEnvelope() {
  const envelope = document.getElementById('fallback-envelope');

  envelope.addEventListener('click', async () => {
    if (envelopeOpenedCSS) return;
    envelopeOpenedCSS = true;
    envelope.classList.add('open');
    document.body.classList.add('envelope-active');

    if (audioEnabled) await playAmbientPiano();

    // Typewriter on letter
    await sleep(1400);
    const letterText = envelope.querySelector('.fallback-letter');
    let i = 0;
    const text = CONFIG.invitationLine;
    const interval = setInterval(() => {
      letterText.textContent = text.substring(0, i + 1) + (i < text.length - 1 ? '|' : '');
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        letterText.textContent = text; // final text
        // Show response buttons
        setTimeout(() => {
          document.getElementById('responseSection').classList.remove('hidden');
          const card = document.querySelector('#responseSection .glass-card');
          gsap.to(card, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
          initButtons();
        }, 600);
      }
    }, 30);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Three.js 3D Envelope (desktop)
// ═══════════════════════════════════════════════════════════════════════════

function initThree() {
  const container = document.getElementById('canvas-container');
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, IS_MOBILE ? 9 : 7);

  renderer = new THREE.WebGLRenderer({ antialias: !IS_MOBILE, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_MOBILE ? 1.5 : 2));
  renderer.shadowMap.enabled = !IS_MOBILE;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);

  // Post-processing only on desktop
  if (!IS_MOBILE) {
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));
    bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.8, 0.4, 0.85);
    composer.addPass(bloomPass);
  }

  // Lights — fewer on mobile
  scene.add(new THREE.AmbientLight(0xffffff, IS_MOBILE ? 0.7 : 0.5));
  const spot = new THREE.SpotLight(0xffffff, IS_MOBILE ? 0.9 : 1.2);
  spot.position.set(6, 10, 8);
  spot.angle = Math.PI / 5;
  spot.penumbra = 0.4;
  spot.castShadow = !IS_MOBILE;
  if (!IS_MOBILE) { spot.shadow.bias = -0.0002; spot.shadow.mapSize.set(2048,2048); }
  scene.add(spot);

  if (!IS_MOBILE) {
    const fill = new THREE.PointLight(0xffb6b9, 0.4, 25);
    fill.position.set(-4, 3, 5);
    scene.add(fill);
    scene.fog = new THREE.Fog(0xe0c3fc, 10, 25);
  }

  buildEnvelope();

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  window.addEventListener('resize', onWindowResize);
  window.addEventListener('click', onMouseClick);
  window.addEventListener('mousemove', onMouseMove);

  animate();
}

// ═══════════════════════════════════════════════════════════════════════════
// Envelope Builder (simplified geometry for mobile)
// ═══════════════════════════════════════════════════════════════════════════

function buildEnvelope() {
  envelopeGroup = new THREE.Group();
  scene.add(envelopeGroup);

  const envelopeMat = new THREE.MeshStandardMaterial({
    color: 0xfff8f0, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide
  });
  const flapMat = new THREE.MeshStandardMaterial({
    color: 0xfff0e6, roughness: 0.5, metalness: 0.05, side: THREE.DoubleSide
  });
  const sealMat = new THREE.MeshStandardMaterial({
    color: 0xff8fa3, roughness: 0.3, metalness: 0.15,
    emissive: 0xff8fa3, emissiveIntensity: IS_MOBILE ? 0.2 : 0.4
  });

  // Base
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.8), envelopeMat);
  base.position.y = -0.05;
  base.castShadow = !IS_MOBILE;
  base.receiveShadow = !IS_MOBILE;
  envelopeGroup.add(base);

  // Front pocket (two triangles)
  const pocketGeo = new THREE.BufferGeometry();
  pocketGeo.setAttribute('position', new THREE.Float32BufferAttribute([0,-0.04,-0.9, -1.2,-0.04,0.9, 1.2,-0.04,0.9], 3));
  pocketGeo.setAttribute('uv', new THREE.Float32BufferAttribute([0.5,1, 0,0, 1,0], 2));
  pocketGeo.computeVertexNormals();
  envelopeGroup.add(new THREE.Mesh(pocketGeo, flapMat));

  // Flaps (simplified on mobile: no detailed cones)
  const flapW = 1.25, flapH = IS_MOBILE ? 0.02 : 0.03;
  const topFlap = new THREE.Mesh(new THREE.BoxGeometry(flapW*2, flapH, flapW*2), flapMat);
  topFlap.position.set(0, 0.02, -0.5);
  topFlap.rotation.x = Math.PI;
  topFlap.name = 'topFlap';
  envelopeGroup.add(topFlap);

  const bottomFlap = new THREE.Mesh(new THREE.BoxGeometry(flapW*2, flapH, flapW*2), flapMat);
  bottomFlap.position.set(0, -0.02, 0.5);
  bottomFlap.name = 'bottomFlap';
  envelopeGroup.add(bottomFlap);

  // Letter
  const letterTex = createLetterTexture('');
  const letterMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.5), new THREE.MeshBasicMaterial({ map: letterTex, transparent: true, opacity: 0.98 }));
  letterMesh.position.set(0, -0.55, 0.06);
  letterMesh.rotation.x = Math.PI / 2;
  letterMesh.visible = false;
  envelopeGroup.add(letterMesh);
  envelopeGroup.userData.letterMesh = letterMesh;

  // 3D Heart seal
  const heartShape = new THREE.Shape();
  heartShape.moveTo(0, 0.3);
  heartShape.bezierCurveTo(0, 0.42, 0.2, 0.45, 0.26, 0.35);
  heartShape.bezierCurveTo(0.32, 0.25, 0.32, 0.12, 0.26, 0);
  heartShape.bezierCurveTo(0.2, -0.12, 0, -0.06, 0, 0.06);
  heartShape.bezierCurveTo(0, 0.06, -0.2, -0.12, -0.26, 0);
  heartShape.bezierCurveTo(-0.32, 0.12, -0.32, 0.25, -0.26, 0.35);
  heartShape.bezierCurveTo(-0.2, 0.45, 0, 0.42, 0, 0.3);
  const heart = new THREE.Mesh(new THREE.ShapeGeometry(heartShape), sealMat);
  heart.position.set(0, 0.14, -0.78);
  heart.scale.set(0.65, 0.65, 0.65);
  envelopeGroup.add(heart);

  // Idle animation — gentler on mobile
  const dur = IS_MOBILE ? 4 : 3.2;
  gsap.to(envelopeGroup.position, { y: 0.12, duration: dur, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  gsap.to(envelopeGroup.rotation, { y: IS_MOBILE ? 0.02 : 0.04, duration: IS_MOBILE ? 8 : 6, repeat: -1, yoyo: true, ease: 'sine.inOut' });

  if (!IS_MOBILE) {
    gsap.to(bloomPass, 'strength', { value: 0.6, duration: 2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Mouse interaction (desktop)
// ═══════════════════════════════════════════════════════════════════════════

function onMouseMove(event) {
  if (IS_MOBILE) return;
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  if (!isEnvelopeOpen) {
    gsap.to(envelopeGroup.rotation, { x: mouse.y * 0.04, y: mouse.x * 0.06, duration: 0.7, ease: 'power2.out' });
  }
}

function onMouseClick(event) {
  if (IS_MOBILE) return;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(envelopeGroup.children, true);
  if (intersects.length > 0 && !isEnvelopeOpen) openEnvelope();
}

// ═══════════════════════════════════════════════════════════════════════════
// Open Envelope — CSS fallback shares same init path but 3D path here
// ═══════════════════════════════════════════════════════════════════════════

async function openEnvelope() {
  if (isEnvelopeOpen) return;
  isEnvelopeOpen = true;
  document.body.classList.add('envelope-active');

  if (audioEnabled) await playAmbientPiano();

  const letterMesh = envelopeGroup.userData.letterMesh;
  letterMesh.visible = true;

  // Cinematic zoom (only on desktop)
  if (!IS_MOBILE) {
    gsap.to(camera.position, { z: 6.2, duration: 2.5, ease: 'power2.inOut' });
  }

  const topFlap = envelopeGroup.getObjectByName('topFlap');
  const bottomFlap = envelopeGroup.getObjectByName('bottomFlap');

  // Flaps open
  gsap.to(topFlap.rotation, { x: IS_MOBILE ? -2.1 : -2.4, duration: IS_MOBILE ? 1.2 : 1.5, ease: 'power3.out' });
  gsap.to(bottomFlap.rotation, { x: IS_MOBILE ? 2.1 : 2.4, duration: IS_MOBILE ? 1.2 : 1.5, ease: 'power3.out' });
  gsap.to(envelopeGroup.position, { y: IS_MOBILE ? 0.15 : 0.18, duration: IS_MOBILE ? 1.2 : 1.5, ease: 'power3.out' });

  await sleep(IS_MOBILE ? 1100 : 1400);
  gsap.to(letterMesh.position, { y: 0.22, z: 0.15, duration: 1.0, ease: 'back.out(1.4)' });

  await sleep(500);
  typeOnLetterTexture(letterMesh, CONFIG.invitationLine, IS_MOBILE ? 18 : 24);

  setTimeout(() => {
    document.getElementById('responseSection').classList.remove('hidden');
    const card = document.querySelector('#responseSection .glass-card');
    gsap.to(card, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
    initButtons();
  }, CONFIG.invitationLine.length * (IS_MOBILE ? 18 : 24) + 700);

  // Hide sprite text
  envelopeGroup.children.forEach(c => { if (c.isSprite) gsap.to(c.scale, { x: 0, y: 0, duration: 0.6 }); });
}

// ═══════════════════════════════════════════════════════════════════════════
// Typewriter on 3D letter texture
// ═══════════════════════════════════════════════════════════════════════════

function typeOnLetterTexture(mesh, text, charDelay = 24) {
  const canvas = mesh.material.map.image;
  const ctx = canvas.getContext('2d');

  function redraw(sub) {
    ctx.fillStyle = '#fffef7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Grain
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 10;
      img.data[i] = Math.min(255, img.data[i] + n);
      img.data[i+1] = Math.min(255, img.data[i+1] + n);
      img.data[i+2] = Math.min(255, img.data[i+2] + n);
    }
    ctx.putImageData(img, 0, 0);

    ctx.font = '52px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = '#2d2d2d';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const words = sub.split(' ');
    let line = '', y = 400, lineH = 80;
    for (let n = 0; n < words.length; n++) {
      const test = line + words[n] + ' ';
      if (ctx.measureText(test).width > 1800 && n > 0) {
        ctx.fillText(line, 1024, y);
        line = words[n] + ' ';
        y += lineH;
      } else { line = test; }
    }
    ctx.fillText(line, 1024, y);
    mesh.material.map.needsUpdate = true;
  }

  redraw('');
  let i = 0;
  const interval = setInterval(() => {
    redraw(text.substring(0, i + 1));
    i++;
    if (i >= text.length) clearInterval(interval);
  }, charDelay);
}

// ═══════════════════════════════════════════════════════════════════════════
// Helpers (sprites + letter texture)
// ═══════════════════════════════════════════════════════════════════════════

function createTextSprite(text, scale = 0.45) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = 'bold 120px "Cormorant Garamond", Georgia, serif';
  ctx.fillStyle = '#2d2d2d';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(4.5 * scale, 1.1 * scale, 1);
  sprite.renderOrder = 999;
  return sprite;
}

function createLetterTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048; canvas.height = 1536;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fffef7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Grain noise
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 12;
    img.data[i] = Math.min(255, img.data[i] + n);
    img.data[i+1] = Math.min(255, img.data[i+1] + n);
    img.data[i+2] = Math.min(255, img.data[i+2] + n);
  }
  ctx.putImageData(img, 0, 0);
  ctx.font = '56px "Cormorant Garamond", Georgia, serif';
  ctx.fillStyle = '#2d2d2d';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const words = text.split(' ');
  let line = '', y = 400, lineH = 80;
  for (let n = 0; n < words.length; n++) {
    const test = line + words[n] + ' ';
    if (ctx.measureText(test).width > 1800 && n > 0) {
      ctx.fillText(line, 1024, y);
      line = words[n] + ' '; y += lineH;
    } else { line = test; }
  }
  ctx.fillText(line, 1024, y);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

// ═══════════════════════════════════════════════════════════════════════════
// Ambient Audio
// ═══════════════════════════════════════════════════════════════════════════

async function playAmbientPiano() {
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioGain = audioCtx.createGain();
    audioGain.connect(audioCtx.destination);
    audioGain.gain.setValueAtTime(0, audioCtx.currentTime);
    const resp = await fetch('assets/audio/ambient.mp3');
    if (!resp.ok) return;
    const buf = await audioCtx.decodeAudioData(await resp.arrayBuffer());
    ambientSource = audioCtx.createBufferSource();
    ambientSource.buffer = buf;
    ambientSource.loop = true;
    ambientSource.connect(audioGain);
    ambientSource.start(0);
    audioGain.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime + 4);
  } catch (e) {
    console.log('Audio unavailable:', e.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Buttons
// ═══════════════════════════════════════════════════════════════════════════

function initButtons() {
  const yesBtn = document.getElementById('yesBtn');
  const noBtn = document.getElementById('noBtn');
  const letterSection = document.getElementById('loveLetter');
  const reasonsSection = document.getElementById('reasons');
  const memoriesSection = document.getElementById('memories');
  const countdownSection = document.getElementById('countdown');

  let clickCount = 0;
  const msgs = ["Are you sure?", "Think again!", "Don't be hasty...", "My heart will break 💔", "Pretty please?", "I'll be very sad!", "You know you want to! 😉", "Last chance to reconsider!", "...still waiting for that yes 💖"];

  yesBtn.addEventListener('click', () => {
    yesBtn.classList.add('jumping');
    setTimeout(() => yesBtn.classList.remove('jumping'), 400);
    letterSection.classList.remove('hidden');
    gsap.to(letterSection, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
    simpleTypewriter(document.getElementById('letterText'), CONFIG.mainMessage, IS_MOBILE ? 18 : 28);

    setTimeout(() => {
      reasonsSection.classList.remove('hidden');
      gsap.to(reasonsSection.querySelector('.bento-card'), { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
      renderReasons();
    }, 800);

    setTimeout(() => {
      memoriesSection.classList.remove('hidden');
      gsap.to(memoriesSection, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
      renderGallery();
    }, IS_MOBILE ? 1200 : 1600);

    setTimeout(() => {
      countdownSection.classList.remove('hidden');
      gsap.to(countdownSection.querySelector('.bento-card'), { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
    }, IS_MOBILE ? 1800 : 2200);
  });

  noBtn.addEventListener('click', () => {
    clickCount++;
    const sz = parseFloat(getComputedStyle(yesBtn).fontSize);
    yesBtn.style.fontSize = `${sz + 1.2}px`;
    yesBtn.style.padding = `${0.85 + clickCount * 0.15}rem ${2 + clickCount * 0.3}rem`;
    noBtn.textContent = msgs[clickCount % msgs.length];
    const dx = Math.sin(clickCount) * 12, dy = Math.cos(clickCount) * -6;
    noBtn.style.transform = `translate(${dx}px, ${dy}px)`;
    if (clickCount > 6) tinyConfetti(noBtn);
  });
}

function simpleTypewriter(el, text, speed = 28) {
  el.textContent = '';
  let i = 0;
  const interval = setInterval(() => { el.textContent += text.charAt(i); i++; if (i >= text.length) clearInterval(interval); }, speed);
}

// ═══════════════════════════════════════════════════════════════════════════
// Render Helpers
// ═══════════════════════════════════════════════════════════════════════════

function renderReasons() {
  const grid = document.getElementById('reasonsGrid');
  const hearts = ['💗','💕','💖','💓','💘'];
  CONFIG.reasons.forEach((reason, idx) => {
    const div = document.createElement('div');
    div.className = 'reason-item';
    div.classList.add('fade-in');
    div.innerHTML = `<span class="reason-icon">${hearts[idx%hearts.length]}</span><span>${reason}</span>`;
    grid.appendChild(div);
  });
}

function renderGallery() {
  const gallery = document.getElementById('gallery');
  const rots = ['1.2deg', '-1deg', '0.8deg', '-0.6deg'];
  CONFIG.memoryPhotos.forEach((photo, idx) => {
    const fig = document.createElement('figure');
    fig.className = 'polaroid';
    fig.style.setProperty('--rotation', rots[idx%rots.length]);
    fig.classList.add('fade-in');
    fig.innerHTML = `<img src="assets/${photo.file}" alt="${photo.caption}" onerror="this.style.display='none'"><figcaption>${photo.caption}</figcaption>`;
    gallery.appendChild(fig);
    setTimeout(() => fig.classList.add('visible'), idx * (IS_MOBILE ? 120 : 180));
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Countdown
// ═══════════════════════════════════════════════════════════════════════════

function startCountdown() {
  const target = new Date(CONFIG.countdownDate).getTime();
  const timerEl = document.getElementById('timer');
  function update() {
    const now = Date.now();
    const diff = target - now;
    if (diff <= 0) { timerEl.textContent = '💞 Forever starts now!'; return; }
    const d = Math.floor(diff / (1000*60*60*24)), h = Math.floor((diff % (1000*60*60*24))/(1000*60*60)), m = Math.floor((diff % (1000*60*60))/(1000*60)), s = Math.floor((diff % (1000*60))/1000);
    timerEl.textContent = `${d}d ${h}h ${m}m ${s}s`;
  }
  update(); setInterval(update, 1000);
}

// ═══════════════════════════════════════════════════════════════════════════
// Particles
// ═══════════════════════════════════════════════════════════════════════════

function initParticles() {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize(); window.addEventListener('resize', resize);

  const particles = [];
  const count = IS_MOBILE ? 24 : 48;

  for (let i = 0; i < count; i++) {
    particles.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, radius: Math.random()*20+6, speedX: (Math.random()-0.5)*0.3, speedY: (Math.random()-0.5)*0.3, alpha: Math.random()*0.28+0.1, hue: Math.random()>0.5 ? '255,143,163' : '142,197,252' });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';
    particles.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
      ctx.fillStyle = `rgba(${p.hue}, ${p.alpha})`; ctx.fill();
      p.x += p.speedX; p.y += p.speedY;
      if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
      if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
    });
  }
  function animate() { draw(); requestAnimationFrame(animate); }
  animate();
}

// ═══════════════════════════════════════════════════════════════════════════
// Lenis + GSAP ScrollTrigger (always works, even without Three.js)
// ═══════════════════════════════════════════════════════════════════════════

function initScroll() {
  const lenis = new Lenis({ duration: IS_MOBILE ? 1.0 : 1.3, easing: t => Math.min(1, 1.001 - Math.pow(2, -10*t)), smooth: true, smoothTouch: false, touchMultiplier: 2 });
  function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);

  gsap.registerPlugin(ScrollTrigger);
  document.querySelectorAll('.glass-card, .bento-card').forEach(card => {
    gsap.to(card, { opacity: 1, y: 0, duration: IS_MOBILE ? 0.8 : 1.1, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 85%' } });
  });

  gsap.utils.toArray('.polaroid').forEach((pic, i) => {
    gsap.to(pic, { opacity: 1, y: 0, rotation: parseFloat(getComputedStyle(pic).getPropertyValue('--rotation')) || 0,
      duration: IS_MOBILE ? 1.0 : 1.3, delay: i * (IS_MOBILE ? 0.1 : 0.15), ease: 'power2.out', scrollTrigger: { trigger: pic, start: 'top 90%' } });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Confetti
// ═══════════════════════════════════════════════════════════════════════════

function tinyConfetti(btn) {
  const r = btn.getBoundingClientRect();
  const c = document.createElement('canvas');
  Object.assign(c.style, { position: 'fixed', left: r.left+'px', top: r.top+'px', width: r.width+'px', height: r.height+'px', pointerEvents: 'none', zIndex: 9999 });
  document.body.appendChild(c);
  const ctx = c.getContext('2d'), p = [];
  for (let i = 0; i < 20; i++) p.push({ x: c.width/2, y: c.height/2, vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6, color: `hsl(${Math.random()*360},80%,65%)`, life: 1 });
  function render() {
    ctx.clearRect(0,0,c.width,c.height);
    p.forEach(p => { p.x+=p.vx; p.y+=p.vy; p.vy+=0.15; p.life-=0.02; ctx.globalAlpha=p.life; ctx.fillStyle=p.color; ctx.fillRect(p.x,p.y,4,4); });
    if (p[0].life>0) requestAnimationFrame(render); else c.remove();
  }
  render();
}

// ═══════════════════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════════════════

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function onWindowResize() {
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (composer) composer.setSize(window.innerWidth, window.innerHeight);
  }
}

function animate() {
  requestAnimationFrame(animate);
  if (composer) composer.render();
  else renderer.render(scene, camera);
}

function seedText() {
  document.getElementById('herName').textContent = CONFIG.herName;
  document.getElementById('yourName').textContent = CONFIG.yourName;
  document.getElementById('yourNameInLetter').textContent = CONFIG.yourName;
  document.getElementById('yourNameSign').textContent = CONFIG.yourName;
  document.getElementById('footerHerName').textContent = CONFIG.herName;
  document.getElementById('tagline').textContent = CONFIG.tagline;
  document.getElementById('subText').textContent = CONFIG.tagline;
  // Fallback CSS envelope
  document.getElementById('fallbackInvitation').textContent = CONFIG.invitationLine;
  document.getElementById('fallbackYourName').textContent = CONFIG.yourName;
}

// Expose for debugging
window.CONFIG = CONFIG;
window.toggleAudio = () => { if (!audioGain) return; audioGain.gain.value > 0 ? audioGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime+0.5) : audioGain.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime+0.5); };