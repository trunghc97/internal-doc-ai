import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-file-upload',
  template: `
    <div
      class="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ease-in-out relative"
      [class.border-blue-500]="isDragging"
      [class.bg-blue-50]="isDragging"
      [class.border-gray-300]="!isDragging"
      [class.hover:border-blue-400]="!isDragging"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      (click)="fileInput.click()"
    >
      <input
        #fileInput
        type="file"
        class="hidden"
        (change)="onFileSelected($event)"
        [multiple]="multiple"
        [accept]="accept"
      />

      <!-- Hiển thị khi chưa có file -->
      <div *ngIf="!selectedFiles.length" class="flex flex-col items-center justify-center pt-5 pb-6">
        <svg
          class="w-10 h-10 mb-3"
          [class.text-blue-500]="isDragging"
          [class.text-gray-400]="!isDragging"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p class="mb-2 text-sm" [class.text-blue-500]="isDragging" [class.text-gray-500]="!isDragging">
          <span class="font-semibold">Nhấp để tải lên</span> hoặc kéo và thả
        </p>
        <p class="text-xs text-gray-500" *ngIf="accept">
          {{ acceptMessage }}
        </p>
      </div>

      <!-- Hiển thị khi đã chọn file -->
      <div *ngIf="selectedFiles.length" class="w-full h-full p-4">
        <div class="flex items-start space-x-4 bg-white rounded-lg p-4 shadow-sm">
          <!-- Icon theo loại file -->
          <div class="flex-shrink-0">
            <div [ngSwitch]="getFileType(selectedFiles[0].name)" class="w-12 h-12 flex items-center justify-center rounded-lg">
              <!-- PDF Icon -->
              <svg *ngSwitchCase="'pdf'" class="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                <text x="8" y="16" class="text-xs font-bold" fill="currentColor">PDF</text>
              </svg>
              <!-- DOCX Icon -->
              <svg *ngSwitchCase="'docx'" class="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                <text x="6" y="16" class="text-xs font-bold" fill="currentColor">DOC</text>
              </svg>
            </div>
          </div>

          <!-- Thông tin file -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">
              {{selectedFiles[0].name}}
            </p>
            <p class="text-sm text-gray-500">
              {{formatFileSize(selectedFiles[0].size)}}
            </p>
          </div>

          <!-- Nút xóa -->
          <button
            class="flex-shrink-0 text-gray-400 hover:text-gray-500"
            (click)="removeFiles($event)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Multiple files indicator -->
        <div *ngIf="selectedFiles.length > 1" class="mt-2 text-sm text-gray-500 text-center">
          +{{selectedFiles.length - 1}} file khác
        </div>
      </div>
    </div>
  `,
  styles: [],
  standalone: true,
  imports: [
    CommonModule
  ]
})
export class FileUploadComponent {
  @Output() filesSelected = new EventEmitter<File[]>();
  
  isDragging = false;
  
  @Input() multiple = false;
  @Input() accept = '';
  @Input() maxFileSize?: number; // Kích thước tối đa cho mỗi file (bytes)
  @Input() maxTotalSize?: number; // Tổng kích thước tối đa cho tất cả files (bytes)
  
  get acceptMessage(): string {
    if (!this.accept) return '';
    return 'Định dạng được chấp nhận: ' + this.accept.split(',').join(', ');
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles(Array.from(files));
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles(Array.from(input.files));
    }
  }

  selectedFiles: File[] = [];

  private handleFiles(files: File[]) {
    let validFiles = files;

    // Kiểm tra số lượng file
    if (!this.multiple && validFiles.length > 1) {
      validFiles = [validFiles[0]];
    }

    // Kiểm tra định dạng file
    if (this.accept) {
      const acceptedTypes = this.accept.split(',').map(type => type.trim().toLowerCase());
      validFiles = validFiles.filter(file => {
        const fileType = file.type.toLowerCase();
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        return acceptedTypes.some(type => {
          if (type.startsWith('.')) {
            // So sánh phần mở rộng
            return type === fileExtension;
          } else if (type.endsWith('/*')) {
            // So sánh MIME type chính (e.g., 'image/*')
            const mainType = type.split('/')[0];
            return fileType.startsWith(mainType);
          } else {
            // So sánh MIME type đầy đủ
            return type === fileType;
          }
        });
      });
    }

    // Kiểm tra kích thước file
    if (this.maxFileSize) {
      validFiles = validFiles.filter(file => file.size <= this.maxFileSize!);
    }

    // Kiểm tra tổng kích thước
    if (this.maxTotalSize) {
      const totalSize = validFiles.reduce((sum, file) => sum + file.size, 0);
      if (totalSize > this.maxTotalSize) {
        validFiles = [];
      }
    }

    if (validFiles.length > 0) {
      this.selectedFiles = validFiles;
      this.filesSelected.emit(validFiles);
    }
  }

  // Lấy loại file từ tên file
  getFileType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(extension || '')) return 'docx';
    return 'other';
  }

  // Format kích thước file
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Xóa các file đã chọn
  removeFiles(event: Event) {
    event.stopPropagation();
    this.selectedFiles = [];
    this.filesSelected.emit([]);
  }
}
