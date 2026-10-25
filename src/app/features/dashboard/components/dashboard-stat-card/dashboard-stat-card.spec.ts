import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardStatCard } from './dashboard-stat-card';

describe('DashboardStatCard', () => {
  let component: DashboardStatCard;
  let fixture: ComponentFixture<DashboardStatCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardStatCard],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardStatCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('label', 'Mes organisations');
    fixture.componentRef.setInput('value', '3');
    fixture.componentRef.setInput('icon', 'pi-users');
    fixture.componentRef.setInput('accentColor', '#EF8354');
    fixture.detectChanges();
  });

  it('devrait être créé avec succès', () => {
    expect(component).toBeTruthy();
  });

  it('devrait afficher la valeur et le label corrects', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.stat-card__value')?.textContent).toContain('3');
    expect(el.querySelector('.stat-card__label')?.textContent).toContain('Mes organisations');
  });

  it('devrait appliquer la couleur d\'accentuation et l\'icône', () => {
    const el = fixture.nativeElement as HTMLElement;
    const iconEl = el.querySelector('i');
    expect(iconEl?.className).toContain('pi');
    expect(iconEl?.className).toContain('pi-users');
  });
});
