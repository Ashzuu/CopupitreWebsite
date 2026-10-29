import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Title } from '@angular/platform-browser';
import { HomePage } from './home-page';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let titleService: Title;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    titleService = TestBed.inject(Title);
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('devrait être créé avec succès sans erreur WebGL', () => {
    expect(component).toBeTruthy();
  });

  it('devrait configurer le titre SEO de la page d\'accueil', () => {
    component.ngOnInit();
    expect(titleService.getTitle()).toContain('Copupitre');
  });

  it('devrait afficher les titres principaux, la section 3D showcase et les scénarios concrets dans le DOM', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const heroTitle = compiled.querySelector('.hero-title');
    expect(heroTitle?.textContent).toContain('L\'harmonie collective commence par l\'entraide');

    const showcaseSection = compiled.querySelector('.horn-showcase-section');
    expect(showcaseSection).toBeTruthy();

    const scenarios = compiled.querySelectorAll('.scenario-card');
    expect(scenarios.length).toBe(4);

    const pillars = compiled.querySelectorAll('.pillar-card');
    expect(pillars.length).toBe(4);
  });
});
