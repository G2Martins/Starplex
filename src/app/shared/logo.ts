import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// The Starplex mark: an orange "A" with a shooting star (redrawn from the original PNG).
@Component({
  selector: 'app-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', class: 'inline-block' },
  template: `
    <svg viewBox="70 108 362 282" [attr.width]="size()" [attr.height]="size() * 0.78" focusable="false">
      <path fill="#EE7623" d="M75 383 232 115l51 81-39 33 148-41-247 159Z" />
      <path fill="#EE7623" d="m243 370 79-75 70-107-59 99 47 83Z" />
      <path fill="#FFB27A" d="m400 158 5 20 20 5-20 5-5 20-5-20-19-5 19-5Z" />
    </svg>
  `,
})
export class Mark {
  size = input(32);
}

/** Wordmark "ST[mark]RPLEX", the mark replaces the A like the original logo. */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Mark],
  host: { class: 'inline-flex items-end font-extrabold tracking-[-0.02em] leading-none text-ink' },
  template: `
    <span aria-hidden="true">ST</span><app-mark [size]="size()" class="-mx-[0.08em] translate-y-[0.06em]" /><span aria-hidden="true">RPLEX</span>
    <span class="sr-only">Starplex, página inicial</span>
  `,
})
export class Logo {
  size = input(26);
}
