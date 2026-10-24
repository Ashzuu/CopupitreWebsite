export interface UserProfile {
  /** Identifiant unique en base de données. */
  id?: number;
  /** Nom d'utilisateur (pseudo unique). */
  username?: string;
  /** Prénom du musicien. */
  firstName: string;
  /** Nom du musicien. */
  lastName: string;
  /** Instrument principal pratiqué. */
  mainInstrument: string;
  /** Instruments secondaires optionnels. */
  secondaryInstruments?: string[];
  /** Description ou parcours musical du musicien. */
  musicalDescription?: string;
  /** Nombre d'années de pratique musicale. */
  yearsOfPractice?: number | null;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  mainInstrument: string;
  secondaryInstruments?: string[];
  musicalDescription?: string;
  yearsOfPractice?: number | null;
}
