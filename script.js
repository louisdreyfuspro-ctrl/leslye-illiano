/* Leslye Illiano – interactions : header fixe, apparition au scroll, parallaxe douce */
(function () {
  /* mode calibrage (dev) : ?calib -> hauteurs de la maquette, tout visible */
  if (/[?&]calib/.test(location.search)) document.documentElement.classList.add('calib');
  const header = document.getElementById('header');
  const navLinks = Array.from(document.querySelectorAll('.nav a'));
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const reveals = Array.from(document.querySelectorAll('.reveal, .photo-reveal'));
  const parallax = Array.from(document.querySelectorAll('[data-parallax]'));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- header : fond dès qu'on quitte le haut, et état "sombre" sur la section conviction --- */
  function onScroll() {
    const y = window.scrollY || 0;
    header.classList.toggle('scrolled', y > 40);

    /* lien actif */
    let current = sections[0];
    for (const s of sections) {
      if (s.getBoundingClientRect().top <= window.innerHeight * 0.4) current = s;
    }
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current.id));

    /* parallaxe */
    if (!reduce) {
      const vh = window.innerHeight;
      for (const el of parallax) {
        const box = (el.closest('section') || el).getBoundingClientRect();
        if (box.bottom < 0 || box.top > vh) continue;
        const f = parseFloat(el.dataset.parallax) || 0.1;
        const offset = (box.top + box.height / 2 - vh / 2) * f;
        el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
      }
    }
  }
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(() => { onScroll(); ticking = false; }); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* --- apparition au scroll --- */
  if ('IntersectionObserver' in window && !reduce && !document.documentElement.classList.contains('calib')) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  /* --- défilement doux vers les ancres --- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (ev) => {
      const id = a.getAttribute('href').slice(1);
      const target = id && document.getElementById(id);
      if (!target) return;
      ev.preventDefault();
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + id);
    });
  });
})();
