import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { OrganizationListPage } from './organization-list-page';
import { OrganizationRepository } from '@repositories/organization-repository';
import { Organization } from '@models/organization';

describe('OrganizationListPage', () => {
  let component: OrganizationListPage;
  let fixture: ComponentFixture<OrganizationListPage>;
  let orgRepo: OrganizationRepository;

  const mockOrganizations: Organization[] = [
    {
      id: 1,
      name: 'Harmonie de Lyon',
      city: 'Lyon',
      musicianCount: 50,
      description: 'Grand orchestre à vent',
      adminUsernames: ['admin1'],
      rehearsalSchedules: [
        {
          id: 1,
          dayOfWeek: 'MONDAY',
          startTime: '20:00',
          endTime: '22:00',
          location: 'Conservatoire',
        },
      ],
    },
    {
      id: 2,
      name: 'Brass Band de Paris',
      city: 'Paris',
      musicianCount: 28,
      description: 'Ensemble de cuivres',
      adminUsernames: ['admin2'],
      rehearsalSchedules: [
        {
          id: 2,
          dayOfWeek: 'THURSDAY',
          startTime: '19:30',
          endTime: '21:30',
          location: 'Salle Ravel',
        },
      ],
    },
    {
      id: 3,
      name: 'Symphonie de Grenoble',
      city: 'Grenoble',
      musicianCount: 65,
      description: 'Orchestre symphonique',
      adminUsernames: ['admin3'],
      rehearsalSchedules: [],
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationListPage],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    orgRepo = TestBed.inject(OrganizationRepository);
    vi.spyOn(orgRepo, 'getAllOrganizations').mockReturnValue(of(mockOrganizations));

    fixture = TestBed.createComponent(OrganizationListPage);
    component = fixture.componentInstance;
    component.allOrganizations.set(mockOrganizations);
    await fixture.whenStable();
  });

  it('devrait être créé avec succès', () => {
    expect(component).toBeTruthy();
  });

  it('devrait initialiser et afficher toutes les organisations sans filtre', () => {
    expect(component.filteredOrganizations().length).toBe(3);
  });

  it('devrait filtrer les organisations par nom', () => {
    component.searchName.set('Brass');
    expect(component.filteredOrganizations().length).toBe(1);
    expect(component.filteredOrganizations()[0].name).toBe('Brass Band de Paris');
  });

  it('devrait filtrer les organisations par ville', () => {
    component.onCityChange('Lyon', true);
    expect(component.filteredOrganizations().length).toBe(1);
    expect(component.filteredOrganizations()[0].city).toBe('Lyon');
  });

  it('devrait réinitialiser les filtres avec resetFilters()', () => {
    component.searchName.set('Harmonie');
    component.onCityChange('Lyon', true);
    expect(component.filteredOrganizations().length).toBe(1);

    component.resetFilters();

    expect(component.searchName()).toBe('');
    expect(component.selectedCities()).toEqual([]);
    expect(component.filteredOrganizations().length).toBe(3);
  });
});
