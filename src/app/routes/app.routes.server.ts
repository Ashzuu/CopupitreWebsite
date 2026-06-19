import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'organization/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'renforts',
    renderMode: RenderMode.Server,
  },
  {
    path: 'annonces/create',
    renderMode: RenderMode.Server,
  },
  {
    path: 'organizations/create',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
