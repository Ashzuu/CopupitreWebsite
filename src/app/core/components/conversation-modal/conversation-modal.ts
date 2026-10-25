import {
  Component,
  ElementRef,
  ViewChild,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ChatMessage } from '@models/index';
import { MessagingRepository } from '@repositories/messaging-repository';
import { NotifService } from '@services/notif-service';
import { LoggerService } from '@services/logger-service';

/**
 * Modale de messagerie interne contextuelle (US-COM-03 & US-COM-04).
 * Strictement conforme à RG-COM-01 (aucune fuite d'email ou numéro de téléphone)
 * et aux règles Angular Signals / Accessibilité.
 */
@Component({
  selector: 'copupitre-conversation-modal',
  imports: [FormsModule, DatePipe],
  templateUrl: './conversation-modal.html',
  styleUrl: './conversation-modal.scss',
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class ConversationModal {
  private readonly messagingRepo = inject(MessagingRepository);
  private readonly notifService = inject(NotifService);
  private readonly logger = inject(LoggerService);

  readonly isOpen = input<boolean>(false);
  readonly contextType = input<string>('');
  readonly contextId = input<number | null>(null);
  readonly title = input<string>('Fil de discussion');
  readonly subtitle = input<string>('');

  readonly closed = output<void>();

  readonly messages = signal<ChatMessage[]>([]);
  readonly newMessage = signal<string>('');
  readonly loading = signal<boolean>(false);
  readonly sending = signal<boolean>(false);

  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const type = this.contextType();
      const id = this.contextId();

      if (open && type && id) {
        this.loadMessages();
      } else if (!open) {
        this.messages.set([]);
        this.newMessage.set('');
      }
    });
  }

  async loadMessages() {
    const type = this.contextType();
    const id = this.contextId();
    if (!type || !id) return;

    this.loading.set(true);
    try {
      const msgs = await firstValueFrom(this.messagingRepo.getMessages(type, id));
      this.messages.set(msgs || []);
      this.scrollToBottom();
    } catch (err) {
      this.logger.error('Failed to load conversation messages', 'ConversationModal', err);
      this.notifService.showError('Impossible de charger les messages de cette conversation.', 'Erreur');
    } finally {
      this.loading.set(false);
    }
  }

  async sendMessage() {
    const content = this.newMessage().trim();
    const type = this.contextType();
    const id = this.contextId();

    if (!content || !type || !id || this.sending()) return;

    this.sending.set(true);
    try {
      const sent = await firstValueFrom(this.messagingRepo.sendMessage(type, id, content));
      this.messages.update((prev) => [...prev, sent]);
      this.newMessage.set('');
      this.scrollToBottom();
    } catch (err) {
      this.logger.error('Failed to send message', 'ConversationModal', err);
      this.notifService.showError("Impossible d'envoyer votre message.", 'Erreur');
    } finally {
      this.sending.set(false);
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  close() {
    this.closed.emit();
  }

  onEscape() {
    if (this.isOpen()) {
      this.close();
    }
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messagesContainer?.nativeElement) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }
}
