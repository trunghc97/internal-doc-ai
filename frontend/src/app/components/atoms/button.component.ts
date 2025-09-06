import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-button',
  template: `
    <button
      [ngClass]="buttonClasses"
      [disabled]="isLoading || disabled"
      [type]="type"
      (click)="onClick($event)"
    >
      <svg
        *ngIf="isLoading"
        class="mr-2 h-4 w-4 animate-spin"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `],
  standalone: true,
  imports: [
      CommonModule
      
    ],
})
export class ButtonComponent {
  @Input() variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' = 'default';
  @Input() size: 'default' | 'sm' | 'lg' | 'icon' = 'default';
  @Input() isLoading = false;
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() className = '';

  @Output() click = new EventEmitter<Event>();

  get buttonClasses(): string {
    const baseClasses = 'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50';

    const variantClasses = {
      default: 'bg-gray-600 text-white shadow hover:bg-gray-700',
      primary: 'bg-blue-600 text-white shadow hover:bg-blue-700',
      success: 'bg-green-600 text-white shadow hover:bg-green-700',
      warning: 'bg-yellow-600 text-white shadow hover:bg-yellow-700',
      danger: 'bg-red-600 text-white shadow hover:bg-red-700',
      info: 'bg-cyan-600 text-white shadow hover:bg-cyan-700',
      destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
      outline: 'border border-gray-300 bg-transparent shadow-sm hover:bg-gray-100 hover:text-gray-900',
      secondary: 'bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200',
      ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
      link: 'text-blue-600 underline-offset-4 hover:underline'
    };

    const sizeClasses = {
      default: 'h-9 px-4 py-2',
      sm: 'h-8 rounded-md px-3 text-xs',
      lg: 'h-10 rounded-md px-8',
      icon: 'h-9 w-9'
    };

    return `${baseClasses} ${variantClasses[this.variant]} ${sizeClasses[this.size]} ${this.className}`;
  }

  onClick(event: Event): void {
    if (!this.isLoading && !this.disabled) {
      this.click.emit(event);
    }
  }
}
