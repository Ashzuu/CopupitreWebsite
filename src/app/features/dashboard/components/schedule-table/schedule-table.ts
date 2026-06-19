import { Component, input } from '@angular/core';
import { RehearsalSchedule } from '../../../../core/model';

@Component({
  selector: 'copupitre-schedule-table',
  imports: [],
  templateUrl: './schedule-table.html',
  styleUrl: './schedule-table.scss',
})
export class ScheduleTable {
  /** The schedules property. */
  schedules = input.required<RehearsalSchedule[]>();

  /** Executes the translateDay action. */
  translateDay(day: string): string {
    const map: Record<string, string> = {
      MONDAY: 'Lundi',
      TUESDAY: 'Mardi',
      WEDNESDAY: 'Mercredi',
      THURSDAY: 'Jeudi',
      FRIDAY: 'Vendredi',
      SATURDAY: 'Samedi',
      SUNDAY: 'Dimanche',
    };
    return map[day] || day;
  }
}
