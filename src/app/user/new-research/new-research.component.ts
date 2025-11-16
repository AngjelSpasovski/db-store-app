// src/app/user/new-research/new-research.component.ts
import { Component, OnInit, Renderer2, Inject, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DOCUMENT } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { SearchApi } from '../../shared/search.api';
import { DataRequestApi, DataRequestRow } from '../../shared/data-request.api';

import { SearchHistoryService, SearchRecord } from './new-search-history.service';
import { AuthService } from '../../auth/auth.service';
import { CreditsService } from '../buy-credits/credit.service';
import { ToastService } from '../../shared/toast.service';
import { HistoryComponent } from '../history/history.component';

import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-new-research',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    HistoryComponent
  ],
  templateUrl: './new-research.component.html',
  styleUrls: ['./new-research.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewResearchComponent implements OnInit {

  // single-ID search
  searchForm!: FormGroup;
  records: SearchRecord[] = [];
  fileUrl?: string;
  searching = false;

  // bulk (CSV/Excel) search
  bulkFile: File | null = null;
  dataRequests: DataRequestRow[] = [];
  uploadingBulk = false;
  loadingRequests = false;
  downloadingId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private history: SearchHistoryService,
    private auth: AuthService,
    private renderer: Renderer2,
    private toasts: ToastService,
    private creditsSvc: CreditsService,
    private searchApi: SearchApi,
    private dataReqApi: DataRequestApi,
    @Inject(DOCUMENT) private doc: Document
  ) {}

  ngOnInit() {
    this.searchForm = this.fb.group({
      id: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]]
    });

    this.loadHistory();
    const last = this.records.find(r => r.success);
    this.fileUrl = last?.fileUrl;

    this.loadDataRequests();
  }

  // ===== single search history =====
  loadHistory() {
    this.records = this.history.getAll();
  }

  trackByTimestamp(_i: number, rec: SearchRecord) {
    return rec.timestamp;
  }

  // ===== single ID search =====
  submit() {
    if (this.searchForm.invalid || this.searching) return;

    const id = this.searchForm.value.id.trim();

    this.searching = true;
    this.searchForm.disable();

    this.searchApi.searchById(id)
      .pipe(finalize(() => {
        this.searching = false;
        this.searchForm.enable();
      }))
      .subscribe({
        next: (res) => {
          const success = !!res.found;
          const fileUrl = res.downloadUrl;

          const rec: SearchRecord = {
            id,
            timestamp: new Date().toLocaleString(),
            success,
            fileUrl
          };
          this.history.add(rec);
          this.loadHistory();
          this.fileUrl = fileUrl;

          if (success) {
            this.toasts.show(`✔ ID ${id} found!`, true, 5000);
          } else {
            this.toasts.show(`❌ ID ${id} not found.`, false, 5000);
          }
        },
        error: (err) => {
          console.error('Search failed', err);
          this.toasts.error(err.message || 'Search failed. Please try again later.');
        }
      });
  }

  // ===== bulk search via CSV / Excel (Data Request) =====

  onBulkFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.bulkFile = input.files?.[0] ?? null;
  }

  uploadBulk() {
    if (!this.bulkFile || this.uploadingBulk) return;

    this.uploadingBulk = true;

    this.dataReqApi.create(this.bulkFile).subscribe({
      next: (row: DataRequestRow) => {
        this.uploadingBulk = false;
        this.toasts.success('Data request created successfully.');

        // додај на листа на врв
        this.dataRequests = [row, ...this.dataRequests];

        // ресетирај input
        this.bulkFile = null;
      },
      error: (err: any) => {
        console.error('Bulk upload failed', err);
        this.uploadingBulk = false;
        this.toasts.error('Failed to create data request.');
      }
    });
  }

  loadDataRequests() {
    this.loadingRequests = true;

    this.dataReqApi.list()
      .pipe(finalize(() => this.loadingRequests = false))
      .subscribe({
        next: (res: DataRequestRow[]) => {
          this.dataRequests = res;
        },
        error: (err: any) => {
          console.error('Failed to load data requests', err);
          this.toasts.error('Failed to load data requests.');
        }
      });
  }

  downloadRequest(row: DataRequestRow) {
    if (this.downloadingId) return;
    this.downloadingId = row.id;

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
      error: (err: any) => {
        console.error('Download failed', err);
        this.toasts.error('Download failed. Please try again later.');
      }
    });

  }

  trackByRequestId(_i: number, row: DataRequestRow) {
    return row.id;
  }
}
