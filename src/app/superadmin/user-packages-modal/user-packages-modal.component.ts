import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ToastService } from '../../shared/toast.service';
import { ApiErrorUtil } from '../../shared/api-error.util';
import { SuperadminPackagesApi, SuperadminPackageDto } from '../../shared/superadmin-packages.api';
import { SuperadminUserPackagesApi, UserPackageDto } from '../../shared/superadmin-user-packages.api';

type UiUserPackageRow = UserPackageDto & {
  // normalized display fields (fallback ако нема embed package)
  packageName?: string;
  packageCredits?: number;
};

@Component({
  standalone: true,
  selector: 'app-user-packages-modal',
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './user-packages-modal.component.html',
  styleUrls: ['./user-packages-modal.component.scss'],
})
export class UserPackagesModalComponent implements OnChanges {
  @Input({ required: true }) userId!: number;
  @Input() userEmail?: string;

  @Output() close   = new EventEmitter<void>();
  @Output() changed = new EventEmitter<void>();

  // data
  allPackages: SuperadminPackageDto[] = [];
  activePackages: SuperadminPackageDto[] = [];

  userPackages: UiUserPackageRow[] = [];

  // assign form
  selectedPackageId: number | null = null;
  reason = '';

  // busy
  loading = false;
  assigning = false;
  removingId: number | null = null;

  constructor(
    private pkApi: SuperadminPackagesApi,
    private upApi: SuperadminUserPackagesApi,
    private toast: ToastService,
    private i18n: TranslateService
  ) {}

  ngOnChanges(): void {
    if (!this.userId) return;
    this.loadAll();
  }

  private loadAll(): void {
    this.loading = true;

    // 1) load packages list
    this.pkApi.getPackages(200, 1).subscribe({
      next: (res) => {
        this.allPackages = res.list ?? [];
        this.activePackages = this.allPackages.filter(p => !!p.isActive);

        // 2) load user packages
        this.loadUserPackages();
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(ApiErrorUtil.toMessage(err));
      }
    });
  }

  private loadUserPackages(): void {
    this.upApi.getUserPackages(this.userId, 200, 1).subscribe({
      next: (res) => {
        const list = (res.list ?? []) as UiUserPackageRow[];

        // normalize: ако backend не праќа embed package → најди од allPackages по packageId
        this.userPackages = list.map(up => {
          const embed = up.package;
          const fromList = this.allPackages.find(p => p.id === up.packageId);

          return {
            ...up,
            packageName: embed?.name ?? fromList?.name ?? `#${up.packageId}`,
            packageCredits: embed?.credits ?? fromList?.credits
          };
        });

        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(ApiErrorUtil.toMessage(err));
      }
    });
  }

  canAssign(): boolean {
    return !!this.userId && !!this.selectedPackageId && !this.assigning && !this.loading;
  }

  assign(): void {
    if (!this.canAssign()) return;

    this.assigning = true;

    this.upApi.assign(this.userId, {
      packageId: this.selectedPackageId!,
      reason: (this.reason || '').trim() || null
    }).subscribe({
      next: () => {
        this.toast.success(this.i18n.instant('ADMIN.PACKAGE_ASSIGNED') || 'Package assigned');
        this.assigning = false;
        this.selectedPackageId = null;
        this.reason = '';
        this.loadUserPackages();
        this.changed.emit();
      },
      error: (err) => {
        this.assigning = false;
        this.toast.error(ApiErrorUtil.toMessage(err));
      }
    });
  }

  remove(row: UiUserPackageRow): void {
    if (!row?.id) return;

    this.removingId = row.id;

    this.upApi.remove(this.userId, row.id).subscribe({
      next: () => {
        this.toast.success(this.i18n.instant('ADMIN.PACKAGE_REMOVED') || 'Package removed');
        this.removingId = null;
        this.loadUserPackages();
        this.changed.emit();
      },
      error: (err) => {
        this.removingId = null;
        this.toast.error(ApiErrorUtil.toMessage(err));
      }
    });
  }

  trackById(_: number, x: UiUserPackageRow) { return x.id; }

  doClose(): void {
    this.close.emit();
  }
}
