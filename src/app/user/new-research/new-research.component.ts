import { Component, OnInit, Renderer2, Inject, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DOCUMENT } from '@angular/common';
import { DummyIdService } from './dummy-id.service';
import { SearchHistoryService, SearchRecord } from './new-search-history.service';
import { AuthService } from '../../auth/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from '../toast.service';

@Component({
  selector: 'app-new-research',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './new-research.component.html',
  styleUrls: ['./new-research.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewResearchComponent implements OnInit {
  searchForm!: FormGroup;
  records: SearchRecord[] = [];
  fileUrl?: string;

  constructor(
    private fb: FormBuilder,
    private idSvc: DummyIdService,
    private history: SearchHistoryService,
    private auth: AuthService,
    private renderer: Renderer2,
    private toasts: ToastService,
    @Inject(DOCUMENT) private doc: Document
  ) {}

  ngOnInit() {
    this.searchForm = this.fb.group({
      id: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]]
    });
    this.loadHistory();
    // Load last successful search result
    this.records = this.history.getAll();
    const last = this.records.find(r => r.success);
    this.fileUrl = last?.fileUrl;
  }

  loadHistory() {
    this.records = this.history.getAll();
  }

  trackByTimestamp(_i: number, rec: SearchRecord) {
    return rec.timestamp;
  }

  async submit() {
    if (this.searchForm.invalid) return;
    const id = this.searchForm.value.id.trim();
    const success = this.idSvc.exists(id);

    if (success) this.auth.deductCredits(1);

    const rec: SearchRecord = {
      id,
      timestamp: new Date().toLocaleString(),
      success,
      fileUrl: success ? 'assets/privacy/privacy-policy-it.pdf' : undefined
    };
    this.history.add(rec);
    this.loadHistory();
    this.fileUrl = rec.fileUrl;

    // toast
    this.toasts.show(success ? `✔ ID ${id} found!` : `❌ ID ${id} not found.`, success, 5000);
  }
}
