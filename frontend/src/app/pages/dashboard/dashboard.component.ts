import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';
import { ApiService, DocumentMetadata } from '../../services/api.service';
import {
  ButtonComponent,
  CardComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardDescriptionComponent,
  CardContentComponent,
  BadgeComponent,
  InputComponent
} from '../../components/atoms';
import {
  FormFieldComponent,
  FormLabelComponent,
  FormDescriptionComponent,
  FormMessageComponent,
  UploadDialogComponent,
  DocumentDetailDialogComponent,
  DocumentPreviewDialogComponent
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
    InputComponent,
    FormFieldComponent,
    FormLabelComponent,
    FormDescriptionComponent,
    FormMessageComponent,
    FileSizePipe,
    UploadDialogComponent,
    DocumentDetailDialogComponent,
    DocumentPreviewDialogComponent
  ]
})
export class DashboardComponent implements OnInit {
  // Danh sách văn bản
  documents: Document[] = [
    {
      id: 'doc-001',
      name: 'employee_contract.docx',
      size: 24576,
      uploadTime: new Date('2025-09-05T09:15:00'),
      status: 'completed',
      type: 'contract',
      securityLevel: 'confidential',
      department: 'hr',
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
      type: 'report',
      securityLevel: 'confidential',
      department: 'finance',
      sensitivityScore: undefined
    },
    {
      id: 'doc-003',
      name: 'internal_policy.pdf',
      size: 52300,
      uploadTime: new Date('2025-09-03T11:00:00'),
      status: 'completed',
      type: 'policy',
      securityLevel: 'internal',
      department: 'tech',
      sensitivityScore: 45,
      findings: [
        {
          type: 'policy',
          description: 'Sensitive compliance policy content',
          page: 5,
          paragraph: 2
        }
      ]
    }
  ];

  selectedDocument: Document | null = null;
  previewDocuments: Document | null = null;
  showUploadDialog = false;
  
  // Filter state
  searchTerm: string = '';
  statusFilter: string = '';
  timeFilter: string = '';
  filteredDocuments: Document[] = [];

  constructor(private apiService: ApiService) {
    this.filterDocuments();
  }

  ngOnInit() {
    this.loadDocuments();
  }

  loadDocuments() {
    this.apiService.getDocuments().subscribe({
      next: (documents) => {
        this.documents = documents;
        this.filterDocuments();
      },
      error: (error) => {
        console.error('Error loading documents:', error);
        // Fallback to mock data if API fails
        this.filterDocuments();
      }
    });
  }

  handleUpload(event: {files: File[], metadata: DocumentMetadata}) {
    for (const file of event.files) {
      this.uploadSingleFile(file, event.metadata);
    }
    this.showUploadDialog = false;
  }

  private uploadSingleFile(file: File, metadata: DocumentMetadata) {
    // Tạo document tạm thời để hiển thị trong UI
    const tempDoc: Document = {
      id: 'temp-' + Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      uploadTime: new Date(),
      status: 'analyzing',
      type: metadata.type,
      securityLevel: metadata.securityLevel,
      department: metadata.department,
      notes: metadata.notes
    };

    // Thêm vào danh sách để hiển thị ngay
    this.documents.unshift(tempDoc);
    this.filterDocuments();

    // Gọi API upload
    this.apiService.uploadDocument(file, metadata).subscribe({
      next: (response) => {
        // Cập nhật document với thông tin từ server
        const index = this.documents.findIndex(doc => doc.id === tempDoc.id);
        if (index !== -1) {
          this.documents[index] = {
            ...response,
            uploadTime: new Date(response.uploadTime)
          };
          this.filterDocuments();
          
          // Bắt đầu polling để kiểm tra kết quả phân tích
          this.pollAnalysisResult(response.id);
        }
      },
      error: (error) => {
        console.error('Upload failed:', error);
        // Cập nhật trạng thái lỗi
        const index = this.documents.findIndex(doc => doc.id === tempDoc.id);
        if (index !== -1) {
          this.documents[index].status = 'error';
          this.filterDocuments();
        }
      }
    });
  }

  private pollAnalysisResult(documentId: string) {
    const pollInterval = setInterval(() => {
      this.apiService.getDocumentAnalysis(documentId).subscribe({
        next: (analysis) => {
          const index = this.documents.findIndex(doc => doc.id === documentId);
          if (index !== -1) {
            this.documents[index].status = 'completed';
            this.documents[index].sensitivityScore = analysis.sensitivityScore;
            this.documents[index].findings = analysis.findings;
            this.filterDocuments();
            clearInterval(pollInterval);
          }
        },
        error: (error) => {
          // Nếu phân tích chưa xong, tiếp tục polling
          if (error.status !== 404) {
            console.error('Error getting analysis:', error);
            clearInterval(pollInterval);
            const index = this.documents.findIndex(doc => doc.id === documentId);
            if (index !== -1) {
              this.documents[index].status = 'error';
              this.filterDocuments();
            }
          }
        }
      });
    }, 3000); // Poll mỗi 3 giây

    // Dừng polling sau 5 phút
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 300000);
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

  previewDocument(doc: Document) {
    this.previewDocuments = doc;
  }

  deleteDocument(doc: Document) {
    if (confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) {
      // Nếu là document tạm thời, chỉ xóa khỏi UI
      if (doc.id.startsWith('temp-')) {
        const index = this.documents.findIndex(d => d.id === doc.id);
        if (index !== -1) {
          this.documents.splice(index, 1);
          if (this.selectedDocument?.id === doc.id) {
            this.selectedDocument = null;
          }
          this.filterDocuments();
        }
        return;
      }

      // Gọi API xóa
      this.apiService.deleteDocument(doc.id).subscribe({
        next: () => {
          const index = this.documents.findIndex(d => d.id === doc.id);
          if (index !== -1) {
            this.documents.splice(index, 1);
            if (this.selectedDocument?.id === doc.id) {
              this.selectedDocument = null;
            }
            this.filterDocuments();
          }
        },
        error: (error) => {
          console.error('Error deleting document:', error);
          alert('Có lỗi xảy ra khi xóa tài liệu. Vui lòng thử lại.');
        }
      });
    }
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
}