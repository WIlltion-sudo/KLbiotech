/**
 * BIONOTES — Notes Data v2.0
 * Auto-organized from flat folder structure.
 * Subject detection from file name prefixes.
 *
 * SUBJECT CODES:
 *   BCT  → Biochemical Thermodynamics
 *   Chem → Engineering Chemistry
 *   LACE → Linear Algebra & Calculus
 *   DS   → Data Structure
 *
 * NOTE: CO-# Class Room Problems belong to LACE
 */

const SUBJECTS = [
  {
    code: 'BCT',
    name: 'Biochemical Thermodynamics',
    icon: '🧬',
    color: '#00FFB2',
    rgb: '0,255,178',
    description: 'Thermodynamic principles applied to biochemical systems and reactions.',
  },
  {
    code: 'Chem',
    name: 'Engineering Chemistry',
    icon: '⚗️',
    color: '#00D9FF',
    rgb: '0,217,255',
    description: 'Chemical principles underpinning engineering processes and materials.',
  },
  {
    code: 'LACE',
    name: 'Linear Algebra & Calculus',
    icon: '📐',
    color: '#7B61FF',
    rgb: '123,97,255',
    description: 'Mathematical foundations: matrices, vectors, differentiation and integration.',
  },
  {
    code: 'DS',
    name: 'Data Structure',
    icon: '🌐',
    color: '#FF6B6B',
    rgb: '255,107,107',
    description: 'Fundamental data structures, algorithms, and programming concepts.',
  },
];

const RAW_FILES = [
  // BCT
  { file: 'BCT CO1.pdf',    subject: 'BCT',  title: 'Biochemical Thermodynamics — CO 1',          co: 1,    type: 'Full Notes',     trending: true  },
  { file: 'BCT CO2.pdf',    subject: 'BCT',  title: 'Biochemical Thermodynamics — CO 2',          co: 2,    type: 'Full Notes',     trending: false },
  { file: 'BCT CO3 AND CO4.pdf', subject: 'BCT', title: 'Biochemical Thermodynamics — CO 3 & 4',  co: null, type: 'Combined Notes', trending: true  },

  // Chem
  { file: 'chem co1,2.pdf',  subject: 'Chem', title: 'Engineering Chemistry — CO 1 & 2',          co: null, type: 'Combined Notes', trending: true  },
  { file: 'chem co1pdf.pdf', subject: 'Chem', title: 'Engineering Chemistry — CO 1',              co: 1,    type: 'Full Notes',     trending: false },
  { file: 'Chem CO2.pdf',    subject: 'Chem', title: 'Engineering Chemistry — CO 2',              co: 2,    type: 'Full Notes',     trending: true  },
  { file: 'Chem CO3 notes.pdf', subject: 'Chem', title: 'Engineering Chemistry — CO 3',           co: 3,    type: 'Full Notes',     trending: false },

  // LACE — Core Notes
  { file: 'LACE CO-1 NOTES.pdf',   subject: 'LACE', title: 'Linear Algebra & Calculus — CO 1 Notes',   co: 1, type: 'Full Notes',     trending: true  },
  { file: 'LACE CO-2 NOTES.pdf',   subject: 'LACE', title: 'Linear Algebra & Calculus — CO 2 Notes',   co: 2, type: 'Full Notes',     trending: false },
  { file: 'Lace CO3 notes.pdf',    subject: 'LACE', title: 'Linear Algebra & Calculus — CO 3 Notes',   co: 3, type: 'Full Notes',     trending: false },
  { file: 'Lace_CO-4_NOTES.pdf',   subject: 'LACE', title: 'Linear Algebra & Calculus — CO 4 Notes',   co: 4, type: 'Full Notes',     trending: false },

  // LACE — Classroom Problems
  { file: 'CO-1 CLASS ROOM PROBLEMS.pdf',          subject: 'LACE', title: 'LACE — CO 1 Classroom Problems',          co: 1, type: 'Practice Problems', trending: false },
  { file: 'CO-2 CLASS ROOM PROBLEMS.pdf',          subject: 'LACE', title: 'LACE — CO 2 Classroom Problems',          co: 2, type: 'Practice Problems', trending: false },
  { file: 'CO-3 CLASSROOM PROBLEMS.pdf',           subject: 'LACE', title: 'LACE — CO 3 Classroom Problems',          co: 3, type: 'Practice Problems', trending: false },
  { file: 'CO-4 CLASS ROOM DELIVERY PROBLEMS.pdf', subject: 'LACE', title: 'LACE — CO 4 Classroom Delivery Problems', co: 4, type: 'Practice Problems', trending: false },

  // DS
  { file: 'Ds_Co1.pdf',                           subject: 'DS',   title: 'Data Structure — CO 1',                    co: 1,    type: 'Full Notes',     trending: true  },
  { file: 'DS_CO2.pdf',                           subject: 'DS',   title: 'Data Structure — CO 2',                    co: 2,    type: 'Full Notes',     trending: false },
  { file: 'Ds_Co3Co4_programs.pdf',               subject: 'DS',   title: 'Data Structure — CO 3 & 4 Programs',       co: null, type: 'Programs',       trending: true  },
  { file: 'Data structure notes CO 1,2,3,4..pdf', subject: 'DS',   title: 'Data Structure — CO 1, 2, 3, 4 (Full)',    co: null, type: 'Combined Notes', trending: false },
];

/**
 * Build the full notes dataset:
 * - Attach subject metadata
 * - Sort notes within each subject alphabetically by title
 */
const NOTES_DATA = SUBJECTS.map(subject => {
  const notes = RAW_FILES
    .filter(f => f.subject === subject.code)
    .sort((a, b) => {
      // Sort by CO number first, then alphabetically
      if (a.co !== null && b.co !== null) return a.co - b.co;
      if (a.co !== null) return -1;
      if (b.co !== null) return 1;
      return a.title.localeCompare(b.title);
    });

  return { ...subject, notes };
});

/**
 * Helpers
 */
function getAllNotes() {
  return RAW_FILES.map(f => ({
    ...f,
    subjectData: SUBJECTS.find(s => s.code === f.subject),
  }));
}

function getNotesBySubject(code) {
  return NOTES_DATA.find(s => s.code === code);
}

function searchNotes(query, subjectFilter = 'all') {
  const q = query.toLowerCase().trim();
  return getAllNotes().filter(note => {
    const matchQuery = !q ||
      note.title.toLowerCase().includes(q) ||
      note.subject.toLowerCase().includes(q) ||
      note.type.toLowerCase().includes(q) ||
      (note.subjectData && note.subjectData.name.toLowerCase().includes(q));
    const matchSubject = subjectFilter === 'all' || note.subject === subjectFilter;
    return matchQuery && matchSubject;
  });
}
