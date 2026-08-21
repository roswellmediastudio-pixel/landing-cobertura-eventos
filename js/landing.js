/* Landing Roswell — lógica vanilla (sin jQuery ni librerías del tema). */
(function () {
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    /* Año de copyright */
    document.querySelectorAll('.copyright-year').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });

    /* Visor de fotos y videos */
    var modal = document.getElementById('photoModal');
    if (modal) {
      var allItems = [], mediaItems = [], mediaIdx = 0;

      document.querySelectorAll('[data-photo],[data-video]').forEach(function (el) {
        var art = el.closest('article'), artImg = art ? art.querySelector('img') : null;
        allItems.push({
          el: el,
          type: el.hasAttribute('data-photo') ? 'photo' : 'video',
          img: el.getAttribute('data-img'),
          vimeo: el.getAttribute('data-vimeo'),
          youtube: el.getAttribute('data-youtube'),
          desc: el.getAttribute('data-desc'),
          title: artImg ? artImg.alt : (el.getAttribute('data-title') || '')
        });
      });

      document.addEventListener('click', function (e) {
        var a = e.target && e.target.closest ? e.target.closest('[data-photo],[data-video]') : null;
        if (!a) return;
        e.preventDefault();
        var item = allItems.find(function (m) { return m.el === a; });
        if (!item) {
          item = {
            el: a,
            type: a.hasAttribute('data-photo') ? 'photo' : 'video',
            img: a.getAttribute('data-img'),
            vimeo: a.getAttribute('data-vimeo'),
            youtube: a.getAttribute('data-youtube'),
            desc: a.getAttribute('data-desc'),
            title: a.getAttribute('data-title') || a.getAttribute('data-desc') || ''
          };
          allItems.push(item);
        }
        mediaItems = allItems.filter(function (m) { return m.type === item.type; });
        mediaIdx = mediaItems.indexOf(item);
        openModal();
      });

      function openModal() {
        var m = mediaItems[mediaIdx],
          img = document.getElementById('modalImg'),
          video = document.getElementById('modalVideo'),
          desc = document.getElementById('modalDesc'),
          title = document.getElementById('modalTitle');
        desc.textContent = m.desc;
        title.textContent = m.title;
        if (m.type === 'photo') {
          img.src = m.img;
          img.style.display = 'block';
          if (video) video.style.display = 'none';
        } else if (video) {
          img.style.display = 'none';
          video.style.display = 'block';
          var src = m.youtube
            ? 'https://www.youtube-nocookie.com/embed/' + m.youtube + '?autoplay=1'
            : 'https://player.vimeo.com/video/' + m.vimeo + '?autoplay=1';
          video.innerHTML = '<iframe src="' + src + '" width="560" height="315" frameborder="0" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';
        }
        modal.classList.add('active');
      }

      function closeModal() {
        modal.classList.remove('active');
        var mv = document.getElementById('modalVideo');
        if (mv) mv.innerHTML = '';
      }

      var prevBtn = document.getElementById('modalPrev'),
        nextBtn = document.getElementById('modalNext'),
        closeBtn = document.querySelector('.photo-modal-close');
      if (prevBtn) prevBtn.addEventListener('click', function () {
        mediaIdx = (mediaIdx - 1 + mediaItems.length) % mediaItems.length;
        openModal();
      });
      if (nextBtn) nextBtn.addEventListener('click', function () {
        mediaIdx = (mediaIdx + 1) % mediaItems.length;
        openModal();
      });
      modal.addEventListener('click', function (e) {
        if (e.target === this || e.target.classList.contains('photo-modal-overlay')) closeModal();
      });
      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { closeModal(); }
        else if (e.key === 'ArrowLeft' && mediaItems.length) { mediaIdx = (mediaIdx - 1 + mediaItems.length) % mediaItems.length; openModal(); }
        else if (e.key === 'ArrowRight' && mediaItems.length) { mediaIdx = (mediaIdx + 1) % mediaItems.length; openModal(); }
      });
    }

    /* Sub-tabs de planes */
    function activateTab(section, idx) {
      var buttons = section.querySelectorAll('.sub-tab');
      var panels = section.querySelectorAll('.sub-panel');
      buttons.forEach(function (b, i) { b.classList.toggle('active', i === idx); });
      panels.forEach(function (p, i) {
        p.classList.toggle('active', i === idx);
      });
    }

    document.querySelectorAll('.sub-tabs').forEach(function (tabs) {
      var buttons = tabs.querySelectorAll('.sub-tab');
      buttons.forEach(function (btn, idx) {
        btn.addEventListener('click', function () {
          activateTab(tabs.closest('section'), idx);
        });
      });
    });

    /* Mobile swipe — solo detecta swipe horizontal sobre la sección de precios */
    (function () {
      var section = document.getElementById('planes');
      if (!section) return;
      var buttons = section.querySelectorAll('.sub-tab');
      var count = buttons.length;
      if (count < 2) return;

      var startX = 0, startY = 0, tracking = false;

      section.addEventListener('touchstart', function (e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        tracking = true;
      }, { passive: true });

      section.addEventListener('touchend', function (e) {
        if (!tracking) return;
        tracking = false;
        var dx = e.changedTouches[0].clientX - startX;
        var dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;

        var current = 0;
        buttons.forEach(function (b, i) { if (b.classList.contains('active')) current = i; });

        if (dx < 0 && current < count - 1) {
          activateTab(section, current + 1);
        } else if (dx > 0 && current > 0) {
          activateTab(section, current - 1);
        }
      }, { passive: true });
    })();

    /* Deep-link */
    var deepPanel = location.hash.replace('#', '');
    if (deepPanel) {
      var deepBtn = document.querySelector('.sub-tab[data-panel="' + deepPanel + '"]');
      if (deepBtn) deepBtn.click();
    }

    /* Bottom navigation bar — scroll suave + estado activo */
    var bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) {
      var navLinks = bottomNav.querySelectorAll('.bottom-nav-item[href^="#"]');

      navLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
          var targetId = this.getAttribute('href').replace('#', '');
          var target = document.getElementById(targetId);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
          }
        });
      });

      var sections = document.querySelectorAll('section[id], #main-content');
      if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var id = entry.target.id;
              navLinks.forEach(function (l) { l.classList.remove('active'); });
              if (id === 'main-content') {
                navLinks[0].classList.add('active');
              } else if (id === 'planes') {
                navLinks[1].classList.add('active');
              }
            }
          });
        }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

        sections.forEach(function (s) {
          if (s.id === 'main-content' || s.id === 'planes') observer.observe(s);
        });
      }
    }
  });
}());
