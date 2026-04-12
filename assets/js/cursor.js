/**
 * BIONOTES — Custom Cursor
 * Magnetic ring + dot follower with GSAP quickTo
 * Hover morphing | Click shrink | Trail effect
 */
(function () {
  'use strict';

  /* Touch device → skip */
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  /* Wait for GSAP */
  function whenGSAP(fn) {
    if (typeof gsap !== 'undefined') fn();
    else setTimeout(() => whenGSAP(fn), 30);
  }

  whenGSAP(() => {
    /* quickTo setters for smooth lag */
    const setDotX  = gsap.quickTo(dot,  'x', { duration: 0.12, ease: 'power2.out' });
    const setDotY  = gsap.quickTo(dot,  'y', { duration: 0.12, ease: 'power2.out' });
    const setRingX = gsap.quickTo(ring, 'x', { duration: 0.38, ease: 'power2.out' });
    const setRingY = gsap.quickTo(ring, 'y', { duration: 0.38, ease: 'power2.out' });

    /* ── TRAIL DOTS ── */
    const TRAIL_LEN = 6;
    const trail = [];
    for (let i = 0; i < TRAIL_LEN; i++) {
      const t = document.createElement('div');
      t.className = 'cursor-trail';
      t.style.opacity   = (1 - i / TRAIL_LEN) * 0.5 + '';
      t.style.width  = (6 - i * 0.7) + 'px';
      t.style.height = (6 - i * 0.7) + 'px';
      document.body.appendChild(t);
      trail.push({ el: t, x: 0, y: 0 });
    }

    let posX = 0, posY = 0;
    const trailSetX = trail.map(t => gsap.quickTo(t.el, 'x', { duration: 0.15 + trail.indexOf(t)*0.08, ease: 'power2.out' }));
    const trailSetY = trail.map(t => gsap.quickTo(t.el, 'y', { duration: 0.15 + trail.indexOf(t)*0.08, ease: 'power2.out' }));

    /* ── MOVE ── */
    document.addEventListener('mousemove', e => {
      posX = e.clientX;
      posY = e.clientY;

      setDotX(posX);
      setDotY(posY);
      setRingX(posX);
      setRingY(posY);

      trail.forEach((_, i) => {
        trailSetX[i](posX);
        trailSetY[i](posY);
      });
    });

    /* ── HOVER STATE ── */
    const hoverTargets = 'a, button, [role="button"], input, select, textarea, label, .note-card, .subject-card, .filter-btn, .nca-btn';
    document.addEventListener('mouseover', e => {
      if (e.target.closest(hoverTargets)) {
        document.body.classList.add('cursor-hover');
      }
    });
    document.addEventListener('mouseout',  e => {
      if (e.target.closest(hoverTargets)) {
        document.body.classList.remove('cursor-hover');
      }
    });

    /* ── CLICK STATE ── */
    document.addEventListener('mousedown', () => {
      document.body.classList.add('cursor-click');
      gsap.to([dot, ring], { scale: 0.8, duration: 0.1 });
    });
    document.addEventListener('mouseup', () => {
      document.body.classList.remove('cursor-click');
      gsap.to([dot, ring], { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.4)' });
    });

    /* ── VISIBILITY ── */
    document.addEventListener('mouseleave', () => {
      gsap.to([dot, ring, ...trail.map(t=>t.el)], { opacity: 0, duration: 0.3 });
    });
    document.addEventListener('mouseenter', () => {
      gsap.to([dot, ring, ...trail.map(t=>t.el)], { opacity: 1, duration: 0.3 });
    });
  });
})();
