export default {
  async fetch(request, env, ctx) {
    // Tratamento de requisições OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Content-Security-Policy': 'frame-ancestors *'
        }
      });
    }

    const url = new URL(request.url);
    const cleanPath = url.pathname.replace(/\/+$/, '').toLowerCase() || '/';

    // 🎲 Variações de cada gênero
    const GENRE_POOLS = {
      '/gospel': ['/gospel/1.html', '/gospel/2.html'],
      '/rock': ['/rock/1.html', '/rock/2.html'],
      '/country': ['/country/1.html', '/country/2.html'],
      '/synthwave': ['/synthwave/1.html', '/synthwave/2.html']
    };

    // Helper para aplicar cabeçalhos liberando o uso em <iframe>
    const withIframeHeaders = (response) => {
      const headers = new Headers(response.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      headers.set('Content-Security-Policy', 'frame-ancestors *');
      headers.delete('X-Frame-Options'); // ⚠️ Remove o bloqueio de SAMEORIGIN para permitir iframes externos

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    };

    const fetchStatic = async (path) => {
      const targetUrl = new URL(path, url.origin);
      if (env.ASSETS) {
        const res = await env.ASSETS.fetch(new Request(targetUrl, request));
        return withIframeHeaders(res);
      }
      const res = await fetch(targetUrl);
      return withIframeHeaders(res);
    };

    // 1. Sorteio de gênero
    if (GENRE_POOLS[cleanPath]) {
      const pool = GENRE_POOLS[cleanPath];
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      return fetchStatic(chosen);
    }

    // 2. Busca estática normal
    if (env.ASSETS) {
      const res = await env.ASSETS.fetch(request);
      if (res.status !== 404) return withIframeHeaders(res);
      // 3. Fallback universal (200 OK)
      return fetchStatic('/default/1.html');
    }

    const res = await fetch(request);
    return withIframeHeaders(res);
  }
};
