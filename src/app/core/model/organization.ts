export interface Concert {
  /** The id property. */
  id: number;
  /** The title property. */
  title: string;
  /** The date property. */
  date: string;
  /** The location property. */
  location: string;
  /** The description property. */
  description: string;
}

export interface AnnualNeed {
  /** The id property. */
  id: number;
  /** The instrument property. */
  instrument: string;
  /** The count property. */
  count: number;
  /** The description property. */
  description: string;
}

export interface Organization {
  /** The id property. */
  id: number;
  /** The name property. */
  name: string;
  /** The city property. */
  city: string;
  /** The description property. */
  description: string;
  /** The rehearsalSchedules property. */
  rehearsalSchedules: RehearsalSchedule[];
  /** The adminUsernames property. */
  adminUsernames: string[];
  /** The concerts property. */
  concerts?: Concert[];
  /** The annualNeeds property. */
  annualNeeds?: AnnualNeed[];
  /** The musicianCount property. */
  musicianCount?: number;
  /** The rehearsalManuals property. */
  rehearsalManuals?: RehearsalManual[];
}

export interface RehearsalManual {
  /** The id property. */
  id: number;
  /** The date property. */
  date: string;
  /** The startTime property. */
  startTime: string;
  /** The endTime property. */
  endTime: string;
  /** The location property. */
  location: string;
}

export interface RehearsalSchedule {
  /** The id property. */
  id: number;
  /** The dayOfWeek property. */
  dayOfWeek: DayOfWeek;
  /** The startTime property. */
  startTime: string;
  /** The endTime property. */
  endTime: string;
  /** The location property. */
  location: string;
  /** The organizationName property. */
  organizationName?: string;
}

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';
