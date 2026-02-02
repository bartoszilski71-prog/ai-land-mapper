
import React, { useState, useCallback, useEffect } from 'react';
import { ParcelData, ProcessingState } from './types';
import { convertPdfToImages } from './services/pdfService';
import { extractDataFromImages } from './services/geminiService';
import ResultTable from './components/ResultTable';

declare global {
  interface Window {
    // Corrected to use the expected AIStudio type to avoid declaration conflicts and match environment typings
    aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [extractedResults, setExtractedResults] = useState<ParcelData[]>([]);
  // Initialize as false to properly trigger selection UI if key isn't present
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [status, setStatus] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    error: null,
  });

  useEffect(() => {
    // Initial check for API key availability via process.env or AI Studio selection
    const checkKey = async () => {
      if (process.env.API_KEY) {
        setHasApiKey(true);
      } else {
        try {
          const selected = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(selected);
        } catch {
          setHasApiKey(false);
        }
      }
    };
    checkKey();
  }, []);

  /** Triggers the API key selection dialog provided by the environment */
  const handleSelectKey = async () => {
    try {
      await window.aistudio.openSelectKey();
      // Assume success after triggering the selection dialog to avoid race conditions with key injection
      setHasApiKey(true);
      setStatus(prev => ({ ...prev, error: null }));
    } catch (err) {
      console.error("Failed to open API key selection dialog", err);
    }
  };

  const resetState = useCallback(() => {
    setExtractedResults([]);
    setStatus({
      isProcessing: false,
      progress: 0,
      error: null,
    });
  }, []);

  /** Handles PDF upload, conversion to images, and data extraction via Gemini API */
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!hasApiKey && !process.env.API_KEY) {
      setStatus(prev => ({ ...prev, error: "Najpierw aktywuj system AI klikając przycisk powyżej." }));
      return;
    }

    if (file.type !== 'application/pdf') {
      setStatus(prev => ({ ...prev, error: "Wymagany plik PDF." }));
      return;
    }

    setStatus({ isProcessing: true, progress: 5, error: null });
    setExtractedResults([]);

    try {
      setStatus(prev => ({ ...prev, progress: 20 }));
      const images = await convertPdfToImages(file);
      
      if (images.length === 0) {
        throw new Error("Nie udało się odczytać stron PDF.");
      }

      setStatus(prev => ({ ...prev, progress: 40 }));
      const results = await extractDataFromImages(images);
      
      if (results.length === 0) {
        throw new Error("AI nie znalazło danych. Jeśli błąd się powtarza, sprawdź czy klucz API ma aktywne rozliczenia (billing).");
      }

      setExtractedResults(results);
      setStatus({ isProcessing: false, progress: 100, error: null });
    } catch (err: any) {
      console.error(err);
      // Reset key selection state if the request fails due to invalid/missing key as per guidelines
      if (err.message?.includes("Requested entity was not found") || err.message?.includes("API key")) {
        setHasApiKey(false);
        setStatus({ isProcessing: false, progress: 0, error: "Klucz API wygasł lub jest nieprawidłowy. Wybierz klucz ponownie." });
      } else {
        setStatus({ 
          isProcessing: false, 
          progress: 0, 
          error: err.message || 'Błąd komunikacji z AI.'
        });
      }
    }
    event.target.value = '';
  }, [hasApiKey]);

  return (
    <div className="max-w-[1900px] mx-auto px-6 py-10 min-h-screen font-sans text-slate-900">
      <header className="mb-12 flex flex-col items-center">
        <div className="flex items-center space-x-2 mb-4">
          <span className="flex h-2 w-2 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${hasApiKey ? 'bg-green-400' : 'bg-amber-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${hasApiKey ? 'bg-green-500' : 'bg-amber-500'}`}></span>
          </span>
          <span className={`text-[10px] font-black uppercase tracking-widest ${hasApiKey ? 'text-green-600' : 'text-amber-600'}`}>
            System AI: {hasApiKey ? 'Gotowy' : 'Wymaga Aktywacji'}
          </span>
        </div>
        
        <h1 className="text-5xl font-black text-slate-900 mb-2 tracking-tighter uppercase flex items-center">
          <span className="bg-indigo-600 text-white px-3 py-1 rounded-xl mr-2">LAND</span>
          <span className="text-indigo-600">EXTRACTOR</span>
        </h1>
        <p className="text-slate-500 font-medium text-center">Inteligentna analiza dokumentów geodezyjnych w chmurze.</p>
      </header>

      {extractedResults.length === 0 && (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
          
          {!hasApiKey && !process.env.API_KEY && (
            <div className="bg-amber-50 border-2 border-amber-100 p-8 rounded-[2.5rem] text-center shadow-xl shadow-amber-100/50">
              <h3 className="text-amber-800 font-black uppercase text-lg mb-2">Konfiguracja Wymagana</h3>
              <p className="text-amber-700 text-sm mb-6 max-w-md mx-auto">Aby korzystać z aplikacji, musisz wybrać klucz API z projektu Google Cloud z włączonymi płatnościami.</p>
              <button 
                onClick={handleSelectKey}
                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all transform hover:scale-105 shadow-lg"
              >
                Podepnij Klucz API (Google)
              </button>
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                className="block mt-4 text-[10px] text-amber-600 underline font-bold uppercase"
                rel="noreferrer"
              >
                Dokumentacja rozliczeń API
              </a>
            </div>
          )}

          {/* Main Upload Box */}
          <div className={`bg-white rounded-[2.5rem] shadow-2xl p-4 border border-slate-100 overflow-hidden transition-opacity ${(!hasApiKey && !process.env.API_KEY) ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            <div className="bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2rem] py-20 px-10 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group relative text-center">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={status.isProcessing}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`mx-auto w-20 h-20 rounded-3xl flex items-center justify-center mb-6 transition-all duration-500 ${status.isProcessing ? 'bg-indigo-600 rotate-180 scale-110 shadow-indigo-200 shadow-2xl' : 'bg-white shadow-xl group-hover:scale-110'}`}>
                <svg className={`w-10 h-10 ${status.isProcessing ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                {status.isProcessing ? "Analizuję Twój dokument..." : "Upuść PDF tutaj"}
              </h2>
              <p className="text-slate-400 mt-2 font-bold uppercase text-[10px] tracking-widest">Obsługuje PDF do 50 stron • Gemini Engine</p>
            </div>

            {status.isProcessing && (
              <div className="p-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Postęp analizy wizualnej</span>
                  <span className="text-xl font-black text-indigo-600">{status.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-700 shadow-lg shadow-indigo-100" 
                    style={{ width: `${status.progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black mb-4 shadow-lg shadow-indigo-100">1</div>
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-2">Przygotuj Plik</h3>
              <p className="text-slate-500 text-xs leading-relaxed">System najlepiej radzi sobie z oryginalnymi PDF-ami lub skanami w rozdzielczości min. 300 DPI.</p>
            </div>
            <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black mb-4 shadow-lg shadow-indigo-100">2</div>
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-2">Sprawdź Małżeństwa</h3>
              <p className="text-slate-500 text-xs leading-relaxed">AI automatycznie łączy małżeństwa w jeden rekord, abyś nie musiał ręcznie scalać danych w Excelu.</p>
            </div>
            <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black mb-4 shadow-lg shadow-indigo-100">3</div>
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-2">Export Excel</h3>
              <p className="text-slate-500 text-xs leading-relaxed">Po zakończeniu kliknij "Kopiuj do Excela" i wklej dane (Ctrl+V) bezpośrednio do swojego arkusza.</p>
            </div>
          </div>

          {status.error && (
            <div className="p-6 bg-red-50 border-2 border-red-100 rounded-3xl text-red-700 flex items-center animate-bounce">
              <svg className="w-6 h-6 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div className="text-sm font-black uppercase tracking-tight max-w-lg">{status.error}</div>
              <button onClick={resetState} className="ml-auto bg-red-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase">Ponów</button>
            </div>
          )}
        </div>
      )}

      {extractedResults.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <ResultTable data={extractedResults} onReset={resetState} />
        </div>
      )}

      <footer className="mt-20 text-center opacity-30">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Secure Internal Processing • No Data Stored</p>
      </footer>
    </div>
  );
};

export default App;
