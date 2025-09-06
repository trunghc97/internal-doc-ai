import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'error';
type BadgeType = 'solid' | 'soft' | 'outline';
type BadgeSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-badge',
  template: `
    <div [ngClass]="badgeClasses" [class]="className">
      <ng-content></ng-content>
    </div>
  `,
  styles: [],
  standalone: true,
  imports: [CommonModule]
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'default';
  @Input() type: BadgeType = 'solid';
  @Input() size: BadgeSize = 'md';
  @Input() className = '';

  get badgeClasses(): string {
    const baseClasses = 'inline-flex items-center rounded-md border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-sm',
      lg: 'px-3 py-1 text-base'
    };

    const solidVariantClasses = {
      default: 'border-transparent bg-gray-500 text-white shadow hover:bg-gray-600 focus:ring-gray-500',
      primary: 'border-transparent bg-blue-500 text-white shadow hover:bg-blue-600 focus:ring-blue-500',
      secondary: 'border-transparent bg-purple-500 text-white shadow hover:bg-purple-600 focus:ring-purple-500',
      success: 'border-transparent bg-green-500 text-white shadow hover:bg-green-600 focus:ring-green-500',
      warning: 'border-transparent bg-yellow-500 text-white shadow hover:bg-yellow-600 focus:ring-yellow-500',
      danger: 'border-transparent bg-red-500 text-white shadow hover:bg-red-600 focus:ring-red-500',
      error: 'border-transparent bg-red-500 text-white shadow hover:bg-red-600 focus:ring-red-500',
      info: 'border-transparent bg-cyan-500 text-white shadow hover:bg-cyan-600 focus:ring-cyan-500'
    };

    const softVariantClasses = {
      default: 'border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-500',
      primary: 'border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200 focus:ring-blue-500',
      secondary: 'border-transparent bg-purple-100 text-purple-800 hover:bg-purple-200 focus:ring-purple-500',
      success: 'border-transparent bg-green-100 text-green-800 hover:bg-green-200 focus:ring-green-500',
      warning: 'border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200 focus:ring-yellow-500',
      danger: 'border-transparent bg-red-100 text-red-800 hover:bg-red-200 focus:ring-red-500',
      error: 'border-transparent bg-red-100 text-red-800 hover:bg-red-200 focus:ring-red-500',
      info: 'border-transparent bg-cyan-100 text-cyan-800 hover:bg-cyan-200 focus:ring-cyan-500'
    };

    const outlineVariantClasses = {
      default: 'border-gray-500 text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
      primary: 'border-blue-500 text-blue-700 hover:bg-blue-100 focus:ring-blue-500',
      secondary: 'border-purple-500 text-purple-700 hover:bg-purple-100 focus:ring-purple-500',
      success: 'border-green-500 text-green-700 hover:bg-green-100 focus:ring-green-500',
      warning: 'border-yellow-500 text-yellow-700 hover:bg-yellow-100 focus:ring-yellow-500',
      danger: 'border-red-500 text-red-700 hover:bg-red-100 focus:ring-red-500',
      error: 'border-red-500 text-red-700 hover:bg-red-100 focus:ring-red-500',
      info: 'border-cyan-500 text-cyan-700 hover:bg-cyan-100 focus:ring-cyan-500'
    };

    const variantClasses = {
      solid: solidVariantClasses,
      soft: softVariantClasses,
      outline: outlineVariantClasses
    };

    return `${baseClasses} ${sizeClasses[this.size]} ${variantClasses[this.type][this.variant]}`;
  }
}