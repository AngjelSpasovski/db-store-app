import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AgGridModule } from 'ag-grid-angular';
import { themeAlpine } from 'ag-grid-community';
import { BillingService, Invoice } from './billing.service';

@Component({
  selector: 'app-billing',
  standalone: true,
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss'],
  imports: [CommonModule, TranslateModule, AgGridModule],
})
export class BillingComponent implements OnInit {
  columnDefs: any[] = [];
  defaultColDef = { sortable: true, filter: true, resizable: true, flex: 1 };
  rowData: any[] = [];

  // Dark theme params (усогласено со останатиот UI)
  public theme = themeAlpine.withParams({
    backgroundColor: '#1b212b',                         // main background color
    foregroundColor: '#e9eef6',                         // optional: grid text color
    headerBackgroundColor: '#2a303a',                   // header background color
    headerTextColor: '#c7cfda',                         // header text color
    textColor: '#e9eef6',                               // border color for cells
    cellTextColor: '#e9eef6',                           // cell text color
    borderColor: 'rgba(255,255,255,.08)',               // border color for cells
    rowHeight: 40,                                        // default row height
    headerHeight: 48,                                     // header height
    fontFamily: 'Inter, system-ui, Roboto, sans-serif',   // font family
    fontSize: '14px',                                     // font size
    accentColor: '#0d6efd',                             // accent color, e.g. for selected rows
  });

  constructor(
    private billingSvc: BillingService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.agGridInit();
  }

  public agGridInit() {
    const invoices: Invoice[] = this.billingSvc.getAll();

    // map -> grid rows
    this.rowData = invoices.map((inv) => ({
      id: inv.id,
      timestamp: new Date(inv.timestamp),
      credits: inv.credits,
      amount: inv.amount,
      success: inv.credits > 0,
    }));

    this.columnDefs = [
      {
        field: 'id',
        headerName: this.translate.instant('ID_NUMBER'),
        minWidth: 240,
      },
      {
        field: 'timestamp',
        headerName: this.translate.instant('TIMESTAMP'),
        filter: 'agDateColumnFilter',
        valueFormatter: (p: any) => (p.value ? p.value.toLocaleString() : ''),
        sort: 'desc',
        minWidth: 190,
      },
      {
        field: 'credits',
        headerName: this.translate.instant('CREDITS'),
        minWidth: 120,
      },
      {
        field: 'amount',
        headerName: this.translate.instant('AMOUNT'),
        valueFormatter: (p: any) =>
          p.value == null ? '' : `${p.value.toFixed(0)} €`,
        minWidth: 120,
      },
      {
        field: 'success',
        headerName: this.translate.instant('STATUS'),
        minWidth: 120,
        cellRenderer: (p: any) => {
          const ok = !!p.value;
          const text = ok ? this.translate.instant('SUCCESS') : this.translate.instant('FAILED');
          const cls = ok ? 'badge bg-success' : 'badge bg-danger';
          return `<span class="${cls}">${text}</span>`;
        },
      }
    ];
  }
}
