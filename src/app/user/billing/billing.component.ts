// src/app/user/billing/billing.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
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
} from 'ag-grid-community';

import { ToastService } from '../../shared/toast.service';
import { BILLING_API } from '../../shared/tokens.api';
import { BillingApi, BillingRow } from '../../shared/billing.api';

import {
  InvoiceApi,
  InvoiceDto,
  InvoiceBillingDetails,
  InvoicesResponse
} from '../../shared/invoice.api';

import { forkJoin, Subscription } from 'rxjs';

import { DatePipe } from '@angular/common';

import { UserService } from '../user.service';
import { InvoicePdfService } from '../../shared/invoice-pdf.service';

interface ColumnChooserItem {
  id: string;
  label: string;
  visible: boolean;
  lock?: boolean;
}
@Component({
  selector: 'app-billing',
  standalone: true,
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss'],
  imports: [CommonModule, TranslateModule, AgGridModule],
  providers: [DatePipe]
})
export class BillingComponent implements OnInit, OnDestroy {
  private billingApi = inject<BillingApi>(BILLING_API);

  columnDefs: any[] = [];
  defaultColDef = { sortable: true, filter: true, resizable: true, flex: 1 };

  private allRows: BillingRow[] = [];
  rowData: BillingRow[] = [];
  statusFilter: 'ALL' | 'SUCCESS' | 'FAILED' = 'ALL';

  private gridApi!: GridApi<BillingRow>;

  columnChooser: ColumnChooserItem[] = [];
  showColumnPanel = false;

  isMobile = window.innerWidth < 768;

  private invoices: InvoiceDto[] = [];
  private invoiceBySession = new Map<string, InvoiceDto>();

  private billingDetails: InvoiceBillingDetails | null = null;

  selectedRow: BillingRow | null = null;

  private langSub?: Subscription;

  public theme = themeAlpine.withParams({
    backgroundColor: '#151821',
    foregroundColor: '#e9eef6',
    headerBackgroundColor: '#252a36',
    headerTextColor: '#cfd6e4',
    textColor: '#e9eef6',
    cellTextColor: '#e9eef6',
    borderColor: 'rgba(255,255,255,.10)',
    rowHeight: 40,
    headerHeight: 46,
    fontFamily: 'Inter, system-ui, Roboto, sans-serif',
    fontSize: '14px',
    accentColor: '#0d6efd',
  });

