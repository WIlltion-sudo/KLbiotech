/**
 * BIONOTES — Admin Panel JS (Open Access)
 * Manage notes metadata via localStorage overrides
 * Add/edit/hide notes | Export JSON | Import JSON | Stats dashboard
 */
(function () {
  'use strict';

  const CUSTOM_KEY = 'bionotes-admin-notes';
  const DL_KEY     = 'bionotes-downloads';
  const BK_KEY     = 'bionotes-bookmarks';

  /* ── LOAD CUSTOM NOTES ── */
  function getCustomNotes() {
    try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]'); }
    catch { return []; }
  }
  function saveCustomNotes(arr) {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(arr));
  }

  /* ── STATS ── */
  function renderStats() {
    const all = typeof getAllNotes !== 'undefined' ? getAllNotes() : [];
    const dl  = (() => { try { return JSON.parse(localStorage.getItem(DL_KEY)||'{}'); } catch { return {}; } })();
    const bk  = (() => { try { return JSON.parse(localStorage.getItem(BK_KEY)||'[]'); } catch { return []; } })();
    const totalDl = Object.values(dl).reduce((a, b) => a + b, 0);

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('statNotes',       all.length);
    set('statDownloads',   totalDl);
    set('statBookmarks',   bk.length);
    set('statCustom',      getCustomNotes().length);

    /* Subject breakdown */
    const breakdownEl = document.getElementById('subjectBreakdown');
    if (breakdownEl && typeof NOTES_DATA !== 'undefined') {
      breakdownEl.innerHTML = NOTES_DATA.map(s => {
        const subDl = s.notes.reduce((sum, n) => sum + (dl[n.file] || 0), 0);
        return `
          <div class="stat-row">
            <span class="stat-row-icon">${s.icon}</span>
            <span class="stat-row-code" style="color:${s.color}">${s.code}</span>
            <span class="stat-row-name">${s.name}</span>
            <span class="stat-row-val">${s.notes.length} notes · ${subDl} ⬇</span>
          </div>
        `;
      }).join('');
    }

    /* Top downloaded */
    const topEl = document.getElementById('topDownloaded');
    if (topEl) {
      const sorted = Object.entries(dl).sort((a, b) => b[1] - a[1]).slice(0, 5);
      topEl.innerHTML = sorted.length
        ? sorted.map(([file, count]) =>
            `<div class="dl-row"><span class="dl-file">${file}</span><span class="dl-count">${count} ⬇</span></div>`
          ).join('')
        : '<p class="empty-note">No downloads yet.</p>';
    }
  }

  /* ── RENDER ALL NOTES TABLE ── */
  function renderNotesTable() {
    const tbody = document.getElementById('notesTableBody');
    if (!tbody || typeof getAllNotes === 'undefined') return;

    const all    = getAllNotes();
    const custom = getCustomNotes();
    const dl     = (() => { try { return JSON.parse(localStorage.getItem(DL_KEY)||'{}'); } catch { return {}; } })();
    const combined = [...all, ...custom];

    tbody.innerHTML = combined.map((note, i) => {
      const isCustom = i >= all.length;
      return `
        <tr class="notes-row ${isCustom ? 'custom-row' : ''}">
          <td><span class="badge-subject" style="color:${note.subjectData?.color||'#aaa'}">${note.subject}</span></td>
          <td class="note-title-cell">${note.title}</td>
          <td><span class="type-badge">${note.type}</span></td>
          <td>${note.co ? `CO ${note.co}` : '—'}</td>
          <td>${dl[note.file] || 0}</td>
          <td>
            ${isCustom
              ? `<button class="admin-btn danger" onclick="deleteCustomNote(${i - all.length})">Delete</button>`
              : '<span class="built-in-label">Built-in</span>'}
          </td>
        </tr>
      `;
    }).join('');
  }

  /* ── ADD NOTE FORM ── */
  const addForm = document.getElementById('addNoteForm');
  if (addForm) {
    addForm.addEventListener('submit', e => {
      e.preventDefault();
      const data = new FormData(addForm);
      const newNote = {
        file:    data.get('file'),
        subject: data.get('subject'),
        title:   data.get('title'),
        co:      data.get('co') ? parseInt(data.get('co')) : null,
        type:    data.get('type') || 'Full Notes',
        subjectData: (typeof SUBJECTS !== 'undefined'
          ? SUBJECTS.find(s => s.code === data.get('subject'))
          : null) || { name: data.get('subject'), color: '#00FFB2', rgb: '0,255,178' },
      };
      const arr = getCustomNotes();
      arr.push(newNote);
      saveCustomNotes(arr);
      renderNotesTable();
      renderStats();
      addForm.reset();
      showToast('Note added successfully!');
    });
  }

  /* ── DELETE CUSTOM NOTE ── */
  window.deleteCustomNote = function (idx) {
    const arr = getCustomNotes();
    const note = arr[idx];
    if (!note) return;
    if (!confirm(`Delete "${note.title}"?`)) return;
    arr.splice(idx, 1);
    saveCustomNotes(arr);
    renderNotesTable();
    renderStats();
    showToast('Note deleted.');
  };

  /* ── EXPORT JSON ── */
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const data = {
        custom: getCustomNotes(),
        downloads: (() => { try { return JSON.parse(localStorage.getItem(DL_KEY)||'{}'); } catch { return {}; } })(),
        bookmarks: (() => { try { return JSON.parse(localStorage.getItem(BK_KEY)||'[]'); } catch { return []; } })(),
        exported: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'bionotes-admin-export.json';
      a.click();
    });
  }

  /* ── IMPORT JSON ── */
  const importInput = document.getElementById('importInput');
  if (importInput) {
    importInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.custom) saveCustomNotes(data.custom);
          if (data.downloads) localStorage.setItem(DL_KEY, JSON.stringify(data.downloads));
          if (data.bookmarks) localStorage.setItem(BK_KEY, JSON.stringify(data.bookmarks));
          renderNotesTable();
          renderStats();
          showToast('Import successful!');
        } catch {
          showToast('Invalid JSON file.', true);
        }
      };
      reader.readAsText(file);
    });
  }

  /* ── CLEAR DOWNLOADS ── */
  const clearDlBtn = document.getElementById('clearDownloads');
  if (clearDlBtn) {
    clearDlBtn.addEventListener('click', () => {
      if (!confirm('Reset all download counters?')) return;
      localStorage.removeItem(DL_KEY);
      renderStats();
      renderNotesTable();
      showToast('Download counts cleared.');
    });
  }

  /* ── CLEAR BOOKMARKS ── */
  const clearBkBtn = document.getElementById('clearBookmarks');
  if (clearBkBtn) {
    clearBkBtn.addEventListener('click', () => {
      if (!confirm('Clear all bookmarks?')) return;
      localStorage.removeItem(BK_KEY);
      renderStats();
      showToast('Bookmarks cleared.');
    });
  }

  /* ── SEARCH NOTES TABLE ── */
  const tableSearch = document.getElementById('adminSearch');
  if (tableSearch) {
    tableSearch.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.notes-row').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }

  /* ── TOAST NOTIFICATION ── */
  function showToast(msg, isError = false) {
    let toast = document.getElementById('adminToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'adminToast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = 'admin-toast' + (isError ? ' error' : '');
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
    }, 3000);
  }

  /* ── TABS ── */
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
      tab.classList.add('active');
      const section = document.getElementById(`tab-${target}`);
      if (section) section.classList.add('active');
    });
  });

  /* ── INIT ── */
  function init() {
    renderStats();
    renderNotesTable();
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
