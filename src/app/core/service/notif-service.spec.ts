import { TestBed } from '@angular/core/testing';
import { NotifService } from './notif-service';

describe('NotifService', () => {
  let service: NotifService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotifService],
    });
    service = TestBed.inject(NotifService);
    service.clearAll();
  });

  it('devrait être initialisé', () => {
    expect(service).toBeTruthy();
  });

  it('devrait afficher une notification d\'erreur unique', () => {
    service.showError('Une erreur est survenue');
    expect(service.notifications().length).toBe(1);
    expect(service.notifications()[0].message).toBe('Une erreur est survenue');
    expect(service.notifications()[0].type).toBe('error');
    expect(service.notifications()[0].title).toBe('Erreur');
  });

  it('devrait ignorer les notifications strictement identiques actives simultanément', () => {
    service.showError('Identifiants incorrects');
    service.showError('Identifiants incorrects');
    expect(service.notifications().length).toBe(1);
  });

  it('devrait ne garder qu\'une seule erreur lorsqu\'un message précis et un message générique se succèdent', () => {
    // 1. Message métier précis (ex: renvoyé par l'intercepteur HTTP)
    service.showError('Vous avez déjà postulé à cette annonce', 'Erreur');
    expect(service.notifications().length).toBe(1);

    // 2. Message générique émis immédiatement après par le composant
    service.showError("Impossible d'envoyer la candidature.", 'Erreur');

    // Il ne doit y avoir qu'une seule notification et c'est la précise qui est conservée
    expect(service.notifications().length).toBe(1);
    expect(service.notifications()[0].message).toBe('Vous avez déjà postulé à cette annonce');
  });

  it('devrait remplacer une erreur générique si une erreur précise arrive dans la foulée', () => {
    service.showError("Une erreur est survenue lors de l'enregistrement", 'Erreur');
    expect(service.notifications().length).toBe(1);

    service.showError('Ce nom d\'organisation est déjà utilisé', 'Erreur');

    expect(service.notifications().length).toBe(1);
    expect(service.notifications()[0].message).toBe('Ce nom d\'organisation est déjà utilisé');
  });

  it('devrait supprimer une notification par son ID', () => {
    service.showInfo('Message info');
    const notif = service.notifications()[0];
    expect(service.notifications().length).toBe(1);

    service.remove(notif.id);
    expect(service.notifications().length).toBe(0);
  });

  it('devrait tout vider via clearAll()', () => {
    service.showSuccess('Succès 1');
    service.showWarning('Attention 2');
    expect(service.notifications().length).toBe(2);

    service.clearAll();
    expect(service.notifications().length).toBe(0);
  });
});
