import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MessagingRepository } from './messaging-repository';
import { ChatMessage, Conversation } from '../model';

describe('MessagingRepository', () => {
  let repository: MessagingRepository;
  let httpMock: HttpTestingController;

  const mockConversations: Conversation[] = [
    {
      id: 'APPLICATION_1',
      contextType: 'APPLICATION',
      contextId: 1,
      title: 'Trompette solo',
      subtitle: 'Candidature renfort',
      otherPartyName: 'Orchestre Harmonie',
      otherPartyRole: 'ORGANIZATION',
      lastMessage: 'Bonjour, disponible !',
      lastMessageAt: '2026-10-25T14:00:00Z',
      messageCount: 3,
      status: 'PENDING',
    },
  ];

  const mockMessages: ChatMessage[] = [
    {
      id: 1,
      contextType: 'APPLICATION',
      contextId: 1,
      senderUsername: 'pierre',
      senderFullName: 'Pierre Durand',
      senderRole: 'MUSICIAN',
      content: 'Bonjour, je suis disponible !',
      createdAt: '2026-10-25T14:00:00Z',
      isMe: true,
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MessagingRepository,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    repository = TestBed.inject(MessagingRepository);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('devrait récupérer les conversations de l\'utilisateur', () => {
    repository.getConversations().subscribe((data) => {
      expect(data).toEqual(mockConversations);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/messages/conversations'));
    expect(req.request.method).toBe('GET');
    req.flush(mockConversations);
  });

  it('devrait récupérer les messages d\'un contexte', () => {
    repository.getMessages('APPLICATION', 1).subscribe((data) => {
      expect(data).toEqual(mockMessages);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/messages/APPLICATION/1'));
    expect(req.request.method).toBe('GET');
    req.flush(mockMessages);
  });

  it('devrait envoyer un message pour un contexte', () => {
    const newMessage = mockMessages[0];
    repository.sendMessage('APPLICATION', 1, 'Bonjour, je suis disponible !').subscribe((data) => {
      expect(data).toEqual(newMessage);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/messages/APPLICATION/1'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ content: 'Bonjour, je suis disponible !' });
    req.flush(newMessage);
  });
});
