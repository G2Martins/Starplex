# CLAUDE.md, Starplex

> **Spec viva.** Porta de entrada lida pelo agente toda sessão. Não duplica o [README.md](README.md), **aponta** pra ele. Atualize quando uma regra, comando, módulo ou armadilha mudar.
>
> **Última revisão:** 2026-11-10
> **Detalhes de uso, dados e deploy:** [README.md](README.md)

---

## 1. O que é

Rede de cinemas **fictícia** em Brasília: MVP de venda de ingressos, projeto de portfólio de Gustavo Martins Gripaldi ([g2portfolio.grovicdata.com/projetos/starplex](https://g2portfolio.grovicdata.com/projetos/starplex)). No ar em **<https://g2martins.github.io/Starplex/>**. Filmes reais (TMDB), sessões e assentos gerados, **compras sempre simuladas**. A versão antiga (Angular 14) está na tag `v1-angular14`.

## 2. Stack + Comandos

Angular 21 standalone + zoneless + signals, SSG (`outputMode: "static"`), hidratação incremental, Tailwind CSS v4, Geist/Geist Mono. Node 22.18+ (scripts `.ts` rodam com type stripping nativo). GitHub Pages servindo `main:/docs` com `baseHref /Starplex/`.

```bash
npm start            # seo + ng serve (dev)
npm run movies       # busca filmes no TMDB (precisa TMDB_TOKEN no .env), grava src/app/data/movies.json e os backdrops WebP em public/img/backdrops
npm run seo          # gera public/sitemap.xml e robots.txt a partir de movies.json
npm run build        # seo + ng build (prerender de home, /filmes/:slug, /bomboniere, /cinemas)
npm run build:pages  # build + copia dist pra docs/ (+ .nojekyll, 404.html, index de /meus-ingressos)
```

## 3. Mapa de módulos

| Caminho | Responsabilidade |
| --- | --- |
| `src/app/data/movies.json` | Fonte única dos filmes (gerada pelo `npm run movies`). `movies.fixture.json` = modo offline com pôsteres locais |
| `src/app/data/catalog.ts` | Tipos, cinemas, preços, helpers de imagem (TMDB ou local), `certShort`/`certLabel` |
| `src/app/data/sessions.ts` | Sessões dos próximos 7 dias e ocupação de assentos, **determinísticas** (PRNG com seed filme+data+cinema) |
| `src/app/pages/home.*` | Hero com destaques, Em cartaz (filtros), Em breve, como funciona, bomboniere, cinemas |
| `src/app/pages/movie.*` | Página do filme: sinopse, elenco, trailer, classificação, sessões. JSON-LD Movie |
| `src/app/pages/session.*` | Fluxo client-only: assentos → ingressos → bomboniere → pagamento → confirmação, com reserva de 10:00 |
| `src/app/pages/bomboniere.ts`, `cinemas.ts`, `orders.ts` | Bomboniere avulsa, unidades, Meus ingressos |
| `src/app/shared/store.ts` | Carrinho e pedidos (localStorage, só no browser) |
| `src/app/shared/pay.ts`, `ticket.ts` | Pix simulado (QR decorativo) e ingresso com código decorativo |
| `src/app/shared/seo.ts` | Title, description, canonical, OG, JSON-LD por rota |
| `src/app/shared/reveal.ts`, `trailer.ts`, `movie-card.ts` | Reveal-on-scroll, trailer lite (youtube-nocookie), card + selo `app-cert` |
| `public/img/backdrops/` | Backdrops self-hosted (`<slug>-640/1024/1600.webp`), gerados pelo `fetch-movies.ts` com `sharp`. São a imagem LCP: não voltar a apontar o hero pro CDN do TMDB |
| `scripts/` | `fetch-movies.ts` (TMDB + backdrops), `seo.ts` (sitemap), `pages.ts` (deploy), `og.html` (imagem de compartilhamento) |

## 4. Regras SEMPRE-ATIVAS

- **Dados só em `movies.json`** (via script). Não hardcodar filme em componente.
- **Compra sempre simulada.** Nunca renderizar campo de cartão, CVV, CPF ou endereço; nada sai do navegador. Faixa de aviso de portfólio visível em toda página.
- **Sem dado estruturado falso:** nada de `ScreeningEvent`/`Offer` em JSON-LD (sessões e preços são inventados).
- **Classificação indicativa:** sem certificação BR no TMDB = `AD` (selo "?", "a definir"). Nunca cair em "L" por padrão.
- **SSG primeiro:** páginas de catálogo são pré-renderizadas; APIs do browser (localStorage, IntersectionObserver, dialog) só em `afterNextRender`, eventos ou guarda `isPlatformBrowser`.
- **Design = linguagem Valerium** (tokens em `src/styles.css`, eyebrow mono, cards "well", out-expo, mask-rise). Starplex é dark-first com laranja `#EE7623` e a marca da estrela. Cor só via tokens.
- **Animação só `transform`/`opacity`**, respeitando `prefers-reduced-motion`; conteúdo visível sem JS.
- **Sem travessão "—" em texto visível** (copy, alt, títulos, metadados). Usar ":", ",", "." ou "·". O fetch já troca os do TMDB.
- **Créditos do TMDB** no rodapé, sempre.
- **Antes de publicar:** `npm run build:pages` verde, fluxo de compra testado, prints conferidos. `docs/` é saída de build: nunca editar à mão.
- **Docs vivas:** mudou comportamento, atualiza README e este arquivo no mesmo commit.

## 5. Segurança

- `TMDB_TOKEN` só no `.env` (gitignored; modelo em `.env.example`). Carregado **dentro** do script com `process.loadEnvFile`; nunca logar, imprimir ou gravar o token. O site publicado não usa token (dados já vêm prontos no JSON).
- Texto externo (TMDB) entra só por interpolação do Angular. Nada de `innerHTML` com dado de fora.
- Trailer só via `youtube-nocookie`, e o iframe só carrega no clique.
- localStorage guarda só estado da demo (carrinho, pedidos). Nenhum dado pessoal.

## 6. Common Hurdles (armadilhas conhecidas)

- **`cpSync` do Node 22 sai com código 127 em silêncio** no caminho com "Programação". `pages.ts` usa `fs/promises` `cp`.
- **EBUSY no `build:pages`:** algum shell ou servidor local com cwd dentro de `docs/`. Fechar antes.
- **Python com caminho não-ASCII via argumento** chega corrompido. Rodar servidor/scripts de dentro da pasta, com caminho relativo.
- **Print de página inteira mostra vazio** abaixo da dobra: é o `content-visibility: auto` dos cards + hidratação por viewport. Para validar, rolar e tirar print da viewport.
- **Rotas client-only** (`/sessao/...`) respondem 404 via `404.html` no GitHub Pages, mas renderizam. A reserva de assento vive em memória (recarregar reinicia).
- **Lighthouse local:** o Kaspersky intercepta o tráfego do Chrome (descomprime o HTML e injeta um script bloqueante), então os números saem piores que a realidade. Medir num Chromium aberto pelo Playwright com `--remote-debugging-port=9333`, rodando `npx lighthouse <url> --port=9333 --blocked-url-patterns="*kaspersky-labs.com*"`, servindo `docs/` com gzip sob `/Starplex/`. Comparar antes/depois sempre no mesmo ambiente, mediana de 3+ execuções.
- **`sharp` segura o arquivo de entrada aberto** (EBUSY ao apagar no Windows): ler para `Buffer` e usar `sharp.cache(false)`.
- **Nomes do elenco em outra escrita** (hangul, devanágari): o fetch troca pelo alias latino de `/person/{id}` ou descarta.
- **Deploy do Pages falha com "try again later":** instabilidade do GitHub; `gh run rerun <id> --failed`.
- **Links internos sempre com barra no fim** (`/filmes/x/`): o GitHub Pages responde `/x` com 301. O `TrailingSlashSerializer` (`src/app/shared/trailing-slash.ts`, registrado em `app.config.ts`) cuida disso no router.
