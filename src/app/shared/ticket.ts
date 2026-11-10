import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { brl, cinemaById, imgUrl, prettyDate } from '../data/catalog';
import { rng } from '../data/sessions';
import { Mark } from './logo';
import type { Order, OrderSnack, OrderTicket } from './store';

/** Line items + fees + total. */
@Component({
  selector: 'app-order-lines',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <ul class="grid gap-2 text-[14px]">
      @for (t of tickets(); track t.seat) {
        <li class="flex justify-between gap-3">
          <span><span class="font-mono text-accent-ink">{{ t.seat }}</span> · {{ t.type === 'meia' ? 'Meia-entrada' : 'Inteira' }}</span>
          <span class="font-mono">{{ brl(t.price) }}</span>
        </li>
      }
      @for (s of snacks(); track s.id) {
        <li class="flex justify-between gap-3">
          <span>{{ s.qty }}× {{ s.name }}</span>
          <span class="font-mono">{{ brl(s.price * s.qty) }}</span>
        </li>
      }
      @if (fees()) {
        <li class="flex justify-between gap-3 text-ink-2">
          <span>Taxa de serviço ({{ tickets().length }}× {{ brl(fees() / tickets().length) }})</span>
          <span class="font-mono">{{ brl(fees()) }}</span>
        </li>
      }
    </ul>
    <p class="mt-4 flex items-baseline justify-between border-t border-line pt-4">
      <span class="mono-label">Total</span>
      <span class="text-2xl font-medium tracking-tight">{{ brl(total()) }}</span>
    </p>
  `,
})
export class OrderLines {
  tickets = input<OrderTicket[]>([]);
  snacks = input<OrderSnack[]>([]);
  fees = input(0);
  protected readonly brl = brl;
  protected total = computed(
    () => this.tickets().reduce((a, t) => a + t.price, 0) + this.snacks().reduce((a, s) => a + s.price * s.qty, 0) + this.fees(),
  );
}

/** Printed-ticket look: details on top, tear line, decorative code on the stub. Not a scannable code. */
@Component({
  selector: 'app-ticket',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Mark],
  host: { class: 'block' },
  template: `
    @let o = order();
    <article class="stub relative overflow-hidden rounded-[14px] border border-line bg-surface" style="--tear: calc(100% - 7.25rem)"
             [class.opacity-60]="o.status === 'cancelado'">
      <div class="dotgrid flex gap-4 p-5">
        @if (o.session; as s) {
          @if (s.posterPath) {
            <img class="h-[6.5rem] w-[4.33rem] shrink-0 rounded-[8px] object-cover" [src]="poster(s.posterPath)" alt="" width="104" height="156" loading="lazy" decoding="async" />
          }
          <div class="min-w-0 flex-1">
            <p class="mono-label">Ingresso · {{ s.format }} {{ s.lang === 'DUB' ? 'Dublado' : 'Legendado' }}</p>
            <h3 class="mt-1.5 text-[17px] font-medium leading-snug tracking-tight">
              <a class="hover:underline" [routerLink]="['/filmes', s.slug]">{{ s.title }}</a>
            </h3>
            <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px] sm:grid-cols-4">
              <div><dt class="text-ink-2">Data</dt><dd>{{ date(s.date) }}</dd></div>
              <div><dt class="text-ink-2">Hora</dt><dd class="font-mono">{{ s.time }}</dd></div>
              <div><dt class="text-ink-2">Sala</dt><dd class="font-mono">{{ s.room }}</dd></div>
              <div><dt class="text-ink-2">Assentos</dt><dd class="font-mono text-accent-ink">{{ seats() }}</dd></div>
            </dl>
          </div>
        } @else {
          <div class="min-w-0 flex-1">
            <p class="mono-label">Bomboniere · Retirada no balcão expresso</p>
            <ul class="mt-2 grid gap-0.5 text-[14px]">
              @for (s of o.snacks; track s.id) { <li>{{ s.qty }}× {{ s.name }}</li> }
            </ul>
          </div>
        }
      </div>
      <p class="flex items-center justify-between gap-3 px-5 pb-4 text-[13px] text-ink-2">
        <span class="truncate">{{ cinema() }}</span>
        <span class="font-mono text-ink">{{ brl(o.total) }}</span>
      </p>
      <div class="perf mx-4"></div>
      <div class="flex h-[7.25rem] items-center gap-4 px-5">
        <div class="flex h-14 flex-1 items-stretch gap-[2px] overflow-hidden opacity-80" aria-hidden="true">
          @for (w of bars(); track $index) { <span class="bg-ink" [style.flex]="w"></span><span [style.flex]="(w % 2) + 1"></span> }
        </div>
        <div class="text-right">
          <p class="font-mono text-[15px] font-medium tracking-[0.08em]">{{ o.code }}</p>
          <p class="mt-1 flex items-center justify-end gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em]"
             [class]="o.status === 'cancelado' ? 'text-danger' : 'text-ok'">
            {{ o.status === 'cancelado' ? 'Cancelado' : 'Confirmado' }}
          </p>
          <p class="mt-1 flex items-center justify-end gap-1 text-[11px] text-ink-2"><app-mark [size]="14" />Código decorativo</p>
        </div>
      </div>
    </article>
  `,
})
export class Ticket {
  order = input.required<Order>();
  protected readonly brl = brl;
  protected date = prettyDate;
  protected poster = (p: string) => imgUrl(p, 'thumb', true);
  protected seats = computed(() => this.order().tickets.map((t) => t.seat).join(', '));
  protected cinema = computed(() => cinemaById(this.order().cinema)?.name ?? '');
  /** Decorative stripes derived from the booking code. */
  protected bars = computed(() => {
    const r = rng(this.order().code);
    return Array.from({ length: 26 }, () => 1 + Math.floor(r() * 3));
  });
}
