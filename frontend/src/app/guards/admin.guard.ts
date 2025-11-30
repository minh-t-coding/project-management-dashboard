import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, combineLatest, map } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { FullUser, UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return combineLatest([this.authService.currentUser$, this.authService.role$]).pipe(
      map(([user, role]: [FullUser | null, UserRole | null]) => {
        if (user && user.admin && role === 'admin') {
          return true;
        }
        return this.router.parseUrl('/home');
      })
    );
  }
}
