// src/app/shared/invoice-pdf.service.ts
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { InvoiceDto, InvoiceBillingDetails } from './invoice.api';
import {
  INVOICE_ISSUER,
  INVOICE_VAT_NOTE,
  INVOICE_DISCLAIMER
} from './invoice-issuer.config';

import { TranslateService } from '@ngx-translate/core';
import { ROBOTO_NORMAL } from './fonts/roboto-normal';

import { INVOICE_LOGO_BASE64, INVOICE_LOGO_MIME } from './invoice-logo';

@Injectable({ providedIn: 'root' })
export class InvoicePdfService {
  private fontRegistered = false;

  constructor(private translate: TranslateService) {}

  private t(key: string, fallback: string): string {
    const v = this.translate.instant(key);
    return v && v !== key ? v : fallback;
  }

  private registerFont(doc: jsPDF): void {
    if (this.fontRegistered) {
      doc.setFont('Roboto', 'normal');
      return;
    }

    if (!ROBOTO_NORMAL || ROBOTO_NORMAL.includes('PASTE_BASE64_TTF_HERE')) {
      console.warn('[InvoicePdfService] Roboto font not configured, using helvetica.');
      doc.setFont('helvetica', 'normal');
      return;
    }

    try {
      (doc as any).addFileToVFS('Roboto-Regular.ttf', ROBOTO_NORMAL.trim());
      (doc as any).addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
      doc.setFont('Roboto', 'normal');
      this.fontRegistered = true;
    } catch (err) {
      console.error('[InvoicePdfService] Failed to register Roboto font', err);
      doc.setFont('helvetica', 'normal');
    }
  }

  generateInvoicePdf(inv: InvoiceDto, billingDetails?: InvoiceBillingDetails | null): void {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    this.registerFont(doc);

    // ===== Page ==========================================================
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const marginX = 40;
    const marginTop = 22;
    const contentW = pageW - marginX * 2;
    const rightX = pageW - marginX;

    // ===== Theme =========================================================
    const clrHeaderBg: [number, number, number] = [245, 246, 248];
    const clrCardBg: [number, number, number] = [255, 255, 255];
    const clrBorder: [number, number, number] = [225, 228, 235];
    const clrMuted: [number, number, number] = [102, 112, 133];
    const clrText: [number, number, number] = [16, 24, 40];
    const clrPrimary: [number, number, number] = [13, 110, 253];

    const cardRadius = 10;

    // ===== Helpers =======================================================
    const setTextColor = (rgb: [number, number, number]) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    const setFill = (rgb: [number, number, number]) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    const setDraw = (rgb: [number, number, number]) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);

    const cleanBase64 = (v: string) =>
      v.replace(/^data:image\/(png|jpeg);base64,/, '').trim();

    const money = (v: number) =>
      v.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // ===== Data ==========================================================
    const amountEur = this.toEuros(inv.amount);
    const pkg = inv.package;

    const billing = billingDetails ?? inv.billing_details ?? null;

    const created = inv.createdAt ? new Date(inv.createdAt) : new Date();
    const dateStr = created.toLocaleDateString('en-GB');

    const invoiceNumber = `INV-${created.toISOString().slice(0, 10).replace(/-/g, '')}-${inv.id}`;

    const isPaid = inv.status === 'PAID' || inv.status === 'SUCCESS';
    const isPending = inv.status === 'PENDING';

    // ===== Header layout =================================================
    const headerY = marginTop;
    const headerH = 186; // малку повеќе воздух

    // inner padding
    const headerPadX = 28;
    const headerPadY = 18; // ✅ помало => логото оди погоре

    const headerLeftX = marginX + headerPadX;
    const headerRightX = marginX + contentW - headerPadX;

    // Draw header bg
    setFill(clrHeaderBg);
    doc.rect(marginX, headerY, contentW, headerH, 'F');

    // Bottom separator
    setDraw([235, 238, 244]);
    doc.setLineWidth(1);
    doc.rect(24, 24, pageW - 48, pageH - 48);
    doc.line(marginX, headerY + headerH, marginX + contentW, headerY + headerH);

    // ===== Logo (top-right) =============================================
    // ✅ поголемо + погоре
    const logoW = 148;
    const logoH = 54;
    const logoX = headerRightX - logoW;
    const logoY = headerY + headerPadY - 2; // мал “lift” нагоре

    const DRAW_LOGO_BADGE = false;

