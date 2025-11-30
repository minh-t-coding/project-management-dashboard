import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap, throwError } from 'rxjs';
import { CompanyOption } from '../models/company.model';
import { FullUser, Profile, UserRole } from '../models/user.model';

interface CredentialsPayload {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:8080';
  private readonly userKey = 'final-app-user';
  private readonly roleKey = 'final-app-role';
  private readonly companyKey = 'final-app-company';
  private readonly passwordKey = 'final-app-last-password';
  private readonly identifierKey = 'final-app-identifier';

  private currentUserSubject = new BehaviorSubject<FullUser | null>(this.getStoredUser());
  currentUser$ = this.currentUserSubject.asObservable();

  private roleSubject = new BehaviorSubject<UserRole | null>(this.getStoredRole());
  role$ = this.roleSubject.asObservable();

  private companySubject = new BehaviorSubject<CompanyOption | null>(this.getStoredCompany());
  selectedCompany$ = this.companySubject.asObservable();

  constructor(private http: HttpClient) {}

  login(identifier: string, password: string, role: UserRole): Observable<FullUser> {
    const payload: CredentialsPayload = {
      username: identifier.trim(),
      password
    };

    return this.http.post<FullUser>(`${this.apiUrl}/users/login`, payload).pipe(
      map((user) => {
        if (role === 'admin' && !user.admin) {
          throw new Error('Employee login found, please login as an employee.');
        }
        if (role === 'worker' && user.admin) {
          throw new Error('Admin login found, please login as an admin.');
        }
        return user.status === 'PENDING' ? { ...user, status: 'JOINED' } : user;
      }),
      tap((user) => {
        this.persistUser(user, role, payload.password, payload.username);
        if (user.status === 'JOINED' && user.id > 0) {
          // ensure status is reflected backend-side if it was pending on first login
          this.http
            .patch(`${this.apiUrl}/users/${user.id}`, { profile: {}, credentials: {} })
            .subscribe({ error: () => {} });
        }
      })
    );
  }

  logout(): void {
    this.currentUserSubject.next(null);
    this.roleSubject.next(null);
    this.companySubject.next(null);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.roleKey);
    localStorage.removeItem(this.companyKey);
    localStorage.removeItem(this.passwordKey);
    localStorage.removeItem(this.identifierKey);
  }

  setSelectedCompany(option: CompanyOption): void {
    this.companySubject.next(option);
    localStorage.setItem(this.companyKey, JSON.stringify(option));
  }

  get currentUser(): FullUser | null {
    return this.currentUserSubject.value;
  }

  get role(): UserRole | null {
    return this.roleSubject.value;
  }

  get selectedCompany(): CompanyOption | null {
    return this.companySubject.value;
  }

  get hasCompanySelected(): boolean {
    return !!this.companySubject.value;
  }

  private persistUser(user: FullUser, role: UserRole, password: string, identifier: string): void {
    this.currentUserSubject.next(user);
    this.roleSubject.next(role);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    localStorage.setItem(this.roleKey, role);
    localStorage.setItem(this.passwordKey, password);
    localStorage.setItem(this.identifierKey, identifier);
    this.companySubject.next(null);
    localStorage.removeItem(this.companyKey);
  }

  private getStoredUser(): FullUser | null {
    const raw = localStorage.getItem(this.userKey);
    return raw ? (JSON.parse(raw) as FullUser) : null;
  }

  private getStoredRole(): UserRole | null {
    const raw = localStorage.getItem(this.roleKey);
    return raw === 'admin' || raw === 'worker' ? raw : null;
  }

  private getStoredCompany(): CompanyOption | null {
    const raw = localStorage.getItem(this.companyKey);
    return raw ? (JSON.parse(raw) as CompanyOption) : null;
  }

  get storedPassword(): string | null {
    return localStorage.getItem(this.passwordKey);
  }

  get storedIdentifier(): string | null {
    return localStorage.getItem(this.identifierKey);
  }

  get credentialsPayload(): CredentialsPayload | null {
    const username = this.storedIdentifier;
    const password = this.storedPassword;
    if (!username || !password) {
      return null;
    }
    return { username, password };
  }

  updateCurrentUser(update: { profile?: Partial<Profile>; credentials?: Partial<CredentialsPayload> }): Observable<FullUser> {
    const currentUser = this.currentUser;
    const role = this.role;
    if (!currentUser || !role) {
      return throwError(() => new Error('User session has expired. Please login again.'));
    }
    return this.http.patch<FullUser>(`${this.apiUrl}/users/${currentUser.id}`, update).pipe(
      tap((user) => {
        this.currentUserSubject.next(user);
        localStorage.setItem(this.userKey, JSON.stringify(user));
        if (update.credentials?.password) {
          localStorage.setItem(this.passwordKey, update.credentials.password);
        }
        if (update.credentials?.username) {
          localStorage.setItem(this.identifierKey, update.credentials.username);
        }
      })
    );
  }

}
