import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, of, tap, throwError } from 'rxjs';
import { Announcement } from '../models/announcement.model';
import { CompanyOption } from '../models/company.model';
import { Project } from '../models/project.model';
import { Team } from '../models/team.model';
import { BasicUser } from '../models/user.model';
import { AuthService } from './auth.service';

interface AnnouncementRequest {
  title: string;
  message: string;
}

interface TeamRequestPayload {
  name: string;
  description: string;
  teammateIds: number[];
}

interface ProjectRequestPayload {
  name: string;
  description: string;
  active?: boolean;
  teamId: number;
}

interface UserDraftPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  isAdmin: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CompanyDataService {
  private readonly apiUrl = 'http://localhost:8080';

  private announcementStreams = new Map<number, BehaviorSubject<Announcement[]>>();
  private teamStreams = new Map<number, BehaviorSubject<Team[]>>();
  private projectStreams = new Map<string, BehaviorSubject<Project[]>>();
  private userStreams = new Map<number, BehaviorSubject<BasicUser[]>>();

  constructor(private http: HttpClient, private authService: AuthService) {}

  refreshAnnouncements(company: CompanyOption): void {
    this.http
      .get<Announcement[]>(`${this.apiUrl}/company/${company.id}/announcements`)
      .pipe(
        map((announcements: Announcement[]) =>
          [...announcements].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        )
      )
      .subscribe((announcements: Announcement[]) => {
        this.getAnnouncementStream(company.id).next(announcements);
      });
  }

  announcements$(company: CompanyOption): Observable<Announcement[]> {
    this.triggerInitialFetch(company, this.announcementStreams, () => this.refreshAnnouncements(company));
    return this.getAnnouncementStream(company.id).asObservable();
  }

  createAnnouncement(company: CompanyOption, payload: AnnouncementRequest): Observable<Announcement> {
    const credentials = this.authService.credentialsPayload;
    if (!credentials) {
      return throwError(() => new Error('Missing credentials for announcement creation.'));
    }
    const request = {
      title: payload.title,
      message: payload.message,
      credentials
    };
    return this.http.post<Announcement>(`${this.apiUrl}/company/${company.id}/announcements`, request).pipe(
      tap((announcement: Announcement) => {
        const stream = this.getAnnouncementStream(company.id);
        stream.next([announcement, ...stream.value]);
      })
    );
  }

  updateAnnouncement(announcementId: number, payload: AnnouncementRequest): Observable<Announcement> {
    const credentials = this.authService.credentialsPayload;
    if (!credentials) {
      return throwError(() => new Error('Missing credentials for announcement updates.'));
    }
    return this.http
      .put<Announcement>(`${this.apiUrl}/announcements/${announcementId}`, {
        ...payload,
        credentials
      })
      .pipe(
        tap((announcement) => {
          this.announcementStreams.forEach((stream) => {
            stream.next(
              stream.value.map((existing) => (existing.id === announcement.id ? announcement : existing))
            );
          });
        })
      );
  }

  deleteAnnouncement(announcementId: number): Observable<void> {
    const credentials = this.authService.credentialsPayload;
    if (!credentials) {
      return throwError(() => new Error('Missing credentials for announcement deletion.'));
    }
    return this.http.delete<void>(`${this.apiUrl}/announcements/${announcementId}`, { body: credentials }).pipe(
      tap(() => {
        this.announcementStreams.forEach((stream) => {
          stream.next(stream.value.filter((announcement) => announcement.id !== announcementId));
        });
      })
    );
  }

  teams$(company: CompanyOption): Observable<Team[]> {
    this.triggerInitialFetch(company, this.teamStreams, () => this.fetchTeams(company));
    return this.getTeamStream(company.id).asObservable();
  }

  private fetchTeams(company: CompanyOption): void {
    this.http
      .get<Team[]>(`${this.apiUrl}/company/${company.id}/teams`)
      .pipe(
        map((teams: Team[]) =>
          teams.map((team: Team) => ({
            ...team,
            teammates: team.teammates ?? []
          }))
        )
      )
      .subscribe((teams: Team[]) => {
        this.getTeamStream(company.id).next(teams);
      });
  }

  createTeam(company: CompanyOption, payload: TeamRequestPayload): Observable<Team> {
    return this.http.post<Team>(`${this.apiUrl}/company/${company.id}/teams`, payload).pipe(
      tap((team: Team) => {
        const stream = this.getTeamStream(company.id);
        stream.next([team, ...stream.value]);
      })
    );
  }

  updateTeam(company: CompanyOption, teamId: number, payload: TeamRequestPayload): Observable<Team> {
    return this.http.patch<Team>(`${this.apiUrl}/company/${company.id}/teams/${teamId}`, payload).pipe(
      tap((team: Team) => {
        const stream = this.getTeamStream(company.id);
        stream.next(stream.value.map((existing) => (existing.id === team.id ? team : existing)));
      })
    );
  }

