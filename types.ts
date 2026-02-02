
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
