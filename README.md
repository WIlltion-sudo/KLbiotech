# BioNotes 🧬

> Ultra-HD Futuristic B.Tech Biotechnology Notes Platform

A next-generation, visually immersive notes browser built with vanilla HTML/CSS/JS. No frameworks, no build step — open directly in a browser or deploy to GitHub Pages instantly.

## 🌐 Live Demo

Deployed at: `https://<your-username>.github.io/<repo-name>/`

---

## 📁 Project Structure

```
├── index.html              # Homepage (hero + subject cards)
├── notes.html              # Notes browser (sidebar + accordion)
├── search.html             # Search & filter page
├── assets/
│   ├── css/
│   │   ├── global.css      # Design tokens, navbar, footer
│   │   ├── hero.css        # Hero + DNA canvas styles
│   │   ├── cards.css       # Subject & note card styles
│   │   └── sidebar.css     # Notes page sidebar
│   └── js/
│       ├── notes-data.js   # All notes mapped to subjects
│       ├── three-scene.js  # Canvas DNA helix + atom animation
│       ├── app.js          # Main logic (cards, modal, filter)
│       └── search.js       # Real-time search logic
├── BCT CO1.pdf             # Biochemical Thermodynamics CO 1
├── BCT CO2.pdf             # Biochemical Thermodynamics CO 2
├── chem co1,2.pdf          # Engineering Chemistry CO 1&2
├── chem co1pdf.pdf         # Engineering Chemistry CO 1
├── Chem CO2.pdf            # Engineering Chemistry CO 2
├── chem co3.pdf            # Engineering Chemistry CO 3
├── LACE CO-1 NOTES.pdf     # Linear Algebra & Calculus CO 1
├── LACE CO-2 NOTES.pdf     # Linear Algebra & Calculus CO 2
├── Lace CO3 notes.pdf      # Linear Algebra & Calculus CO 3
├── Lace_CO-4_NOTES.pdf     # Linear Algebra & Calculus CO 4
├── CO-1 CLASS ROOM PROBLEMS.pdf   # LACE Practice CO 1
├── CO-2 CLASS ROOM PROBLEMS.pdf   # LACE Practice CO 2
├── CO-3 CLASSROOM PROBLEMS.pdf    # LACE Practice CO 3
├── CO-4 CLASS ROOM DELIVERY PROBLEMS.pdf  # LACE Practice CO 4
├── Ds_Co1.pdf              # Data Structure CO 1
├── DS_CO2.pdf              # Data Structure CO 2
├── Ds_Co3Co4_programs.pdf  # Data Structure CO 3 & 4 Programs
└── Data structure notes CO 1,2,3,4..pdf   # DS Full Combined
```

---

## 🚀 Deploy to GitHub Pages

### Step 1 — Create GitHub repo

Go to [github.com/new](https://github.com/new) and create a **public** repository (e.g. `bionotes`).

### Step 2 — Push this project

```bash
git init
git add .
git commit -m "🧬 Initial commit — BioNotes platform"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

### Step 3 — Enable GitHub Pages

1. Go to your repo → **Settings** → **Pages**
2. Under **Source**, select `Deploy from a branch`
3. Branch: `main` | Folder: `/ (root)`
4. Click **Save**
5. Your site will be live at `https://<your-username>.github.io/<repo-name>/` in ~1 minute

---

## 🎨 Subjects Covered

| Code | Subject | Notes |
|------|---------|-------|
| BCT | Biochemical Thermodynamics | 2 |
| Chem | Engineering Chemistry | 4 |
| LACE | Linear Algebra & Calculus | 8 |
| DS | Data Structure | 4 |

---

## ✨ Features

- 🧬 Animated DNA helix + orbiting atom model (Canvas 2D)
- 🌑 Dark futuristic theme — Neon Green, Cyan, Purple palette
- 📂 Auto-organized notes by subject prefix and course outcome
- 🔍 Real-time search with keyword highlighting
- 📱 Fully responsive — desktop, tablet, mobile
- 🖱️ 3D tilt effect on all cards
- 📄 View/Download PDFs directly in browser
- ⚡ Zero dependencies — pure HTML/CSS/JS

---

## 🛠️ Adding New Notes

1. Drop the PDF in the root folder
2. Open `assets/js/notes-data.js`
3. Add an entry to `RAW_FILES`:

```js
{ file: 'YOUR FILE.pdf', subject: 'BCT', title: 'Your Note Title', co: 3, type: 'Full Notes' },
```

That's it — the UI updates automatically.

---

*Built for B.Tech Biotechnology, Semester 1*
