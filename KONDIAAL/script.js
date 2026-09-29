const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let scrollTicking = false;

function initNavigation() {
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (!navToggle || !navLinks) return;

  const closeMenu = () => {
    navLinks.classList.remove('active');
    navToggle.classList.remove('open');
  };

  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    navLinks.classList.toggle('active');
    navToggle.classList.toggle('open');
  });

  navLinks.addEventListener('click', (e) => {
    if (e.target.closest('a')) closeMenu();
  });

  document.addEventListener('click', (e) => {
    if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) closeMenu();
  });
}

function initScrollAnimations() {
  if (reducedMotion || !('IntersectionObserver' in window)) {
    document.querySelectorAll('.animate-element, .animate-child').forEach(el => {
      el.classList.add('animate-in');
    });
    return;
  }

  const reveal = entry => {
    if (!entry.isIntersecting) return;

    entry.target.classList.add('animate-in');
    entry.target.querySelectorAll('.animate-child').forEach((child, index) => {
      child.style.transitionDelay = `${Math.min(index, 8) * 0.06}s`;
      child.classList.add('animate-in');
    });
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        reveal(entry);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.section-title, .about-content').forEach(el => {
    el.classList.add('animate-element');
    observer.observe(el);
  });

  document.querySelectorAll(
    '.services-grid, .branches-grid, .values-grid, .mv-grid, .contact-grid'
  ).forEach(grid => {
    grid.querySelectorAll(
      '.service-card, .branch-card, .value-card, .mv-card'
    ).forEach(child => {
      child.classList.add('animate-child');
      observer.observe(child);
    });
  });
}

function initBackToTop() {
  if (reducedMotion) return;

  const btn = document.createElement('button');
  btn.id = 'backToTop';
  btn.innerHTML = '&#8593;';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Back to top');
  document.body.appendChild(btn);

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.__kondiaalBackToTop = btn;
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.pageYOffset - 80,
        behavior: reducedMotion ? 'auto' : 'smooth'
      });
    });
  });
}

function initScrollChrome() {
  const navbar = document.querySelector('.navbar');
  const backToTop = window.__kondiaalBackToTop;

  let progressBar = null;
  if (!reducedMotion) {
    progressBar = document.createElement('div');
    progressBar.id = 'scrollProgress';
    document.body.appendChild(progressBar);
  }

  let docHeight = 0;
  const measure = () => {
    docHeight = document.documentElement.scrollHeight - window.innerHeight;
  };
  measure();

  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('load', measure);

  const update = () => {
    const y = window.scrollY;

    if (navbar) navbar.classList.toggle('scrolled', y > 50);

    if (backToTop) backToTop.classList.toggle('visible', y > 400);

    if (progressBar) {
      progressBar.style.width = (docHeight > 0 ? (y / docHeight) * 100 : 0) + '%';
    }

    scrollTicking = false;
  };

  update();

  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(update);
  }, { passive: true });
}

function initFormValidation() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  const inputs = form.querySelectorAll('input, textarea');
  const errorNodes = new WeakMap();

  const showFieldError = (input, message) => {
    let errorEl = errorNodes.get(input);
    if (!errorEl || !errorEl.isConnected) {
      errorEl = document.createElement('span');
      errorEl.className = 'field-error';
      input.insertAdjacentElement('afterend', errorEl);
      errorNodes.set(input, errorEl);
    }
    errorEl.textContent = message;
  };

  const clearFieldError = input => {
    const errorEl = errorNodes.get(input);
    if (errorEl) errorEl.remove();
  };

  const validateField = input => {
    const value = input.value.trim();
    let isValid = true;

    if (input.required && !value) {
      isValid = false;
      showFieldError(input, 'This field is required');
    } else if (input.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      isValid = false;
      showFieldError(input, 'Please enter a valid email address');
    } else if (input.type === 'tel' && value && !/^\+?[0-9\s\-()]{7,}$/.test(value)) {
      isValid = false;
      showFieldError(input, 'Please enter a valid phone number');
    } else {
      clearFieldError(input);
    }

    input.classList.toggle('error', !isValid);
    input.classList.toggle('success', isValid && !!value);

    return isValid;
  };

  inputs.forEach(input => {
    input.addEventListener('blur', () => validateField(input), { passive: true });
    input.addEventListener('input', () => {
      if (input.classList.contains('error')) validateField(input);
    }, { passive: true });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let isValid = true;
    inputs.forEach(input => {
      if (!validateField(input)) isValid = false;
    });

    if (!isValid) {
      showNotification('Please fill in all required fields correctly.', 'error');
      return;
    }

    showNotification('Thank you! Your message has been sent. We will get back to you shortly.', 'success');
    form.reset();
    inputs.forEach(input => {
      input.classList.remove('success', 'error');
      clearFieldError(input);
    });
  });
}

function showNotification(message, type = 'info') {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.setAttribute('role', 'status');
  notification.innerHTML = `
    <span></span>
    <button class="notification-close" type="button" aria-label="Close">&times;</button>
  `;
  notification.querySelector('span').textContent = message;
  document.body.appendChild(notification);

  const dismiss = () => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  };

  notification.querySelector('.notification-close').addEventListener('click', dismiss);
  setTimeout(dismiss, 5000);

  requestAnimationFrame(() => notification.classList.add('show'));
}

function init() {
  initNavigation();
  initScrollAnimations();
  initBackToTop();
  initSmoothScroll();
  initScrollChrome();
  initFormValidation();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
