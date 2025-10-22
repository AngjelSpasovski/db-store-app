import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AgGridModule } from 'ag-grid-angular';
import { themeAlpine } from 'ag-grid-community';
import { ToastService } from '../../shared/toast.service';

import { BILLING_API } from '../../shared/tokens.api';
import { BillingApi, BillingRow } from '../../shared/billing.api';

@Component({
  selector: 'app-billing',
  standalone: true,
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss'],
  imports: [CommonModule, TranslateModule, AgGridModule],
})
export class BillingComponent implements OnInit {
  private billingApi = inject<BillingApi>(BILLING_API);

  columnDefs: any[] = [];
  defaultColDef = { sortable: true, filter: true, resizable: true, flex: 1 };
  rowData: any[] = [];

  public theme = themeAlpine.withParams({
    backgroundColor: '#1b212b',
    foregroundColor: '#e9eef6',
    headerBackgroundColor: '#2a303a',
    headerTextColor: '#c7cfda',
    textColor: '#e9eef6',
    cellTextColor: '#e9eef6',
    borderColor: 'rgba(255,255,255,.08)',
    rowHeight: 40,
    headerHeight: 48,
    fontFamily: 'Inter, system-ui, Roboto, sans-serif',
    fontSize: '14px',
    accentColor: '#0d6efd',
  });

  constructor(
    private translate: TranslateService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const qp = new URLSearchParams(window.location.search);
    if (qp.get('success') === '1') {
      this.toast.success('Payment completed. Credits added after server confirmation.');
      history.replaceState({}, '', window.location.pathname);
    }
    this.buildColumns();
    this.load();
  }

  private buildColumns() {
    this.columnDefs = [
      { field: 'id', headerName: this.translate.instant('ID_NUMBER'), minWidth: 240 },
      {
        field: 'timestamp',
        headerName: this.translate.instant('TIMESTAMP'),
        filter: 'agDateColumnFilter',
        valueFormatter: (p: any) => (p.value ? new Date(p.value).toLocaleString() : ''),
        sort: 'desc',
        minWidth: 190,
      },
      { field: 'credits', headerName: this.translate.instant('CREDITS'), minWidth: 120 },
      {
        field: 'amount',
        headerName: this.translate.instant('AMOUNT'),
        valueFormatter: (p: any) => (p.value == null ? '' : `${Number(p.value).toFixed(0)} €`),
        minWidth: 120,
      },
      {
        field: 'status',
        headerName: this.translate.instant('STATUS'),
        minWidth: 120,
        cellRenderer: (p: any) => {
          const ok = p.value === 'SUCCESS';
          const text = ok ? this.translate.instant('SUCCESS') : this.translate.instant('FAILED');
          const cls = ok ? 'badge bg-success' : 'badge bg-danger';
          return `<span class="${cls}">${text}</span>`;
        },
      },
      {
        field: 'receiptUrl',
        headerName: this.translate.instant('RECEIPT'),
        minWidth: 140,
        cellRenderer: (p: any) => {
          const url = p.value;
          if (!url) return `<span class="text-muted">${this.translate.instant('N_A') || 'N/A'}</span>`;
          const label = this.translate.instant('VIEW') || 'View';
          return `<a href="${url}" target="_blank" rel="noopener">${label}</a>`;
        }
      }
    ];
  }

  private load() {
    this.billingApi.listMyPayments().subscribe((rows: BillingRow[]) => {
      this.rowData = rows; // веќе е во формат {id,timestamp,credits,amount,status,receiptUrl}
    });
  }
}
