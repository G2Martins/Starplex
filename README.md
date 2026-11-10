# Starplex

Rede de cinemas fictícia em Brasília: um MVP de venda de ingressos feito como peça de portfólio.
Filmes em cartaz de verdade (TMDB), sessões dos próximos 7 dias, mapa de assentos, meia-entrada,
bomboniere e checkout **simulado**.

**Site:** https://g2martins.github.io/Starplex/ · **Sobre o projeto:** https://g2portfolio.grovicdata.com/projetos/starplex

> Projeto de portfólio de [Gustavo Martins Gripaldi](https://g2portfolio.grovicdata.com). Compras simuladas:
> nenhum pagamento é real, nenhum dado de pagamento ou pessoal é coletado. Cinemas, salas, sessões e
> assentos ocupados são gerados.

## O que tem

| Rota | Render | O que faz |
| --- | --- | --- |
| `/` | prerender | Destaque com trailer, "Em cartaz" com filtros (gênero, formato, cinema), "Em breve", bomboniere e cinemas |
| `/filmes/:slug` | prerender (1 por filme) | Sinopse, classificação indicativa, elenco, trailer (YouTube só após o clique, `youtube-nocookie`), sessões por data, cinema e formato |
| `/sessao/:id` | client | Fluxo com reserva de 10:00: assentos (PCD, acompanhante, namoradeira, VIP, até 8) → inteira/meia → bomboniere → Pix simulado → confirmação |
| `/bomboniere` | prerender | Cardápio com combos e pedido avulso para retirada na unidade |
| `/cinemas` | prerender | 3 unidades fictícias, salas 2D, 3D, IMAX e VIP, preços |
| `/meus-ingressos` | client | Pedidos salvos no `localStorage`, filtro e cancelamento simulado |

Detalhes que valem olhar:

- **Sessões determinísticas:** um PRNG com semente (filme + cinema + data) gera horários realistas e os
  assentos ocupados (20 a 60%, concentrados no centro). O mesmo link de sessão mostra o mesmo mapa em qualquer
  aparelho. Código em [`src/app/data/sessions.ts`](src/app/data/sessions.ts).
- **Mapa de assentos acessível:** cada assento é um `<button>` com `aria-label` ("Fileira F, assento 7, disponível")
  e `aria-pressed`, navegável pelas setas do teclado.
- **Pagamento sem coleta de dados:** só "Pix (simulação)" com QR decorativo (não legível). Não existe campo de
  cartão, CPF ou e-mail.
- **SEO:** título, descrição, canonical e Open Graph por rota, JSON-LD `WebSite` + `Movie` + `BreadcrumbList`
  nas páginas de filme, `sitemap.xml` e `robots.txt` gerados a partir dos dados. Sem `ScreeningEvent`/`Offer`,
  porque as sessões não são reais.
- **Performance:** páginas de catálogo pré-renderizadas, hidratação incremental das seções abaixo da dobra,
  `content-visibility` nos cartazes, fonte Geist com preload, imagens com dimensões fixas (CLS 0). A imagem
  de fundo de cada filme (o LCP da home e das páginas de filme) é servida do próprio domínio em WebP
  640/1024/1600, sem handshake extra com o CDN do TMDB.

## Stack

Angular 21 (standalone, zoneless, signals, SSG com `outputMode: "static"`), Tailwind CSS v4, TypeScript 5.9,
Geist + Geist Mono. Design derivado do sistema Valerium (Grovic Data): eyebrows mono, cards "well",
cantoneiras, grade de pontos, entradas out-expo; só `transform`/`opacity` animam e `prefers-reduced-motion`
é respeitado. Conteúdo visível sem JavaScript.

## Rodar

Requer Node 22.18+ (os scripts usam TypeScript nativo).

```bash
npm install
npm start            # http://localhost:4200/Starplex/
npm run build        # gera sitemap/robots e o build estático em dist/
```

## Atualizar os filmes (TMDB)

`src/app/data/movies.json` é a fonte única dos filmes. Para buscar a programação atual do Brasil:

1. Crie um token de leitura (v4, "API Read Access Token") em https://www.themoviedb.org/settings/api
2. Copie `.env.example` para `.env` e preencha `TMDB_TOKEN=` (o `.env` está no `.gitignore`)
3. Rode:

```bash
npm run movies && npm run build:pages
```

O script pega ~16 filmes em cartaz e ~8 próximas estreias (pt-BR, região BR), com classificação indicativa
brasileira, elenco, diretor e trailer. Também baixa o backdrop original de cada filme e grava WebP em
`public/img/backdrops/<slug>-{640,1024,1600}.webp` (com `sharp`), apagando os de filmes que saíram de cartaz.
Pôsteres, fotos do elenco e `og:image` continuam vindo do TMDB. Sem token, ou se a API falhar, o
`movies.json` atual é mantido; se só o download de um backdrop falhar, aquele filme usa a URL do TMDB.
Para voltar ao conjunto offline de exemplo (cartazes locais em `public/img`):
`cp src/app/data/movies.fixture.json src/app/data/movies.json`.

Este produto usa a API do TMDB, mas não é endossado ou certificado pelo TMDB.

## Publicar

GitHub Pages servindo `main:/docs`.

```bash
npm run build:pages
```

Copia `dist/starplex/browser` para `docs/`, cria `.nojekyll` e usa o shell client-side como `404.html`
para que links diretos de rotas client (como `/sessao/...`) funcionem. `docs/` é saída de build: não edite à mão.

**Imagem de compartilhamento:** `public/og.png` (1200x630) foi gerada a partir de `scripts/og.html` com
Playwright (screenshot da página em 1200x630).

## Créditos

Código por Gustavo Martins Gripaldi. Dados e imagens de filmes: TMDB. Marca Starplex e unidades são fictícias.
