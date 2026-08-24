# 🤖 AGENTS.md - Diretrizes para Agentes no Lombrigasound

Este documento define a arquitetura, padrões de desenvolvimento, protocolo de comunicação e fluxos de deploy do projeto **Lombrigasound**. Todos os agentes autônomos (como o Antigravity) devem seguir estas diretrizes ao criar novos visualizadores ou modificar a infraestrutura.

---

## 1. 📌 Visão Geral do Projeto

O **Lombrigasound** é uma plataforma de visualizadores de áudio dinâmicos, responsivos e leves construídos em HTML5 Canvas. A aplicação é hospedada e distribuída globalmente via **Cloudflare Pages**, contando com roteamento inteligente e sorteio aleatório de variações visuais por gênero musical através de um Cloudflare Worker edge (`_worker.js`).

- **URL de Produção**: `https://lombrigasound.pages.dev`
- **Hub Central de Preview**: `https://lombrigasound.pages.dev/`
- **Rotas Dinâmicas de Gêneros**:
  - 🎸 Rock: `/rock` (sorteia variações como `/rock/1.html`, `/rock/2.html`)
  - ✨ Gospel: `/gospel`
  - 🤠 Country: `/country`
  - 🌆 Synthwave: `/synthwave`
  - 🌐 Rota Fallback Universal: Qualquer rota inexistente (ex: `/qualquer-coisa`) responde com status 200 servindo `/default/1.html`.

---

## 2. 🔐 Repositório Git, SSH e Fluxo de Deploy

### 2.1. Configuração do Repositório Remoto
- **URL Remota (SSH)**: `git@github.com:bitcris/lombrigasound.git`
- **Branch Principal**: `main`

O ambiente Linux de deploy possui uma **chave SSH exclusiva para deploy configurada para o GitHub sem passphrase**.

### 2.2. Regras Estritas de Segurança e SSH
- **NÃO solicitar nem inserir passphrase durante o deploy.**
- **NÃO modificar, substituir nem sobrescrever as chaves SSH existentes no sistema.**

### 2.3. Comandos de Verificação e Git

Para verificar se o acesso SSH com o GitHub está operacional:
```bash
ssh -T git@github.com
```

Para configurar o remote (caso ainda não exista no ambiente):
```bash
git remote add origin git@github.com:bitcris/lombrigasound.git
```

Para enviar alterações para o repositório remoto:
```bash
git add .
git commit -m "feat(visualizer): descrição clara da alteração"
git push -u origin main
```

### 2.4. Deploy em Produção (Cloudflare Pages)
O deploy estático e das funções de borda é realizado através do Wrangler:
```bash
npx wrangler pages deploy . --project-name lombrigasound
```

---

## 3. 🎨 Padrão Canônico para Criação de Visualizadores

O arquivo modelo de referência padrão é o [`./exemplo.html`](exemplo.html).

### 3.1. Requisitos Obrigatórios de Cada Visualizador
1. **Arquivo Único Autocontido (Single File)**: Cada visualizador deve ser um arquivo `.html` contendo HTML, CSS (`<style>`) e JavaScript (`<script>`) em um único arquivo.
2. **Zero Dependências Externas**: Não utilizar CDNs pesadas ou bibliotecas externas não essenciais. Prefira HTML5 Canvas 2D nativo ou WebGL puro para máxima performance e inicialização instantânea.
3. **Responsividade Total**:
   - `body, html` devem ter `margin: 0; padding: 0; overflow: hidden; background: #000;`.
   - O `<canvas>` deve se ajustar automaticamente aos eventos de redimensionamento da janela (`window.addEventListener('resize', ...)`).
4. **Performance de 60 FPS**: Utilizar sempre `requestAnimationFrame` no loop de renderização.

---

## 4. 📡 Protocolo de Comunicação (`postMessage`)

Todos os visualizadores rodam frequentemente dentro de `<iframe>` no Hub central ou em players externos. Portanto, **todo visualizador DEVE obrigatoriamente escutar e responder a eventos `postMessage`**.

### 4.1. Estrutura do Listener Padrão:
```javascript
let isPlaying = true;
let genre = 'synthwave'; // Gênero padrão ou fallback

window.addEventListener('message', (e) => {
  if (!e.data) return;

  // 1. Controle de Play / Pause
  if (e.data.isPlaying !== undefined) {
    isPlaying = Boolean(e.data.isPlaying);
  } else if (e.data.playing !== undefined) {
    isPlaying = Boolean(e.data.playing);
  }

  // 2. Gênero Musical (opcional / dinâmico)
  const rawGenre = e.data.genre || e.data.genere;
  if (rawGenre && typeof rawGenre === 'string') {
    genre = rawGenre.toLowerCase().trim();
  }

  // 3. Suporte futuro para frequências / Web Audio API
  if (e.data.audioData && Array.isArray(e.data.audioData)) {
    // Ex: processar dados do analyser FFT
  }
});
```

