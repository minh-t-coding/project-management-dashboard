import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Profile } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent {
  successMessage = '';
  errorMessage = '';

  profileForm = this.fb.group({
    firstName: [''],
    lastName: [''],
    email: ['', [Validators.email]],
    phone: [''],
    username: [''],
    password: [''],
    confirmPassword: ['']
  });

  constructor(private fb: FormBuilder, public authService: AuthService) {
    const user = this.authService.currentUser;
    if (user) {
      this.profileForm.patchValue({
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        email: user.profile.email,
        phone: user.profile.phone ?? '',
        username: user.username ?? ''
      });
    }
  }

  saveProfile(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const user = this.authService.currentUser;
    if (!user) {
      this.errorMessage = 'User session has expired.';
      return;
    }

    const { firstName, lastName, email, phone, username, password, confirmPassword } = this.profileForm.value;
    if (password && password !== confirmPassword) {
      this.profileForm.get('confirmPassword')?.setErrors({ mismatch: true });
      return;
    }

    const profileUpdate: Partial<Profile> = {};
    if (firstName && firstName !== user.profile.firstName) {
      profileUpdate.firstName = firstName;
    }
    if (lastName && lastName !== user.profile.lastName) {
      profileUpdate.lastName = lastName;
    }
    if (email && email !== user.profile.email) {
      profileUpdate.email = email;
    }
    if (phone !== undefined && phone !== user.profile.phone) {
      profileUpdate.phone = phone || '';
    }

    const credentialUpdate: Partial<{ username: string; password: string }> = {};
    if (username && username !== user.username) {
      credentialUpdate.username = username;
    }
    if (password) {
      credentialUpdate.password = password;
    }

    const payload: {
      profile?: Partial<Profile>;
      credentials?: Partial<{ username: string; password: string }>;
    } = {};

    if (Object.keys(profileUpdate).length) {
      payload.profile = profileUpdate;
    }
    if (Object.keys(credentialUpdate).length) {
      payload.credentials = credentialUpdate;
    }

    if (!payload.profile && !payload.credentials) {
      this.successMessage = 'No changes to update.';
      return;
    }

    this.authService.updateCurrentUser(payload).subscribe({
      next: () => {
        this.successMessage = 'Profile updated successfully.';
        this.errorMessage = '';
        this.profileForm.get('password')?.reset();
        this.profileForm.get('confirmPassword')?.reset();
      },
      error: (error) => {
        this.errorMessage = error?.message || 'Unable to update profile. Please try again.';
      }
    });
  }
}
