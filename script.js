/**
 * CINEMATIC VALENTINE — Full production
 * 3D envelope, film grain, ambient piano, scroll-driven reveals
 */

const IS_MOBILE = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const USE_THREE = !IS_MOBILE && (() => {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch { return false; }
})();

let CONFIG, scene, camera, renderer, composer, bloomPass, envelopeGroup, letterMesh;
let isEnvelopeOpen = false, raycaster, mouse, clock = new THREE.Clock();
let audioCtx, audioGain, ambientSource, audioEnabled = true;

// ═══════════════════════════════════════════════════════════════════════════
// Config
// ═══════════════════════════════════════════════════════════════════════════

async function loadConfig() {
  try { CONFIG = await (await fetch('config.json')).json(); }
  catch { CONFIG = { herName: 'Candice', yourName: 'Michael', tagline: 'A digital love letter, crafted with glass and light.', invitationLine: 'To the one who came out of nowhere', mainMessage: 'From the moment our eyes first met...', reasons: ['Your laugh','You see beauty','Your heart','You believe in me','Our quiet mornings'], memoryPhotos: [], countdownDate: '2026-02-14T00:00:00', theme: { bgStart: '#e0c3fc', bgMid: '#8ec5fc', bgEnd: '#ffb6b9', glassOpacity: 0.28, primaryAccent: '#ff8fa3', textDark: '#2d2d2d', textLight: '#f5f5f5' } }; }
  applyTheme();
}

function applyTheme() {
  const r = document.documentElement, t = CONFIG.theme;
  r.style.setProperty('--bg-start', t.bgStart);
  r.style.setProperty('--bg-mid', t.bgMid);
  r.style.setProperty('--bg-end', t.bgEnd);
  r.style.setProperty('--glass-opacity', String(t.glassOpacity));
  r.style.setProperty('--primary', t.primaryAccent);
  r.style.setProperty('--text-dark', t.textDark);
  r.style.setProperty('--text-light', t.textLight);
}

