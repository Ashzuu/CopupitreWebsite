export interface Musician {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  instrument: string;
  userId?: number | null;
  username?: string | null;
  createdAt?: string;
}

export interface CreateMusicianRequest {
  firstName: string;
  lastName: string;
  email: string;
  instrument: string;
}

export interface CsvImportResult {
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  messages: string[];
  musicians: Musician[];
}

export interface AssociateMusicianUserRequest {
  email: string;
}
