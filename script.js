/**
 * Ethereal Glass Valentine — Interactive Engine
 * A romantic webapp experience with glassmorphic UI, particle effects,
 * typewriter animations, and playful button dynamics.
 */

// ═══════════════════════════════════════════════════════════════════════════
// Config Loading
// ═══════════════════════════════════════════════════════════════════════════

let CONFIG;
async function loadConfig() {
  try {
    const resp = await fetch('config.json');
    CONFIG = await resp.json();
  } catch (e) {
    console.error('Could not load config.json — using fallback defaults');
    CONFIG = {
      herName: 'Candice',
      yourName: 'Michael',
      tagline: 'A digital love letter, crafted with glass and light.',
      mainMessage: 'From the moment our eyes first met, my world has had a new hue. Every day with you feels like stepping into a dream painted in softer colors, warmer light. This is a small piece of my heart, rendered in glass and light — because you deserve something as beautiful as the love you\'ve given me.',
      reasons: [
        'Your laugh is my favorite sound',
        'You see beauty in the smallest things',
        'Your heart is the gentlest place I know'
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
// Init — DOM Content Loaded
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  seedText();
  initParticles();
  initButtons();
  revealSectionsSequentially();
  startCountdown();
});

// ═══════════════════════════════════════════════════════════════════════════
// Static Text Injection
// ═══════════════════════════════════════════════════════════════════════════

function seedText() {
  document.getElementById('herName').textContent = CONFIG.herName;
  document.getElementById('yourName').textContent = CONFIG.yourName;
  document.getElementById('footerHerName').textContent = CONFIG.herName;
  document.getElementById('tagline').textContent = CONFIG.tagline;
  document.getElementById('subText').textContent = CONFIG.tagline;
}

// ═══════════════════════════════════════════════════════════════════════════
// Button Dynamics — Growing Yes, Elusive No
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

    // Reveal hidden sections with a staggered entrance
    letterSection.classList.remove('hidden');
    letterSection.classList.add('fade-in');
    typeWriter(letterSection.querySelector('#letterText'), CONFIG.mainMessage);

    setTimeout(() => {
      reasonsSection.classList.remove('hidden');
      reasonsSection.classList.add('fade-in');
      renderReasons();
    }, 800);

    setTimeout(() => {
      memoriesSection.classList.remove('hidden');
      memoriesSection.classList.add('fade-in');
      renderGallery();
    }, 1400);

    setTimeout(() => {
      countdownSection.classList.remove('hidden');
      countdownSection.classList.add('fade-in');
    }, 2000);
  });

  noBtn.addEventListener('click', () => {
    clickCount++;
    // Make Yes button grow
    const currentSize = parseFloat(getComputedStyle(yesBtn).fontSize);
    yesBtn.style.fontSize = `${currentSize + 1.2}px`;
    yesBtn.style.padding = `${0.85 + clickCount * 0.15}rem ${2 + clickCount * 0.3}rem`;

    // Change No button text to something sweetly desperate
    noBtn.textContent = noMessages[clickCount % noMessages.length];

    // Nudge No away slightly (subtle drift)
    const driftX = Math.sin(clickCount) * 12;
    const driftY = Math.cos(clickCount) * -6;
    noBtn.style.transform = `translate(${driftX}px, ${driftY}px)`;

    // Confetti burst after many clicks
    if (clickCount > 6) {
      tinyConfetti(noBtn);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Typewriter Effect
// ═══════════════════════════════════════════════════════════════════════════

function typeWriter(el, text, speed = 22) {
  el.textContent = '';
  let i = 0;
  const interval = setInterval(() => {
    el.textContent += text.charAt(i);
    i++;
    if (i >= text.length) clearInterval(interval);
  }, speed);
}

// ═══════════════════════════════════════════════════════════════════════════
// Reasons Grid
// ═══════════════════════════════════════════════════════════════════════════

function renderReasons() {
  const grid = document.getElementById('reasonsGrid');
  const hearts = ['💗', '💕', '💖', '💓', '💘'];
  CONFIG.reasons.forEach((reason, idx) => {
    const div = document.createElement('div');
    div.className = 'reason-item';
    div.style.animationDelay = `${idx * 0.12}s`;
    div.classList.add('fade-in');
    div.innerHTML = `
      <span class="reason-icon">${hearts[idx % hearts.length]}</span>
      <span>${reason}</span>
    `;
    grid.appendChild(div);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Polaroid Gallery
// ═══════════════════════════════════════════════════════════════════════════

function renderGallery() {
  const gallery = document.getElementById('gallery');
  CONFIG.memoryPhotos.forEach((photo, idx) => {
    const figure = document.createElement('figure');
    figure.className = 'polaroid';
    figure.style.animationDelay = `${idx * 0.15}s`;
    figure.classList.add('fade-in');
    figure.innerHTML = `
      <img src="assets/${photo.file}" alt="${photo.caption}"
           onerror="this.style.display='none'">
      <figcaption>${photo.caption}</figcaption>
    `;
    gallery.appendChild(figure);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Countdown Timer
// ═══════════════════════════════════════════════════════════════════════════

function startCountdown() {
  const target = new Date(CONFIG.countdownDate).getTime();
  const timerEl = document.getElementById('timer');

  function update() {
    const now = new Date().getTime();
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
// Particle System — floating bokeh orbs
// ═══════════════════════════════════════════════════════════════════════════

function initParticles() {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const particles = [];
  const count = 36;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 18 + 6,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.35 + 0.1,
      hue: Math.random() > 0.5 ? '255, 143, 163' : '142, 197, 252' // coral or sky
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.hue}, ${p.alpha})`;
      ctx.fill();

      // drift
      p.x += p.speedX;
      p.y += p.speedY;

      // gentle bounce off edges
      if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
      if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
    });
  }

  function animate() { draw(); requestAnimationFrame(animate); }
  animate();
}

// ═══════════════════════════════════════════════════════════════════════════
// Little confetti burst (canvas in button)
// ═══════════════════════════════════════════════════════════════════════════

function tinyConfetti(btn) {
  const rect = btn.getBoundingClientRect();
  // Create a temporary canvas overlay
  const c = document.createElement('canvas');
  c.style.position = 'fixed';
  c.style.left = `${rect.left}px`;
  c.style.top = `${rect.top}px`;
  c.style.width = `${rect.width}px`;
  c.style.height = `${rect.height}px`;
  c.style.pointerEvents = 'none';
  c.style.zIndex = '9999';
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  const particles = [];

  for (let i = 0; i < 20; i++) {
    particles.push({
      x: c.width / 2,
      y: c.height / 2,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      color: `hsl(${Math.random() * 360}, 80%, 65%)`,
      life: 1
    });
  }

  function render() {
    ctx.clearRect(0, 0, c.width, c.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // gravity
      p.life -= 0.02;
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
// Section reveal sequence (staggered fade-ins)
// ═══════════════════════════════════════════════════════════════════════════

function revealSectionsSequentially() {
  // Initially hide sections that require clicking Yes
  document.getElementById('loveLetter').classList.add('hidden');
  document.getElementById('reasons').classList.add('hidden');
  document.getElementById('memories').classList.add('hidden');
  document.getElementById('countdown').classList.add('hidden');
}

// ═══════════════════════════════════════════════════════════════════════════
// Debug / Development helpers
// ═══════════════════════════════════════════════════════════════════════════

// Expose config globally for console tweaking
window.CONFIG = CONFIG;