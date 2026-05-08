/**
 * Ethereal Glass Valentine — Interactive Engine (3D Envelope + GSAP + Lenis)
 * Romantic webapp with Three.js 3D envelope, scroll-triggered bento cards,
 * particle system, and letter auto-typewriter.
 */

// ═══════════════════════════════════════════════════════════════════════════
// Globals
// ═══════════════════════════════════════════════════════════════════════════

let CONFIG;
let scene, camera, renderer, envelopeGroup, letterMesh;
let isEnvelopeOpen = false;
let raycaster, mouse;
const clock = new THREE.Clock();

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
      mainMessage: 'From the moment our eyes first met, my world has had a new hue. Every day with you feels like stepping into a dream painted in softer colors, warmer light. This is a small piece of my heart, rendered in glass and light — because you deserve something as beautiful as the love you\'ve given me.',
      reasons: [
        'Your laugh is my favorite sound',
        'You see beauty in the smallest things',
        'Your heart is the gentlest place I know',
        'You believe in me even when I doubt',
        'Our quiet mornings are my sanctuary'
      ],
      memoryPhotos: [],
      countdownDate: '2026-02-14T00:00:00',
      theme: {
        bgStart: '#e0c3fc',
        bgMid: '#8ec5fc',
        bgEnd: '#ffb6b9',
        glassOpacity: 0.25,
        primaryAccent: '#ff8fa3',
        textDark: '#2d2d2d',
        textLight: '#f5f5f5'
      }
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
// Three.js Envelope Scene
// ═══════════════════════════════════════════════════════════════════════════

function initThree() {
  const container = document.getElementById('canvas-container');
  scene = new THREE.Scene();

  // Camera — positioned for hero view
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 8);

  // Renderer (alpha: true to blend with CSS background)
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Lights — soft romantic
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const spot = new THREE.SpotLight(0xffffff, 0.8);
  spot.position.set(5, 8, 6);
  spot.angle = Math.PI / 6;
  spot.penumbra = 0.3;
  spot.castShadow = true;
  spot.shadow.bias = -0.0001;
  scene.add(spot);

  const fill = new THREE.PointLight(0xffb6b9, 0.3, 20);
  fill.position.set(-3, 2, 4);
  scene.add(fill);

  // Build 3D envelope
  buildEnvelope();

  // Raycaster for click detection
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Event listeners
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('click', onMouseClick);
  window.addEventListener('mousemove', onMouseMove);

  // Start animation loop
  animate();
}

// ═══════════════════════════════════════════════════════════════════════════
// Envelope Construction
// ═══════════════════════════════════════════════════════════════════════════

