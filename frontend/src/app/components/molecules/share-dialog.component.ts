import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { 
  ButtonComponent, 
  CardComponent, 
  CardHeaderComponent, 
  CardTitleComponent, 
  CardDescriptionComponent, 
  CardContentComponent,
  BadgeComponent
} from '../atoms';
import { FormFieldComponent } from './form-field.component';
import { ApiService } from '../../services/api.service';

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  avatar?: string;
  role: string;
}

export interface ShareRequest {
  documentId: string;
  userIds: string[];
  permissions: 'view' | 'edit';
  message?: string;
}

@Component({
  selector: 'app-share-dialog',
  template: `
    <!-- Dialog Backdrop -->
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <!-- Dialog Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 class="text-xl font-semibold text-gray-900">Chia sẻ tài liệu</h2>
            <p class="text-sm text-gray-500 mt-1">{{document?.name}}</p>
          </div>
          <button
            (click)="onClose()"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Dialog Content -->
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <!-- Search Users -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm người dùng
            </label>
            <div class="relative">
              <input
                type="text"
                [(ngModel)]="searchTerm"
                (input)="onSearchUsers()"
                placeholder="Nhập tên hoặc email..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
              >
              <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <!-- Selected Users -->
          <div *ngIf="selectedUsers.length > 0" class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Người được chia sẻ ({{selectedUsers.length}})
            </label>
            <div class="flex flex-wrap gap-2">
              <div 
                *ngFor="let user of selectedUsers" 
                class="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
              >
                <div class="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-2 text-xs font-medium">
                  {{user.name.charAt(0).toUpperCase()}}
                </div>
                {{user.name}}
                <button
                  (click)="removeUser(user)"
                  class="ml-2 text-blue-500 hover:text-blue-700"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Users List -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Danh sách người dùng
            </label>
            
            <!-- Loading -->
            <div *ngIf="isLoading" class="text-center py-8">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p class="mt-2 text-sm text-gray-500">Đang tải danh sách người dùng...</p>
            </div>

            <!-- Users List -->
            <div *ngIf="!isLoading" class="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
              <div 
                *ngFor="let user of filteredUsers" 
                class="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                (click)="toggleUser(user)"
              >
                <div class="flex items-center">
                  <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                    <span class="text-sm font-medium text-gray-600">
                      {{user.name.charAt(0).toUpperCase()}}
                    </span>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{user.name}}</p>
                    <p class="text-xs text-gray-500">{{user.email}}</p>
                    <div class="flex items-center mt-1">
                      <app-badge
                        [variant]="'info'"
                        [type]="'soft'"
                        [size]="'sm'"
                      >
                        {{user.department}}
                      </app-badge>
                      <app-badge
                        [variant]="'secondary'"
                        [type]="'soft'"
                        [size]="'sm'"
                        class="ml-2"
                      >
                        {{user.role}}
                      </app-badge>
                    </div>
                  </div>
                </div>
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    [checked]="isUserSelected(user)"
                    (click)="$event.stopPropagation()"
                    (change)="toggleUser(user)"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  >
                </div>
              </div>
              
              <!-- No users found -->
              <div *ngIf="filteredUsers.length === 0" class="text-center py-8 text-gray-500">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <p class="mt-2 text-sm">Không tìm thấy người dùng nào</p>
              </div>
            </div>
          </div>

          <!-- Permissions -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Quyền truy cập
            </label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  type="radio"
                  [(ngModel)]="permissions"
                  value="view"
                  name="permissions"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                >
                <span class="ml-2 text-sm text-gray-700">Chỉ xem - Người dùng chỉ có thể xem tài liệu</span>
              </label>
              <label class="flex items-center">
                <input
                  type="radio"
                  [(ngModel)]="permissions"
                  value="edit"
                  name="permissions"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                >
                <span class="ml-2 text-sm text-gray-700">Chỉnh sửa - Người dùng có thể xem và chỉnh sửa tài liệu</span>
              </label>
            </div>
          </div>

          <!-- Message -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Tin nhắn (tùy chọn)
            </label>
            <textarea
              [(ngModel)]="message"
              placeholder="Thêm tin nhắn cho người nhận..."
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            ></textarea>
          </div>
        </div>

        <!-- Dialog Footer -->
        <div class="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <app-button
            [variant]="'secondary'"
            (click)="onClose()"
          >
            Hủy
          </app-button>
          <app-button
            [variant]="'primary'"
            (click)="onShare()"
            [disabled]="selectedUsers.length === 0 || isSharing"
          >
            <svg *ngIf="isSharing" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{isSharing ? 'Đang chia sẻ...' : 'Chia sẻ (' + selectedUsers.length + ')'}}
          </app-button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-backdrop {
      backdrop-filter: blur(4px);
    }
  `],
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
    FormFieldComponent
  ]
})
export class ShareDialogComponent implements OnInit {
  @Input() document: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() share = new EventEmitter<ShareRequest>();

  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUsers: User[] = [];
  searchTerm = '';
  permissions: 'view' | 'edit' = 'view';
  message = '';
  isLoading = false;
  isSharing = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    
    // Try to load users from API, fallback to mock data if fails
    this.apiService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = [...this.users];
        this.isLoading = false;
      },
      error: (error) => {
        console.warn('Failed to load users from API, using mock data:', error);
        // Fallback to mock data
        this.users = [
          {
            id: '1',
            name: 'Nguyễn Văn An',
            email: 'an.nguyen@company.com',
            department: 'Phòng IT',
            role: 'Developer'
          },
          {
            id: '2',
            name: 'Trần Thị Bình',
            email: 'binh.tran@company.com',
            department: 'Phòng Nhân sự',
            role: 'HR Manager'
          },
          {
            id: '3',
            name: 'Lê Văn Cường',
            email: 'cuong.le@company.com',
            department: 'Phòng Kế toán',
            role: 'Accountant'
          },
          {
            id: '4',
            name: 'Phạm Thị Dung',
            email: 'dung.pham@company.com',
            department: 'Phòng Marketing',
            role: 'Marketing Specialist'
          },
          {
            id: '5',
            name: 'Hoàng Văn Em',
            email: 'em.hoang@company.com',
            department: 'Phòng IT',
            role: 'System Admin'
          },
          {
            id: '6',
            name: 'Vũ Thị Phương',
            email: 'phuong.vu@company.com',
            department: 'Phòng Kinh doanh',
            role: 'Sales Manager'
          }
        ];
        this.filteredUsers = [...this.users];
        this.isLoading = false;
      }
    });
  }

  onSearchUsers() {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.users];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(user => 
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.department.toLowerCase().includes(term)
    );
  }

  toggleUser(user: User) {
    const index = this.selectedUsers.findIndex(u => u.id === user.id);
    if (index > -1) {
      this.selectedUsers.splice(index, 1);
    } else {
      this.selectedUsers.push(user);
    }
  }

  isUserSelected(user: User): boolean {
    return this.selectedUsers.some(u => u.id === user.id);
  }

  removeUser(user: User) {
    const index = this.selectedUsers.findIndex(u => u.id === user.id);
    if (index > -1) {
      this.selectedUsers.splice(index, 1);
    }
  }

  onShare() {
    if (this.selectedUsers.length === 0) return;

    this.isSharing = true;
    
    const shareRequest: ShareRequest = {
      documentId: this.document.id,
      userIds: this.selectedUsers.map(u => u.id),
      permissions: this.permissions,
      message: this.message.trim() || undefined
    };

    // Emit the share request to parent component
    this.share.emit(shareRequest);
    this.isSharing = false;
  }

  onClose() {
    this.close.emit();
  }
}
