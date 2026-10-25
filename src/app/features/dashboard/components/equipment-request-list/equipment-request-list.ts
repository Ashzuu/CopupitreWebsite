import { LowerCasePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { EquipmentRequest } from '@models/equipment-request';

@Component({
  selector: 'copupitre-equipment-request-list',
  imports: [LowerCasePipe],
  templateUrl: './equipment-request-list.html',
  styleUrl: './equipment-request-list.scss',
})
export class EquipmentRequestList {
  /** Liste des demandes de matériel */
  requests = input.required<EquipmentRequest[]>();
  /** Autorise les actions administrateur (changement de statut, suppression) */
  allowActions = input<boolean>(false);

  /** Événement émis lors d'un changement de statut */
  statusChanged = output<{ request: EquipmentRequest; status: 'OPEN' | 'MET' | 'CLOSED' }>();
  /** Événement émis lors d'une suppression */
  requestDeleted = output<EquipmentRequest>();

  onUpdateStatus(request: EquipmentRequest, status: 'OPEN' | 'MET' | 'CLOSED') {
    this.statusChanged.emit({ request, status });
  }

  onDelete(request: EquipmentRequest) {
    this.requestDeleted.emit(request);
  }

  translateStatus(status: string): string {
    switch (status) {
      case 'OPEN':
        return 'En recherche';
      case 'MET':
        return 'Trouvé';
      case 'CLOSED':
        return 'Clôturé';
      default:
        return status;
    }
  }
}
