// src/app/user/history/history.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  HostListener,
  Inject,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AgGridModule } from 'ag-grid-angular';
import { Subscription } from 'rxjs';

import {
  themeAlpine,
  ColDef,
  ValueFormatterParams,
  CellClickedEvent,
  GridApi,
  GridReadyEvent,
} from 'ag-grid-community';

import { DataRequestApi, DataRequestRow } from 'src/app/shared/data-request.api';
import { SearchHistoryService } from '../new-research/new-search-history.service';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslateModule, AgGridModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryComponent implements OnInit, OnDestroy {
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

  columnDefs: ColDef[] = [];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100
  };
  rowData: DataRequestRow[] = [];

  private dataSub!: Subscription;
  private langSub!: Subscription;

  isMobile = window.innerWidth < 768;

  constructor(
    private historyStore: SearchHistoryService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private dataReqApi: DataRequestApi,
    private toasts: ToastService,
    @Inject(DOCUMENT) private doc: Document
  ) {}

  ngOnInit(): void {
    // stream за податоците
    this.dataSub = this.historyStore.history$.subscribe((rows) => {
      this.rowData = rows;
      this.cdr.markForCheck();
    });

    // слушаме промена на јазик
    this.langSub = this.translate.onLangChange.subscribe(() => {
      this.updateColumnHeaders();
    });

    this.historyStore.reload();
    this.buildColumnDefs();
  }

  // можеме и да не правиме ништо тука, важно е за template binding-от
  onGridReady(_event: GridReadyEvent): void {
    // no-op
  }

  buildColumnDefs(): void {
    const downloadLabel = this.translate.instant('DOWNLOAD');

    this.columnDefs = [
      {
        field: 'id',
        headerName: '#',
        width: 110,
        cellRenderer: (p: any) =>
          `<span class="req-badge">#${p.value}</span>`,
        sortable: true,
        filter: false,
      },
      {
        field: 'createdAt',
        headerName: this.translate.instant('CREATED_AT'),
        valueFormatter: (p: ValueFormatterParams) =>
          p.value ? new Date(p.value as string).toLocaleString() : '',
      },
      {
        field: 'expiredAt',
        headerName: this.translate.instant('EXPIRES_AT'),
        valueFormatter: (p: ValueFormatterParams) =>
          p.value ? new Date(p.value as string).toLocaleString() : '',
      },
      {
        headerName: this.translate.instant('ACTIONS'),
        sortable: false,
        filter: false,
        width: 130,
        minWidth: 120,
        maxWidth: 150,
        cellRenderer: () =>
          `<button class="btn btn-sm btn-outline-primary">${downloadLabel}</button>`,
        onCellClicked: (params: CellClickedEvent) => {
          const row = params.data as DataRequestRow;
          this.download(row);
        },
      },
    ];
  }

  updateColumnHeaders(): void {
    // само ги реконструираме колоните со нови преводи.
    // Пошто columnDefs е Angular input, новата референца ќе го рефрешира grid-от.
    this.buildColumnDefs();
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.dataSub?.unsubscribe();
    this.langSub?.unsubscribe();
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }

  download(row: DataRequestRow) {
    this.dataReqApi.download(row.id).subscribe({
      next: (blob: Blob) => {
        blob
          .text()
          .then((text) => {
            const trimmed = text.trim();

            if (!trimmed) {
              this.toasts.error(
                this.translate.instant('NO_RESULTS_FOR_REQUEST_FILE_EMPTY')
              );
              return;
            }

            const lines = trimmed
              .split(/\r?\n/)
              .filter((l) => l.trim().length > 0);

            if (lines.length <= 1) {
              this.toasts.error(
                this.translate.instant('NO_VALID_ROWS_IN_CSV')
              );
              return;
            }

            const url = URL.createObjectURL(blob);
            const a = this.doc.createElement('a');
            a.href = url;
            a.download = `data-request-${row.id}.csv`;
            this.doc.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          })
          .catch((err) => {
            console.error('Failed to inspect CSV before download', err);
            this.toasts.error(
              this.translate.instant('COULD_NOT_READ_CSV_FILE')
            );
          });
      },
      error: (err) => {
        console.error('Download failed', err);
        this.toasts.error(
          this.translate.instant('DOWNLOAD_FAILED_TRY_AGAIN')
        );
      },
    });
  }


}
