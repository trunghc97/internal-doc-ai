import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { EncryptionService } from './encryption.service';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface PointsTransaction {
  amount: number;
  description: string;
}

export interface TransferRequest extends PointsTransaction {
  recipient: string;
}

export interface DocumentMetadata {
  type: string;
  securityLevel: string;
  department: string;
  notes?: string;
}

export interface DocumentUploadResponse {
  id: string;
  name: string;
  size: number;
  uploadTime: Date;
  status: 'analyzing' | 'completed' | 'error';
  type: string;
  securityLevel: string;
  department: string;
  notes?: string;
}

export interface DocumentAnalysisResult {
  id: string;
  sensitivityScore: number;
  findings: Array<{
    type: string;
    description: string;
    page: number;
    paragraph: number;
  }>;
}

export interface ShareRequest {
  documentId: string;
  userIds: string[];
  permissions: 'view' | 'edit';
  message?: string;
}

export interface ShareResponse {
  success: boolean;
  message: string;
  sharedWith: Array<{
    userId: string;
    userName: string;
    email: string;
  }>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  avatar?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8080/api';
  private llmBaseUrl = 'http://192.168.0.63';

  constructor(
    private http: HttpClient,
    private router: Router,
    private encryptionService: EncryptionService
  ) {
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor logic will be handled by Angular HttpInterceptor
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    if (error.status === 401) {
      localStorage.removeItem('auth-storage');
      this.router.navigate(['/login']);
    }
    return throwError(() => error);
  }

