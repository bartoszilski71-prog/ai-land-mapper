
import { GoogleGenAI, Type } from "@google/genai";
import { ParcelData } from "../types";

export const extractDataFromImages = async (base64Images: string[]): Promise<ParcelData[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Tworzymy części obrazu dla modelu
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
        { text: `Jesteś ekspertem od polskich dokumentów z rejestru gruntów. 
        Wyciągnij dane o działkach i ich właścicielach z załączonych obrazów.
        
        WAŻNE ZASADY:
        1. IGNORUJ dane organu wydającego (np. "Starosta Opolski", "Urząd", "Województwo" w nagłówku). 
        2. Szukaj sekcji "Właściciele", "Władający" lub tabeli z danymi osób.
        3. Numer działki (np. 160902_2.0008.AR_4.480/2) rozbij na TERYT, numer obrębu i numer działki.
        4. Powierzchnię podawaj w formacie z przecinkiem (np. 6,4843).
        5. Numer KW powinien mieć format typu OP1O/00076546/7.
        6. Jeśli na jednej stronie jest wiele osób dla jednej działki, stwórz osobny wiersz dla każdej osoby.
        
        Zwróć dane wyłącznie jako czysty JSON - tablica obiektów ParcelData.` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            teryt: { type: Type.STRING },
            wojewodztwo: { type: Type.STRING },
            powiat: { type: Type.STRING },
            gmina: { type: Type.STRING },
            obreb: { type: Type.STRING },
            nr_obrebu: { type: Type.STRING },
            nr_dzialki: { type: Type.STRING },
            powierzchnia_ha: { type: Type.STRING },
            nr_kw: { type: Type.STRING },
            imie: { type: Type.STRING },
            nazwisko: { type: Type.STRING },
            ulica_nr: { type: Type.STRING },
            kod_pocztowy: { type: Type.STRING },
            miejscowosc: { type: Type.STRING }
          },
          required: ["teryt", "imie", "nazwisko", "nr_dzialki"]
        }
      }
    }
  });

  try {
    const text = response.text || "[]";
    return JSON.parse(text.trim());
  } catch (e) {
    console.error("Błąd parsowania odpowiedzi Gemini:", e);
    return [];
  }
};
