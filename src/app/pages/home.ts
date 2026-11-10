import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CINEMAS, CITY, FORMATS, GENRES, NOW, SNACKS, SOON, brl, imgSrcset, imgUrl, runtimeLabel, type Format, type Movie,
} from '../data/catalog';
import { movieCinemas, movieFormats } from '../data/sessions';
import { Icon } from '../shared/icon';
import { Cert, MovieCard, Poster } from '../shared/movie-card';
import { Reveal } from '../shared/reveal';
import { Seo } from '../shared/seo';
import { SnackArt } from '../shared/snack-art';
import { Store } from '../shared/store';
import { Trailer } from '../shared/trailer';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Cert, MovieCard, Poster, Reveal, SnackArt, Trailer],
  templateUrl: './home.html',
})
export class Home {
  protected store = inject(Store);
  protected readonly now = NOW;
  protected readonly soon = SOON;
  protected readonly featured = NOW.filter((m) => m.backdropPath).slice(0, 4);
  protected readonly genres = GENRES;
  protected readonly formats = FORMATS;
  protected readonly cinemas = CINEMAS;
  protected readonly city = CITY;
  protected readonly combo = SNACKS[0];
  protected readonly extras = SNACKS.filter((s) => ['pipoca-doce', 'refri', 'nachos'].includes(s.id));
  protected readonly ticker = [...NOW, ...NOW].map((m) => m.title);
  protected readonly steps = [
    ['Escolha o filme', 'Filtre por gênero, formato e cinema. Cada filme tem sinopse, elenco e trailer.'],
    ['Sessão e assento', 'Datas dos próximos 7 dias e um mapa da sala com PCD, namoradeira e VIP.'],
    ['Bomboniere', 'Combos, pipoca e bebidas para retirar no balcão expresso, sem fila.'],
    ['Pagamento simulado', 'Pix de demonstração. Nenhuma cobrança é feita e nenhum dado é coletado.'],
  ];
  protected readonly brl = brl;
  protected readonly runtime = runtimeLabel;
  protected readonly cinemaFormats = (id: string) => [...new Set(CINEMAS.find((c) => c.id === id)!.rooms.map((r) => r.format))];

  protected pick = signal(0);
  protected hero = computed(() => this.featured[this.pick()] ?? NOW[0]);
  protected genre = signal('');
  protected format = signal<Format | ''>('');
  protected trailer = signal<Movie | null>(null);
  private dialog = viewChild<ElementRef<HTMLDialogElement>>('dlg');

  protected list = computed(() => {
    const g = this.genre(), f = this.format(), c = this.store.cinema();
    return NOW.filter((m) =>
      (!g || m.genres.includes(g)) && (!f || movieFormats(m).includes(f)) && (!c || movieCinemas(m).includes(c)),
    );
  });

  constructor() {
    inject(Seo).set({
      title: 'Starplex | Cinema em Brasília: filmes em cartaz, sessões e ingressos',
      description:
        'Veja os filmes em cartaz no Starplex, escolha sessão e assento, monte seu combo na bomboniere e simule a compra do ingresso. Projeto de portfólio, compras simuladas.',
      path: '/',
    });
  }

  protected backdrop(m: Movie) {
    return m.backdropPath ? { src: imgUrl(m.backdropPath, 'backdrop', true), set: imgSrcset(m.backdropPath, 'backdrop') } : null;
  }

  protected openTrailer(m: Movie) {
    this.trailer.set(m);
    this.dialog()?.nativeElement.showModal();
  }

  protected clear() {
    this.genre.set('');
    this.format.set('');
    this.store.cinema.set('');
  }

  protected value(e: Event) {
    return (e.target as HTMLSelectElement).value;
  }
}
