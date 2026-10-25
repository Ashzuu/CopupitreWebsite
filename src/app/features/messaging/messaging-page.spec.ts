import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MessagingPage } from './messaging-page';
import { MessagingRepository } from '@repositories/messaging-repository';
import { NotifService } from '@services/notif-service';
import { LoggerService } from '@services/logger-service';
import { AuthService } from '@services/auth-service';
import { InAppNotificationService } from '@services/in-app-notification-service';
import { signal } from '@angular/core';
import { ChatMessage, Conversation } from '@models/index';

describe('MessagingPage', () => {
  let component: MessagingPage;
  let fixture: ComponentFixture<MessagingPage>;

  const mockConversations: Conversation[] = [
    {
      id: 'APPLICATION_1',
      contextType: 'APPLICATION',
      contextId: 1,
      title: 'Trompette solo',
      subtitle: 'Candidature renfort',
      otherPartyName: 'Orchestre Harmonie',
      otherPartyRole: 'ORGANIZATION',
      lastMessage: 'Bonjour !',
      lastMessageAt: '2026-10-25T14:00:00Z',
      messageCount: 2,
      status: 'PENDING',
    },
    {
      id: 'EQUIPMENT_50',
      contextType: 'EQUIPMENT',
      contextId: 50,
      title: 'Prêt de timbales',
      subtitle: 'Demande de prêt de matériel',
      otherPartyName: 'Philharmonie de Paris',
      otherPartyRole: 'ORGANIZATION',
      lastMessage: 'Je peux les prêter',
      lastMessageAt: '2026-10-25T15:00:00Z',
      messageCount: 4,
      status: 'OPEN',
    },
  ];

  const mockMessages: ChatMessage[] = [
    {
      id: 101,
      contextType: 'APPLICATION',
      contextId: 1,
      senderUsername: 'pierredurand',
      senderFullName: 'Pierre Durand',
      senderRole: 'MUSICIAN',
      content: 'Bonjour !',
      createdAt: '2026-10-25T14:00:00Z',
      isMe: true,
    },
  ];

  const mockMessagingRepo = {
    getConversations: vi.fn().mockReturnValue(of(mockConversations)),
    getMessages: vi.fn().mockReturnValue(of(mockMessages)),
    sendMessage: vi.fn(),
  };

  const mockNotifService = {
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn(),
  };

  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  const mockAuthService = {
    isAuthenticated: signal(true),
    currentUser: signal({ id: 1, username: 'testuser' }),
    currentUsername: signal('testuser'),
    currentUserFullName: signal('Test User'),
    currentUserProfile: signal(null),
    logout: vi.fn(),
  };

  const mockInAppNotifService = {
    notifications: signal([]),
    unreadCount: signal(0),
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
    vi.clearAllMocks();
    mockMessagingRepo.getConversations.mockReturnValue(of(mockConversations));
    mockMessagingRepo.getMessages.mockReturnValue(of(mockMessages));

    await TestBed.configureTestingModule({
      imports: [MessagingPage],
      providers: [
        provideRouter([]),
        { provide: MessagingRepository, useValue: mockMessagingRepo },
        { provide: NotifService, useValue: mockNotifService },
        { provide: LoggerService, useValue: mockLogger },
        { provide: AuthService, useValue: mockAuthService },
        { provide: InAppNotificationService, useValue: mockInAppNotifService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {},
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MessagingPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('devrait créer le composant avec succès', () => {
    expect(component).toBeTruthy();
  });

  it('devrait charger les conversations et sélectionner la première par défaut', async () => {
    await component.loadConversations();

    expect(mockMessagingRepo.getConversations).toHaveBeenCalled();
    expect(component.conversations().length).toBe(2);
    expect(component.selectedConversation()).toEqual(mockConversations[0]);
    expect(mockMessagingRepo.getMessages).toHaveBeenCalledWith('APPLICATION', 1);
    expect(component.messages()).toEqual(mockMessages);
  });

  it('devrait filtrer les conversations par onglet', () => {
    component.conversations.set(mockConversations);

    component.activeTab.set('EQUIPMENT');
    expect(component.filteredConversations().length).toBe(1);
    expect(component.filteredConversations()[0].contextType).toBe('EQUIPMENT');

    component.activeTab.set('APPLICATION');
    expect(component.filteredConversations().length).toBe(1);
    expect(component.filteredConversations()[0].contextType).toBe('APPLICATION');

    component.activeTab.set('ALL');
    expect(component.filteredConversations().length).toBe(2);
  });

  it('devrait filtrer les conversations par terme de recherche', () => {
    component.conversations.set(mockConversations);

    component.searchTerm.set('timbales');
    expect(component.filteredConversations().length).toBe(1);
    expect(component.filteredConversations()[0].id).toBe('EQUIPMENT_50');

    component.searchTerm.set('Trompette');
    expect(component.filteredConversations().length).toBe(1);
    expect(component.filteredConversations()[0].id).toBe('APPLICATION_1');

    component.searchTerm.set('introuvable');
    expect(component.filteredConversations().length).toBe(0);
  });

  it('devrait désélectionner la conversation courante', () => {
    component.selectedConversation.set(mockConversations[0]);
    component.deselectConversation();
    expect(component.selectedConversation()).toBeNull();
  });

  it('devrait envoyer un message avec succès et réordonner la liste des conversations', async () => {
    const sentMsg: ChatMessage = {
      id: 202,
      contextType: 'APPLICATION',
      contextId: 1,
      senderUsername: 'testuser',
      senderFullName: 'Test User',
      senderRole: 'MUSICIAN',
      content: 'Nouveau message de test',
      createdAt: '2026-10-25T16:00:00Z',
      isMe: true,
    };
    mockMessagingRepo.sendMessage.mockReturnValue(of(sentMsg));

    component.conversations.set([...mockConversations]);
    component.selectedConversation.set(mockConversations[0]);
    component.newMessageText.set('Nouveau message de test');

    await component.sendMessage();

    expect(mockMessagingRepo.sendMessage).toHaveBeenCalledWith('APPLICATION', 1, 'Nouveau message de test');
    expect(component.messages()).toContainEqual(sentMsg);
    expect(component.newMessageText()).toBe('');
    expect(component.conversations()[0].lastMessage).toBe('Nouveau message de test');
    expect(component.conversations()[0].messageCount).toBe(3);
  });

  it('ne devrait pas envoyer de message si le contenu est vide', async () => {
    component.selectedConversation.set(mockConversations[0]);
    component.newMessageText.set('   ');

    await component.sendMessage();

    expect(mockMessagingRepo.sendMessage).not.toHaveBeenCalled();
  });

  it('devrait déclencher l\'envoi lors de Ctrl+Entrée', () => {
    const spy = vi.spyOn(component, 'sendMessage');
    const event = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true });
    vi.spyOn(event, 'preventDefault');

    component.onKeyDown(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
  });

  it('devrait afficher une erreur si le chargement des conversations échoue', async () => {
    mockMessagingRepo.getConversations.mockReturnValue(throwError(() => new Error('Erreur réseau')));

    await component.loadConversations();

    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockNotifService.showError).toHaveBeenCalled();
  });

  it('devrait afficher une erreur si l\'envoi du message échoue', async () => {
    mockMessagingRepo.sendMessage.mockReturnValue(throwError(() => new Error('Erreur d\'envoi')));

    component.selectedConversation.set(mockConversations[0]);
    component.newMessageText.set('Message');

    await component.sendMessage();

    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockNotifService.showError).toHaveBeenCalled();
    expect(component.sendingMessage()).toBe(false);
  });

  it('devrait retourner le label et le style de badge appropriés', () => {
    expect(component.getContextBadgeLabel('APPLICATION')).toBe('Renfort');
    expect(component.getContextBadgeLabel('ANNUAL_APPLICATION')).toBe('Permanent');
    expect(component.getContextBadgeLabel('EQUIPMENT')).toBe('Matériel');
    expect(component.getContextBadgeLabel('OTHER')).toBe('Discussion');

    expect(component.getStatusBadgeClass('ACCEPTED')).toBe('badge--success');
    expect(component.getStatusBadgeClass('REJECTED')).toBe('badge--danger');
    expect(component.getStatusBadgeClass('PENDING')).toBe('badge--warning');
    expect(component.getStatusBadgeClass('OTHER')).toBe('badge--neutral');

    expect(component.getStatusLabel('ACCEPTED')).toBe('Acceptée');
    expect(component.getStatusLabel('REJECTED')).toBe('Refusée');
    expect(component.getStatusLabel('PENDING')).toBe('En attente');
    expect(component.getStatusLabel('UNKNOWN')).toBe('UNKNOWN');
  });
});