  deleteTeam(company: CompanyOption, teamId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/company/${company.id}/teams/${teamId}`).pipe(
      tap(() => {
        const stream = this.getTeamStream(company.id);
        stream.next(stream.value.filter((team) => team.id !== teamId));
      })
    );
  }

  projects$(company: CompanyOption, teamId: number): Observable<Project[]> {
    const key = this.projectKey(company.id, teamId);
    if (!this.projectStreams.has(key)) {
      this.projectStreams.set(key, new BehaviorSubject<Project[]>([]));
      this.fetchProjects(company, teamId);
    }
    return this.projectStreams.get(key)!.asObservable();
  }

  private fetchProjects(company: CompanyOption, teamId: number): void {
    this.http
      .get<Project[]>(`${this.apiUrl}/company/${company.id}/teams/${teamId}/projects`)
      .subscribe((projects: Project[]) => {
        this.getProjectStream(company.id, teamId).next(projects);
      });
  }

  createProject(company: CompanyOption, payload: ProjectRequestPayload): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/projects`, payload).pipe(
      tap((project) => {
        const stream = this.getProjectStream(company.id, payload.teamId);
        stream.next([...stream.value, project]);
      })
    );
  }

  updateProject(
    company: CompanyOption,
    payload: ProjectRequestPayload,
    projectId: number
  ): Observable<Project> {
    return this.http.patch<Project>(`${this.apiUrl}/projects/${projectId}`, payload).pipe(
      tap((project) => {
        const stream = this.getProjectStream(company.id, payload.teamId);
        stream.next(stream.value.map((p) => (p.id === project.id ? project : p)));
      })
    );
  }

  deleteProject(company: CompanyOption, teamId: number, projectId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/projects/${projectId}`).pipe(
      tap(() => {
        const stream = this.getProjectStream(company.id, teamId);
        stream.next(stream.value.filter((p) => p.id !== projectId));
      })
    );
  }

  users$(company: CompanyOption): Observable<BasicUser[]> {
    this.triggerInitialFetch(company, this.userStreams, () => this.fetchUsers(company));
    return this.getUserStream(company.id).asObservable();
  }

  private fetchUsers(company: CompanyOption): void {
    this.http.get<BasicUser[]>(`${this.apiUrl}/company/${company.id}/users`).subscribe((users: BasicUser[]) => {
      this.getUserStream(company.id).next(users);
    });
  }

  createUser(company: CompanyOption, payload: UserDraftPayload & { username: string }): Observable<BasicUser> {
    const request = {
      credentials: { username: payload.username, password: payload.password },
      profile: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone
      },
      admin: payload.isAdmin
    };
    return this.http.post<BasicUser>(`${this.apiUrl}/company/${company.id}/user`, request).pipe(
      tap((user) => {
        const stream = this.getUserStream(company.id);
        stream.next([user, ...stream.value]);
      })
    );
  }

  deleteUser(company: CompanyOption, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}`).pipe(
      tap(() => {
        const stream = this.getUserStream(company.id);
        stream.next(
          stream.value.map((user) => (user.id === userId ? { ...user, active: false } : user))
        );
      })
    );
  }

  deleteUserPermanent(company: CompanyOption, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}/permanent`).pipe(
      tap(() => {
        const stream = this.getUserStream(company.id);
        stream.next(stream.value.filter((user) => user.id !== userId));
      })
    );
  }

  reinstateUser(company: CompanyOption, userId: number): Observable<BasicUser> {
    const credentials = this.authService.credentialsPayload;
    if (!credentials) {
      return throwError(() => new Error('Missing credentials for user reinstatement.'));
    }
    return this.http.patch<BasicUser>(`${this.apiUrl}/users/${userId}/reinstate`, credentials).pipe(
      tap((user) => {
        const stream = this.getUserStream(company.id);
        stream.next(stream.value.map((existing) => (existing.id === user.id ? user : existing)));
      })
    );
  }

  private triggerInitialFetch<T>(
    company: CompanyOption,
    mapRef: Map<number, BehaviorSubject<T[]>>,
    fetcher: () => void
  ): void {
    if (!mapRef.has(company.id)) {
      mapRef.set(company.id, new BehaviorSubject<T[]>([]));
      fetcher();
    }
  }

  private getAnnouncementStream(id: number): BehaviorSubject<Announcement[]> {
    if (!this.announcementStreams.has(id)) {
      this.announcementStreams.set(id, new BehaviorSubject<Announcement[]>([]));
    }
    return this.announcementStreams.get(id)!;
  }

  private getTeamStream(id: number): BehaviorSubject<Team[]> {
    if (!this.teamStreams.has(id)) {
      this.teamStreams.set(id, new BehaviorSubject<Team[]>([]));
    }
    return this.teamStreams.get(id)!;
  }

  private getProjectStream(companyId: number, teamId: number): BehaviorSubject<Project[]> {
    const key = this.projectKey(companyId, teamId);
    if (!this.projectStreams.has(key)) {
      this.projectStreams.set(key, new BehaviorSubject<Project[]>([]));
    }
    return this.projectStreams.get(key)!;
  }

  private getUserStream(id: number): BehaviorSubject<BasicUser[]> {
    if (!this.userStreams.has(id)) {
      this.userStreams.set(id, new BehaviorSubject<BasicUser[]>([]));
    }
    return this.userStreams.get(id)!;
  }

  private projectKey(companyId: number, teamId: number): string {
    return `${companyId}-${teamId}`;
  }

  clearCaches(): void {
    this.announcementStreams.clear();
    this.teamStreams.clear();
    this.projectStreams.clear();
    this.userStreams.clear();
  }
}
