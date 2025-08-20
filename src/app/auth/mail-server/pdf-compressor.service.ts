// src/app/shared/pdf-compressor.service.ts
import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
// @ts-ignore: types are bundled with the lib
import * as pdfjsLib from 'pdfjs-dist';

@Injectable({ providedIn: 'root' })
export class PdfCompressorService {
  // мора да покажеме каде е worker-от (го ставивме во assets)
  private workerReady = false;

  private ensureWorker() {
    if (this.workerReady) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `${document.baseURI}assets/pdf.worker.min.mjs`;
    debugger;
    this.workerReady = true;
  }

  /**
   * Компресира PDF така што ги растеризира страниците во JPEG и составува нов PDF.
   * @param file        оригиналниот PDF
   * @param maxBytes    таргет големина (пр. 800*1024 = ~800KB)
   * @param quality     JPEG квалитет (0.5 - 0.9)
   * @param scale       render скала (1 = 100%; 1.2 = поголема резолуција)
   */
  async compress(
    file: File,
    { maxBytes = 800 * 1024, quality = 0.72, scale = 1.0 } = {}
  ): Promise<File> {
    this.ensureWorker();

    const arrayBuf = await file.arrayBuffer();
    // @ts-ignore
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuf });
    const pdf = await loadingTask.promise;

    // прв пас – пробај со дадени параметри
    let blob = await this.rasterizeToPdfBlob(pdf, { quality, scale });

    // ако уште е голем → намалувај постепено
    let attempts = 0;
    while (blob.size > maxBytes && attempts < 3) {
      attempts++;
      quality = Math.max(0.45, quality - 0.12); // намали квалитет
      scale = Math.max(0.8, scale - 0.1);       // намали резолуција
      blob = await this.rasterizeToPdfBlob(pdf, { quality, scale });
    }

    return new File([blob], this.rename(file.name, '-compressed'), { type: 'application/pdf' });
  }

  private rename(name: string, suffix: string) {
    const dot = name.lastIndexOf('.');
    if (dot < 0) return name + suffix + '.pdf';
    return name.slice(0, dot) + suffix + name.slice(dot);
  }

  private async rasterizeToPdfBlob(
    // @ts-ignore
    pdfDoc: any,
    opts: { quality: number; scale: number }
  ): Promise<Blob> {
    const { quality, scale } = opts;

    const page1 = await pdfDoc.getPage(1);
    const vp1 = page1.getViewport({ scale });
    // користиме px како единица за jsPDF за 1:1 со canvas
    const out = new jsPDF({ unit: 'px', format: [vp1.width, vp1.height] });

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = i === 1 ? page1 : await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale });

      // створиме canvas и рендерираме
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext('2d', { willReadFrequently: false })!;

      // @ts-ignore
      await page.render({ canvasContext: ctx, viewport }).promise;

      const dataUrl = canvas.toDataURL('image/jpeg', quality);

      if (i > 1) out.addPage([viewport.width, viewport.height]);
      out.addImage(dataUrl, 'JPEG', 0, 0, viewport.width, viewport.height);

      // чистење
      canvas.width = 0; canvas.height = 0;
    }

    return out.output('blob');
  }
}
