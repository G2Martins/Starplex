import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../shared/icon';
import { Mark } from '../shared/logo';
import { Seo } from '../shared/seo';
import { Store } from '../shared/store';
import { Ticket } from '../shared/ticket';

@Component({
  selector: 'app-orders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Mark, Ticket],
  template: `
    <section class="wrap pt-12 sm:pt-16">
      <p class="eyebrow">Sua conta neste navegador</p>
      <h1 class="h-display mt-4 text-5xl sm:text-6xl">Meus ingressos</h1>
      <p class="mt-4 max-w-xl text-ink-2">Pedidos ficam salvos apenas no armazenamento local deste navegador. Nada é enviado para servidores.</p>
    </section>

    <section class="wrap mt-10">
      @if (store.ready()) {
        @if (store.orders().length) {
          <div class="no-bar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filtrar pedidos">
            @for (f of filters; track f.id) {
              <button type="button" class="pill" [attr.aria-pressed]="filter() === f.id" (click)="filter.set(f.id)">{{ f.label }}</button>
            }
          </div>
          <ul class="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
            @for (o of list(); track o.id) {
              <li>
                <app-ticket [order]="o" />
                <div class="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-[13px] text-ink-2">
                  <span>Pedido em {{ when(o.createdAt) }}</span>
                  @if (o.status === 'confirmado') {
                    @if (confirming() === o.id) {
                      <span class="flex items-center gap-2" role="group" aria-label="Confirmar cancelamento">
                        <span>Cancelar este pedido?</span>
                        <button type="button" class="btn btn-line !min-h-9 !px-3 text-[13px] text-danger" (click)="cancel(o.id)">Sim, cancelar</button>
                        <button type="button" class="btn btn-ghost !min-h-9 !px-3 text-[13px]" (click)="confirming.set(null)">Não</button>
                      </span>
                    } @else {
                      <button type="button" class="btn btn-ghost !min-h-9 !px-3 text-[13px]" (click)="confirming.set(o.id)"><app-icon name="x" [size]="15" />Cancelar (simulado)</button>
                    }
                  }
                </div>
              </li>
            } @empty {
              <li class="text-ink-2">Nenhum pedido nesta categoria.</li>
            }
          </ul>
        } @else {
          <div class="card dotgrid grid place-items-center px-6 py-16 text-center">
            <app-mark [size]="56" />
            <h2 class="mt-6 text-2xl font-medium tracking-tight">Você ainda não tem ingressos</h2>
            <p class="mt-2 max-w-sm text-ink-2">Escolha um filme, uma sessão e seus assentos. A compra é simulada e fica salva aqui.</p>
            <div class="mt-8 flex flex-wrap justify-center gap-3">
              <a class="btn btn-primary" routerLink="/" fragment="em-cartaz"><app-icon name="ticket" [size]="18" />Ver filmes em cartaz</a>
              <a class="btn btn-line" routerLink="/bomboniere">Pedir na bomboniere</a>
            </div>
          </div>
        }
      } @else {
        <div class="h-64 rounded-[14px] bg-surface" aria-busy="true"><span class="sr-only">Carregando pedidos</span></div>
      }
    </section>
  `,
})
export class OrdersPage {
  protected store = inject(Store);
  protected readonly filters = [
    { id: '', label: 'Todos' },
    { id: 'ingresso', label: 'Ingressos' },
    { id: 'bomboniere', label: 'Bomboniere' },
  ];
  protected filter = signal('');
  protected confirming = signal<string | null>(null);
  protected list = computed(() => this.store.orders().filter((o) => !this.filter() || o.kind === this.filter()));
  private fmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

  constructor() {
    inject(Seo).set({ title: 'Meus ingressos | Starplex', description: 'Seus ingressos e pedidos da bomboniere Starplex, salvos neste navegador. Compras simuladas.', path: '/meus-ingressos/', noindex: true });
  }

  protected when = (iso: string) => this.fmt.format(new Date(iso));

  protected cancel(id: string) {
    this.store.cancel(id);
    this.confirming.set(null);
  }
}
