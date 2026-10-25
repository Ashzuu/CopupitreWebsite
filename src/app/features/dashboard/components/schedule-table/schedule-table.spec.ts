import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleTable } from './schedule-table';
import { RehearsalSchedule } from '@models/organization';

describe('ScheduleTable', () => {
  let component: ScheduleTable;
  let fixture: ComponentFixture<ScheduleTable>;

  const mockSchedules: RehearsalSchedule[] = [
    {
      id: 1,
      dayOfWeek: 'MONDAY',
      startTime: '20:00',
      endTime: '22:00',
      location: 'Salle polyvalente',
    },
    {
      id: 2,
      dayOfWeek: 'FRIDAY',
      startTime: '19:30',
      endTime: '21:30',
      location: 'Conservatoire',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleTable],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleTable);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('schedules', mockSchedules);
    fixture.detectChanges();
  });

  it('devrait être créé avec succès', () => {
    expect(component).toBeTruthy();
  });

  it('devrait traduire correctement les jours de la semaine', () => {
    expect(component.translateDay('MONDAY')).toBe('Lundi');
    expect(component.translateDay('FRIDAY')).toBe('Vendredi');
    expect(component.translateDay('UNKNOWN')).toBe('UNKNOWN');
  });

  it('devrait afficher les lignes de planning dans le tableau', () => {
    const el = fixture.nativeElement as HTMLElement;
    const rows = el.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Lundi');
    expect(rows[0].textContent).toContain('20:00 - 22:00');
    expect(rows[0].textContent).toContain('Salle polyvalente');
  });
});
