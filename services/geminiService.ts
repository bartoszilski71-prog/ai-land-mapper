
import { GoogleGenAI, Type } from "@google/genai";
import { ParcelData } from "../types";

export const extractDataFromImages = async (base64Images: string[]): Promise<ParcelData[]> => {
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
        Wyciągnij dane o działkach i ich właścicielach z obrazów.
        
        ZASADY DOTYCZĄCE MAŁŻEŃSTW I WSPÓŁWŁAŚCICIELI:
        1. JEDEN WIERSZ NA DZIAŁKĘ: Jeśli działka ma wielu właścicieli (np. małżeństwo, współwłasność), NIE twórz osobnych rekordów. Połącz ich dane w jednym obiekcie.
        2. ŁĄCZENIE NAZWISK: W polu 'imie' i 'nazwisko' wpisz dane wszystkich właścicieli rozdzielone przecinkiem lub spójnikiem "i" (np. imie: "JAN, ANNA", nazwisko: "KOWALSCY" lub imie: "JAN i ANNA", nazwisko: "KOWALSCY").
        3. WSPÓLNOŚĆ MAŁŻEŃSKA: Jeśli w dokumencie widnieje "wspólność ustawowa majątkowa małżeńska", potraktuj to jako jeden wpis właścicielski dla danej działki.
        
        ZASADY TECHNICZNE:
        4. TERYT: Musi to być PEŁNY identyfikator (np. 160902_2.0002.AR_1.313). Nie skracaj go!
        5. NR KW: Format np. OP1O/00076546/7.
        6. POWIERZCHNIA: Format z przecinkiem, np. 0,4532.
        7. IGNORUJ nagłówki urzędowe (Starosta, Urząd itp.).
        
        Zwróć dane jako czysty JSON - tablica obiektów ParcelData.` }
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
          required: ["teryt", "nr_dzialki"]
        }
      }
    }
  });

  try {
    const text = response.text || "[]";
    const results: ParcelData[] = JSON.parse(text.trim());
    
    // Ostateczna deduplikacja po TERYT (gdyby AI mimo wszystko przesłało dwie strony z tą samą działką)
    const finalData = results.filter((v, i, a) => 
      a.findIndex(t => t.teryt === v.teryt) === i
    );

    return finalData;
  } catch (e) {
    console.error("Błąd parsowania odpowiedzi Gemini:", e);
    return [];
  }
};
