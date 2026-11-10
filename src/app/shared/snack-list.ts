import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { SNACKS, SNACK_CATS, brl } from '../data/catalog';
import { Icon } from './icon';
import { SnackArt } from './snack-art';
import { Store } from './store';

/** Snack catalogue with +/- steppers bound to the shared cart. */
@Component({
  selector: 'app-snack-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, SnackArt],
  host: { class: 'block' },
  template: `
    <div class="no-bar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Categoria">
      <button type="button" class="pill" [attr.aria-pressed]="!cat()" (click)="cat.set('')">Tudo</button>
      @for (c of cats; track c) {
        <button type="button" class="pill" [attr.aria-pressed]="cat() === c" (click)="cat.set(c)">{{ c }}</button>
      }
    </div>
    <ul class="mt-6 grid grid-cols-1 gap-4" [class]="cols() > 2 ? 'sm:grid-cols-2 xl:grid-cols-3' : cols() > 1 ? 'sm:grid-cols-2' : ''">
      @for (s of list(); track s.id) {
        <li class="panel flex gap-3 p-4 sm:gap-4">
          <app-snack-art [kind]="s.art" class="size-14 shrink-0 rounded-[10px] bg-well p-1.5 sm:size-20 sm:p-2" />
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-2">
              <h3 class="text-[15px] font-medium leading-snug tracking-tight">{{ s.name }}</h3>
              @if (s.tag) { <span class="chip shrink-0 !text-[11px]">{{ s.tag }}</span> }
            </div>
            <p class="mt-0.5 text-[13px] text-ink-2">{{ s.desc }}</p>
            <ul class="mt-3 grid gap-2">
              @for (v of s.variants; track v.id) {
                @let q = store.cart()[v.id] || 0;
                <li class="flex items-center justify-between gap-3">
                  <span class="text-[13px]">
                    @if (s.variants.length > 1) { <span class="mr-1.5 font-mono text-ink-2">{{ v.label }}</span> }
                    <span class="font-mono">{{ brl(v.price) }}</span>
                  </span>
                  <span class="flex items-center gap-1" role="group" [attr.aria-label]="label(s.name, v.label, s.variants.length)">
                    <button type="button" class="grid size-9 place-items-center rounded-[9px] border border-line text-ink-2 hover:border-accent hover:text-ink disabled:opacity-30"
                            [disabled]="!q" (click)="store.setQty(v.id, q - 1)" [attr.aria-label]="'Remover ' + label(s.name, v.label, s.variants.length)">
                      <app-icon name="minus" [size]="16" />
                    </button>
                    <output class="w-7 text-center font-mono text-[14px]" [class.text-accent-ink]="q" aria-live="polite">{{ q }}</output>
                    <button type="button" class="grid size-9 place-items-center rounded-[9px] border border-line text-ink hover:border-accent hover:bg-chip"
                            (click)="store.setQty(v.id, q + 1)" [attr.aria-label]="'Adicionar ' + label(s.name, v.label, s.variants.length)">
                      <app-icon name="plus" [size]="16" />
                    </button>
                  </span>
                </li>
              }
            </ul>
          </div>
        </li>
      }
    </ul>
  `,
})
export class SnackList {
  cols = input(2);
  protected store = inject(Store);
  protected readonly cats = SNACK_CATS;
  protected readonly brl = brl;
  protected cat = signal('');
  protected list = computed(() => (this.cat() ? SNACKS.filter((s) => s.cat === this.cat()) : SNACKS));
  protected label = (name: string, v: string, n: number) => (n > 1 ? `${name} ${v}` : name);
}
