import { DatePipe, LowerCasePipe } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BaseLayout } from '@layouts/base-layout/base-layout';
import { ChatMessage, Conversation } from '@models/index';
import { MessagingRepository } from '@repositories/messaging-repository';
import { LoggerService } from '@services/logger-service';
import { NotifService } from '@services/notif-service';
import { firstValueFrom } from 'rxjs';

export type ConversationFilter = 'ALL' | 'APPLICATION' | 'ANNUAL_APPLICATION' | 'EQUIPMENT';

@Component({
  selector: 'copupitre-messaging-page',
  imports: [BaseLayout, FormsModule, DatePipe, LowerCasePipe],
  templateUrl: './messaging-page.html',
  styleUrl: './messaging-page.scss',
})
export class MessagingPage implements OnInit {
  private readonly messagingRepo = inject(MessagingRepository);
  private readonly notifService = inject(NotifService);
  private readonly logger = inject(LoggerService);
  private readonly route = inject(ActivatedRoute);

  /** Loading state for conversation list. */
  loading = signal<boolean>(true);

  /** All user conversations. */
  conversations = signal<Conversation[]>([]);

  /** Filter by category tab. */
  activeTab = signal<ConversationFilter>('ALL');

  /** Search text filter. */
  searchTerm = signal<string>('');

  /** Currently selected conversation. */
  selectedConversation = signal<Conversation | null>(null);

  /** Messages of the active conversation. */
  messages = signal<ChatMessage[]>([]);

  /** Loading state for active conversation messages. */
  loadingMessages = signal<boolean>(false);

  /** Sending state for new message. */
  sendingMessage = signal<boolean>(false);

  /** New message input content. */
  newMessageText = signal<string>('');

  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;

  /** Filtered list of conversations based on tab and search text. */
  filteredConversations = computed<Conversation[]>(() => {
    const list = this.conversations();
    const tab = this.activeTab();
    const query = this.searchTerm().trim().toLowerCase();

    return list.filter((conv) => {
      // Tab filter
      if (tab !== 'ALL' && conv.contextType !== tab) {
        return false;
      }
      // Query filter
      if (query) {
        const matchesTitle = conv.title?.toLowerCase().includes(query) ?? false;
        const matchesSubtitle = conv.subtitle?.toLowerCase().includes(query) ?? false;
        const matchesParty = conv.otherPartyName?.toLowerCase().includes(query) ?? false;
        const matchesLast = conv.lastMessage?.toLowerCase().includes(query) ?? false;
        return matchesTitle || matchesSubtitle || matchesParty || matchesLast;
      }
      return true;
    });
  });

  ngOnInit(): void {
    this.loadConversations();
  }

  async loadConversations(): Promise<void> {
    this.loading.set(true);
    try {
      const convs = await firstValueFrom(this.messagingRepo.getConversations());
      this.conversations.set(convs || []);

      // Check query params to pre-select a specific conversation
      const queryParams = this.route.snapshot.queryParams;
      const paramContextType = queryParams['contextType'];
      const paramContextId = queryParams['contextId'] ? Number(queryParams['contextId']) : null;

      if (paramContextType && paramContextId) {
        const match = convs.find(
          (c) => c.contextType === paramContextType && c.contextId === paramContextId
        );
        if (match) {
          this.selectConversation(match);
        } else if (convs.length > 0) {
          this.selectConversation(convs[0]);
        }
      } else if (convs.length > 0 && !this.selectedConversation()) {
        this.selectConversation(convs[0]);
      }
    } catch (err) {
      this.logger.error('Failed to load conversations', 'MessagingPage', err);
      this.notifService.showError('Impossible de charger vos conversations.', 'Erreur');
    } finally {
      this.loading.set(false);
    }
  }

  async selectConversation(conv: Conversation): Promise<void> {
    this.selectedConversation.set(conv);
    this.messages.set([]);
    this.loadingMessages.set(true);

    try {
      const msgs = await firstValueFrom(
        this.messagingRepo.getMessages(conv.contextType, conv.contextId)
      );
      this.messages.set(msgs || []);
      this.scrollToBottom();
    } catch (err) {
      this.logger.error('Failed to load messages for conversation', 'MessagingPage', err);
      this.notifService.showError('Impossible de charger les messages.', 'Erreur');
    } finally {
      this.loadingMessages.set(false);
    }
  }

  deselectConversation(): void {
    this.selectedConversation.set(null);
  }

  async sendMessage(): Promise<void> {
    const conv = this.selectedConversation();
    const content = this.newMessageText().trim();

    if (!conv || !content || this.sendingMessage()) {
      return;
    }

    this.sendingMessage.set(true);
    try {
      const sent = await firstValueFrom(
        this.messagingRepo.sendMessage(conv.contextType, conv.contextId, content)
      );
      this.messages.update((prev) => [...prev, sent]);
      this.newMessageText.set('');

      // Update snippet & timestamp in conversation list
      this.conversations.update((list) => {
        const updated = list.map((item) => {
          if (item.id === conv.id) {
            return {
              ...item,
              lastMessage: sent.content,
              lastMessageAt: sent.createdAt,
              messageCount: (item.messageCount || 0) + 1,
            };
          }
          return item;
        });
        // Bring active conversation to top
        return updated.sort((a, b) => {
          const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return dateB - dateA;
        });
      });

      this.scrollToBottom();
    } catch (err) {
      this.logger.error('Failed to send message', 'MessagingPage', err);
      this.notifService.showError("Impossible d'envoyer votre message.", 'Erreur');
    } finally {
      this.sendingMessage.set(false);
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer?.nativeElement) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }

  getContextBadgeLabel(type: string): string {
    switch (type) {
      case 'APPLICATION':
        return 'Renfort';
      case 'ANNUAL_APPLICATION':
        return 'Permanent';
      case 'EQUIPMENT':
        return 'Matériel';
      default:
        return 'Discussion';
    }
  }

  getStatusBadgeClass(status?: string): string {
    switch (status?.toUpperCase()) {
      case 'ACCEPTED':
      case 'VALIDATED':
        return 'badge--success';
      case 'REJECTED':
      case 'CANCELLED':
        return 'badge--danger';
      case 'PENDING':
        return 'badge--warning';
      default:
        return 'badge--neutral';
    }
  }

  getStatusLabel(status?: string): string {
    switch (status?.toUpperCase()) {
      case 'ACCEPTED':
        return 'Acceptée';
      case 'REJECTED':
        return 'Refusée';
      case 'PENDING':
        return 'En attente';
      case 'VALIDATED':
        return 'Validée';
      case 'CANCELLED':
        return 'Annulée';
      default:
        return status || '';
    }
  }
}
