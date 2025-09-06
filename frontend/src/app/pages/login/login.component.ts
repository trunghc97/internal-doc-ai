import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { HtmlValidator } from '../../shared/validators';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  // Custom email validator
  static emailValidator(control: AbstractControl): ValidationErrors | null {
    const email = control.value;
    if (!email) return null;
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) ? null : { invalidEmail: true };
  }

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [
        Validators.required, 
        Validators.email, 
        LoginComponent.emailValidator,
        HtmlValidator.noHtml
      ]],
      password: ['', [
        Validators.required, 
        Validators.minLength(6),
        HtmlValidator.noHtml
      ]]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { username, password } = this.loginForm.value;

      try {
        await this.authService.login(username, password);
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      } catch (error: any) {
        this.errorMessage = error.error?.message || 'Đăng nhập thất bại';
        this.isLoading = false;
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return fieldName === 'username' ? 'Vui lòng nhập email' : 'Vui lòng nhập mật khẩu';
      }
      if (control.errors['email'] || control.errors['invalidEmail']) {
        return 'Vui lòng nhập địa chỉ email hợp lệ';
      }
      if (control.errors['minlength']) {
        return 'Mật khẩu phải có ít nhất 6 ký tự';
      }
      if (control.errors['htmlNotAllowed']) {
        return 'Không được phép nhập thẻ HTML';
      }
    }
    return '';
  }
}
