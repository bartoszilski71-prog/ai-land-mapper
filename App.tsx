
import React, { useState, useCallback } from 'react';
import { ParcelData, ProcessingState } from './types';
import { convertPdfToImages } from './services/pdfService';
import { extractDataFromImages } from './services/geminiService';
import ResultTable from './components/ResultTable';

const App: React.FC = () => {
  const [extractedResults, setExtractedResults] = useState<ParcelData[]>([]);
  const [status, setStatus] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    error: null,
  });

  const resetState = useCallback(() => {
    setExtractedResults([]);
    setStatus({
      isProcessing: false,
      progress: 0,
      error: null,
    });
  }, []);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
        throw new Error("AI nie znalazło danych działek. Upewnij się, że plik to czytelny wypis z rejestru gruntów.");
      }

      setExtractedResults(results);
      setStatus({ isProcessing: false, progress: 100, error: null });
    } catch (err: any) {
      console.error(err);
      setStatus({ 
        isProcessing: false, 
        progress: 0, 
        error: err.message || 'Błąd komunikacji z AI.'
      });
    }
    event.target.value = '';
  }, []);

  return (
    <div className="max-w-[1900px] mx-auto px-6 py-10 min-h-screen font-sans">
      <header className="mb-12 flex flex-col items-center">
        <div className="flex items-center space-x-2 mb-4">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">System AI: Połączono</span>
        </div>
        
        <h1 className="text-5xl font-black text-slate-900 mb-2 tracking-tighter uppercase flex items-center">
          <span className="bg-indigo-600 text-white px-3 py-1 rounded-xl mr-2">LAND</span>
          <span className="text-indigo-600">EXTRACTOR</span>
        </h1>
        <p className="text-slate-500 font-medium">Profesjonalne narzędzie do automatyzacji wypisów geodezyjnych.</p>
      </header>

      {extractedResults.length === 0 && (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
          {/* Main Upload Box */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-4 border border-slate-100 overflow-hidden">
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
              <p className="text-slate-400 mt-2 font-bold uppercase text-[10px] tracking-widest">Obsługuje PDF do 50 stron • Gemini 3.0 Engine</p>
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

          {/* Guidelines for Team */}
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
              <div className="text-sm font-black uppercase tracking-tight">{status.error}</div>
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
