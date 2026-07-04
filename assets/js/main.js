/* =====================================================
   KLOZET KAARAN — Main JavaScript
   Beginner-friendly: every section is clearly labelled.
   ===================================================== */

/* ─── Run everything after the page has loaded ─── */
document.addEventListener('DOMContentLoaded', function () {

  /* ================================================
     1. NAVIGATION — Adds a dark background when
        the user scrolls down the page.
  ================================================ */
  const nav = document.getElementById('main-nav');

  if (nav) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 60) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });
  }

  /* ================================================
     2. ACTIVE NAV LINK — Highlights the current
        page link in the navigation bar.
  ================================================ */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('#navbarNav .nav-link').forEach(function (link) {
    const href = link.getAttribute('href');
    if (href && href === currentPage) {
      link.classList.add('active');
      link.style.color = '#fff';
    }
  });

  /* ================================================
     3. REVEAL ON SCROLL — Animates sections into
        view as the user scrolls down the page.
  ================================================ */
  const revealElements = document.querySelectorAll('.reveal');

  if (revealElements.length > 0) {
    // IntersectionObserver triggers when 10% of element is visible
    const revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Stop observing once revealed (no need to re-animate)
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    revealElements.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ================================================
     4. PRODUCT SLIDER — Controls the left / right
        arrow buttons for the Best Sellers carousel.
  ================================================ */
  const slider      = document.getElementById('productSlider');
  const btnPrev     = document.getElementById('sliderPrev');
  const btnNext     = document.getElementById('sliderNext');

  if (slider && btnPrev && btnNext) {
    // Move slider left (previous)
    btnPrev.addEventListener('click', function () {
      slider.scrollBy({ left: -460, behavior: 'smooth' });
    });
    // Move slider right (next)
    btnNext.addEventListener('click', function () {
      slider.scrollBy({ left: 460, behavior: 'smooth' });
    });
  }

  /* ================================================
     5. CONTACT FORM — Handles the contact form
        submission with basic front-end validation.
  ================================================ */
  const contactForm = document.getElementById('contactForm');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault(); // Stop the page from reloading

      const name    = document.getElementById('contactName');
      const email   = document.getElementById('contactEmail');
      const message = document.getElementById('contactMessage');
      const btn     = document.getElementById('contactSubmitBtn');

      // Simple validation — check fields aren't empty
      if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
        showFormFeedback('Please fill in all fields.', 'error');
        return;
      }

      // Basic email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.value)) {
        showFormFeedback('Please enter a valid email address.', 'error');
        return;
      }

      // Show a loading state on the button
      btn.textContent = 'SENDING...';
      btn.disabled    = true;

      // Simulate sending (replace with your real form handler)
      setTimeout(function () {
        showFormFeedback('Message sent! We\'ll get back to you soon.', 'success');
        contactForm.reset();
        btn.textContent = 'SEND MESSAGE';
        btn.disabled    = false;
      }, 1500);
    });
  }

  /* Helper: shows a feedback message below the form */
  function showFormFeedback(message, type) {
    let feedback = document.getElementById('formFeedback');
    if (!feedback) {
      feedback = document.createElement('p');
      feedback.id = 'formFeedback';
      feedback.style.cssText = 'font-size:12px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; margin-top:1rem;';
      contactForm.appendChild(feedback);
    }
    feedback.textContent = message;
    feedback.style.color = type === 'success' ? '#f58220' : '#ff6b6b';
  }

  /* ================================================
     6. NEWSLETTER FORM — Handles the email
        subscription in the footer.
  ================================================ */
  const newsletterForms = document.querySelectorAll('.newsletter-form');

  newsletterForms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const btn   = form.querySelector('button');
      if (!input || !input.value.trim()) return;

      const original = btn.textContent;
      btn.textContent = '✓';
      btn.style.background = '#22c55e'; // green tick

      setTimeout(function () {
        btn.textContent    = original;
        btn.style.background = '';
        input.value        = '';
      }, 2500);
    });
  });

  /* ================================================
     7. COLLECTIONS — Filter chip toggle behaviour.
        Clicking a chip highlights it as "active".
  ================================================ */
  document.querySelectorAll('.filter-chip-btn').forEach(function (chip) {
    chip.addEventListener('click', function () {
      // Get siblings in same container and remove active from all
      const siblings = this.parentElement.querySelectorAll('.filter-chip-btn');
      siblings.forEach(function (s) { s.classList.remove('active'); });
      // Set clicked chip as active
      this.classList.add('active');
    });
  });

  /* ================================================
     8. SIZE SELECTOR — Highlights the chosen size
        on the product details / services page.
  ================================================ */
  document.querySelectorAll('.size-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const siblings = this.parentElement.querySelectorAll('.size-btn');
      siblings.forEach(function (s) { s.classList.remove('active'); });
      this.classList.add('active');
    });
  });

  /* ================================================
     9. COLOR SELECTOR — Same logic for colour swatches.
  ================================================ */
  document.querySelectorAll('.color-swatch').forEach(function (swatch) {
    swatch.addEventListener('click', function () {
      const siblings = this.parentElement.querySelectorAll('.color-swatch');
      siblings.forEach(function (s) {
        s.style.outline = 'none';
        s.style.outlineOffset = '0';
      });
      this.style.outline      = '2px solid #f58220';
      this.style.outlineOffset = '3px';
    });
  });

  /* ================================================
     10. FORM LABEL FLOAT — Highlights label
         when its input is focused.
  ================================================ */
  document.querySelectorAll('.form-input').forEach(function (input) {
    input.addEventListener('focus', function () {
      const label = this.parentElement.querySelector('.form-field-label');
      if (label) label.style.color = '#f58220';
    });
    input.addEventListener('blur', function () {
      const label = this.parentElement.querySelector('.form-field-label');
      if (label) label.style.color = '';
    });
  });

  /* ================================================
     11. MAP PARALLAX — Subtle mouse-parallax on
         the map image in the contact page.
  ================================================ */
  const mapWrap = document.querySelector('.map-parallax-wrap');
  if (mapWrap) {
    const mapImg = mapWrap.querySelector('img');
    mapWrap.addEventListener('mousemove', function (e) {
      const rect = mapWrap.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      if (mapImg) {
        mapImg.style.transform = `scale(1.12) translate(${x * 15}px, ${y * 15}px)`;
      }
    });
    mapWrap.addEventListener('mouseleave', function () {
      if (mapImg) mapImg.style.transform = '';
    });
  }

  /* ================================================
     12. MOBILE MENU — Close nav collapse when a
         link is clicked (Bootstrap already handles
         the toggle, this improves UX on mobile).
  ================================================ */
  const navLinks = document.querySelectorAll('#navbarCollapse .nav-link');
  const bsNavbar = document.getElementById('navbarCollapse');

  if (bsNavbar) {
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        // Collapse the Bootstrap navbar via its API
        const bsCollapse = bootstrap.Collapse.getInstance(bsNavbar);
        if (bsCollapse) bsCollapse.hide();
      });
    });
  }

}); // end DOMContentLoaded