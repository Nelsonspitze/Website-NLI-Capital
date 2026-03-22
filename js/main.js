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

    const isActive =
      normalizedLink === normalizedCurrent ||
      (normalizedLink.endsWith('index.html') && normalizedCurrent === '/');

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
     7. News Category Filter
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

});
