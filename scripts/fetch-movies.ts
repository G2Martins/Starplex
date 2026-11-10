// Refreshes src/app/data/movies.json from TMDB (pt-BR, Brazil). Usage: put TMDB_TOKEN (v4 "API Read
// Access Token") in .env, then `npm run movies && npm run build:pages`. The token is never printed or saved.
import { existsSync, readFileSync } from 'node:fs';
import { readdir, unlink, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

if (existsSync('.env')) process.loadEnvFile('.env');
const token = process.env['TMDB_TOKEN'];
if (!token) {
  console.error('movies: defina TMDB_TOKEN no arquivo .env (veja .env.example).');
  process.exit(1);
}

const NOW_MAX = 16;
const SOON_MAX = 8;
const CERTS = ['L', '10', '12', '14', '16', '18'];
const today = new Date().toISOString().slice(0, 10);

interface Tmdb { [k: string]: any }

async function api(path: string): Promise<Tmdb> {
  const res = await fetch(`https://api.themoviedb.org/3${path}`, {
    headers: { Authorization: `Bearer ${token}`, accept: 'application/json' },
  });
  // Only the path goes to the log, never headers.
  if (!res.ok) throw new Error(`TMDB respondeu ${res.status} em ${path.split('?')[0]}`);
  return res.json();
}

// Site copy never uses em dashes: TMDB text gets a comma instead.
const clean = (s: string) => String(s ?? '').replace(/\s*\u2014\s*/g, ', ').trim();

const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const list = async (path: string, pages: number[]) =>
  (await Promise.all(pages.map((p) => api(`${path}?region=BR&language=pt-BR&page=${p}`)))).flatMap((r) => r['results'] as Tmdb[]);

const nowRaw = (await list('/movie/now_playing', [1, 2])).filter((m) => m['poster_path']);
const nowIds = new Set(nowRaw.map((m) => m['id']));
const soonRaw = (await list('/movie/upcoming', [1, 2])).filter(
  (m) => m['poster_path'] && !nowIds.has(m['id']) && (m['release_date'] ?? '') > today,
);

const pick = <T extends Tmdb>(arr: T[], n: number) => [...new Map(arr.map((m) => [m['id'], m])).values()].slice(0, n);
const chosen = [
  ...pick(nowRaw, NOW_MAX).map((m) => ({ id: m['id'] as number, status: 'now' as const })),
  ...pick(soonRaw, SOON_MAX).map((m) => ({ id: m['id'] as number, status: 'soon' as const })),
];

const details = await Promise.all(
  chosen.map((c) => api(`/movie/${c.id}?language=pt-BR&append_to_response=credits,videos,release_dates&include_video_language=pt,en,null`)),
);

const rank = (t: number) => (t === 3 ? 0 : t === 2 ? 1 : 2);
const used = new Set<string>();
const movies = details.map((d, i) => {
  const br = (d['release_dates']?.['results'] ?? []).find((r: Tmdb) => r['iso_3166_1'] === 'BR');
  // Prefer the theatrical release (type 3, then 2) over premieres/festivals.
  const dates = ((br?.['release_dates'] ?? []) as Tmdb[]).sort((a, b) => rank(a['type']) - rank(b['type']));
  const cert = dates.map((r) => String(r['certification'] ?? '').trim().toUpperCase()).find((c) => CERTS.includes(c));
  const brRelease = String(dates[0]?.['release_date'] ?? '').slice(0, 10);
  const videos = ((d['videos']?.['results'] ?? []) as Tmdb[]).filter((v) => v['site'] === 'YouTube' && v['type'] === 'Trailer');
  const trailer = videos.find((v) => v['iso_639_1'] === 'pt') ?? videos.find((v) => v['official']) ?? videos[0];
  let slug = slugify(d['title'] || d['original_title']);
  if (used.has(slug)) slug = `${slug}-${String(d['release_date'] ?? '').slice(0, 4) || d['id']}`;
  used.add(slug);
  return {
    id: d['id'],
    slug,
    title: clean(d['title'] || d['original_title']),
    originalTitle: clean(d['original_title']),
    overview: clean(d['overview'] || 'Sinopse ainda não disponível em português.'),
    posterPath: d['poster_path'] ?? null,
    backdropPath: d['backdrop_path'] ?? null,
    runtime: d['runtime'] || (chosen[i].status === 'now' ? 120 : 0),
    genres: (d['genres'] ?? []).map((g: Tmdb) => g['name']).slice(0, 4),
    certification: cert ?? 'AD',
    releaseDate: brRelease || d['release_date'] || today,
    voteAverage: Math.round((d['vote_average'] ?? 0) * 10) / 10,
    cast: ((d['credits']?.['cast'] ?? []) as Tmdb[]).slice(0, 8).map((c) => ({ id: c['id'], name: c['name'], character: clean(c['character'] || ''), profilePath: c['profile_path'] ?? null })),
    director: ((d['credits']?.['crew'] ?? []) as Tmdb[]).find((c) => c['job'] === 'Director') ?? null,
    trailerYouTubeKey: trailer?.['key'] ?? null,
    status: chosen[i].status,
  };
});

// Credits come in the person's native script (e.g. Hangul, Devanagari). Prefer a Latin alias from
// /person/{id}; drop the cast member when TMDB has none.
const isLatin = (s: string) => /^[\p{Script=Latin}\p{M}\s.'’-]+$/u.test(s);
const latinName = async (id: number, name: string) => {
  if (isLatin(name)) return name;
  const aliases = ((await api(`/person/${id}`))['also_known_as'] ?? []) as string[];
  return aliases.find(isLatin) ?? null;
};
for (const m of movies as Tmdb[]) {
  const cast = [];
  for (const c of m['cast'] as Tmdb[]) {
    const name = await latinName(c['id'], c['name']);
    if (name && cast.length < 6) cast.push({ name, character: c['character'], profilePath: c['profilePath'] });
  }
  m['cast'] = cast;
  const d = m['director'] as Tmdb | null;
  m['director'] = d ? await latinName(d['id'], d['name']) : null;
}

// Self-host the backdrops: they are the LCP image of the home hero and of every film page. Same origin
// (no extra TLS handshake to image.tmdb.org) and WebP at 640/1024/1600 instead of a 780/1280 JPEG.
// The original TMDB path stays in `backdropTmdb` for og:image. If a download fails the film keeps the
// TMDB path and the site falls back to TMDB URLs.
const BACKDROPS = new URL('../public/img/backdrops/', import.meta.url);
const BACKDROP_W = [640, 1024, 1600];
sharp.cache(false);
for (const m of movies as Tmdb[]) {
  const path = m['backdropPath'] as string | null;
  if (!path) continue;
  const res = await fetch(`https://image.tmdb.org/t/p/original${path}`);
  if (!res.ok) { console.warn(`movies: backdrop de ${m['slug']} falhou (${res.status}), usando TMDB`); continue; }
  const img = sharp(Buffer.from(await res.arrayBuffer()));
  for (const w of BACKDROP_W)
    await img.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: 62 }).toFile(fileURLToPath(new URL(`${m['slug']}-${w}.webp`, BACKDROPS)));
  m['backdropTmdb'] = path;
  m['backdropPath'] = m['slug'];
}
// Drop backdrops of films that left the lineup (the offline fixture's stay).
const fixture = JSON.parse(readFileSync(new URL('../src/app/data/movies.fixture.json', import.meta.url), 'utf8'));
const keep = new Set([...movies, ...fixture.movies].map((m: Tmdb) => m['slug']));
for (const f of await readdir(BACKDROPS))
  if (!keep.has(f.replace(/-\d+\.webp$/, ''))) await unlink(fileURLToPath(new URL(f, BACKDROPS)));

const file = new URL('../src/app/data/movies.json', import.meta.url);
await writeFile(file, JSON.stringify({ source: 'tmdb', updatedAt: today, movies }, null, 2) + '\n');
console.log(`movies: ${movies.filter((m) => m.status === 'now').length} em cartaz, ${movies.filter((m) => m.status === 'soon').length} em breve -> src/app/data/movies.json`);
