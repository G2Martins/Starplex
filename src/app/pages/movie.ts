import { ChangeDetectionStrategy, Component, afterNextRender, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  certLabel, certShort,
  CINEMAS, DATA_SOURCE, DOW, FORMATS, MONTHS, NOW, SITE_URL, dateKey, imgSrcset, imgUrl, movieBySlug, parseKey, prettyDate, runtimeLabel,
  type Format, type Movie,
} from '../data/catalog';
import { movieFormats, nextDays, sessionsFor, type Session } from '../data/sessions';
import { Icon } from '../shared/icon';
import { Cert, MovieCard, Poster } from '../shared/movie-card';
import { Reveal } from '../shared/reveal';
import { OG_IMAGE, Seo, abs, breadcrumbs } from '../shared/seo';
import { Store } from '../shared/store';
import { Trailer } from '../shared/trailer';

interface Group { cinema: (typeof CINEMAS)[number]; rows: { label: string; format: Format; sessions: Session[] }[] }

@Component({
  selector: 'app-movie',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Cert, MovieCard, Poster, Reveal, Trailer],
  templateUrl: './movie.html',
})
export class MoviePage {
  slug = input.required<string>();
  protected store = inject(Store);
  protected movie = computed(() => movieBySlug(this.slug()));
  protected others = computed(() => NOW.filter((m) => m.slug !== this.slug()).slice(0, 5));
  protected formats = computed(() => (this.movie() ? movieFormats(this.movie()!) : []));
  protected readonly cinemas = CINEMAS;
  protected readonly certShort = certShort;
  protected readonly certLabel = certLabel;
  protected readonly showRating = DATA_SOURCE === 'tmdb';
  protected readonly runtime = runtimeLabel;

  /** Showtimes depend on "today", so they only render in the browser. */
  protected today = signal<Date | null>(null);
  protected days = computed(() => (this.today() ? nextDays(this.today()!) : []));
  protected day = signal('');
  protected format = signal<Format | ''>('');

  protected groups = computed<Group[]>(() => {
    const m = this.movie(), now = this.today(), day = this.day();
    if (!m || !now || !day) return [];
    const nowMin = now.getHours() * 60 + now.getMinutes() + 15;
    const list = sessionsFor(m, day).filter((s) =>
      (!this.store.cinema() || s.cinema.id === this.store.cinema()) &&
      (!this.format() || s.room.format === this.format()) &&
      (day !== dateKey(now) || toMin(s.time) >= nowMin),
    );
    return CINEMAS.map((cinema) => {
      const mine = list.filter((s) => s.cinema.id === cinema.id);
      const order = (k: string) => FORMATS.indexOf(k.split('|')[0] as Format) * 2 + (k.endsWith('LEG') ? 1 : 0);
      const keys = [...new Set(mine.map((s) => `${s.room.format}|${s.lang}`))].sort((a, b) => order(a) - order(b));
      return {
        cinema,
        rows: keys.map((k) => {
          const [format, lang] = k.split('|');
          return { label: `${format} · ${lang === 'DUB' ? 'Dublado' : 'Legendado'}`, format: format as Format, sessions: mine.filter((s) => `${s.room.format}|${s.lang}` === k) };
        }),
      };
    }).filter((g) => g.rows.length);
  });

  constructor() {
    const seo = inject(Seo);
    effect(() => {
      const m = this.movie();
      if (!m) {
        seo.set({ title: 'Filme não encontrado | Starplex', description: 'Este filme não está na programação do Starplex.', path: `/filmes/${this.slug()}/`, noindex: true });
        return;
      }
      seo.set({
        title: `${m.title}: sessões e ingressos | Starplex`,
        description: clip(`${m.title} (${certShort(m.certification).toLowerCase()}, ${runtimeLabel(m.runtime)}). ${m.overview}`),
        path: `/filmes/${m.slug}/`,
        image: m.backdropPath?.startsWith('/') ? imgUrl(m.backdropPath, 'backdrop', true) : OG_IMAGE,
        imageAlt: `${m.title} no Starplex`,
        type: 'video.movie',
        jsonLd: [movieNode(m), breadcrumbs([{ name: 'Starplex', path: '/' }, { name: m.title, path: `/filmes/${m.slug}/` }])],
      });
    });
    afterNextRender(() => {
      const t = new Date();
      this.today.set(t);
      // Late at night today's shows are over: open on tomorrow instead.
      const m = this.movie();
      const left = m && sessionsFor(m, dateKey(t)).some((s) => toMin(s.time) >= t.getHours() * 60 + t.getMinutes() + 15);
      this.day.set(left ? dateKey(t) : nextDays(t)[1]);
    });
  }

  protected backdrop(m: Movie) {
    return m.backdropPath ? { src: imgUrl(m.backdropPath, 'backdrop', true), set: imgSrcset(m.backdropPath, 'backdrop') } : null;
  }
  protected profile = (p: string) => imgUrl(p, 'profile');
  protected initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('');
  protected dayLabel(k: string, i: number) {
    const d = parseKey(k);
    return { top: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : DOW[d.getDay()], num: d.getDate(), month: MONTHS[d.getMonth()] };
  }
  protected release(m: Movie) {
    const d = parseKey(m.releaseDate);
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  protected pretty = prettyDate;
  protected pickCinema(e: Event) {
    this.store.cinema.set((e.target as HTMLSelectElement).value);
  }
}

/** Meta description <= 158 chars, cut on a word boundary. */
const clip = (s: string) => (s.length <= 158 ? s : s.slice(0, 157).replace(/\s+\S*$/, '').replace(/[.,;:]+$/, '') + '…');

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

function movieNode(m: Movie) {
  const url = `${SITE_URL}/filmes/${m.slug}/`;
  const poster = m.posterPath ? imgUrl(m.posterPath, 'poster', true) : OG_IMAGE;
  return {
    '@type': 'Movie',
    '@id': `${url}#movie`,
    url,
    name: m.title,
    alternateName: m.originalTitle !== m.title ? m.originalTitle : undefined,
    description: m.overview,
    image: abs(poster.startsWith('http') || poster.startsWith('/') ? poster : `/${poster}`),
    datePublished: m.releaseDate,
    duration: `PT${Math.floor(m.runtime / 60)}H${m.runtime % 60}M`,
    genre: m.genres,
    contentRating: m.certification === 'AD' ? undefined : `ClassInd ${certShort(m.certification)}`,
    director: m.director ? { '@type': 'Person', name: m.director } : undefined,
    actor: m.cast.map((c) => ({ '@type': 'Person', name: c.name })),
  };
}
