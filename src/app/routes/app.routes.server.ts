import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Client,
  },
  {
    path: 'dashboard',
    renderMode: RenderMode.Client,
  },
  {
    path: 'mes-candidatures',
    renderMode: RenderMode.Client,
  },
  {
    path: 'messagerie',
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
    path: 'organizations/edit/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'materiel/create',
    renderMode: RenderMode.Client,
  },
  {
    path: 'materiels',
    renderMode: RenderMode.Server,
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
    path: 'recrutements',
    renderMode: RenderMode.Server,
  },
  {
    path: 'organisations',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
