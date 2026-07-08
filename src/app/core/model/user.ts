export interface UserProfile {
  /** The id property. */
  id: number;
  /** The username property. */
  username: string;
  /** The firstName property. */
  firstName: string;
  /** The lastName property. */
  lastName: string;
  /** The mainInstrument property. */
  mainInstrument: string;
  /** The secondaryInstruments property. */
  secondaryInstruments?: string[];
  /** The musicalDescription property. */
  musicalDescription?: string;
  /** The yearsOfPractice property. */
  yearsOfPractice?: number;
}
