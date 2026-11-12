import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MusicianRepository } from './musician-repository';
import { Musician, CsvImportResult } from '../model';
import { environment } from '@environments/environment';

describe('MusicianRepository', () => {
  let repository: MusicianRepository;
  let httpMock: HttpTestingController;
  const baseUrl = environment.BASE_API_URL;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MusicianRepository,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    repository = TestBed.inject(MusicianRepository);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch organization musicians', () => {
    const mockMusicians: Musician[] = [
      { id: 1, firstName: 'Jean', lastName: 'Dupont', email: 'jean@test.fr', instrument: 'Violon' },
    ];

    repository.getOrganizationMusicians(10).subscribe((res) => {
      expect(res.length).toBe(1);
      expect(res[0].firstName).toBe('Jean');
    });

    const req = httpMock.expectOne(`${baseUrl}/api/organizations/10/musicians`);
    expect(req.request.method).toBe('GET');
    req.flush(mockMusicians);
  });

  it('should add a musician', () => {
    const created: Musician = { id: 2, firstName: 'Marie', lastName: 'Curie', email: 'marie@test.fr', instrument: 'Alto' };

    repository.addMusician(10, { firstName: 'Marie', lastName: 'Curie', email: 'marie@test.fr', instrument: 'Alto' })
      .subscribe((res) => {
        expect(res.id).toBe(2);
      });

    const req = httpMock.expectOne(`${baseUrl}/api/organizations/10/musicians`);
    expect(req.request.method).toBe('POST');
    req.flush(created);
  });

  it('should import musicians via CSV file', () => {
    const file = new File(['dummy'], 'musicians.csv', { type: 'text/csv' });
    const mockResult: CsvImportResult = {
      totalRows: 1,
      importedCount: 1,
      skippedCount: 0,
      errorCount: 0,
      messages: [],
      musicians: [],
    };

    repository.importCsvFile(10, file).subscribe((res) => {
      expect(res.importedCount).toBe(1);
    });

    const req = httpMock.expectOne(`${baseUrl}/api/organizations/10/musicians/import-csv`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResult);
  });

  it('should remove a musician', () => {
    repository.removeMusician(10, 5).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/api/organizations/10/musicians/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should associate user by email', () => {
    const updated: Musician = { id: 5, firstName: 'A', lastName: 'B', email: 'a@b.fr', instrument: 'Flute', userId: 99 };

    repository.associateUser(10, 5, 'a@b.fr').subscribe((res) => {
      expect(res.userId).toBe(99);
    });

    const req = httpMock.expectOne(`${baseUrl}/api/organizations/10/musicians/5/associate-user`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'a@b.fr' });
    req.flush(updated);
  });
});
