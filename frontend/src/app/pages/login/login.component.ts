import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/user.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  role: UserRole = 'worker';
  errorMessage = '';
  loading = false;

  form = this.fb.group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {}

  setRole(role: UserRole): void {
    this.role = role;
  }

  submit(): void {
    this.errorMessage = '';
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }
    const { identifier, password } = this.form.value;
    if (!identifier || !password) {
      return;
    }
    this.loading = true;
    this.authService.login(identifier, password, this.role).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/select-company']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message || error.message || 'Login failed. Please try again.';
      }
    });
  }

  get identifier() {
    return this.form.get('identifier');
  }

  get password() {
    return this.form.get('password');
  }
}