  constructor(
    private translate: TranslateService,
    private toast: ToastService,
    private invoiceApi: InvoiceApi,
    private datePipe: DatePipe,
    private invoicePdfService: InvoicePdfService,
    private userApi: UserService,
  ) {}

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }

  ngOnInit(): void {
    const qp = new URLSearchParams(window.location.search);
    if (qp.get('success') === '1') {
      this.toast.success(
        this.translate.instant('PAYMENT_COMPLETED_PENDING_CONFIRMATION')
      );
      history.replaceState({}, '', window.location.pathname);
    }

    this.buildColumns();

    // 🔄 обнови headers кога се менува јазикот
    this.langSub = this.translate.onLangChange.subscribe(() => {
      this.buildColumns();
      if (this.gridApi) {
        this.gridApi.setGridOption('columnDefs', this.columnDefs as any);
      }
    });

    forkJoin({
      payments: this.billingApi.listMyPayments(),
      invoices: this.invoiceApi.listMyInvoices(),
      details: this.userApi.getMeDetails(),
    }).subscribe({
      next: ({ payments, invoices, details }) => {
        this.invoices = invoices ?? [];
        this.billingDetails = (details as any)?.user?.billingDetails ?? null;

        this.buildInvoiceMap();

        this.allRows = this
          .mergeInvoicesIntoPayments(payments ?? [])
          .filter(r => r.status === 'SUCCESS' || r.status === 'FAILED');

        this.applyFilter();
      },
      error: (err) => {
        console.error('Failed to load billing data', err);
        this.toast.error(this.translate.instant('BILLING_HISTORY_LOAD_FAILED'));
        this.allRows = [];
        this.applyFilter();
      },
    });

  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  onGridReady(event: GridReadyEvent<BillingRow>) {
    this.gridApi = event.api;

    this.columnChooser.forEach((c) => {
      this.gridApi.setColumnsVisible([c.id], c.visible);
    });
  }

  setStatusFilter(filter: 'ALL' | 'SUCCESS' | 'FAILED') {
    this.statusFilter = filter;
    this.applyFilter();
  }

  exportCsv() {
    if (!this.gridApi) return;
    this.gridApi.exportDataAsCsv({
      fileName: 'billing-history.csv',
    });
  }

  exportExcel() {
    if (!this.gridApi) return;
    this.gridApi.exportDataAsCsv({
      fileName: 'billing-history.xlsx',
    });
  }

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

  openInvoiceFromRow(row: BillingRow) {
    const inv =
      row.stripeSessionId && this.invoiceBySession.has(row.stripeSessionId)
        ? this.invoiceBySession.get(row.stripeSessionId)!
        : null;

    if (!inv) {
      this.toast.error(
        this.translate.instant('INVOICE_NOT_AVAILABLE_FOR_PAYMENT')
      );
      return;
    }

    this.selectedRow = row;
  }

  closeInvoiceModal() {
    this.selectedRow = null;
  }

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
          p.value
            ? this.datePipe.transform(p.value, 'dd/MM/yyyy, HH:mm') ?? ''
            : '',
        sort: 'desc',
        minWidth: 190,
      },

      {
        field: 'packageName',
        colId: 'packageName',
        headerName: this.translate.instant('PACKAGE_NAME'),
        minWidth: 140,
      },

      {
        field: 'packageCredits',
        colId: 'packageCredits',
        headerName: this.translate.instant('PACKAGE_CREDITS'),
        minWidth: 120,
      },

      {
        field: 'packagePrice',
        colId: 'packagePrice',
        headerName: this.translate.instant('PACKAGE_PRICE'),
        minWidth: 120,
        valueFormatter: (p: any) =>
          p.value == null
            ? ''
            : `${Number(p.value).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })} €`,
      },

      {
        field: 'packageDiscountPercentage',
        colId: 'packageDiscountPercentage',
        headerName: this.translate.instant('DISCOUNT_PERCENT'),
        minWidth: 110,
      },

      {
        field: 'packageIsActive',
        colId: 'packageIsActive',
        headerName: this.translate.instant('PACKAGE_ACTIVE'),
        minWidth: 110,
        cellRenderer: (p: any) =>
          p.value
            ? '<span class="text-success">✔</span>'
            : '<span class="text-muted">✖</span>',
      },

      {
        field: 'packageCreatedAt',
        colId: 'packageCreatedAt',
        headerName: this.translate.instant('PACKAGE_CREATED_AT'),
        minWidth: 130,
        valueFormatter: (p: any) =>
          p.value
            ? this.datePipe.transform(p.value, 'dd/MM/yyyy') ?? ''
            : '',
      },

      {
        field: 'packageUpdatedAt',
        colId: 'packageUpdatedAt',
        headerName: this.translate.instant('PACKAGE_UPDATED_AT'),
        minWidth: 130,
        valueFormatter: (p: any) =>
          p.value
            ? this.datePipe.transform(p.value, 'dd/MM/yyyy') ?? ''
            : '',
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
        minWidth: 120,
        valueFormatter: (p: any) =>
          p.value == null
            ? ''
            : `${Number(p.value).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })} €`,
      },

      {
        field: 'status',
        colId: 'status',
        headerName: this.translate.instant('STATUS'),
        minWidth: 120,
        cellRenderer: (p: any) => {
          const ok = p.value === 'SUCCESS';
          const pending = p.value === 'PENDING';

          let text: string;
          if (ok) {
            text = this.translate.instant('SUCCESS');
          } else if (pending) {
            text = this.translate.instant('PENDING');
          } else {
            text = this.translate.instant('FAILED');
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
        headerName: this.translate.instant('INVOICE'),
        field: 'id',
        colId: 'invoiceCsv',
        minWidth: 150,
        sortable: false,
        filter: false,
        cellRenderer: () => {
          const label = this.translate.instant('DOWNLOAD');
          return `
            <button class="btn btn-sm btn-outline-secondary ag-btn-invoice">
              ${label}
            </button>
          `;
        },
        onCellClicked: (params: any) => {
          const row = params.data as BillingRow;
          this.downloadInvoicePdf(row);
        },
      },

    ];

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

  private mergeInvoicesIntoPayments(payments: BillingRow[]): BillingRow[] {
    const toEuros = (cents: any): number | null => {
      const n = Number(cents);
      return Number.isFinite(n) ? n / 100 : null;
    };

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
        amount: toEuros((p as any).amount),
        packageName: pkg?.name ?? '',
        packageCredits: pkg?.credits ?? (p as any)['packageCredits'],
        packagePrice: toEuros(
          pkg?.price ?? (p as any)['packagePrice']
        ),
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
      this.toast.error(
        this.translate.instant('INVOICE_NOT_AVAILABLE_FOR_PAYMENT')
      );
      return;
    }
    window.open(inv.receiptUrl, '_blank', 'noopener');
  }

  hasReceipt(inv: InvoiceDto): boolean {
    return inv.status === 'SUCCESS' && !!inv.receiptUrl;
  }

  // === SINGLE INVOICE PDF DOWNLOAD ===
  downloadInvoicePdf(row: BillingRow): void {
    if (!row) return;

    if (row.status !== 'SUCCESS') {
      this.toast.error(
        this.translate.instant('INVOICE_NOT_AVAILABLE_FOR_PAYMENT')
      );
      return;
    }

    let inv: InvoiceDto | undefined | null = null;

    if (row.stripeSessionId && this.invoiceBySession.has(row.stripeSessionId)) {
      inv = this.invoiceBySession.get(row.stripeSessionId)!;
    } else {
      inv = this.invoices.find(i => i.id === row.id) ?? null;
    }

    if (!inv) {
      this.toast.error(
        this.translate.instant('INVOICE_NOT_AVAILABLE_FOR_PAYMENT')
      );
      return;
    }

    try {
      // 🔹 сега PDF сервисот добива и billingDetails
      this.invoicePdfService.generateInvoicePdf(inv, this.billingDetails);
    } catch (e) {
      console.error('Failed to generate invoice PDF', e);
      this.toast.error(
        this.translate.instant('INVOICE_GENERATION_FAILED')
      );
    }
  }
}
