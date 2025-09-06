import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  template: `
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center space-x-4">
            <div class="flex-shrink-0">
              <h1 class="text-xl font-bold text-gray-900">Loyalty System</h1>
            </div>
            <div class="hidden md:flex space-x-4">
              <a routerLink="/dashboard" routerLinkActive="text-blue-600" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </a>
              <a routerLink="/transactions" routerLinkActive="text-blue-600" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Giao dịch
              </a>
            </div>
          </div>

          <div class="flex items-center space-x-4" *ngIf="authService.user$ | async as user">
            <div class="flex items-center space-x-3">
              <div class="text-sm">
                <p class="text-gray-700 font-medium">{{ user.username }}</p>
                <p class="text-gray-500 text-xs">{{ user.email }}</p>
              </div>
              <div class="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span class="text-white text-sm font-medium">
                  {{ user.username.charAt(0).toUpperCase() }}
                </span>
              </div>
            </div>

            <app-button
              variant="ghost"
              size="sm"
              (click)="logout()"
              className="text-gray-600 hover:text-gray-900"
            >
              <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Đăng xuất
            </app-button>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: []
})
export class NavbarComponent {
  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  logout(): void {
    this.authService.logout();
  }
}
