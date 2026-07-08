import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/service/auth-service';

@Component({
  selector: 'copupitre-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  /** The authService property. */
  readonly authService = inject(AuthService);
  /** The menuOpen property. */
  readonly menuOpen = signal(false);

  /** Executes the toggleMenu action. */
  toggleMenu() {
    this.menuOpen.update((v) => !v);
  }

  /** Executes the closeMenu action. */
  closeMenu() {
    this.menuOpen.set(false);
  }

  /** Executes the logout action. */
  logout() {
    this.authService.logout();
    this.closeMenu();
  }

}
