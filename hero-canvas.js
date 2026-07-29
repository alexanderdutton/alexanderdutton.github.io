/**
 * Hero Canvas — subtle particle constellation for Alexander's profile.
 * Drifting nodes connected by proximity lines, responsive to scroll velocity.
 * Colors match the existing palette: warm accent on near-black.
 */
(function() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.5;';
  hero.insertBefore(canvas, hero.firstChild);

  const ctx = canvas.getContext('2d');
  let W, H, dpr;
  const nodes = [];
  const NODE_COUNT = 60;
  const MAX_DIST = 140;

  // Palette from CSS vars
  const accentR = 201, accentG = 150, accentB = 120;
  const foxR = 224, foxG = 122, foxB = 58;

  let scrollVel = 0;
  let lastScrollY = window.pageYOffset || 0;
  let targetScrollVel = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = hero.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);
  }

  function initNodes() {
    nodes.length = 0;
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        size: Math.random() * 1.5 + 0.5,
        twinkle: Math.random() * Math.PI * 2
      });
    }
  }

  function update() {
    // Smooth scroll velocity toward target
    scrollVel += (targetScrollVel - scrollVel) * 0.08;
    targetScrollVel *= 0.9;

    for (const n of nodes) {
      n.x += n.vx + scrollVel * 0.3;
      n.y += n.vy;
      n.twinkle += 0.02;

      // Wrap around edges
      if (n.x < -20) n.x = W + 20;
      if (n.x > W + 20) n.x = -20;
      if (n.y < -20) n.y = H + 20;
      if (n.y > H + 20) n.y = -20;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Draw connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.15;
          // Blend accent and fox colors based on distance
          const blend = dist / MAX_DIST;
          const r = Math.round(accentR * (1 - blend) + foxR * blend);
          const g = Math.round(accentG * (1 - blend) + foxG * blend);
          const b = Math.round(accentB * (1 - blend) + foxB * blend);
          ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    for (const n of nodes) {
      const twinkleAlpha = 0.3 + Math.sin(n.twinkle) * 0.2;
      const radius = Math.max(0.1, n.size);
      ctx.fillStyle = `rgba(${accentR},${accentG},${accentB},${twinkleAlpha})`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Scroll listener — track velocity for particle drift
  let scrollTicking = false;
  window.addEventListener('scroll', function() {
    const y = window.pageYOffset || document.documentElement.scrollTop;
    targetScrollVel = (y - lastScrollY) * 0.5;
    lastScrollY = y;
    if (!scrollTicking) {
      requestAnimationFrame(function() { scrollTicking = false; });
      scrollTicking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', function() {
    resize();
    initNodes();
  });

  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  resize();
  initNodes();
  loop();
})();
