export default {
  async fetch(request, env, ctx) {
    // 1. Tratamento de CORS Preflight
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

    // Helper para injetar cabeçalhos liberando <iframe>
    const withIframeHeaders = (response) => {
      if (!response) return new Response('Not Found', { status: 404 });
      const headers = new Headers(response.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      headers.set('Content-Security-Policy', 'frame-ancestors *');
      headers.delete('X-Frame-Options');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    };

    // 2. Se o binding de assets estiver ativo (Cloudflare Pages / Workers)
    if (env && env.ASSETS) {
      // Se for uma rota de gênero mapeada, sorteia a variação
      if (GENRE_POOLS[cleanPath]) {
        const pool = GENRE_POOLS[cleanPath];
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        const res = await env.ASSETS.fetch(new Request(new URL(chosen, url.origin)));
        return withIframeHeaders(res);
      }

      // Tenta servir o arquivo estático requisitado
      const res = await env.ASSETS.fetch(request);
      if (res.status !== 404) {
        return withIframeHeaders(res);
      }

      // 3. Fallback Universal (status 200 para qualquer rota inexistente)
      const fallbackRes = await env.ASSETS.fetch(new Request(new URL('/default/1.html', url.origin)));
      return withIframeHeaders(fallbackRes);
    }

    // Proteção contra loop recursivo (Error 1042)
    return new Response('Lombrigasound: Para rodar com arquivos estáticos, faça o deploy via Cloudflare Pages: npx wrangler pages deploy .', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Content-Security-Policy': 'frame-ancestors *'
      }
    });
  }
};
