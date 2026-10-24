import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { UserService } from './user-service';
import { UserRepository } from '@repositories/user-repository';
import { UserProfile, UpdateProfileRequest } from '@models/user';

describe('UserService', () => {
  let service: UserService;
  let userRepo: UserRepository;

  const mockUser: UserProfile = {
    id: 42,
    username: 'violon_solo',
    firstName: 'Clara',
    lastName: 'Schumann',
    mainInstrument: 'Piano',
    secondaryInstruments: ['Violon'],
    musicalDescription: 'Compositrice et pianiste virtuose.',
    yearsOfPractice: 20,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        provideHttpClient(),
      ],
    });

    service = TestBed.inject(UserService);
    userRepo = TestBed.inject(UserRepository);
  });

  it('devrait être initialisé sans profil chargé', () => {
    expect(service).toBeTruthy();
    expect(service.userProfile()).toBeNull();
    expect(service.fullName()).toBe('');
    expect(service.initials()).toBe('M');
  });

  it('devrait charger le profil utilisateur', () => {
    vi.spyOn(userRepo, 'getMe').mockReturnValue(of(mockUser));

    service.loadProfile().subscribe((res) => {
      expect(res).toEqual(mockUser);
    });

    expect(service.userProfile()).toEqual(mockUser);
    expect(service.fullName()).toBe('Clara Schumann');
    expect(service.initials()).toBe('CS');
    expect(service.isLoading()).toBe(false);
  });

  it('devrait mettre à jour le profil utilisateur', () => {
    const updateReq: UpdateProfileRequest = {
      firstName: 'Clara',
      lastName: 'Schumann-Wieck',
      mainInstrument: 'Piano à queue',
      secondaryInstruments: ['Orgue'],
      yearsOfPractice: 25,
      musicalDescription: 'Pianiste internationale.',
    };

    const updatedUser: UserProfile = {
      ...mockUser,
      lastName: 'Schumann-Wieck',
      mainInstrument: 'Piano à queue',
      secondaryInstruments: ['Orgue'],
      yearsOfPractice: 25,
      musicalDescription: 'Pianiste internationale.',
    };

    vi.spyOn(userRepo, 'updateMe').mockReturnValue(of(updatedUser));

    service.updateProfile(updateReq).subscribe((res) => {
      expect(res).toEqual(updatedUser);
    });

    expect(service.userProfile()).toEqual(updatedUser);
    expect(service.fullName()).toBe('Clara Schumann-Wieck');
    expect(service.isSaving()).toBe(false);
  });
});
