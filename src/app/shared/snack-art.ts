import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { SnackArt as Kind } from '../data/catalog';

// Flat illustrations for the snack bar (no product photos). 64x64 grid, palette from the brand.
@Component({
  selector: 'app-snack-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', class: 'block' },
  template: `
    <svg viewBox="0 0 64 64" class="h-full w-full" focusable="false" stroke-linejoin="round" stroke-linecap="round">
      @switch (kind()) {
        @case ('popcorn') {
          <circle cx="21" cy="21" r="6" fill="#FFE9CF" /><circle cx="29" cy="16" r="7" fill="#FFF3E3" />
          <circle cx="38" cy="17" r="6.5" fill="#FFE9CF" /><circle cx="45" cy="22" r="5" fill="#FFF3E3" />
          <circle cx="33" cy="23" r="5" fill="#FFD9B0" />
          <path d="M16 25h32l-4.5 32h-23Z" fill="#F4F1FB" />
          <path d="M22.5 25l2 32M32 25v32M41.5 25l-2 32" stroke="#EE7623" stroke-width="4" />
          <path d="M16 25h32" stroke="#AAA3C2" stroke-width="1.5" />
        }
        @case ('drink') {
          <path d="M34 19 38 6h6" fill="none" stroke="#FFE9CF" stroke-width="2.5" />
          <path d="M21 21h22l-3.5 35h-15Z" fill="#2A2244" stroke="#AAA3C2" stroke-width="1.5" />
          <rect x="19" y="17" width="26" height="5" rx="2" fill="#EE7623" />
          <path d="M23.5 33h17" stroke="#EE7623" stroke-width="4" />
          <path d="M24 41h16" stroke="#EE7623" stroke-width="1.5" opacity=".6" />
        }
        @case ('water') {
          <rect x="26" y="7" width="12" height="6" rx="1.5" fill="#5B8CFF" />
          <path d="M27 13h10v4l4 6v31a3 3 0 0 1-3 3H26a3 3 0 0 1-3-3V23l4-6Z" fill="#1D2A4D" stroke="#8FB0FF" stroke-width="1.5" />
          <rect x="23.8" y="31" width="16.4" height="11" fill="#5B8CFF" opacity=".75" />
          <path d="M29 19v8" stroke="#8FB0FF" stroke-width="2" opacity=".6" />
        }
        @case ('nachos') {
          <path d="M18 41 25 20l8 21Z" fill="#F8C411" />
          <path d="M28 41l9-24 8 24Z" fill="#FFD76B" />
          <path d="M38 41l6-15 7 15Z" fill="#F8C411" />
          <path d="M18 39c5 4 9-2 14 1s9-3 14 0" fill="none" stroke="#EE7623" stroke-width="4" />
          <path d="M10 41h44l-6 14H16Z" fill="#2A2244" stroke="#AAA3C2" stroke-width="1.5" />
        }
        @case ('chocolate') {
          <g transform="rotate(-14 32 33)">
            <rect x="18" y="12" width="28" height="42" rx="3" fill="#6B3A22" />
            <path d="M18 26h28M18 40h28M32 12v42" stroke="#4A2616" stroke-width="2" />
            <path d="M16 32h32v24a2 2 0 0 1-2 2H18a2 2 0 0 1-2-2Z" fill="#EE7623" />
            <path d="M16 32l4 3 4-3 4 3 4-3 4 3 4-3 4 3 4-3" fill="none" stroke="#FFB27A" stroke-width="1.5" />
          </g>
        }
        @case ('candy') {
          <path d="M9 23l12 9-12 9Z" fill="#FF78AA" />
          <path d="M55 23 43 32l12 9Z" fill="#FF78AA" />
          <circle cx="32" cy="32" r="13" fill="#EE7623" />
          <path d="M24 25c6 2 10 8 14 15M30 20c5 3 9 9 11 17" fill="none" stroke="#FFE9CF" stroke-width="2.5" opacity=".85" />
        }
        @case ('combo') {
          <g transform="translate(-9 4) scale(.9)">
          <circle cx="21" cy="21" r="6" fill="#FFE9CF" /><circle cx="29" cy="16" r="7" fill="#FFF3E3" />
          <circle cx="38" cy="17" r="6.5" fill="#FFE9CF" /><circle cx="45" cy="22" r="5" fill="#FFF3E3" />
          <circle cx="33" cy="23" r="5" fill="#FFD9B0" />
          <path d="M16 25h32l-4.5 32h-23Z" fill="#F4F1FB" />
          <path d="M22.5 25l2 32M32 25v32M41.5 25l-2 32" stroke="#EE7623" stroke-width="4" />
          <path d="M16 25h32" stroke="#AAA3C2" stroke-width="1.5" />
          </g>
          <g transform="translate(30 18) scale(.62)">
            <path d="M34 19 38 6h6" fill="none" stroke="#FFE9CF" stroke-width="3" />
            <path d="M21 21h22l-3.5 35h-15Z" fill="#2A2244" stroke="#AAA3C2" stroke-width="2" />
            <rect x="19" y="17" width="26" height="5" rx="2" fill="#EE7623" />
            <path d="M23.5 33h17" stroke="#EE7623" stroke-width="5" />
          </g>
        }
        @case ('bucket') {
          <circle cx="20" cy="17" r="6" fill="#FFE9CF" /><circle cx="28" cy="12" r="7" fill="#FFF3E3" />
          <circle cx="37" cy="13" r="6.5" fill="#FFE9CF" /><circle cx="45" cy="18" r="5.5" fill="#FFF3E3" />
          <circle cx="32" cy="19" r="5" fill="#FFD9B0" />
          <path d="M13 21h38l-5 36H18Z" fill="#1B1530" stroke="#EE7623" stroke-width="2" />
          <path d="M13 21h38" stroke="#FFB27A" stroke-width="3" />
          <path d="M23 49 30 30l3 6-4 3 9-2Z" fill="#EE7623" />
          <path d="m41 31 1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" fill="#FFB27A" />
        }
      }
    </svg>
  `,
})
export class SnackArt {
  kind = input.required<Kind>();
}
