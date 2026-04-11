/**
 * BIONOTES — Search Page JS
 * Real-time search with subject filter + sort
 */

(function () {
  'use strict';

  let currentSubject = 'all';
  let currentQuery   = '';
  let currentSort    = 'alpha';

  const searchInput   = document.getElementById('searchInput');
  const searchClear   = document.getElementById('searchClear');
  const resultsGrid   = document.getElementById('searchResultsGrid');
  const searchEmpty   = document.getElementById('searchEmpty');
  const resultsCount  = document.getElementById('resultsCount');

  if (!resultsGrid) return;

  // ── BUILD CARD ──
  function buildSearchCard(note) {
    const sub = note.subjectData;
    const card = document.createElement('div');
    card.className = 'note-card';
    card.setAttribute('data-subject', note.subject);

    card.innerHTML = `
      <span class="note-card-pdf-badge">PDF</span>
      <div class="note-card-tag"
           style="--tag-color:${sub.color}; --tag-rgb:${sub.rgb}">
        <span class="note-card-tag-dot"></span>
        ${note.subject} · ${sub.name.split(' ')[0]}
      </div>
      <div class="note-card-title">${highlightMatch(note.title, currentQuery)}</div>
      <div class="note-card-type">${note.type}</div>
      <div class="note-card-actions">
        <button class="nca-btn nca-view"
          onclick="openModal(${JSON.stringify(note).replace(/"/g, '&quot;')},
                            ${JSON.stringify(sub).replace(/"/g, '&quot;')})">
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

  function highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    return text.replace(regex, '<mark style="background:rgba(0,255,178,0.25);color:inherit;border-radius:3px;padding:0 2px;">$1</mark>');
  }

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ── RENDER ──
  function render() {
    let results = searchNotes(currentQuery, currentSubject);

    // Sort
    if (currentSort === 'alpha') {
      results.sort((a, b) => a.title.localeCompare(b.title));
    } else if (currentSort === 'subject') {
      results.sort((a, b) => a.subject.localeCompare(b.subject) || a.title.localeCompare(b.title));
    }

    resultsGrid.innerHTML = '';

    if (results.length === 0) {
      searchEmpty.style.display = '';
      resultsCount.textContent = 'No notes found';
      return;
    }

    searchEmpty.style.display = 'none';
    resultsCount.textContent = `Showing ${results.length} of ${getAllNotes().length} notes`;

    results.forEach((note, i) => {
      const card = buildSearchCard(note);
      card.style.animationDelay = `${i * 0.04}s`;
      card.classList.add('animate-in');
      resultsGrid.appendChild(card);
    });

    // Enable tilt
    setTimeout(() => {
      resultsGrid.querySelectorAll('.note-card').forEach(card => {
        card.addEventListener('mousemove', e => {
          const rect = card.getBoundingClientRect();
          const dx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
          const dy = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
          card.style.transform = `perspective(800px) rotateY(${dx * 8}deg) rotateX(${-dy * 8}deg) translateY(-4px) scale(1.01)`;
          card.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%');
          card.style.setProperty('--my', ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + '%');
        });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; });
      });
    }, 50);
  }

  // ── EVENTS ──
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      currentQuery = e.target.value.trim();
      searchClear.style.opacity = currentQuery ? '1' : '0';
      render();
    });
  }

  window.clearSearch = function () {
    if (searchInput) searchInput.value = '';
    currentQuery = '';
    if (searchClear) searchClear.style.opacity = '0';
    render();
  };

  window.setSubjectFilter = function (code, btn) {
    currentSubject = code;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    if (btn) btn.classList.add('active');
    render();
  };

  window.sortResults = function (val) {
    currentSort = val;
    render();
  };

  // ── MODAL on search page ──
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
    modalViewBtn.href = note.file;
    modalDlBtn.href   = note.file;
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

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // ── INITIAL RENDER ──
  render();

})();
