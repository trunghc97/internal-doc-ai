import { Component, EventEmitter, Input, Output, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  ButtonComponent,
  CardComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardDescriptionComponent,
  CardContentComponent
} from '../atoms';
import { ApiService } from '../../services/api.service';

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
declare const docx: any;

@Component({
  selector: 'app-document-preview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent
  ],
  template: `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
        <!-- Header -->
        <div class="flex justify-between items-center p-6 border-b">
          <div>
            <h2 class="text-xl font-semibold text-gray-900">Preview tài liệu</h2>
            <p class="mt-1 text-sm text-gray-500">{{document.filename}}</p>
          </div>
          <div class="flex items-center space-x-2">
            <!-- Nút tải xuống -->
            <app-button
              [variant]="'ghost'"
              [size]="'sm'"
              (click)="downloadDocument()"
            >
              <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-4-4m4 4l4-4m-4-4V3" />
              </svg>
              Tải xuống
            </app-button>
            <!-- Nút đóng -->
            <button
              class="text-gray-400 hover:text-gray-500"
              (click)="close.emit()"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="h-[calc(90vh-120px)] overflow-hidden">
          <!-- Loading state -->
          <div *ngIf="isLoading" class="flex items-center justify-center h-full">
            <div class="text-center">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <svg class="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-gray-900">Đang tải preview...</h3>
              <p class="mt-2 text-sm text-gray-500">Vui lòng đợi trong giây lát</p>
            </div>
          </div>

          <!-- Error state -->
          <div *ngIf="hasError && !isLoading" class="flex items-center justify-center h-full">
            <div class="text-center">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-gray-900">Không thể preview tài liệu</h3>
              <p class="mt-2 text-sm text-gray-500">{{errorMessage}}</p>
              <app-button
                [variant]="'primary'"
                [size]="'sm'"
                class="mt-4"
                (click)="loadPreview()"
              >
                Thử lại
              </app-button>
            </div>
          </div>

          <!-- PDF Preview -->
          <div *ngIf="!isLoading && !hasError && isPDF" class="h-full">
            <iframe
              [src]="previewUrl"
              class="w-full h-full border-0"
              title="PDF Preview"
            ></iframe>
          </div>

          <!-- DOCX Preview -->
          <div *ngIf="!isLoading && !hasError && isDocx" class="h-full overflow-y-auto bg-gray-50">
            <div class="max-w-5xl mx-auto p-6">
              <div 
                #docxContainer 
                class="docx-container bg-white shadow-sm rounded-lg min-h-full"
                style="font-family: 'Times New Roman', serif; line-height: 1.6;"
              ></div>
            </div>
          </div>

          <!-- Document Preview (for other formats) -->
          <div *ngIf="!isLoading && !hasError && !isPDF && !isDocx" class="h-full p-6 overflow-y-auto bg-gray-50">
            <div class="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
              <!-- Document icon and info -->
              <div class="text-center mb-8">
                <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-4">
                  <svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 class="text-xl font-semibold text-gray-900">{{document.filename}}</h3>
                <p class="mt-2 text-sm text-gray-500">
                  Định dạng: {{getFileExtension(document.filename).toUpperCase()}} •
                  Kích thước: {{formatFileSize(document.fileSize)}}
                </p>
              </div>

              <!-- Preview content placeholder -->
              <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">Preview không khả dụng</h3>
                <p class="mt-1 text-sm text-gray-500">
                  Định dạng {{getFileExtension(document.filename).toUpperCase()}} chưa hỗ trợ preview trực tiếp.
                </p>
                <div class="mt-6">
                  <app-button
                    [variant]="'primary'"
                    (click)="downloadDocument()"
                  >
                    <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-4-4m4 4l4-4m-4-4V3" />
                    </svg>
                    Tải xuống để xem
                  </app-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .docx-container {
      padding: 40px;
      background: white;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    ::ng-deep .docx-preview {
      font-family: 'Times New Roman', serif;
      line-height: 1.6;
      color: #333;
    }

    ::ng-deep .docx-preview p {
      margin-bottom: 12px;
    }

    ::ng-deep .docx-preview h1,
    ::ng-deep .docx-preview h2,
    ::ng-deep .docx-preview h3,
    ::ng-deep .docx-preview h4,
    ::ng-deep .docx-preview h5,
    ::ng-deep .docx-preview h6 {
      margin-top: 20px;
      margin-bottom: 10px;
      font-weight: bold;
    }

    ::ng-deep .docx-preview table {
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0;
    }

    ::ng-deep .docx-preview table td,
    ::ng-deep .docx-preview table th {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }

    ::ng-deep .docx-preview table th {
      background-color: #f2f2f2;
      font-weight: bold;
    }

    ::ng-deep .docx-preview ul,
    ::ng-deep .docx-preview ol {
      margin: 12px 0;
      padding-left: 30px;
    }

    ::ng-deep .docx-preview li {
      margin-bottom: 6px;
    }

    ::ng-deep .docx-preview img {
      max-width: 100%;
      height: auto;
      margin: 16px 0;
    }

    ::ng-deep .docx-preview .page-break {
      page-break-before: always;
      border-top: 1px dashed #ccc;
      margin: 40px 0 20px 0;
      padding-top: 20px;
    }
  `]
})

