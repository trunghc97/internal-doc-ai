import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HtmlValidator } from '../../shared/validators';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', [
        Validators.required, 
        Validators.minLength(3),
        HtmlValidator.noHtml
      ]],
      email: ['', [
        Validators.required, 
        Validators.email,
        HtmlValidator.noHtml
      ]],
      password: ['', [
        Validators.required, 
        Validators.minLength(6),
        HtmlValidator.noHtml
      ]],
      confirmPassword: ['', [
        Validators.required,
        HtmlValidator.noHtml
      ]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { username, email, password } = this.registerForm.value;

      this.authService.register(email, username, password)
      .then( () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      })
      .catch((err : any) => {
        this.errorMessage = err.error?.message || 'Đăng ký thất bại';
        this.isLoading = false;
      })
      // .subscribe({
      //   next: () => {
      //     this.router.navigate(['/dashboard']);
      //   },
      //   error: (error : any) => {
      //     this.errorMessage = error.error?.message || 'Đăng ký thất bại';
      //     this.isLoading = false;
      //   },
      //   complete: () => {
      //     this.isLoading = false;
      //   }
      // });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.registerForm.get(fieldName);
    if (control?.errors && control.touched) {
      switch (fieldName) {
        case 'username':
          if (control.errors['required']) return 'Vui lòng nhập tên đăng nhập';
          if (control.errors['minlength']) return 'Tên đăng nhập phải có ít nhất 3 ký tự';
          if (control.errors['htmlNotAllowed']) return 'Không được phép nhập thẻ HTML';
          break;
        case 'email':
          if (control.errors['required']) return 'Vui lòng nhập email';
          if (control.errors['email']) return 'Email không hợp lệ';
          if (control.errors['htmlNotAllowed']) return 'Không được phép nhập thẻ HTML';
          break;
        case 'password':
          if (control.errors['required']) return 'Vui lòng nhập mật khẩu';
          if (control.errors['minlength']) return 'Mật khẩu phải có ít nhất 6 ký tự';
          if (control.errors['htmlNotAllowed']) return 'Không được phép nhập thẻ HTML';
          break;
        case 'confirmPassword':
          if (control.errors['required']) return 'Vui lòng xác nhận mật khẩu';
          if (control.errors['mismatch']) return 'Mật khẩu xác nhận không khớp';
          if (control.errors['htmlNotAllowed']) return 'Không được phép nhập thẻ HTML';
          break;
      }
    }
    return '';
  }
}
