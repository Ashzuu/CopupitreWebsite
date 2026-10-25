import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { Header } from './header';
import { AuthService } from '@services/auth-service';
import { InAppNotificationService } from '@services/in-app-notification-service';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let authService: AuthService;

  const isAuthenticatedSignal = signal(true);
  const currentUsernameSignal = signal<string | null>('alex_trombone');
  const currentUserFullNameSignal = signal<string>('Alex Trombone');

  const mockAuthService = {
    isAuthenticated: isAuthenticatedSignal,
    currentUsername: currentUsernameSignal,
    currentUserFullName: currentUserFullNameSignal,
    currentUserProfile: signal(null),
    logout: vi.fn(),
  };

  const mockNotifService = {
    notifications: signal([]),
    unreadCount: signal(2),
    isOpen: signal(false),
    isLoading: signal(false),
    loadNotifications: vi.fn(),
    refreshUnreadCount: vi.fn(),
    togglePanel: vi.fn(),
    closePanel: vi.fn(),
    markAsRead: vi.fn().mockResolvedValue(undefined),
    markAllAsRead: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    isAuthenticatedSignal.set(true);
    currentUsernameSignal.set('alex_trombone');
    currentUserFullNameSignal.set('Alex Trombone');
    mockAuthService.logout.mockClear();
    mockNotifService.togglePanel.mockClear();
    mockNotifService.closePanel.mockClear();
    mockNotifService.refreshUnreadCount.mockClear();

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([{ path: 'login', component: class {} as any }]),
        provideHttpClient(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: InAppNotificationService, useValue: mockNotifService },
      ],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('devrait être créé avec succès', () => {
    expect(component).toBeTruthy();
  });

  describe('Menu latéral du profil (Drawer)', () => {
    it('devrait basculer l\'état du menu profil via toggleProfileMenu()', () => {
      expect(component.profileMenuOpen()).toBe(false);

      component.toggleProfileMenu();
      expect(component.profileMenuOpen()).toBe(true);

      component.toggleProfileMenu();
      expect(component.profileMenuOpen()).toBe(false);
    });

    it('devrait fermer le menu profil via closeProfileMenu()', () => {
      component.profileMenuOpen.set(true);
      component.closeProfileMenu();
      expect(component.profileMenuOpen()).toBe(false);
    });

    it('devrait fermer tous les menus via closeAllMenus()', () => {
      component.menuOpen.set(true);
      component.profileMenuOpen.set(true);

      component.closeAllMenus();
      expect(component.menuOpen()).toBe(false);
      expect(component.profileMenuOpen()).toBe(false);
      expect(mockNotifService.closePanel).toHaveBeenCalled();
    });

    it('devrait fermer le menu principal lors de l\'ouverture du menu profil', () => {
      component.menuOpen.set(true);
      component.toggleProfileMenu();

      expect(component.profileMenuOpen()).toBe(true);
      expect(component.menuOpen()).toBe(false);
    });

    it('devrait fermer les menus lors de l\'appui sur la touche Escape', () => {
      component.profileMenuOpen.set(true);
      component.menuOpen.set(true);
      mockNotifService.isOpen.set(true);

      component.onEscape();
      expect(component.profileMenuOpen()).toBe(false);
      expect(component.menuOpen()).toBe(false);
      expect(mockNotifService.closePanel).toHaveBeenCalled();
    });

    it('devrait déconnecter l\'utilisateur et fermer le menu profil lors de logout()', () => {
      component.profileMenuOpen.set(true);
      component.logout();

      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(component.profileMenuOpen()).toBe(false);
    });

    it('devrait afficher le lien Mes candidatures dans le menu profil', () => {
      component.profileMenuOpen.set(true);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const candidaturesLink = compiled.querySelector('a[routerLink="/mes-candidatures"]');
      expect(candidaturesLink).toBeTruthy();
      expect(candidaturesLink?.textContent).toContain('Mes candidatures');
    });

    it('devrait afficher le lien Messagerie dans le menu profil', () => {
      component.profileMenuOpen.set(true);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const messagerieLink = compiled.querySelector('a[routerLink="/messagerie"]');
      expect(messagerieLink).toBeTruthy();
      expect(messagerieLink?.textContent).toContain('Messagerie');
    });
  });

  describe('Notifications in-app (US-COM-02)', () => {
    it('devrait rafraîchir le nombre de notifications au chargement si authentifié', () => {
      expect(mockNotifService.refreshUnreadCount).toHaveBeenCalled();
    });

    it('devrait basculer le panneau de notifications via toggleNotificationPanel()', () => {
      component.toggleNotificationPanel();
      expect(mockNotifService.togglePanel).toHaveBeenCalled();
    });

    it('devrait fermer le panneau de notifications via closeNotificationPanel()', () => {
      component.closeNotificationPanel();
      expect(mockNotifService.closePanel).toHaveBeenCalled();
    });

    it('devrait marquer la notification comme lue et ouvrir la conversation liée au clic', async () => {
      const openSpy = vi.spyOn(component.conversationService, 'open');
      const navigateSpy = vi.spyOn(component.router, 'navigateByUrl').mockResolvedValue(true);

      const notif = {
        id: 1,
        type: 'NEW_MESSAGE',
        title: 'Nouveau message de Julien',
        content: 'Je suis disponible',
        contextType: 'APPLICATION',
        contextId: 10,
        isRead: false,
        createdAt: '2026-10-25T15:00:00Z',
        link: '/mes-candidatures?contextType=APPLICATION&contextId=10',
      };

      await component.onNotificationClick(notif);

      expect(mockNotifService.markAsRead).toHaveBeenCalledWith(notif);
      expect(openSpy).toHaveBeenCalledWith({
        contextType: 'APPLICATION',
        contextId: 10,
        title: 'Nouveau message de Julien',
        subtitle: 'Je suis disponible',
      });
      expect(navigateSpy).toHaveBeenCalledWith('/mes-candidatures?contextType=APPLICATION&contextId=10');
    });

    it('devrait extraire contextType et contextId depuis le link si absents de l\'objet', async () => {
      const openSpy = vi.spyOn(component.conversationService, 'open');
      vi.spyOn(component.router, 'navigateByUrl').mockResolvedValue(true);

      const notif = {
        id: 2,
        type: 'NEW_MESSAGE',
        title: 'Message prêt',
        content: 'Disponible pour prêt',
        isRead: false,
        createdAt: '2026-10-25T15:00:00Z',
        link: '/materiels?contextType=EQUIPMENT&contextId=55',
      };

      await component.onNotificationClick(notif);

      expect(mockNotifService.markAsRead).toHaveBeenCalledWith(notif);
      expect(openSpy).toHaveBeenCalledWith({
        contextType: 'EQUIPMENT',
        contextId: 55,
        title: 'Message prêt',
        subtitle: 'Disponible pour prêt',
      });
    });
  });
});
