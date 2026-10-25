import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { EquipmentRequestCreatePage } from './equipment-request-create-page';
import { OrganizationRepository } from '@repositories/organization-repository';
import { EquipmentRepository } from '@repositories/equipment-repository';
import { NotifService } from '@services/notif-service';
import { Organization, EquipmentRequest } from '@models/index';

describe('EquipmentRequestCreatePage', () => {
  let component: EquipmentRequestCreatePage;
  let fixture: ComponentFixture<EquipmentRequestCreatePage>;
  let mockOrgRepo: any;
  let mockEquipmentRepo: any;
  let mockNotifService: any;
  let router: Router;

  const mockOrgs: Organization[] = [
    {
      id: 10,
      name: 'Harmonie de Lyon',
      city: 'Lyon',
      description: 'Orchestre associatif',
      adminUsernames: ['alice_admin'],
      rehearsalSchedules: [],
    },
    {
      id: 20,
      name: 'Symphonique Paris',
      city: 'Paris',
      description: 'Orchestre symphonique',
      adminUsernames: ['alice_admin'],
      rehearsalSchedules: [],
    },
  ];

  beforeEach(async () => {
    mockOrgRepo = {
      getUserOrganizations: vi.fn().mockReturnValue(of(mockOrgs)),
    };

    mockEquipmentRepo = {
      saveRequest: vi.fn().mockReturnValue(of({ id: 1 } as EquipmentRequest)),
    };

    mockNotifService = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EquipmentRequestCreatePage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: OrganizationRepository, useValue: mockOrgRepo },
        { provide: EquipmentRepository, useValue: mockEquipmentRepo },
        { provide: NotifService, useValue: mockNotifService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(EquipmentRequestCreatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait être créé avec succès', () => {
    expect(component).toBeTruthy();
  });

  it('devrait charger les organisations au démarrage et pré-sélectionner la première', () => {
    expect(mockOrgRepo.getUserOrganizations).toHaveBeenCalled();
    expect(component.organizations().length).toBe(2);
    expect(component.form.get('organizationId')?.value).toBe(10);
  });

  it('devrait parser correctement divers formats de dates via parseDateStrings', () => {
    expect(component.parseDateStrings('')).toEqual([]);
    expect(component.parseDateStrings('   ')).toEqual([]);

    const parsedIso = component.parseDateStrings('2026-11-15, 2026-11-18');
    expect(parsedIso).toEqual(['2026-11-15', '2026-11-18']);

    const parsedFrench = component.parseDateStrings('15/11/2026; 20/12/2026');
    expect(parsedFrench).toEqual(['2026-11-15', '2026-12-20']);
  });

  it('ne devrait pas soumettre si le formulaire est invalide', () => {
    component.form.patchValue({
      title: '',
      equipmentName: '',
      duration: '',
    });

    component.onSubmit();

    expect(mockEquipmentRepo.saveRequest).not.toHaveBeenCalled();
    expect(component.form.touched).toBe(true);
  });

  it('devrait soumettre la demande de matériel avec succès et naviguer vers /materiels', () => {
    component.form.patchValue({
      organizationId: 10,
      title: 'Prêt de timbales de concert',
      equipmentName: 'Jeu de 4 timbales Adams',
      duration: '1 week-end',
      description: 'Transport pris en charge',
      eventDates: '15/11/2026, 17/11/2026',
    });

    component.onSubmit();

    expect(mockEquipmentRepo.saveRequest).toHaveBeenCalledWith({
      organizationId: 10,
      title: 'Prêt de timbales de concert',
      equipmentName: 'Jeu de 4 timbales Adams',
      duration: '1 week-end',
      description: 'Transport pris en charge',
      eventDates: ['2026-11-15', '2026-11-17'],
      status: 'OPEN',
    });

    expect(mockNotifService.showSuccess).toHaveBeenCalledWith('Demande de matériel publiée avec succès !');
    expect(router.navigate).toHaveBeenCalledWith(['/materiels']);
  });

  it('devrait afficher une notification d\'erreur si l\'enregistrement échoue', () => {
    mockEquipmentRepo.saveRequest.mockReturnValue(
      throwError(() => ({ error: { message: 'Erreur serveur' } }))
    );

    component.form.patchValue({
      organizationId: 10,
      title: 'Prêt de pupitres',
      equipmentName: '20 pupitres',
      duration: '3 jours',
    });

    component.onSubmit();

    expect(mockNotifService.showError).toHaveBeenCalledWith('Erreur serveur');
    expect(component.isSubmitting()).toBe(false);
  });
});
