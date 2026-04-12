/**
 * BIONOTES — Fuse.js Fuzzy Search v2.0
 * Real-time results | Debounced | Highlighted matches
 * Filter by subject + type | Recent searches | Keyboard nav
 */
(function () {
  'use strict';

  const searchInput   = document.getElementById('searchInput');
  const resultsGrid   = document.getElementById('searchResults');
  const resultsCount  = document.getElementById('resultsCount');
  const clearBtn      = document.getElementById('searchClear');
  const emptyState    = document.getElementById('searchEmpty');
  const recentWrap    = document.getElementById('recentSearches');
  const recentList    = document.getElementById('recentList');

  if (!searchInput || !resultsGrid) return;

  /* Wait for notes data */
  function getNotes() {
    if (typeof getAllNotes !== 'undefined') return getAllNotes();
    return [];
  }

  /* ── FUSE.JS SETUP ── */
  let fuse;
  function initFuse() {
    const allNotes = getNotes();
    if (!allNotes.length || typeof Fuse === 'undefined') {
      setTimeout(initFuse, 80);
      return;
    }
    fuse = new Fuse(allNotes, {
      keys: [
        { name: 'title',                       weight: 3 },
        { name: 'subject',                     weight: 2 },
        { name: 'type',                        weight: 1.5 },
        { name: 'subjectData.name',            weight: 1 },
      ],
      threshold:   0.35,
      includeMatches: true,
      minMatchCharLength: 1,
    });
    /* Run initial display */
    showAll();
  }

  /* ── RECENT SEARCHES ── */
  const RECENT_KEY = 'bionotes-recent-searches';
  function getRecent()     { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; } }
  function addRecent(q)    {
    if (!q.trim() || q.length < 2) return;
    let r = getRecent().filter(s => s !== q);
    r.unshift(q);
    r = r.slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(r));
    renderRecent();
  }
  function renderRecent() {
    if (!recentList) return;
    const r = getRecent();
    if (!r.length || !recentWrap) return;
    recentWrap.style.display = '';
    recentList.innerHTML = r.map(s =>
      `<button class="recent-chip" data-query="${s}">${s}</button>`
    ).join('');
    recentList.querySelectorAll('.recent-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        searchInput.value = chip.dataset.query;
        runSearch(chip.dataset.query);
      });
    });
  }

  /* ── ACTIVE FILTERS ── */
  let activeSubject = 'all';
  let activeType    = 'all';

  document.querySelectorAll('.search-filter-btn[data-subject]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.search-filter-btn[data-subject]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeSubject = btn.dataset.subject;
      runSearch(searchInput.value);
    });
  });
  document.querySelectorAll('.search-filter-btn[data-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.search-filter-btn[data-type]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeType = btn.dataset.type;
      runSearch(searchInput.value);
    });
  });

  /* ── HIGHLIGHT HELPER ── */
  function highlight(text, matches, key) {
    if (!matches) return text;
    const match = matches.find(m => m.key === key);
    if (!match || !match.indices.length) return text;

    let result = '';
    let lastIdx = 0;
    match.indices.forEach(([start, end]) => {
      result += text.slice(lastIdx, start);
      result += `<mark class="search-highlight">${text.slice(start, end+1)}</mark>`;
      lastIdx = end + 1;
    });
    result += text.slice(lastIdx);
    return result;
  }

  /* ── RENDER CARD ── */
  function renderCard(result) {
    const note = result.item || result;
    const matches = result.matches;
    const subj = note.subjectData || {};

    const card = document.createElement('div');
    card.className = 'note-card search-result-card';
    card.setAttribute('data-subject', note.subject);

    const titleHtml = highlight(note.title, matches, 'title');
    const typeHtml  = highlight(note.type,  matches, 'type');
    const rgb = subj.rgb || '0,255,178';
    const color = subj.color || '#00FFB2';

    card.innerHTML = `
      <span class="note-card-pdf-badge">PDF</span>
      <div class="note-card-tag" style="--tag-color:${color};--tag-rgb:${rgb}">
        <span class="note-card-tag-dot"></span>${note.subject}
      </div>
      <div class="note-card-title">${titleHtml}</div>
      <div class="note-card-type">${typeHtml}</div>
      <div class="note-card-actions">
        <button class="nca-btn nca-view">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          View
        </button>
        <a class="nca-btn nca-download" href="${note.file}" download="${note.file}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download
        </a>
      </div>
    `;
    card.querySelector('.nca-view').addEventListener('click', () => {
      if (typeof openModal !== 'undefined') openModal(note, subj);
    });

    return card;
  }

  /* ── APPLY FILTERS ── */
  function applyFilters(notes) {
    return notes.filter(n => {
      const item = n.item || n;
      const subjectMatch = activeSubject === 'all' || item.subject === activeSubject;
      const typeMatch    = activeType    === 'all' || item.type === activeType;
      return subjectMatch && typeMatch;
    });
  }

  /* ── SHOW ALL ── */
  function showAll() {
    const all = getNotes().map(n => ({ item: n, matches: [] }));
    renderResults(applyFilters(all));
  }

  /* ── RUN SEARCH ── */
  let debounceTimer;
  function runSearch(query) {
    const q = query.trim();

    /* Clear X button */
    if (clearBtn) clearBtn.style.opacity = q ? '1' : '0';
    if (recentWrap && q) recentWrap.style.display = 'none';
    else if (recentWrap && !q) recentWrap.style.display = '';

    if (!q) {
      showAll();
      return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (!fuse) { showAll(); return; }
      const raw     = fuse.search(q);
      const results = applyFilters(raw);
      renderResults(results);
    }, 140);
  }

  /* ── RENDER RESULTS ── */
  function renderResults(results) {
    resultsGrid.innerHTML = '';

    if (resultsCount) {
      resultsCount.textContent = `${results.length} result${results.length !== 1 ? 's' : ''} found`;
    }

    if (!results.length) {
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }
    if (emptyState) emptyState.style.display = 'none';

    const frag = document.createDocumentFragment();
    results.forEach(r => frag.appendChild(renderCard(r)));
    resultsGrid.appendChild(frag);

    /* GSAP stagger */
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(
        resultsGrid.querySelectorAll('.note-card'),
        { opacity: 0, y: 25, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, stagger: 0.06, duration: 0.5, ease: 'power2.out' }
      );
    }

    /* Tilt */
    setTimeout(() => {
      resultsGrid.querySelectorAll('.note-card').forEach(card => {
        card.addEventListener('mousemove', e => {
          const rect = card.getBoundingClientRect();
          const dx = (e.clientX - rect.left - rect.width/2) / (rect.width/2);
          const dy = (e.clientY - rect.top  - rect.height/2)/ (rect.height/2);
          card.style.transform = `perspective(600px) rotateY(${dx*6}deg) rotateX(${-dy*6}deg) translateY(-6px) scale(1.02)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; });
      });
    }, 100);
  }

  /* ── INPUT EVENTS ── */
  searchInput.addEventListener('input', e => runSearch(e.target.value));
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') addRecent(searchInput.value);
  });
  if (clearBtn) {
    clearBtn.style.opacity = '0';
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      runSearch('');
      searchInput.focus();
    });
  }

  /* ── KEYBOARD NAV ── */
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') {
      const first = resultsGrid.querySelector('.note-card');
      if (first) first.focus();
    }
  });

  /* ── INIT ── */
  renderRecent();
  initFuse();

})();
