import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ButtonComponent,
  CardComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardDescriptionComponent,
  CardContentComponent,
  FileUploadComponent
} from '../atoms';
import {
  FormFieldComponent,
  FormLabelComponent
} from '../molecules';

interface DocumentMetadata {
  type: string;
  securityLevel: string;
  department: string;
  notes?: string;
}

@Component({
  selector: 'app-upload-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    FileUploadComponent,
    FormFieldComponent,
    FormLabelComponent
  ],
  template: `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <!-- Header -->
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold text-gray-900">Tải lên văn bản</h2>
            <button
              class="text-gray-400 hover:text-gray-500"
              (click)="close.emit()"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Upload Area -->
          <div class="space-y-6">
            <app-file-upload
              [accept]="'.pdf,.doc,.docx'"
              (filesSelected)="onFilesSelected($event)"
            ></app-file-upload>

            <!-- Metadata Form -->
            <!-- <div *ngIf="selectedFiles.length > 0" class="mt-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Thông tin văn bản</h3>
              
              <div class="space-y-4">
                <app-form-field>
                  <app-form-label>Loại văn bản</app-form-label>
                  <select
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    [(ngModel)]="metadata.type"
                  >
                    <option value="">Chọn loại văn bản</option>
                    <option value="contract">Hợp đồng</option>
                    <option value="report">Báo cáo</option>
                    <option value="policy">Chính sách</option>
                    <option value="other">Khác</option>
                  </select>
                </app-form-field>

                <app-form-field>
                  <app-form-label>Mức độ bảo mật</app-form-label>
                  <select
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    [(ngModel)]="metadata.securityLevel"
                  >
                    <option value="">Chọn mức độ bảo mật</option>
                    <option value="public">Công khai</option>
                    <option value="internal">Nội bộ</option>
                    <option value="confidential">Bảo mật</option>
                    <option value="top_secret">Tối mật</option>
                  </select>
                </app-form-field>

                <app-form-field>
                  <app-form-label>Phòng ban</app-form-label>
                  <select
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    [(ngModel)]="metadata.department"
                  >
                    <option value="">Chọn phòng ban</option>
                    <option value="hr">Nhân sự</option>
                    <option value="finance">Tài chính</option>
                    <option value="tech">Kỹ thuật</option>
                    <option value="sales">Kinh doanh</option>
                    <option value="other">Khác</option>
                  </select>
                </app-form-field>

                <app-form-field>
                  <app-form-label>Ghi chú</app-form-label>
                  <textarea
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows="3"
                    [(ngModel)]="metadata.notes"
                    placeholder="Nhập ghi chú về văn bản..."
                  ></textarea>
                </app-form-field>
              </div>
            </div> -->
          </div>

          <!-- Actions -->
          <div class="mt-6 flex justify-end space-x-3">
            <app-button
              [variant]="'ghost'"
              (click)="close.emit()"
            >
              Hủy
            </app-button>
            <app-button
              [variant]="'primary'"
              [disabled]="!isValid"
              (click)="onUpload()"
            >
              Tải lên
            </app-button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UploadDialogComponent {
  @Output() close = new EventEmitter<void>();
  @Output() upload = new EventEmitter<{files: File[], metadata: DocumentMetadata}>();

  selectedFiles: File[] = [];
  metadata: DocumentMetadata = {
    type: '',
    securityLevel: '',
    department: ''
  };

  get isValid(): boolean {
    return (
      this.selectedFiles.length > 0 
    );
  }

  onFilesSelected(files: File[]) {
    this.selectedFiles = files;
  }

  onUpload() {
    this.upload.emit({
      files: this.selectedFiles,
      metadata: this.metadata
    });
  }
}
