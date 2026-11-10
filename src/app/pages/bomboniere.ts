import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CINEMAS, SNACKS, brl } from '../data/catalog';
import { Icon } from '../shared/icon';
import { Pay } from '../shared/pay';
import { Seo } from '../shared/seo';
import { SnackArt } from '../shared/snack-art';
import { SnackList } from '../shared/snack-list';
import { Store, type Order } from '../shared/store';
import { OrderLines, Ticket } from '../shared/ticket';

@Component({
  selector: 'app-bomboniere',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Pay, SnackArt, SnackList, OrderLines, Ticket],
  template: `
    <section class="relative isolate overflow-hidden border-b border-line">
      <div class="beam pointer-events-none absolute inset-x-0 top-0 -z-10 h-[140%] opacity-60" aria-hidden="true"></div>
      <div class="wrap grid items-center gap-10 py-14 md:grid-cols-[minmax(0,1fr)_auto] md:py-20">
        <div>
          <p class="eyebrow materialize">Bomboniere · Retirada expressa</p>
          <h1 class="h-display mt-5 text-5xl sm:text-6xl"><span class="mask"><span class="rise">Pipoca, combos e <span class="grad">doces</span></span></span></h1>
          <p class="materialize mt-5 max-w-lg text-ink-2" style="animation-delay: 150ms">
            Peça agora e retire no balcão expresso da unidade escolhida, sem fila. Também dá para adicionar tudo isso junto com o ingresso.
          </p>
        </div>
        <div class="ticks hidden md:block">
          <div class="card dotgrid grid grid-cols-2 gap-3 p-5">
            @for (a of arts; track a) { <app-snack-art [kind]="a" class="size-24 rounded-[10px] bg-well p-2" /> }
          </div>
        </div>
      </div>
    </section>

    <div class="wrap grid grid-cols-1 gap-10 pt-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div class="min-w-0">
        @switch (stage()) {
          @case ('cart') { <h2 class="sr-only">Cardápio</h2><app-snack-list [cols]="2" /> }
          @case ('pay') {
            <button type="button" class="btn btn-ghost -ml-3 mb-4" (click)="stage.set('cart')"><app-icon name="arrow-left" [size]="16" />Voltar ao cardápio</button>
            <h2 class="sr-only">Pagamento</h2>
            <app-pay [total]="store.cartTotal()" seed="bomboniere" (paid)="paid()" />
          }
          @case ('done') {
            @if (order(); as o) {
              <div class="materialize">
                <p class="eyebrow">Pedido {{ o.code }}</p>
                <h2 class="h2 mt-3 text-4xl">Pedido <span class="grad">confirmado</span></h2>
                <p class="mt-3 max-w-md text-ink-2">Apresente o código no balcão expresso. Compra simulada: nenhum valor foi cobrado.</p>
                <app-ticket class="mt-8 max-w-2xl" [order]="o" />
                <div class="mt-8 flex flex-wrap gap-3">
                  <a class="btn btn-primary" routerLink="/meus-ingressos">Ver meus pedidos</a>
                  <button type="button" class="btn btn-line" (click)="stage.set('cart')">Fazer outro pedido</button>
                </div>
              </div>
            }
          }
        }
      </div>

      @if (stage() !== 'done') {
        <aside id="carrinho" class="h-fit scroll-mt-28 lg:sticky lg:top-24" aria-label="Seu pedido">
          <div class="card p-5">
            <p class="eyebrow">Seu pedido</p>
            @if (store.cartCount()) {
              <app-order-lines class="mt-4" [snacks]="store.cartLines()" />
              <label class="mt-5 block">
                <span class="mono-label">Retirar em</span>
                <select class="field mt-2 w-full" (change)="pickup.set(value($event))">
                  <option value="" [selected]="!where()">Escolha a unidade</option>
                  @for (c of cinemas; track c.id) { <option [value]="c.id" [selected]="c.id === where()">{{ c.name }}</option> }
                </select>
              </label>
              @if (stage() === 'cart') {
                <button type="button" class="btn btn-primary mt-5 w-full" [disabled]="!where()" (click)="stage.set('pay')">
                  Ir para pagamento<app-icon name="arrow-right" [size]="16" />
                </button>
                @if (!where()) { <p class="mt-2 text-center text-[12px] text-ink-2">Escolha a unidade de retirada.</p> }
                <button type="button" class="btn btn-ghost mt-1 w-full text-[13px]" (click)="store.cart.set({})"><app-icon name="trash" [size]="15" />Esvaziar carrinho</button>
              }
            } @else {
              <p class="mt-4 text-[14px] text-ink-2">Seu carrinho está vazio. Adicione itens do cardápio.</p>
              <p class="mt-4 border-t border-line pt-4 text-[13px] text-ink-2">Vai ao cinema? Escolha um <a class="text-accent-ink underline underline-offset-4" routerLink="/" fragment="em-cartaz">filme e sessão</a> e adicione os combos junto com o ingresso.</p>
            }
          </div>
        </aside>
      }
    </div>
  `,
})
export class BombonierePage {
  protected store = inject(Store);
  protected readonly cinemas = CINEMAS;
  protected readonly arts = ['bucket', 'popcorn', 'drink', 'nachos'] as const;
  protected readonly brl = brl;
  protected stage = signal<'cart' | 'pay' | 'done'>('cart');
  protected pickup = signal('');
  protected where = computed(() => this.pickup() || this.store.cinema());
  protected order = signal<Order | null>(null);

  constructor() {
    inject(Seo).set({
      title: 'Bomboniere: pipoca, combos e bebidas | Starplex',
      description: `Cardápio da bomboniere Starplex: ${SNACKS.length} itens entre combos, pipoca salgada e doce, bebidas, nachos e chocolates. Peça e retire no balcão expresso. Compra simulada.`,
      path: '/bomboniere/',
    });
  }

  protected value(e: Event) {
    return (e.target as HTMLSelectElement).value;
  }

  protected paid() {
    this.order.set(this.store.addOrder({ kind: 'bomboniere', cinema: this.where(), tickets: [], snacks: this.store.cartLines(), fees: 0, total: this.store.cartTotal() }));
    this.store.cart.set({});
    this.stage.set('done');
    globalThis.scrollTo?.({ top: 0, behavior: 'smooth' });
  }
}
