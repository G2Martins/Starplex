import { Injectable, computed, effect, signal } from '@angular/core';
import { VARIANTS, type Format, type TicketType } from '../data/catalog';
import type { Lang } from '../data/sessions';

export interface OrderTicket { seat: string; type: TicketType; price: number }
export interface OrderSnack { id: string; name: string; qty: number; price: number }
export interface Order {
  id: string;
  code: string;
  createdAt: string;
  kind: 'ingresso' | 'bomboniere';
  status: 'confirmado' | 'cancelado';
  cinema: string;
  /** Snapshot, so the order survives a refresh of movies.json. */
  session?: {
    id: string; slug: string; title: string; posterPath: string | null; certification: string;
    room: number; format: Format; lang: Lang; date: string; time: string;
  };
  tickets: OrderTicket[];
  snacks: OrderSnack[];
  fees: number;
  total: number;
}

export interface Hold { sessionId: string; seats: string[]; types: Record<string, TicketType>; deadline: number }

const KEY = { cart: 'starplex:cart', orders: 'starplex:orders', cinema: 'starplex:cinema' };
const read = <T>(k: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(k) ?? '') as T; } catch { return fallback; }
};
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

/** Client state: snack cart, saved orders, preferred cinema. Hydrated from localStorage by `load()`. */
@Injectable({ providedIn: 'root' })
export class Store {
  readonly cinema = signal('');
  readonly cart = signal<Record<string, number>>({});
  readonly orders = signal<Order[]>([]);
  /** Seats held by the booking flow (survives leaving the page; header badge + cart link). */
  readonly hold = signal<Hold | null>(null);
  readonly ready = signal(false);

  readonly cartCount = computed(() => Object.values(this.cart()).reduce((a, b) => a + b, 0));
  readonly cartTotal = computed(() =>
    Object.entries(this.cart()).reduce((sum, [id, q]) => sum + (VARIANTS.get(id)?.variant.price ?? 0) * q, 0),
  );
  readonly badge = computed(() => this.cartCount() + (this.hold()?.seats.length ?? 0));

  constructor() {
    effect(() => {
      if (!this.ready()) return;
      write(KEY.cart, this.cart());
      write(KEY.orders, this.orders());
      write(KEY.cinema, this.cinema());
    });
  }

  /** Browser only (afterNextRender). */
  load() {
    if (this.ready()) return;
    const cart = read<Record<string, number>>(KEY.cart, {});
    this.cart.set(Object.fromEntries(Object.entries(cart).filter(([id, q]) => VARIANTS.has(id) && q > 0 && q < 100)));
    const orders = read<Order[]>(KEY.orders, []);
    this.orders.set(Array.isArray(orders) ? orders : []);
    const c = read<string>(KEY.cinema, '');
    this.cinema.set(typeof c === 'string' ? c : '');
    this.ready.set(true);
  }

  setQty(id: string, qty: number) {
    this.cart.update((c) => {
      const next = { ...c };
      if (qty > 0) next[id] = Math.min(qty, 20);
      else delete next[id];
      return next;
    });
  }

  cartLines() {
    return Object.entries(this.cart()).flatMap(([id, qty]) => {
      const hit = VARIANTS.get(id);
      if (!hit) return [];
      const name = hit.snack.variants.length > 1 ? `${hit.snack.name} ${hit.variant.label}` : hit.snack.name;
      return [{ id, name, qty, price: hit.variant.price }];
    });
  }

  addOrder(o: Omit<Order, 'id' | 'code' | 'createdAt' | 'status'>): Order {
    const order: Order = { ...o, id: crypto.randomUUID(), code: code(), createdAt: new Date().toISOString(), status: 'confirmado' };
    this.orders.update((list) => [order, ...list]);
    return order;
  }

  cancel(id: string) {
    this.orders.update((list) => list.map((o) => (o.id === id ? { ...o, status: 'cancelado' } : o)));
  }
}

/** Decorative booking code, e.g. "SPX-7F3K-92QD" (no ambiguous characters). */
function code() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const b = crypto.getRandomValues(new Uint8Array(8));
  const s = [...b].map((x) => abc[x % abc.length]).join('');
  return `SPX-${s.slice(0, 4)}-${s.slice(4)}`;
}
