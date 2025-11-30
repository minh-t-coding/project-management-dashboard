import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { filter, switchMap } from 'rxjs';
import { BasicUser } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { CompanyDataService } from '../../services/company-data.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent {
  company$ = this.authService.selectedCompany$;
  users$ = this.company$.pipe(
    filter((company): company is NonNullable<typeof company> => !!company),
    switchMap((company) => this.companyDataService.users$(company))
  );

  modalOpen = false;

  userForm = this.fb.group({
    username: ['', [Validators.required]],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
    isAdmin: ['false', [Validators.required]]
  });

  constructor(
    public authService: AuthService,
    private companyDataService: CompanyDataService,
    private fb: FormBuilder
  ) {}

  openModal(): void {
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.userForm.reset({ isAdmin: 'false' });
  }

  createUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    const company = this.authService.selectedCompany;
    if (!company) {
      return;
    }
    const { username, firstName, lastName, email, phone, password, confirmPassword, isAdmin } = this.userForm.value;
    if (!username || !firstName || !lastName || !email || !password || !confirmPassword) {
      return;
    }
    if (password !== confirmPassword) {
      this.userForm.get('confirmPassword')?.setErrors({ mismatch: true });
      return;
    }
    this.companyDataService
      .createUser(company, {
        username,
        firstName,
        lastName,
        email,
        phone: phone || '',
        password,
        isAdmin: isAdmin === 'true'
      })
      .subscribe(() => this.closeModal());
  }

  formatName(user: BasicUser): string {
    return `${user.profile.firstName} ${user.profile.lastName}`;
  }

  deactivate(user: BasicUser): void {
    const company = this.authService.selectedCompany;
    if (!company) {
      return;
    }
    if (!user.active) {
      return;
    }
    if (!confirm(`Deactivate ${this.formatName(user)}?`)) {
      return;
    }
    this.companyDataService.deleteUser(company, user.id).subscribe();
  }

  reinstate(user: BasicUser): void {
    const company = this.authService.selectedCompany;
    if (!company) {
      return;
    }
    if (user.active) {
      return;
    }
    this.companyDataService.reinstateUser(company, user.id).subscribe();
  }

  deletePermanent(user: BasicUser): void {
    const company = this.authService.selectedCompany;
    if (!company) {
      return;
    }
    const name = this.formatName(user);
    const confirmed = confirm(
      `Permanently delete ${name}? This cannot be undone and will remove them from all teams.`
    );
    if (!confirmed) {
      return;
    }
    this.companyDataService.deleteUserPermanent(company, user.id).subscribe();
  }
}
