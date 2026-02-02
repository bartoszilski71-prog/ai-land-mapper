
import React, { useState } from 'react';
import { ParcelData } from '../types';

interface ResultTableProps {
  data: ParcelData[];
  onReset: () => void;
}

const ResultTable: React.FC<ResultTableProps> = ({ data, onReset }) => {
  const [copied, setCopied] = useState(false);

  if (data.length === 0) return null;

  const exportToCSV = () => {
    const headers = ["Teryt", "Województwo", "Powiat", "Gmina", "Obręb", "nr obrębu", "nr działki", "Powierzchnia [ha]", "nr KW", "imię", "nazwisko", "ulica i nr", "kodpocztowy", "miejscowość"];
    const rows = data.map(item => [
      item.teryt, item.wojewodztwo, item.powiat, item.gmina, item.obreb, item.nr_obrebu, item.nr_dzialki, item.powierzchnia_ha, item.nr_kw, item.imie, item.nazwisko, item.ulica_nr, item.kod_pocztowy, item.miejscowosc
    ]);
    
    const csvContent = "\uFEFF" 
      + headers.join(";") + "\n" 
      + rows.map(e => e.map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(";")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dzialki_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = () => {
    const headers = ["Teryt", "Województwo", "Powiat", "Gmina", "Obręb", "nr obrębu", "nr działki", "Powierzchnia [ha]", "nr KW", "imię", "nazwisko", "ulica i nr", "kodpocztowy", "miejscowość"];
    const rows = data.map(item => [
      item.teryt, item.wojewodztwo, item.powiat, item.gmina, item.obreb, item.nr_obrebu, item.nr_dzialki, item.powierzchnia_ha, item.nr_kw, item.imie, item.nazwisko, item.ulica_nr, item.kod_pocztowy, item.miejscowosc
    ]);

    // Format TSV (Tab Separated Values) jest idealny do wklejania bezpośrednio do Excela
    const tsvContent = headers.join("\t") + "\n" + 
      rows.map(row => row.map(val => (val || '').toString().replace(/\t/g, ' ')).join("\t")).join("\n");

    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mt-8 bg-white shadow-2xl rounded-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-slate-900 px-8 py-5 flex flex-wrap gap-4 justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          </div>
          <h2 className="text-white font-black text-xs tracking-[0.2em] uppercase">Wyniki analizy</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={copyToClipboard}
            className={`${copied ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-500'} text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all transform hover:-translate-y-0.5 shadow-lg flex items-center min-w-[160px] justify-center`}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                SKOPIOWANO!
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                KOPIUJ DO EXCELA
              </>
            )}
          </button>

          <button 
            onClick={exportToCSV}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all transform hover:-translate-y-0.5 shadow-lg flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            POBIERZ .CSV
          </button>

          <div className="w-px h-8 bg-slate-700 mx-2 hidden sm:block"></div>

          <button 
            onClick={onReset}
            className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all"
          >
            NOWY PLIK
          </button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-gray-300">
        <table className="w-full text-[11px] text-left border-collapse min-w-[2200px]">
          <thead className="sticky top-0 bg-slate-50 z-30 shadow-sm">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-4 font-bold text-slate-500 uppercase tracking-tighter w-[220px] border-r border-slate-100">Pełny Teryt (ID)</th>
              <th className="px-4 py-4 font-bold text-slate-500 uppercase tracking-tighter w-[140px] border-r border-slate-100">Województwo</th>
              <th className="px-4 py-4 font-bold text-slate-500 uppercase tracking-tighter w-[140px] border-r border-slate-100">Powiat</th>
              <th className="px-4 py-4 font-bold text-slate-500 uppercase tracking-tighter w-[140px] border-r border-slate-100">Gmina</th>
              <th className="px-4 py-4 font-bold text-slate-500 uppercase tracking-tighter w-[180px] border-r border-slate-100">Obręb</th>
              <th className="px-4 py-4 font-bold text-slate-500 uppercase tracking-tighter w-[100px] text-center border-r border-slate-100">nr działki</th>
              <th className="px-4 py-4 font-bold text-slate-500 uppercase tracking-tighter w-[120px] text-right border-r border-slate-100">Pow. [ha]</th>
              <th className="px-4 py-4 font-bold text-slate-500 uppercase tracking-tighter w-[160px] border-r border-slate-100">nr KW</th>
              <th className="px-4 py-4 font-bold text-slate-500 uppercase tracking-tighter w-[240px] border-r border-slate-100">Właściciel(e) - Imię</th>
              <th className="px-4 py-4 font-bold text-slate-500 uppercase tracking-tighter w-[240px] border-r border-slate-100">Właściciel(e) - Nazwisko</th>
              <th className="px-4 py-4 font-bold text-slate-500 uppercase tracking-tighter w-[200px] border-r border-slate-100">Adres</th>
              <th className="px-4 py-4 font-bold text-slate-500 uppercase tracking-tighter w-[100px] border-r border-slate-100 text-center">Kod</th>
              <th className="px-4 py-4 font-bold text-slate-500 uppercase tracking-tighter w-[160px]">Miejscowość</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-indigo-50/50 transition-colors group">
                <td className="px-4 py-3 border-r border-slate-50 font-mono text-indigo-600 group-hover:font-bold truncate">{item.teryt}</td>
                <td className="px-4 py-3 border-r border-slate-50 uppercase text-slate-600">{item.wojewodztwo}</td>
                <td className="px-4 py-3 border-r border-slate-50 text-slate-600">{item.powiat}</td>
                <td className="px-4 py-3 border-r border-slate-50 text-slate-600">{item.gmina}</td>
                <td className="px-4 py-3 border-r border-slate-50 font-bold text-slate-800">{item.obreb}</td>
                <td className="px-4 py-3 border-r border-slate-50 text-center font-black text-indigo-600">{item.nr_dzialki}</td>
                <td className="px-4 py-3 border-r border-slate-50 text-right font-mono font-black text-slate-900 bg-slate-50/50">{item.powierzchnia_ha}</td>
                <td className="px-4 py-3 border-r border-slate-50 font-mono text-blue-800 font-bold">{item.nr_kw}</td>
                <td className="px-4 py-3 border-r border-slate-50 truncate text-slate-700">{item.imie}</td>
                <td className="px-4 py-3 border-r border-slate-50 font-black truncate text-slate-900 uppercase">{item.nazwisko}</td>
                <td className="px-4 py-3 border-r border-slate-50 italic text-slate-600">{item.ulica_nr}</td>
                <td className="px-4 py-3 border-r border-slate-50 text-center font-mono font-bold text-slate-700">{item.kod_pocztowy}</td>
                <td className="px-4 py-3 uppercase font-bold text-slate-800">{item.miejscowosc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-400 font-black flex justify-between items-center uppercase tracking-widest">
        <span>Przetwarzanie dokumentu zakończone pomyślnie</span>
        <div className="flex items-center space-x-4">
          <span className="text-slate-900">Rekordy: {data.length}</span>
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></span>
          <span>Silnik: Gemini 3.0 Vision</span>
        </div>
      </div>
    </div>
  );
};

export default ResultTable;
