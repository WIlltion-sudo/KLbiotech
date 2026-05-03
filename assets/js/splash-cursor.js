/*!
 * SplashCursor — WebGL Fluid Simulation Cursor
 * Ported from React to vanilla JS for BioNotes
 * Config: see initSplashCursor() call at the bottom
 */
(function () {
  "use strict";

  /* ─── Config defaults (overridable) ─── */
  const CFG = {
    DENSITY_DISSIPATION: 3.5,
    VELOCITY_DISSIPATION: 2,
    PRESSURE: 0.1,
    PRESSURE_ITERATIONS: 20,
    CURL: 3,
    SPLAT_RADIUS: 0.2,
    SPLAT_FORCE: 6000,
    SHADING: true,
    COLOR_UPDATE_SPEED: 10,
    BACK_COLOR: { r: 0, g: 0, b: 0 },
    TRANSPARENT: true,
    RAINBOW_MODE: false,
    COLOR: "#A855F7",
  };

  /* ─── Utilities ─── */
  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return { r, g, b };
  }
  function HSVtoRGB(h, s, v) {
    let r, g, b;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0: r=v;g=t;b=p; break;
      case 1: r=q;g=v;b=p; break;
      case 2: r=p;g=v;b=t; break;
      case 3: r=p;g=q;b=v; break;
      case 4: r=t;g=p;b=v; break;
      case 5: r=v;g=p;b=q; break;
    }
    return { r, g, b };
  }
  function generateColor() {
    if (!CFG.RAINBOW_MODE) return hexToRgb(CFG.COLOR);
    const c = HSVtoRGB(Math.random(), 1, 1);
    c.r *= 0.15; c.g *= 0.15; c.b *= 0.15;
    return c;
  }
  function wrap(value, min, max) {
    const range = max - min;
    return ((value - min) % range + range) % range + min;
  }
  function getResolution(gl, resolution) {
    let w = gl.drawingBufferWidth;
    let h = gl.drawingBufferHeight;
    if (w > h) {
      if (w > resolution) { h = Math.round(h * resolution / w); w = resolution; }
    } else {
      if (h > resolution) { w = Math.round(w * resolution / h); h = resolution; }
    }
    return { width: w, height: h };
  }
  function scaleByPixelRatio(input) {
    return Math.floor(input * (window.devicePixelRatio || 1));
  }

  /* ─── WebGL helpers ─── */
  function compileShader(gl, type, src, keywords) {
    src = addKeywords(src, keywords);
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      console.warn("Shader compile error:", gl.getShaderInfoLog(s));
    return s;
  }
  function addKeywords(src, keywords) {
    if (!keywords) return src;
    let kw = "";
    keywords.forEach(k => { kw += `#define ${k}\n`; });
    return kw + src;
  }
  function createProgram(gl, vert, frag, keywords) {
    const p = gl.createProgram();
    gl.attachShader(p, compileShader(gl, gl.VERTEX_SHADER, vert));
    gl.attachShader(p, compileShader(gl, gl.FRAGMENT_SHADER, frag, keywords));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS))
      console.warn("Program link error:", gl.getProgramInfoLog(p));
    return p;
  }
  function getUniforms(gl, program) {
    const uniforms = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(program, i);
      uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
    return uniforms;
  }
  class Material {
    constructor(gl, vert, frag) {
      this.gl = gl;
      this.vert = vert;
      this.frag = frag;
      this.programs = [];
      this.activeProgram = null;
      this.uniforms = [];
    }
    setKeywords(keywords) {
      let hash = 0;
      for (let i = 0; i < keywords.length; i++)
        for (let j = 0; j < keywords[i].length; j++) hash = (hash << 5) - hash + keywords[i].charCodeAt(j);
      let prog = this.programs[hash];
      if (!prog) {
        const p = createProgram(this.gl, this.vert, this.frag, keywords);
        prog = { program: p, uniforms: getUniforms(this.gl, p) };
        this.programs[hash] = prog;
      }
      if (prog.program !== this.activeProgram) {
        this.activeProgram = prog.program;
        this.uniforms = prog.uniforms;
      }
    }
    bind() { this.gl.useProgram(this.activeProgram); }
  }
  class Program {
    constructor(gl, vert, frag) {
      this.gl = gl;
      this.program = createProgram(gl, vert, frag);
      this.uniforms = getUniforms(gl, this.program);
    }
    bind() { this.gl.useProgram(this.program); }
  }

  /* ─── Shaders ─── */
  const baseVertexShader = `
    precision highp float;
    attribute vec2 aPosition;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform vec2 texelSize;
    void main(){
      vUv = aPosition*0.5+0.5;
      vL = vUv - vec2(texelSize.x,0.0);
      vR = vUv + vec2(texelSize.x,0.0);
      vT = vUv + vec2(0.0,texelSize.y);
      vB = vUv - vec2(0.0,texelSize.y);
      gl_Position = vec4(aPosition,0.0,1.0);
    }`;
  const copyShader = `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vUv;
    uniform sampler2D uTexture;
    void main(){ gl_FragColor = texture2D(uTexture,vUv); }`;
  const clearShader = `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vUv;
    uniform sampler2D uTexture;
    uniform float value;
    void main(){ gl_FragColor = value*texture2D(uTexture,vUv); }`;
  const displayShaderSource = `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    uniform sampler2D uTexture;
    #ifdef SHADING
      uniform vec2 texelSize;
      uniform sampler2D uBloom;
      uniform sampler2D uDithering;
      uniform vec2 ditherScale;
    #endif
    void main(){
      vec3 c = texture2D(uTexture,vUv).rgb;
      #ifdef SHADING
        vec3 bloom = texture2D(uBloom,vUv).rgb;
        vec3 dither = texture2D(uDithering,vUv*ditherScale).rgb;
        c += (dither-0.5)/255.0;
        c += bloom;
      #endif
      float a = max(c.r,max(c.g,c.b));
      gl_FragColor = vec4(c,a);
    }`;
  const splatShader = `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;
    void main(){
      vec2 p = vUv - point.xy;
      p.x *= aspectRatio;
      vec3 splat = exp(-dot(p,p)/radius)*color;
      vec3 base = texture2D(uTarget,vUv).xyz;
      gl_FragColor = vec4(base+splat,1.0);
    }`;
  const advectionShader = `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform vec2 dyeTexelSize;
    uniform float dt;
    uniform float dissipation;
    vec4 bilerp(sampler2D sam,vec2 uv,vec2 tsize){
      vec2 st = uv/tsize - 0.5;
      vec2 iuv = floor(st);
      vec2 fuv = fract(st);
      vec4 a = texture2D(sam,(iuv+vec2(0.5,0.5))*tsize);
      vec4 b = texture2D(sam,(iuv+vec2(1.5,0.5))*tsize);
      vec4 c = texture2D(sam,(iuv+vec2(0.5,1.5))*tsize);
      vec4 d = texture2D(sam,(iuv+vec2(1.5,1.5))*tsize);
      return mix(mix(a,b,fuv.x),mix(c,d,fuv.x),fuv.y);
    }
    void main(){
      vec2 coord = vUv - dt*bilerp(uVelocity,vUv,texelSize).xy*texelSize;
      vec4 result = bilerp(uSource,coord,dyeTexelSize);
      float decay = 1.0+(dissipation*dt);
      gl_FragColor = result/decay;
    }`;
  const divergenceShader = `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;
    uniform sampler2D uVelocity;
    void main(){
      float L = texture2D(uVelocity,vL).x;
      float R = texture2D(uVelocity,vR).x;
      float T = texture2D(uVelocity,vT).y;
      float B = texture2D(uVelocity,vB).y;
      vec2 C = texture2D(uVelocity,vUv).xy;
      if(vL.x<0.0){L=-C.x;} if(vR.x>1.0){R=-C.x;} if(vT.y>1.0){T=-C.y;} if(vB.y<0.0){B=-C.y;}
      float div = 0.5*(R-L+T-B);
      gl_FragColor = vec4(div,0.0,0.0,1.0);
    }`;
  const curlShader = `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;
    uniform sampler2D uVelocity;
    void main(){
      float L = texture2D(uVelocity,vL).y;
      float R = texture2D(uVelocity,vR).y;
      float T = texture2D(uVelocity,vT).x;
      float B = texture2D(uVelocity,vB).x;
      float vorticity = R-L-T+B;
      gl_FragColor = vec4(0.5*vorticity,0.0,0.0,1.0);
    }`;
  const vorticityShader = `
    precision highp float;
    precision highp sampler2D;
    varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
    uniform sampler2D uVelocity;
    uniform sampler2D uCurl;
    uniform float curl;
    uniform float dt;
    void main(){
      float L = texture2D(uCurl,vL).x;
      float R = texture2D(uCurl,vR).x;
      float T = texture2D(uCurl,vT).x;
      float B = texture2D(uCurl,vB).x;
      float C = texture2D(uCurl,vUv).x;
      vec2 force = 0.5*vec2(abs(T)-abs(B),abs(R)-abs(L));
      force /= length(force)+0.0001;
      force *= curl*C;
      force.y *= -1.0;
      vec2 vel = texture2D(uVelocity,vUv).xy;
      gl_FragColor = vec4(vel+force*dt,0.0,1.0);
    }`;
  const pressureShader = `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;
    void main(){
      float L = texture2D(uPressure,vL).x;
      float R = texture2D(uPressure,vR).x;
      float T = texture2D(uPressure,vT).x;
      float B = texture2D(uPressure,vB).x;
      float C = texture2D(uPressure,vUv).x;
      float divergence = texture2D(uDivergence,vUv).x;
      float pressure = (L+R+B+T-divergence)*0.25;
      gl_FragColor = vec4(pressure,0.0,0.0,1.0);
    }`;
  const gradientSubtractShader = `
    precision mediump float;
    precision mediump sampler2D;
    varying highp vec2 vUv; varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;
    void main(){
      float L = texture2D(uPressure,vL).x;
      float R = texture2D(uPressure,vR).x;
      float T = texture2D(uPressure,vT).x;
      float B = texture2D(uPressure,vB).x;
      vec2 velocity = texture2D(uVelocity,vUv).xy;
      velocity.xy -= vec2(R-L,T-B);
      gl_FragColor = vec4(velocity,0.0,1.0);
    }`;

  /* ─── Framebuffer ─── */
  function createFBO(gl, w, h, internalFormat, format, type, param) {
    gl.activeTexture(gl.TEXTURE0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { texture: tex, fbo, width: w, height: h,
      texelSizeX: 1/w, texelSizeY: 1/h,
      attach(id){ gl.activeTexture(gl.TEXTURE0+id); gl.bindTexture(gl.TEXTURE_2D,tex); return id; }
    };
  }
  function createDoubleFBO(gl, w, h, internalFormat, format, type, param) {
    let fbo1 = createFBO(gl,w,h,internalFormat,format,type,param);
    let fbo2 = createFBO(gl,w,h,internalFormat,format,type,param);
    return {
      width:w, height:h, texelSizeX:fbo1.texelSizeX, texelSizeY:fbo1.texelSizeY,
      get read(){ return fbo1; },
      set read(v){ fbo1=v; },
      get write(){ return fbo2; },
      set write(v){ fbo2=v; },
      swap(){ [fbo1,fbo2]=[fbo2,fbo1]; }
    };
  }
  function resizeFBO(gl, target, w, h, internalFormat, format, type, param) {
    const newFBO = createFBO(gl,w,h,internalFormat,format,type,param);
    // copy old into new via blit (skip for simplicity — just return new)
    return newFBO;
  }

  /* ─── Main ─── */
  function initSplashCursor(userCfg) {
    Object.assign(CFG, userCfg || {});

    const canvas = document.createElement("canvas");
    canvas.id = "splashCursorCanvas";
    Object.assign(canvas.style, {
      position: "fixed", top: "0", left: "0",
      width: "100%", height: "100%",
      zIndex: "0", pointerEvents: "none",
      opacity: "0.55",
    });
    document.body.appendChild(canvas);

    const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
    let gl = canvas.getContext("webgl2", params);
    const isWebGL2 = !!gl;
    if (!isWebGL2) gl = canvas.getContext("webgl", params) || canvas.getContext("experimental-webgl", params);
    if (!gl) { console.warn("WebGL not supported — SplashCursor disabled."); return; }

    let ext = {};
    if (isWebGL2) {
      gl.getExtension("EXT_color_buffer_float");
      ext.supportLinearFiltering = !!gl.getExtension("OES_texture_float_linear");
      ext.halfFloatTexType = gl.HALF_FLOAT;
      ext.formatRGBA = { internalFormat: gl.RGBA16F, format: gl.RGBA };
      ext.formatRG   = { internalFormat: gl.RG16F,   format: gl.RG   };
      ext.formatR    = { internalFormat: gl.R16F,     format: gl.RED  };
    } else {
      const hf = gl.getExtension("OES_texture_half_float");
      ext.supportLinearFiltering = !!gl.getExtension("OES_texture_half_float_linear");
      ext.halfFloatTexType = hf ? hf.HALF_FLOAT_OES : gl.UNSIGNED_BYTE;
      ext.formatRGBA = { internalFormat: gl.RGBA, format: gl.RGBA };
      ext.formatRG   = { internalFormat: gl.RGBA, format: gl.RGBA };
      ext.formatR    = { internalFormat: gl.RGBA, format: gl.RGBA };
    }

    const texType  = ext.halfFloatTexType;
    const rgba     = ext.formatRGBA;
    const rg       = ext.formatRG;
    const r        = ext.formatR;
    const texFilter = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    /* Programs */
    const copyProg       = new Program(gl, baseVertexShader, copyShader);
    const clearProg      = new Program(gl, baseVertexShader, clearShader);
    const splatProg      = new Program(gl, baseVertexShader, splatShader);
    const advectionProg  = new Program(gl, baseVertexShader, advectionShader);
    const divergenceProg = new Program(gl, baseVertexShader, divergenceShader);
    const curlProg       = new Program(gl, baseVertexShader, curlShader);
    const vorticityProg  = new Program(gl, baseVertexShader, vorticityShader);
    const pressureProg   = new Program(gl, baseVertexShader, pressureShader);
    const gradSubProg    = new Program(gl, baseVertexShader, gradientSubtractShader);
    const displayMat     = new Material(gl, baseVertexShader, displayShaderSource);

    /* Geometry */
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,  -1,1,  1,1,  1,-1]), gl.STATIC_DRAW);
    const ibuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0,1,2,0,2,3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(0);

    /* FBOs */
    const SIM_RES = 128, DYE_RES = 1024;
    const simSize = getResolution(gl, SIM_RES);
    const dyeSize = getResolution(gl, DYE_RES);

    let velocity   = createDoubleFBO(gl, simSize.width, simSize.height, rg.internalFormat, rg.format, texType, texFilter);
    let dye        = createDoubleFBO(gl, dyeSize.width, dyeSize.height, rgba.internalFormat, rgba.format, texType, texFilter);
    let divergence = createFBO(gl, simSize.width, simSize.height, r.internalFormat, r.format, texType, gl.NEAREST);
    let curl       = createFBO(gl, simSize.width, simSize.height, r.internalFormat, r.format, texType, gl.NEAREST);
    let pressure   = createDoubleFBO(gl, simSize.width, simSize.height, r.internalFormat, r.format, texType, gl.NEAREST);

    /* Helpers */
    function blit(target) {
      if (target) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        gl.viewport(0, 0, target.width, target.height);
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    function splat(x, y, dx, dy, color) {
      splatProg.bind();
      gl.uniform1i(splatProg.uniforms.uTarget, velocity.read.attach(0));
      gl.uniform1f(splatProg.uniforms.aspectRatio, canvas.width / canvas.height);
      gl.uniform2f(splatProg.uniforms.point, x / canvas.width, 1 - y / canvas.height);
      gl.uniform3f(splatProg.uniforms.color, dx, -dy, 0);
      gl.uniform1f(splatProg.uniforms.radius, CFG.SPLAT_RADIUS / 100);
      blit(velocity.write);
      velocity.swap();

      gl.uniform1i(splatProg.uniforms.uTarget, dye.read.attach(0));
      gl.uniform3f(splatProg.uniforms.color, color.r, color.g, color.b);
      blit(dye.write);
      dye.swap();
    }

    let lastTime = Date.now();
    let colorTimer = 0;
    let curColor = generateColor();

    function step(dt) {
      gl.disable(gl.BLEND);
      /* curl */
      curlProg.bind();
      gl.uniform2f(curlProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(curlProg.uniforms.uVelocity, velocity.read.attach(0));
      blit(curl);
      /* vorticity */
      vorticityProg.bind();
      gl.uniform2f(vorticityProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(vorticityProg.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(vorticityProg.uniforms.uCurl, curl.attach(1));
      gl.uniform1f(vorticityProg.uniforms.curl, CFG.CURL);
      gl.uniform1f(vorticityProg.uniforms.dt, dt);
      blit(velocity.write);
      velocity.swap();
      /* divergence */
      divergenceProg.bind();
      gl.uniform2f(divergenceProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(divergenceProg.uniforms.uVelocity, velocity.read.attach(0));
      blit(divergence);
      /* pressure clear */
      clearProg.bind();
      gl.uniform1i(clearProg.uniforms.uTexture, pressure.read.attach(0));
      gl.uniform1f(clearProg.uniforms.value, CFG.PRESSURE);
      blit(pressure.write);
      pressure.swap();
      /* pressure solve */
      pressureProg.bind();
      gl.uniform2f(pressureProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(pressureProg.uniforms.uDivergence, divergence.attach(0));
      for (let i = 0; i < CFG.PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(pressureProg.uniforms.uPressure, pressure.read.attach(1));
        blit(pressure.write);
        pressure.swap();
      }
      /* gradient subtract */
      gradSubProg.bind();
      gl.uniform2f(gradSubProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(gradSubProg.uniforms.uPressure, pressure.read.attach(0));
      gl.uniform1i(gradSubProg.uniforms.uVelocity, velocity.read.attach(1));
      blit(velocity.write);
      velocity.swap();
      /* advect velocity */
      advectionProg.bind();
      gl.uniform2f(advectionProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform2f(advectionProg.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(advectionProg.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(advectionProg.uniforms.uSource,   velocity.read.attach(0));
      gl.uniform1f(advectionProg.uniforms.dt, dt);
      gl.uniform1f(advectionProg.uniforms.dissipation, CFG.VELOCITY_DISSIPATION);
      blit(velocity.write);
      velocity.swap();
      /* advect dye */
      gl.uniform2f(advectionProg.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
      gl.uniform1i(advectionProg.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(advectionProg.uniforms.uSource,   dye.read.attach(1));
      gl.uniform1f(advectionProg.uniforms.dissipation, CFG.DENSITY_DISSIPATION);
      blit(dye.write);
      dye.swap();
    }

    function render() {
      displayMat.setKeywords(CFG.SHADING ? ["SHADING"] : []);
      displayMat.bind();
      gl.uniform1i(displayMat.uniforms.uTexture, dye.read.attach(0));
      if (CFG.SHADING) {
        gl.uniform2f(displayMat.uniforms.texelSize, 1/canvas.width, 1/canvas.height);
      }
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      blit(null);
    }

    function resizeCanvas() {
      const w = scaleByPixelRatio(window.innerWidth);
      const h = scaleByPixelRatio(window.innerHeight);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    let raf;
    function loop() {
      resizeCanvas();
      const now = Date.now();
      const dt  = Math.min((now - lastTime) / 1000, 0.016667);
      lastTime  = now;
      colorTimer += dt * CFG.COLOR_UPDATE_SPEED;
      if (colorTimer >= 1) { colorTimer = 0; curColor = generateColor(); }
      step(dt);
      render();
      raf = requestAnimationFrame(loop);
    }

    /* Pointer tracking */
    let pointers = [];
    function Pointer() {
      this.id = -1;
      this.x = 0; this.y = 0;
      this.dx = 0; this.dy = 0;
      this.moved = false;
      this.color = generateColor();
    }
    pointers.push(new Pointer());

    function updatePointer(p, x, y) {
      p.dx = (x - p.x) * 2.5;
      p.dy = (y - p.y) * 2.5;
      p.x = x; p.y = y;
      p.moved = Math.abs(p.dx) > 0 || Math.abs(p.dy) > 0;
    }

    window.addEventListener("mousemove", e => {
      let p = pointers[0];
      updatePointer(p, e.clientX, e.clientY);
      if (p.moved) splat(p.x, p.y, p.dx * CFG.SPLAT_FORCE * 0.001, p.dy * CFG.SPLAT_FORCE * 0.001, curColor);
    });
    window.addEventListener("touchmove", e => {
      e.preventDefault();
      for (let t of e.changedTouches) {
        let p = pointers.find(p => p.id === t.identifier);
        if (!p) { p = new Pointer(); p.id = t.identifier; pointers.push(p); }
        updatePointer(p, t.clientX, t.clientY);
        if (p.moved) splat(p.x, p.y, p.dx * CFG.SPLAT_FORCE * 0.001, p.dy * CFG.SPLAT_FORCE * 0.001, p.color);
      }
    }, { passive: false });
    window.addEventListener("touchend", e => {
      for (let t of e.changedTouches) {
        pointers = pointers.filter(p => p.id !== t.identifier);
      }
      if (!pointers.length) pointers.push(new Pointer());
    });

    resizeCanvas();
    loop();
  }

  /* Expose */
  window.initSplashCursor = initSplashCursor;
})();
