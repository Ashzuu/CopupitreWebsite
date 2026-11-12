export type EventType = 'REHEARSAL' | 'CONCERT';

export type AbsenceStatus = 'PENDING' | 'JUSTIFIED' | 'UNJUSTIFIED';

export interface Absence {
  id: number;
  organizationId: number;
  musicianId: number;
  musicianFirstName: string;
  musicianLastName: string;
  musicianEmail: string;
  instrument: string;
  eventType: EventType;
  eventDate: string;
  endDate?: string | null;
  reason: string;
  status: AbsenceStatus;
  submittedByAdmin: boolean;
  createdAt: string;
}

export interface CreateAbsenceRequest {
  musicianId: number;
  eventType: EventType;
  eventDate: string;
  endDate?: string | null;
  reason: string;
  status?: AbsenceStatus;
}

export interface UpdateAbsenceStatusRequest {
  status: AbsenceStatus;
}

export interface AbsenceStats {
  musicianId: number;
  musicianName: string;
  musicianEmail: string;
  instrument: string;
  totalAbsences: number;
  justifiedCount: number;
  unjustifiedCount: number;
  pendingCount: number;
}

export interface CancelEventNotificationRequest {
  eventType: EventType;
  eventDate: string;
  message: string;
}
