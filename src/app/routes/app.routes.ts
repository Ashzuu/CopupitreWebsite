import { Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth-guard';
import { guestGuard } from '../core/guards/guest-guard';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('../features/dashboard/dashboard-page').then((m) => m.DashboardPage),
    title: 'Tableau de bord — Copupitre',
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('../features/login/login-page').then((m) => m.LoginPage),
    title: 'Connexion - Copupitre',
    canActivate: [guestGuard],
  },
  {
    path: 'organisations',
    loadComponent: () =>
      import('../features/organization/organization-list/organization-list-page').then(
        (m) => m.OrganizationListPage,
      ),
    title: 'Orchestres Partenaires - Copupitre',
  },
  {
    path: 'organization/:id',
    loadComponent: () =>
      import('../features/organization/organization-detail/organization-detail-page').then(
        (m) => m.OrganizationDetailPage,
      ),
    title: "Détails de l'organisation - Copupitre",
  },
  {
    path: 'renforts',
    loadComponent: () =>
      import('../features/reinforcements/reinforcements-list/reinforcements-list-page').then(
        (m) => m.ReinforcementsListPage,
      ),
    title: 'Annonces de Renforts - Copupitre',
  },
  {
    path: 'annonces/create',
    loadComponent: () =>
      import('../features/reinforcements/reinforcement-create/reinforcement-create-page').then(
        (m) => m.ReinforcementCreatePage,
      ),
    title: 'Créer une annonce - Copupitre',
    canActivate: [authGuard],
  },
  {
    path: 'organizations/create',
    loadComponent: () =>
      import('../features/organization/organization-create/organization-create-page').then(
        (m) => m.OrganizationCreatePage,
      ),
    title: 'Créer une organisation - Copupitre',
    canActivate: [authGuard],
  },
  {
    path: 'organizations/edit/:id',
    loadComponent: () =>
      import('../features/organization/organization-create/organization-create-page').then(
        (m) => m.OrganizationCreatePage,
      ),
    title: 'Modifier une organisation - Copupitre',
    canActivate: [authGuard],
  },
  {
    path: 'materiels',
    loadComponent: () =>
      import('../features/equipment/equipment-requests-list/equipment-requests-list-page').then(
        (m) => m.EquipmentRequestsListPage,
      ),
    title: 'Demandes de Matériel - Copupitre',
  },
  {
    path: 'materiel/create',
    loadComponent: () =>
      import('../features/equipment/equipment-request-create/equipment-request-create-page').then(
        (m) => m.EquipmentRequestCreatePage,
      ),
    title: 'Créer une demande de matériel - Copupitre',
    canActivate: [authGuard],
  },
];
