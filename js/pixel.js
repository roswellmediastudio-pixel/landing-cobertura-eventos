/* Meta Pixel — eventos de conversión + respaldo Conversions API (CAPI).
   El código base (init + PageView) está inline en el <head> de index.html.
   Este archivo: (1) dispara Lead/ViewContent con event_id único,
   (2) reenvía cada evento a /api/capi para que Meta lo reciba aunque el
   navegador bloquee el píxel de cliente. Meta deduplica por event_id+fbp. */
(function () {
  function uid() {
    var s = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    return s.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getUserData() {
    var d = {};
    var m;
    try {
      m = document.cookie.match(/(?:^|;\s*)_fbp=([^;]+)/);
      if (m) d.fbp = m[1];
      m = document.cookie.match(/(?:^|;\s*)_fbc=([^;]+)/);
      if (m) d.fbc = m[1];
    } catch (e) {}
    return d;
  }

  function sendToCapi(evt) {
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/capi', new Blob([JSON.stringify(evt)], { type: 'application/json' }));
      }
    } catch (e) {}
  }

  function fire(name, customData) {
    var eventId = uid();
    var custom = customData || {};
    try {
      if (typeof fbq === 'function') {
        fbq('track', name, custom, { eventID: eventId });
      }
    } catch (e) {}
    sendToCapi({
      event_id: eventId,
      event_name: name,
      event_source_url: location.href,
      custom_data: custom,
      user_data: getUserData()
    });
  }

  /* Lead: clic en cualquier enlace a WhatsApp, con el texto del CTA */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href^="https://wa.me"]') : null;
    if (!a) return;
    var text = (a.textContent || '').trim();
    var data = {};
    if (text) data.content_name = text.slice(0, 60);
    fire('Lead', data);
  });

  /* ViewContent: cuando la sección de precios entra en el viewport */
  function watchViewContent() {
    var sec = document.getElementById('planes');
    if (!sec) return;
    var sent = false;
    function send() {
      if (sent) return;
      var r = sec.getBoundingClientRect();
      if (r.top < window.innerHeight) {
        sent = true;
        fire('ViewContent', { content_name: 'planes' });
      }
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) send(); });
      }, { threshold: 0.15 });
      io.observe(sec);
    } else {
      window.addEventListener('scroll', send);
      send();
    }
  }

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }
  ready(watchViewContent);

  /* Diagnóstico rápido: ver en consola el estado del píxel */
  ready(function () {
    try {
      var estado = typeof fbq === 'function' ? 'activo (fbevents v' + fbq.version + ')' : 'NO definido';
      console.info('[Pixel] fbq ' + estado + ' — si dice "NO definido", revisa bloqueadores de anuncios o caché.');
    } catch (e) {}
  });
})();
