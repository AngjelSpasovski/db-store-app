// history.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AgGridModule }  from 'ag-grid-angular';
import { Subscription } from 'rxjs';

import { SearchHistoryService, SearchRecord } from '../new-research/new-search-history.service';

// Importing themes from ag-Grid
import { themeAlpine } from 'ag-grid-community';


@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    AgGridModule
  ]
})
export class HistoryComponent  implements OnInit {

  records: SearchRecord[] = [];
  filterId = '';
  sortField: 'id' | 'timestamp' = 'timestamp';
  sortAsc = false;

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


  // ag-Grid config
  columnDefs: any[] = [];
  defaultColDef = { sortable: true, filter: true, resizable: true, flex: 1 };
  rowData: SearchRecord[] = [];

  private sub!: Subscription;

  constructor(
    private historySvc: SearchHistoryService,
    private translate: TranslateService) {}

  ngOnInit(): void {
    // Subscribe to every update
    this.sub = this.historySvc.history$.subscribe(list => {
      this.rowData = list;
    });

    // Define columns, using translate.instant for headers
    this.columnDefs = [
      {
        field: 'id',
        headerName: this.translate.instant('ID_NUMBER')
      },

      {
        field: 'timestamp',
        headerName: this.translate.instant('TIMESTAMP'),
        // Format the ISO string into a locale datetime
        valueFormatter: (params: { value: string | number | Date; }) =>
          params.value ? new Date(params.value).toLocaleString() : ''
      },

      {
        field: 'success',
        headerName: this.translate.instant('STATUS'),
        sortable: false,
        filter: false,
        width: 90,
        cellRenderer: (params: { value: any; }) => {
          const ok = params.value;
          // Render a simple dot whose color is driven by CSS
          return `<span class="status-dot ${ok ? 'success' : 'danger'}"></span>`;
        }
      },

      {
        field: 'fileUrl',
        headerName: this.translate.instant('DOWNLOAD'),
        sortable: false,
        filter: false,
        width: 140,
        cellRenderer: (params: { value: any; }) => {
          return params.value
            ? `<a href="${params.value}" download
                  class="btn btn-sm btn-outline-primary">
                 ${this.translate.instant('DOWNLOAD')}
               </a>`
            : '';
        }
      }
    ];
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }


  get displayedRecords(): SearchRecord[] {

    let list = this.records.filter(r => r.id.includes(this.filterId));

    list = list.sort((a, b) => {
      const aVal = a[this.sortField];
      const bVal = b[this.sortField];
      return this.sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return list;
  }

  toggleSort(field: 'id' | 'timestamp') {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = true;
    }
  }

}
