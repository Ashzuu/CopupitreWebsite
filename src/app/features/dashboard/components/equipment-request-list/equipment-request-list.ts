import { LowerCasePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { EquipmentRequest } from '@models/equipment-request';

@Component({
  selector: 'copupitre-equipment-request-list',
  imports: [LowerCasePipe],
  templateUrl: './equipment-request-list.html',
  styleUrl: './equipment-request-list.scss',
})
export class EquipmentRequestList {
  /** The requests property. */
  requests = input.required<EquipmentRequest[]>();

  /** Executes the translateStatus action. */
  translateStatus(status: string): string {
    switch (status) {
      case 'OPEN':
        return 'Ouvert';
      case 'MET':
        return 'Trouvé';
      case 'CLOSED':
        return 'Fermé';
      default:
        return status;
    }
  }
}