// ═══════════════════════════════════════════════════════════════════════════
// Bootstrap
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  seedText();
  initParticles();
  initFilmGrain();
  startCountdown();

  const fallbackEnv = document.getElementById('fallback-envelope');
  let threeStarted = false;

  if (USE_THREE) {
    try {
      initThree();
      initScroll();
      threeStarted = true;
      fallbackEnv.classList.add('hidden');
      document.body.classList.add('three-active');
      console.log('🚀 Three.js cinematic mode');
    } catch (e) { console.warn('Three.js failed:', e); }
  }

  if (!threeStarted) {
    console.log('📱 CSS fallback envelope');
    initCSSEnvelope();
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// Text injection (safe)
// ═══════════════════════════════════════════════════════════════════════════

function seedText() {
  const s = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
  const ids = ['herName','yourName','yourNameInLetter','yourNameSign','footerHerName','tagline','subText','fallbackInvitation','fallbackYourName'];
  const vals = [CONFIG.herName, CONFIG.yourName, CONFIG.yourName, CONFIG.yourName, CONFIG.herName, CONFIG.tagline, CONFIG.tagline, CONFIG.invitationLine, CONFIG.yourName];
  ids.forEach((id, i) => s(id, vals[i]));
}

// ═══════════════════════════════════════════════════════════════════════════
// CSS Fallback Envelope (mobile)
// ═══════════════════════════════════════════════════════════════════════════

function initCSSEnvelope() {
  const env = document.getElementById('fallback-envelope');
  env.addEventListener('click', async () => {
    if (env.classList.contains('opened')) return;
    env.classList.add('opened');
    document.body.classList.add('envelope-active');
    if (audioEnabled) await playAmbientPiano();

    await sleep(1400);
    const letter = env.querySelector('.fallback-letter');
    let i = 0, text = CONFIG.invitationLine;
    const int = setInterval(() => {
      letter.textContent = text.substring(0, i+1) + (i < text.length-1 ? '|' : '');
      i++;
      if (i >= text.length) {
        clearInterval(int);
        letter.textContent = text;
        setTimeout(() => {
          document.getElementById('responseSection').classList.remove('hidden');
          gsap.to(document.querySelector('#responseSection .glass-card'), { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' });
          initButtons();
        }, 700);
      }
    }, 28);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Three.js Cinematic Envelope
// ═══════════════════════════════════════════════════════════════════════════

function initThree() {
  const container = document.getElementById('canvas-container');
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(IS_MOBILE ? 42 : 48, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, IS_MOBILE ? 11 : 7.5);

  renderer = new THREE.WebGLRenderer({ antialias: !IS_MOBILE, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_MOBILE ? 1.5 : 2));
  renderer.shadowMap.enabled = !IS_MOBILE;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  container.appendChild(renderer.domElement);

  if (!IS_MOBILE) {
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));
    bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.9, 0.5, 0.9);
    composer.addPass(bloomPass);
  }

  // Cinematic lighting — three-point
  const ambient = new THREE.AmbientLight(0xffffff, IS_MOBILE ? 0.75 : 0.55);
  scene.add(ambient);

  const key = new THREE.SpotLight(0xffffff, IS_MOBILE ? 1.1 : 1.4);
  key.position.set(6, 12, 9);
  key.angle = Math.PI / 4.5;
  key.penumbra = 0.45;
  key.castShadow = !IS_MOBILE;
  if (!IS_MOBILE) { key.shadow.bias = -0.0002; key.shadow.mapSize.set(2048, 2048); }
  scene.add(key);

  const rim = new THREE.PointLight(0xffb6b9, 0.5, 30);
  rim.position.set(-5, 3, 6);
  scene.add(rim);

  if (!IS_MOBILE) scene.fog = new THREE.Fog(0xe0c3fc, 15, 35);

  buildEnvelope();

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  window.addEventListener('resize', onWindowResize);
  window.addEventListener('click', onMouseClick);
  window.addEventListener('mousemove', onMouseMove);

  animate();
}

// ═══════════════════════════════════════════════════════════════════════════
// Build Beautiful Envelope
// ═══════════════════════════════════════════════════════════════════════════

function buildEnvelope() {
  envelopeGroup = new THREE.Group();
  scene.add(envelopeGroup);

  const makePaper = (hex) => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 512;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#' + new THREE.Color(hex).getHexString();
    ctx.fillRect(0, 0, 512, 512);
    const img = ctx.getImageData(0, 0, 512, 512);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 11;
      img.data[i] = Math.min(255, img.data[i] + n);
      img.data[i+1] = Math.min(255, img.data[i+1] + n);
      img.data[i+2] = Math.min(255, img.data[i+2] + n);
    }
    ctx.putImageData(img, 0, 0);
    // Fine fibers
    ctx.strokeStyle = 'rgba(0,0,0,0.012)';
    ctx.lineWidth = 1;
    for (let y = 12; y < 512; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y + Math.random()*4);
      ctx.lineTo(512, y + Math.random()*4);
      ctx.stroke();
    }
    return c;
  };

  const paperTex = new THREE.CanvasTexture(makePaper(0xfff8f0));
  const flapTex = new THREE.CanvasTexture(makePaper(0xfff0e6));

  const envelopeMat = new THREE.MeshStandardMaterial({
    map: paperTex, roughness: 0.65, metalness: 0.0, side: THREE.DoubleSide
  });
  const flapMat = new THREE.MeshStandardMaterial({
    map: flapTex, roughness: 0.6, metalness: 0.0, side: THREE.DoubleSide
  });
  const sealMat = new THREE.MeshStandardMaterial({
    color: 0xff8fa3, roughness: 0.2, metalness: 0.25,
    emissive: 0xff8fa3, emissiveIntensity: 0.6
  });

  // Base
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.15, 2.3), envelopeMat);
  base.position.y = -0.075; base.castShadow = true; base.receiveShadow = true;
  envelopeGroup.add(base);

  // Front pocket
  const pocket = new THREE.Mesh(new THREE.BufferGeometry(), flapMat);
  pocket.geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, -0.06, -1.2,
    -1.45, -0.06, 1.2,
    1.45, -0.06, 1.2
  ], 3));
  pocket.geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0.5,1, 0,0, 1,0], 2));
  pocket.geometry.computeVertexNormals();
  envelopeGroup.add(pocket);

  // Side panels
  [[-1.45,-0.06,-1.2, -1.45,-0.06,1.2, -1.65,-0.06,0],
   [1.45,-0.06,-1.2,  1.45,-0.06,1.2,  1.65,-0.06,0]].forEach(v => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0,1, 0,0, 1,0.5], 2));
    g.computeVertexNormals();
    envelopeGroup.add(new THREE.Mesh(g, envelopeMat));
  });

  // Flaps
  const topFlap = new THREE.Mesh(new THREE.ConeGeometry(1.55, 0.045, 4, 1, true), flapMat);
  topFlap.position.set(0, 0.02, -0.65);
  topFlap.rotation.x = Math.PI;
  topFlap.name = 'topFlap';
  envelopeGroup.add(topFlap);

  const botFlap = new THREE.Mesh(new THREE.ConeGeometry(1.55, 0.045, 4, 1, true), flapMat);
  botFlap.position.set(0, -0.02, 0.65);
  botFlap.name = 'bottomFlap';
  envelopeGroup.add(botFlap);

  // Letter
  const letterTex = createLetterTexture('');
  const letter = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 2.0), new THREE.MeshBasicMaterial({ map: letterTex, transparent: true, opacity: 0.98 }));
  letter.position.set(0, -0.85, 0.08);
  letter.rotation.x = Math.PI / 2;
  letter.visible = false;
  envelopeGroup.add(letter);
  envelopeGroup.userData.letterMesh = letter;

  // Wax seal (heart)
  const heartShape = new THREE.Shape();
  heartShape.moveTo(0, 0.42);
  heartShape.bezierCurveTo(0, 0.58, 0.32, 0.62, 0.42, 0.5);
  heartShape.bezierCurveTo(0.48, 0.38, 0.48, 0.18, 0.42, 0);
  heartShape.bezierCurveTo(0.32, -0.18, 0, -0.09, 0, 0.09);
  heartShape.bezierCurveTo(0, 0.09, -0.32, -0.18, -0.42, 0);
  heartShape.bezierCurveTo(-0.48, 0.18, -0.48, 0.38, -0.42, 0.5);
  heartShape.bezierCurveTo(-0.32, 0.62, 0, 0.58, 0, 0.42);

  const heart = new THREE.Mesh(new THREE.ShapeGeometry(heartShape), sealMat);
  heart.position.set(0, 0.22, -0.92);
  heart.scale.set(0.82, 0.82, 0.82);
  envelopeGroup.add(heart);

  // Floating invitation sprite
  const invSprite = createTextSprite(CONFIG.invitationLine, 0.55);
  invSprite.position.set(0, -1.8, 0);
  envelopeGroup.add(invSprite);
  envelopeGroup.userData.invSprite = invSprite;

  // Cinematic float & rotate
  gsap.to(envelopeGroup.position, { y: 0.22, duration: IS_MOBILE ? 6 : 5, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  gsap.to(envelopeGroup.rotation, { y: IS_MOBILE ? 0.015 : 0.028, duration: IS_MOBILE ? 12 : 10, repeat: -1, yoyo: true, ease: 'sine.inOut' });

  if (!IS_MOBILE) {
    gsap.to(bloomPass, 'strength', { value: 0.75, duration: 3.2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  }
}

function makePaper(hex) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#' + new THREE.Color(hex).getHexString();
  ctx.fillRect(0, 0, 512, 512);
  const img = ctx.getImageData(0, 0, 512, 512);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 11;
    img.data[i] = Math.min(255, img.data[i] + n);
    img.data[i+1] = Math.min(255, img.data[i+1] + n);
    img.data[i+2] = Math.min(255, img.data[i+2] + n);
  }
  ctx.putImageData(img, 0, 0);
  ctx.strokeStyle = 'rgba(0,0,0,0.012)';
  ctx.lineWidth = 1;
  for (let y = 12; y < 512; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y + Math.random()*4);
    ctx.lineTo(512, y + Math.random()*4);
    ctx.stroke();
  }
  return c;
}

