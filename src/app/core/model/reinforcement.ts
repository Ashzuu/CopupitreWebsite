export interface ReinforcementAnnouncement {
  /** The id property. */
  id: number;
  /** The title property. */
  title: string;
  /** The organizationName property. */
  organizationName: string;
  /** The instrumentNeeded property. */
  instrumentNeeded: string;
  /** The eventDate property. */
  eventDate: string;
  /** The deadline property. */
  deadline: string;
  /** The location property. */
  location: string;
  /** The description property. */
  description: string;
  /** The requiredCount property. */
  requiredCount: number;
  /** The validatedCount property. */
  validatedCount: number;
  /** The status property. */
  status: ReinforcementStatus;
  /** The createdAt property. */
  createdAt: string;
  /** The responses property. */
  responses?: ReinforcementResponse[];
}

export type ReinforcementStatus = 'OPEN' | 'OBJECTIVE_MET' | 'CLOSED';

export interface ReinforcementResponse {
  /** The id property. */
  id: number;
  /** The announcementId property. */
  announcementId: number;
  /** The announcementTitle property. */
  announcementTitle: string;
  /** The respondentUsername property. */
  respondentUsername: string;
  /** The respondedAt property. */
  respondedAt: string;
  /** The status property. */
  status: ResponseStatus;
}

export type ResponseStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
