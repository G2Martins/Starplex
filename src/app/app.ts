import { ChangeDetectionStrategy, Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AUTHOR, CINEMAS, CITY, PORTFOLIO_URL, PROJECT_URL, REPO_URL } from './data/catalog';
import { Icon } from './shared/icon';
import { Logo } from './shared/logo';
import { Store } from './shared/store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App {
  protected store = inject(Store);
  protected menuOpen = signal(false);
  protected readonly cinemas = CINEMAS;
  protected readonly city = CITY;
  protected readonly author = AUTHOR;
  protected readonly portfolio = PORTFOLIO_URL;
  protected readonly project = PROJECT_URL;
  protected readonly repo = REPO_URL;
  protected readonly year = new Date().getFullYear();
  protected readonly nav = [
    { path: '/', label: 'Filmes', exact: true },
    { path: '/cinemas', label: 'Cinemas', exact: false },
    { path: '/bomboniere', label: 'Bomboniere', exact: false },
    { path: '/meus-ingressos', label: 'Meus ingressos', exact: false },
  ];
  /** Cart goes back to the seats on hold, or to the snack bar cart. */
  protected cartLink = computed(() => {
    const h = this.store.hold();
    return h?.seats.length ? ['/sessao', h.sessionId] : ['/bomboniere'];
  });

  constructor() {
    afterNextRender(() => this.store.load());
    inject(Router).events.subscribe((e) => e instanceof NavigationEnd && this.menuOpen.set(false));
  }

  protected pickCinema(e: Event) {
    this.store.cinema.set((e.target as HTMLSelectElement).value);
  }
}
