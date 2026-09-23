/**
 * NLI Capital — Main JavaScript
 * Vanilla JS, no dependencies.
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ============================================================
     1. Sticky Navbar
     Adds 'scrolled' class to <nav> when page is scrolled
     past 80px. The CSS transitions background from transparent
     to white with a shadow.
     ============================================================ */
  const nav = document.querySelector('.nav');

  function handleNavScroll() {
    if (!nav) return;
    if (window.scrollY > 80) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  // Run once on load in case page is already scrolled (e.g. refresh)
  handleNavScroll();
  window.addEventListener('scroll', handleNavScroll, { passive: true });


  /* ============================================================
     2. Mobile Hamburger Menu
     Toggles 'open' class on <nav> when the hamburger button
     is clicked. Closes automatically when a nav link is clicked.
     ============================================================ */
  const navToggle = document.querySelector('.nav__toggle');

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      nav.classList.toggle('open');

      // Prevent body scroll while mobile menu is open
      document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';

      // Accessibility: update aria-expanded
      const isOpen = nav.classList.contains('open');
      navToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when any nav link is clicked (mobile overlay)
    document.querySelectorAll('.nav__links a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        document.body.style.overflow = '';
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close menu on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        document.body.style.overflow = '';
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }


  /* ============================================================
     3. Smooth Scroll
     Intercepts clicks on anchor links (href="#...") and scrolls
     smoothly to the target element, accounting for nav height.
     ============================================================ */
  const NAV_OFFSET = 80; // pixels — matches --nav-height

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');

      // Ignore bare "#" links
      if (!targetId || targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const targetTop = target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;

      window.scrollTo({
        top: targetTop,
        behavior: 'smooth',
      });
    });
  });


  /* ============================================================
     4. Scroll Animations (IntersectionObserver)
     Elements with the class 'animate-on-scroll' start hidden
     (opacity: 0, translateY: 28px — defined in CSS).
     When they enter the viewport this observer adds 'visible',
     triggering the CSS transition to fade-in and slide-up.
     ============================================================ */
  const animatedElements = document.querySelectorAll('.animate-on-scroll');

  if ('IntersectionObserver' in window && animatedElements.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Unobserve after animation fires — no need to re-trigger
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,       // trigger when 12% of element is visible
        rootMargin: '0px 0px -40px 0px', // slight offset from bottom
      }
    );

    animatedElements.forEach((el) => observer.observe(el));
  } else {
    // Fallback for browsers without IntersectionObserver support:
    // make all animated elements visible immediately
    animatedElements.forEach((el) => el.classList.add('visible'));
  }


  /* ============================================================
     5. Active Nav Link
     Compares each nav link's href with the current page's
     pathname to highlight the active page link.
     ============================================================ */
  const currentPath = window.location.pathname;

  const allNavLinks = document.querySelectorAll('.nav__link');

  allNavLinks.forEach((link) => {
    const linkPath = link.getAttribute('href');
    if (!linkPath) return;

    // Normalize: strip trailing slashes for comparison
    const normalize = (p) => p.replace(/\/$/, '') || '/';

    // Match exact path, or treat index.html as root
    const normalizedCurrent = normalize(currentPath);
    const normalizedLink    = normalize(linkPath.split('?')[0]); // ignore query strings

    // Also mark parent nav item active when on a subpage
    // e.g. /portfolio/quinnect.html → portfolio.html is active
    const linkBaseName = normalizedLink.split('/').pop().replace('.html', '');

    const isActive =
      normalizedLink === normalizedCurrent ||
      (normalizedLink.endsWith('index.html') && normalizedCurrent === '/') ||
      (linkBaseName && normalizedCurrent.includes('/' + linkBaseName + '/'));

    if (isActive) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });


  /* ============================================================
     6. Scroll-to-Top Button (bonus)
     Shows a floating button after scrolling 400px; clicking it
     scrolls back to the top.
     ============================================================ */
  const scrollTopBtn = document.querySelector('.scroll-top');

  if (scrollTopBtn) {
    window.addEventListener(
      'scroll',
      () => {
        if (window.scrollY > 400) {
          scrollTopBtn.classList.add('visible');
        } else {
          scrollTopBtn.classList.remove('visible');
        }
      },
      { passive: true }
    );

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }


  /* ============================================================
     7. Team Card Expand / Collapse
     Toggles .expanded on .team-card when the toggle button is
     clicked, revealing the quote and bio via CSS max-height.
     ============================================================ */
  document.querySelectorAll('.team-card__toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.team-card');
      const expanded = card.classList.toggle('expanded');
      btn.textContent = expanded ? 'Toon minder \u2191' : 'Lees meer \u2192';
      btn.setAttribute('aria-expanded', expanded);
    });
  });


  /* ============================================================
     8. Contact Form — Formspree AJAX submission
     Intercepts the form submit, POSTs via fetch, and shows an
     inline success message so the user never leaves the site.
     ============================================================ */
  const contactForm = document.querySelector('.contact-form');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = contactForm.querySelector('[type="submit"]');
      const originalLabel = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verzenden…';

      try {
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: new FormData(contactForm),
          headers: { Accept: 'application/json' },
        });

        if (response.ok) {
          contactForm.innerHTML = `
            <div class="form-success">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
              <h3>Bericht verzonden!</h3>
              <p>Bedankt voor uw bericht. Wij nemen doorgaans binnen één werkdag contact met u op.</p>
            </div>`;
        } else {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
          alert('Er is iets misgegaan. Probeer het opnieuw of stuur een e-mail naar nli-capital@nlinvesteert.nl.');
        }
      } catch {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
        alert('Er is iets misgegaan. Controleer uw internetverbinding en probeer het opnieuw.');
      }
    });
  }


  /* ============================================================
     8. News Category Filter
     Filters .news-card elements by their data-category attribute
     when filter buttons on the nieuws page are clicked.
     ============================================================ */
  const filterBtns = document.querySelectorAll('.news-filter__btn');

  if (filterBtns.length) {
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        document.querySelectorAll('.news-card').forEach((card) => {
          const show = filter === 'all' || card.dataset.category === filter;
          card.toggleAttribute('hidden', !show);
        });
      });
    });
  }


  /* ============================================================
     9. Portfolio Carousel
     Shows 2 slides at a time on desktop, 1 on mobile.
     Auto-advances every 4 s; pauses on hover/focus.
     ============================================================ */
  const carousel = document.getElementById('portfolioCarousel');

  if (carousel) {
    const viewport = carousel.querySelector('.carousel__viewport');
    const track    = document.getElementById('carouselTrack');
    const slides   = Array.from(track.querySelectorAll('.carousel__slide'));
    const dotsEl   = document.getElementById('carouselDots');
    const prevBtn  = document.getElementById('carouselPrev');
    const nextBtn  = document.getElementById('carouselNext');

    let current    = 0;
    let autoTimer  = null;

    function perView() {
      return window.innerWidth <= 640 ? 1 : 2;
    }

    function maxIdx() {
      return Math.max(0, slides.length - perView());
    }

    // Build / rebuild dot buttons
    function buildDots() {
      dotsEl.innerHTML = '';
      for (let i = 0; i <= maxIdx(); i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel__dot' + (i === current ? ' active' : '');
        dot.setAttribute('aria-label', 'Ga naar slide ' + (i + 1));
        dot.addEventListener('click', () => { goTo(i); startAuto(); });
        dotsEl.appendChild(dot);
      }
    }

    function updateUI() {
      // Update dots
      dotsEl.querySelectorAll('.carousel__dot').forEach((d, i) => {
        d.classList.toggle('active', i === current);
      });
      // Update buttons
      prevBtn.disabled = current <= 0;
      nextBtn.disabled = current >= maxIdx();
    }

    function goTo(idx) {
      current = Math.max(0, Math.min(idx, maxIdx()));
      // Measure actual rendered slide width each time (handles resize correctly)
      const slideW = slides[0].getBoundingClientRect().width;
      const gap    = 24; // matches CSS gap: 1.5rem
      track.style.transform = `translateX(-${current * (slideW + gap)}px)`;
      updateUI();
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    function startAuto() {
      stopAuto();
      autoTimer = setInterval(() => {
        goTo(current >= maxIdx() ? 0 : current + 1);
      }, 4000);
    }

    function stopAuto() { clearInterval(autoTimer); }

    prevBtn.addEventListener('click', () => { prev(); startAuto(); });
    nextBtn.addEventListener('click', () => { next(); startAuto(); });

    // Pause on interaction
    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('focusin',    stopAuto);
    carousel.addEventListener('mouseleave', startAuto);
    carousel.addEventListener('focusout',   startAuto);

    // Swipe
    let touchX = 0;
    track.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; stopAuto(); }, { passive: true });
    track.addEventListener('touchend',   (e) => {
      const diff = touchX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
      startAuto();
    }, { passive: true });

    // Rebuild on resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        buildDots();
        goTo(Math.min(current, maxIdx()));
      }, 100);
    }, { passive: true });

    // Init — defer one frame so slides have rendered dimensions
    requestAnimationFrame(() => {
      buildDots();
      goTo(0);
      startAuto();
    });
  }


  /* ============================================================
     10. MBO Check — Step-by-step qualification tool
     Walks the user through 5 yes/no questions after a role
     selector. Shows a contact form on match, or an explanation
     panel with a contact link on no-match.
     ============================================================ */
  const mboCheckEl = document.querySelector('.mbo-check');

  if (mboCheckEl) {
    let mboRole = null;
    const mboAnswers = {};

    const mboProgress   = document.getElementById('mboProgress');
    const mboDots       = mboProgress ? mboProgress.querySelectorAll('.mbo-check__dot') : [];
    const mboResultMatch   = document.getElementById('mboResultMatch');
    const mboResultNoMatch = document.getElementById('mboResultNoMatch');

    function mboShowStep(stepIndex) {
      mboCheckEl.querySelectorAll('.mbo-check__step').forEach(s => s.classList.remove('is-active'));
      if (mboResultMatch)   mboResultMatch.classList.remove('is-active');
      if (mboResultNoMatch) mboResultNoMatch.classList.remove('is-active');

      if (mboProgress) {
        mboProgress.style.display = stepIndex >= 1 ? 'flex' : 'none';
      }

      mboDots.forEach((dot, i) => {
        const n = i + 1;
        dot.classList.toggle('is-completed', n < stepIndex);
        dot.classList.toggle('is-active',    n === stepIndex);
      });

      const target = document.getElementById('mboStep' + stepIndex);
      if (target) target.classList.add('is-active');
    }

    function mboShowResult(type) {
      mboCheckEl.querySelectorAll('.mbo-check__step').forEach(s => s.classList.remove('is-active'));
      if (mboProgress) mboProgress.style.display = 'none';
      if (type === 'match') {
        mboResultMatch.classList.add('is-active');
      } else {
        mboResultNoMatch.classList.add('is-active');
      }
    }

    function mboEvaluate() {
      const hasNee = Object.values(mboAnswers).some(a => a === 'nee');
      mboShowResult(hasNee ? 'nomatch' : 'match');
    }

    function mboReset() {
      mboRole = null;
      Object.keys(mboAnswers).forEach(k => delete mboAnswers[k]);
      mboShowStep(0);
    }

    // Role buttons
    mboCheckEl.querySelectorAll('.mbo-check__role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        mboRole = btn.dataset.role;
        mboShowStep(1);
      });
    });

    // Yes/No option buttons
    mboCheckEl.querySelectorAll('.mbo-check__option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const step   = parseInt(btn.dataset.step, 10);
        const answer = btn.dataset.answer;
        mboAnswers[step] = answer;
        if (step < 5) {
          mboShowStep(step + 1);
        } else {
          mboEvaluate();
        }
      });
    });

    // Back buttons
    mboCheckEl.querySelectorAll('.mbo-check__back').forEach(btn => {
      btn.addEventListener('click', () => {
        mboShowStep(parseInt(btn.dataset.target, 10));
      });
    });

    // Restart buttons
    document.getElementById('mboRestartMatch')?.addEventListener('click', mboReset);
    document.getElementById('mboRestartNoMatch')?.addEventListener('click', mboReset);

    // MBO contact form submission
    const mboForm = document.getElementById('mboContactForm');
    if (mboForm) {
      mboForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = mboForm.querySelector('[type="submit"]');
        const originalLabel = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verzenden…';

        try {
          const response = await fetch(mboForm.action, {
            method: 'POST',
            body: new FormData(mboForm),
            headers: { Accept: 'application/json' },
          });

          if (response.ok) {
            mboForm.innerHTML = `
              <div class="form-success">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
                <h3>Gegevens ontvangen!</h3>
                <p>Bedankt. Wij nemen binnen één werkdag contact met u op om uw situatie te bespreken.</p>
              </div>`;
          } else {
            submitBtn.disabled = false;
            submitBtn.textContent = originalLabel;
            alert('Er is iets misgegaan. Probeer het opnieuw of stuur een e-mail naar nli-capital@nlinvesteert.nl.');
          }
        } catch {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
          alert('Er is iets misgegaan. Controleer uw internetverbinding en probeer het opnieuw.');
        }
      });
    }

    // Init
    mboShowStep(0);
  }

});


