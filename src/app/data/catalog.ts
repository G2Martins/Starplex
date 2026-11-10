// Static catalogue: films (movies.json), cinemas, prices and the snack bar. No runtime imports
// besides the JSON, so Node scripts can read it with native type stripping.
import data from './movies.json' with { type: 'json' };

export const SITE_URL = 'https://g2martins.github.io/Starplex';
export const PORTFOLIO_URL = 'https://g2portfolio.grovicdata.com';
export const PROJECT_URL = `${PORTFOLIO_URL}/projetos/starplex`;
export const REPO_URL = 'https://github.com/G2Martins/Starplex';
export const AUTHOR = 'Gustavo Martins Gripaldi';

export type Format = '2D' | '3D' | 'IMAX' | 'VIP';
export const FORMATS: Format[] = ['2D', '3D', 'IMAX', 'VIP'];

export interface CastMember { name: string; character: string; profilePath: string | null }
export interface Movie {
  id: number;
  slug: string;
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  runtime: number;
  genres: string[];
  certification: string;
  releaseDate: string;
  voteAverage: number;
  cast: CastMember[];
  director: string | null;
  trailerYouTubeKey: string | null;
  status: 'now' | 'soon';
}

export const MOVIES = data.movies as Movie[];

/** 'AD' = classificação indicativa ainda não publicada para o Brasil. */
export const certShort = (c: string) => (c === 'L' ? 'Livre' : c === 'AD' ? 'A definir' : `${c} anos`);
export const certLabel = (c: string) =>
  c === 'L' ? 'Livre para todos os públicos' : c === 'AD' ? 'Classificação indicativa a definir' : `Não recomendado para menores de ${c} anos`;
export const DATA_SOURCE = data.source as 'fixture' | 'tmdb';
export const NOW = MOVIES.filter((m) => m.status === 'now');
export const SOON = MOVIES.filter((m) => m.status === 'soon');
export const movieBySlug = (slug: string) => MOVIES.find((m) => m.slug === slug);
export const movieById = (id: number) => MOVIES.find((m) => m.id === id);
export const GENRES = [...new Set(NOW.flatMap((m) => m.genres))].sort((a, b) => a.localeCompare(b, 'pt-BR'));

// ---------- Images: TMDB paths start with "/", local fixture keys don't ----------
const TMDB_IMG = 'https://image.tmdb.org/t/p/';
type Kind = 'poster' | 'thumb' | 'backdrop' | 'profile';
const WIDTHS: Record<Kind, [number, number]> = { poster: [342, 500], thumb: [92, 154], backdrop: [780, 1280], profile: [185, 185] };
const DIR: Record<Kind, string> = { poster: 'img/posters/', thumb: 'img/posters/', backdrop: 'img/backdrops/', profile: 'img/profiles/' };

export function imgUrl(path: string, kind: Kind, large = false): string {
  if (path.startsWith('/')) return `${TMDB_IMG}w${WIDTHS[kind][large ? 1 : 0]}${path}`;
  const k = kind === 'thumb' ? 'poster' : kind; // fixture has no thumbnails, the small poster is close enough
  return `${DIR[k]}${path}-${WIDTHS[k][large ? 1 : 0]}.webp`;
}
export function imgSrcset(path: string, kind: Kind): string {
  const k = path.startsWith('/') || kind !== 'thumb' ? kind : 'poster';
  const [a, b] = WIDTHS[k];
  return `${imgUrl(path, kind)} ${a}w, ${imgUrl(path, kind, true)} ${b}w`;
}

// ---------- Cinemas (fictional units) ----------
export interface Room { no: number; format: Format }
export interface Cinema {
  id: string;
  name: string;
  short: string;
  address: string;
  district: string;
  rooms: Room[];
  amenities: string[];
  hours: string;
}

export const CITY = 'Brasília';
export const CINEMAS: Cinema[] = [
  {
    id: 'asa-norte',
    name: 'Starplex Asa Norte',
    short: 'Asa Norte',
    address: 'SCRN 704/705, Bloco C, Loja 12',
    district: 'Asa Norte, Brasília, DF',
    rooms: [{ no: 1, format: '2D' }, { no: 2, format: '2D' }, { no: 3, format: '3D' }, { no: 4, format: 'IMAX' }, { no: 5, format: 'VIP' }],
    amenities: ['Sala IMAX com projeção a laser', 'Sala VIP com poltronas reclináveis', 'Estacionamento conveniado', 'Acessibilidade em todas as salas'],
    hours: 'Todos os dias, das 12h30 à 0h',
  },
  {
    id: 'aguas-claras',
    name: 'Starplex Águas Claras',
    short: 'Águas Claras',
    address: 'Av. das Araucárias, 1835, Piso L2',
    district: 'Águas Claras, Brasília, DF',
    rooms: [{ no: 1, format: '2D' }, { no: 2, format: '3D' }, { no: 3, format: 'IMAX' }, { no: 4, format: 'VIP' }, { no: 5, format: 'VIP' }],
    amenities: ['Duas salas VIP com serviço na poltrona', 'Sala IMAX', 'Bicicletário', 'Acessibilidade em todas as salas'],
    hours: 'Todos os dias, das 13h à 0h',
  },
  {
    id: 'taguatinga',
    name: 'Starplex Taguatinga',
    short: 'Taguatinga',
    address: 'QSA 2, Lote 18, Avenida Comercial',
    district: 'Taguatinga Sul, Brasília, DF',
    rooms: [{ no: 1, format: '2D' }, { no: 2, format: '2D' }, { no: 3, format: '3D' }, { no: 4, format: 'VIP' }],
    amenities: ['Bomboniere com retirada expressa', 'Sala VIP', 'Próximo ao metrô', 'Acessibilidade em todas as salas'],
    hours: 'Todos os dias, das 13h às 23h30',
  },
];
export const cinemaById = (id: string) => CINEMAS.find((c) => c.id === id);

