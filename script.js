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
    /* le formulaire prolonge la section Contact */
    const id = current.id === 'rendez-vous' ? 'contact' : current.id;
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));

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

/* ------------------------------------------------------------------
   Formulaire de prise de rendez-vous
   Le site est statique : à l'envoi, la messagerie du visiteur s'ouvre
   avec un message pré-rempli. Pour recevoir les demandes directement
   par e-mail sans ouvrir de messagerie, remplacer l'appel à
   ouvrirMessagerie() par un envoi vers un service de formulaire
   (Formspree, Netlify Forms, etc.).
   ------------------------------------------------------------------ */
(function () {
  const form = document.querySelector('.rdv-form');
  if (!form) return;

  const DESTINATAIRE = 'contact@leslyeilliano.com';
  const status = form.querySelector('.form-status');
  const bouton = form.querySelector('button[type="submit"]');
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const champ = (el) => el.closest('.field');

  function messageErreur(el) {
    const v = (el.value || '').trim();
    if (el.type === 'checkbox') return el.checked ? '' : 'Merci de cocher cette case pour continuer.';
    if (el.required && !v) return 'Ce champ est nécessaire.';
    if (el.type === 'email' && v && !emailRe.test(v)) return 'Cette adresse e-mail semble incomplète.';
    if (el.id === 'f-message' && v && v.length < 10) return 'Quelques mots de plus nous aideront à préparer l’échange.';
    return '';
  }

  function valider(el, afficher) {
    const bloc = champ(el);
    if (!bloc) return true;
    const err = messageErreur(el);
    const zone = bloc.querySelector('.field-error');
    if (err && afficher) {
      bloc.classList.add('invalid');
      if (zone) zone.textContent = err;
    } else if (!err) {
      bloc.classList.remove('invalid');
      if (zone) zone.textContent = '';
    }
    return !err;
  }

  const controles = Array.from(form.querySelectorAll('input, select, textarea'))
    .filter(el => el.name !== 'societe_web');

  controles.forEach(el => {
    el.addEventListener('blur', () => valider(el, true));
    el.addEventListener('input', () => { if (champ(el).classList.contains('invalid')) valider(el, true); });
    el.addEventListener('change', () => { if (champ(el).classList.contains('invalid')) valider(el, true); });
  });

  function afficherStatut(texte, erreur) {
    if (!status) return;
    status.textContent = texte;
    status.classList.toggle('error', !!erreur);
    status.classList.add('show');
  }

  function ouvrirMessagerie(donnees) {
    const sujet = 'Demande de rendez-vous – ' + donnees.nom;
    const corps = [
      'Nom : ' + donnees.nom,
      'E-mail : ' + donnees.email,
      donnees.telephone ? 'Téléphone : ' + donnees.telephone : null,
      donnees.fonction ? 'Fonction et entreprise : ' + donnees.fonction : null,
      'Sujet : ' + donnees.sujet,
      '',
      donnees.message
    ].filter(Boolean).join('\n');
    window.location.href = 'mailto:' + DESTINATAIRE
      + '?subject=' + encodeURIComponent(sujet)
      + '&body=' + encodeURIComponent(corps);
  }

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();

    /* pot de miel : un robot remplit ce champ caché */
    const piege = form.querySelector('[name="societe_web"]');
    if (piege && piege.value) { afficherStatut('Merci, votre demande a bien été transmise.', false); return; }

    let premierInvalide = null;
    controles.forEach(el => { if (!valider(el, true) && !premierInvalide) premierInvalide = el; });

    if (premierInvalide) {
      afficherStatut('Quelques informations restent à compléter.', true);
      premierInvalide.focus({ preventScroll: true });
      premierInvalide.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const lire = (n) => (form.elements[n] ? form.elements[n].value.trim() : '');
    ouvrirMessagerie({
      nom: lire('nom'), email: lire('email'), telephone: lire('telephone'),
      fonction: lire('fonction'), sujet: lire('sujet'), message: lire('message')
    });

    afficherStatut('Votre messagerie s’ouvre avec le message pré-rempli. Il ne reste qu’à l’envoyer.', false);
    if (bouton) {
      bouton.disabled = true;
      setTimeout(() => { bouton.disabled = false; }, 4000);
    }
  });
})();
