export interface ReinforcementAnnouncement {
  /** The id property. */
  id: number;
  /** The organizationId property. */
  organizationId: number;
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
  /** Alias for eventLocation returned by backend. */
  eventLocation?: string;
  /** The description property. */
  description: string;
  /** The requiredCount property. */
  requiredCount: number;
  /** Alias for requiredQuantity returned by backend. */
  requiredQuantity?: number;
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
  /** Full name of the respondent. */
  respondentFullName?: string;
  /** Principal instrument of the respondent. */
  respondentInstrument?: string;
  /** The respondedAt property. */
  respondedAt: string;
  /** The status property. */
  status: ResponseStatus;
  /** Optional message/justification submitted by the applicant (RG-RENF-10). */
  message?: string;
}

export type ResponseStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
