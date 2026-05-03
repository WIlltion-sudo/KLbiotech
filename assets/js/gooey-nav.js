/*!
 * GooeyNav — Vanilla JS gooey navigation with particle burst effect
 * Ported from React for BioNotes (plain HTML/CSS/JS project)
 *
 * Usage: Call initGooeyNav(containerEl, items, options) after DOM ready
 */
(function () {
  "use strict";

  /**
   * @param {HTMLElement} container  – A wrapper element (position:relative recommended)
   * @param {Array}       items       – [{ label, href }, ...]
   * @param {Object}      opts        – Optional overrides
   */
  function initGooeyNav(container, items, opts) {
    /* ── Config ── */
    const cfg = Object.assign({
      particleCount:    15,
      particleDistances: [90, 10],
      particleR:        100,
      initialActiveIndex: 0,
      animationTime:    600,
      timeVariance:     300,
      /* Color palette — each nav item cycles through these hsl values */
      colors: [1, 2, 3, 1, 2, 3, 1, 4],
    }, opts || {});

    const HUE_MAP = {
      1: 158,   // teal  (#00FFB2 family)
      2: 195,   // cyan  (#00D9FF family)
      3: 262,   // violet
      4: 325,   // pink/magenta
    };

    let activeIndex = cfg.initialActiveIndex;

    /* ── SVG filter (gooey) ── */
    if (!document.getElementById("gooey-filter-svg")) {
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("id", "gooey-filter-svg");
      svg.setAttribute("xmlns", svgNS);
      svg.setAttribute("width", "0");
      svg.setAttribute("height", "0");
      svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;";
      svg.innerHTML = `
        <defs>
          <filter id="gooey" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur"/>
            <feColorMatrix in="blur" mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goo"/>
            <feBlend in="SourceGraphic" in2="goo"/>
          </filter>
        </defs>`;
      document.body.appendChild(svg);
    }

    /* ── Build DOM ── */
    container.classList.add("gooey-nav-container");
    container.style.position = "relative";

    /* Particle container (behind links, has gooey filter) */
    const particleWrap = document.createElement("div");
    particleWrap.className = "gooey-particles-wrap";
    particleWrap.style.cssText = `
      position:absolute; inset:0; pointer-events:none;
      filter:url(#gooey); overflow:visible; z-index:0;`;
    container.appendChild(particleWrap);

    /* Nav list */
    const nav = document.createElement("nav");
    nav.className = "gooey-nav";
    nav.style.cssText = `
      position:relative; display:flex; gap:0.5rem;
      list-style:none; margin:0; padding:0.5rem; z-index:1;`;

    items.forEach((item, idx) => {
      const li = document.createElement("li");
      li.style.cssText = "position:relative; list-style:none;";

      /* Indicator blob (rendered inside particle wrap) */
      const indicator = document.createElement("div");
      indicator.className = "gooey-indicator";
      indicator.dataset.idx = idx;
      indicator.style.cssText = `
        position:absolute; border-radius:9999px;
        background:hsl(${HUE_MAP[cfg.colors[idx % cfg.colors.length]]},100%,60%);
        opacity:0; pointer-events:none; transition:none;`;
      particleWrap.appendChild(indicator);

      /* Link */
      const a = document.createElement("a");
      a.href = item.href || "#";
      a.textContent = item.label;
      a.className = "gooey-nav-link" + (idx === activeIndex ? " active" : "");
      a.style.cssText = `
        display:block; padding:0.55rem 1.35rem; border-radius:9999px;
        font-family:inherit; font-size:0.9rem; font-weight:500;
        letter-spacing:0.02em; text-decoration:none; cursor:pointer;
        position:relative; z-index:2; transition:color 0.3s;
        color: ${idx === activeIndex ? "#0a0a0f" : "var(--text-muted,#aaa)"};`;

      if (idx === activeIndex) {
        // Position initial indicator over this link
        requestAnimationFrame(() => positionIndicator(indicator, li));
      }

      a.addEventListener("click", (e) => {
        if (item.href === "#" || item.href === "") e.preventDefault();
        if (idx === activeIndex) return;
        const prevIdx = activeIndex;
        activeIndex = idx;
        activateItem(idx, prevIdx, li, indicator);
      });

      li.appendChild(a);
      nav.appendChild(li);
    });

    container.appendChild(nav);

    /* Update all link colors when active changes */
    function updateLinkColors(newActive) {
      nav.querySelectorAll(".gooey-nav-link").forEach((a, i) => {
        a.style.color = i === newActive
          ? "#0a0a0f"
          : "var(--text-muted,#aaa)";
        a.classList.toggle("active", i === newActive);
      });
    }

    /* Get bounding rect of a li relative to particleWrap */
    function getRelRect(liEl) {
      const wrapR = particleWrap.getBoundingClientRect();
      const liR   = liEl.getBoundingClientRect();
      return {
        left:   liR.left - wrapR.left,
        top:    liR.top  - wrapR.top,
        width:  liR.width,
        height: liR.height,
      };
    }

    /* Position the indicator pill over the li */
    function positionIndicator(ind, liEl) {
      const r = getRelRect(liEl);
      ind.style.left   = r.left   + "px";
      ind.style.top    = r.top    + "px";
      ind.style.width  = r.width  + "px";
      ind.style.height = r.height + "px";
      ind.style.opacity = "1";
    }

    /* ── Particle burst ── */
    function spawnParticles(liEl, colorHue) {
      const r = getRelRect(liEl);
      const cx = r.left + r.width / 2;
      const cy = r.top  + r.height / 2;
      const count = cfg.particleCount;
      const [dMin, dMax] = cfg.particleDistances;
      const maxR = cfg.particleR;

      for (let i = 0; i < count; i++) {
        const p = document.createElement("div");
        p.style.cssText = `
          position:absolute; border-radius:50%;
          background:hsl(${colorHue},100%,65%);
          width:${4 + Math.random() * 10}px;
          height:${4 + Math.random() * 10}px;
          left:${cx}px; top:${cy}px;
          transform:translate(-50%,-50%);
          pointer-events:none; opacity:1;`;
        particleWrap.appendChild(p);

        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const dist  = dMin + Math.random() * (dMax - dMin) + maxR * 0.3;
        const tx    = Math.cos(angle) * dist;
        const ty    = Math.sin(angle) * dist;
        const dur   = cfg.animationTime + Math.random() * cfg.timeVariance;

        p.animate([
          { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
          { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`, opacity: 0 },
        ], { duration: dur, easing: "ease-out", fill: "forwards" })
         .finished.then(() => p.remove());
      }
    }

    /* ── Activate item ── */
    function activateItem(newIdx, prevIdx, newLi, newIndicator) {
      const hue = HUE_MAP[cfg.colors[newIdx % cfg.colors.length]];
      updateLinkColors(newIdx);

      /* Hide old indicator */
      const oldInd = particleWrap.querySelector(`.gooey-indicator[data-idx="${prevIdx}"]`);
      if (oldInd) oldInd.style.opacity = "0";

      /* Animate new indicator sliding in */
      positionIndicator(newIndicator, newLi);
      newIndicator.style.opacity = "1";

      /* Particle burst */
      spawnParticles(newLi, hue);
    }

    /* Show initial indicator */
    if (items.length > 0) {
      requestAnimationFrame(() => {
        const initLi  = nav.querySelectorAll("li")[activeIndex];
        const initInd = particleWrap.querySelector(`.gooey-indicator[data-idx="${activeIndex}"]`);
        if (initLi && initInd) positionIndicator(initInd, initLi);
      });
    }
  }

  /* Expose */
  window.initGooeyNav = initGooeyNav;
})();
