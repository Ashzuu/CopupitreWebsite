import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ConversationModal } from './conversation-modal';
import { MessagingRepository } from '@repositories/messaging-repository';
import { NotifService } from '@services/notif-service';
import { LoggerService } from '@services/logger-service';
import { ChatMessage } from '@models/index';

describe('ConversationModal', () => {
  let component: ConversationModal;
  let componentRef: ComponentRef<ConversationModal>;
  let fixture: ComponentFixture<ConversationModal>;

  const mockMessages: ChatMessage[] = [
    {
      id: 1,
      contextType: 'APPLICATION',
      contextId: 10,
      senderUsername: 'candidate',
      senderFullName: 'Jean Dupont',
      senderRole: 'MUSICIAN',
      isMe: false,
      content: 'Bonjour, répétition maintenue ?',
      createdAt: '2026-10-25T14:00:00Z',
    },
    {
      id: 2,
      contextType: 'APPLICATION',
      contextId: 10,
      senderUsername: 'admin_user',
      senderFullName: 'Admin Ensemble',
      senderRole: 'ORGANIZATION_ADMIN',
      isMe: true,
      content: 'Oui, à 20h à la salle des fêtes.',
      createdAt: '2026-10-25T14:05:00Z',
    },
  ];

  const mockMessagingRepo = {
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
  };

  const mockNotifService = {
    showError: vi.fn(),
    showSuccess: vi.fn(),
  };

  const mockLogger = {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [ConversationModal],
      providers: [
        { provide: MessagingRepository, useValue: mockMessagingRepo },
        { provide: NotifService, useValue: mockNotifService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConversationModal);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
  });

  it('devrait être créé avec succès', () => {
    expect(component).toBeTruthy();
  });

  it('devrait charger les messages de la conversation', async () => {
    mockMessagingRepo.getMessages.mockReturnValue(of(mockMessages));
    componentRef.setInput('isOpen', true);
    componentRef.setInput('contextType', 'APPLICATION');
    componentRef.setInput('contextId', 10);

    await component.loadMessages();

    expect(mockMessagingRepo.getMessages).toHaveBeenCalledWith('APPLICATION', 10);
    expect(component.messages().length).toBe(2);
  });

  it('devrait envoyer un message avec succès', async () => {
    const newMessage: ChatMessage = {
      id: 3,
      contextType: 'APPLICATION',
      contextId: 10,
      senderUsername: 'admin_user',
      senderFullName: 'Admin Ensemble',
      senderRole: 'ORGANIZATION_ADMIN',
      isMe: true,
      content: 'Merci !',
      createdAt: '2026-10-25T14:10:00Z',
    };
    mockMessagingRepo.sendMessage.mockReturnValue(of(newMessage));

    componentRef.setInput('isOpen', true);
    componentRef.setInput('contextType', 'APPLICATION');
    componentRef.setInput('contextId', 10);
    component.newMessage.set('Merci !');

    await component.sendMessage();

    expect(mockMessagingRepo.sendMessage).toHaveBeenCalledWith('APPLICATION', 10, 'Merci !');
    expect(component.messages()).toContainEqual(newMessage);
    expect(component.newMessage()).toBe('');
  });

  it('ne devrait pas envoyer de message vide', async () => {
    componentRef.setInput('isOpen', true);
    componentRef.setInput('contextType', 'APPLICATION');
    componentRef.setInput('contextId', 10);
    component.newMessage.set('   ');

    await component.sendMessage();

    expect(mockMessagingRepo.sendMessage).not.toHaveBeenCalled();
  });

  it('devrait émettre l\'événement closed lors de close()', () => {
    const closeSpy = vi.spyOn(component.closed, 'emit');
    component.close();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('devrait fermer la modale sur Escape', () => {
    componentRef.setInput('isOpen', true);
    const closeSpy = vi.spyOn(component.closed, 'emit');
    component.onEscape();
    expect(closeSpy).toHaveBeenCalled();
  });
});
