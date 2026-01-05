// src/app/admin/users-list/users-list.component.ts
import { Component, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AgGridModule } from 'ag-grid-angular';
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  GridOptions,
  themeAlpine,
} from 'ag-grid-community';

import { AdminUsersApi } from '../../shared/admin-users.api';
import { ToastService } from '../../shared/toast.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service'; 
import { UserPackagesModalComponent } from '../../superadmin/user-packages-modal/user-packages-modal.component';

type AdminUserRow = {
  id:           number;
  companyName?: string | null;
  email:        string;
  firstName?:   string | null;
  lastName?:    string | null;
  createdAt?:   string | null;
  updatedAt?:   string | null;
  isActive:     boolean;
  role:         string;
};

type UsersListResponse = {
  list: AdminUserRow[];
  total: number;
};

@Component({
  standalone: true,
  selector: 'app-admin-users-list',
  imports: [CommonModule, FormsModule, AgGridModule, TranslateModule, UserPackagesModalComponent],
  providers: [DatePipe],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
})
export class AdminUsersListComponent implements OnInit, OnDestroy {
  rows: AdminUserRow[] = [];
  total = 0;

  page = 1;
  perPage = 10;
  pageOptions = [10, 20, 50];

  // search
  searchText = '';

  // busy
  togglingId: number | null = null;

  // view modal
  detailsVisible = false;
  selectedUser: AdminUserRow | null = null;

  // confirm modal
  confirmVisible = false;
  confirmUser: AdminUserRow | null = null;
  confirmNextActive = false;
  confirmBusy = false;

  // responsive
  isMobile = false;

  // auth (for superadmin guard)
  private mq?: MediaQueryList;
  private mqHandler?: (e: MediaQueryListEvent) => void;

  // ag-grid columns
  columnDefs: ColDef<AdminUserRow>[] = [];

