import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Icon } from './icon';

/** Lite YouTube facade: a thumbnail until clicked, then a youtube-nocookie iframe. */
@Component({
  selector: 'app-trailer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: { class: 'relative block aspect-video overflow-hidden rounded-[11px] bg-black' },
  template: `
    @if (playing() || autoplay()) {
      <iframe class="absolute inset-0 h-full w-full" [src]="url()"
              [title]="'Trailer de ' + title()" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>
    } @else {
      <button type="button" class="group absolute inset-0 grid place-items-center" (click)="playing.set(true)">
        <span class="sr-only">Assistir ao trailer de {{ title() }}</span>
        <img class="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-100"
             [src]="'https://i.ytimg.com/vi/' + key() + '/hqdefault.jpg'" alt="" width="480" height="360" loading="lazy" decoding="async" />
        <span class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></span>
        <span class="relative grid size-16 place-items-center rounded-full bg-accent text-on-accent shadow-[0_8px_30px_rgb(238_118_35/0.45)] transition-transform duration-300 ease-out-expo group-hover:scale-110">
          <app-icon name="play" [size]="26" />
        </span>
        <span class="absolute bottom-3 left-4 font-mono text-[11px] uppercase tracking-[0.14em] text-white/85" aria-hidden="true">Trailer · YouTube</span>
      </button>
    }
  `,
})
export class Trailer {
  key = input.required<string>();
  title = input('');
  autoplay = input(false);
  protected playing = signal(false);
  private san = inject(DomSanitizer);
  // Key comes from data files: allow only YouTube id characters before trusting the URL.
  protected url = computed(() =>
    this.san.bypassSecurityTrustResourceUrl(
      `https://www.youtube-nocookie.com/embed/${this.key().replace(/[^\w-]/g, '')}?autoplay=1&rel=0`,
    ),
  );
}
