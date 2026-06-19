import { Component, input } from '@angular/core';
import { Organization } from '../../../../core/model';

@Component({
  selector: 'copupitre-organization-card',
  imports: [],
  templateUrl: './organization-card.html',
  styleUrl: './organization-card.scss',
})
export class OrganizationCard {
  /** The organization property. */
  organization = input.required<Organization>();
}
