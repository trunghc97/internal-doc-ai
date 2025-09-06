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

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://192.168.100.133';
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
}
