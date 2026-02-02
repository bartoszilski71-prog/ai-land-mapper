
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
      // KROK 1: Konwersja PDF na obrazy
      setStatus(prev => ({ ...prev, progress: 20 }));
      const images = await convertPdfToImages(file);
      
      if (images.length === 0) {
        throw new Error("Nie udało się odczytać stron PDF.");
      }

      // KROK 2: Analiza wizualna przez Gemini
      setStatus(prev => ({ ...prev, progress: 40 }));
      const results = await extractDataFromImages(images);
      
      if (results.length === 0) {
        throw new Error("AI nie znalazło danych działek na dokumentach. Upewnij się, że to poprawny wypis.");
      }

      setExtractedResults(results);
      setStatus({ isProcessing: false, progress: 100, error: null });
    } catch (err: any) {
      console.error(err);
      setStatus({ 
        isProcessing: false, 
        progress: 0, 
        error: err.message || 'Wystąpił nieoczekiwany błąd podczas analizy AI.'
      });
    }
  }, []);

  return (
    <div className="max-w-[1900px] mx-auto px-6 py-10">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight uppercase flex items-center justify-center">
          <svg className="w-10 h-10 mr-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
          </svg>
          AI Land <span className="text-indigo-600 ml-2">Mapper</span>
        </h1>
        <p className="text-gray-500 font-medium">Przetwarzanie dokumentów z rejestru gruntów za pomocą wizji AI.</p>
      </header>

      <div className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-100 mb-10 max-w-4xl mx-auto transition-all">
        <div className="flex flex-col items-center justify-center border-4 border-dotted border-gray-200 rounded-[2rem] py-16 px-8 hover:border-indigo-500 transition-all cursor-pointer bg-slate-50 hover:bg-indigo-50 group relative">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={status.isProcessing}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className={`p-6 rounded-full ${status.isProcessing ? 'bg-indigo-100 animate-bounce' : 'bg-white shadow-sm'} mb-6 group-hover:scale-110 transition-transform`}>
            <svg className={`w-12 h-12 ${status.isProcessing ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-xl font-black text-gray-400 group-hover:text-indigo-600 uppercase tracking-tighter transition-colors">
            {status.isProcessing ? "AI Analizuje dokument..." : "Wgraj plik PDF (Wypis)"}
          </span>
          <p className="mt-2 text-xs text-gray-400 font-bold uppercase tracking-widest">Wizja komputerowa Gemini 3.0</p>
        </div>

        {status.isProcessing && (
          <div className="mt-12 px-4">
            <div className="flex justify-between items-end mb-4">
              <div>
                <span className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Status Procesu</span>
                <span className="text-sm font-bold text-gray-800">
                  {status.progress < 30 ? "Konwersja na obrazy..." : 
                   status.progress < 90 ? "Analiza wizualna AI..." : "Finalizowanie danych..."}
                </span>
              </div>
              <span className="text-2xl font-black text-indigo-600">{status.progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-4 p-1">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(79,70,229,0.5)]" 
                style={{ width: `${status.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {status.error && (
          <div className="mt-8 p-6 bg-rose-50 border-2 border-rose-100 rounded-2xl text-rose-700 font-bold flex items-start">
             <div className="bg-rose-100 p-2 rounded-lg mr-4 mt-0.5">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
               </svg>
             </div>
             <div>
               <p className="text-xs uppercase tracking-widest mb-1 font-black">Błąd Krytyczny</p>
               {status.error}
             </div>
          </div>
        )}
      </div>

      {extractedResults.length > 0 && <ResultTable data={extractedResults} />}

      <footer className="mt-20 text-center">
        <div className="inline-block px-4 py-2 bg-slate-100 rounded-full text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">
          Powered by Gemini Vision AI • No local Regex fallback
        </div>
      </footer>
    </div>
  );
};

export default App;
