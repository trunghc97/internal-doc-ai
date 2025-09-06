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
  filteredDocuments: Document[] = [
    {
      id: 'doc-001',
      name: 'employee_contract.docx',
      size: 24576,
      uploadTime: new Date('2025-09-05T09:15:00'),
      status: 'completed',
      type: 'docx',
      securityLevel: 'confidential',
      department: 'HR',
      notes: 'Contains employee personal data',
      sensitivityScore: 87,
      findings: [
        {
          type: 'PII',
          description: 'Detected phone number',
          page: 2,
          paragraph: 3
        },
        {
          type: 'PII',
          description: 'Detected national ID',
          page: 3,
          paragraph: 1
        }
      ]
    },
    {
      id: 'doc-002',
      name: 'financial_report_q2.xlsx',
      size: 102400,
      uploadTime: new Date('2025-09-04T15:30:00'),
      status: 'analyzing',
      type: 'xlsx',
      securityLevel: 'high',
      department: 'Finance',
      sensitivityScore: undefined
    },
    {
      id: 'doc-003',
      name: 'internal_policy.pdf',
      size: 52300,
      uploadTime: new Date('2025-09-03T11:00:00'),
      status: 'completed',
      type: 'pdf',
      securityLevel: 'medium',
      department: 'Operations',
      findings: [
        {
          type: 'policy',
          description: 'Sensitive compliance policy content',
          page: 5,
          paragraph: 2
        }
      ]
    },
    {
      id: 'doc-004',
      name: 'marketing_plan_2026.docx',
      size: 33450,
      uploadTime: new Date('2025-09-01T08:45:00'),
      status: 'error',
      type: 'docx',
      securityLevel: 'low',
      department: 'Marketing',
      notes: 'Upload failed due to corrupted file.'
    },
    {
      id: 'doc-005',
      name: 'customer_feedback.docx',
      size: 28900,
      uploadTime: new Date('2025-09-06T10:12:00'),
      status: 'completed',
      type: 'docx',
      securityLevel: 'medium',
      department: 'Customer Service',
      sensitivityScore: 45,
      findings: []
    }
  ];

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

  // Phương thức đếm số lượng tài liệu theo trạng thái
  getDocumentCountByStatus(status: string): number {
    return this.documents.filter(doc => doc.status === status).length;
  }

  // Phương thức đếm số lượng tài liệu có rủi ro (sensitivityScore > 70)
  getDocumentsWithRisk(): number {
    return this.documents.filter(doc => 
      doc.status === 'completed' && 
      doc.sensitivityScore && 
      doc.sensitivityScore > 70
    ).length;
  }

  // Phương thức lấy thống kê theo phòng ban
  getDepartmentStats(): Array<{department: string, count: number}> {
    const stats = new Map<string, number>();
    
    this.documents.forEach(doc => {
      if (doc.department) {
        stats.set(doc.department, (stats.get(doc.department) || 0) + 1);
      }
    });

    return Array.from(stats.entries()).map(([department, count]) => ({
      department,
      count
    }));
  }

  // Phương thức lấy tên phòng ban hiển thị
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

  // Phương thức tính phần trăm
  getPercentage(count: number): number {
    if (this.documents.length === 0) return 0;
    return Math.round((count / this.documents.length) * 100);
  }

  // Phương thức lấy tên loại văn bản
  getDocumentTypeName(type: string): string {
    const types = {
      'contract': 'Hợp đồng',
      'report': 'Báo cáo',
      'policy': 'Chính sách',
      'other': 'Khác'
    };
    return types[type as keyof typeof types] || type;
  }

  // Phương thức lấy tên mức độ bảo mật
  getSecurityLevelName(level: string): string {
    const levels = {
      'public': 'Công khai',
      'internal': 'Nội bộ',
      'confidential': 'Bảo mật',
      'top_secret': 'Tối mật'
    };
    return levels[level as keyof typeof levels] || level;
  }

  // Phương thức lấy variant cho mức độ bảo mật
  getSecurityLevelVariant(level: string): string {
    const variants = {
      'public': 'success',
      'internal': 'info',
      'confidential': 'warning',
      'top_secret': 'danger'
    };
    return variants[level as keyof typeof variants] || 'default';
  }

  // Phương thức lấy class cho thanh mức độ nhạy cảm
  getSensitivityScoreClass(score: number): string {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  // Phương thức lấy class cho text mức độ nhạy cảm
  getSensitivityTextClass(score: number): string {
    if (score >= 80) return 'text-red-600 font-medium';
    if (score >= 60) return 'text-orange-600 font-medium';
    if (score >= 40) return 'text-yellow-600 font-medium';
    return 'text-green-600 font-medium';
  }
}
