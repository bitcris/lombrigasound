export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cleanPath = url.pathname.replace(/\/+$/, '').toLowerCase() || '/';

    // 🎲 Mapeamento de rotas para variações aleatórias
    const GENRE_POOLS = {
      '/gospel': ['/gospel/1.html', '/gospel/2.html'],
      '/rock': ['/rock/1.html', '/rock/2.html'],
      '/country': ['/country/1.html', '/country/2.html'],
      '/synthwave': ['/synthwave/1.html', '/synthwave/2.html']
    };

    // 1. Se for uma rota de gênero, sorteia e entrega a variação direto no servidor
    if (GENRE_POOLS[cleanPath] && env.ASSETS) {
      const pool = GENRE_POOLS[cleanPath];
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      return env.ASSETS.fetch(new Request(new URL(chosen, url.origin)));
    }

    // 2. Tenta servir o arquivo estático requisitado
    if (env.ASSETS) {
      const response = await env.ASSETS.fetch(request);
      if (response.status !== 404) {
        return response;
      }
      // 3. Fallback Universal: qualquer rota inexistente entrega o default/1.html com 200
      return env.ASSETS.fetch(new Request(new URL('/default/1.html', url.origin)));
    }

    return new Response('Not found', { status: 404 });
  }
};
