import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ButtonComponent, CardComponent, CardContentComponent, CardHeaderComponent, CardTitleComponent } from '../atoms';

@Component({
  selector: 'app-points-card',
  template: `
    <app-card>
      <app-card-header className="flex flex-row items-center space-x-4 pb-2">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
          <svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
          </svg>
        </div>
        <div>
          <app-card-title className="text-base font-semibold">Điểm tích lũy</app-card-title>
          <p class="mt-1 text-2xl font-bold text-blue-600">
            {{ points | number:'1.0-0':'vi-VN' }}
          </p>
        </div>
      </app-card-header>
      <app-card-content>
        <div class="flex gap-2">
          <app-button
            (click)="onEarn.emit()"
            className="flex-1"
            variant="secondary"
          >
            Tích điểm
          </app-button>
          <app-button
            (click)="onTransfer.emit()"
            className="flex-1"
            variant="outline"
          >
            Chuyển điểm
          </app-button>
        </div>
      </app-card-content>
    </app-card>
  `,
  styles: [],
  standalone:true,
  imports: [
        CommonModule,
        CardContentComponent,
        CardComponent,
        CardHeaderComponent,
        CardTitleComponent,
        ButtonComponent
      ],
})
export class PointsCardComponent {
  @Input() points : number | null = 0;

  @Output() onEarn = new EventEmitter<void>();
  @Output() onTransfer = new EventEmitter<void>();
}
