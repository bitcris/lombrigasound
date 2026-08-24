export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cleanPath = url.pathname.replace(/\/+$/, '').toLowerCase() || '/';

    // 🎲 Rotas mapeadas para as variações de cada gênero
    const GENRE_POOLS = {
      '/gospel': ['/gospel/1.html', '/gospel/2.html'],
      '/rock': ['/rock/1.html', '/rock/2.html'],
      '/country': ['/country/1.html', '/country/2.html'],
      '/synthwave': ['/synthwave/1.html', '/synthwave/2.html']
    };

    const fetchStatic = async (path) => {
      const targetUrl = new URL(path, url.origin);
      if (env.ASSETS) {
        return env.ASSETS.fetch(new Request(targetUrl, request));
      }
      return fetch(targetUrl);
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
      if (res.status !== 404) return res;
      // 3. Fallback universal (200 OK)
      return fetchStatic('/default/1.html');
    }

    return fetch(request);
  }
};
