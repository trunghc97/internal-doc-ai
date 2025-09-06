import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-file-upload',
  template: `
    <div
      class="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ease-in-out"
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
      <div class="flex flex-col items-center justify-center pt-5 pb-6">
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
      this.filesSelected.emit(validFiles);
    }
  }
}
