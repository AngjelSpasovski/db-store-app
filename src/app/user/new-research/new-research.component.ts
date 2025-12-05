// src/app/user/new-research/new-research.component.ts
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Inject,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule, DOCUMENT } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { DataRequestApi, DataRequestRow } from 'src/app/shared/data-request.api';

import { SearchHistoryService } from './new-search-history.service';
import { AuthService } from '../../auth/auth.service';
import { CreditsService } from '../buy-credits/credit.service';
import { ToastService } from '../../shared/toast.service';
import { HistoryComponent } from '../history/history.component';

import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-new-research',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, HistoryComponent],
  templateUrl: './new-research.component.html',
  styleUrls: ['./new-research.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewResearchComponent implements OnInit {
  // single-ID search
  searchForm!: FormGroup;
  searching = false;

  // bulk search
  bulkFile: File | null = null;
  uploadingBulk = false;

  constructor(
    private fb: FormBuilder,
    private translate: TranslateService,
    private historyStore: SearchHistoryService,
    private auth: AuthService,
    private toasts: ToastService,
    private creditsSvc: CreditsService,
    private dataReqApi: DataRequestApi,
    private cdr: ChangeDetectorRef,
    @Inject(DOCUMENT) private doc: Document
  ) {}

  ngOnInit() {
    this.searchForm = this.fb.group({
      id: [
        '',
        [
          Validators.required,
          Validators.minLength(16),
          Validators.maxLength(16),
          Validators.pattern(/^[A-Za-z0-9]+$/),
        ],
      ],
    });

    // иницијално вчитување на history
    this.historyStore.reload();
  }

  // ===== SINGLE ID SEARCH (како request со 1 ID) =====
  submit() {
    if (this.searchForm.invalid || this.searching) {
      return;
    }

    const id = this.searchForm.value.id.trim();

    this.searching = true;
    this.searchForm.disable();

    // правиме локален .txt фајл со едно ID
    const file = new File([id + '\n'], 'single-id.txt', { type: 'text/plain' });
    console.log('[SingleSearch] request file ➜', { id, size: file.size });

    this.dataReqApi
      .create(file)
      .pipe(
        finalize(() => {
          this.searching = false;
          this.searchForm.enable();

          // 🔹 РЕСЕТ НА ФОРМАТА + СОСТОЈБА
          this.searchForm.reset();
          this.searchForm.markAsPristine();
          this.searchForm.markAsUntouched();

          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res) => {
          const row = res.dataRequest as DataRequestRow;
          console.log('[SingleSearch] response ➜', row);

          // ❌ НИКАКОВ download тука!
          if (row.matchesCount === 0) {
            this.toasts.error(this.translate.instant('NO_MATCHES_FILE_NOT_GENERATED'));
          } else {
            this.toasts.success(this.translate.instant('REQUEST_CREATED', { id: row.id }));
          }


          this.auth.deductCredits(1);
          this.creditsSvc.refreshFromApi?.();

          // освежи ја history табелата од backend
          this.historyStore.reload();
        },
        error: (err) => {
          console.error('Single search failed', err);
          this.toasts.error(this.translate.instant('SEARCH_FAILED'));
        },
      });
  }

  // ===== BULK SEARCH VIA FILE =====
  onBulkFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.bulkFile = input.files?.[0] ?? null;
  }

  // ===== BULK SEARCH VIA FILE =====
  uploadBulk() {
    if (!this.bulkFile || this.uploadingBulk) return;

    console.log('[BulkSearch] request file ➜', {
      name: this.bulkFile.name,
      size: this.bulkFile.size,
    });

    this.uploadingBulk = true;

    this.dataReqApi
      .create(this.bulkFile)
      .pipe(
        finalize(() => {
          this.uploadingBulk = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res) => {
          const row = res.dataRequest;
          console.log('[BulkSearch] response ➜', row);

          this.toasts.success(this.translate.instant('DATA_REQUEST_CREATED'));

          // 🔹 reset локална референца
          this.bulkFile = null;

          // 🔹 reset на самиот <input type="file">
          const fileInput = this.doc.getElementById('bulkFileInput') as HTMLInputElement | null;
          if (fileInput) {
            fileInput.value = '';
          }

          this.creditsSvc.refreshFromApi?.();

          // освежи history табелата од backend
          this.historyStore.reload();
        },
        error: (err) => {
          console.error('Bulk upload failed', err);
          this.toasts.error(this.translate.instant('FAILED_TO_CREATE_DATA_REQUEST'));
        },
      });
  }

}
