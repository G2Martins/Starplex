import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { certLabel, MONTHS, imgSrcset, imgUrl, parseKey, runtimeLabel, type Movie } from '../data/catalog';
import { movieFormats } from '../data/sessions';

@Component({
  selector: 'app-poster',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'poster block' },
  template: `
    @if (movie().posterPath; as p) {
      <img [src]="src(p)" [attr.srcset]="set(p)" [attr.sizes]="sizes()" [alt]="'Pôster de ' + movie().title"
           width="342" height="513" [attr.loading]="eager() ? 'eager' : 'lazy'" [attr.fetchpriority]="eager() ? 'high' : null" decoding="async" />
    } @else {
      <div class="dotgrid grid h-full place-items-center p-4 text-center">
        <p class="h2 text-xl"><span class="grad">{{ movie().title }}</span></p>
      </div>
    }
  `,
})
export class Poster {
  movie = input.required<Movie>();
  eager = input(false);
  sizes = input('220px');
  /** "thumb" for tiny posters (TMDB w92/w154). */
  kind = input<'poster' | 'thumb'>('poster');
  protected src = (p: string) => imgUrl(p, this.kind());
  protected set = (p: string) => imgSrcset(p, this.kind());
}

@Component({
  selector: 'app-cert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
  template: `<span [class]="'cert cert-' + value()" [attr.title]="label()" role="img" [attr.aria-label]="label()">{{ value() === 'AD' ? '?' : value() }}</span>`,
})
export class Cert {
  value = input.required<string>();
  protected label = computed(() => certLabel(this.value()));
}

/** Poster + certification + title. The whole card links to the film page. */
@Component({
  selector: 'app-movie-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Poster, Cert],
  host: { class: 'block' },
  template: `
    <article class="stretch group">
      <div class="card lift relative overflow-hidden !rounded-[11px]">
        <app-poster [movie]="movie()" [eager]="eager()" [sizes]="sizes()" />
        <app-cert [value]="movie().certification" class="absolute left-2.5 top-2.5" />
      </div>
      <h3 class="mt-4 text-[15px] font-medium leading-snug tracking-tight">
        <a class="stretch-link outline-none focus-visible:underline" [routerLink]="['/filmes', movie().slug]">{{ movie().title }}</a>
      </h3>
      <p class="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-2">
        @if (movie().status === 'soon') { Estreia {{ release() }} } @else { {{ runtime() }} · {{ movie().genres[0] }} }
      </p>
      @if (movie().status === 'now') {
        <p class="mt-2 flex flex-wrap gap-1">
          @for (f of formats(); track f) { <span class="tag">{{ f }}</span> }
        </p>
      }
    </article>
  `,
})
export class MovieCard {
  movie = input.required<Movie>();
  eager = input(false);
  sizes = input('(min-width: 1024px) 220px, (min-width: 640px) 30vw, 46vw');
  protected runtime = computed(() => runtimeLabel(this.movie().runtime));
  protected formats = computed(() => movieFormats(this.movie()));
  protected release = computed(() => {
    const d = parseKey(this.movie().releaseDate);
    return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  });
}
