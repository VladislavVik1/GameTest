<script>
(function () {
  function initStars(selector = '#starfield', opts = {}) {
    const cfg = {
      density: opts.density ?? 0.001, x
      speed:   opts.speed   ?? 0.04,  
      sizeMin: 1,
      sizeMax: 2.2,
      color:   'rgba(255,255,255,0.8)',
    };

    const canvas = document.querySelector(selector);
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });

    let stars = [];
    let w = 0, h = 0, t = 0, raf = 0;

    const rnd = (a, b) => a + Math.random() * (b - a);

    function resize() {
      const pr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width  = Math.floor(w * pr);
      canvas.height = Math.floor(h * pr);
      ctx.setTransform(pr, 0, 0, pr, 0, 0);

      // количество звёзд ~ площади
      const target = Math.floor(w * h * cfg.density);
      stars = Array.from({ length: target }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: rnd(cfg.sizeMin, cfg.sizeMax),
        p: Math.random() * Math.PI * 2, // фаза для мигания
      }));
    }

    function draw() {
      t += cfg.speed;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        // лёгкое "мигание"
        const tw = 0.6 + 0.4 * Math.sin(t + s.p);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * tw, 0, Math.PI * 2);
        ctx.fillStyle = cfg.color;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    draw();

    // вернуть disposer на всякий случай
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      ctx.clearRect(0, 0, w, h);
    };
  }

  // экспорт в глобал
  window.initStars = initStars;
})();

</script>