/**
 * Warp Streaks — hyperspace-style speed lines flanking the content column.
 * Idle: faint, slow drifting dashes. Scroll: streaks elongate and accelerate.
 */
(function() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let W, H, dpr;

  // Content column is max 780px centered. Streaks live in the gutters.
  const CONTENT_MAX = 780;
  const GUTTER_PAD = 40; // how far from the content edge streaks start

  const STREAK_COUNT = 55;
  const streaks = [];

  // Palette
  const colors = [
    [201, 150, 120], // accent warm
    [201, 150, 120],
    [201, 150, 120],
    [224, 122, 58],  // fox orange
    [224, 122, 58],
    [159, 187, 167], // green sage
    [180, 160, 200], // faint violet
    [140, 180, 210], // cool blue
    [136, 136, 136], // gray
  ];

  let scrollVel = 0;
  let targetVel = 0;
  let lastScrollY = window.pageYOffset || 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function gutterBounds() {
    const contentW = Math.min(CONTENT_MAX, W);
    const leftEnd = (W - contentW) / 2 - GUTTER_PAD;
    const rightStart = (W + contentW) / 2 + GUTTER_PAD;
    const gutterW = Math.max(0, leftEnd);

    return {
      leftStart: Math.max(0, leftEnd - gutterW),
      leftEnd: leftEnd,
      rightStart: rightStart,
      rightEnd: Math.min(W, rightStart + gutterW),
      width: gutterW
    };
  }

  function initStreaks() {
    streaks.length = 0;
    const g = gutterBounds();

    for (let i = 0; i < STREAK_COUNT; i++) {
      const side = i % 2 === 0 ? 'left' : 'right';
      const color = colors[Math.floor(Math.random() * colors.length)];
      streaks.push({
        side: side,
        x: side === 'left'
          ? g.leftStart + Math.random() * Math.max(1, g.width)
          : g.rightStart + Math.random() * Math.max(1, g.width),
        y: Math.random() * H,
        len: Math.random() * 20 + 5,
        speed: Math.random() * 0.3 + 0.1,
        alpha: Math.random() * 0.05 + 0.01,
        color: color,
        flicker: Math.random() * Math.PI * 2
      });
    }
  }

  function update() {
    scrollVel += (targetVel - scrollVel) * 0.06;
    targetVel *= 0.85;

    const speedFactor = 1 + Math.abs(scrollVel) * 3;

    for (const s of streaks) {
      s.y += s.speed * speedFactor * Math.sign(scrollVel || 1);
      s.flicker += 0.03;

      // Wrap
      if (s.y < -50) s.y = H + 50;
      if (s.y > H + 50) s.y = -50;

      // When scrolling fast, streaks elongate
      s.currentLen = s.len + Math.abs(scrollVel) * 90;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    const g = gutterBounds();
    if (g.width < 10) return; // no gutters on narrow screens

    for (const s of streaks) {
      // Skip if outside gutter (after resize etc.)
      if (s.side === 'left' && (s.x < g.leftStart || s.x > g.leftEnd)) continue;
      if (s.side === 'right' && (s.x < g.rightStart || s.x > g.rightEnd)) continue;

      const dir = Math.sign(scrollVel || 1);
      const flickerAlpha = s.alpha * (0.7 + Math.sin(s.flicker) * 0.3);
      const speedRamp = Math.min(1, Math.abs(scrollVel) * 0.15);
      const speedAlpha = Math.min(0.35, flickerAlpha + speedRamp * 0.2);

      const [r, gr, b] = s.color;

      // Gradient streak — fades from head to tail
      const tailY = s.y - s.currentLen * dir;
      const gradient = ctx.createLinearGradient(s.x, s.y, s.x, tailY);
      gradient.addColorStop(0, `rgba(${r},${gr},${b},${speedAlpha})`);
      gradient.addColorStop(1, `rgba(${r},${gr},${b},0)`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x, tailY);
      ctx.stroke();
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  let scrollTicking = false;
  window.addEventListener('scroll', function() {
    const y = window.pageYOffset || document.documentElement.scrollTop;
    targetVel = (y - lastScrollY) * 0.15;
    lastScrollY = y;
    if (!scrollTicking) {
      requestAnimationFrame(function() { scrollTicking = false; });
      scrollTicking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', function() {
    resize();
    initStreaks();
  });

  resize();
  initStreaks();
  loop();
})();
