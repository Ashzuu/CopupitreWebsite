import { Component, input } from '@angular/core';

@Component({
  selector: 'copupitre-dashboard-stat-card',
  imports: [],
  templateUrl: './dashboard-stat-card.html',
  styleUrl: './dashboard-stat-card.scss',
})
export class DashboardStatCard {
  /** The label property. */
  label = input.required<string>();
  /** The value property. */
  value = input.required<string>();
  /** The icon property. */
  icon = input.required<string>();
  /** The accentColor property. */
  accentColor = input.required<string>();
}
