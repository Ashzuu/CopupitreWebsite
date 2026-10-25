import { RehearsalSchedule } from './organization';
import { ReinforcementResponse, ReinforcementStatus } from './reinforcement';

export interface PermanentAnnouncement {
  /** Identifiant unique du besoin annuel */
  id: number;
  /** Identifiant de l'organisation émettrice */
  organizationId: number;
  /** Nom de l'organisation */
  organizationName: string;
  /** Ville de l'organisation */
  organizationCity?: string;
  /** Type de formation (Harmonie, Symphonique, etc.) */
  formationType?: string;
  /** Effectif de l'orchestre */
  musicianCount?: number;
  /** Description de l'organisation */
  organizationDescription?: string;
  /** Adresse des répétitions */
  rehearsalAddress?: string;
  /** Remarque sur les horaires */
  rehearsalSchedule?: string;
  /** Horaires réguliers des répétitions */
  regularSchedules?: RehearsalSchedule[];
  /** Pseudos des administrateurs de l'organisation */
  adminUsernames?: string[];

  /** Pupitre recherché */
  instrument: string;
  /** Nombre de places recherchées */
  requiredCount: number;
  /** Nombre de candidatures validées */
  validatedCount: number;
  /** Description du besoin ou niveau requis */
  description?: string;
  /** Statut du recrutement (OPEN ou OBJECTIVE_MET) */
  status: ReinforcementStatus;
  /** Type d'annonce : fixe à PERMANENT */
  type: 'PERMANENT';
  /** Date de publication */
  createdAt?: string;

  /** Candidatures reçues pour cette annonce */
  responses?: ReinforcementResponse[];
}