function buildEnvelope() {
  envelopeGroup = new THREE.Group();
  scene.add(envelopeGroup);

  // Materials
  const envelopeMat = new THREE.MeshStandardMaterial({
    color: 0xfff8f0,
    roughness: 0.6,
    metalness: 0.05,
    side: THREE.DoubleSide
  });

  const flapMat = new THREE.MeshStandardMaterial({
    color: 0xfff0e6,
    roughness: 0.5,
    metalness: 0.05,
    side: THREE.DoubleSide
  });

  const sealMat = new THREE.MeshStandardMaterial({
    color: 0xff8fa3,
    roughness: 0.4,
    metalness: 0.1,
    emissive: 0xff8fa3,
    emissiveIntensity: 0.2
  });

  // Envelope base (vertical rectangle standing up)
  const baseGeo = new THREE.BoxGeometry(2.2, 0.08, 1.6);
  const base = new THREE.Mesh(baseGeo, envelopeMat);
  base.position.y = 0;
  base.castShadow = true;
  base.receiveShadow = true;
  envelopeGroup.add(base);

  // Front triangular pocket (left + right triangles form a pocket)
  // Left triangle
  const triGeo = new THREE.BufferGeometry();
  triGeo.setAttribute('position', new THREE.Float32BufferAttribute([
    0, -0.8, -0.8,    // top inner
    -1.1, -0.8, 0.8,  // bottom left outer
    1.1, -0.8, 0.8    // bottom right outer
  ], 3));
  triGeo.setAttribute('uv', new THREE.Float32BufferAttribute([0.5,1, 0,0, 1,0], 2));
  triGeo.computeVertexNormals();
  const frontPocket = new THREE.Mesh(triGeo, flapMat);
  frontPocket.position.y = -0.04;
  frontPocket.rotation.x = -Math.PI / 2;
  envelopeGroup.add(frontPocket);

  // Top flap (opens upward)
  const topFlapGeo = new THREE.ConeGeometry(1.15, 0.02, 4, 1, true); // pyramid tip
  const topFlap = new THREE.Mesh(topFlapGeo, flapMat);
  topFlap.position.set(0, 0.02, -0.5);
  topFlap.rotation.x = Math.PI;
  topFlap.name = 'topFlap';
  envelopeGroup.add(topFlap);

  // Bottom flap (opens downward)
  const bottomFlapGeo = new THREE.ConeGeometry(1.15, 0.02, 4, 1, true);
  const bottomFlap = new THREE.Mesh(bottomFlapGeo, flapMat);
  bottomFlap.position.set(0, -0.02, 0.5);
  bottomFlap.rotation.x = 0;
  bottomFlap.name = 'bottomFlap';
  envelopeGroup.add(bottomFlap);

  // Letter inside (thin plane with text texture)
  const letterGeo = new THREE.PlaneGeometry(1.9, 1.3);
  // We'll use a canvas texture for the typewriter text
  const letterTex = createLetterTexture('');
  const letterMat = new THREE.MeshBasicMaterial({
    map: letterTex,
    transparent: true,
    opacity: 0.95
  });
  letterMesh = new THREE.Mesh(letterGeo, letterMat);
  letterMesh.position.set(0, -0.6, 0.05);
  letterMesh.rotation.x = Math.PI / 2;
  envelopeGroup.add(letterMesh);
  letterMesh.visible = false;

  // Text under envelope — invitation line (3D text using sprite)
  const invText = createTextSprite(CONFIG.invitationLine, 0.7);
  invText.position.set(0, -1.8, 0);
  envelopeGroup.add(invText);

  // Sealing wax heart
  const heartShape = new THREE.Shape();
  heartShape.moveTo(0, 0.25);
  heartShape.bezierCurveTo(0, 0.35, 0.15, 0.4, 0.2, 0.3);
  heartShape.bezierCurveTo(0.25, 0.2, 0.25, 0.1, 0.2, 0);
  heartShape.bezierCurveTo(0.15, -0.1, 0, -0.05, 0, 0.05);
  heartShape.bezierCurveTo(0, -0.05, -0.15, -0.1, -0.2, 0);
  heartShape.bezierCurveTo(-0.25, 0.1, -0.25, 0.2, -0.2, 0.3);
  heartShape.bezierCurveTo(-0.15, 0.4, 0, 0.35, 0, 0.25);

  const heartGeo = new THREE.ShapeGeometry(heartShape);
  const heartMesh = new THREE.Mesh(heartGeo, sealMat);
  heartMesh.position.set(0, 0.12, -0.76);
  heartMesh.scale.set(0.6, 0.6, 0.6);
  envelopeGroup.add(heartMesh);

  // Initial hover animation — gentle float + slow rotation
  gsap.to(envelopeGroup.position, {
    y: 0.1,
    duration: 2.5,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  gsap.to(envelopeGroup.rotation, {
    y: 0.03,
    duration: 5,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Helpers: Text sprite & letter texture canvas
// ═══════════════════════════════════════════════════════════════════════════

function createTextSprite(text, scale = 0.5) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 1024;
  canvas.height = 256;

  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = 'bold 60px "Cormorant Garamond", Georgia, serif';
  ctx.fillStyle = '#2d2d2d';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;

  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(4 * scale, 1 * scale, 1);
  sprite.renderOrder = 999;
  return sprite;
}

function createLetterTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');

  // Paper background
  ctx.fillStyle = '#fffef7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Text (centered, serif)
  ctx.font = '42px "Cormorant Garamond", Georgia, serif';
  ctx.fillStyle = '#2d2d2d';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const words = text.split(' ');
  let line = '';
  let y = 200;
  const lineHeight = 70;

  for (let n = 0; n < words.length; n++) {
    const test = line + words[n] + ' ';
    if (ctx.measureText(test).width > canvas.width - 100 && n > 0) {
      ctx.fillText(line, canvas.width / 2, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, canvas.width / 2, y);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

// ═══════════════════════════════════════════════════════════════════════════
// Envelope Interaction
// ═══════════════════════════════════════════════════════

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Subtle parallax: rotate envelope slightly toward mouse
  if (!isEnvelopeOpen) {
    const targetRotY = mouse.x * 0.05;
    const targetRotX = mouse.y * 0.03;
    gsap.to(envelopeGroup.rotation, {
      x: targetRotX,
      y: targetRotY,
      duration: 0.6,
      ease: 'power2.out'
    });
  }
}

function onMouseClick(event) {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(envelopeGroup.children, true);

  if (intersects.length > 0 && !isEnvelopeOpen) {
    openEnvelope();
  }
}

async function openEnvelope() {
  if (isEnvelopeOpen) return;
  isEnvelopeOpen = true;
  document.body.classList.add('envelope-active');

  // Show letter mesh
  letterMesh.visible = true;

  // Animate flaps open with GSAP
  const topFlap = envelopeGroup.getObjectByName('topFlap');
  const bottomFlap = envelopeGroup.getObjectByName('bottomFlap');

  gsap.to(topFlap.rotation, { x: -2.2, duration: 1.2, ease: 'power2.out' });
  gsap.to(bottomFlap.rotation, { x: 2.2, duration: 1.2, ease: 'power2.out' });
  gsap.to(envelopeGroup.position, { y: 0.15, duration: 1.2, ease: 'power2.out' });

  // After flap opens, slide letter up and type text
  await sleep(1100);
  gsap.to(letterMesh.position, {
    y: 0.3,
    z: 0.2,
    duration: 1.0,
    ease: 'back.out(1.3)'
  });

  await sleep(400);
  typeOnLetterTexture(CONFIG.invitationLine);

  // Then reveal response buttons
  setTimeout(() => {
    document.getElementById('responseSection').classList.remove('hidden');
    const card = document.querySelector('#responseSection .glass-card');
    gsap.to(card, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
    initButtons();
  }, CONFIG.invitationLine.length * 30 + 600);

  // Hide paper text sprite
  envelopeGroup.children.forEach(c => {
    if (c.isSprite) gsap.to(c.scale, { x: 0, y: 0, duration: 0.5 });
  });
}

// Typewriter directly onto the letter plane's canvas texture
function typeOnLetterTexture(text) {
  const canvas = letterMesh.material.map.image;
  const ctx = canvas.getContext('2d');

  // Clear with paper color
  ctx.fillStyle = '#fffef7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = '42px "Cormorant Garamond", Georgia, serif';
  ctx.fillStyle = '#2d2d2d';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Type char by char
  let i = 0;
  const interval = setInterval(() => {
    const sub = text.substring(0, i + 1);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fffef7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // wrap
    const words = sub.split(' ');
    let line = '';
    let y = 200;
    const lineHeight = 70;

    for (let n = 0; n < words.length; n++) {
      const test = line + words[n] + ' ';
      if (ctx.measureText(test).width > canvas.width - 100 && n > 0) {
        ctx.fillText(line, canvas.width / 2, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, canvas.width / 2, y);

    letterMesh.material.map.needsUpdate = true;
    i++;
    if (i >= text.length) clearInterval(interval);
  }, 30);
}

// ═══════════════════════════════════════════════════════════════════════════
// Button Dynamics
// ═══════════════════════════════════════════════════════════════════════════

function initButtons() {
  const yesBtn = document.getElementById('yesBtn');
  const noBtn = document.getElementById('noBtn');
  const letterSection = document.getElementById('loveLetter');
  const reasonsSection = document.getElementById('reasons');
  const memoriesSection = document.getElementById('memories');
  const countdownSection = document.getElementById('countdown');

  let clickCount = 0;
  const noMessages = [
    "Are you sure?",
    "Think again!",
    "Don't be hasty...",
    "My heart will break 💔",
    "Pretty please?",
    "I'll be very sad!",
    "You know you want to! 😉",
    "Last chance to reconsider!",
    "...still waiting for that yes 💖"
  ];

  yesBtn.addEventListener('click', () => {
    yesBtn.classList.add('jumping');
    setTimeout(() => yesBtn.classList.remove('jumping'), 400);
    letterSection.classList.remove('hidden');
    gsap.to(letterSection, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
    const typeEl = document.getElementById('letterText');
    simpleTypewriter(typeEl, CONFIG.mainMessage);

    setTimeout(() => {
      reasonsSection.classList.remove('hidden');
      const reasonsCard = reasonsSection.querySelector('.bento-card');
      gsap.to(reasonsCard, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
      renderReasons();
    }, 800);

    setTimeout(() => {
      memoriesSection.classList.remove('hidden');
      gsap.to(memoriesSection, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
      renderGallery();
    }, 1600);

    setTimeout(() => {
      countdownSection.classList.remove('hidden');
      const countdownCard = countdownSection.querySelector('.bento-card');
      gsap.to(countdownCard, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
    }, 2200);
  });

  noBtn.addEventListener('click', () => {
    clickCount++;
    const currentSize = parseFloat(getComputedStyle(yesBtn).fontSize);
    yesBtn.style.fontSize = `${currentSize + 1.2}px`;
    yesBtn.style.padding = `${0.85 + clickCount * 0.15}rem ${2 + clickCount * 0.3}rem`;
    noBtn.textContent = noMessages[clickCount % noMessages.length];
    const driftX = Math.sin(clickCount) * 12;
    const driftY = Math.cos(clickCount) * -6;
    noBtn.style.transform = `translate(${driftX}px, ${driftY}px)`;
    if (clickCount > 6) tinyConfetti(noBtn);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Simple Typewriter (DOM)
// ═══════════════════════════════════════════════════════════════════════════

function simpleTypewriter(el, text, speed = 28) {
  el.textContent = '';
  let i = 0;
  const interval = setInterval(() => {
    el.textContent += text.charAt(i);
    i++;
    if (i >= text.length) clearInterval(interval);
  }, speed);
}

// ═══════════════════════════════════════════════════════════════════════════
// Render Helpers
// ═══════════════════════════════════════════════════════════════════════════

function renderReasons() {
  const grid = document.getElementById('reasonsGrid');
  const hearts = ['💗', '💕', '💖', '💓', '💘'];
  CONFIG.reasons.forEach((reason, idx) => {
    const div = document.createElement('div');
    div.className = 'reason-item';
    div.style.animationDelay = `${idx * 0.12}s`;
    div.classList.add('fade-in');
    div.innerHTML = `<span class="reason-icon">${hearts[idx % hearts.length]}</span><span>${reason}</span>`;
    grid.appendChild(div);
  });
}

function renderGallery() {
  const gallery = document.getElementById('gallery');
  const rotations = ['1deg', '-1deg', '0.5deg', '-0.5deg'];
  CONFIG.memoryPhotos.forEach((photo, idx) => {
    const figure = document.createElement('figure');
    figure.className = 'polaroid';
    figure.style.setProperty('--rotation', rotations[idx % rotations.length]);
    figure.classList.add('fade-in');
    figure.innerHTML = `<img src="assets/${photo.file}" alt="${photo.caption}" onerror="this.style.display='none'"><figcaption>${photo.caption}</figcaption>`;
    gallery.appendChild(figure);

    // GSAP stagger
    setTimeout(() => figure.classList.add('visible'), idx * 150);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Countdown Timer
// ═══════════════════════════════════════════════════════════════════════════

function startCountdown() {
  const target = new Date(CONFIG.countdownDate).getTime();
  const timerEl = document.getElementById('timer');

  function update() {
    const now = Date.now();
    const diff = target - now;
    if (diff <= 0) {
      timerEl.textContent = '💞 Forever starts now!';
      return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hrs = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    timerEl.textContent = `${days}d ${hrs}h ${mins}m ${secs}s`;
  }

  update();
  setInterval(update, 1000);
}

// ═══════════════════════════════════════════════════════════════════════════
// Particle System
// ═══════════════════════════════════════════════════════════════════════════

function initParticles() {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  const particles = [];
  const count = 42;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 22 + 8,
      speedX: (Math.random() - 0.5) * 0.35,
      speedY: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.32 + 0.12,
      hue: Math.random() > 0.5 ? '255, 143, 163' : '142, 197, 252'
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.hue}, ${p.alpha})`;
      ctx.fill();
      p.x += p.speedX; p.y += p.speedY;
      if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
      if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
    });
  }
  function animate() { draw(); requestAnimationFrame(animate); }
  animate();
}

// ═══════════════════════════════════════════════════════════════════════════
// Lenis Smooth Scroll + GSAP ScrollTrigger
// ═══════════════════════════════════════════════════════════════════════════

function initScroll() {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Wire GSAP ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);

  // Glass cards & bento cards reveal on scroll
  const cards = document.querySelectorAll('.glass-card, .bento-card');
  cards.forEach(card => {
    gsap.to(card, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: card,
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      }
    });
  });

  // Polaroids staggered
  gsap.utils.toArray('.polaroid').forEach((pic, i) => {
    gsap.to(pic, {
      opacity: 1,
      y: 0,
      rotation: parseFloat(getComputedStyle(pic).getPropertyValue('--rotation')) || 0,
      duration: 1.2,
      delay: i * 0.15,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: pic,
        start: 'top 90%'
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Confetti Burst (canvas)
// ═══════════════════════════════════════════════════════════════════════════

function tinyConfetti(btn) {
  const rect = btn.getBoundingClientRect();
  const c = document.createElement('canvas');
  Object.assign(c.style, { position: 'fixed', left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px', height: rect.height + 'px', pointerEvents: 'none', zIndex: 9999 });
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  const particles = [];
  for (let i = 0; i < 20; i++) {
    particles.push({ x: c.width / 2, y: c.height / 2, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, color: `hsl(${Math.random() * 360}, 80%, 65%)`, life: 1 });
  }
  function render() {
    ctx.clearRect(0, 0, c.width, c.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.02;
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 4, 4);
    });
    if (particles[0].life > 0) requestAnimationFrame(render);
    else c.remove();
  }
  render();
}

// ═══════════════════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════════════════

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// ═══════════════════════════════════════════════════════════════════════════
// Bootstrap
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  seedText();
  initParticles();
  initThree();
  initScroll();
  startCountdown();
});

function seedText() {
  document.getElementById('herName').textContent = CONFIG.herName;
  document.getElementById('yourName').textContent = CONFIG.yourName;
  document.getElementById('yourNameInLetter').textContent = CONFIG.yourName;
  document.getElementById('yourNameSign').textContent = CONFIG.yourName;
  document.getElementById('footerHerName').textContent = CONFIG.herName;
  document.getElementById('tagline').textContent = CONFIG.tagline;
  document.getElementById('subText').textContent = CONFIG.tagline;
}