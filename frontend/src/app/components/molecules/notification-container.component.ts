import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../services/notification.service';
import { ButtonComponent } from '../atoms';

@Component({
  selector: 'app-notification-container',
  template: `
    <!-- Notification Container -->
    <div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <div
        *ngFor="let notification of notifications"
        [class]="getNotificationClasses(notification)"
        class="p-4 rounded-lg shadow-lg border transform transition-all duration-300 ease-in-out"
        [attr.data-notification-id]="notification.id"
      >
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div class="flex items-start">
            <!-- Icon -->
            <div class="flex-shrink-0 mr-3">
              <!-- Success Icon -->
              <svg
                *ngIf="notification.type === 'success'"
                class="h-5 w-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>

              <!-- Error Icon -->
              <svg
                *ngIf="notification.type === 'error'"
                class="h-5 w-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>

              <!-- Warning Icon -->
              <svg
                *ngIf="notification.type === 'warning'"
                class="h-5 w-5 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>

              <!-- Info Icon -->
              <svg
                *ngIf="notification.type === 'info'"
                class="h-5 w-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium" [class]="getTitleClasses(notification)">
                {{notification.title}}
              </p>
              <p
                *ngIf="notification.message"
                class="mt-1 text-sm"
                [class]="getMessageClasses(notification)"
              >
                {{notification.message}}
              </p>
            </div>
          </div>

          <!-- Dismiss Button -->
          <button
            *ngIf="notification.dismissible"
            (click)="dismiss(notification.id)"
            class="ml-2 flex-shrink-0 rounded-md p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <svg class="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Progress Bar (for auto-dismiss) -->
        <div
          *ngIf="notification.duration && notification.duration > 0"
          class="mt-3 w-full bg-gray-200 rounded-full h-1"
        >
          <div
            class="h-1 rounded-full transition-all ease-linear"
            [class]="getProgressBarClasses(notification)"
            [style.animation]="'shrink ' + notification.duration + 'ms linear'"
          ></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes shrink {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }

    .notification-enter {
      opacity: 0;
      transform: translateX(100%);
    }

    .notification-enter-active {
      opacity: 1;
      transform: translateX(0);
      transition: all 300ms ease-in-out;
    }

    .notification-leave-active {
      opacity: 0;
      transform: translateX(100%);
      transition: all 300ms ease-in-out;
    }
  `],
  standalone: true,
  imports: [CommonModule, ButtonComponent]
})
export class NotificationContainerComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private subscription?: Subscription;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.subscription = this.notificationService.getNotifications().subscribe(
      notifications => {
        this.notifications = notifications;
      }
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  dismiss(id: string) {
    this.notificationService.dismiss(id);
  }

  getNotificationClasses(notification: Notification): string {
    const baseClasses = 'bg-white border-l-4';
    
    switch (notification.type) {
      case 'success':
        return `${baseClasses} border-green-400 bg-green-50`;
      case 'error':
        return `${baseClasses} border-red-400 bg-red-50`;
      case 'warning':
        return `${baseClasses} border-yellow-400 bg-yellow-50`;
      case 'info':
        return `${baseClasses} border-blue-400 bg-blue-50`;
      default:
        return `${baseClasses} border-gray-400 bg-gray-50`;
    }
  }

  getTitleClasses(notification: Notification): string {
    switch (notification.type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  }

  getMessageClasses(notification: Notification): string {
    switch (notification.type) {
      case 'success':
        return 'text-green-700';
      case 'error':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      case 'info':
        return 'text-blue-700';
      default:
        return 'text-gray-700';
    }
  }

  getProgressBarClasses(notification: Notification): string {
    switch (notification.type) {
      case 'success':
        return 'bg-green-400';
      case 'error':
        return 'bg-red-400';
      case 'warning':
        return 'bg-yellow-400';
      case 'info':
        return 'bg-blue-400';
      default:
        return 'bg-gray-400';
    }
  }
}
