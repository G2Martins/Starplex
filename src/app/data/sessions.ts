// Fake but deterministic showtimes and seat maps: the same seed gives the same sessions and the
// same occupied seats on every device, so links to a session are shareable.
import { CINEMAS, MOVIES, dateKey, type Cinema, type Format, type Movie, type Room } from './catalog';

export type Lang = 'DUB' | 'LEG';
export interface Session {
  id: string;
  movie: Movie;
  cinema: Cinema;
  room: Room;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  lang: Lang;
}

/** FNV-1a seed + mulberry32 PRNG. */
export function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BIG = ['Ação', 'Aventura', 'Animação', 'Ficção científica', 'Fantasia'];
const KIDS = ['Animação', 'Família'];

export function movieFormats(m: Movie): Format[] {
  const r = rng(`fmt${m.id}`);
  const big = m.genres.some((g) => BIG.includes(g));
  const f: Format[] = ['2D'];
  if (big && r() < 0.8) f.push('3D');
  if (big && r() < 0.65) f.push('IMAX');
  if (r() < 0.6) f.push('VIP');
  return f;
}

export function movieCinemas(m: Movie): string[] {
  const r = rng(`cin${m.id}`);
  const ids = CINEMAS.filter(() => r() < 0.75).map((c) => c.id);
  return ids.length >= 2 ? ids : CINEMAS.slice(0, 2).map((c) => c.id);
}

const hhmm = (t: number) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;

/** All sessions of a film on a date (YYYY-MM-DD), every cinema, sorted by time. */
export function sessionsFor(m: Movie, date: string): Session[] {
  if (m.status !== 'now') return [];
  const out: Session[] = [];
  const cinemas = movieCinemas(m);
  const kids = m.genres.some((g) => KIDS.includes(g));
  for (const cinema of CINEMAS) {
    if (!cinemas.includes(cinema.id)) continue;
    const r = rng(`${m.id}|${cinema.id}|${date}`);
    for (const format of movieFormats(m)) {
      const rooms = cinema.rooms.filter((x) => x.format === format);
      if (!rooms.length) continue;
      const langs: Lang[] = format === '2D' && !kids ? ['DUB', 'LEG'] : [kids || r() < 0.4 ? 'DUB' : 'LEG'];
      for (const lang of langs) {
        const room = rooms[Math.floor(r() * rooms.length)];
        // First show 13:00..14:20, then runtime + cleaning (25..55 min) rounded to 10 min, until 22:30.
        for (let t = 13 * 60 + Math.floor(r() * 9) * 10; t <= 22 * 60 + 30; t += Math.ceil((m.runtime + 25 + r() * 30) / 10) * 10) {
          if (r() > 0.85) continue;
          const time = hhmm(t);
          out.push({ id: `${m.id}_${cinema.id}_${room.no}_${date}_${time.replace(':', '')}_${lang}`, movie: m, cinema, room, date, time, lang });
        }
      }
    }
  }
  return out.sort((a, b) => a.time.localeCompare(b.time));
}

/** Rebuilds a session from its id, or null if it was never generated. */
export function findSession(id: string): Session | null {
  const [movieId, , , date] = id.split('_');
  const movie = MOVIES.find((m) => String(m.id) === movieId);
  if (!movie || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) return null;
  return sessionsFor(movie, date).find((s) => s.id === id) ?? null;
}

/** Next 7 days starting today (local time). */
export function nextDays(from = new Date()): string[] {
  return Array.from({ length: 7 }, (_, i) => dateKey(new Date(from.getFullYear(), from.getMonth(), from.getDate() + i)));
}

// ---------- Seat maps ----------
// p padrão · d PCD (cadeirante) · a acompanhante · c namoradeira (pares) · v VIP · _ corredor · ' ' vazio
export type SeatType = 'p' | 'd' | 'a' | 'c' | 'v';
export interface Seat { id: string; row: string; num: number; type: SeatType; occupied: boolean; pair?: string; side?: 'l' | 'r' }
export interface SeatRow { letter: string; cells: (Seat | null)[] }

const STD = ['dapp_pppppppppp_ppad', ...Array(8).fill('pppp_pppppppppp_pppp'), 'cccc_cccccccccc_cccc'];
const IMAX = ['dappp_pppppppppppp_pppad', ...Array(10).fill('ppppp_pppppppppppp_ppppp'), ' cccc_cccccccccccc_cccc '];
const VIP = ['da_vvvvvv_ad', ...Array(5).fill('vv_vvvvvv_vv')];
const LAYOUT: Record<Format, string[]> = { '2D': STD, '3D': STD, IMAX, VIP };

export const SEAT_LABEL: Record<SeatType, string> = {
  p: 'padrão',
  d: 'PCD, para cadeirante',
  a: 'acompanhante de PCD',
  c: 'namoradeira',
  v: 'VIP reclinável',
};

export function seatMap(s: Session): SeatRow[] {
  const rows = LAYOUT[s.room.format];
  const r = rng(`occ${s.id}`);
  const fill = 0.2 + r() * 0.4; // 20..60% of the room
  return rows.map((pattern, ri) => {
    const letter = String.fromCharCode(65 + ri);
    const cols = pattern.length;
    let num = 0;
    let run = 0; // position inside a run of couple seats
    let prev: Seat | null = null;
    const cells = [...pattern].map((ch, ci) => {
      if (ch !== 'c') run = 0;
      if (ch === '_' || ch === ' ') return null;
      num++;
      const seat: Seat = { id: `${letter}${num}`, row: letter, num, type: ch as SeatType, occupied: false };
      // Crowd sits near the centre, ~60% back from the screen.
      const dx = Math.abs(ci - (cols - 1) / 2) / (cols / 2);
      const dy = Math.abs(ri - rows.length * 0.6) / rows.length;
      const p = Math.min(0.95, Math.max(0.03, fill * (1.7 - dx * 1.1 - dy * 1.4))) * (ch === 'd' || ch === 'a' ? 0.3 : 1);
      seat.occupied = r() < p;
      if (ch === 'c') {
        if (run % 2 === 1 && prev) {
          seat.pair = prev.id;
          prev.pair = seat.id;
          prev.side = 'l';
          seat.side = 'r';
          seat.occupied = prev.occupied; // couples are sold together
        }
        run++;
      }
      prev = seat;
      return seat;
    });
    return { letter, cells };
  });
}
