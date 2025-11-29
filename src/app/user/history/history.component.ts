// src/app/user/history/history.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  Inject,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AgGridModule } from 'ag-grid-angular';
import { Subscription } from 'rxjs';

import { themeAlpine } from 'ag-grid-community';
import { DataRequestApi, DataRequestRow } from 'src/app/shared/data-request.api';
import { SearchHistoryService } from '../new-research/new-search-history.service';

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

  columnDefs: any[] = [];
  defaultColDef = { sortable: true, filter: true, resizable: true, flex: 1 };
  rowData: DataRequestRow[] = [];

  private sub!: Subscription;

  constructor(
    private historyStore: SearchHistoryService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private dataReqApi: DataRequestApi,
    @Inject(DOCUMENT) private doc: Document
  ) {}

  ngOnInit(): void {
    this.sub = this.historyStore.history$.subscribe((rows) => {
      this.rowData = rows;
      this.cdr.markForCheck();
    });

    this.historyStore.reload();

    this.columnDefs = [
      // badge колона
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
        valueFormatter: (p: any) =>
          p.value ? new Date(p.value).toLocaleString() : '',
      },
      {
        field: 'expiredAt',
        headerName: this.translate.instant('EXPIRES_AT'),
        valueFormatter: (p: any) =>
          p.value ? new Date(p.value).toLocaleString() : '',
      },
      {
        headerName: this.translate.instant('ACTIONS'),
        sortable: false,
        filter: false,
        width: 140,
        cellRenderer: () =>
          `<button class="btn btn-sm btn-outline-primary">DOWNLOAD</button>`,
        onCellClicked: (params: any) => {
          const row = params.data as DataRequestRow;
          this.download(row);
        },
      },
    ];
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private download(row: DataRequestRow) {
    this.dataReqApi.download(row.id).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = this.doc.createElement('a');
        a.href = url;
        a.download = `data-request-${row.id}.csv`;
        this.doc.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Download failed', err),
    });
  }
}
