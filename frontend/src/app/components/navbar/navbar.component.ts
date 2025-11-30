import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { CompanyOption } from '../../models/company.model';
import { FullUser, UserRole } from '../../models/user.model';

export interface NavLink {
  label: string;
  route?: string;
  action?: 'logout';
}

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  @Input() user: FullUser | null = null;
  @Input() role: UserRole | null = null;
  @Input() links: NavLink[] = [];
  @Input() selectedCompany: CompanyOption | null = null;
  @Output() actionSelected = new EventEmitter<'logout'>();

  isMobile = window.innerWidth <= 900;
  menuOpen = false;

  constructor(private router: Router) {}

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile = window.innerWidth <= 900;
    if (!this.isMobile) {
      this.menuOpen = false;
    }
  }

  get welcomeText(): string {
    if (!this.user) {
      return '';
    }
    if (this.role === 'admin') {
      return `Welcome, ${this.user.profile.firstName}`;
    }
    const lastInitial = this.user.profile.lastName
      ? `${this.user.profile.lastName.charAt(0).toUpperCase()}.`
      : '';
    return `${this.user.profile.firstName} ${lastInitial}`.trim();
  }

  get statusText(): string {
    if (this.role === 'admin') {
      return 'Acting as Admin';
    }
    if (this.role === 'worker') {
      return 'Team Member';
    }
    return '';
  }

  navigate(link: NavLink): void {
    if (link.action === 'logout') {
      this.actionSelected.emit('logout');
      this.menuOpen = false;
      return;
    }
    if (link.route) {
      this.router.navigate([link.route]);
      this.menuOpen = false;
    }
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }
}
