import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Seo } from '../shared/seo';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="wrap py-24 text-center">
      <p class="eyebrow justify-center">Erro 404</p>
      <h1 class="h-display mt-4 text-5xl sm:text-6xl">Esta sala está <span class="grad">vazia</span></h1>
      <p class="mt-4 text-ink-2">A página que você procura não existe ou mudou de endereço.</p>
      <a class="btn btn-primary mt-8" routerLink="/">Ver filmes em cartaz</a>
    </section>
  `,
})
export class NotFoundPage {
  constructor() {
    inject(Seo).set({ title: 'Página não encontrada | Starplex', description: 'Esta página não existe no Starplex.', path: '/', noindex: true });
  }
}