### 4.2. Comportamento ao Pausar (`isPlaying = false`)
- Quando `isPlaying === false`, a animação não deve incrementar o contador de tempo (`t`), mantendo o estado visual congelado de forma suave e economizando ciclos de CPU/GPU.

---

## 5. 🛠️ Passo a Passo: Adicionando Novos Visualizadores

### Cenário A: Nova variação para um gênero existente (ex: `rock/3.html`)
1. Crie o novo arquivo na pasta do gênero: `rock/3.html` (baseando-se no [`exemplo.html`](exemplo.html)).
2. Registre a nova variação no array `GENRE_POOLS` dentro do [`_worker.js`](_worker.js):
   ```javascript
   const GENRE_POOLS = {
     '/rock': ['/rock/1.html', '/rock/2.html', '/rock/3.html'],
     // ...
   };
   ```
3. Teste localmente e faça o deploy:
   ```bash
   npx wrangler pages deploy . --project-name lombrigasound
   ```
4. Salve no Git:
   ```bash
   git add .
   git commit -m "feat(rock): add visualizer variation 3"
   git push -u origin main
   ```

### Cenário B: Criando um novo gênero musical (ex: `lofi`)
1. Crie a pasta do gênero: `/lofi`.
2. Crie os arquivos de visualizadores: `lofi/1.html`, `lofi/2.html` e `lofi/index.html`.
3. Crie o wrapper de gênero na raiz: `lofi.html` (para compatibilidade estática se acessado direto).
4. Adicione a rota ao `GENRE_POOLS` no [`_worker.js`](_worker.js):
   ```javascript
   '/lofi': ['/lofi/1.html', '/lofi/2.html']
   ```
5. Adicione o card e botão correspondente no Hub [`index.html`](index.html).
6. Faça o deploy no Pages e comite no Git.

---

## 6. 📂 Estrutura de Diretórios

```
lombrigasound/
├── _headers              # Configuração de cabeçalhos CORS e iframe (frame-ancestors *)
├── _redirects            # Regras de redirecionamento do Cloudflare Pages
├── _worker.js            # Router de borda: sorteio randômico de visualizadores e fallback
├── index.html            # Hub central de preview com controles interativos
├── exemplo.html          # Template padrão e canônico de visualizador
├── wrangler.toml         # Configurações do projeto Cloudflare
├── AGENTS.md             # Este manual de diretrizes para agentes
├── country/              # Visualizadores de estilo Country / Acústico
│   ├── 1.html
│   ├── 2.html
│   └── index.html
├── gospel/               # Visualizadores de estilo Gospel / Celestial
│   ├── 1.html
│   ├── 2.html
│   └── index.html
├── rock/                 # Visualizadores de estilo Rock / Heavy / Eletrizante
│   ├── 1.html
│   ├── 2.html
│   └── index.html
├── synthwave/            # Visualizadores de estilo Synthwave / Retrô Neon
│   ├── 1.html
│   ├── 2.html
│   └── index.html
└── default/              # Visualizador universal de fallback
    ├── 1.html
    └── index.html
```

---

## 7. 💡 Dicas de Estética Visual para o Canvas

- **Paletas de Cores por Gênero**:
  - **Synthwave**: Magenta (`#ff007f`), Ciano (`#00f0ff`), Roxo escuro (`#1a0033`).
  - **Rock**: Vermelho lava (`#ff2200`), Laranja brasa (`#ff9900`), Preto carvão (`#060608`).
  - **Gospel**: Dourado divino (`#fbbf24`), Branco luz (`#ffffff`), Âmbar suave (`#f59e0b`).
  - **Country**: Marrom âmbar (`#d97706`), Bege acústico (`#fef3c7`), Pôr do sol (`#ea580c`).
  - **Lo-Fi**: Lavanda pastel (`#a78bfa`), Rosa vintage (`#f472b6`), Azul suave (`#60a5fa`).
  - **EDM / Cyberpunk**: Verde neon (`#39ff14`), Azul elétrico (`#00d4ff`), Ultra-violeta (`#7928ca`).
- **Efeitos Recomendados**:
  - Trilhas suaves com `ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'` antes de redesenhar para dar efeito de rastro / motion blur.
  - Gradientes radiais e lineares (`ctx.createRadialGradient`, `ctx.createLinearGradient`).
  - Formas geométricas pulsantes que reagem a funções senoidais (`Math.sin(t * velocidade)`).