/* ============================================================
   11. Cookie Consent Banner
   Analytics starts out denied: every page declares
   gtag('consent','default', ... 'denied') inline in its <head>,
   and restores an earlier choice there as well, so that
   restoring does not have to wait for this deferred script.
   This module only handles the case where no valid choice is
   stored yet: it shows the banner and flips consent to granted
   when the visitor accepts. A stored choice expires after
   twelve months, after which the banner returns.
   Deliberately outside the DOMContentLoaded handler above so
   it stays independent of the rest of the page logic.
   ============================================================ */

(function () {

  var STORAGE_KEY = 'nlic-cookieconsent';
  var MAX_AGE = 31536000000; // twelve months in milliseconds

  // Reading and writing localStorage throws in strict privacy
  // modes, so every access is guarded. On failure we fall back
  // to "no choice made", which shows the banner again rather
  // than silently assuming consent.
  function readChoice() {
    try {
      var choice = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (choice && typeof choice.analytics === 'boolean' &&
          Date.now() - choice.ts < MAX_AGE) {
        return choice;
      }
    } catch (e) {}
    return null;
  }

  function saveChoice(analytics) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        analytics: analytics,
        ts: Date.now()
      }));
    } catch (e) {}
  }

  // The banner is injected by script, but the site uses relative
  // paths across three directory depths. The footer link to the
  // privacy statement already carries the right prefix on every
  // page that has a footer, so we borrow it. The design guide has
  // no site footer, hence the absolute fallback.
  function privacyHref() {
    var link = document.querySelector('.footer__links a[href$="privacy.html"]');
    return link ? link.getAttribute('href') : '/privacy.html';
  }

  // Removing consent stops new cookies but never clears existing ones,
  // so we expire them by hand across every domain scope GA may have used.
  function clearAnalyticsCookies() {
    var host = window.location.hostname;
    var apex = host.split('.').slice(-2).join('.');
    var gone = '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';

    document.cookie.split(';').forEach(function (pair) {
      var name = pair.split('=')[0].trim();
      if (name.indexOf('_ga') !== 0 && name.indexOf('_gid') !== 0) return;
      document.cookie = name + gone;
      document.cookie = name + gone + '; domain=' + host;
      document.cookie = name + gone + '; domain=.' + apex;
    });
  }

  function removeBanner() {
    var existing = document.querySelector('.cookie-banner');
    if (existing) existing.remove();
  }

  function showBanner() {
    if (document.querySelector('.cookie-banner')) return;

    var banner = document.createElement('section');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookiemelding');
    banner.innerHTML =
      '<div class="container cookie-banner__inner">' +
        '<div class="cookie-banner__text">' +
          '<strong class="cookie-banner__title">Cookies op deze website</strong>' +
          '<p>Wij gebruiken Google Analytics om te meten hoe onze website wordt gebruikt. ' +
          'Daarvoor worden cookies geplaatst. Zonder uw toestemming gebeurt dat niet. ' +
          'Meer hierover leest u in onze <a href="' + privacyHref() + '">privacyverklaring</a>.</p>' +
        '</div>' +
        '<div class="cookie-banner__actions">' +
          '<button type="button" class="btn btn-white" data-consent="accept">Accepteren</button>' +
          '<button type="button" class="btn btn-outline-light" data-consent="decline">Alleen noodzakelijk</button>' +
        '</div>' +
      '</div>';

    banner.addEventListener('click', function (e) {
      var button = e.target.closest('[data-consent]');
      if (!button) return;

      var accepted = button.getAttribute('data-consent') === 'accept';
      saveChoice(accepted);

      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          analytics_storage: accepted ? 'granted' : 'denied'
        });
      }

      if (accepted) {
        // The pageview for the current page fired while consent was
        // still denied, so send it again now that it may be counted.
        if (typeof window.gtag === 'function') window.gtag('event', 'page_view');
      } else {
        // Withdrawing only stops new cookies; the ones already set stay
        // for two years unless we delete them ourselves.
        clearAnalyticsCookies();
      }

      removeBanner();
    });

    document.body.appendChild(banner);
  }

  function init() {
    if (!readChoice()) showBanner();

    // Lets visitors revisit their choice from the privacy statement.
    var settingsButton = document.getElementById('cookieSettings');
    if (settingsButton) {
      settingsButton.addEventListener('click', function () {
        removeBanner();
        showBanner();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
