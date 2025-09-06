import { Component, OnInit } from '@angular/core';
import { Transaction } from '../../services/points.service';

interface TransactionWithDetails extends Transaction {
  formattedAmount: string;
  formattedDate: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent implements OnInit {
  transactions: TransactionWithDetails[] = [];
  isLoading = false;
  filter = 'all'; // all, earn, spend, transfer

  constructor() {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.isLoading = true;

    // Mock data - thay bằng service call thực tế
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        type: 'EARN',
        amount: 100,
        description: 'Tích điểm mua hàng',
        timestamp: new Date().toISOString(),
        status: 'success'
      },
      {
        id: '2',
        type: 'TRANSFER',
        amount: 50,
        description: 'Chuyển điểm cho user123',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        status: 'success'
      },
      {
        id: '3',
        type: 'REDEEM',
        amount: 200,
        description: 'Đổi voucher giảm giá',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        status: 'success'
      }
    ];

    this.transactions = mockTransactions.map(tx => ({
      ...tx,
      formattedAmount: this.formatAmount(tx.amount, tx.type),
      formattedDate: this.formatDate(tx.timestamp),
      icon: this.getTransactionIcon(tx.type),
      color: this.getTransactionColor(tx.type)
    }));

    this.isLoading = false;
  }

  setFilter(filter: string): void {
    this.filter = filter;
    this.loadTransactions();
  }

  private formatAmount(amount: number, type: string): string {
    const prefix = type === 'EARN' ? '+' : type === 'REDEEM' ? '-' : '';
    return `${prefix}${amount.toLocaleString('vi-VN')}`;
  }

  private formatDate(timestamp: string): string {
    return new Date(timestamp).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private getTransactionIcon(type: string): string {
    switch (type) {
      case 'EARN': return 'plus-circle';
      case 'REDEEM': return 'minus-circle';
      case 'TRANSFER': return 'arrow-right-circle';
      default: return 'circle';
    }
  }

  private getTransactionColor(type: string): string {
    switch (type) {
      case 'EARN': return 'text-green-600';
      case 'REDEEM': return 'text-red-600';
      case 'TRANSFER': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  }

  get filteredTransactions(): TransactionWithDetails[] {
    if (this.filter === 'all') return this.transactions;
    return this.transactions.filter(tx =>
      tx.type.toLowerCase() === this.filter.toLowerCase()
    );
  }
}
