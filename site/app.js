'use strict';
(() => {
  const menu = document.querySelector('.menu-toggle');
  const nav = document.getElementById('navigation');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const closeMenu = () => {
    if (!menu || !nav) return;
    nav.classList.remove('is-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Открыть меню');
  };
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    nav.classList.toggle('is-open', open);
  });
  nav?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('click', event => { if (!event.target.closest('.header')) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
  });
  if ('IntersectionObserver' in window && !motion.matches) {
    const reveal = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        reveal.unobserve(entry.target);
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    document.querySelectorAll('.section-heading, .editorial-heading, .price-intro, .service-card, .price-row, .look, .about-photo, .about-copy, .salon-booking, .faq details, .contact-copy, .yandex-map').forEach((element, index) => {
      element.classList.add('reveal-pending');
      element.style.setProperty('--reveal-delay', `${index % 3 * 55}ms`);
      reveal.observe(element);
    });
    motion.addEventListener('change', event => {
      if (event.matches) { reveal.disconnect(); document.querySelectorAll('.reveal-pending').forEach(element => element.classList.add('in-view')); }
    }, { once: true });
  }
  const craft = document.getElementById('craft');
  const loadScene = async () => {
    if (motion.matches || innerWidth <= 600 || navigator.connection?.saveData || (navigator.deviceMemory && navigator.deviceMemory < 4)) return;
    try {
      const { createScene } = await import('./assets/scissors.js');
      if (!motion.matches) await createScene(document.getElementById('scissors-scene'), document.getElementById('motion-toggle'), motion);
    } catch { /* The static vector is the fallback. */ }
  };
  if (craft && 'IntersectionObserver' in window) {
    const sceneObserver = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      sceneObserver.disconnect();
      if ('requestIdleCallback' in window) requestIdleCallback(loadScene, { timeout: 3000 });
      else setTimeout(loadScene, 1500);
    });
    sceneObserver.observe(craft);
  }
})();
