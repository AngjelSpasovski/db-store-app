
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

  // ag-Grid config
  columnDefs: any[] = [];
  defaultColDef = { sortable: true, filter: true, resizable: true, flex: 1 };
  rowData: SearchRecord[] = [];

  private sub!: Subscription;

   public theme = themeAlpine.withParams({
      
    backgroundColor: '#343a40',             // main background color
    foregroundColor: '#e0e0e0',             // optional: grid text color

    headerBackgroundColor: '#495057',       // header background color
    headerTextColor: '#ffffff',             // header text color
    borderColor: 'black',                   // border color for cells
    textColor: '#ffffff',                   // main text color
    cellTextColor: '#ffffff',               // cell text color
    

    accentColor: 'blue',                    // accent color for buttons, etc. 
    headerHeight: 50,                       // header height
    rowHeight: 40,                          // row height
    fontFamily: 'Roboto, sans-serif',       // font family & size
    fontSize: '14px'                        // font size
  });

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