// ---------- Prices (BRL) ----------
export const PRICE: Record<Format, number> = { '2D': 34, '3D': 40, IMAX: 52, VIP: 68 };
export const FEE = 3.5; // taxa de serviço por ingresso
export type TicketType = 'inteira' | 'meia';
export const ticketPrice = (f: Format, t: TicketType) => (t === 'meia' ? PRICE[f] / 2 : PRICE[f]);

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const brl = (v: number) => BRL.format(v);

// ---------- Bomboniere ----------
export type SnackArt = 'combo' | 'popcorn' | 'drink' | 'water' | 'nachos' | 'chocolate' | 'candy' | 'bucket';
export interface SnackVariant { id: string; label: string; price: number }
export interface Snack { id: string; name: string; desc: string; art: SnackArt; cat: string; tag?: string; variants: SnackVariant[] }

export const SNACK_CATS = ['Combos', 'Pipocas', 'Bebidas', 'Salgados', 'Doces e chocolates'];
const sizes = (id: string, p: [number, number, number]) => [
  { id: `${id}-p`, label: 'P', price: p[0] },
  { id: `${id}-m`, label: 'M', price: p[1] },
  { id: `${id}-g`, label: 'G', price: p[2] },
];
const one = (id: string, price: number) => [{ id, label: 'Unidade', price }];

export const SNACKS: Snack[] = [
  { id: 'combo-filme', cat: 'Combos', art: 'bucket', tag: 'Colecionável', name: 'Combo do Filme', desc: 'Balde colecionável Starplex Edição Estelar com pipoca G e refrigerante G.', variants: one('combo-filme', 89) },
  { id: 'combo-casal', cat: 'Combos', art: 'combo', tag: 'Mais pedido', name: 'Combo Casal', desc: 'Pipoca G e dois refrigerantes M.', variants: one('combo-casal', 62) },
  { id: 'combo-solo', cat: 'Combos', art: 'combo', name: 'Combo Solo', desc: 'Pipoca M e refrigerante M.', variants: one('combo-solo', 42) },
  { id: 'combo-galera', cat: 'Combos', art: 'combo', name: 'Combo Galera', desc: 'Duas pipocas G, três refrigerantes M e um chocolate.', variants: one('combo-galera', 99) },
  { id: 'pipoca-salgada', cat: 'Pipocas', art: 'popcorn', name: 'Pipoca salgada', desc: 'Clássica, com manteiga.', variants: sizes('pipoca-salgada', [22, 28, 34]) },
  { id: 'pipoca-doce', cat: 'Pipocas', art: 'popcorn', name: 'Pipoca doce', desc: 'Caramelizada e crocante.', variants: sizes('pipoca-doce', [24, 30, 36]) },
  { id: 'pipoca-mista', cat: 'Pipocas', art: 'popcorn', name: 'Pipoca mista', desc: 'Metade salgada, metade doce.', variants: sizes('pipoca-mista', [24, 30, 36]) },
  { id: 'refri', cat: 'Bebidas', art: 'drink', name: 'Refrigerante', desc: 'Cola, guaraná ou laranja. 300, 500 ou 700 ml.', variants: sizes('refri', [12, 15, 18]) },
  { id: 'suco', cat: 'Bebidas', art: 'drink', name: 'Suco natural', desc: 'Laranja ou uva, 400 ml.', variants: one('suco', 14) },
  { id: 'agua', cat: 'Bebidas', art: 'water', name: 'Água mineral', desc: 'Com ou sem gás, 500 ml.', variants: one('agua', 8) },
  { id: 'nachos', cat: 'Salgados', art: 'nachos', name: 'Nachos', desc: 'Tortilhas crocantes com molho quente.', variants: [{ id: 'nachos-cheddar', label: 'Cheddar', price: 29 }, { id: 'nachos-jalapeno', label: 'Cheddar e jalapeño', price: 32 }] },
  { id: 'chocolate', cat: 'Doces e chocolates', art: 'chocolate', name: 'Chocolate ao leite', desc: 'Barra de 90 g.', variants: one('chocolate', 12) },
  { id: 'confeitos', cat: 'Doces e chocolates', art: 'candy', name: 'Confeitos de chocolate', desc: 'Pacote de 100 g.', variants: one('confeitos', 14) },
  { id: 'balas', cat: 'Doces e chocolates', art: 'candy', name: 'Balas de goma', desc: 'Sabores sortidos, 120 g.', variants: one('balas', 12) },
  { id: 'bombom', cat: 'Doces e chocolates', art: 'chocolate', name: 'Bombons trufados', desc: 'Caixa com 4 unidades.', variants: one('bombom', 18) },
];

/** variant id -> { snack, variant } */
export const VARIANTS = new Map(SNACKS.flatMap((s) => s.variants.map((v) => [v.id, { snack: s, variant: v }] as const)));
export const variantName = (id: string) => {
  const hit = VARIANTS.get(id);
  if (!hit) return id;
  return hit.snack.variants.length > 1 ? `${hit.snack.name} ${hit.variant.label}` : hit.snack.name;
};

// ---------- Dates ----------
export const DOW = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parseKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};
/** "Seg, 9 nov" */
export const prettyDate = (k: string) => {
  const d = parseKey(k);
  return `${DOW[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
export const runtimeLabel = (min: number) => (min ? `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}` : '');
