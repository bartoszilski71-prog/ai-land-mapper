
import { GoogleGenAI, Type } from "@google/genai";
import { ParcelData } from "../types";

export const extractDataFromImages = async (base64Images: string[]): Promise<ParcelData[]> => {
  // Tworzymy nową instancję przy każdym wywołaniu, aby upewnić się, że pobieramy najświeższy klucz API
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const imageParts = base64Images.map(data => ({
    inlineData: {
      data,
      mimeType: "image/jpeg"
    }
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        ...imageParts,
        { text: `Jesteś ekspertem od polskich wypisów z rejestru gruntów. 
        Twoim zadaniem jest wyciągnięcie danych o wszystkich działkach i ich właścicielach widocznych na załączonych obrazach.
        
        ZASADY DOTYCZĄCE MAŁŻEŃSTW I WSPÓŁWŁAŚCICIELI:
        1. JEDEN WIERSZ NA DZIAŁKĘ: Jeśli działka ma wielu właścicieli (np. małżeństwo, współwłasność), NIE twórz osobnych rekordów. Połącz ich dane w jednym obiekcie.
        2. ŁĄCZENIE NAZWISK: W polu 'imie' i 'nazwisko' wpisz dane wszystkich właścicieli rozdzielone przecinkiem lub spójnikiem "i" (np. imie: "JAN, ANNA", nazwisko: "KOWALSCY" lub imie: "JAN i ANNA", nazwisko: "KOWALSCY").
        3. WSPÓLNOŚĆ MAŁŻEŃSKA: Jeśli w dokumencie widnieje "wspólność ustawowa majątkowa małżeńska", potraktuj to jako jeden wpis właścicielski dla danej działki.
        
        ZASADY TECHNICZNE:
        4. TERYT: Musi to być PEŁNY identyfikator (np. 160902_2.0002.AR_1.313). Nie skracaj go!
        5. NR KW: Format np. OP1O/00076546/7. Szukaj go w sekcji 'Księga wieczysta' lub 'Nr KW'.
        6. POWIERZCHNIA: Zawsze podawaj w hektarach [ha]. Format z przecinkiem, np. 0,4532.
        7. ADRES: Wyciągnij ulicę, numer domu, kod pocztowy i miejscowość zamieszkania właściciela.
        
        Zwróć dane wyłącznie jako czysty JSON - tablica obiektów zgodna ze schematem ParcelData.` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            teryt: { type: Type.STRING, description: "Pełny numer TERYT działki" },
            wojewodztwo: { type: Type.STRING },
            powiat: { type: Type.STRING },
            gmina: { type: Type.STRING },
            obreb: { type: Type.STRING, description: "Nazwa obrębu geodezyjnego" },
            nr_obrebu: { type: Type.STRING, description: "Numer obrębu" },
            nr_dzialki: { type: Type.STRING, description: "Numer ewidencyjny działki" },
            powierzchnia_ha: { type: Type.STRING, description: "Powierzchnia w hektarach" },
            nr_kw: { type: Type.STRING, description: "Numer Księgi Wieczystej" },
            imie: { type: Type.STRING, description: "Imiona właścicieli" },
            nazwisko: { type: Type.STRING, description: "Nazwiska właścicieli" },
            ulica_nr: { type: Type.STRING, description: "Ulica i numer domu/lokalu" },
            kod_pocztowy: { type: Type.STRING },
            miejscowosc: { type: Type.STRING }
          },
          required: ["teryt", "nr_dzialki"]
        }
      }
    }
  });

  try {
    const text = response.text || "[]";
    const results: ParcelData[] = JSON.parse(text.trim());
    
    // Deduplikacja po TERYT
    const finalData = results.filter((v, i, a) => 
      v.teryt && a.findIndex(t => t.teryt === v.teryt) === i
    );

    return finalData;
  } catch (e) {
    console.error("Błąd parsowania odpowiedzi Gemini:", e);
    throw new Error("AI zwróciło nieprawidłowy format danych. Spróbuj ponownie za chwilę.");
  }
};
