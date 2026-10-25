import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '@services/auth-service';
import { InAppNotificationService } from '@services/in-app-notification-service';
import { ConversationService } from '@services/conversation-service';
import { ConversationModal } from '../../../core/components/conversation-modal/conversation-modal';
import { InAppNotification } from '@models/index';

@Component({
  selector: 'copupitre-header',
  imports: [RouterLink, DatePipe, ConversationModal],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class Header implements OnInit {
  /** The router property. */
  readonly router = inject(Router);
  /** The authService property. */
  readonly authService = inject(AuthService);
  /** The inAppNotificationService property (US-COM-02). */
  readonly notifService = inject(InAppNotificationService);
  /** The conversationService property (US-COM-03 & US-COM-04). */
  readonly conversationService = inject(ConversationService);

  /** The mobile navigation menuOpen property. */
  readonly menuOpen = signal(false);
  /** Side profile drawer menu state. */
  readonly profileMenuOpen = signal(false);

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.notifService.refreshUnreadCount();
    }
  }

  /** Executes the toggleMenu action. */
  toggleMenu() {
    this.menuOpen.update((v) => !v);
    if (this.menuOpen()) {
      this.profileMenuOpen.set(false);
      this.notifService.closePanel();
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
      this.notifService.closePanel();
    }
  }

  /** Closes the profile side menu. */
  closeProfileMenu() {
    this.profileMenuOpen.set(false);
  }

  /** Toggles the notification panel (US-COM-02). */
  toggleNotificationPanel() {
    this.notifService.togglePanel();
    if (this.notifService.isOpen()) {
      this.menuOpen.set(false);
      this.profileMenuOpen.set(false);
    }
  }

  /** Closes the notification panel. */
  closeNotificationPanel() {
    this.notifService.closePanel();
  }

  /** Clic sur une notification : marquer comme lue pour toujours et ouvrir la conversation liée. */
  async onNotificationClick(notif: InAppNotification) {
    // 1. Marquer comme lue immédiatement et de façon persistante
    await this.notifService.markAsRead(notif);
    this.closeAllMenus();

    // 2. Déterminer le contexte de conversation (propriété directe ou extraction URL)
    let contextType = notif.contextType;
    let contextId = notif.contextId;

    if ((!contextType || !contextId) && notif.link) {
      const matchType = notif.link.match(/[?&]contextType=([^&]+)/);
      const matchId = notif.link.match(/[?&]contextId=([^&]+)/);
      if (matchType && matchId) {
        contextType = decodeURIComponent(matchType[1]);
        contextId = Number(decodeURIComponent(matchId[1]));
      }
    }

    // 3. Ouvrir directement la conversation si le contexte existe
    if (contextType && contextId) {
      this.conversationService.open({
        contextType,
        contextId: Number(contextId),
        title: notif.title || 'Fil de discussion',
        subtitle: notif.content || '',
      });
    }

    // 4. Naviguer vers la page liée
    if (notif.link) {
      this.router.navigateByUrl(notif.link);
    }
  }

  /** Closes all open menus. */
  closeAllMenus() {
    this.menuOpen.set(false);
    this.profileMenuOpen.set(false);
    this.notifService.closePanel();
  }

  /** Executes the logout action. */
  logout() {
    this.authService.logout();
    this.closeProfileMenu();
    this.closeMenu();
    this.notifService.closePanel();
    this.conversationService.close();
    this.router.navigate(['/login']);
  }

  /** Closes any open drawer on Escape key press. */
  onEscape() {
    if (this.conversationService.isOpen()) {
      this.conversationService.close();
    }
    if (this.profileMenuOpen()) {
      this.closeProfileMenu();
    }
    if (this.notifService.isOpen()) {
      this.notifService.closePanel();
    }
    if (this.menuOpen()) {
      this.closeMenu();
    }
  }
}
