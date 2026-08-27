export default {
  async fetch(request, env, ctx) {
    // 1. Preflight CORS
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

    // 🎲 Pools de variações por gênero
    const GENRE_POOLS = {
      '/news': ['/news/1.html', '/news/2.html'],
      '/gospel': ['/gospel/1.html', '/gospel/2.html', '/gospel/3.html'],
      '/rock': ['/rock/1.html', '/rock/2.html', '/rock/3.html'],
      '/country': ['/country/1.html', '/country/2.html'],
      '/synthwave': ['/synthwave/1.html', '/synthwave/2.html'],
      '/flashback': ['/flashback/1.html', '/flashback/2.html', '/flashback/3.html'],
      '/default': ['/default/1.html', '/default/2.html', '/default/3.html', '/default/4.html', '/default/5.html']
    };

    const withIframeHeaders = (response) => {
      if (!response) return new Response('Not Found', { status: 404 });
      const headers = new Headers(response.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      headers.set('Content-Security-Policy', 'frame-ancestors *');
      headers.delete('X-Frame-Options');

      return new Response(response.body, {
        status: 200,
        statusText: 'OK',
        headers
      });
    };

    if (env && env.ASSETS) {
      try {
        // Caso 1: Hub Central de Preview (raiz)
        if (cleanPath === '/' || cleanPath === '/index.html') {
          const res = await env.ASSETS.fetch(new Request(new URL('/index.html', url.origin)));
          return withIframeHeaders(res);
        }

        // Caso 2: Rota de Gênero Mapeada -> Sorteia uma variação
        if (GENRE_POOLS[cleanPath]) {
          const pool = GENRE_POOLS[cleanPath];
          const chosen = pool[Math.floor(Math.random() * pool.length)];
          const res = await env.ASSETS.fetch(new Request(new URL(chosen, url.origin)));
          return withIframeHeaders(res);
        }

        // Caso 3: Arquivo estático com extensão (ex: /rock/1.html, /exemplo.html, /favicon.ico)
        if (cleanPath.includes('.')) {
          const res = await env.ASSETS.fetch(request);
          if (res.status === 200) {
            return withIframeHeaders(res);
          }
        }

        // Caso 4: Fallback Universal -> Qualquer rota desconhecida sorteia do pool /default
        const defaultPool = GENRE_POOLS['/default'] || ['/default/1.html'];
        const chosenFallback = defaultPool[Math.floor(Math.random() * defaultPool.length)];
        const fallbackRes = await env.ASSETS.fetch(new Request(new URL(chosenFallback, url.origin)));
        return withIframeHeaders(fallbackRes);
      } catch (err) {
        return new Response('Fallback Error: ' + err.message, { status: 500 });
      }
    }

    return new Response('Lombrigasound: env.ASSETS indisponível', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Content-Security-Policy': 'frame-ancestors *'
      }
    });
  }
};
