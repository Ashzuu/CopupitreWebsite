import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { OrganizationCreatePage } from './organization-create-page';
import { OrganizationRepository } from '@repositories/organization-repository';
import { NotifService } from '@services/notif-service';
import { Organization } from '@models/organization';

describe('OrganizationCreatePage', () => {
  let component: OrganizationCreatePage;
  let fixture: ComponentFixture<OrganizationCreatePage>;
  let orgRepo: OrganizationRepository;
  let notifService: NotifService;
  let router: Router;

  const mockOrg: Organization = {
    id: 1,
    name: 'Orchestre Harmonie Lyon',
    city: 'Lyon',
    musicianCount: 45,
    description: 'Ensemble à vent dynamique.',
    formationType: 'Harmonie',
    concertDress: 'Noir complet',
    logisticsInfo: 'Percussions fournies',
    rehearsalAddress: '10 Rue de la Paix, Lyon',
    rehearsalSchedule: 'Tous les mardis',
    adminUsernames: ['alice_admin'],
    rehearsalSchedules: [
      {
        id: 10,
        dayOfWeek: 'TUESDAY',
        startTime: '20:00:00',
        endTime: '22:00:00',
        location: 'Salle Polyvalente',
      },
    ],
    rehearsalManuals: [
      {
        id: 20,
        manualDate: '2026-11-15T00:00:00.000Z',
        startTime: '19:30:00',
        endTime: '21:45:00',
        location: 'Auditorium',
      },
    ],
    annualNeeds: [
      {
        id: 100,
        instrument: 'Trompette',
        count: 2,
        requiredCount: 2,
        description: 'Bon niveau en lecture',
      },
      {
        id: 101,
        instrument: 'Hautbois',
        requiredCount: 1,
        description: 'Autonomie de pupitre',
      },
    ],
    concerts: [
      {
        id: 200,
        title: 'Concert de Printemps',
        eventDate: '2026-05-15T20:00:00.000Z',
        location: 'Auditorium',
        description: 'Répertoire classique et musiques de films',
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationCreatePage],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    orgRepo = TestBed.inject(OrganizationRepository);
    notifService = TestBed.inject(NotifService);
    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(OrganizationCreatePage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('devrait être créé avec succès', () => {
    expect(component).toBeTruthy();
  });

  it('devrait initialiser le formulaire avec annualNeeds vide', () => {
    expect(component.annualNeeds).toBeDefined();
    expect(component.annualNeeds.length).toBe(0);
  });

  it('devrait ajouter et supprimer un besoin annuel dynamiquement (US-ORG-04)', () => {
    expect(component.annualNeeds.length).toBe(0);

    // Ajout d'un premier besoin annuel
    component.addAnnualNeed();
    expect(component.annualNeeds.length).toBe(1);

    const firstNeed = component.annualNeeds.at(0);
    expect(firstNeed.get('instrument')?.value).toBe('');
    expect(firstNeed.get('requiredCount')?.value).toBe(1);

    // Personnalisation des valeurs
    firstNeed.patchValue({
      instrument: 'Clarinette basse',
      requiredCount: 2,
      description: 'Niveau 2nd cycle',
    });

    // Ajout d'un second besoin annuel
    component.addAnnualNeed();
    expect(component.annualNeeds.length).toBe(2);

    // Suppression du premier
    component.removeAnnualNeed(0);
    expect(component.annualNeeds.length).toBe(1);
    expect(component.annualNeeds.at(0).get('instrument')?.value).toBe('');
  });

  it('devrait charger les besoins annuels existants via patchForm (US-ORG-04)', () => {
    component.patchForm(mockOrg);

    expect(component.form.get('name')?.value).toBe('Orchestre Harmonie Lyon');
    expect(component.annualNeeds.length).toBe(2);

    const need1 = component.annualNeeds.at(0).value;
    expect(need1.instrument).toBe('Trompette');
    expect(need1.requiredCount).toBe(2);
    expect(need1.description).toBe('Bon niveau en lecture');

    const need2 = component.annualNeeds.at(1).value;
    expect(need2.instrument).toBe('Hautbois');
    expect(need2.requiredCount).toBe(1);
  });

  it('devrait formater correctement les horaires reçus en HH:mm:ss vers HH:mm lors du patchForm', () => {
    component.patchForm(mockOrg);

    // Vérification des répétitions régulières
    expect(component.rehearsalSchedules.length).toBe(1);
    const scheduleCtrl = component.rehearsalSchedules.at(0);
    expect(scheduleCtrl.get('startTime')?.value).toBe('20:00');
    expect(scheduleCtrl.get('endTime')?.value).toBe('22:00');
    expect(scheduleCtrl.get('startTime')?.valid).toBe(true);
    expect(scheduleCtrl.get('endTime')?.valid).toBe(true);

    // Vérification des répétitions exceptionnelles
    expect(component.rehearsalManuals.length).toBe(1);
    const manualCtrl = component.rehearsalManuals.at(0);
    expect(manualCtrl.get('startTime')?.value).toBe('19:30');
    expect(manualCtrl.get('endTime')?.value).toBe('21:45');
    expect(manualCtrl.get('manualDate')?.value).toBe('2026-11-15');
    expect(manualCtrl.get('startTime')?.valid).toBe(true);
    expect(manualCtrl.get('endTime')?.valid).toBe(true);
  });

  it('devrait convertir divers formats d\'horaires via formatTime', () => {
    expect(component.formatTime('20:00:00')).toBe('20:00');
    expect(component.formatTime('08:30:45')).toBe('08:30');
    expect(component.formatTime('20:00')).toBe('20:00');
    expect(component.formatTime('9:15')).toBe('09:15');
    expect(component.formatTime('')).toBe('');
    expect(component.formatTime(null)).toBe('');
    expect(component.formatTime(undefined)).toBe('');
  });

  it('devrait convertir divers formats de dates via formatDate', () => {
    expect(component.formatDate('2026-11-15')).toBe('2026-11-15');
    expect(component.formatDate('2026-11-15T10:00:00.000Z')).toBe('2026-11-15');
    expect(component.formatDate('')).toBe('');
    expect(component.formatDate(null)).toBe('');
    expect(component.formatDate(undefined)).toBe('');
  });

  it('devrait inclure annualNeeds et concerts dans le payload lors de onSubmit()', () => {
    const createSpy = vi.spyOn(orgRepo, 'create').mockReturnValue(of(mockOrg));
    const notifSpy = vi.spyOn(notifService, 'showSuccess');
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.form.patchValue({
      name: 'Harmonie Municipale',
      city: 'Grenoble',
      musicianCount: 35,
      description: 'Orchestre associatif',
    });

    component.addAnnualNeed();
    component.annualNeeds.at(0).patchValue({
      instrument: 'Trombone',
      requiredCount: 3,
      description: 'Pupitre convivial',
    });

    component.onSubmit();

    expect(createSpy).toHaveBeenCalled();
    const sentPayload = createSpy.mock.calls[0][0];
    expect(sentPayload.name).toBe('Harmonie Municipale');
    expect(sentPayload.annualNeeds).toHaveLength(1);
    expect(sentPayload.annualNeeds[0]).toEqual({
      id: null,
      instrument: 'Trombone',
      count: 3,
      requiredCount: 3,
      description: 'Pupitre convivial',
    });
    expect(notifSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  });

  it('ne devrait pas soumettre si le formulaire est invalide', () => {
    const createSpy = vi.spyOn(orgRepo, 'create');
    component.form.patchValue({
      name: '', // requis mais vide
      city: '',
    });

    component.onSubmit();

    expect(createSpy).not.toHaveBeenCalled();
    expect(component.form.invalid).toBe(true);
  });
});