  // auth (for superadmin guard)
  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 0,
    minWidth: 100,
  };

  // ag-grid API
  private gridApi!: GridApi<AdminUserRow>;

  // ag-grid options
  gridOptions: GridOptions<AdminUserRow> = {
    domLayout: 'normal',
    alwaysShowHorizontalScroll: true,
    alwaysShowVerticalScroll: true,
    suppressScrollOnNewData: true,
  };

  // theme for ag-grid
  public theme = themeAlpine.withParams({
    backgroundColor: '#151821',
    foregroundColor: '#e9eef6',
    headerBackgroundColor: '#252a36',
    headerTextColor: '#cfd6e4',
    textColor: '#e9eef6',
    cellTextColor: '#e9eef6',
    borderColor: 'rgba(255,255,255,.10)',
    rowHeight: 40,
    headerHeight: 40,
    fontFamily: 'Inter, system-ui, Roboto, sans-serif',
    fontSize: '14px',
    accentColor: '#0d6efd',
  });

  //
  private langSub?: Subscription;
  // tooltips
  private tooltipInstances: any[] = [];

  // user packages modal
  packagesVisible = false;
  packagesUser: AdminUserRow | null = null;

  // GETTERS FOR FILTERED ROWS (mobile accordion)
  get filteredRows(): AdminUserRow[] {
    const q = (this.searchText ?? '').trim().toLowerCase();
    if (!q) return this.rows;

    return this.rows.filter(u => {
      const fullName = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim().toLowerCase();
      const email = (u.email ?? '').toLowerCase();
      const company = (u.companyName ?? '').toLowerCase();
      const role = (u.role ?? '').toLowerCase();
      const id = String(u.id ?? '');

      return (
        id.includes(q) ||
        email.includes(q) ||
        fullName.includes(q) ||
        company.includes(q) ||
        role.includes(q)
      );
    });
  }

  constructor(
    private usersApi: AdminUsersApi,
    private toast: ToastService,
    private datePipe: DatePipe,
    private translate: TranslateService,
    private host: ElementRef<HTMLElement>,
    private auth: AuthService,
  ) {}

  get isSuperadmin(): boolean {
    return (this.auth.getCurrentUser()?.role || '').toLowerCase() === 'superadmin';
  }

  ngOnInit(): void {
    // responsive
    this.mq = window.matchMedia('(max-width: 768px)');
    this.isMobile = this.mq.matches;

    this.setTheme();
    this.buildColumns();

    this.mqHandler = (e: MediaQueryListEvent) => {
      this.isMobile = e.matches;
      this.setTheme();
      this.buildColumns();
      if (this.gridApi) this.gridApi.setGridOption('columnDefs', this.columnDefs as any);
      setTimeout(() => this.initTooltips(), 0);
    };

    this.mq.addEventListener?.('change', this.mqHandler);
    (this.mq as any).addListener?.(this.mqHandler);

    // rebuild on language change
    this.langSub = this.translate.onLangChange.subscribe(() => {
      this.buildColumns();
      if (this.gridApi) this.gridApi.setGridOption('columnDefs', this.columnDefs as any);
      setTimeout(() => this.initTooltips(), 0);
    });

    this.load();
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    this.disposeTooltips();

    if (this.mq && this.mqHandler) {
      this.mq.removeEventListener?.('change', this.mqHandler);
      (this.mq as any).removeListener?.(this.mqHandler);
    }
  }

  private setTheme(): void {
    // ✅ мобилен: помал фонт + редови
    this.theme = themeAlpine.withParams({
      backgroundColor: '#151821',
      foregroundColor: '#e9eef6',
      headerBackgroundColor: '#252a36',
      headerTextColor: '#cfd6e4',
      textColor: '#e9eef6',
      cellTextColor: '#e9eef6',
      borderColor: 'rgba(255,255,255,.10)',
      rowHeight: this.isMobile ? 38 : 45,
      headerHeight: this.isMobile ? 40 : 46,
      fontFamily: 'Inter, system-ui, Roboto, sans-serif',
      fontSize: this.isMobile ? '13px' : '14px',
      accentColor: '#0d6efd',
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.perPage));
  }

  onGridReady(e: GridReadyEvent<AdminUserRow>): void {
    this.gridApi = e.api;
    this.applyQuickFilter();
    setTimeout(() => this.initTooltips(), 0);
  }

  reload(): void {
    this.page = 1;
    this.load();
  }

  prevPage(): void {
    if (this.page <= 1) return;
    this.page--;
    this.load();
  }

  nextPage(): void {
    if (this.page >= this.totalPages) return;
    this.page++;
    this.load();
  }

  load(): void {
    this.usersApi.getUsers(this.perPage, this.page).subscribe({
      next: (res: UsersListResponse) => {
        this.rows = res.list ?? [];
        this.total = res.total ?? this.rows.length;

        if (this.gridApi) {
          this.gridApi.setGridOption('rowData', this.rows as any);
          this.applyQuickFilter();
        }

        setTimeout(() => this.initTooltips(), 0);
      },
      error: () => this.toast.error(this.translate.instant('TOAST.SERVER_ERROR')),
    });
  }

  // SEARCH (ag-grid quick filter)
  applyQuickFilter(): void {
    const text = (this.searchText ?? '').trim();

    // ✅ Mobile view uses accordion (filteredRows), so nothing else is required there.
    // ✅ Desktop grid needs ag-grid quick filter.
    if (!this.gridApi) return;

    const anyApi = this.gridApi as any;

    // Prefer older API if it exists (many projects still on it)
    if (typeof anyApi.setQuickFilter === 'function') {
      anyApi.setQuickFilter(text);
      return;
    }

    // v31+ style
    if (typeof anyApi.setGridOption === 'function') {
      anyApi.setGridOption('quickFilterText', text);
    }
  }

  clearSearch(): void {
    this.searchText = '';
    this.applyQuickFilter();
  }

  openDetails(row: AdminUserRow): void {
    this.selectedUser = row;
    this.detailsVisible = true;
  }

  closeDetails(): void {
    this.detailsVisible = false;
    this.selectedUser = null;
  }

  // CONFIRM FLOW
  openConfirmToggle(u: AdminUserRow): void {
    if (!u) return;
    if (u.role === 'superadmin') return; // hard guard
    this.confirmUser = u;
    this.confirmNextActive = !u.isActive;
    this.confirmBusy = false;
    this.confirmVisible = true;
  }

  closeConfirm(): void {
    this.confirmVisible = false;
    this.confirmUser = null;
    this.confirmBusy = false;
  }

  confirmToggle(): void {
    if (!this.confirmUser) return;
    if (this.confirmUser.role === 'superadmin') return;

    this.confirmBusy = true;
    this.toggleStatus(this.confirmUser);
  }

  // API toggle
  private toggleStatus(u: AdminUserRow): void {
    const newIsActive = !u.isActive;
    this.togglingId = u.id;

    this.usersApi.updateStatus(u.id, newIsActive).subscribe({
      next: () => {
        this.toast.success(this.translate.instant('PROFILE_UPDATED'));
        this.togglingId = null;
        this.confirmBusy = false;
        this.closeConfirm();
        this.load();
      },
      error: () => {
        this.toast.error(this.translate.instant('PROFILE_UPDATE_FAILED'));
        this.togglingId = null;
        this.confirmBusy = false;
      },
    });
  }

  // HTML escaping for cellRenderer safety
  private esc(s: any): string {
    return String(s ?? '').replace(/[&<>"']/g, (m) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m] as string));
  }

  private buildColumns(): void {
    const t = (k: string, fallback?: string) => {
      const v = this.translate.instant(k);
      return v && v !== k ? v : (fallback ?? k);
    };

    // ACTIVE column: mobile dot, desktop badge
    const activeCol: ColDef<AdminUserRow> = this.isMobile ? {

          field: 'isActive',
          headerName: t('ACTIVE', 'Active'),
          maxWidth: 34,
          minWidth: 34,
          sortable: false,
          filter: false,
          cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },

          cellRenderer: (p: any) => {
            const ok = !!p.value;
            const tip = ok ? t('ADMIN.YES', 'Yes') : t('ADMIN.NO', 'No');
            const cls = ok ? 'active-dot on' : 'active-dot off';
            return `<span class="${cls}" data-bs-toggle="tooltip" data-bs-title="${tip}"></span>`;
          },
        }

      // desktop
      : {
          field: 'isActive',
          headerName: t('ACTIVE', 'Active'),
          maxWidth: 100,
          cellRenderer: (p: any) => {
            const ok = !!p.value;
            const text = ok ? t('ADMIN.YES', 'Yes') : t('ADMIN.NO', 'No');
            const cls = ok ? 'badge bg-success' : 'badge bg-secondary';
            return `<span class="${cls}">${text}</span>`;
          },
        };

    // ACTIONS (icons only, narrow)
    const actionsCol: ColDef<AdminUserRow> = {
      headerName: this.translate.instant('ACTIONS') || 'Actions',
      colId: 'actions',
      pinned: 'right',
      lockPinned: true,
      sortable: false,
      filter: false,
      maxWidth: this.isMobile ? 100 : 120,
      cellClass: 'ag-actions-cell',
      cellRenderer: (params: any) => {
        const row: AdminUserRow = params.data;
        const isBusy = this.togglingId === row?.id;
        const isSuper = row?.role === 'superadmin';
        const disabled = (isBusy || isSuper) ? 'disabled' : '';

        const viewTip = this.translate.instant('VIEW') || 'View';
        const actTip = row?.isActive
          ? (this.translate.instant('DEACTIVATE') || 'Deactivate')
          : (this.translate.instant('ACTIVATE') || 'Activate');

        const toggleTip = isSuper
          ? (this.translate.instant('ADMIN.CANNOT_TOGGLE_SUPERADMIN') || 'Cannot change superadmin')
          : actTip;

        const toggleIcon  = row?.isActive ? '⛔' : '✅';
        const toggleClass = row?.isActive ? 'btn-danger' : 'btn-success';

        const pkgTip = this.translate.instant('ADMIN.ASSIGN_PACKAGES') || 'Assign packages';

        // ова е за иконата на пакети (само ако е суперадмин)
        // го вметнуваме во actions return-от подолу
        //
        // <button type="button"
        //   class="btn btn-info icon ag-icon-btn"
        //   data-action="packages"
        //   aria-label="${pkgTip}"
        //   data-bs-toggle="tooltip"
        //   data-bs-title="${pkgTip}">
        //   <span class="icon-btn">📦</span>
        // </button>

        return `
          <div class="ag-actions icon-only">
            <button type="button"
              class="btn btn-secondary icon ag-icon-btn"
              data-action="view"
              aria-label="${viewTip}"
              data-bs-toggle="tooltip"
              data-bs-title="${viewTip}"><span class="icon-btn">👁</span>
            </button>

            <button type="button"
              class="btn ${toggleClass} icon ag-icon-btn"
              data-action="toggle"
              aria-label="${toggleTip}"
              data-bs-toggle="tooltip"
              data-bs-title="${toggleTip}"
              ${disabled}><span class="icon-btn">${isBusy ? '…' : toggleIcon}</span>
            </button>


          </div>
        `;
      },
      onCellClicked: (e: any) => {
        const btn = (e.event?.target as HTMLElement)?.closest('button');
        const action = btn?.getAttribute('data-action');
        if (!action) return;

        const row: AdminUserRow = e.data;

        // handle actions
        if (action === 'view') this.openDetails(row);

        // toggle active/inactive
        if (action === 'toggle') {
          if (!row || row.role === 'superadmin') return;
          if (this.togglingId === row.id) return;
          this.openConfirmToggle(row);
        }

        // open packages modal
        // if (action === 'packages') {
        //   if (!this.isSuperadmin) return;
        //   this.openPackages(row);
        // }
      },
    };

    if (this.isMobile) {
      // ✅ MOBILE: #, Name (stack company), Email, Active(dot), Actions
      this.columnDefs = [
        { field: 'id', headerName: t('ID', '#'), maxWidth: 56, minWidth: 56, sortable: false, filter: false },

        {
          headerName: t('NAME', 'Name'),
          colId: 'name',
          flex: 1,
          minWidth: 150,
          sortable: false,
          filter: false,
          valueGetter: (p: any) => `${p.data?.firstName ?? ''} ${p.data?.lastName ?? ''}`.trim(),
          cellRenderer: (p: any) => {
            const name = this.esc(`${p.data?.firstName ?? ''} ${p.data?.lastName ?? ''}`.trim() || '-');
            const company = this.esc(p.data?.companyName || '');
            return `
              <div class="cell-stack">
                <div class="cell-main">${name}</div>
                ${company ? `<div class="cell-sub">${company}</div>` : ``}
              </div>
            `;
          },
        },

        {
          field: 'email',
          headerName: t('EMAIL', 'Email'),
          flex: 1,
          minWidth: 170,
          sortable: false,
          filter: false,
          cellRenderer: (p: any) => {
            const email = this.esc(p.value || '-');
            return `<div class="cell-stack"><div class="cell-sub">${email}</div></div>`;
          },
        },

        { field: 'firstName', headerName: t('FIRST_NAME', 'First name'), maxWidth: 140 },
        { field: 'lastName', headerName: t('LAST_NAME', 'Last name'), maxWidth: 140 },

        activeCol,
        actionsCol,
      ];
    } 
    else {
      // ✅ DESKTOP
      this.columnDefs = [
        { field: 'id', headerName: t('ID', '#'), maxWidth: 80 },
        { field: 'companyName', headerName: t('COMPANY', 'Company'), maxWidth: 160, valueFormatter: (p: any) => p.value ?? '' },
        { field: 'email', headerName: t('EMAIL', 'Email'), maxWidth: 260 },
        { field: 'firstName', headerName: t('FIRST_NAME', 'First name'), maxWidth: 140 },
        { field: 'lastName', headerName: t('LAST_NAME', 'Last name'), maxWidth: 140 },
        {
          field: 'createdAt',
          headerName: t('CREATED_AT', 'Created'),
          maxWidth: 110,
          valueFormatter: (p: any) =>
            p.value ? (this.datePipe.transform(p.value, 'dd/MM/yyyy') ?? '') : '',
        },
        {
          field: 'updatedAt',
          headerName: t('ADMIN.UPDATED_AT', 'Updated'),
          maxWidth: 110,
          valueFormatter: (p: any) =>
            p.value ? (this.datePipe.transform(p.value, 'dd/MM/yyyy') ?? '') : '',
        },
        activeCol,
        { field: 'role', headerName: t('ROLE', 'Role'), maxWidth: 120 },
        actionsCol,
      ];
    }
  }

  // BOOTSTRAP TOOLTIPS (delay)
  private get TooltipCtor(): any {
    return (window as any).bootstrap?.Tooltip;
  }

  private initTooltips(): void {
    this.disposeTooltips();

    const Tooltip = this.TooltipCtor;
    if (!Tooltip) return;

    const root = this.host.nativeElement;
    const els = Array.from(root.querySelectorAll<HTMLElement>('[data-bs-toggle="tooltip"]'));

    this.tooltipInstances = els.map(el => {
      try {
        return new Tooltip(el, {
          trigger: 'hover',
          delay: { show: 450, hide: 100 },
          container: 'body'
        });
      } catch {
        return null;
      }
    }).filter(Boolean);
  }

  private disposeTooltips(): void {
    for (const t of this.tooltipInstances) {
      try { t.dispose?.(); } catch {}
    }
    this.tooltipInstances = [];
  }

  
  openPackages(u: AdminUserRow) {
    this.packagesUser = u;
    this.packagesVisible = true;
  }

  closePackages() {
    this.packagesVisible = false;
    this.packagesUser = null;
  }

}
