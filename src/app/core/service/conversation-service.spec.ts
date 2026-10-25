import { TestBed } from '@angular/core/testing';
import { ConversationService } from './conversation-service';

describe('ConversationService', () => {
  let service: ConversationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConversationService],
    });
    service = TestBed.inject(ConversationService);
  });

  it('devrait être instancié avec les signaux par défaut', () => {
    expect(service).toBeTruthy();
    expect(service.isOpen()).toBe(false);
    expect(service.contextType()).toBe('');
    expect(service.contextId()).toBeNull();
    expect(service.title()).toBe('Fil de discussion');
  });

  it('devrait ouvrir la modale avec les paramètres de contexte spécifiés', () => {
    service.open({
      contextType: 'APPLICATION',
      contextId: 42,
      title: 'Discussion avec Jean',
      subtitle: 'Renfort Trompette',
    });

    expect(service.isOpen()).toBe(true);
    expect(service.contextType()).toBe('APPLICATION');
    expect(service.contextId()).toBe(42);
    expect(service.title()).toBe('Discussion avec Jean');
    expect(service.subtitle()).toBe('Renfort Trompette');
  });

  it('devrait fermer la modale via close()', () => {
    service.open({
      contextType: 'EQUIPMENT',
      contextId: 10,
    });
    expect(service.isOpen()).toBe(true);

    service.close();
    expect(service.isOpen()).toBe(false);
  });
});
