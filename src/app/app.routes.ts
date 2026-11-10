import { Routes } from '@angular/router';
import { Home } from './pages/home';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'filmes/:slug', loadComponent: () => import('./pages/movie').then((m) => m.MoviePage) },
  { path: 'sessao/:id', loadComponent: () => import('./pages/session').then((m) => m.SessionPage) },
  { path: 'bomboniere', loadComponent: () => import('./pages/bomboniere').then((m) => m.BombonierePage) },
  { path: 'cinemas', loadComponent: () => import('./pages/cinemas').then((m) => m.CinemasPage) },
  { path: 'meus-ingressos', loadComponent: () => import('./pages/orders').then((m) => m.OrdersPage) },
  { path: '**', loadComponent: () => import('./pages/not-found').then((m) => m.NotFoundPage) },
];
