import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { InAppNotificationService } from './in-app-notification-service';
import { NotificationRepository } from '../repository/notification-repository';
import { AuthService } from './auth-service';
import { LoggerService } from './logger-service';
import { InAppNotification } from '../model';

describe('InAppNotificationService', () => {
  let service: InAppNotificationService;

  const mockNotifs: InAppNotification[] = [
    {
      id: 1,
      type: 'NEW_APPLICATION',
      title: 'Nouvelle candidature',
      content: 'Jean a postulé',
      link: '/dashboard',
      isRead: false,
      createdAt: '2026-10-25T10:00:00Z',
    },
    {
      id: 2,
      type: 'NEW_MESSAGE',
      title: 'Nouveau message',
      content: 'Bonjour !',
      link: '/mes-candidatures',
      isRead: true,
      createdAt: '2026-10-25T09:00:00Z',
    },
  ];

  const mockRepo = {
    getMyNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  };

  const isAuthenticatedSignal = signal(true);
  const mockAuthService = {
    isAuthenticated: isAuthenticatedSignal,
  };

  const mockLogger = {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    isAuthenticatedSignal.set(true);

    TestBed.configureTestingModule({
      providers: [
        InAppNotificationService,
        { provide: NotificationRepository, useValue: mockRepo },
        { provide: AuthService, useValue: mockAuthService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    });

    service = TestBed.inject(InAppNotificationService);
  });

  it('devrait être créé avec succès', () => {
    expect(service).toBeTruthy();
    expect(service.notifications()).toEqual([]);
    expect(service.unreadCount()).toBe(0);
  });

  it('devrait charger les notifications et calculer le compteur unreadCount', async () => {
    mockRepo.getMyNotifications.mockReturnValue(of(mockNotifs));

    await service.loadNotifications();

    expect(mockRepo.getMyNotifications).toHaveBeenCalled();
    expect(service.notifications().length).toBe(2);
    expect(service.unreadCount()).toBe(1);
  });

  it('devrait réinitialiser la liste si non authentifié', async () => {
    isAuthenticatedSignal.set(false);

    await service.loadNotifications();

    expect(mockRepo.getMyNotifications).not.toHaveBeenCalled();
    expect(service.notifications()).toEqual([]);
    expect(service.unreadCount()).toBe(0);
  });

  it('devrait rafraîchir le compteur unreadCount', async () => {
    mockRepo.getUnreadCount.mockReturnValue(of({ unreadCount: 5 }));

    await service.refreshUnreadCount();

    expect(mockRepo.getUnreadCount).toHaveBeenCalled();
    expect(service.unreadCount()).toBe(5);
  });

  it('devrait basculer l\'ouverture du panneau', () => {
    mockRepo.getMyNotifications.mockReturnValue(of([]));

    expect(service.isOpen()).toBe(false);

    service.togglePanel();
    expect(service.isOpen()).toBe(true);

    service.closePanel();
    expect(service.isOpen()).toBe(false);
  });

  it('devrait marquer une notification comme lue et décrémenter le compteur', async () => {
    service.notifications.set([...mockNotifs]);
    service.unreadCount.set(1);
    mockRepo.markAsRead.mockReturnValue(of(undefined));

    await service.markAsRead(mockNotifs[0]);

    expect(mockRepo.markAsRead).toHaveBeenCalledWith(1);
    expect(service.notifications()[0].isRead).toBe(true);
    expect(service.unreadCount()).toBe(0);
  });

  it('devrait marquer toutes les notifications comme lues', async () => {
    service.notifications.set([...mockNotifs]);
    service.unreadCount.set(1);
    mockRepo.markAllAsRead.mockReturnValue(of(undefined));

    await service.markAllAsRead();

    expect(mockRepo.markAllAsRead).toHaveBeenCalled();
    expect(service.notifications().every((n) => n.isRead)).toBe(true);
    expect(service.unreadCount()).toBe(0);
  });
});
