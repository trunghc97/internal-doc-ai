import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-badge',
  template: `
    <div [ngClass]="badgeClasses" [class]="className">
      <ng-content></ng-content>
    </div>
  `,
  styles: [],
  standalone:true,
  imports: [
        CommonModule
        
      ],
})
export class BadgeComponent {
  @Input() variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' = 'default';
  @Input() className = '';

  get badgeClasses(): string {
    const baseClasses = 'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';

    const variantClasses = {
      default: 'border-transparent bg-blue-500 text-white shadow hover:bg-blue-600',
      secondary: 'border-transparent bg-blue-100 text-blue-600 hover:bg-blue-200',
      destructive: 'border-transparent bg-red-500 text-white shadow hover:bg-red-600',
      outline: 'text-blue-600 border-blue-200 hover:bg-blue-100',
      success: 'border-transparent bg-green-500 text-white shadow hover:bg-green-600',
      warning: 'border-transparent bg-yellow-500 text-white shadow hover:bg-yellow-600'
    };

    return `${baseClasses} ${variantClasses[this.variant]}`;
  }
}
