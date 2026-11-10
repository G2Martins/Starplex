import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CINEMAS, CITY, PRICE, brl, type Format } from '../data/catalog';
import { Icon } from '../shared/icon';
import { Reveal } from '../shared/reveal';
import { Seo } from '../shared/seo';
import { Store } from '../shared/store';

const ABOUT: Record<Format, string> = {
  '2D': 'Projeção digital 4K e som 7.1.',
  '3D': 'Óculos 3D higienizados a cada sessão.',
  IMAX: 'Tela de parede a parede, projeção a laser e som de 12 canais.',
  VIP: 'Poltronas reclináveis, mesa lateral e serviço na poltrona.',
};

@Component({
  selector: 'app-cinemas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Reveal],
  template: `
    <section class="relative isolate overflow-hidden border-b border-line">
      <div class="beam pointer-events-none absolute inset-x-0 top-0 -z-10 h-[140%] opacity-60" aria-hidden="true"></div>
      <div class="wrap py-14 md:py-20">
        <p class="eyebrow materialize">Unidades · {{ city }}</p>
        <h1 class="h-display mt-5 text-5xl sm:text-6xl"><span class="mask"><span class="rise">Três cinemas, <span class="grad">uma sala para cada filme</span></span></span></h1>
        <p class="materialize mt-5 max-w-xl text-ink-2" style="animation-delay: 150ms">
          Unidades fictícias criadas para este projeto. Endereços plausíveis, salas 2D, 3D, IMAX e VIP, todas com acessibilidade.
        </p>
      </div>
    </section>

    <div class="wrap grid grid-cols-1 gap-10 pt-12">
      @for (c of cinemas; track c.id; let i = $index) {
        <article [id]="c.id" class="card grid grid-cols-1 gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_1.3fr]" reveal>
          <div>
            <p class="font-mono text-[11px] uppercase tracking-[0.14em] text-accent-ink">0{{ i + 1 }} · {{ c.rooms.length }} salas</p>
            <h2 class="h2 mt-3 text-3xl sm:text-4xl">{{ c.name }}</h2>
            <p class="mt-4 flex items-start gap-2 text-[15px]"><app-icon name="pin" [size]="17" class="mt-1 text-accent-ink" /><span>{{ c.address }}<br /><span class="text-ink-2">{{ c.district }}</span></span></p>
            <p class="mt-3 flex items-center gap-2 text-[14px] text-ink-2"><app-icon name="clock" [size]="16" />{{ c.hours }}</p>
            <ul class="mt-6 grid gap-2 text-[14px]">
              @for (a of c.amenities; track a) { <li class="flex items-center gap-2"><app-icon name="check" [size]="15" class="text-ok" />{{ a }}</li> }
            </ul>
            <a class="btn btn-primary mt-8" routerLink="/" fragment="em-cartaz" (click)="store.cinema.set(c.id)">Ver filmes nesta unidade<app-icon name="arrow-right" [size]="16" /></a>
          </div>
          <div>
            <p class="mono-label">Salas</p>
            <ul class="mt-3 grid gap-px overflow-hidden rounded-[11px] border border-line bg-line">
              @for (r of c.rooms; track r.no) {
                <li class="flex items-center gap-4 bg-well px-4 py-3.5">
                  <span class="grid size-10 shrink-0 place-items-center rounded-[9px] border border-line font-mono text-[13px]">{{ r.no }}</span>
                  <span class="min-w-0 flex-1">
                    <span class="block text-[14px] font-medium">Sala {{ r.no }} <span class="tag ml-1">{{ r.format }}</span></span>
                    <span class="block truncate text-[13px] text-ink-2">{{ about[r.format] }}</span>
                  </span>
                  <span class="font-mono text-[13px] text-ink-2">{{ brl(price[r.format]) }}</span>
                </li>
              }
            </ul>
            <p class="mt-3 text-[12px] text-ink-2">Valores de inteira. Meia-entrada com 50% de desconto mediante documento.</p>
          </div>
        </article>
      }
    </div>
  `,
})
export class CinemasPage {
  protected store = inject(Store);
  protected readonly cinemas = CINEMAS;
  protected readonly city = CITY;
  protected readonly about = ABOUT;
  protected readonly price = PRICE;
  protected readonly brl = brl;

  constructor() {
    inject(Seo).set({
      title: `Cinemas Starplex em ${CITY}: Asa Norte, Águas Claras e Taguatinga`,
      description: 'Conheça as unidades Starplex em Brasília: endereços, horários, salas 2D, 3D, IMAX e VIP, preços e acessibilidade. Cinemas fictícios de um projeto de portfólio.',
      path: '/cinemas/',
    });
  }
}
