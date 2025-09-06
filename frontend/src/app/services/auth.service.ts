import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from './api.service';

export interface User {
  id: string;
  username: string;
  email: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public user$ = this.userSubject.asObservable();
  public isAuthenticated$ = this.userSubject.pipe(
    tap(user => !!user)
  );

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  get user(): User | null {
    return this.userSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.user;
  }

  async login(username: string, password: string): Promise<any> {
    try {
      const response = await this.apiService.login({ username, password });

      // Extract user data from response
      const userData = {
        id: response.id || response.user?.id || '',
        username: response.username || response.user?.username || username,
        email: response.email || response.user?.email || '',
        token: response.token || response.access_token || ''
      };

      this.setUser(userData);
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async register(email: string, username: string, password: string): Promise<any> {
    try {
      console.log('Starting registration process...');
      console.log('Data:', { email, username, password: '***' });

      const response = await this.apiService.register({ email, username, password });

      console.log('Registration successful:', response);

      // Extract user data from response
      const userData = {
        id: response.id || response.user?.id || '',
        username: response.username || response.user?.username || username,
        email: response.email || response.user?.email || email,
        token: response.token || response.access_token || ''
      };

      this.setUser(userData);
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  logout(): void {
    this.setUser(null);
    this.router.navigate(['/login']);
  }

  private setUser(user: User | null): void {
    this.userSubject.next(user);
    if (user) {
      localStorage.setItem('auth-storage', JSON.stringify({
        state: { user }
      }));
    } else {
      localStorage.removeItem('auth-storage');
    }
  }

  private getUserFromStorage(): User | null {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        return parsed?.state?.user || null;
      } catch {
        return null;
      }
    }
    return null;
  }
}
