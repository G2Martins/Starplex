import { RenderMode, ServerRoute } from '@angular/ssr';
import { MOVIES } from './data/catalog';

// Static GitHub Pages: catalogue pages are prerendered, the booking flow and the
// localStorage-backed pages render in the browser (404.html = index.csr.html serves deep links).
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'filmes/:slug', renderMode: RenderMode.Prerender, getPrerenderParams: async () => MOVIES.map((m) => ({ slug: m.slug })) },
  { path: 'bomboniere', renderMode: RenderMode.Prerender },
  { path: 'cinemas', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