// ═══════════════════════════════════════════════════════════════════════════
// Text sprite & letter texture
// ═══════════════════════════════════════════════════════════════════════════

function createTextSprite(text, scale = 0.55) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = 'bold 120px "Cormorant Garamond", Georgia, serif';
  ctx.fillStyle = '#2d2d2d';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width/2, canvas.height/2);
  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  sprite.scale.set(5.2 * scale, 1.25 * scale, 1);
  sprite.renderOrder = 999;
  return sprite;
}

function createLetterTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048; canvas.height = 1536;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fffef7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Vellum grain
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
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
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
// Interaction
// ═══════════════════════════════════════════════════════════════════════════

function onMouseMove(e) {
  if (IS_MOBILE) return;
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  if (!isEnvelopeOpen) {
    gsap.to(envelopeGroup.rotation, { x: mouse.y * 0.05, y: mouse.x * 0.07, duration: 0.8, ease: 'power2.out' });
  }
}

function onMouseClick(e) {
  if (IS_MOBILE) return;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(envelopeGroup.children, true);
  if (hits.length > 0 && !isEnvelopeOpen) openEnvelope();
}

// ═══════════════════════════════════════════════════════════════════════════
// Open Envelope — Cinematic sequence
// ═══════════════════════════════════════════════════════════════════════════