    if (DRAW_LOGO_BADGE) {
      const badgePad = 10;
      setFill([255, 255, 255]);
      setDraw(clrBorder);
      doc.roundedRect(
        logoX - badgePad,
        logoY - badgePad,
        logoW + badgePad * 2,
        logoH + badgePad * 2,
        10,
        10,
        'FD'
      );
    }

    if (INVOICE_LOGO_BASE64 && !INVOICE_LOGO_BASE64.includes('PASTE_BASE64')) {
      try {
        doc.addImage(
          cleanBase64(INVOICE_LOGO_BASE64),
          INVOICE_LOGO_MIME,
          logoX,
          logoY,
          logoW,
          logoH,
          undefined,
          'FAST'
        );
      } catch (e) {
        console.warn('[InvoicePdfService] Logo addImage failed', e);
      }
    }

    // ===== Watermark (header) ============================================
    // ✅ “Paid / Pagato” + помали букви + помал фонт
    if (isPaid) {
      try {
        const GState = (doc as any).GState;
        doc.setGState(new GState({ opacity: 0.05 })); // пофино

        const wmText = 'Paid / Pagato';

        doc.setFont(this.fontRegistered ? 'Roboto' : 'helvetica', 'bold');
        doc.setFontSize(40);
        doc.setTextColor(16, 24, 40);

        const wmX = marginX + contentW / 2;
        const wmY = headerY + headerH / 2 + 10;

        doc.text(wmText, wmX, wmY, { align: 'center', angle: -18 });

        doc.setFont(this.fontRegistered ? 'Roboto' : 'helvetica', 'normal');
        doc.setGState(new GState({ opacity: 1 }));
      } catch {
        // ignore if GState not available
      }
    }

    // ===== Issuer (left) ================================================
    let issuerY = headerY + headerPadY + 6;

    doc.setFontSize(14);
    setTextColor(clrText);
    doc.text(INVOICE_ISSUER.legalName, headerLeftX, issuerY);

    doc.setFontSize(9);
    setTextColor(clrMuted);

    const issuerLines = this.compactStrings([
      INVOICE_ISSUER.legalForm,
      INVOICE_ISSUER.address ? `${INVOICE_ISSUER.address}` : undefined,
      (INVOICE_ISSUER.zipcode && INVOICE_ISSUER.city && INVOICE_ISSUER.country)
        ? `${INVOICE_ISSUER.zipcode} ${INVOICE_ISSUER.city} (${INVOICE_ISSUER.country})`
        : undefined,
      INVOICE_ISSUER.vatNumber ? `P.IVA / VAT: ${INVOICE_ISSUER.vatNumber}` : undefined,
      INVOICE_ISSUER.email ? `Email: ${INVOICE_ISSUER.email}` : undefined,
    ]);

    issuerY += 16;
    issuerLines.forEach((line) => {
      const wrapped = doc.splitTextToSize(line, 280);
      doc.text(wrapped, headerLeftX, issuerY);
      issuerY += wrapped.length * 11;
    });

    // ===== Invoice meta (right under logo) ===============================
    // ✅ мета блокот малку поблиску/поубаво после поголемо лого
    const metaTitleY = logoY + logoH + 18;
    const metaLineH = 12;

    // ✅ ако сакаш двојазичен title како во PDF:
    // (можеш и со Translate keys ако сакаш)
    doc.setFontSize(16);
    setTextColor(clrText);
    doc.text('INVOICE / FATTURA', headerRightX, metaTitleY, { align: 'right' });

    doc.setFontSize(9);
    setTextColor(clrMuted);

    doc.text(`${this.t('INVOICE_NUMBER', 'Invoice N.')}: ${invoiceNumber}`, headerRightX, metaTitleY + metaLineH * 2, { align: 'right' });
    doc.text(`${this.t('INVOICE_DATE', 'Date')}: ${dateStr}`, headerRightX, metaTitleY + metaLineH * 3, { align: 'right' });
    doc.text(`${this.t('INVOICE_INTERNAL_ID', 'Internal ID')}: ${String(inv.id)}`, headerRightX, metaTitleY + metaLineH * 4, { align: 'right' });

    // ===== Body start ====================================================
    let cursorY = headerY + headerH + 22;

    // ===== Cards: Bill To + Summary =====================================
    const gap = 14;

    const billCardW = Math.round(contentW * 0.62);
    const sumCardW = contentW - billCardW - gap;

    const cardH = 96; // fixed for symmetry

    const billX = marginX;
    const sumX = marginX + billCardW + gap;

