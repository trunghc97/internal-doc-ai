import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ButtonComponent,
  CardComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardDescriptionComponent,
  CardContentComponent,
  BadgeComponent
} from '../atoms';

interface Document {
  id: number;
  filename: string;
  content: string;
  fileSize: number;
  mimeType: string;
  sensitiveInfo: string;
  ownerUserId: number;
  uploadedAt: Date;
  lastModifiedAt: Date;
  riskScore: number;
  status: string;
}

@Component({
  selector: 'app-document-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    BadgeComponent
  ],
  template: `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <!-- Header -->
          <div class="flex justify-between items-center mb-6">
            <div>
              <h2 class="text-xl font-semibold text-gray-900">Chi tiết tài liệu</h2>
              <p class="mt-1 text-sm text-gray-500">{{document.filename}}</p>
            </div>
            <button
              class="text-gray-400 hover:text-gray-500"
              (click)="close.emit()"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="space-y-8">
            <!-- Thông tin cơ bản -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-4">
                <div>
                  <h3 class="text-sm font-medium text-gray-500">Thời gian tải lên</h3>
                  <p class="mt-1 text-sm text-gray-900">{{document.uploadedAt | date:'medium'}}</p>
                </div>
                <div>
                  <h3 class="text-sm font-medium text-gray-500">Kích thước</h3>
                  <p class="mt-1 text-sm text-gray-900">{{formatFileSize(document.fileSize)}}</p>
                </div>
                <div>
                  <h3 class="text-sm font-medium text-gray-500">Loại văn bản</h3>
                  <div class="mt-1">
                    <app-badge
                      [variant]="'primary'"
                      [type]="'soft'"
                      [size]="'sm'"
                    >
                      {{getDocumentTypeName(document.mimeType)}}
                    </app-badge>
                  </div>
                </div>
                <div>
                  <h3 class="text-sm font-medium text-gray-500">Phòng ban</h3>
                  <div class="mt-1">
                    <app-badge
                      [variant]="'info'"
                      [type]="'soft'"
                      [size]="'sm'"
                    >
                      {{document.sensitiveInfo || 'N/A'}}
                    </app-badge>
                  </div>
                </div>
              </div>

              <div class="space-y-4">
                <div>
                  <h3 class="text-sm font-medium text-gray-500">Trạng thái</h3>
                  <div class="mt-1">
                    <app-badge
                      [variant]="document.status === 'analyzing' ? 'warning' : document.status === 'completed' ? 'success' : 'error'"
                      [type]="'soft'"
                      [size]="'sm'"
                    >
                      {{document.status === 'analyzing' ? 'Đang phân tích' : document.status === 'completed' ? 'Hoàn thành' : 'Lỗi'}}
                    </app-badge>
                  </div>
                </div>
                <div>
                  <h3 class="text-sm font-medium text-gray-500">Mức độ bảo mật</h3>
                  <div class="mt-1">
                    <app-badge
                      [type]="'soft'"
                      [size]="'sm'"
                    >
                      {{document.status}}
                    </app-badge>
                  </div>
                </div>
                <div>
                  <h3 class="text-sm font-medium text-gray-500">Ghi chú</h3>
                  <p class="mt-1 text-sm text-gray-900">{{document.sensitiveInfo || 'Không có thông tin nhạy cảm'}}</p>
                </div>
              </div>
            </div>

            <!-- Kết quả phân tích -->
            <div *ngIf="document.status === 'completed'">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Kết quả phân tích</h3>
              
              <!-- Mức độ nhạy cảm -->
              <div class="p-4 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
                <h4 class="font-medium text-yellow-800">Mức độ nhạy cảm</h4>
                <div class="mt-2 flex items-center">
                  <div class="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      class="h-2 rounded-full"
                      [style.width.%]="document.riskScore"
                      [class]="getSensitivityScoreClass(document.riskScore || 0)"
                    ></div>
                  </div>
                  <span class="ml-2 text-sm" [class]="getSensitivityTextClass(document.riskScore || 0)">
                    {{document.riskScore}}%
                  </span>
                </div>
              </div>

              <!-- Thông tin phân tích -->
              <div class="space-y-4">
                <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div class="font-medium text-blue-800">Kết quả phân tích</div>
                  <div class="mt-1 text-sm text-blue-600">
                    Tài liệu đã được phân tích với điểm rủi ro: {{document.riskScore}}%
                  </div>
                  <div class="mt-2 text-sm text-gray-500">
                    <span class="font-medium">Trạng thái:</span> {{document.status}}
                  </div>
                </div>
              </div>
            </div>

            <!-- Thông báo khi đang phân tích -->
            <div *ngIf="document.status === 'analyzing'" class="text-center py-8">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
                <svg class="w-8 h-8 text-yellow-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-gray-900">Đang phân tích tài liệu</h3>
              <p class="mt-2 text-sm text-gray-500">Quá trình này có thể mất vài phút...</p>
            </div>

            <!-- Thông báo khi có lỗi -->
            <div *ngIf="document.status === 'error'" class="text-center py-8">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-gray-900">Lỗi phân tích tài liệu</h3>
              <p class="mt-2 text-sm text-gray-500">Vui lòng thử lại sau hoặc liên hệ hỗ trợ</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="mt-8 flex justify-end">
            <app-button
              [variant]="'ghost'"
              (click)="close.emit()"
            >
              Đóng
            </app-button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DocumentDetailDialogComponent {
  @Input() document!: Document;
  @Output() close = new EventEmitter<void>();

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getDocumentTypeName(type: string): string {
    const types = {
      'contract': 'Hợp đồng',
      'report': 'Báo cáo',
      'policy': 'Chính sách',
      'other': 'Khác'
    };
    return types[type as keyof typeof types] || type;
  }

  getDepartmentName(code: string): string {
    const departments = {
      'hr': 'Nhân sự',
      'finance': 'Tài chính',
      'tech': 'Kỹ thuật',
      'sales': 'Kinh doanh',
      'other': 'Khác'
    };
    return departments[code as keyof typeof departments] || code;
  }

  getSecurityLevelName(level: string): string {
    const levels = {
      'public': 'Công khai',
      'internal': 'Nội bộ',
      'confidential': 'Bảo mật',
      'top_secret': 'Tối mật'
    };
    return levels[level as keyof typeof levels] || level;
  }

  getSecurityLevelVariant(level: string): string {
    const variants = {
      'public': 'success',
      'internal': 'info',
      'confidential': 'warning',
      'top_secret': 'danger'
    };
    return variants[level as keyof typeof variants] || 'default';
  }

  getSensitivityScoreClass(score: number): string {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  getSensitivityTextClass(score: number): string {
    if (score >= 80) return 'text-red-600 font-medium';
    if (score >= 60) return 'text-orange-600 font-medium';
    if (score >= 40) return 'text-yellow-600 font-medium';
    return 'text-green-600 font-medium';
  }
}
