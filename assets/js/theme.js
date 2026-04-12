/**
 * BIONOTES — Theme Toggle
 * Dark / Light mode with localStorage persistence
 * Respects prefers-color-scheme on first visit
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'bionotes-theme';
  const html        = document.documentElement;

  /* ── APPLY THEME ── */
  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);

    /* Update toggle icon on all pages */
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      btn.querySelector('.theme-icon')
        && (btn.querySelector('.theme-icon').textContent = theme === 'dark' ? '☀️' : '🌙');
    });

    localStorage.setItem(STORAGE_KEY, theme);
  }

  /* ── READ PREFERENCE ── */
  function getPreference() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  /* ── TOGGLE ── */
  function toggle() {
    const current = html.getAttribute('data-theme') || 'dark';
    const next    = current === 'dark' ? 'light' : 'dark';

    /* GSAP rotate + scale animation if available */
    if (typeof gsap !== 'undefined') {
      const btn = document.querySelector('.theme-toggle');
      if (btn) {
        gsap.fromTo(btn, { rotation: 0 }, { rotation: 360, duration: 0.5, ease: 'power2.out' });
      }
    }

    applyTheme(next);
  }

  /* ── INIT ── */
  function init() {
    applyTheme(getPreference());

    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', toggle);
    });

    /* Sync across tabs */
    window.addEventListener('storage', e => {
      if (e.key === STORAGE_KEY && e.newValue) applyTheme(e.newValue);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
