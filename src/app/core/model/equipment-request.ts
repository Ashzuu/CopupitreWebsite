export interface EquipmentRequest {
  /** The id property. */
  id: number;
  /** The title property. */
  title: string;
  /** The organizationId property. */
  organizationId: number;
  /** The organizationName property. */
  organizationName: string;
  /** The equipmentName property. */
  equipmentName: string;
  /** The duration property. */
  duration: string;
  /** The eventDates property. */
  eventDates: string[];
  /** The status property. */
  status: 'OPEN' | 'MET' | 'CLOSED';
  /** The description property. */
  description?: string;
}