export class DocumentPreviewDialogComponent implements OnInit, AfterViewInit {
  @Input() document!: Document;
  @Output() close = new EventEmitter<void>();
  @ViewChild('docxContainer', { static: false }) docxContainer!: ElementRef;

  isLoading = true;
  hasError = false;
  errorMessage = '';
  previewUrl: SafeResourceUrl | null = null;
  isDocxLoaded = false;

  constructor(
    private apiService: ApiService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.loadDocxLibrary();
  }

  ngAfterViewInit() {
    if (this.isDocxLoaded) {
      this.loadPreview();
    }
  }

  get isPDF(): boolean {
    return this.getFileExtension(this.document.filename) === 'pdf';
  }

  get isDocx(): boolean {
    const ext = this.getFileExtension(this.document.filename);
    return ext === 'docx' || ext === 'doc';
  }

  private loadDocxLibrary() {
    // Kiểm tra xem thư viện đã được load chưa
    if (typeof docx !== 'undefined') {
      this.isDocxLoaded = true;
      this.loadPreview();
      return;
    }

    // Load docx-preview library dynamically
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/docx-preview@0.1.4/dist/docx-preview.min.js';
    script.onload = () => {
      this.isDocxLoaded = true;
      this.loadPreview();
    };
    script.onerror = () => {
      this.hasError = true;
      this.errorMessage = 'Không thể tải thư viện preview DOCX';
      this.isLoading = false;
    };
    document.head.appendChild(script);
  }

  loadPreview() {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    if (this.isPDF) {
      // Tải PDF để preview
      this.apiService.downloadDocument(this.document.id.toString()).subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading PDF preview:', error);
          this.hasError = true;
          this.errorMessage = 'Không thể tải file PDF. Vui lòng thử lại sau.';
          this.isLoading = false;
        }
      });
    } else if (this.isDocx && this.isDocxLoaded) {
      // Tải DOCX để preview
      this.apiService.downloadDocument(this.document.id.toString()).subscribe({
        next: (blob) => {
          this.renderDocx(blob);
        },
        error: (error) => {
          console.error('Error loading DOCX preview:', error);
          this.hasError = true;
          this.errorMessage = 'Không thể tải file DOCX. Vui lòng thử lại sau.';
          this.isLoading = false;
        }
      });
    } else {
      // Đối với các định dạng khác, hiển thị placeholder
      this.isLoading = false;
    }
  }

  private async renderDocx(blob: Blob) {
    try {
      if (!this.docxContainer) {
        this.hasError = true;
        this.errorMessage = 'Container không tồn tại';
        this.isLoading = false;
        return;
      }

      // Clear container
      this.docxContainer.nativeElement.innerHTML = '';

      // Render DOCX
      await docx.renderAsync(blob, this.docxContainer.nativeElement, null, {
        className: 'docx-preview',
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        ignoreLastRenderedPageBreak: true,
        experimental: false,
        trimXmlDeclaration: true,
        useBase64URL: false,
        useMathMLPolyfill: false,
        showChanges: false,
        debug: false
      });

      this.isLoading = false;
    } catch (error) {
      console.error('Error rendering DOCX:', error);
      this.hasError = true;
      this.errorMessage = 'Không thể hiển thị nội dung DOCX. File có thể bị lỗi hoặc không được hỗ trợ.';
      this.isLoading = false;
    }
  }

  downloadDocument() {
    this.apiService.downloadDocument(this.document.id.toString()).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.document.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading document:', error);
        alert('Có lỗi xảy ra khi tải xuống tài liệu. Vui lòng thử lại.');
      }
    });
  }

  getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
