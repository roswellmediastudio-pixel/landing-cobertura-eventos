/* Conversions API (CAPI) de Meta — respaldo del píxel.
   Recibe los eventos del navegador (js/pixel.js) y los reenvía a la API
   de Meta desde el servidor, para que lleguen aunque el navegador bloquee
   el píxel de cliente.

   Variables de entorno (Cloudflare Pages → Settings → Environment variables):
     META_CAPI_ACCESS_TOKEN  → token de acceso del Conversions API (obligatorio para activar)
     META_CAPI_PIXEL_ID      → ID del píxel (por defecto: 2322886041841239)
     META_CAPI_TEST_CODE     → código de "Probar eventos" mientras se valida (opcional)
   Sin token, la función responde 200 sin hacer nada (deploy seguro). */
export async function onRequestPost(context) {
  const { env, request } = context;

  const token = env.META_CAPI_ACCESS_TOKEN || '';
  const pixelId = env.META_CAPI_PIXEL_ID || '2322886041841239';
  if (!token) return new Response('ok', { status: 200 });

  let payload;
  try {
    payload = await request.json();
  } catch (err) {
    return new Response('bad request', { status: 400 });
  }
  if (!payload || !payload.event_name) return new Response('ok', { status: 200 });

  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
  const ua = request.headers.get('user-agent') || (payload.user_data || {}).client_user_agent || '';
  const userData = Object.assign({}, payload.user_data || {});
  if (ip) userData.client_ip_address = ip;
  if (ua) userData.client_user_agent = ua;

  const data = {
    event_name: payload.event_name,
    event_time: Math.floor(Date.now() / 1000),
    event_id: payload.event_id || undefined,
    action_source: 'website',
    event_source_url: payload.event_source_url || request.headers.get('referer') || '',
    user_data: userData,
    custom_data: payload.custom_data || {},
    test_event_code: env.META_CAPI_TEST_CODE || undefined
  };

  try {
    const resp = await fetch(
      'https://graph.facebook.com/v19.0/' + pixelId + '/events?access_token=' + encodeURIComponent(token),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [data] })
      }
    );
    const text = await resp.text();
    return new Response(text, { status: resp.status });
  } catch (err) {
    return new Response('error', { status: 500 });
  }
}