    // draw bill card
    setFill(clrCardBg);
    setDraw(clrBorder);
    doc.setLineWidth(1);
    doc.roundedRect(billX, cursorY, billCardW, cardH, cardRadius, cardRadius, 'FD');

    // draw summary card
    setFill(clrCardBg);
    setDraw(clrBorder);
    doc.roundedRect(sumX, cursorY, sumCardW, cardH, cardRadius, cardRadius, 'FD');

    // Bill To content
    const billPadX = 14;
    const billPadY = 18;

    doc.setFontSize(11);
    setTextColor(clrText);
    doc.text(this.t('INVOICE_BILL_TO', 'Bill to:'), billX + billPadX, cursorY + billPadY);

    const buyerLines: string[] = [];
    if (billing) {
      const topName = (billing.companyName || billing.email || '').trim();
      if (topName) buyerLines.push(topName);

      const line1 = [billing.address1, billing.buildingNumber].filter(Boolean).join(' ');
      if (line1) buyerLines.push(line1);

      if (billing.address2) buyerLines.push(String(billing.address2));

      const statePart = billing.stateCode ? `(${billing.stateCode})` : '';
      const lineCity = `${billing.zipcode ?? ''} ${billing.city ?? ''} ${statePart} - ${billing.nation ?? ''}`
        .replace(/\s+/g, ' ')
        .trim();
      if (lineCity) buyerLines.push(lineCity);

      if (billing.vatNumber) buyerLines.push(`VAT / Tax ID: ${billing.vatNumber}`);
      if (billing.email) buyerLines.push(`Email: ${billing.email}`);
    } else {
      buyerLines.push(this.t('INVOICE_NO_BILLING', 'No billing details available'));
    }

    // name bold
    const lineH = 12;
    let billTextY = cursorY + billPadY + 18;

    if (buyerLines.length) {
      doc.setFontSize(10);
      setTextColor(clrText);
      doc.setFont(this.fontRegistered ? 'Roboto' : 'helvetica', 'bold');
      doc.text(String(buyerLines[0]), billX + billPadX, billTextY);

      doc.setFont(this.fontRegistered ? 'Roboto' : 'helvetica', 'normal');
      setTextColor(clrMuted);
      billTextY += 14;

      buyerLines.slice(1, 5).forEach((l) => {
        doc.text(String(l), billX + billPadX, billTextY);
        billTextY += lineH;
      });
    }

    // Summary content (right card)
    const sumPad = 14;
    const sumLeft = sumX + sumPad;
    const sumRight = sumX + sumCardW - sumPad;

    const statusLabel = this.t('INVOICE_STATUS', 'Status');
    const currencyLabel = this.t('INVOICE_CURRENCY', 'Currency');
    const vatLabel = this.t('INVOICE_VAT', 'VAT');

    // status row
    let sumY = cursorY + 28;

    doc.setFontSize(10);
    setTextColor(clrMuted);
    doc.text(`${statusLabel}:`, sumLeft, sumY);

    // status pill
    const pillText = isPaid ? 'PAID / PAGATO' : isPending ? 'PENDING' : 'FAILED';
    const pillW = 72;
    const pillH = 18;
    const pillX = sumRight - pillW;
    const pillY = sumY - 13;

    const pillClr: [number, number, number] =
      isPaid ? [34, 197, 94] : isPending ? [245, 158, 11] : [239, 68, 68];

    setFill(pillClr);
    doc.roundedRect(pillX, pillY, pillW, pillH, 9, 9, 'F');

    doc.setFontSize(9);
    doc.setTextColor(255);
    doc.text(pillText, pillX + pillW / 2, pillY + 12, { align: 'center' });

    // currency row
    sumY += 22;
    doc.setFontSize(10);
    setTextColor(clrMuted);
    doc.text(`${currencyLabel}:`, sumLeft, sumY);
    setTextColor(clrText);
    doc.text('EUR', sumRight, sumY, { align: 'right' });

    // vat row
    sumY += 18;
    setTextColor(clrMuted);
    doc.text(`${vatLabel}:`, sumLeft, sumY);
    setTextColor(clrText);
    doc.text(billing?.vatNumber ? 'VAT ID provided' : 'No VAT ID', sumRight, sumY, { align: 'right' });

    // move cursor below cards
    cursorY += cardH + 18;

