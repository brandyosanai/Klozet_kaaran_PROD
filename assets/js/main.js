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
     1B. HERO CARD STACK → FAN OUT — The 3 floating
         glass cards (ANIME / MINIMAL / GRAPHIC) start
         overlapped in one stack, then animate out to
         their resting positions once on page load.
         Desktop only (cards are hidden on mobile via
         responsive.css, so this safely does nothing there).
  ================================================ */
  const heroCards = document.querySelectorAll('.hero-float-card');

  if (heroCards.length > 1) {
    const cardsArr = Array.from(heroCards);

    // Respect users who prefer reduced motion — skip straight to final state.
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      // Pull out any floating animation classes FIRST — they'll be
      // re-applied once the fan-out settles. Doing this before we
      // measure positions matters: otherwise the ambient float
      // animation (mid-cycle) would throw off the measurements below.
      cardsArr.forEach(function (card) {
        card.dataset.floatClass = '';
        ['animate-float', 'animate-float-delayed', 'animate-float-slow'].forEach(function (cls) {
          if (card.classList.contains(cls)) {
            card.dataset.floatClass = cls;
            card.classList.remove(cls);
          }
        });
      });

      // Now measure each card's natural resting position.
      const rects = cardsArr.map(function (card) {
        return card.getBoundingClientRect();
      });

      // Stack point = the middle card's center (visually the "top of the deck").
      const stackRect    = rects[Math.floor(rects.length / 2)];
      const stackCenterX = stackRect.left + stackRect.width / 2;
      const stackCenterY = stackRect.top + stackRect.height / 2;

      cardsArr.forEach(function (card, i) {
        const r  = rects[i];
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;

        // Offset needed to move THIS card on top of the stack point.
        const dx = stackCenterX - cx;
        const dy = stackCenterY - cy;

        // Slight rotation variance so the stack reads as a deck of cards.
        const rotation = (i - Math.floor(rects.length / 2)) * 7;

        card.style.setProperty('--stack-x', dx.toFixed(1) + 'px');
        card.style.setProperty('--stack-y', dy.toFixed(1) + 'px');
        card.style.setProperty('--stack-rot', rotation + 'deg');
        card.style.setProperty('--stack-delay', (i * 0.14).toFixed(2) + 's');

        card.classList.add('card-stack-init');
      });

      // Force the stacked state to paint, then trigger the fan-out transition.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          cardsArr.forEach(function (card) {
            card.classList.add('card-stack-fan');
          });
        });
      });

      // Once the fan-out finishes, hand off to the ambient floating animation.
      const longestDelay    = (cardsArr.length - 1) * 0.14;
      const settleTime      = (longestDelay + 1.05) * 1000 + 80; // ms, small buffer
      setTimeout(function () {
        cardsArr.forEach(function (card) {
          card.classList.remove('card-stack-init', 'card-stack-fan');
          if (card.dataset.floatClass) {
            card.classList.add(card.dataset.floatClass);
          }
        });
      }, settleTime);
    }
  }

  /* ================================================
     1C. HERO CARD PRODUCT DECK — Opens the fanned-out
         product deck on hover/focus, with a short grace
         period before closing. Plain CSS :hover would
         drop out the instant the cursor crosses the gap
         between the card and the deck below it, making
         the products impossible to click; this timer
         bridges that gap.
  ================================================ */
  document.querySelectorAll('.hero-float-card').forEach(function (card) {
    let closeTimer = null;

    function openDeck() {
      clearTimeout(closeTimer);
      card.classList.add('deck-open');
    }

    function scheduleClose() {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(function () {
        card.classList.remove('deck-open');
      }, 300); // grace period — enough time to cross the gap to the deck
    }

    card.addEventListener('mouseenter', openDeck);
    card.addEventListener('mouseleave', scheduleClose);

    // Keyboard users: :focus-within in CSS already handles the visual
    // state, but we mirror it here too so animation-play-state / z-index
    // stay in sync if focus moves in via JS-driven navigation.
    card.addEventListener('focusin', openDeck);
    card.addEventListener('focusout', function (e) {
      if (!card.contains(e.relatedTarget)) {
        scheduleClose();
      }
    });
  });

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