async function openEnvelope() {
  if (isEnvelopeOpen) return;
  isEnvelopeOpen = true;
  document.body.classList.add('envelope-active');
  if (audioEnabled) await playAmbientPiano();

  const letter = envelopeGroup.userData.letterMesh;
  letter.visible = true;

  if (!IS_MOBILE) gsap.to(camera.position, { z: IS_MOBILE ? 10 : 5.8, duration: 2.8, ease: 'power2.inOut' });

  const topF = envelopeGroup.getObjectByName('topFlap');
  const botF = envelopeGroup.getObjectByName('bottomFlap');

  gsap.to(topF.rotation, { x: IS_MOBILE ? -2.1 : -2.5, duration: IS_MOBILE ? 1.4 : 1.8, ease: 'power3.out' });
  gsap.to(botF.rotation, { x: IS_MOBILE ? 2.1 : 2.5, duration: IS_MOBILE ? 1.4 : 1.8, ease: 'power3.out' });
  gsap.to(envelopeGroup.position, { y: IS_MOBILE ? 0.22 : 0.26, duration: IS_MOBILE ? 1.4 : 1.8, ease: 'power3.out' });

  await sleep(IS_MOBILE ? 1300 : 1600);
  gsap.to(letter.position, { y: 0.32, z: 0.2, duration: 1.2, ease: 'back.out(1.35)' });

  await sleep(700);
  typeOnLetterTexture(letter, CONFIG.invitationLine, IS_MOBILE ? 16 : 22);

  setTimeout(() => {
    // Show photos FIRST
    const mem = document.getElementById('memories');
    mem.classList.remove('hidden');
    gsap.to(mem, { opacity: 1, y: 0, duration: 1.0, ease: 'power2.out' });
    renderGallery();

    setTimeout(() => {
      // Then buttons
      document.getElementById('responseSection').classList.remove('hidden');
      gsap.to(document.querySelector('#responseSection .glass-card'), { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' });
      initButtons();
    }, 600);

    // Hide floating text sprite
    envelopeGroup.children.forEach(c => { if (c.isSprite) gsap.to(c.scale, { x: 0, y: 0, duration: 0.5 }); });
  }, CONFIG.invitationLine.length * (IS_MOBILE ? 16 : 22) + 900);
}

function typeOnLetterTexture(mesh, text, speed = 22) {
  const canvas = mesh.material.map.image;
  const ctx = canvas.getContext('2d');
  const draw = sub => {
    ctx.fillStyle = '#fffef7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Grain
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 9;
      img.data[i] = Math.min(255, img.data[i] + n);
      img.data[i+1] = Math.min(255, img.data[i+1] + n);
      img.data[i+2] = Math.min(255, img.data[i+2] + n);
    }
    ctx.putImageData(img, 0, 0);

    ctx.font = '52px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = '#2d2d2d';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    const words = sub.split(' ');
    let line = '', y = 400, lineH = 80;
    for (let n = 0; n < words.length; n++) {
      const test = line + words[n] + ' ';
      if (ctx.measureText(test).width > 1800 && n > 0) {
        ctx.fillText(line, 1024, y);
        line = words[n] + ' '; y += lineH;
      } else { line = test; }
    }
    ctx.fillText(line, 1024, y);
    mesh.material.map.needsUpdate = true;
  };
  draw('');
  let i = 0;
  const interval = setInterval(() => { draw(text.substring(0, i + 1)); i++; if (i >= text.length) clearInterval(interval); }, speed);
}

// ═══════════════════════════════════════════════════════════════════════════
// Ambient Piano
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
  } catch (e) { console.log('Audio unavailable:', e.message); }
}

