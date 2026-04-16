/**
 * BIONOTES — Real Three.js WebGL Scene v2.0
 * Double Helix TubeGeometry | Points Particles | Orbiting Atoms
 * Mouse-reactive camera parallax | Responsive resize
 */
(function () {
  'use strict';

  const canvas = document.getElementById('dnaCanvas');
  if (!canvas) return;

  /* ── Wait for Three.js to load ── */
  function initIfReady() {
    if (typeof THREE === 'undefined') {
      setTimeout(initIfReady, 50);
      return;
    }
    init();
  }

  let renderer, scene, camera;
  let helixGroup, particleSystem, atomsGroup;
  let electronData = [];
  let mouseX = 0, mouseY = 0;
  let camTargetX = 0, camTargetY = 0, camTargetZ = 6;
  let targetScroll = 0, currentScroll = 0;
  let frameId;

  /* ── SETUP ── */
  function init() {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: window.devicePixelRatio < 2,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
    camera.position.z = 6;

    resize();
    buildHelix();
    buildParticles();
    buildAtoms();
    initScrollSync();

    window.addEventListener('resize', resize);
    document.addEventListener('mousemove', onMouse);

    cancelAnimationFrame(frameId);
    animate();
  }

  /* ── SCROLL SYNC ── */
  function initScrollSync() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      setTimeout(initScrollSync, 50);
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        targetScroll = self.progress; 
      }
    });

    ScrollTrigger.create({
      trigger: '#featuresSection',
      start: 'top center',
      end: 'bottom center',
      onEnter: () => { 
        camTargetZ = 4.5; 
        if(helixGroup) gsap.to(helixGroup.position, {x: 0, duration: 1.5, ease: 'power2.out'}); 
        if(atomsGroup) gsap.to(atomsGroup.position, {x: 3.2, duration: 1.5, ease: 'power2.out'});
      },
      onLeaveBack: () => { 
        camTargetZ = 6; 
        if(helixGroup) gsap.to(helixGroup.position, {x: 2.8, duration: 1.5, ease: 'power2.out'}); 
        if(atomsGroup) gsap.to(atomsGroup.position, {x: -3.2, duration: 1.5, ease: 'power2.out'});
      },
      onEnterBack: () => { 
        camTargetZ = 4.5; 
        if(helixGroup) gsap.to(helixGroup.position, {x: 0, duration: 1.5, ease: 'power2.out'}); 
        if(atomsGroup) gsap.to(atomsGroup.position, {x: 3.2, duration: 1.5, ease: 'power2.out'});
      },
      onLeave: () => { 
        camTargetZ = 6.5; 
        if(helixGroup) gsap.to(helixGroup.position, {x: -2.8, duration: 1.5, ease: 'power2.out'});
        if(atomsGroup) gsap.to(atomsGroup.position, {x: 0, duration: 1.5, ease: 'power2.out'});
      },
    });

    ScrollTrigger.create({
      trigger: '#subjectsSection',
      start: 'top center',
      onEnter: () => {
        camTargetZ = 5.5; 
        if(helixGroup) gsap.to(helixGroup.position, {x: 3.5, duration: 1.5, ease: 'power2.out'});
      }
    });
  }

  /* ── RESIZE ── */
  function resize() {
    const w = canvas.offsetWidth  || window.innerWidth;
    const h = canvas.offsetHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  /* ── MOUSE PARALLAX ── */
  function onMouse(e) {
    mouseX = (e.clientX / window.innerWidth  - 0.5);
    mouseY = (e.clientY / window.innerHeight - 0.5);
  }

  /* ── DNA DOUBLE HELIX ── */
  function buildHelix() {
    helixGroup = new THREE.Group();

    const N      = 300;   // curve segments
    const turns  = 3.5;
    const radius = 1.1;
    const height = 7;
    const rungCount = Math.floor(turns * 8); // 28 base pairs

    /* ─ Two strand tubes ─ */
    const strandColors = ['#00FFB2', '#00D9FF'];
    strandColors.forEach((hex, si) => {
      const phaseOffset = si * Math.PI;
      const pts = [];
      for (let i = 0; i <= N; i++) {
        const t     = i / N;
        const y     = (t - 0.5) * height;
        const angle = t * Math.PI * 2 * turns + phaseOffset;
        pts.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
      }
      const curve   = new THREE.CatmullRomCurve3(pts);
      const tubeGeo = new THREE.TubeGeometry(curve, 500, 0.035, 6, false);
      const color   = new THREE.Color(hex);

      /* Core strand */
      helixGroup.add(new THREE.Mesh(
        tubeGeo,
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })
      ));
      /* Soft glow copy */
      const glowGeo = new THREE.TubeGeometry(curve, 200, 0.1, 6, false);
      helixGroup.add(new THREE.Mesh(
        glowGeo,
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12 })
      ));
    });

    /* ─ Rung connectors + nucleotide spheres ─ */
    const rungMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#ffffff'), transparent: true, opacity: 0.12
    });
    const s1Mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#00FFB2'), transparent: true, opacity: 0.95
    });
    const s2Mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#00D9FF'), transparent: true, opacity: 0.95
    });
    const rungGeoBase = new THREE.SphereGeometry(0.06, 6, 6);

    for (let i = 0; i < rungCount; i++) {
      const t     = i / rungCount;
      const y     = (t - 0.5) * height;
      const angle = t * Math.PI * 2 * turns;

      const x1 = Math.cos(angle) * radius,           z1 = Math.sin(angle) * radius;
      const x2 = Math.cos(angle + Math.PI) * radius, z2 = Math.sin(angle + Math.PI) * radius;
      const p1 = new THREE.Vector3(x1, y, z1);
      const p2 = new THREE.Vector3(x2, y, z2);

      /* Rung cylinder */
      const dir = new THREE.Vector3().subVectors(p2, p1);
      const len = dir.length();
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const cylGeo = new THREE.CylinderGeometry(0.018, 0.018, len, 4);
      const cyl    = new THREE.Mesh(cylGeo, rungMat);
      cyl.position.copy(mid);
      cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.normalize());
      helixGroup.add(cyl);

      /* Nucleotide spheres */
      const sp1 = new THREE.Mesh(rungGeoBase, s1Mat);
      sp1.position.copy(p1);
      const sp2 = new THREE.Mesh(rungGeoBase, s2Mat);
      sp2.position.copy(p2);
      helixGroup.add(sp1, sp2);
    }

    helixGroup.position.set(2.8, 0, 0);
    scene.add(helixGroup);
  }

  /* ── PARTICLE FIELD ── */
  function buildParticles() {
    const count = 1800;
    const pos   = new Float32Array(count * 3);
    const col   = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random()-0.5) * 22;
      pos[i*3+1] = (Math.random()-0.5) * 22;
      pos[i*3+2] = (Math.random()-0.5) * 22;
      const g    = Math.random() > 0.5;
      col[i*3]   = g ? 0.0 : 0.0;
      col[i*3+1] = g ? 1.0 : 0.85;
      col[i*3+2] = g ? 0.7 : 1.0;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    particleSystem = new THREE.Points(geo,
      new THREE.PointsMaterial({
        size: 0.045, vertexColors: true,
        transparent: true, opacity: 0.65,
        sizeAttenuation: true,
      })
    );
    scene.add(particleSystem);
  }

  /* ── ATOM CLUSTER ── */
  function buildAtoms() {
    atomsGroup = new THREE.Group();

    /* Nucleus */
    const nucleus = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 16),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#7B61FF'), transparent: true, opacity: 0.85 })
    );
    atomsGroup.add(nucleus);

    /* Outer glow */
    const nucleusGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 16),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#7B61FF'), transparent: true, opacity: 0.08 })
    );
    atomsGroup.add(nucleusGlow);

    /* Orbit rings + electrons */
    const orbits = [
      { r: 0.55, tilt: new THREE.Euler(Math.PI/3, 0, 0),          speed: 0.012, color: '#00D9FF' },
      { r: 0.85, tilt: new THREE.Euler(0, Math.PI/4, Math.PI/6),  speed: 0.008, color: '#00FFB2' },
      { r: 1.1,  tilt: new THREE.Euler(Math.PI/5, Math.PI/3, 0),  speed: 0.006, color: '#7B61FF' },
    ];

    orbits.forEach((orb, idx) => {
      /* Ring */
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(orb.r, 0.006, 8, 64),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(orb.color), transparent: true, opacity: 0.18 })
      );
      ring.setRotationFromEuler(orb.tilt);
      atomsGroup.add(ring);

      /* Electron */
      const electron = new THREE.Mesh(
        new THREE.SphereGeometry(0.065, 8, 8),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(orb.color) })
      );
      /* Glow halo */
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 8, 8),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(orb.color), transparent: true, opacity: 0.2 })
      );
      electron.add(halo);
      atomsGroup.add(electron);

      electronData.push({
        mesh:  electron,
        orbit: orb.r,
        tilt:  orb.tilt,
        angle: (idx / orbits.length) * Math.PI * 2,
        speed: orb.speed,
      });
    });

    atomsGroup.position.set(-3.2, 0.5, 0);
    scene.add(atomsGroup);
  }

  /* ── ANIMATION LOOP ── */
  let tick = 0;
  let currentTickSpeed = 0.005;
  let targetTickSpeed = 0.005;

  /* Bio-reactive hover acceleration */
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('a, button, .subject-card, .subject-card-carousel, .note-card, .feature-card, .step-card, .testimonial-card, .trending-note-card')) {
      targetTickSpeed = 0.035;
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('a, button, .subject-card, .subject-card-carousel, .note-card, .feature-card, .step-card, .testimonial-card, .trending-note-card')) {
      targetTickSpeed = 0.005;
    }
  });

  function animate() {
    frameId = requestAnimationFrame(animate);
    currentTickSpeed += (targetTickSpeed - currentTickSpeed) * 0.05;
    tick += currentTickSpeed;

    /* Smooth scroll tracking */
    currentScroll += (targetScroll - currentScroll) * 0.08;

    /* Rotate helix */
    if (helixGroup) helixGroup.rotation.y = tick * 0.8 + currentScroll * Math.PI * 4;

    /* Orbit electrons */
    electronData.forEach(e => {
      e.angle += e.speed;
      /* Position on a flat circle then apply tilt */
      const lp = new THREE.Vector3(
        Math.cos(e.angle) * e.orbit,
        0,
        Math.sin(e.angle) * e.orbit
      );
      lp.applyEuler(e.tilt);
      e.mesh.position.copy(lp);
    });

    /* Slowly rotate atom cluster */
    if (atomsGroup) {
      atomsGroup.rotation.y  = tick * 0.6 - currentScroll * Math.PI * 2;
      atomsGroup.position.y  = 0.5 + Math.sin(tick * 0.8) * 0.12 + currentScroll * 2;
    }

    /* Particle drift */
    if (particleSystem) {
      particleSystem.rotation.y += 0.0003;
      particleSystem.rotation.x  = Math.sin(tick * 0.4) * 0.05 + currentScroll * 0.5;
    }

    /* Smooth camera parallax */
    camTargetX += (mouseX * 0.6 - camTargetX) * 0.04;
    camTargetY += (-mouseY * 0.4 - camTargetY) * 0.04;
    camera.position.x = camTargetX;
    camera.position.y = camTargetY;
    camera.position.z += (camTargetZ - camera.position.z) * 0.04;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  /* ── DOM PARTICLES (floating bubbles) ── */
  function buildDomParticles() {
    const host = document.getElementById('heroParticles');
    if (!host) return;
    for (let i = 0; i < 35; i++) {
      const el  = document.createElement('div');
      el.className = 'particle';
      const size   = Math.random() * 7 + 2;
      const green  = Math.random() > 0.5;
      const drift  = (Math.random() - 0.5) * 100;
      const dur    = 9 + Math.random() * 14;
      const delay  = Math.random() * 10;
      el.style.cssText = `
        width:${size}px; height:${size}px;
        left:${Math.random()*100}%;
        bottom:-20px;
        background:${green ? 'rgba(0,255,178,0.5)' : 'rgba(0,217,255,0.4)'};
        box-shadow:0 0 ${size*2}px ${green ? 'rgba(0,255,178,0.35)' : 'rgba(0,217,255,0.3)'};
        animation-duration:${dur}s;
        animation-delay:${delay}s;
        --drift:${drift}px;
      `;
      host.appendChild(el);
    }
  }

  /* ── BOOT ── */
  function boot() {
    initIfReady();
    buildDomParticles();
  }
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
