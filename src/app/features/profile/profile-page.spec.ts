import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { ProfilePage } from './profile-page';
import { UserService } from '@services/user-service';
import { NotifService } from '@services/notif-service';
import { UserProfile } from '@models/user';

describe('ProfilePage', () => {
  let component: ProfilePage;
  let fixture: ComponentFixture<ProfilePage>;
  let userService: UserService;
  let notifService: NotifService;

  const mockProfile: UserProfile = {
    id: 1,
    username: 'clarinette_master',
    firstName: 'Jean',
    lastName: 'Dupont',
    mainInstrument: 'Clarinette',
    secondaryInstruments: ['Piano', 'Saxophone'],
    musicalDescription: 'Clarinettiste passionné depuis 15 ans.',
    yearsOfPractice: 15,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
      ],
    }).compileComponents();

    userService = TestBed.inject(UserService);
    notifService = TestBed.inject(NotifService);

    // Mock du chargement du profil
    vi.spyOn(userService, 'loadProfile').mockReturnValue(of(mockProfile));
    userService.userProfile.set(mockProfile);

    fixture = TestBed.createComponent(ProfilePage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('devrait être créé avec succès', () => {
    expect(component).toBeTruthy();
  });

  it('devrait charger les informations du profil au chargement', () => {
    expect(component.profile()).toEqual(mockProfile);
    expect(component.secondaryInstrumentsList()).toEqual(['Piano', 'Saxophone']);
    expect(component.initials()).toBe('JD');
  });

  it('devrait activer le mode édition via enableEdit()', () => {
    expect(component.isEditing()).toBe(false);
    component.enableEdit();
    expect(component.isEditing()).toBe(true);

    const formValues = component.profileForm.getRawValue();
    expect(formValues.firstName).toBe('Jean');
    expect(formValues.lastName).toBe('Dupont');
    expect(formValues.mainInstrument).toBe('Clarinette');
    expect(formValues.secondaryInstruments).toBe('Piano, Saxophone');
    expect(formValues.yearsOfPractice).toBe(15);
  });

  it('devrait annuler le mode édition via cancelEdit()', () => {
    component.enableEdit();
    expect(component.isEditing()).toBe(true);

    component.cancelEdit();
    expect(component.isEditing()).toBe(false);
  });

  it('devrait valider et envoyer les modifications de profil lors du submit', () => {
    const updatedProfile: UserProfile = {
      ...mockProfile,
      firstName: 'Jean-Marc',
      mainInstrument: 'Hautbois',
      secondaryInstruments: ['Cor anglais'],
    };

    const updateSpy = vi.spyOn(userService, 'updateProfile').mockReturnValue(of(updatedProfile));
    const notifSpy = vi.spyOn(notifService, 'showSuccess');

    component.enableEdit();
    component.profileForm.patchValue({
      firstName: 'Jean-Marc',
      mainInstrument: 'Hautbois',
      secondaryInstruments: 'Cor anglais',
    });

    component.onSubmit();

    expect(updateSpy).toHaveBeenCalledWith({
      firstName: 'Jean-Marc',
      lastName: 'Dupont',
      mainInstrument: 'Hautbois',
      secondaryInstruments: ['Cor anglais'],
      yearsOfPractice: 15,
      musicalDescription: 'Clarinettiste passionné depuis 15 ans.',
    });
    expect(notifSpy).toHaveBeenCalled();
    expect(component.isEditing()).toBe(false);
  });

  it('ne devrait pas soumettre si le formulaire est invalide', () => {
    const updateSpy = vi.spyOn(userService, 'updateProfile');
    const warningSpy = vi.spyOn(notifService, 'showWarning');

    component.enableEdit();
    component.profileForm.patchValue({
      firstName: '', // requis -> invalide
    });

    component.onSubmit();

    expect(updateSpy).not.toHaveBeenCalled();
    expect(warningSpy).toHaveBeenCalled();
  });
});
