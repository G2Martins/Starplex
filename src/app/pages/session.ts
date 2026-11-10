import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject, input, signal, untracked, viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FEE, PRICE, brl, parseKey, prettyDate, ticketPrice, type TicketType } from '../data/catalog';
import { SEAT_LABEL, findSession, seatMap, type Seat } from '../data/sessions';
import { Icon } from '../shared/icon';
import { Cert, Poster } from '../shared/movie-card';
import { Pay } from '../shared/pay';
import { Seo } from '../shared/seo';
import { SnackList } from '../shared/snack-list';
import { Store, type Order } from '../shared/store';
import { OrderLines, Ticket } from '../shared/ticket';

const HOLD_MS = 10 * 60 * 1000;
const MAX = 8;

@Component({
  selector: 'app-session',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Cert, Poster, Pay, SnackList, OrderLines, Ticket],
  templateUrl: './session.html',
})
export class SessionPage {
  id = input.required<string>();
  protected store = inject(Store);
  protected readonly steps = ['Assentos', 'Ingressos', 'Bomboniere', 'Pagamento', 'Confirmação'];
  protected readonly brl = brl;
  protected readonly fee = FEE;
  protected readonly max = MAX;
  protected readonly seatLabel = SEAT_LABEL;
  protected readonly pretty = prettyDate;

  protected session = computed(() => findSession(this.id()));
  protected rows = computed(() => (this.session() ? seatMap(this.session()!) : []));
  protected cols = computed(() => this.rows()[0]?.cells.length ?? 0);
  private seatsById = computed(() => new Map(this.rows().flatMap((r) => r.cells.filter((c): c is Seat => !!c).map((s) => [s.id, s]))));
  protected types = computed(() => [...new Set(this.rows().flatMap((r) => r.cells.map((c) => c?.type)).filter((t) => !!t))]);

  protected step = signal(0);
  protected order = signal<Order | null>(null);
  protected notice = signal('');
  private now = signal(Date.now());
  private destroy = inject(DestroyRef);
  private scroller = viewChild<ElementRef<HTMLElement>>('scroller');

  private hold = computed(() => {
    const h = this.store.hold();
    return h && h.sessionId === this.id() ? h : null;
  });
  protected selected = computed(() => this.hold()?.seats ?? []);
  protected remaining = computed(() => (this.hold() ? Math.max(0, this.hold()!.deadline - this.now()) : HOLD_MS));
  protected clock = computed(() => {
    const s = Math.ceil(this.remaining() / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  });
  protected expired = computed(() => this.step() < 4 && !!this.hold() && this.remaining() === 0);
  protected started = computed(() => {
    const s = this.session();
    if (!s) return false;
    const d = parseKey(s.date);
    d.setHours(Number(s.time.slice(0, 2)), Number(s.time.slice(3, 5)));
    return d.getTime() < this.now() && this.step() < 4;
  });

  protected tickets = computed(() => {
    const s = this.session();
    if (!s) return [];
    const t = this.hold()?.types ?? {};
    return this.selected().map((seat) => {
      const type: TicketType = t[seat] ?? 'inteira';
      return { seat, type, price: ticketPrice(s.room.format, type) };
    });
  });
  protected fees = computed(() => this.tickets().length * FEE);
  protected total = computed(
    () => this.tickets().reduce((a, t) => a + t.price, 0) + this.fees() + (this.step() >= 2 ? this.store.cartTotal() : 0),
  );
  protected price = computed(() => PRICE[this.session()?.room.format ?? '2D']);
  protected hasPcd = computed(() => this.selected().some((id) => ['d', 'a'].includes(this.seatsById().get(id)?.type ?? '')));

  constructor() {
    inject(Seo).set({ title: 'Escolha seus assentos | Starplex', description: 'Escolha assentos, ingressos e combos para a sua sessão no Starplex. Compra simulada.', path: '/', noindex: true });
    // Client-only route: start/restore the hold for whichever session id is in the URL.
    effect(() => {
      this.id();
      untracked(() => this.fresh(false));
    });
    afterNextRender(() => {
      const t = setInterval(() => this.now.set(Date.now()), 1000);
      this.destroy.onDestroy(() => clearInterval(t));
      const el = this.scroller()?.nativeElement;
      if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    });
  }

  /** Starts (or restarts) the 10 minute hold. Keeps seats when coming back to a live hold. */
  protected fresh(force: boolean) {
    const h = this.hold();
    if (!force && h && h.deadline > Date.now()) return;
    this.store.hold.set({ sessionId: this.id(), seats: [], types: {}, deadline: Date.now() + HOLD_MS });
    this.now.set(Date.now());
    this.step.set(0);
  }

  protected isOn = (id: string) => this.selected().includes(id);

  protected aria(s: Seat) {
    const state = s.occupied ? 'ocupado' : this.isOn(s.id) ? 'selecionado' : 'disponível';
    const type = s.type === 'p' ? '' : `, ${SEAT_LABEL[s.type]}`;
    return `Fileira ${s.row}, assento ${s.num}${type}, ${state}`;
  }

  protected toggle(s: Seat) {
    const h = this.hold();
    if (!h || s.occupied) return;
    const partner = s.pair ? this.seatsById().get(s.pair) : undefined;
    const group = partner && !partner.occupied ? [s.id, partner.id] : [s.id];
    const set = new Set(h.seats);
    if (set.has(s.id)) group.forEach((id) => set.delete(id));
    else if (set.size + group.length > MAX) return this.notice.set(`Máximo de ${MAX} assentos por compra.`);
    else group.forEach((id) => set.add(id));
    this.notice.set('');
    const seats = [...set].sort((a, b) => a[0].localeCompare(b[0]) || Number(a.slice(1)) - Number(b.slice(1)));
    this.store.hold.set({ ...h, seats });
  }

  protected setType(seat: string, type: TicketType) {
    const h = this.hold();
    if (h) this.store.hold.set({ ...h, types: { ...h.types, [seat]: type } });
  }

  /** Arrow keys move between seats. */
  protected nav(e: KeyboardEvent) {
    const d = ({ ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] } as Record<string, number[]>)[e.key];
    const t = e.target as HTMLElement;
    if (!d || t.dataset['r'] === undefined) return;
    e.preventDefault();
    const r = Number(t.dataset['r']), c = Number(t.dataset['c']);
    for (let i = 1; i < 30; i++) {
      const next = (e.currentTarget as HTMLElement).querySelector<HTMLElement>(`button[data-r="${r + d[0] * i}"][data-c="${c + d[1] * i}"]:not(:disabled)`);
      if (next) return next.focus();
    }
  }

  protected go(n: number) {
    this.step.set(n);
    globalThis.scrollTo?.({ top: 0, behavior: 'smooth' });
  }

  protected paid() {
    const s = this.session()!;
    const o = this.store.addOrder({
      kind: 'ingresso',
      cinema: s.cinema.id,
      session: {
        id: s.id, slug: s.movie.slug, title: s.movie.title, posterPath: s.movie.posterPath, certification: s.movie.certification,
        room: s.room.no, format: s.room.format, lang: s.lang, date: s.date, time: s.time,
      },
      tickets: this.tickets(),
      snacks: this.store.cartLines(),
      fees: this.fees(),
      total: this.total(),
    });
    this.order.set(o);
    this.store.cart.set({});
    this.store.hold.set(null);
    this.go(4);
  }
}