// ═══════════════════════════════════════════════════════════════════════════
// Buttons
// ═══════════════════════════════════════════════════════════════════════════

function initButtons() {
  const yesBtn = document.getElementById('yesBtn'), noBtn = document.getElementById('noBtn');
  const letterSec = document.getElementById('loveLetter');
  const reasonsSec = document.getElementById('reasons');
  const memSec = document.getElementById('memories');
  const countSec = document.getElementById('countdown');

  let clickCount = 0;
  const msgs = ["Are you sure?", "Think again!", "Don't be hasty...", "My heart will break 💔", "Pretty please?", "I'll be very sad!", "You know you want to! 😉", "Last chance to reconsider!", "...still waiting for that yes 💖"];

  yesBtn.addEventListener('click', () => {
    yesBtn.classList.add('jumping');
    setTimeout(() => yesBtn.classList.remove('jumping'), 400);
    letterSec.classList.remove('hidden');
    gsap.to(letterSec, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' });
    simpleTypewriter(document.getElementById('letterText'), CONFIG.mainMessage, IS_MOBILE ? 16 : 24);

    setTimeout(() => { reasonsSec.classList.remove('hidden'); gsap.to(reasonsSec.querySelector('.bento-card'), { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' }); renderReasons(); }, 800);
    setTimeout(() => { countSec.classList.remove('hidden'); gsap.to(countSec.querySelector('.bento-card'), { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' }); }, IS_MOBILE ? 1600 : 2000);
  });

  noBtn.addEventListener('click', () => {
    clickCount++;
    const sz = parseFloat(getComputedStyle(yesBtn).fontSize);
    yesBtn.style.fontSize = `${sz + 1.1}px`;
    yesBtn.style.padding = `${0.9 + clickCount * 0.12}rem ${2.2 + clickCount * 0.25}rem`;
    noBtn.textContent = msgs[clickCount % msgs.length];
    const dx = Math.sin(clickCount) * 10, dy = Math.cos(clickCount) * -5;
    noBtn.style.transform = `translate(${dx}px, ${dy}px)`;
    if (clickCount > 5) tinyConfetti(noBtn);
  });
}

function simpleTypewriter(el, text, speed = 24) {
  el.textContent = ''; let i = 0;
  const int = setInterval(() => { el.textContent += text.charAt(i); i++; if (i >= text.length) clearInterval(int); }, speed);
}

// ═══════════════════════════════════════════════════════════════════════════
// Render helpers
// ═══════════════════════════════════════════════════════════════════════════

function renderReasons() {
  const grid = document.getElementById('reasonsGrid');
  const hearts = ['💗','💕','💖','💓','💘'];
  CONFIG.reasons.forEach((r, i) => {
    const div = document.createElement('div');
    div.className = 'reason-item fade-in';
    div.innerHTML = `<span class="reason-icon">${hearts[i%hearts.length]}</span><span>${r}</span>`;
    grid.appendChild(div);
  });
}

function renderGallery() {
  const gal = document.getElementById('gallery');
  const rots = ['1.5deg', '-1.2deg', '0.9deg', '-0.7deg', '1.1deg'];
  CONFIG.memoryPhotos.forEach((p, i) => {
    const fig = document.createElement('figure');
    fig.className = 'polaroid';
    fig.style.setProperty('--rotation', rots[i%rots.length]);
    fig.classList.add('fade-in');
    fig.innerHTML = `<img src="assets/${p.file}" alt="${p.caption}" onerror="this.style.display='none'"><figcaption>${p.caption}</figcaption>`;
    gal.appendChild(fig);
    setTimeout(() => fig.classList.add('visible'), i * (IS_MOBILE ? 120 : 180));
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Countdown
// ═══════════════════════════════════════════════════════════════════════════

function startCountdown() {
  const target = new Date(CONFIG.countdownDate).getTime();
  const timerEl = document.getElementById('timer');
  function update() {
    const now = Date.now(), diff = target - now;
    if (diff <= 0) { timerEl.textContent = '💞 Forever starts now!'; return; }
    const d = Math.floor(diff / (1000*60*60*24)),
          h = Math.floor((diff % (1000*60*60*24))/(1000*60*60)),
          m = Math.floor((diff % (1000*60*60))/(1000*60)),
          s = Math.floor((diff % (1000*60))/1000);
    timerEl.textContent = `${d}d ${h}h ${m}m ${s}s`;
  }
  update(); setInterval(update, 1000);
}

// ═══════════════════════════════════════════════════════════════════════════
// Film Grain overlay
// ═══════════════════════════════════════════════════════════════════════════

function initFilmGrain() {
  const canvas = document.getElementById('grain-canvas');
  const ctx = canvas.getContext('2d');
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize(); window.addEventListener('resize', resize);

  // Generate static noise
  const imgData = ctx.createImageData(window.innerWidth, window.innerHeight);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const val = Math.random() * 20;
    data[i] = data[i+1] = data[i+2] = val;
    data[i+3] = 6; // very subtle alpha
  }
  ctx.putImageData(imgData, 0, 0);
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
  const count = IS_MOBILE ? 18 : 36;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 18 + 5,
      speedX: (Math.random() - 0.5) * 0.25,
      speedY: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.25 + 0.08,
      hue: Math.random() > 0.5 ? '255,143,163' : '142,197,252'
    });
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
  (function animate() { draw(); requestAnimationFrame(animate); })();
}

// ═══════════════════════════════════════════════════════════════════════════
// Lenis + GSAP ScrollTrigger (Cinematic choreography)
// ═══════════════════════════════════════════════════════════════════════════

function initScroll() {
  const lenis = new Lenis({ duration: IS_MOBILE ? 1.1 : 1.4, easing: t => Math.min(1, 1.001 - Math.pow(2, -10*t)), smooth: true, smoothTouch: false, touchMultiplier: 2 });
  function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);

  gsap.registerPlugin(ScrollTrigger);

  // Cinematic scroll reveals
  document.querySelectorAll('.glass-card, .bento-card').forEach(card => {
    gsap.to(card, {
      opacity: 1, y: 0,
      duration: IS_MOBILE ? 1.0 : 1.4,
      ease: 'power3.out',
      scrollTrigger: { trigger: card, start: 'top 80%', toggleActions: 'play none none reverse' }
    });
  });

  // Polaroid photos with parallax tilt
  gsap.utils.toArray('.polaroid').forEach((pic, i) => {
    gsap.to(pic, {
      opacity: 1, y: 0,
      rotation: parseFloat(getComputedStyle(pic).getPropertyValue('--rotation')) || 0,
      duration: IS_MOBILE ? 1.1 : 1.5,
      delay: i * (IS_MOBILE ? 0.1 : 0.2),
      ease: 'power2.out',
      scrollTrigger: { trigger: pic, start: 'top 85%' }
    });
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

// Debug expose
window.CONFIG = CONFIG;
window.toggleAudio = () => { if (!audioGain) return; audioGain.gain.value > 0 ? audioGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime+0.5) : audioGain.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime+0.5); };