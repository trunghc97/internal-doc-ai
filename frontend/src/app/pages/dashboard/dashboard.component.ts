import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';
import { ApiService, DocumentMetadata, ShareRequest, PaginatedResponse } from '../../services/api.service';
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
  DocumentPreviewDialogComponent,
  ShareDialogComponent
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
    DocumentPreviewDialogComponent,
    ShareDialogComponent
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
  shareDocument: Document | null = null;
  showUploadDialog = false;
  
  // Filter state
  searchTerm: string = '';
  statusFilter: string = '';
  timeFilter: string = '';
  filteredDocuments: Document[] = [];
  
  // Pagination state
  currentPage: number = 0;
  pageSize: number = 20;
  totalElements: number = 0;
  totalPages: number = 0;
  
  // Tab state
  activeTab: 'documents' | 'users' = 'documents';
  
  // User management state
  users: any[] = [];
  filteredUsers: any[] = [];
  userSearchTerm: string = '';
  userCurrentPage: number = 0;
  userPageSize: number = 20;
  userTotalElements: number = 0;
  userTotalPages: number = 0;

  constructor(private apiService: ApiService) {
    this.filterDocuments();
  }

  ngOnInit() {
    this.loadDocuments();
    this.loadUsers();
  }

  loadDocuments(page: number = 0) {
    this.currentPage = page;
    this.apiService.getDocuments(page, this.pageSize).subscribe({
      next: (response: PaginatedResponse<any> | any[]) => {
        // Check if response is paginated
        if (Array.isArray(response)) {
          // If API returns array directly (backward compatibility)
          this.documents = response;
          this.totalElements = response.length;
          this.totalPages = Math.ceil(response.length / this.pageSize);
        } else {
          // Paginated response
          this.documents = response.content || [];
          this.totalElements = response.totalElements || 0;
          this.totalPages = response.totalPages || 0;
          this.currentPage = response.number || 0;
        }
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

  openShareDialog(doc: Document) {
    this.shareDocument = doc;
  }

  onShareDocument(shareRequest: ShareRequest) {
    console.log('Sharing document:', shareRequest);
    
    // Call API to share document
    this.apiService.shareDocument(shareRequest).subscribe({
      next: (response) => {
        console.log('Document shared successfully:', response);
        alert(`Tài liệu đã được chia sẻ thành công với ${response.sharedWith.length} người dùng!`);
        this.shareDocument = null;
      },
      error: (error) => {
        console.error('Error sharing document:', error);
        alert('Có lỗi xảy ra khi chia sẻ tài liệu. Vui lòng thử lại.');
      }
    });
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

  // Pagination methods
  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.loadDocuments(page);
    }
  }

  goToFirstPage() {
    this.goToPage(0);
  }

  goToPreviousPage() {
    this.goToPage(this.currentPage - 1);
  }

  goToNextPage() {
    this.goToPage(this.currentPage + 1);
  }

  goToLastPage() {
    this.goToPage(this.totalPages - 1);
  }

  changePageSize(newSize: number) {
    this.pageSize = newSize;
    this.loadDocuments(0); // Reset to first page
  }

  get startIndex(): number {
    return this.currentPage * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(0, this.currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(this.totalPages - 1, startPage + maxVisiblePages - 1);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Tab management methods
  switchTab(tab: 'documents' | 'users') {
    this.activeTab = tab;
    if (tab === 'users' && this.users.length === 0) {
      this.loadUsers();
    }
  }

  // User management methods
  loadUsers(page: number = 0) {
    this.userCurrentPage = page;
    this.apiService.getUsers().subscribe({
      next: (response: any) => {
        // Handle both paginated and array responses
        if (Array.isArray(response)) {
          this.users = response;
          this.userTotalElements = response.length;
          this.userTotalPages = Math.ceil(response.length / this.userPageSize);
        } else if (response.content) {
          this.users = response.content;
          this.userTotalElements = response.totalElements || 0;
          this.userTotalPages = response.totalPages || 0;
          this.userCurrentPage = response.number || 0;
        }
        this.filterUsers();
      },
      error: (error) => {
        console.error('Error loading users:', error);
        // Fallback to mock data
        this.users = [
          {
            id: '1',
            name: 'Nguyễn Văn An',
            email: 'an.nguyen@company.com',
            department: 'Phòng IT',
            role: 'Developer',
            status: 'active',
            lastLogin: new Date('2024-01-15T10:30:00'),
            createdAt: new Date('2023-06-01T09:00:00')
          },
          {
            id: '2',
            name: 'Trần Thị Bình',
            email: 'binh.tran@company.com',
            department: 'Phòng Nhân sự',
            role: 'HR Manager',
            status: 'active',
            lastLogin: new Date('2024-01-14T16:45:00'),
            createdAt: new Date('2023-05-15T14:20:00')
          },
          {
            id: '3',
            name: 'Lê Văn Cường',
            email: 'cuong.le@company.com',
            department: 'Phòng Kế toán',
            role: 'Accountant',
            status: 'inactive',
            lastLogin: new Date('2024-01-10T11:15:00'),
            createdAt: new Date('2023-07-20T08:30:00')
          },
          {
            id: '4',
            name: 'Phạm Thị Dung',
            email: 'dung.pham@company.com',
            department: 'Phòng Marketing',
            role: 'Marketing Specialist',
            status: 'active',
            lastLogin: new Date('2024-01-15T09:20:00'),
            createdAt: new Date('2023-08-10T13:45:00')
          },
          {
            id: '5',
            name: 'Hoàng Văn Em',
            email: 'em.hoang@company.com',
            department: 'Phòng IT',
            role: 'System Admin',
            status: 'active',
            lastLogin: new Date('2024-01-15T12:00:00'),
            createdAt: new Date('2023-04-25T10:15:00')
          }
        ];
        this.userTotalElements = this.users.length;
        this.userTotalPages = Math.ceil(this.users.length / this.userPageSize);
        this.filterUsers();
      }
    });
  }

  filterUsers() {
    let filtered = [...this.users];
    
    if (this.userSearchTerm.trim()) {
      const term = this.userSearchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.department.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term)
      );
    }
    
    this.filteredUsers = filtered;
  }

  // User pagination methods
  goToUserPage(page: number) {
    if (page >= 0 && page < this.userTotalPages) {
      this.loadUsers(page);
    }
  }

  goToFirstUserPage() {
    this.goToUserPage(0);
  }

  goToPreviousUserPage() {
    this.goToUserPage(this.userCurrentPage - 1);
  }

  goToNextUserPage() {
    this.goToUserPage(this.userCurrentPage + 1);
  }

  goToLastUserPage() {
    this.goToUserPage(this.userTotalPages - 1);
  }

  changeUserPageSize(newSize: number) {
    this.userPageSize = newSize;
    this.loadUsers(0);
  }

  get userStartIndex(): number {
    return this.userCurrentPage * this.userPageSize + 1;
  }

  get userEndIndex(): number {
    return Math.min((this.userCurrentPage + 1) * this.userPageSize, this.userTotalElements);
  }

  get userPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(0, this.userCurrentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(this.userTotalPages - 1, startPage + maxVisiblePages - 1);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  // User management actions
  editUser(user: any) {
    console.log('Edit user:', user);
    // TODO: Implement edit user dialog
  }

  toggleUserStatus(user: any) {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    
    this.apiService.toggleUserStatus(user.id, newStatus).subscribe({
      next: (response) => {
        user.status = newStatus;
        console.log(`User ${user.name} status updated to ${newStatus}`);
        alert(`Trạng thái người dùng "${user.name}" đã được cập nhật thành ${newStatus === 'active' ? 'hoạt động' : 'không hoạt động'}!`);
      },
      error: (error) => {
        console.error('Error updating user status:', error);
        alert('Có lỗi xảy ra khi cập nhật trạng thái người dùng. Vui lòng thử lại.');
      }
    });
  }

  deleteUser(user: any) {
    if (confirm(`Bạn có chắc chắn muốn xóa người dùng "${user.name}"?`)) {
      this.apiService.deleteUser(user.id).subscribe({
        next: (response) => {
          const index = this.users.findIndex(u => u.id === user.id);
          if (index > -1) {
            this.users.splice(index, 1);
            this.filterUsers();
          }
          console.log('User deleted successfully:', response);
          alert(`Người dùng "${user.name}" đã được xóa thành công!`);
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          alert('Có lỗi xảy ra khi xóa người dùng. Vui lòng thử lại.');
        }
      });
    }
  }

  resetUserPassword(user: any) {
    if (confirm(`Bạn có chắc chắn muốn reset mật khẩu cho "${user.name}"?`)) {
      this.apiService.resetUserPassword(user.id).subscribe({
        next: (response) => {
          console.log('Password reset successfully:', response);
          alert(`Mật khẩu mới đã được gửi qua email cho "${user.name}"!`);
        },
        error: (error) => {
          console.error('Error resetting password:', error);
          alert('Có lỗi xảy ra khi reset mật khẩu. Vui lòng thử lại.');
        }
      });
    }
  }

  // Phương thức đếm số lượng tài liệu theo trạng thái
  getDocumentCountByStatus(status: string): number {
    return this.documents.filter(doc => doc.status === status).length;
  }

  // Phương thức đếm số lượng người dùng theo trạng thái
  getUserCountByStatus(status: string): number {
    return this.users.filter(user => user.status === status).length;
  }

  // Phương thức đếm tổng số người dùng
  getTotalUsersCount(): number {
    return this.users.length;
  }

  // Phương thức đếm số phòng ban
  getDepartmentCount(): number {
    return [...new Set(this.users.map(user => user.department))].length;
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