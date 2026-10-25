import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ReinforcementCreatePage } from './reinforcement-create-page';
import { OrganizationRepository } from '@repositories/organization-repository';
import { ReinforcementsRepository } from '@repositories/reinforcements-repository';
import { NotifService } from '@services/notif-service';
import { Organization } from '@models/organization';

describe('ReinforcementCreatePage', () => {
  let component: ReinforcementCreatePage;
  let fixture: ComponentFixture<ReinforcementCreatePage>;
  let mockOrgRepo: any;
  let mockReinforcementRepo: any;
  let mockNotifService: any;
  let router: Router;

  const mockOrgs: Organization[] = [
    {
      id: 1,
      name: 'Harmonie Municipale de Lyon',
      city: 'Lyon',
      musicianCount: 45,
      description: 'Orchestre à vent',
      adminUsernames: ['admin1'],
      rehearsalSchedules: [],
    },
  ];

  beforeEach(async () => {
    mockOrgRepo = {
      getUserOrganizations: vi.fn().mockReturnValue(of(mockOrgs)),
    };

    mockReinforcementRepo = {
      createAnnouncement: vi.fn().mockReturnValue(of({ id: 10 })),
    };

    mockNotifService = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ReinforcementCreatePage],
      providers: [
        provideRouter([]),
        { provide: OrganizationRepository, useValue: mockOrgRepo },
        { provide: ReinforcementsRepository, useValue: mockReinforcementRepo },
        { provide: NotifService, useValue: mockNotifService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(ReinforcementCreatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé avec succès', () => {
    expect(component).toBeTruthy();
  });

  it('devrait charger les organisations de l\'utilisateur au démarrage', () => {
    expect(mockOrgRepo.getUserOrganizations).toHaveBeenCalled();
    expect(component.userOrganizations().length).toBe(1);
    expect(component.form.get('organizationId')?.value).toBe('1');
  });

  it('devrait ajouter et supprimer dynamiquement des instruments (RG-RENF-02)', () => {
    expect(component.instruments.length).toBe(1);

    component.addInstrument();
    expect(component.instruments.length).toBe(2);

    component.removeInstrument(1);
    expect(component.instruments.length).toBe(1);
  });

  it('ne devrait pas soumettre le formulaire s\'il est invalide', () => {
    component.form.reset();
    component.onSubmit();

    expect(mockReinforcementRepo.createAnnouncement).not.toHaveBeenCalled();
    expect(component.form.invalid).toBe(true);
  });

  it('devrait soumettre des annonces distinctes par instrument (RG-RENF-02 / US-RENF-01)', () => {
    component.form.patchValue({
      organizationId: '1',
      eventDate: '2026-11-20',
      location: 'Salle Rameau, Lyon',
      description: 'Grand concert d\'hiver',
    });

    component.instruments.clear();
    component.instruments.push(
      component['fb'].group({ name: ['Trompette'], count: [2] })
    );
    component.instruments.push(
      component['fb'].group({ name: ['Tuba'], count: [1] })
    );

    component.onSubmit();

    expect(mockReinforcementRepo.createAnnouncement).toHaveBeenCalledTimes(2);
    expect(mockReinforcementRepo.createAnnouncement).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        organizationId: 1,
        eventLocation: 'Salle Rameau, Lyon',
        description: 'Grand concert d\'hiver',
        instrumentNeeded: 'Trompette',
        requiredQuantity: 2,
      })
    );
    expect(mockReinforcementRepo.createAnnouncement).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        organizationId: 1,
        eventLocation: 'Salle Rameau, Lyon',
        description: 'Grand concert d\'hiver',
        instrumentNeeded: 'Tuba',
        requiredQuantity: 1,
      })
    );

    expect(mockNotifService.showSuccess).toHaveBeenCalledWith('Annonces de renfort créées avec succès !');
    expect(router.navigate).toHaveBeenCalledWith(['/renforts']);
  });
});
