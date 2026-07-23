/* =====================================================
   KLOZET KAARAN — GSAP-style Animation Helpers
   Note: Uses vanilla JS IntersectionObserver to
   replicate GSAP ScrollTrigger behaviour without
   requiring the GSAP library — keeping the site
   lightweight and CDN-independent for Cloudflare Pages.
   If you want real GSAP, swap in:
     <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
     <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
   and replace this file's contents with GSAP calls.
   ===================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ─── Staggered reveal for grid children ─── */
  /* Elements with class "stagger-parent" will have their
     direct children revealed one by one. Exposed as a function so
     grids that render asynchronously (e.g. Collections page, built
     by assets/js/collections-render.js once live product data has
     loaded) can trigger the same reveal after their content exists —
     previously this only ran once at DOMContentLoaded, before that
     grid had any children yet, so the animation silently never fired
     there. */
  function applyStagger(parent) {
    if (!parent) return;
    const children = parent.children;

    Array.from(children).forEach(function (child, i) {
      child.style.opacity   = '0';
      child.style.transform = 'translateY(30px)';
      child.style.transition = `opacity 0.6s ease ${i * 0.12}s, transform 0.6s ease ${i * 0.12}s`;
    });

    const staggerObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          Array.from(children).forEach(function (child) {
            child.style.opacity   = '1';
            child.style.transform = 'translateY(0)';
          });
          staggerObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });

    staggerObserver.observe(parent);
  }
  window.KK_applyStagger = applyStagger;

  document.querySelectorAll('.stagger-parent').forEach(applyStagger);

  /* ─── Counter animation ─── */
  /* Any element with class "count-up" and data-target="N"
     will count from 0 to N when scrolled into view. */
  const counters = document.querySelectorAll('.count-up');

  const countObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        const el     = entry.target;
        const target = parseInt(el.getAttribute('data-target'), 10);
        const suffix = el.getAttribute('data-suffix') || '';
        let   count  = 0;
        const step   = Math.ceil(target / 60); // ~60 frames

        const tick = setInterval(function () {
          count = Math.min(count + step, target);
          el.textContent = count + suffix;
          if (count >= target) clearInterval(tick);
        }, 16); // ~60fps

        countObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(function (el) { countObserver.observe(el); });

  /* ─── Horizontal scroll indicator ─── */
  /* Adds a thin orange progress bar at the top of the page
     that fills as the user scrolls down. */
  const progressBar = document.getElementById('scrollProgress');

  if (progressBar) {
    window.addEventListener('scroll', function () {
      const scrollTop    = document.documentElement.scrollTop;
      const docHeight    = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = scrollPercent + '%';
    });
  }

  /* ─── Cursor dot (desktop only) ─── */
  /* A small orange dot that follows the cursor — subtle and on-brand. */
  const cursorDot = document.getElementById('cursorDot');

  if (cursorDot && window.matchMedia('(pointer: fine)').matches) {
    document.addEventListener('mousemove', function (e) {
      cursorDot.style.left = e.clientX + 'px';
      cursorDot.style.top  = e.clientY + 'px';
    });

    // Grow on hovering interactive elements
    const hoverTargets = 'a, button, .product-card, .collection-card, .blog-card';
    document.querySelectorAll(hoverTargets).forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        cursorDot.style.transform = 'translate(-50%,-50%) scale(3)';
        cursorDot.style.opacity   = '0.5';
      });
      el.addEventListener('mouseleave', function () {
        cursorDot.style.transform = 'translate(-50%,-50%) scale(1)';
        cursorDot.style.opacity   = '1';
      });
    });
  }

}); // end DOMContentLoaded