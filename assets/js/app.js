/**
 * BIONOTES — Main App JS
 * Handles: Homepage subject cards, Notes page rendering,
 *          sidebar, accordion, modal, filter, navbar scroll,
 *          3D card tilt, hamburger menu
 */

(function () {
  'use strict';

  // ── NAVBAR SCROLL ──
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    });
  }

  // ── HAMBURGER ──
  const hamburger = document.getElementById('navHamburger');
  const mobileMenu = document.getElementById('navMobileMenu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
    });
  }

  // ── 3D CARD TILT ──
  function enableTilt(selector) {
    document.querySelectorAll(selector).forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width  / 2;
        const cy = rect.top  + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width  / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        card.style.transform = `perspective(800px) rotateY(${dx * 8}deg) rotateX(${-dy * 8}deg) translateY(-8px) scale(1.02)`;
        // Update radial gradient center for note cards
        const mx = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
        const my = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
        card.style.setProperty('--mx', mx + '%');
        card.style.setProperty('--my', my + '%');
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // ── MODAL ──
  const modalOverlay = document.getElementById('modalOverlay');
  const modalTitle   = document.getElementById('modalTitle');
  const modalMeta    = document.getElementById('modalMeta');
  const modalViewBtn = document.getElementById('modalViewBtn');
  const modalDlBtn   = document.getElementById('modalDownloadBtn');

  window.openModal = function (note, subjectData) {
    if (!modalOverlay) return;
    modalTitle.textContent = note.title;
    modalMeta.innerHTML = `
      <strong style="color:#fff">Subject:</strong> ${subjectData.name}<br>
      <strong style="color:#fff">Code:</strong> ${note.subject}<br>
      <strong style="color:#fff">Type:</strong> ${note.type}<br>
      ${note.co ? `<strong style="color:#fff">Course Outcome:</strong> CO ${note.co}` : ''}
    `;
    const path = encodeURIComponent(note.file);
    modalViewBtn.href     = note.file;
    modalDlBtn.href       = note.file;
    modalDlBtn.setAttribute('download', note.file);
    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeModal = function () {
    if (modalOverlay) {
      modalOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // ── BUILD NOTE CARD ──
  function buildNoteCard(note, subjectData) {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.setAttribute('data-subject', note.subject);
    card.setAttribute('data-title', note.title.toLowerCase());

    card.innerHTML = `
      <span class="note-card-pdf-badge">PDF</span>
      <div class="note-card-tag"
           style="--tag-color:${subjectData.color}; --tag-rgb:${subjectData.rgb}">
        <span class="note-card-tag-dot"></span>
        ${note.subject}
      </div>
      <div class="note-card-title">${note.title}</div>
      <div class="note-card-type">${note.type}</div>
      <div class="note-card-actions">
        <button class="nca-btn nca-view" onclick="openModal(${JSON.stringify(note).replace(/"/g, '&quot;')}, ${JSON.stringify(subjectData).replace(/"/g, '&quot;')})">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          View
        </button>
        <a class="nca-btn nca-download" href="${note.file}" download="${note.file}" onclick="event.stopPropagation()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          DL
        </a>
      </div>
    `;
    return card;
  }

  // ══════════════════════════════════════
  //  HOMEPAGE
  // ══════════════════════════════════════
  const subjectsGrid = document.getElementById('subjectsGrid');
  if (subjectsGrid) {
    NOTES_DATA.forEach((subject, i) => {
      const card = document.createElement('a');
      card.className = 'subject-card animate-in';
      card.href = `notes.html#${subject.code}`;
      card.style.setProperty('--card-color', subject.color);
      card.style.setProperty('--card-rgb', subject.rgb);
      card.style.animationDelay = `${i * 0.1}s`;

      card.innerHTML = `
        <div class="subject-card-icon">${subject.icon}</div>
        <div class="subject-card-code">${subject.code}</div>
        <div class="subject-card-name">${subject.name}</div>
        <div class="subject-card-count">${subject.notes.length} notes available</div>
        <div class="subject-card-arrow">→</div>
        <div class="subject-card-progress"></div>
      `;
      subjectsGrid.appendChild(card);
    });

    // Tilt on subject cards
    setTimeout(() => enableTilt('.subject-card'), 100);
  }

  // ══════════════════════════════════════
  //  NOTES PAGE
  // ══════════════════════════════════════
  const subjectsListing = document.getElementById('subjectsListing');
  const sidebarNav      = document.getElementById('sidebarNav');
  const sidebar         = document.getElementById('sidebar');
  const sidebarToggle   = document.getElementById('sidebarToggle');
  const sidebarOpenBtn  = document.getElementById('sidebarOpenBtn');

  if (subjectsListing) {

    // ── BUILD SIDEBAR ──
    if (sidebarNav) {
      NOTES_DATA.forEach(subject => {
        const group = document.createElement('div');
        group.className = 'sb-subject';

        const btn = document.createElement('button');
        btn.className = 'sb-subject-btn';
        btn.setAttribute('data-code', subject.code);
        btn.innerHTML = `
          <span class="sb-dot" style="background:${subject.color}; color:${subject.color}"></span>
          <div class="sb-subject-info">
            <div class="sb-subject-code">${subject.code}</div>
            <div class="sb-subject-name">${subject.name}</div>
          </div>
          <span class="sb-count">${subject.notes.length}</span>
          <span class="sb-chevron">›</span>
        `;

        const notesList = document.createElement('div');
        notesList.className = 'sb-notes';

        subject.notes.forEach(note => {
          const link = document.createElement('button');
          link.className = 'sb-note-link';
          link.textContent = note.title.replace(`${subject.code} — `, '').replace(`${subject.name} — `, '');
          link.addEventListener('click', () => {
            openModal(note, subject);
            if (window.innerWidth < 900) sidebar.classList.remove('open');
          });
          notesList.appendChild(link);
        });

        btn.addEventListener('click', () => {
          const isOpen = btn.classList.toggle('open');
          notesList.classList.toggle('open', isOpen);
          // Scroll to section in main
          const section = document.getElementById(`section-${subject.code}`);
          if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        group.appendChild(btn);
        group.appendChild(notesList);
        sidebarNav.appendChild(group);
      });
    }

    // ── MOBILE SIDEBAR ──
    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', () => sidebar.classList.remove('open'));
    }
    if (sidebarOpenBtn && sidebar) {
      sidebarOpenBtn.addEventListener('click', () => sidebar.classList.add('open'));
    }
    // Close sidebar on outside click (mobile)
    document.addEventListener('click', e => {
      if (sidebar && window.innerWidth < 900 &&
          !sidebar.contains(e.target) &&
          sidebarOpenBtn && !sidebarOpenBtn.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });

    // ── BUILD MAIN CONTENT ──
    NOTES_DATA.forEach(subject => {
      const section = document.createElement('div');
      section.className = 'subject-section';
      section.id = `section-${subject.code}`;

      const header = document.createElement('div');
      header.className = 'subject-section-header open';
      header.innerHTML = `
        <div class="ssh-left">
          <div class="ssh-icon">${subject.icon}</div>
          <div class="ssh-info">
            <div class="ssh-code" style="color:${subject.color}">${subject.code}</div>
            <div class="ssh-name">${subject.name}</div>
          </div>
        </div>
        <div class="ssh-right">
          <span class="ssh-count">${subject.notes.length} notes</span>
          <span class="ssh-chevron">▾</span>
        </div>
      `;

      const grid = document.createElement('div');
      grid.className = 'notes-grid open';
      grid.setAttribute('data-subject', subject.code);

      subject.notes.forEach(note => {
        grid.appendChild(buildNoteCard(note, subject));
      });

      // Toggle accordion
      header.addEventListener('click', () => {
        const isOpen = header.classList.toggle('open');
        grid.classList.toggle('open', isOpen);
      });

      section.appendChild(header);
      section.appendChild(grid);
      subjectsListing.appendChild(section);
    });

    // Tilt on note cards
    setTimeout(() => enableTilt('.note-card'), 200);

    // ── SCROLL TO HASH ──
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(`section-${hash}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }

  // ── FILTER NOTES (Notes page filter bar) ──
  window.filterNotes = function (code, btn) {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    document.querySelectorAll('.subject-section').forEach(section => {
      if (code === 'all') {
        section.style.display = '';
      } else {
        section.style.display = section.id === `section-${code}` ? '' : 'none';
      }
    });

    // Update breadcrumb
    const bcCurrent = document.getElementById('bcCurrent');
    if (bcCurrent) bcCurrent.textContent = code === 'all' ? 'All Notes' : code;
  };

  // ══════════════════════════════════════
  //  INTERSECTION OBSERVER (animate-in)
  // ══════════════════════════════════════
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.step-card, .subject-card').forEach(el => {
      el.classList.remove('animate-in');
      observer.observe(el);
    });
  }

})();
