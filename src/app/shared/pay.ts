import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { brl } from '../data/catalog';
import { rng } from '../data/sessions';
import { Icon } from './icon';
import { Mark } from './logo';

/**
 * Simulated Pix checkout. Collects nothing: no card fields, no personal data.
 * The "QR" is decorative and deliberately unreadable (only two finder patterns, random modules).
 */
@Component({
  selector: 'app-pay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, Mark],
  host: { class: 'block' },
  template: `
    <div class="card p-5 sm:p-7">
      <p class="eyebrow">Pagamento</p>
      <div class="mt-5 flex items-center gap-3 rounded-[11px] border border-accent/60 bg-chip px-4 py-3">
        <span class="grid size-5 place-items-center rounded-full border-2 border-accent" aria-hidden="true"><span class="size-2 rounded-full bg-accent"></span></span>
        <span class="text-[15px] font-medium">Pix (simulação)</span>
        <span class="ml-auto font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">Único método</span>
      </div>

      <div class="mt-6 grid items-center gap-6 sm:grid-cols-[auto_1fr]">
        <div class="relative mx-auto size-44 rounded-[12px] bg-[#f4f1fb] p-3" role="img" aria-label="QR code decorativo, não pode ser lido">
          <svg viewBox="0 0 25 25" class="h-full w-full" shape-rendering="crispEdges" aria-hidden="true">
            <path [attr.d]="qr()" fill="#0f0b1a" />
          </svg>
          <span class="absolute bottom-3 left-3 grid size-[2.15rem] place-items-center rounded-[6px] bg-[#0f0b1a]"><app-mark [size]="24" /></span>
          <span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[5px] bg-accent px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-on-accent">Demo</span>
        </div>
        <div>
          <p class="mono-label">Total a pagar</p>
          <p class="mt-1 text-3xl font-medium tracking-tight">{{ brl(total()) }}</p>
          <p class="mt-4 flex gap-2.5 rounded-[10px] border border-line bg-well px-3.5 py-3 text-[13px] text-ink-2">
            <app-icon name="shield" [size]="18" class="text-ok" />
            <span><strong class="font-medium text-ink">Simulação: nenhuma cobrança é feita.</strong> Nenhum dado de pagamento ou pessoal é coletado. O QR code acima é decorativo.</span>
          </p>
        </div>
      </div>

      <button type="button" class="btn btn-primary mt-7 w-full !min-h-12 text-[15px]" [disabled]="busy()" (click)="pay()">
        @if (busy()) {
          <span class="spin size-4 rounded-full border-2 border-on-accent/30 border-t-on-accent" aria-hidden="true"></span>Confirmando pagamento simulado
        } @else {
          <app-icon name="check" [size]="18" />Simular pagamento
        }
      </button>
      <p class="sr-only" aria-live="polite">{{ busy() ? 'Processando pagamento simulado' : '' }}</p>
    </div>
  `,
})
export class Pay {
  total = input.required<number>();
  seed = input('starplex');
  paid = output<void>();
  protected busy = signal(false);
  protected readonly brl = brl;

  protected qr = computed(() => {
    const r = rng(this.seed());
    const finder = (x: number, y: number) => `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`;
    let d = finder(0, 0) + finder(18, 0);
    for (let y = 0; y < 25; y++)
      for (let x = 0; x < 25; x++) {
        const corner = (y < 8 && (x < 8 || x > 16)) || (y > 16 && x < 8);
        if (!corner && r() < 0.48) d += `M${x} ${y}h1v1h-1z`;
      }
    return d;
  });

  protected pay() {
    this.busy.set(true);
    setTimeout(() => this.paid.emit(), 1400);
  }
}