    // ===== Items table ===================================================
    const description =
      pkg?.name
        ? `Credits package "${pkg.name}" (${pkg.credits} credits)`
        : `Credits purchase (${inv.credits} credits)`;

    autoTable(doc, {
      startY: cursorY,
      head: [[
        this.t('INVOICE_COL_DESCRIPTION', 'Description'),
        this.t('INVOICE_COL_QTY', 'Qty'),
        this.t('INVOICE_COL_UNIT_PRICE', 'Unit price (€)'),
        this.t('INVOICE_COL_TOTAL', 'Total (€)')
      ]],
      body: [[
        description,
        '1',
        money(amountEur),
        money(amountEur)
      ]],
      styles: {
        font: this.fontRegistered ? 'Roboto' : 'helvetica',
        fontStyle: 'normal',
        fontSize: 10,
        textColor: clrText as any,
        cellPadding: { top: 8, right: 8, bottom: 8, left: 8 },
      },
      headStyles: {
        fillColor: clrPrimary as any,
        textColor: 255,
        font: this.fontRegistered ? 'Roboto' : 'helvetica',
        fontStyle: 'normal'
      },
      alternateRowStyles: { fillColor: [248, 249, 251] },
      margin: { left: marginX, right: marginX },
      tableLineColor: clrBorder as any,
      tableLineWidth: 0.5
    });

    const tableEndY = (doc as any).lastAutoTable?.finalY ?? cursorY + 50;

    // ===== Total card (right aligned) ===================================
    const totalCardW = 220;
    const totalCardH = 46;
    const totalX = rightX - totalCardW;
    const totalY = tableEndY + 16;

    setFill([255, 255, 255]);
    setDraw(clrBorder);
    doc.roundedRect(totalX, totalY, totalCardW, totalCardH, 10, 10, 'FD');

    doc.setFontSize(9);
    setTextColor(clrMuted);
    doc.text(this.t('INVOICE_TOTAL_PAID', 'Total paid'), totalX + 12, totalY + 18);

    doc.setFontSize(14);
    setTextColor(clrText);
    doc.setFont(this.fontRegistered ? 'Roboto' : 'helvetica', 'bold');
    doc.text(`€ ${money(amountEur)}`, totalX + totalCardW - 12, totalY + 32, { align: 'right' });
    doc.setFont(this.fontRegistered ? 'Roboto' : 'helvetica', 'normal');

    // ===== Payment details ==============================================
    let payY = totalY + totalCardH + 22;

    doc.setFontSize(10);
    setTextColor(clrText);
    doc.text(this.t('INVOICE_PAYMENT_INFO', 'Payment details'), marginX, payY);

    payY += 14;
    doc.setFontSize(9);
    setTextColor(clrMuted);

    const payLines = this.compactStrings([
      (inv as any).paymentMethod ? `Method: ${(inv as any).paymentMethod}` : undefined,
      // inv.stripePaymentIntentId ? `Stripe Payment Intent: ${inv.stripePaymentIntentId}` : undefined,
      // inv.stripeSessionId ? `Stripe Session: ${inv.stripeSessionId}` : undefined,
    ]);

    payLines.forEach((l) => {
      const wrapped = doc.splitTextToSize(l, contentW);
      doc.text(wrapped, marginX, payY);
      payY += wrapped.length * 11;
    });

    // ===== VAT note ======================================================
    payY += 8;
    setTextColor(clrMuted);
    doc.setFontSize(9);
    const vatNote = this.t('INVOICE_VAT_NOTE', INVOICE_VAT_NOTE).trim();
    const vatLines = doc.splitTextToSize(vatNote, contentW);
    doc.text(vatLines, marginX, payY);
    payY += vatLines.length * 11;

    // ===== Footer disclaimer ============================================
    const footerY = pageH - 48;
    doc.setFontSize(8);
    setTextColor([120, 128, 140]);
    const disc = this.t('INVOICE_DISCLAIMER', INVOICE_DISCLAIMER).trim();
    const discLines = doc.splitTextToSize(disc, contentW);
    doc.text(discLines, marginX, footerY);

    doc.save(`${invoiceNumber}.pdf`);
  }

  private isNonEmptyString(v: unknown): v is string {
    return typeof v === 'string' && v.trim().length > 0;
  }

  private compactStrings(arr: Array<string | null | undefined>): string[] {
    return arr.filter((x): x is string => this.isNonEmptyString(x));
  }

  private toEuros(amount: number | null | undefined): number {
    if (amount == null) return 0;
    return amount / 100;
  }
}
