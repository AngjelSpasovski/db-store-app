// src/app/user/billing/billing.component.ts
import {
  Component,
  OnInit,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AgGridModule } from 'ag-grid-angular';
import {
  themeAlpine,
  GridApi,
  GridReadyEvent,
  RowDoubleClickedEvent,
} from 'ag-grid-community';

import { ToastService } from '../../shared/toast.service';
import { BILLING_API } from '../../shared/tokens.api';
import { BillingApi, BillingRow } from '../../shared/billing.api';

import { InvoiceApi, InvoiceDto } from '../../shared/invoice.api';
import { forkJoin } from 'rxjs';

interface ColumnChooserItem {
  id: string;      // field/colId во ag-Grid
  label: string;   // текст во колон chooser
  visible: boolean;
  lock?: boolean;
}


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

  /** сите rows од backend */
  private allRows: BillingRow[] = [];

  /** rows што ги гледа grid-от (филтрирани) */
  rowData: BillingRow[] = [];

  /** моментален филтер */
  statusFilter: 'ALL' | 'SUCCESS' | 'FAILED' | 'PENDING' = 'ALL';

  /** ag-Grid API референца */
  private gridApi!: GridApi<BillingRow>;

  /** Column chooser UI */
  columnChooser: ColumnChooserItem[] = [];
  showColumnPanel = false;

  /** Responsive view */
  isMobile = window.innerWidth < 768;

  /** Invoices кеш + map по session */
  private invoices: InvoiceDto[] = [];
  private invoiceBySession = new Map<string, InvoiceDto>();

  selectedRow: BillingRow | null = null;

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
    private toast: ToastService,
    private invoiceApi: InvoiceApi
  ) {}

  // responsive flag
  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }

  ngOnInit(): void {
    const qp = new URLSearchParams(window.location.search);
    if (qp.get('success') === '1') {
      this.toast.success(
        'Payment completed. Credits added after server confirmation.'
      );
      history.replaceState({}, '', window.location.pathname);
    }

    this.buildColumns();

    // 🔽 паралелно ги вчитуваме payments + invoices
    forkJoin({
      payments: this.billingApi.listMyPayments(),
      invoices: this.invoiceApi.listMyInvoices(),
    }).subscribe({
      next: ({ payments, invoices }) => {
        this.invoices = invoices ?? [];
        this.buildInvoiceMap();
        this.allRows = this.mergeInvoicesIntoPayments(payments ?? []);
        this.applyFilter();
      },
      error: (err) => {
        console.error('Failed to load billing data', err);
        this.toast.error('Failed to load billing history.');
        this.allRows = [];
        this.applyFilter();
      },
    });
  }

  /** gridReady → чуваме api, ги применуваме visibility settings */
  onGridReady(event: GridReadyEvent<BillingRow>) {
    this.gridApi = event.api;

    // apply column visibility from chooser
    this.columnChooser.forEach((c) => {
      this.gridApi.setColumnsVisible([c.id], c.visible);
    });
  }

  /** смена на статус филтерот */
  setStatusFilter(filter: 'ALL' | 'SUCCESS' | 'FAILED' | 'PENDING') {
    this.statusFilter = filter;
    this.applyFilter();
  }

  /** Export CSV */
  exportCsv() {
    if (!this.gridApi) return;
    this.gridApi.exportDataAsCsv({
      fileName: 'billing-history.csv',
    });
  }

  /** Export "Excel" (CSV со .xlsx екстензија – ќе се отвори во Excel) */
  exportExcel() {
    if (!this.gridApi) return;
    this.gridApi.exportDataAsCsv({
      fileName: 'billing-history.xlsx',
    });
  }

  /** toggle column visibility */
  toggleColumnPanel() {
    this.showColumnPanel = !this.showColumnPanel;
  }

  onToggleColumn(col: ColumnChooserItem, event: Event) {
    const input = event.target as HTMLInputElement;
    const visible = input.checked;

    col.visible = visible;
    this.columnChooser = [...this.columnChooser];

    if (this.gridApi) {
      this.gridApi.setColumnsVisible([col.id], visible);
    }
  }

  /** helper за мобилен accordion / од grid */
  openInvoiceFromRow(row: BillingRow) {
    const inv =
      row.stripeSessionId && this.invoiceBySession.has(row.stripeSessionId)
        ? this.invoiceBySession.get(row.stripeSessionId)!
        : null;

    if (!inv) {
      this.toast.error('Invoice not available for this payment.');
      return;
    }

    this.selectedRow = row;
  }

  closeInvoiceModal() {
    this.selectedRow = null;
  }

  /** ја применуваме логиката за филтрирање */
  private applyFilter() {
    if (this.statusFilter === 'ALL') {
      this.rowData = this.allRows;
      return;
    }

    this.rowData = this.allRows.filter((r) => r.status === this.statusFilter);
  }

  private buildColumns() {
    this.columnDefs = [
      {
        field: 'id',
        colId: 'id',
        headerName: this.translate.instant('ID_NUMBER'),
        minWidth: 120,
      },
      {
        field: 'timestamp',
        colId: 'timestamp',
        headerName: this.translate.instant('TIMESTAMP'),
        filter: 'agDateColumnFilter',
        valueFormatter: (p: any) =>
          p.value ? new Date(p.value).toLocaleString() : '',
        sort: 'desc',
        minWidth: 190,
      },
      {
        field: 'packageName',
        colId: 'packageName',
        headerName: 'Package',
        minWidth: 140,
      },
      {
        field: 'packageCredits',
        colId: 'packageCredits',
        headerName: 'Pkg credits',
        minWidth: 120,
      },
      {
        field: 'packagePrice',
        colId: 'packagePrice',
        headerName: 'Pkg price',
        minWidth: 120,
        valueFormatter: (p: any) =>
          p.value == null ? '' : `${Number(p.value).toFixed(0)} €`,
      },
      {
        field: 'packageDiscountPercentage',
        colId: 'packageDiscountPercentage',
        headerName: 'Discount %',
        minWidth: 110,
      },
      {
        field: 'packageIsActive',
        colId: 'packageIsActive',
        headerName: 'Pkg active',
        minWidth: 110,
        cellRenderer: (p: any) =>
          p.value
            ? '<span class="text-success">✔</span>'
            : '<span class="text-muted">✖</span>',
      },
      {
        field: 'packageCreatedAt',
        colId: 'packageCreatedAt',
        headerName: 'Pkg created',
        minWidth: 130,
        valueFormatter: (p: any) =>
          p.value ? new Date(p.value).toLocaleDateString() : '',
      },
      {
        field: 'packageUpdatedAt',
        colId: 'packageUpdatedAt',
        headerName: 'Pkg updated',
        minWidth: 130,
        valueFormatter: (p: any) =>
          p.value ? new Date(p.value).toLocaleDateString() : '',
      },
      {
        field: 'credits',
        colId: 'credits',
        headerName: this.translate.instant('CREDITS'),
        minWidth: 100,
      },
      {
        field: 'amount',
        colId: 'amount',
        headerName: this.translate.instant('AMOUNT'),
        valueFormatter: (p: any) =>
          p.value == null ? '' : `${Number(p.value).toFixed(0)} €`,
        minWidth: 120,
      },
      {
        field: 'status',
        colId: 'status',
        headerName: this.translate.instant('STATUS'),
        minWidth: 120,
        cellRenderer: (p: any) => {
          const ok = p.value === 'SUCCESS';
          const pending = p.value === 'PENDING';

          let text = p.value;
          if (ok) {
            text = this.translate.instant('SUCCESS');
          } else if (pending) {
            text = this.translate.instant('PENDING') || 'PENDING';
          } else {
            text = this.translate.instant('FAILED') || 'FAILED';
          }

          const cls = ok
            ? 'badge bg-success'
            : pending
            ? 'badge bg-warning text-dark'
            : 'badge bg-danger';

          return `<span class="${cls}">${text}</span>`;
        },
      },
      {
        headerName: 'Receipt',
        field: 'receiptUrl',
        colId: 'receiptUrl',
        minWidth: 140,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const url: string | null = params.data?.receiptUrl;
          const status: string = params.data?.status;

          // ако немаме URL, но статусот е SUCCESS → покажи disable-нато копче
          if (!url) {
            if (status === 'SUCCESS') {
              return `
                <button class="btn btn-sm btn-secondary ag-btn-download" disabled>
                  Download
                </button>
              `;
            }
            return `<span class="text-muted">N/A</span>`;
          }

          // реално download копче
          return `
            <button class="btn btn-sm btn-outline-light ag-btn-download"
                    data-url="${url}">
              Download
            </button>
          `;
        },

        onCellClicked: (params: any) => {
          let target = params.event?.target as HTMLElement | null;
          while (target && !target.dataset['url']) {
            target = target.parentElement;
          }
          const url = target?.dataset['url'];
          if (url) {
            window.open(url, '_blank', 'noopener');
          }
        },
      },
    ];

    // Column chooser base
    this.columnChooser = this.columnDefs.map((c) => ({
      id: c.colId || c.field,
      label: c.headerName ?? c.field,
      visible: c.hide !== true,
      lock: c.colId === 'id' || c.colId === 'timestamp',
    }));
  }

  private buildInvoiceMap(): void {
    this.invoiceBySession.clear();
    for (const inv of this.invoices) {
      if (inv.stripeSessionId) {
        this.invoiceBySession.set(inv.stripeSessionId, inv);
      }
    }
  }

  /** Спој payments + invoices → package meta + статус PAID → SUCCESS */
  private mergeInvoicesIntoPayments(payments: BillingRow[]): BillingRow[] {
    return payments.map((p) => {
      const inv =
        p.stripeSessionId && this.invoiceBySession.has(p.stripeSessionId)
          ? this.invoiceBySession.get(p.stripeSessionId)!
          : null;

      const pkg = inv?.package ?? null;

      const mappedStatus =
        inv?.status === 'PAID'
          ? ('SUCCESS' as const)
          : (inv?.status as any) || p.status;

      return {
        ...p,
        status: mappedStatus,

        packageName: pkg?.name ?? '',
        packageCredits: pkg?.credits ?? (p as any)['packageCredits'],
        packagePrice: pkg?.price ?? (p as any)['packagePrice'],
        packageDiscountPercentage:
          pkg?.discountPercentage ??
          (p as any)['packageDiscountPercentage'],
        packageIsActive:
          pkg?.isActive ?? (p as any)['packageIsActive'] ?? false,
        packageCreatedAt: pkg?.createdAt ?? (p as any)['packageCreatedAt'],
        packageUpdatedAt: pkg?.updatedAt ?? (p as any)['packageUpdatedAt'],
      } as BillingRow;
    });
  }

  openInvoice(inv: InvoiceDto | null | undefined): void {
    if (!inv?.receiptUrl) {
      this.toast.error('Invoice not available for this payment.');
      return;
    }
    window.open(inv.receiptUrl, '_blank', 'noopener');
  }

  hasReceipt(inv: InvoiceDto): boolean {
    return inv.status === 'SUCCESS' && !!inv.receiptUrl;
  }

}
