import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';
import {
  ButtonComponent,
  CardComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardDescriptionComponent,
  CardContentComponent,
  BadgeComponent,
  FileUploadComponent,
  InputComponent
} from '../../components/atoms';
import {
  FormFieldComponent,
  FormLabelComponent,
  FormDescriptionComponent,
  FormMessageComponent
} from '../../components/molecules';

interface Document {
  id: string;
  name: string;
  size: number;
  uploadTime: Date;
  status: 'analyzing' | 'completed' | 'error';
  type: string;
  securityLevel: string;
  department: string;
  notes?: string;
  sensitivityScore?: number;
  findings?: Array<{
    type: string;
    description: string;
    page: number;
    paragraph: number;
  }>;
}

interface DocumentMetadata {
  type: string;
  securityLevel: string;
  department: string;
  notes?: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
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
    BadgeComponent,
    FileUploadComponent,
    InputComponent,
    FormFieldComponent,
    FormLabelComponent,
    FormDescriptionComponent,
    FormMessageComponent,
    FileSizePipe
  ]
})
export class DashboardComponent {
  // Danh sách văn bản
  documents: Document[] = [];
  selectedDocument: Document | null = null;
  
  // Upload state
  selectedFiles: File[] = [];
  documentMetadata: DocumentMetadata = {
    type: '',
    securityLevel: '',
    department: ''
  };

  // Filter state
  searchTerm: string = '';
  statusFilter: string = '';
  timeFilter: string = '';
  filteredDocuments: Document[] = [];

  onFilesSelected(files: File[]) {
    this.selectedFiles = files;
    // Reset metadata form
    this.documentMetadata = {
      type: '',
      securityLevel: '',
      department: ''
    };
  }

  isValidMetadata(): boolean {
    return (
      this.documentMetadata.type !== '' &&
      this.documentMetadata.securityLevel !== '' &&
      this.documentMetadata.department !== ''
    );
  }

  cancelUpload() {
    this.selectedFiles = [];
    this.documentMetadata = {
      type: '',
      securityLevel: '',
      department: ''
    };
  }

  async uploadDocuments() {
    for (const file of this.selectedFiles) {
      const newDoc: Document = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        uploadTime: new Date(),
        status: 'analyzing',
        type: this.documentMetadata.type,
        securityLevel: this.documentMetadata.securityLevel,
        department: this.documentMetadata.department,
        notes: this.documentMetadata.notes
      };
      
      this.documents.unshift(newDoc);
      this.filterDocuments();
      
      // TODO: Gửi file và metadata lên server để phân tích
      await this.analyzeDocument(newDoc, file);
    }

    // Reset form sau khi upload
    this.cancelUpload();
  }

  private async analyzeDocument(doc: Document, file: File) {
    try {
      // TODO: Implement actual API call
      // Giả lập phân tích với timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      doc.status = 'completed';
      doc.sensitivityScore = Math.floor(Math.random() * 100);
      doc.findings = [
        {
          type: 'Thông tin cá nhân',
          description: 'Phát hiện số CMND/CCCD trong văn bản',
          page: 1,
          paragraph: 2
        },
        {
          type: 'Thông tin tài chính',
          description: 'Phát hiện thông tin về số tài khoản ngân hàng',
          page: 2,
          paragraph: 4
        }
      ];
      this.filterDocuments();
    } catch (error) {
      doc.status = 'error';
      console.error('Error analyzing document:', error);
    }
  }

  filterDocuments() {
    let filtered = [...this.documents];

    // Lọc theo từ khóa tìm kiếm
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(term) ||
        doc.type.toLowerCase().includes(term) ||
        doc.department.toLowerCase().includes(term)
      );
    }

    // Lọc theo trạng thái
    if (this.statusFilter) {
      filtered = filtered.filter(doc => doc.status === this.statusFilter);
    }

    // Lọc theo thời gian
    if (this.timeFilter) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today);
      thisWeek.setDate(today.getDate() - today.getDay());
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      filtered = filtered.filter(doc => {
        const docDate = new Date(doc.uploadTime);
        switch (this.timeFilter) {
          case 'today':
            return docDate >= today;
          case 'week':
            return docDate >= thisWeek;
          case 'month':
            return docDate >= thisMonth;
          default:
            return true;
        }
      });
    }

    this.filteredDocuments = filtered;
  }

  viewResults(doc: Document) {
    this.selectedDocument = doc;
  }

  deleteDocument(doc: Document) {
    const index = this.documents.findIndex(d => d.id === doc.id);
    if (index !== -1) {
      this.documents.splice(index, 1);
      if (this.selectedDocument?.id === doc.id) {
        this.selectedDocument = null;
      }
      this.filterDocuments();
    }
  }
}
