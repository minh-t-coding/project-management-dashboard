import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, combineLatest, filter, map } from 'rxjs';
import { NavLink } from './components/navbar/navbar.component';
import { AuthService } from './services/auth.service';
import { FullUser, UserRole } from './models/user.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private routeSubject = new BehaviorSubject<string>(this.router.url);

  user$ = this.authService.currentUser$;
  role$ = this.authService.role$;
  company$ = this.authService.selectedCompany$;

  navLinks$ = this.role$.pipe(
    map((role: UserRole | null) => {
      if (role === 'admin') {
        return [
          { label: 'Home', route: '/home' },
          { label: 'Company', route: '/company' },
          { label: 'Teams', route: '/teams' },
          { label: 'Users', route: '/users' },
          { label: 'Profile', route: '/profile' },
          { label: 'Logout', action: 'logout' }
        ] satisfies NavLink[];
      }
      if (role === 'worker') {
        return [
          { label: 'Home', route: '/home' },
          { label: 'Teams', route: '/teams' },
          { label: 'Profile', route: '/profile' },
          { label: 'Logout', action: 'logout' }
        ] satisfies NavLink[];
      }
      return [];
    })
  );

  showNav$ = combineLatest([this.authService.currentUser$, this.routeSubject]).pipe(
    map(([user, route]: [FullUser | null, string]) => !!user && route !== '/login')
  );

  constructor(private authService: AuthService, private router: Router) {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => this.routeSubject.next(event.urlAfterRedirects));
  }

  handleAction(action: 'logout'): void {
    if (action === 'logout') {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
}
