'use strict';
(() => {
  const section = document.getElementById('reviews');
  const stage = document.getElementById('reviews-track');
  if (!section || !stage) return;
  const cards = [...stage.querySelectorAll('.review')];
  if (cards.length < 2) return;
  const counter = document.getElementById('review-current');
  const navigation = section.querySelector('.review-buttons');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, visible = false, pointerMode = false;
  let timer = 0, measuredWidth = 0, measureFrame = 0, startX = null;

  function updateHeight() {
    cards.forEach(card => { card.style.height = ''; });
    const height = Math.ceil(Math.max(...cards.map(card => card.offsetHeight)));
    stage.style.height = `${height}px`;
    measuredWidth = stage.clientWidth;
    cards.forEach(card => { card.style.height = `${height}px`; });
  }
  function show(value, manual = false) {
    const last = index;
    index = (value + cards.length) % cards.length;
    cards.forEach((card, position) => {
      const distance = (position - index + cards.length) % cards.length;
      card.classList.toggle('is-active', distance === 0);
      card.classList.toggle('is-next', distance === 1);
      card.classList.toggle('is-after', distance === 2);
      card.classList.toggle('is-leaving', position === last && position !== index && distance > 2);
      card.setAttribute('aria-hidden', String(distance !== 0));
      card.inert = distance !== 0;
    });
    stage.dataset.active = String(index);
    counter.parentElement.setAttribute('aria-live', manual ? 'polite' : 'off');
    counter.textContent = String(index + 1).padStart(2, '0');
  }
  function schedule() {
    clearTimeout(timer);
    const keyboardFocus = !pointerMode && section.contains(document.activeElement) && document.activeElement.matches(':focus-visible');
    const running = !motion.matches && !keyboardFocus && visible && !document.hidden;
    section.dataset.rotation = running ? 'running' : 'stopped';
    if (running) timer = setTimeout(() => { show(index + 1); schedule(); }, 4500);
  }
  function manual(direction) { show(index + direction, true); schedule(); }

  section.classList.add('reviews-ready');
  show(0);
  const measure = () => {
    if (measureFrame) return;
    measureFrame = requestAnimationFrame(() => { measureFrame = 0; updateHeight(); });
  };
  (document.fonts?.ready || Promise.resolve()).then(measure);
  const resize = new ResizeObserver(entries => {
    const width = entries[0].contentRect.width;
    if (measuredWidth && Math.abs(width - measuredWidth) > 1) measure();
  });
  resize.observe(stage);
  document.getElementById('review-prev').addEventListener('click', () => manual(-1));
  document.getElementById('review-next').addEventListener('click', () => manual(1));
  stage.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault(); manual(event.key === 'ArrowRight' ? 1 : -1);
  });
  stage.addEventListener('pointerdown', event => { startX = event.clientX; }, { passive: true });
  stage.addEventListener('pointerup', event => {
    if (startX !== null && Math.abs(event.clientX - startX) > 45) manual(event.clientX < startX ? 1 : -1);
    startX = null;
  }, { passive: true });
  stage.addEventListener('pointercancel', () => { startX = null; });
  // Pointer hover and touch must not stop automatic playback.
  // Keyboard reading and the system motion preference still take priority.
  section.addEventListener('focusin', schedule);
  section.addEventListener('focusout', () => queueMicrotask(schedule));
  document.addEventListener('pointerdown', () => {
    pointerMode = true;
    if (section.contains(document.activeElement)) schedule();
  }, { passive: true });
  document.addEventListener('keydown', () => {
    pointerMode = false;
    if (section.contains(document.activeElement)) schedule();
  });
  document.addEventListener('visibilitychange', schedule);
  const syncMotion = () => {
    if (navigation) navigation.hidden = !motion.matches;
    schedule();
  };
  motion.addEventListener('change', syncMotion);
  syncMotion();
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting; schedule();
  }, { threshold: 0.15 });
  observer.observe(stage);
  window.addEventListener('pagehide', () => {
    clearTimeout(timer); cancelAnimationFrame(measureFrame); observer.disconnect(); resize.disconnect();
  }, { once: true });
})();
