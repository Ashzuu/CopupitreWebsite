import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { Header } from './header';
import { AuthService } from '@services/auth-service';

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

  beforeEach(async () => {
    isAuthenticatedSignal.set(true);
    currentUsernameSignal.set('alex_trombone');
    currentUserFullNameSignal.set('Alex Trombone');
    mockAuthService.logout.mockClear();

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: AuthService, useValue: mockAuthService },
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

      component.onEscape();
      expect(component.profileMenuOpen()).toBe(false);
      expect(component.menuOpen()).toBe(false);
    });

    it('devrait déconnecter l\'utilisateur et fermer le menu profil lors de logout()', () => {
      component.profileMenuOpen.set(true);
      component.logout();

      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(component.profileMenuOpen()).toBe(false);
    });
  });
});
