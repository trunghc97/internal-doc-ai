import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { PointsService } from '../../services/points.service';

interface Voucher {
  id: string;
  title: string;
  description: string;
  points: number;
  expiryDate: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  points$ = this.pointsService.pointsData$.pipe(
    map(data => data.balance)
  );

  transactions$ = this.pointsService.pointsData$.pipe(
    map(data => data.transactions.slice(0, 5))
  );

  isLoading$ = this.pointsService.isLoading$;

  vouchers: Voucher[] = [
    {
      id: '1',
      title: 'Giảm 50k',
      description: 'Áp dụng cho đơn hàng từ 500k',
      points: 1000,
      expiryDate: '2024-12-31',
    },
    {
      id: '2',
      title: 'Freeship',
      description: 'Miễn phí vận chuyển toàn quốc',
      points: 500,
      expiryDate: '2024-12-31',
    },
  ];

  constructor(
    private router: Router,
    private pointsService: PointsService
  ) {}

  onEarn(): void {
    this.router.navigate(['/earn']);
  }

  onTransfer(): void {
    this.router.navigate(['/transfer']);
  }

  onRedeem(voucherId: string): void {
    this.router.navigate(['/voucher', voucherId]);
  }
}