  // Auth APIs
  getPublicKey(): Observable<any> {
    return this.http.get(`${this.baseUrl}/auth/public-key`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  async login(data: LoginRequest): Promise<any> {
    try {
      // New public key
      const publicKey = `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAjiqfibx5l9CEkFieveIF
        oZPvlIUZ4EpG/Qo2B+qKM4NMhPjT80i5hk3S6KUNgsZbS/+B5cT36ouy6EEKz2k5
        pbeyU0gg6CxuaylbE9y7TW/D86nn2DUkZeHuL+EF7Wq/yIuHtqoskcLTciZEK1H2
        BTSC+FklwZouJPA0D/OcAWL5A5W/HpAUGdmXIvpgWBjfTPowEqmc+dqa6PANZlx7
        T58V2qbUM3aaGZUQdWCOCLG00QRRTYJ1kirgAFlGKaeI4TNxETJCGVaOVSfUssma
        7YgfAaIANrqs0lEaXYAtgo6pN4lv2+HP+b40R2Sib6G3KKn2J/NjzXdvmnd/G5cp
        OwIDAQAB`;
      const encryptedPassword = await this.encryptionService.encrypt(publicKey, data.password);

      // Convert Observable to Promise
      return this.http.post(`${this.baseUrl}/auth/login`, {
        username: data.username,
        password: encryptedPassword
      }).pipe(catchError(this.handleError.bind(this))).toPromise();
    } catch (error) {
      throw error;
    }
  }

  async register(data: RegisterRequest): Promise<any> {
    try {
      // New public key
      const publicKey = `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAjiqfibx5l9CEkFieveIF
        oZPvlIUZ4EpG/Qo2B+qKM4NMhPjT80i5hk3S6KUNgsZbS/+B5cT36ouy6EEKz2k5
        pbeyU0gg6CxuaylbE9y7TW/D86nn2DUkZeHuL+EF7Wq/yIuHtqoskcLTciZEK1H2
        BTSC+FklwZouJPA0D/OcAWL5A5W/HpAUGdmXIvpgWBjfTPowEqmc+dqa6PANZlx7
        T58V2qbUM3aaGZUQdWCOCLG00QRRTYJ1kirgAFlGKaeI4TNxETJCGVaOVSfUssma
        7YgfAaIANrqs0lEaXYAtgo6pN4lv2+HP+b40R2Sib6G3KKn2J/NjzXdvmnd/G5cp
        OwIDAQAB`;
      console.log('Encrypting password...');
      const encryptedPassword = await this.encryptionService.encrypt(publicKey, data.password);
      console.log('Password encrypted successfully');

      console.log('Sending registration request...');
      return this.http.post(`${this.baseUrl}/auth/register`, {
        email: data.email,
        username: data.username,
        password: encryptedPassword
      }).pipe(catchError(this.handleError.bind(this))).toPromise();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Points APIs
  getBalance(): Observable<any> {
    return this.http.get(`${this.baseUrl}/points/balance`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  getTransactionHistory(): Observable<any> {
    return this.http.get(`${this.baseUrl}/points/history`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  earnPoints(data: PointsTransaction): Observable<any> {
    return this.http.post(`${this.baseUrl}/points/earn`, data)
      .pipe(catchError(this.handleError.bind(this)));
  }

  redeemPoints(data: PointsTransaction): Observable<any> {
    return this.http.post(`${this.baseUrl}/points/redeem`, data)
      .pipe(catchError(this.handleError.bind(this)));
  }

  transferPoints(recipient: string, data: PointsTransaction): Observable<any> {
    return this.http.post(`${this.baseUrl}/points/transfer/${recipient}`, data)
      .pipe(catchError(this.handleError.bind(this)));
  }

  tradePoints(data: { amount: number }): Observable<any> {
    return this.http.post(`${this.baseUrl}/points/trade`, data)
      .pipe(catchError(this.handleError.bind(this)));
  }

  payWithPoints(data: { amount: number }): Observable<any> {
    return this.http.post(`${this.baseUrl}/points/pay`, data)
      .pipe(catchError(this.handleError.bind(this)));
  }

  // LLM Chat APIs
  chat(messages: Array<{role: string, content: string}>): Observable<any> {
    return this.http.post(`${this.llmBaseUrl}/chat`, { messages })
      .pipe(catchError(this.handleError.bind(this)));
  }

  getLlmHealth(): Observable<any> {
    return this.http.get(`${this.llmBaseUrl}/health`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Document Management APIs
  uploadDocument(file: File, metadata: DocumentMetadata): Observable<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Tạo sensitiveInfo từ metadata và tên file
    let sensitiveInfo = `File: ${file.name}`;
    if (metadata.notes && metadata.notes.trim()) {
      sensitiveInfo += `; Notes: ${metadata.notes.trim()}`;
    }
    if (metadata.department) {
      sensitiveInfo += `; Department: ${metadata.department}`;
    }
    if (metadata.type) {
      sensitiveInfo += `; Type: ${metadata.type}`;
    }
    if (metadata.securityLevel) {
      sensitiveInfo += `; Security: ${metadata.securityLevel}`;
    }
    
    formData.append('sensitiveInfo', sensitiveInfo);
    console.log('Sending upload request with sensitiveInfo:', sensitiveInfo);

    return this.http.post<DocumentUploadResponse>(`${this.baseUrl}/documents`, formData)
      .pipe(catchError(this.handleError.bind(this)));
  }

  getDocuments(page: number = 0, size: number = 20): Observable<PaginatedResponse<any> | any[]> {
    return this.http.get<PaginatedResponse<any> | any[]>(`${this.baseUrl}/documents/with-permission?page=${page}&size=${size}`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  getDocumentById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/documents/${id}`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  getDocumentAnalysis(id: string): Observable<DocumentAnalysisResult> {
    return this.http.get<DocumentAnalysisResult>(`${this.baseUrl}/documents/${id}/analysis`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  deleteDocument(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/documents/${id}`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  downloadDocument(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/documents/${id}/download`, { responseType: 'blob' })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Share Document APIs
  shareDocument(shareRequest: ShareRequest): Observable<ShareResponse> {
    return this.http.post<ShareResponse>(`${this.baseUrl}/documents/share`, shareRequest)
      .pipe(catchError(this.handleError.bind(this)));
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  searchUsers(query: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users/search?q=${encodeURIComponent(query)}`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  getSharedDocuments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/documents/shared`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  getDocumentShares(documentId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/documents/${documentId}/shares`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  revokeDocumentShare(documentId: string, userId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/documents/${documentId}/shares/${userId}`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  // User Management APIs
  createUser(userData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/users`, userData)
      .pipe(catchError(this.handleError.bind(this)));
  }

  updateUser(userId: string, userData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/users/${userId}`, userData)
      .pipe(catchError(this.handleError.bind(this)));
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users/${userId}`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  toggleUserStatus(userId: string, status: 'active' | 'inactive'): Observable<any> {
    return this.http.patch(`${this.baseUrl}/users/${userId}/status`, { status })
      .pipe(catchError(this.handleError.bind(this)));
  }

  resetUserPassword(userId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/${userId}/reset-password`, {})
      .pipe(catchError(this.handleError.bind(this)));
  }

  getUserById(userId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/${userId}`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  getUsersByDepartment(department: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users?department=${encodeURIComponent(department)}`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  getUsersByRole(role: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users?role=${encodeURIComponent(role)}`)
      .pipe(catchError(this.handleError.bind(this)));
  }
}
