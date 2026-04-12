/**
 * BIONOTES — Main App JS v3.0
 * Homepage: Carousel | Trending | Stats Counter | FAQ Accordion | Testimonials Carousel
 * Notes Page: Sidebar | Accordion sections | Bookmarks | Download tracking
 * All Pages: Hamburger | Modal | Tilt | Intersection observer fallback
 */
(function () {
  'use strict';

  /* ════════════════════════════════
     BOOKMARK SYSTEM
  ════════════════════════════════ */
  const BKMARK_KEY = 'bionotes-bookmarks';
  function getBookmarks()  { try { return JSON.parse(localStorage.getItem(BKMARK_KEY) || '[]'); } catch { return []; } }
  function saveBookmarks(a){ localStorage.setItem(BKMARK_KEY, JSON.stringify(a)); }
  function isBookmarked(f) { return getBookmarks().includes(f); }
  function toggleBookmark(file, btn) {
    let bk = getBookmarks();
    if (bk.includes(file)) {
      bk = bk.filter(b => b !== file);
      btn.classList.remove('active');
      btn.title = 'Bookmark';
    } else {
      bk.push(file);
      btn.classList.add('active');
      btn.title = 'Bookmarked';
      if (typeof gsap !== 'undefined') gsap.fromTo(btn, { scale:1 }, { scale:1.4, duration:0.15, yoyo:true, repeat:1, ease:'power2.out' });
    }
    saveBookmarks(bk);
  }

  /* ════════════════════════════════
     DOWNLOAD TRACKER
  ════════════════════════════════ */
  const DL_KEY = 'bionotes-downloads';
  function getDownloads()      { try { return JSON.parse(localStorage.getItem(DL_KEY)||'{}'); } catch { return {}; } }
  function trackDownload(file) { const dl=getDownloads(); dl[file]=(dl[file]||0)+1; localStorage.setItem(DL_KEY,JSON.stringify(dl)); }
  function getDownloadCount(f) { return getDownloads()[f] || 0; }

  /* ════════════════════════════════
     HAMBURGER MENU
  ════════════════════════════════ */
  const hamburger  = document.getElementById('navHamburger');
  const mobileMenu = document.getElementById('navMobileMenu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('open', open);
    });
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      mobileMenu.classList.remove('open'); hamburger.classList.remove('open');
    }));
  }

  /* ════════════════════════════════
     3D CARD TILT
  ════════════════════════════════ */
  function enableTilt(selector) {
    document.querySelectorAll(selector).forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const dx   = (e.clientX - rect.left - rect.width/2)  / (rect.width/2);
        const dy   = (e.clientY - rect.top  - rect.height/2) / (rect.height/2);
        card.style.transform = `perspective(700px) rotateY(${dx*7}deg) rotateX(${-dy*7}deg) translateY(-8px) scale(1.02)`;
        card.style.setProperty('--mx', ((e.clientX-rect.left)/rect.width*100).toFixed(1)+'%');
        card.style.setProperty('--my', ((e.clientY-rect.top) /rect.height*100).toFixed(1)+'%');
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ════════════════════════════════
     MODAL
  ════════════════════════════════ */
  const modalOverlay = document.getElementById('modalOverlay');
  const modalTitle   = document.getElementById('modalTitle');
  const modalMeta    = document.getElementById('modalMeta');
  const modalViewBtn = document.getElementById('modalViewBtn');
  const modalDlBtn   = document.getElementById('modalDownloadBtn');

  window.openModal = function (note, subjectData) {
    if (!modalOverlay) return;
    const dl = getDownloadCount(note.file);
    modalTitle.textContent = note.title;
    modalMeta.innerHTML = `
      <strong>Subject:</strong> ${subjectData.name}<br>
      <strong>Code:</strong> <span style="color:${subjectData.color}">${note.subject}</span><br>
      <strong>Type:</strong> ${note.type}${note.co ? `<br><strong>Course Outcome:</strong> CO ${note.co}` : ''}
      <br><strong>Downloads:</strong> ${dl > 0 ? dl + ' times' : 'Be the first!'}
    `;
    const preview = document.getElementById('modalPreview');
    if (preview) {
      preview.innerHTML = `<div class="modal-preview-wrap"><iframe src="${encodeURI(note.file)}" loading="lazy" title="${note.title}"></iframe></div>`;
    }
    if (modalViewBtn) { modalViewBtn.href = note.file; modalViewBtn.setAttribute('target', '_blank'); }
    if (modalDlBtn)   { modalDlBtn.href = note.file; modalDlBtn.setAttribute('download', note.file); modalDlBtn.onclick = () => trackDownload(note.file); }
    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  window.closeModal = function () {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
    const preview = document.getElementById('modalPreview');
    if (preview) preview.innerHTML = '';
  };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') window.closeModal(); });
  if (modalOverlay) modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) window.closeModal(); });

  /* ════════════════════════════════
     BUILD NOTE CARD
  ════════════════════════════════ */
  function buildNoteCard(note, subjectData) {
    const card       = document.createElement('div');
    card.className   = 'note-card gsap-reveal';
    card.setAttribute('data-subject', note.subject);
    card.setAttribute('data-title', note.title.toLowerCase());
    card.setAttribute('data-type', note.type);
    const dlCount    = getDownloadCount(note.file);
    const bookmarked = isBookmarked(note.file);

    card.innerHTML = `
      <span class="note-card-pdf-badge">PDF</span>
      <div class="note-card-tag" style="--tag-color:${subjectData.color};--tag-rgb:${subjectData.rgb}">
        <span class="note-card-tag-dot"></span>${note.subject}
      </div>
      <div class="note-card-title">${note.title}</div>
      <div class="note-card-type">${note.type}</div>
      ${dlCount > 0 ? `<div class="note-card-downloads">⬇ ${dlCount} download${dlCount>1?'s':''}</div>` : ''}
      <div class="note-card-actions">
        <button class="nca-btn nca-view">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          View
        </button>
        <a class="nca-btn nca-download" href="${note.file}" download="${note.file}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download
        </a>
        <button class="nca-bookmark ${bookmarked ? 'active' : ''}" title="${bookmarked ? 'Bookmarked' : 'Bookmark'}">🔖</button>
      </div>
    `;
    card.querySelector('.nca-view').addEventListener('click', e => { e.stopPropagation(); window.openModal(note, subjectData); });
    card.querySelector('.nca-download').addEventListener('click', e => { e.stopPropagation(); trackDownload(note.file); });
    card.querySelector('.nca-bookmark').addEventListener('click', function(e) { e.stopPropagation(); toggleBookmark(note.file, this); });
    return card;
  }

  /* ════════════════════════════════
     HOMEPAGE — SUBJECTS CAROUSEL
  ════════════════════════════════ */
  const carouselTrack = document.getElementById('subjectsCarouselTrack');
  const carouselPrev  = document.getElementById('carouselPrev');
  const carouselNext  = document.getElementById('carouselNext');
  const carouselDots  = document.getElementById('carouselDots');

  if (carouselTrack && typeof NOTES_DATA !== 'undefined') {
    let currentSlide = 0;
    const visibleSlides = () => window.innerWidth < 600 ? 1 : window.innerWidth < 900 ? 2 : window.innerWidth < 1200 ? 3 : 4;
    const totalSlides   = NOTES_DATA.length;

    /* Build carousel cards */
    NOTES_DATA.forEach((subject, i) => {
      const card = document.createElement('a');
      card.className  = 'subject-card subject-card-carousel';
      card.href       = `notes.html#${subject.code}`;
      card.style.cssText = `--card-color:${subject.color};--card-rgb:${subject.rgb};min-width:calc((100% - ${(visibleSlides()-1)*1.5}rem) / ${visibleSlides()});flex-shrink:0`;
      card.innerHTML  = `
        <div class="subject-card-band"></div>
        <div class="subject-card-icon">${subject.icon}</div>
        <div class="subject-card-code">${subject.code}</div>
        <div class="subject-card-name">${subject.name}</div>
        <div class="subject-card-desc">${subject.description}</div>
        <div class="subject-card-count">${subject.notes.length} notes available</div>
        <div class="subject-card-arrow">→</div>
        <div class="subject-card-progress"></div>
      `;
      carouselTrack.appendChild(card);
    });

    /* Dots */
    const maxSlide = Math.max(0, totalSlides - visibleSlides());
    for (let i = 0; i <= maxSlide; i++) {
      const dot = document.createElement('button');
      dot.className   = 'carousel-dot' + (i===0?' active':'');
      dot.setAttribute('aria-label', `Slide ${i+1}`);
      dot.addEventListener('click', () => goTo(i));
      if (carouselDots) carouselDots.appendChild(dot);
    }

    function goTo(idx) {
      const vSlides = visibleSlides();
      const max     = Math.max(0, totalSlides - vSlides);
      currentSlide  = Math.max(0, Math.min(idx, max));
      const cardW = carouselTrack.children[0]?.offsetWidth || 0;
      const gap   = 24;
      carouselTrack.style.transform = `translateX(-${currentSlide * (cardW + gap)}px)`;
      carouselDots?.querySelectorAll('.carousel-dot').forEach((d, i) => d.classList.toggle('active', i===currentSlide));
    }

    carouselPrev?.addEventListener('click', () => goTo(currentSlide - 1));
    carouselNext?.addEventListener('click', () => goTo(currentSlide + 1));
    window.addEventListener('resize', () => goTo(currentSlide));

    /* Tilt on carousel subject cards */
    setTimeout(() => enableTilt('.subject-card'), 100);
  }

  /* ════════════════════════════════
     HOMEPAGE — TRENDING NOTES
  ════════════════════════════════ */
  const trendingGrid = document.getElementById('trendingGrid');
  if (trendingGrid && typeof NOTES_DATA !== 'undefined') {
    /* Get top 6 trending notes from NOTES_DATA */
    const allNotes = (typeof getAllNotes !== 'undefined' ? getAllNotes() : [])
      .filter(n => n.trending);
    const trending = allNotes.slice(0, 6);

    if (!trending.length) {
      /* Fallback: pick one from each subject */
      NOTES_DATA.forEach(s => {
        if (s.notes.length > 0) trending.push(s.notes[0]);
        if (trending.length >= 6) return;
      });
    }

    trending.forEach((note, i) => {
      const subj = note.subjectData || NOTES_DATA.find(s => s.code === note.subject) || {};
      const dl   = getDownloadCount(note.file);
      const card = document.createElement('div');
      card.className = 'trending-note-card gsap-reveal';
      card.style.cssText = `--tn-color:${subj.color||'#00FFB2'};--tn-rgb:${subj.rgb||'0,255,178'}`;
      card.innerHTML = `
        <div class="trending-rank">#${i+1}</div>
        <div class="hot-badge">🔥 Trending</div>
        <div class="trending-subject-badge">${subj.icon || ''} ${note.subject}</div>
        <div class="trending-title">${note.title}</div>
        <div class="trending-meta">
          <span>${note.type}</span>
          ${note.co ? `<span>CO ${note.co}</span>` : ''}
          ${dl > 0 ? `<span>⬇ ${dl}</span>` : ''}
        </div>
        <div class="trending-actions">
          <button class="tn-btn tn-view">👁 View</button>
          <a class="tn-btn tn-dl" href="${note.file}" download="${note.file}">⬇ Download</a>
        </div>
      `;
      card.querySelector('.tn-view').addEventListener('click', () => window.openModal(note, subj));
      card.querySelector('.tn-dl').addEventListener('click', () => trackDownload(note.file));
      trendingGrid.appendChild(card);
    });
  }

  /* ════════════════════════════════
     HOMEPAGE — BIG STATS COUNTER
  ════════════════════════════════ */
  function animateBigStatNumbers() {
    document.querySelectorAll('.big-stat-num[data-target]').forEach(el => {
      const target = parseInt(el.getAttribute('data-target'), 10);
      if (isNaN(target)) return;
      const suffix = el.getAttribute('data-suffix') || '';
      if (typeof gsap !== 'undefined') {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target, duration: 1.8, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          onUpdate() { el.textContent = Math.round(obj.val) + suffix; },
          onComplete() { el.textContent = target + suffix; }
        });
      } else {
        el.textContent = target + suffix;
      }
    });
  }
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    setTimeout(animateBigStatNumbers, 400);
  }

  /* ════════════════════════════════
     HOMEPAGE — FAQ ACCORDION
  ════════════════════════════════ */
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn  = item.querySelector('.faq-q');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isOpen = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen);
      /* Close others */
      document.querySelectorAll('.faq-item.open').forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.faq-q')?.setAttribute('aria-expanded', 'false');
        }
      });
      /* GSAP bounce */
      if (typeof gsap !== 'undefined' && isOpen) {
        gsap.from(item.querySelector('.faq-body'), { opacity: 0, y: -8, duration: 0.3, ease: 'power2.out' });
      }
    });
  });

  /* ════════════════════════════════
     HOMEPAGE — TESTIMONIALS CAROUSEL
  ════════════════════════════════ */
  const testTrack = document.getElementById('testimonialsTrack');
  const testPrev  = document.getElementById('testPrev');
  const testNext  = document.getElementById('testNext');
  const testDots  = document.getElementById('testDots');

  if (testTrack) {
    const cards     = testTrack.querySelectorAll('.testimonial-card');
    let testSlide   = 0;
    const testVisible = () => window.innerWidth < 700 ? 1 : window.innerWidth < 900 ? 2 : 3;

    /* Build dots */
    const testMax = () => Math.max(0, cards.length - testVisible());
    const buildTestDots = () => {
      if (!testDots) return;
      testDots.innerHTML = '';
      for (let i = 0; i <= testMax(); i++) {
        const d = document.createElement('button');
        d.className = 'carousel-dot' + (i===0?' active':'');
        d.setAttribute('aria-label', `Slide ${i+1}`);
        d.addEventListener('click', () => goTest(i));
        testDots.appendChild(d);
      }
    };
    buildTestDots();

    function goTest(idx) {
      testSlide = Math.max(0, Math.min(idx, testMax()));
      const cardW = cards[0]?.offsetWidth || 0;
      const gap   = 24;
      if (typeof gsap !== 'undefined') {
        gsap.to(testTrack, { x: -(testSlide * (cardW + gap)), duration: 0.5, ease: 'power2.out' });
      } else {
        testTrack.style.transform = `translateX(-${testSlide * (cardW + gap)}px)`;
      }
      testDots?.querySelectorAll('.carousel-dot').forEach((d, i) => d.classList.toggle('active', i===testSlide));
    }

    testPrev?.addEventListener('click', () => goTest(testSlide - 1));
    testNext?.addEventListener('click', () => goTest(testSlide + 1));
    window.addEventListener('resize', () => { buildTestDots(); goTest(testSlide); });

    /* Auto advance */
    setInterval(() => goTest(testSlide >= testMax() ? 0 : testSlide + 1), 6000);
  }

  /* ════════════════════════════════
     HOMEPAGE — SUBJECT CARDS (grid, not carousel)
     (used on pages that have #subjectsGrid)
  ════════════════════════════════ */
  const subjectsGrid = document.getElementById('subjectsGrid');
  if (subjectsGrid && typeof NOTES_DATA !== 'undefined') {
    NOTES_DATA.forEach((subject, i) => {
      const card = document.createElement('a');
      card.className = 'subject-card';
      card.href      = `notes.html#${subject.code}`;
      card.style.setProperty('--card-color', subject.color);
      card.style.setProperty('--card-rgb',   subject.rgb);
      card.style.animationDelay = `${i * 0.08}s`;
      card.innerHTML = `
        <div class="subject-card-band"></div>
        <div class="subject-card-icon">${subject.icon}</div>
        <div class="subject-card-code">${subject.code}</div>
        <div class="subject-card-name">${subject.name}</div>
        <div class="subject-card-desc">${subject.description}</div>
        <div class="subject-card-count">${subject.notes.length} notes available</div>
        <div class="subject-card-arrow">→</div>
        <div class="subject-card-progress"></div>
      `;
      subjectsGrid.appendChild(card);
    });
    setTimeout(() => enableTilt('.subject-card'), 100);
  }

  /* ════════════════════════════════
     NOTES PAGE
  ════════════════════════════════ */
  const subjectsListing = document.getElementById('subjectsListing');
  const sidebarNav      = document.getElementById('sidebarNav');
  const sidebar         = document.getElementById('sidebar');
  const sidebarToggle   = document.getElementById('sidebarToggle');
  const sidebarOpenBtn  = document.getElementById('sidebarOpenBtn');
  const sbTotal         = document.getElementById('sbTotalNotes');
  const sbSubjects      = document.getElementById('sbTotalSubjects');

  if (subjectsListing && typeof NOTES_DATA !== 'undefined') {
    const allN = typeof getAllNotes !== 'undefined' ? getAllNotes() : [];
    if (sbTotal)    sbTotal.textContent    = allN.length;
    if (sbSubjects) sbSubjects.textContent = NOTES_DATA.length;

    /* Sidebar */
    if (sidebarNav) {
      NOTES_DATA.forEach(subject => {
        const group = document.createElement('div');
        group.className = 'sb-subject';
        const btn = document.createElement('button');
        btn.className = 'sb-subject-btn';
        btn.setAttribute('data-code', subject.code);
        btn.innerHTML = `
          <span class="sb-dot" style="background:${subject.color};color:${subject.color}"></span>
          <div class="sb-subject-info">
            <div class="sb-subject-code" style="color:${subject.color}">${subject.code}</div>
            <div class="sb-subject-name">${subject.name}</div>
          </div>
          <span class="sb-count">${subject.notes.length}</span>
          <span class="sb-chevron">›</span>
        `;
        const notesList = document.createElement('div');
        notesList.className = 'sb-notes';
        subject.notes.forEach(note => {
          const link = document.createElement('button');
          link.className   = 'sb-note-link';
          link.textContent = note.title.substring(0, 48);
          link.addEventListener('click', () => {
            window.openModal(note, subject);
            if (window.innerWidth < 900) sidebar?.classList.remove('open');
          });
          notesList.appendChild(link);
        });
        btn.addEventListener('click', () => {
          const isOpen = btn.classList.toggle('open');
          notesList.classList.toggle('open', isOpen);
          document.getElementById(`section-${subject.code}`)?.scrollIntoView({ behavior:'smooth', block:'start' });
        });
        group.appendChild(btn);
        group.appendChild(notesList);
        sidebarNav.appendChild(group);
      });
    }

    /* Mobile sidebar toggles */
    sidebarToggle?.addEventListener('click',  () => sidebar?.classList.remove('open'));
    sidebarOpenBtn?.addEventListener('click', () => sidebar?.classList.add('open'));
    document.addEventListener('click', e => {
      if (sidebar && window.innerWidth < 900 &&
          !sidebar.contains(e.target) &&
          sidebarOpenBtn && !sidebarOpenBtn.contains(e.target)) sidebar.classList.remove('open');
    });

    /* Main content: subject sections */
    NOTES_DATA.forEach(subject => {
      const section = document.createElement('div');
      section.className = 'subject-section';
      section.id        = `section-${subject.code}`;

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
      subject.notes.forEach(note => grid.appendChild(buildNoteCard(note, subject)));

      header.addEventListener('click', () => {
        const isOpen = header.classList.toggle('open');
        grid.classList.toggle('open', isOpen);
        header.classList.toggle('closed', !isOpen);
      });

      section.appendChild(header);
      section.appendChild(grid);
      subjectsListing.appendChild(section);
    });

    setTimeout(() => enableTilt('.note-card'), 200);

    /* Scroll to hash */
    const hash = window.location.hash.replace('#','');
    if (hash) setTimeout(() => document.getElementById(`section-${hash}`)?.scrollIntoView({ behavior:'smooth', block:'start' }), 400);
  }

  /* ════════════════════════════════
     FILTER NOTES
  ════════════════════════════════ */
  window.filterNotes = function (code, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.querySelectorAll('.subject-section').forEach(section => {
      const show = code === 'all' || section.id === `section-${code}`;
      if (typeof gsap !== 'undefined') {
        gsap.to(section, { opacity: show ? 1 : 0.25, scale: show ? 1 : 0.98, duration: 0.3 });
      } else {
        section.style.display = show ? '' : 'none';
      }
    });
    const bcCurrent = document.getElementById('bcCurrent');
    if (bcCurrent) bcCurrent.textContent = code === 'all' ? 'All Notes' : code;
  };

  /* ════════════════════════════════
     INTERSECTION OBSERVER (GSAP fallback)
  ════════════════════════════════ */
  if ('IntersectionObserver' in window && typeof gsap === 'undefined') {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.gsap-reveal, .step-card, .subject-card, .feature-card, .semester-card').forEach(el => {
      el.style.opacity  = '0';
      el.style.transform = 'translateY(40px)';
      el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
      obs.observe(el);
    });
  }

})();
