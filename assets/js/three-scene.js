/**
 * BIONOTES — Three.js DNA Helix + Particle Scene
 * Pure canvas-based 3D animation (no library dependency needed)
 * Uses native Canvas 2D API for maximum compatibility
 */

(function () {
  'use strict';

  const canvas = document.getElementById('dnaCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, animId;
  let t = 0;

  // ── PARTICLES ──
  const PARTICLE_COUNT = 120;
  const particles = [];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function initParticles() {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        z: Math.random(),          // depth 0 = far, 1 = near
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 0.5,
        hue: Math.random() > 0.5 ? 160 : 190, // green or cyan
        opacity: Math.random() * 0.6 + 0.2,
      });
    }
  }

  // ── DNA HELIX ──
  function drawDNA() {
    const cx = W * 0.72;   // right side
    const cy = H * 0.5;
    const height = Math.min(H * 0.75, 520);
    const width  = 80;
    const segments = 22;
    const speed = 0.4;

    // Draw two strands + connecting rungs
    for (let i = 0; i <= segments; i++) {
      const frac  = i / segments;
      const y     = cy - height / 2 + frac * height;
      const angle = (frac * Math.PI * 4) + (t * speed);

      const x1 = cx + Math.cos(angle) * width;
      const x2 = cx + Math.cos(angle + Math.PI) * width;
      const depth = (Math.sin(angle) + 1) / 2; // 0 – 1

      // Rung (connecting line) — draw before strands so strands go on top
      if (i < segments) {
        const nextFrac  = (i + 1) / segments;
        const nextY     = cy - height / 2 + nextFrac * height;
        const nextAngle = (nextFrac * Math.PI * 4) + (t * speed);
        const nx1 = cx + Math.cos(nextAngle) * width;
        const nx2 = cx + Math.cos(nextAngle + Math.PI) * width;

        if (i % 2 === 0) {
          // Draw a base pair rung
          const rungAlpha = 0.12 + depth * 0.2;
          ctx.beginPath();
          ctx.moveTo(x1, y);
          ctx.lineTo(x2, y);
          ctx.strokeStyle = `rgba(0,255,178,${rungAlpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Strand 1 node
      if (i > 0) {
        const prevFrac  = (i - 1) / segments;
        const prevY     = cy - height / 2 + prevFrac * height;
        const prevAngle = (prevFrac * Math.PI * 4) + (t * speed);
        const px1 = cx + Math.cos(prevAngle) * width;
        const px2 = cx + Math.cos(prevAngle + Math.PI) * width;
        const prevDepth = (Math.sin(prevAngle) + 1) / 2;

        // Strand 1
        const s1Alpha = 0.3 + depth * 0.7;
        ctx.beginPath();
        ctx.moveTo(px1, prevY);
        ctx.lineTo(x1, y);
        ctx.strokeStyle = `rgba(0,255,178,${s1Alpha * 0.8})`;
        ctx.lineWidth = 1.5 + depth;
        ctx.stroke();

        // Strand 2
        const s2Alpha = 0.3 + (1 - depth) * 0.7;
        ctx.beginPath();
        ctx.moveTo(px2, prevY);
        ctx.lineTo(x2, y);
        ctx.strokeStyle = `rgba(0,217,255,${s2Alpha * 0.8})`;
        ctx.lineWidth = 1.5 + (1 - depth);
        ctx.stroke();
      }

      // Nucleotide dots
      const dot1Alpha = 0.4 + depth * 0.6;
      const dot2Alpha = 0.4 + (1 - depth) * 0.6;
      const dot1Size  = 2 + depth * 3;
      const dot2Size  = 2 + (1 - depth) * 3;

      // Glow dot 1
      const g1 = ctx.createRadialGradient(x1, y, 0, x1, y, dot1Size * 3);
      g1.addColorStop(0, `rgba(0,255,178,${dot1Alpha})`);
      g1.addColorStop(1, 'rgba(0,255,178,0)');
      ctx.beginPath();
      ctx.arc(x1, y, dot1Size * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = g1;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x1, y, dot1Size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,255,178,${dot1Alpha})`;
      ctx.fill();

      // Glow dot 2
      const g2 = ctx.createRadialGradient(x2, y, 0, x2, y, dot2Size * 3);
      g2.addColorStop(0, `rgba(0,217,255,${dot2Alpha})`);
      g2.addColorStop(1, 'rgba(0,217,255,0)');
      ctx.beginPath();
      ctx.arc(x2, y, dot2Size * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = g2;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x2, y, dot2Size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,217,255,${dot2Alpha})`;
      ctx.fill();
    }
  }

  // ── FLOATING ATOMS ──
  const atoms = Array.from({ length: 6 }, (_, i) => ({
    angle: (i / 6) * Math.PI * 2,
    orbitR: 120 + (i % 3) * 50,
    speed: 0.002 + i * 0.0008,
    r: 4 + (i % 3) * 2,
    cx: null, cy: null,
  }));

  function drawAtoms() {
    const cx = W * 0.2;
    const cy = H * 0.45;

    // Central nucleus
    const nucleus = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
    nucleus.addColorStop(0, 'rgba(123,97,255,0.8)');
    nucleus.addColorStop(0.5, 'rgba(123,97,255,0.2)');
    nucleus.addColorStop(1, 'rgba(123,97,255,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fillStyle = nucleus;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(123,97,255,0.9)';
    ctx.fill();

    atoms.forEach(atom => {
      atom.angle += atom.speed;
      atom.cx = cx + Math.cos(atom.angle) * atom.orbitR;
      atom.cy = cy + Math.sin(atom.angle) * atom.orbitR * 0.4; // flatten orbit

      // Orbit track
      ctx.beginPath();
      ctx.ellipse(cx, cy, atom.orbitR, atom.orbitR * 0.4, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(123,97,255,0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Electron glow
      const eg = ctx.createRadialGradient(atom.cx, atom.cy, 0, atom.cx, atom.cy, atom.r * 4);
      eg.addColorStop(0, 'rgba(0,217,255,0.8)');
      eg.addColorStop(1, 'rgba(0,217,255,0)');
      ctx.beginPath();
      ctx.arc(atom.cx, atom.cy, atom.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = eg;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(atom.cx, atom.cy, atom.r, 0, Math.PI * 2);
      ctx.fillStyle = '#00D9FF';
      ctx.fill();
    });
  }

  // ── PARTICLES ──
  function drawParticles() {
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      const size = p.r * (0.5 + p.z * 0.8);
      const alpha = p.opacity * (0.3 + p.z * 0.5);
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue === 160 ? 160 : 190}, 100%, 65%, ${alpha})`;
      ctx.fill();
    });
  }

  // ── GRID LINES ──
  function drawGrid() {
    const step = 80;
    ctx.strokeStyle = 'rgba(0,255,178,0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }

  // ── MAIN LOOP ──
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Background gradient
    const bg = ctx.createRadialGradient(W * 0.7, H * 0.3, 0, W * 0.7, H * 0.3, W * 0.7);
    bg.addColorStop(0, 'rgba(0,255,178,0.04)');
    bg.addColorStop(0.5, 'rgba(0,0,0,0)');
    bg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const bg2 = ctx.createRadialGradient(W * 0.2, H * 0.6, 0, W * 0.2, H * 0.6, W * 0.5);
    bg2.addColorStop(0, 'rgba(123,97,255,0.05)');
    bg2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg2;
    ctx.fillRect(0, 0, W, H);

    drawGrid();
    drawParticles();
    drawAtoms();
    drawDNA();

    t += 0.008;
    animId = requestAnimationFrame(draw);
  }

  // ── MOUSE PARALLAX ──
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ── INIT ──
  function init() {
    resize();
    initParticles();
    draw();
  }

  window.addEventListener('resize', () => {
    resize();
    initParticles();
  });

  // Only run on homepage
  window.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();

  // ── DOM PARTICLES (floating circles in hero) ──
  const heroParticles = document.getElementById('heroParticles');
  if (heroParticles) {
    for (let i = 0; i < 30; i++) {
      const el = document.createElement('div');
      el.className = 'particle';
      const size = Math.random() * 6 + 2;
      const left = Math.random() * 100;
      const delay = Math.random() * 8;
      const duration = 8 + Math.random() * 12;
      const drift = (Math.random() - 0.5) * 80;
      const isGreen = Math.random() > 0.5;
      el.style.cssText = `
        width:${size}px; height:${size}px;
        left:${left}%;
        bottom:-20px;
        background: ${isGreen ? 'rgba(0,255,178,0.5)' : 'rgba(0,217,255,0.4)'};
        box-shadow: 0 0 ${size * 2}px ${isGreen ? 'rgba(0,255,178,0.4)' : 'rgba(0,217,255,0.3)'};
        animation-duration:${duration}s;
        animation-delay:${delay}s;
        --drift: ${drift}px;
      `;
      heroParticles.appendChild(el);
    }
  }
})();
