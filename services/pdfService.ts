
import { ParcelData } from '../types';

declare const pdfjsLib: any;

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/** Konwertuje PDF na listę obrazów base64 (po jednym na stronę) */
export const convertPdfToImages = async (file: File): Promise<string[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const images: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // Wyższa skala dla lepszej czytelności OCR
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (context) {
      await page.render({ canvasContext: context, viewport }).promise;
      // Konwersja na JPEG dla mniejszego rozmiaru przesyłanego do API
      const base64Image = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
      images.push(base64Image);
    }
  }

  return images;
};
