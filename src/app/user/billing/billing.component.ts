
import { Component, OnInit } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AgGridModule }  from 'ag-grid-angular';
import { BillingService, Invoice } from '../billing/billing.service';;

import { SearchHistoryService, SearchRecord } from '../new-research/new-search-history.service';

// Importing themes from ag-Grid
import { themeAlpine } from 'ag-grid-community';
import { themeBalham } from 'ag-grid-community';

@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    AgGridModule
  ]
})
export class BillingComponent  implements OnInit {

  records: SearchRecord[] = [];
  filterId = '';
  sortField: 'id' | 'timestamp' = 'timestamp';
  sortAsc = false;

  // ag-Grid config
  columnDefs: any[] = [];
  defaultColDef = { sortable: true, filter: true, resizable: true, flex: 1 };
  rowData: any[] = [];

   public theme = themeAlpine.withParams({
      
    backgroundColor: '#343a40',           // main background color
    foregroundColor: '#e0e0e0',            // optional: grid text color

    headerBackgroundColor: '#495057',   // header background color
    headerTextColor: '#ffffff',         // header text color
    borderColor: 'black',             // border color for cells
    textColor: '#ffffff',               // main text color
    cellTextColor: '#ffffff',           // cell text color
    

    accentColor: 'blue',           // accent color for buttons, etc. 
    headerHeight: 50,                 // header height
    rowHeight: 40,                    // row height
    fontFamily: 'Roboto, sans-serif', // font family & size
    fontSize: '14px'                  // font size
  });

  constructor(
    private historySvc: SearchHistoryService,
    private billingSvc: BillingService,
    private translate: TranslateService) {}

  ngOnInit(): void {
    this.records = this.historySvc.getAll();

    // fetch raw invoices
    const invoices: Invoice[] = this.billingSvc.getAll();

    // map into rowData
    this.rowData = invoices.map(inv => ({
      id:        inv.id,
      timestamp: new Date(inv.timestamp),
      success:   inv.credits > 0,     // or however you flag success
      fileUrl:   (inv as any).fileUrl // if you have a URL field
    }));

        // define columns, using instant translations
    this.columnDefs = [
      {
        field:      'id',
        headerName: this.translate.instant('ID_NUMBER')
      },
      {
        field:      'timestamp',
        headerName: this.translate.instant('TIMESTAMP'),
        filter:     'agDateColumnFilter',
        valueFormatter: (params: { value: { toLocaleString: () => any; }; }) =>
          params.value ? params.value.toLocaleString() : ''
      },
      {
        field:      'success',
        headerName: this.translate.instant('STATUS'),
        cellRenderer: (params: { value: any; }) => {
          const ok = params.value;
          const text = ok
            ? this.translate.instant('SUCCESS')
            : this.translate.instant('FAILED');
          const cls = ok ? 'badge bg-success' : 'badge bg-danger';
          return `<span class="${cls}">${text}</span>`;
        }
      },
      {
        field:      'fileUrl',
        headerName: this.translate.instant('PDF'),
        cellRenderer: (params: { value: any; }) => {
          return params.value
            ? `<a href="${params.value}" download class="btn btn-sm btn-outline-primary">
                 ${this.translate.instant('DOWNLOAD')}
               </a>`
            : '';
        },
        sortable: false,
        filter:   false,
        width:    120
      }
    ];

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
