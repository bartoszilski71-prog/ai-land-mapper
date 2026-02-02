
export interface ParcelData {
  teryt: string;
  wojewodztwo: string;
  powiat: string;
  gmina: string;
  obreb: string;
  nr_obrebu: string;
  nr_dzialki: string;
  powierzchnia_ha: string;
  nr_kw: string;
  imie: string;
  nazwisko: string;
  ulica_nr: string;
  kod_pocztowy: string;
  miejscowosc: string;
}

export interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  error: string | null;
}

// Interface for data extracted via Gemini AI from document images to fix the import error
export interface ExtractedData {
  imie: string;
  nazwisko: string;
  numerDzialki: string;
  ulicaINumer: string;
  miasto: string;
  kodPocztowy: string;
}
