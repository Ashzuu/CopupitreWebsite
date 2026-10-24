import { TestBed } from '@angular/core/testing';
import { LoaderService } from './loader-service';

describe('LoaderService', () => {
  let service: LoaderService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [LoaderService],
    });
    service = TestBed.inject(LoaderService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('devrait être initialisé avec isLoading à false', () => {
    expect(service.isLoading()).toBe(false);
  });

  it('ne devrait pas activer isLoading immédiatement lors d\'une requête rapide (< 150ms)', () => {
    service.increment();
    expect(service.isLoading()).toBe(false);

    vi.advanceTimersByTime(100);
    expect(service.isLoading()).toBe(false);

    service.decrement();
    expect(service.isLoading()).toBe(false);

    vi.advanceTimersByTime(100);
    expect(service.isLoading()).toBe(false);
  });

  it('devrait activer isLoading si la requête dépasse le seuil de 150ms', () => {
    service.increment();
    expect(service.isLoading()).toBe(false);

    vi.advanceTimersByTime(150);
    expect(service.isLoading()).toBe(true);

    service.decrement();
    expect(service.isLoading()).toBe(false);
  });

  it('devrait maintenir isLoading actif tant que toutes les requêtes ne sont pas terminées', () => {
    service.increment();
    service.increment();

    vi.advanceTimersByTime(150);
    expect(service.isLoading()).toBe(true);

    service.decrement();
    expect(service.isLoading()).toBe(true);

    service.decrement();
    expect(service.isLoading()).toBe(false);
  });
});
