import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map, tap, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface Transaction {
  id: string;
  type: 'EARN' | 'TRANSFER' | 'REDEEM' | 'RECEIVE';
  amount: number;
  description: string;
  timestamp: string;
  status: 'success' | 'pending' | 'failed';
}

export interface PointsData {
  balance: number;
  transactions: Transaction[];
}

@Injectable({
  providedIn: 'root'
})
export class PointsService {
  private pointsSubject = new BehaviorSubject<PointsData>({
    balance: 0,
    transactions: []
  });
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private earningSubject = new BehaviorSubject<boolean>(false);
  private transferringSubject = new BehaviorSubject<boolean>(false);

  public pointsData$ = this.pointsSubject.asObservable();
  public isLoading$ = this.loadingSubject.asObservable();
  public isEarning$ = this.earningSubject.asObservable();
  public isTransferring$ = this.transferringSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {
    // Load data when user is authenticated
    this.authService.user$.subscribe(user => {
      if (user) {
        this.loadPointsData();
      } else {
        this.clearData();
      }
    });
  }

  get points(): number {
    return this.pointsSubject.value.balance;
  }

  get transactions(): Transaction[] {
    return this.pointsSubject.value.transactions;
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  get isEarning(): boolean {
    return this.earningSubject.value;
  }

  get isTransferring(): boolean {
    return this.transferringSubject.value;
  }

  loadPointsData(): void {
    if (!this.authService.isAuthenticated) {
      return;
    }

    this.loadingSubject.next(true);

    combineLatest([
      this.apiService.getBalance(),
      this.apiService.getTransactionHistory()
    ]).pipe(
      map(([balanceResponse, historyResponse]) => {
        const balance = balanceResponse.balance || balanceResponse.data || 0;
        const transactions = (historyResponse.transactions || historyResponse.data || [])
          .map((tx: any) => ({
            id: tx.id,
            type: tx.type,
            amount: tx.amount,
            description: tx.description,
            timestamp: tx.timestamp,
            status: tx.status?.toLowerCase() || 'success'
          }));

        return { balance, transactions };
      }),
      catchError(error => {
        console.error('Failed to load points data:', error);
        return throwError(() => error);
      })
    ).subscribe({
      next: (data) => {
        this.pointsSubject.next(data);
        this.loadingSubject.next(false);
      },
      error: () => {
        this.loadingSubject.next(false);
      }
    });
  }

  async earnPoints(amount: number, description: string): Promise<Observable<any>> {
    this.earningSubject.next(true);

    try {
      const response = await this.apiService.earnPoints({ amount, description }).toPromise();
      this.loadPointsData(); // Refresh data
      return response;
    } catch (error) {
      console.error('Failed to earn points:', error);
      return throwError(() => error);
    } finally {
      this.earningSubject.next(false);
    }
  }

  async transferPoints(recipient: string, amount: number, description: string): Promise<Observable<any>> {
    this.transferringSubject.next(true);

    try {
      const response = await this.apiService.transferPoints(recipient, { amount, description }).toPromise();
      this.loadPointsData(); // Refresh data
      return response;
    } catch (error) {
      console.error('Failed to transfer points:', error);
      return throwError(() => error);
    } finally {
      this.transferringSubject.next(false);
    }
  }

  private clearData(): void {
    this.pointsSubject.next({ balance: 0, transactions: [] });
  }

  refreshData(): void {
    this.loadPointsData();
  }
}
