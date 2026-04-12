/**
 * BIONOTES — GSAP Animations v2.0
 * Preloader | Hero Entrance | ScrollTrigger Reveals
 * Counter Animation | Parallax | Magnetic Buttons | Page Transitions
 */
(function () {
  'use strict';

  /* ── WAIT FOR GSAP ── */
  function whenReady(fn) {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      fn();
    } else {
      setTimeout(() => whenReady(fn), 40);
    }
  }

  /* ── SCROLL PROGRESS BAR ── */
  function initScrollProgress() {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;
    window.addEventListener('scroll', () => {
      const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      bar.style.setProperty('--scroll-pct', Math.min(pct, 100).toFixed(2) + '%');
    }, { passive: true });
  }

  /* ── PRELOADER ── */
  function runPreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) {
      revealHero();
      return;
    }

    const bar  = preloader.querySelector('.preloader-bar');
    const text = preloader.querySelector('.preloader-text');

    const steps = ['Initializing sequences…', 'Loading molecular data…', 'Rendering 3D scene…', 'Welcome to BioNotes'];
    let stepIdx = 0;

    const tl = gsap.timeline({
      onComplete() {
        gsap.to(preloader, {
          opacity: 0,
          duration: 0.8,
          ease: 'power2.inOut',
          onComplete() {
            preloader.classList.add('hidden');
            revealHero();
          }
        });
      }
    });

    /* Progress bar + text steps */
    steps.forEach((msg, i) => {
      tl.to(bar, {
        width: ((i + 1) / steps.length * 100) + '%',
        duration: 0.5,
        ease: 'power2.out',
        onStart() {
          if (text) text.textContent = msg;
        }
      }, i === 0 ? 0.3 : '+=0.15');
    });

    tl.add(() => {}, '+=0.2'); // brief hold at 100%
  }

  /* ── HERO ENTRANCE ── */
  function revealHero() {
    const badge   = document.querySelector('.hero-badge');
    const title   = document.querySelector('.hero-title');
    const sub     = document.querySelector('.hero-sub');
    const actions = document.querySelector('.hero-actions');
    const stats   = document.querySelector('.hero-stats');

    if (!title) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (badge) {
      tl.from(badge, { opacity: 0, y: 20, duration: 0.6 }, 0);
    }

    /* Word-by-word title reveal */
    const words = title.querySelectorAll('.word-inner');
    if (words.length) {
      tl.to(words, { y: 0, opacity: 1, stagger: 0.08, duration: 0.7 }, 0.2);
    } else {
      tl.from(title, { opacity: 0, y: 40, duration: 0.8 }, 0.2);
    }

    if (sub) {
      tl.to(sub, { opacity: 1, y: 0, duration: 0.7 }, 0.5);
      sub.style.transition = 'none';
    }
    if (actions) {
      tl.to(actions, { opacity: 1, y: 0, duration: 0.7 }, 0.65);
      actions.style.transition = 'none';
    }
    if (stats) {
      tl.to(stats, { opacity: 1, y: 0, duration: 0.7 }, 0.8);
      stats.style.transition = 'none';
    }

    /* Count-up the stat numbers */
    tl.add(() => animateCounters(), 1.0);
  }

  /* ── COUNT-UP ── */
  function animateCounters() {
    document.querySelectorAll('.stat-num').forEach(el => {
      const target = parseInt(el.textContent, 10);
      if (isNaN(target)) return;
      gsap.from({ val: 0 }, {
        val: target,
        duration: 1.4,
        ease: 'power2.out',
        onUpdate() { el.textContent = Math.round(this.targets()[0].val); },
        onComplete() { el.textContent = target; }
      });
    });
  }

  /* ── SCROLL TRIGGER REVEALS ── */
  function initScrollAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    /* Generic gsap-reveal elements */
    gsap.utils.toArray('.gsap-reveal').forEach(el => {
      gsap.fromTo(el,
        { opacity: 0, y: 50 },
        {
          opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
        }
      );
    });

    /* Step cards stagger */
    const stepCards = gsap.utils.toArray('.step-card');
    if (stepCards.length) {
      gsap.fromTo(stepCards,
        { opacity: 0, y: 60, scale: 0.92 },
        {
          opacity: 1, y: 0, scale: 1,
          stagger: 0.12,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.steps-grid', start: 'top 82%' }
        }
      );
    }

    /* Subject cards stagger */
    const subjectCards = gsap.utils.toArray('.subject-card');
    if (subjectCards.length) {
      gsap.fromTo(subjectCards,
        { opacity: 0, y: 50, scale: 0.94 },
        {
          opacity: 1, y: 0, scale: 1,
          stagger: 0.1,
          duration: 0.75,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.subjects-grid', start: 'top 82%' }
        }
      );
    }

    /* Section headers */
    gsap.utils.toArray('.section-header').forEach(el => {
      gsap.fromTo(el,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%' }
        }
      );
    });

    /* Note cards on notes page */
    gsap.utils.toArray('.note-card').forEach((card, i) => {
      gsap.fromTo(card,
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power2.out',
          delay: (i % 4) * 0.07,
          scrollTrigger: { trigger: card, start: 'top 90%' }
        }
      );
    });

    /* Hero parallax */
    const heroEl = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero-content');
    if (heroEl && heroContent) {
      gsap.to(heroContent, {
        y: 80,
        ease: 'none',
        scrollTrigger: {
          trigger: heroEl,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
        }
      });
    }
  }

  /* ── MAGNETIC BUTTONS ── */
  function initMagneticButtons() {
    document.querySelectorAll('.btn-primary, .btn-ghost, .nav-cta').forEach(btn => {
      const strength = 0.35;
      btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width  / 2;
        const cy = rect.top  + rect.height / 2;
        const dx = (e.clientX - cx) * strength;
        const dy = (e.clientY - cy) * strength;
        gsap.to(btn, { x: dx, y: dy, duration: 0.35, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  /* ── WRAP TITLE WORDS FOR ANIMATION ── */
  function wrapTitleWords() {
    const title = document.querySelector('.hero-title');
    if (!title) return;

    /* Don't wrap span.gradient-text nodes, just text nodes */
    const html = title.innerHTML;
    /* We'll just target the raw text — simpler to clone */
    title.querySelectorAll('.word-inner').forEach(w => {
      gsap.set(w, { y: '105%' });
    });
  }

  /* ── SMOOTH NAVBAR SHRINK ── */
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    let lastY = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      navbar.classList.toggle('scrolled', y > 40);
      /* Hide navbar on fast scroll down, show on up */
      if (y > lastY + 10 && y > 120) {
        navbar.style.transform = 'translateY(-100%)';
      } else if (y < lastY - 4) {
        navbar.style.transform = 'translateY(0)';
      }
      lastY = y;
    }, { passive: true });

    navbar.style.transition = 'transform 0.4s cubic-bezier(0.4,0,0.2,1), background 0.4s, box-shadow 0.4s';
  }

  /* ── PAGE TRANSITIONS ── */
  function initPageTransitions() {
    const overlay = document.getElementById('pageTransition');
    if (!overlay) return;

    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') ||
          href.startsWith('mailto') || link.getAttribute('download') !== null ||
          link.getAttribute('target') === '_blank') return;

      link.addEventListener('click', e => {
        e.preventDefault();
        overlay.classList.add('entering');
        setTimeout(() => { window.location.href = href; }, 480);
      });
    });

    /* Reveal on load */
    window.addEventListener('pageshow', () => {
      overlay.classList.remove('entering');
    });
  }

  /* ── INIT ── */
  function main() {
    initScrollProgress();
    initNavbar();
    initPageTransitions();
    wrapTitleWords();
    runPreloader();
    whenReady(initScrollAnimations);
    whenReady(initMagneticButtons);
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
