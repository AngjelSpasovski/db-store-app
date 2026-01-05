// src/app/superadmin/packages/packages.component.ts
import { Component, HostListener, OnInit, OnDestroy  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AgGridAngular } from 'ag-grid-angular';
import type { 
  ColDef, 
  GridApi, 
  GridOptions, 
  GridReadyEvent, 
  ICellRendererParams
} from 'ag-grid-community';

import { themeAlpine } from 'ag-grid-community'; 

import { SuperadminPackagesApi, SuperadminPackageDto, PackagePayload } from '../../shared/superadmin-packages.api';
import { ToastService } from 'src/app/shared/toast.service';
import { Subscription } from 'rxjs';
import { ApiErrorUtil } from 'src/app/shared/api-error.util';

@Component({
  selector: 'app-superadmin-packages',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AgGridAngular, TranslateModule],
  templateUrl: './packages.component.html',
  styleUrls: ['./packages.component.scss'],
})
export class PackagesComponent implements OnInit, OnDestroy  {

  // SERVER / LIST STATE
  packages: SuperadminPackageDto[] = [];
  total = 0;

  loading = false;
  saving = false;
  error: string | null = null;

  page = 1;
  perPage = 10;
  pageOptions = [10, 20, 50, 100];

  // SEARCH STATE
  searchText = '';

  // aG-Grid API STATE
  private gridApi?: GridApi;

  // Ag-Grid default column definition
  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  // Ag-Grid options
  gridOptions: GridOptions = {
    rowHeight: 44,
    headerHeight: 44,
    animateRows: true,
    suppressRowClickSelection: true,
    rowSelection: 'single',
  };

  // Ag-Grid theme
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

  // Ag-Grid column definitions
  columnDefs: ColDef<SuperadminPackageDto>[] = [
    { 
      headerName: 'Name', 
      field: 'name', 
      minWidth: 180, 
      flex: 1 
    },

    {
      headerName: 'Credits',
      field: 'credits',
      type: 'numericColumn',
      width: 130,
      cellClass: 'ag-right-aligned-cell',
    },

    {
      headerName: 'Price',
      field: 'price',
      type: 'numericColumn',
      width: 140,
      valueFormatter: (p) => Number(p.value ?? 0).toFixed(2),
      cellClass: 'ag-right-aligned-cell',
    },

    {
      headerName: 'Discount %',
      field: 'discountPercentage',
      type: 'numericColumn',
      width: 140,
      cellClass: 'ag-right-aligned-cell',
    },

    {
      headerName: 'Active',
      field: 'isActive',
      width: 120,
      cellClass: 'ag-center-aligned-cell',
      cellRenderer: (p: ICellRendererParams<SuperadminPackageDto>) => {
        const active = !!p.value;
        const cls = active ? 'bg-success' : 'bg-secondary';
        return `<span class="badge ${cls}">${active ? 'Yes' : 'No'}</span>`;
      },
    },

    {
      headerName: 'Edit',
      colId: 'edit',
      width: 110,
      sortable: false,
      filter: false,
      resizable: false,
      cellClass: 'ag-edit-cell',
      cellRenderer: () => `
        <div class="ag-edit icon-only">
          <button class="btn btn-info ag-icon-btn" data-action="edit" title="Edit">✎</button>
        </div>
      `,
      onCellClicked: (e) => {
        const el = (e.event?.target as HTMLElement | null)?.closest?.('[data-action]');
        const action = el?.getAttribute?.('data-action');
        if (action === 'edit' && e.data) this.openEditModal(e.data);
      },
    },
  ];

  // MOBILE STATE
  isMobile = false;

  // MODAL / FORM STATE
  showFormModal = false;
  editingPackage: SuperadminPackageDto | null = null;
  form!: FormGroup;

  
  private mq?: MediaQueryList;
  private mqHandler?: (e: MediaQueryListEvent) => void;

  // 
  private langSub?: Subscription;

  // PAGING HELPERS
  get totalPages(): number {
    return Math.max(1, Math.ceil((this.total || 0) / (this.perPage || 1)));
  }

