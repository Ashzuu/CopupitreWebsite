import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'dashboard',
    renderMode: RenderMode.Client,
  },
  {
    path: 'login',
    renderMode: RenderMode.Client,
  },
  {
    path: 'annonces/create',
    renderMode: RenderMode.Client,
  },
  {
    path: 'organizations/create',
    renderMode: RenderMode.Client,
  },
  {
    path: 'materiel/create',
    renderMode: RenderMode.Client,
  },
  {
    path: 'organization/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'renforts',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
