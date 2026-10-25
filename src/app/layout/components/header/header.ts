import { Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@services/auth-service';

@Component({
  selector: 'copupitre-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  /** The router property. */
  readonly router = inject(Router);
  /** The authService property. */
  readonly authService = inject(AuthService);
  /** The mobile navigation menuOpen property. */
  readonly menuOpen = signal(false);
  /** Side profile drawer menu state. */
  readonly profileMenuOpen = signal(false);

  /** Executes the toggleMenu action. */
  toggleMenu() {
    this.menuOpen.update((v) => !v);
    if (this.menuOpen()) {
      this.profileMenuOpen.set(false);
    }
  }

  /** Executes the closeMenu action. */
  closeMenu() {
    this.menuOpen.set(false);
  }

  /** Toggles the profile side menu. */
  toggleProfileMenu() {
    this.profileMenuOpen.update((v) => !v);
    if (this.profileMenuOpen()) {
      this.menuOpen.set(false);
    }
  }

  /** Closes the profile side menu. */
  closeProfileMenu() {
    this.profileMenuOpen.set(false);
  }

  /** Closes all open menus. */
  closeAllMenus() {
    this.menuOpen.set(false);
    this.profileMenuOpen.set(false);
  }

  /** Executes the logout action. */
  logout() {
    this.authService.logout();
    this.closeProfileMenu();
    this.closeMenu();
    this.router.navigate(['/login']);
  }

  /** Closes any open drawer on Escape key press. */
  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.profileMenuOpen()) {
      this.closeProfileMenu();
    }
    if (this.menuOpen()) {
      this.closeMenu();
    }
  }
}