  // FILTERING HELPERS
  get filteredPackages(): SuperadminPackageDto[] {
    const q = (this.searchText ?? '').trim().toLowerCase();
    if (!q) return this.packages;

    return this.packages.filter(p => {
      const name = (p.name ?? '').toLowerCase();
      const desc = (p.description ?? '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }

  constructor(
    private api: SuperadminPackagesApi,
    private fb: FormBuilder,
    private toast: ToastService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.initForm(); // initialize form

    this.mq = window.matchMedia('(max-width: 768px)');
    this.isMobile = this.mq.matches;

    this.setTheme();
    this.buildColumnDefs();
    this.loadPackages();

    this.mqHandler = (e: MediaQueryListEvent) => {
      this.isMobile = e.matches;
      this.setTheme();
      this.buildColumnDefs();
      if (this.gridApi) (this.gridApi as any).setGridOption?.('columnDefs', this.columnDefs as any);
    };

    this.mq.addEventListener?.('change', this.mqHandler);
    (this.mq as any).addListener?.(this.mqHandler);

    this.langSub = this.translate.onLangChange.subscribe(() => {
      this.buildColumnDefs();
      if (this.gridApi) (this.gridApi as any).setGridOption?.('columnDefs', this.columnDefs as any);
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    if (this.mq && this.mqHandler) {
      this.mq.removeEventListener?.('change', this.mqHandler);
      (this.mq as any).removeListener?.(this.mqHandler);
    }
  }

  private setTheme(): void {
    this.theme = themeAlpine.withParams({
      backgroundColor: '#151821',
      foregroundColor: '#e9eef6',
      headerBackgroundColor: '#252a36',
      headerTextColor: '#cfd6e4',
      textColor: '#e9eef6',
      cellTextColor: '#e9eef6',
      borderColor: 'rgba(255,255,255,.10)',
      rowHeight: this.isMobile ? 38 : 40,
      headerHeight: this.isMobile ? 40 : 44,
      fontFamily: 'Inter, system-ui, Roboto, sans-serif',
      fontSize: this.isMobile ? '13px' : '14px',
      accentColor: '#0d6efd',
    });
  }

  // =========================
  // GRID HANDLERS
  // =========================
  onGridReady(e: GridReadyEvent): void {
    this.gridApi = e.api;
    this.applyQuickFilter();
  }

  private buildColumnDefs(): void {
    this.columnDefs = [
      { headerName: this.translate.instant('NAME'), field: 'name', minWidth: 180, flex: 1 },
      { headerName: this.translate.instant('CREDITS'), field: 'credits', type: 'numericColumn', width: 130, cellClass: 'ag-right-aligned-cell' },
      { headerName: this.translate.instant('PRICE'), field: 'price', type: 'numericColumn', width: 140, valueFormatter: (p) => Number(p.value ?? 0).toFixed(2), cellClass: 'ag-right-aligned-cell' },
      { headerName: this.translate.instant('DISCOUNT_PERCENT'), field: 'discountPercentage', type: 'numericColumn', width: 140, cellClass: 'ag-right-aligned-cell' },
      {
        headerName: this.translate.instant('ACTIVE'),
        field: 'isActive',
        width: 120,
        cellClass: 'ag-center-aligned-cell',
        cellRenderer: (p: { value: any; }) => {
          const active = !!p.value;
          const cls = active ? 'bg-success' : 'bg-secondary';
          const label = active ? this.translate.instant('ADMIN.YES') : this.translate.instant('ADMIN.NO');
          return `<span class="badge ${cls}">${label}</span>`;
        },
      },
      {
        headerName: this.translate.instant('EDIT'),
        colId: 'edit',
        width: 110,
        sortable: false,
        filter: false,
        resizable: false,
        cellClass: 'ag-edit-cell',
        cellRenderer: () => `
        <div class="ag-edit icon-only">
          <button class="btn btn-info ag-icon-btn" data-action="edit" title="${this.translate.instant('EDIT')}">✎</button>
        </div>
      `,
        onCellClicked: (e) => {
          const el = (e.event?.target as HTMLElement | null)?.closest?.('[data-action]');
          if (el?.getAttribute?.('data-action') === 'edit' && e.data) this.openEditModal(e.data);
        },
      },
    ];
  }

  /**
   * ag-Grid quick filter API changes across versions.
   * We support both:
   * - api.setQuickFilter(text) (older)
   * - api.setGridOption('quickFilterText', text) (newer)
   */
  applyQuickFilter(): void {
    // ✅ mobile: accordion се update-ира преку filteredPackages getter (ништо не треба тука)
    if (this.isMobile) return;

    // ✅ desktop: ag-grid quick filter
    if (!this.gridApi) return;

    const text = (this.searchText ?? '').trim();
    const anyApi = this.gridApi as any;

    try { anyApi.setGridOption?.('quickFilterText', text); } catch {}
    try { anyApi.setQuickFilter?.(text); } catch {}
  }


  clearSearch(): void {
    this.searchText = '';
    this.applyQuickFilter();
  }

  // =========================
  // SERVER LOAD / PAGING
  // =========================
  loadPackages(): void {
    this.loading = true;
    this.error = null;

    this.api.getPackages(this.perPage, this.page).subscribe({
      next: (res) => {
        this.packages = res.list ?? [];
        this.total = res.total ?? 0;
        this.loading = false;

        queueMicrotask(() => this.applyQuickFilter());
      },
      error: (err: unknown) => {
        console.error(err);
        this.error = 'ADMIN.ERROR_LOAD_PACKAGES';
        this.loading = false;
      },
    });
  }

  reload(): void {
    this.page = 1;
    this.loadPackages();
  }

  prevPage(): void {
    if (this.page <= 1) return;
    this.page--;
    this.loadPackages();
  }

  nextPage(): void {
    if (this.page >= this.totalPages) return;
    this.page++;
    this.loadPackages();
  }

  // =========================
  // FORM INIT + HELPERS
  // =========================
  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      credits: [0, [Validators.required, Validators.min(0)]],
      price: [0, [Validators.required, Validators.min(0)]],
      discountPercentage: [0, [Validators.min(0), Validators.max(100)]],
      isActive: [true],
    });
  }

  private resetFormDefaults(): void {
    this.form.reset({
      name: '',
      description: '',
      credits: 0,
      price: 0,
      discountPercentage: 0,
      isActive: true,
    });
  }

  private patchFormFromPackage(pkg: SuperadminPackageDto): void {
    this.form.reset({
      name: pkg.name ?? '',
      description: pkg.description ?? '',
      credits: pkg.credits ?? 0,
      price: pkg.price ?? 0,
      discountPercentage: pkg.discountPercentage ?? 0,
      isActive: !!pkg.isActive,
    });
  }

  onReset(): void {
    if (this.editingPackage) this.patchFormFromPackage(this.editingPackage);
    else this.resetFormDefaults();
  }

  private buildPayloadFromForm(): PackagePayload {
    const v = this.form.value;
    return {
      name: (v.name ?? '').toString().trim(),
      description: (v.description ?? '').toString().trim() || null,
      credits: Number(v.credits) || 0,
      price: Number(v.price) || 0,
      discountPercentage: Number(v.discountPercentage) || 0,
      isActive: !!v.isActive,
    };
  }

  // =========================
  // MODAL OPEN/CLOSE
  // =========================
  openCreateModal(): void {
    this.editingPackage = null;
    this.resetFormDefaults();
    this.showFormModal = true;
  }

  openEditModal(pkg: SuperadminPackageDto): void {
    this.editingPackage = pkg;
    this.patchFormFromPackage(pkg);
    this.showFormModal = true;
  }

  closeModal(): void {
    this.showFormModal = false;
  }

  // =========================
  // SUBMIT (CREATE / UPDATE + deactivate rule)
  // =========================
  submit(): void {
    // очисти претходни api errors
    ApiErrorUtil.clearApiErrors(this.form);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = null;

    const payload = this.buildPayloadFromForm();

    // CREATE
    if (!this.editingPackage) {
      this.api.createPackage(payload).subscribe({
        next: () => {
          this.toast.success(this.translate.instant('ADMIN.PACKAGE_CREATED_OK'), { position: 'top-end' });
          this.saving = false;
          this.closeModal();
          this.loadPackages();
        },
        error: (err: any) => {
          console.error(err);
          this.saving = false;

          if (err?.status === 422) {
            ApiErrorUtil.applyToForm(this.form, err);
            this.toast.error(ApiErrorUtil.toMessage(err), { position: 'top-end' });
            return;
          }

          this.error = 'ADMIN.ERROR_CREATE_PACKAGE';
          this.toast.error(this.translate.instant(this.error), { position: 'top-end' });
        },
      });
      return;
    }

    // UPDATE (+ activation/deactivation only in modal)
    const id = this.editingPackage.id;
    const wasActive = !!this.editingPackage.isActive;
    const nextActive = !!payload.isActive;

    // Active -> Inactive uses dedicated endpoint
    if (wasActive && !nextActive) {
      this.api.deactivatePackage(id).subscribe({
        next: () => {
          this.toast.success(this.translate.instant('ADMIN.PACKAGE_DEACTIVATED_OK'), { position: 'top-end' });
          this.saving = false;
          this.closeModal();
          this.editingPackage = null;
          this.loadPackages();
        },
        error: (err: any) => {
          console.error(err);
          this.saving = false;

          if (err?.status === 422) {
            ApiErrorUtil.applyToForm(this.form, err);
            this.toast.error(ApiErrorUtil.toMessage(err), { position: 'top-end' });
            return;
          }

          this.error = 'ADMIN.ERROR_DEACTIVATE_PACKAGE';
          this.toast.error(this.translate.instant(this.error), { position: 'top-end' });
        },
      });
      return;
    }

    // Everything else uses normal update (includes Inactive -> Active)
    this.api.updatePackage(id, payload).subscribe({
      next: () => {
        this.toast.success(this.translate.instant('ADMIN.PACKAGE_UPDATED_OK'), { position: 'top-end' });
        this.saving = false;
        this.closeModal();
        this.editingPackage = null;
        this.loadPackages();
      },
      error: (err: any) => {
        console.error(err);
        this.saving = false;

        if (err?.status === 422) {
          ApiErrorUtil.applyToForm(this.form, err);
          this.toast.error(ApiErrorUtil.toMessage(err), { position: 'top-end' });
          return;
        }

        this.error = 'ADMIN.ERROR_UPDATE_PACKAGE';
        this.toast.error(this.translate.instant(this.error), { position: 'top-end' });
      },
    });
  }

}
