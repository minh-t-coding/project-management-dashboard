import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { BehaviorSubject, combineLatest, filter, map, switchMap, tap } from 'rxjs';
import { Announcement } from '../../models/announcement.model';
import { AuthService } from '../../services/auth.service';
import { CompanyDataService } from '../../services/company-data.service';
import { CompanyOption } from '../../models/company.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  announcements$ = combineLatest([this.authService.selectedCompany$]).pipe(
    filter((value): value is [CompanyOption] => !!value[0]),
    switchMap(([company]) => this.companyDataService.announcements$(company)),
    map((announcements: Announcement[]) => announcements ?? []),
    tap((announcements: Announcement[]) => this.evaluateAnnouncements(announcements))
  );

  isAdmin$ = this.authService.role$.pipe(map((role) => role === 'admin'));
  indicator$ = new BehaviorSubject<boolean>(false);
  modalOpen = false;
  editModalOpen = false;
  editingAnnouncement: Announcement | null = null;

  announcementForm = this.fb.group({
    title: ['', [Validators.required]],
    message: ['', [Validators.required]]
  });

  editForm = this.fb.group({
    title: ['', [Validators.required]],
    message: ['', [Validators.required]]
  });

  constructor(
    private authService: AuthService,
    private companyDataService: CompanyDataService,
    private fb: FormBuilder
  ) {}

  openModal(): void {
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.announcementForm.reset();
  }

  submitAnnouncement(): void {
    if (this.announcementForm.invalid) {
      this.announcementForm.markAllAsTouched();
      return;
    }
    const company = this.authService.selectedCompany;
    const { title, message } = this.announcementForm.value;
    if (!title || !message) {
      return;
    }
    if (!company) {
      return;
    }
    this.companyDataService.createAnnouncement(company, { title, message }).subscribe({
      next: () => {
        this.announcementForm.reset();
        this.modalOpen = false;
        this.markAnnouncementsRead();
      },
      error: () => {
        this.announcementForm.setErrors({ submit: true });
      }
    });
  }

  startEdit(announcement: Announcement): void {
    this.editingAnnouncement = announcement;
    this.editForm.patchValue({
      title: announcement.title,
      message: announcement.message
    });
    this.editModalOpen = true;
  }

  closeEditModal(): void {
    this.editModalOpen = false;
    this.editingAnnouncement = null;
    this.editForm.reset();
  }

  submitAnnouncementEdit(): void {
    if (this.editForm.invalid || !this.editingAnnouncement) {
      this.editForm.markAllAsTouched();
      return;
    }
    const company = this.authService.selectedCompany;
    if (!company) {
      return;
    }
    const { title, message } = this.editForm.value;
    if (!title || !message) {
      return;
    }
    this.companyDataService.updateAnnouncement(this.editingAnnouncement.id, { title, message }).subscribe({
      next: () => {
        this.closeEditModal();
      },
      error: () => this.editForm.setErrors({ submit: true })
    });
  }

  deleteAnnouncement(announcement: Announcement): void {
    if (!confirm(`Delete announcement "${announcement.title}"?`)) {
      return;
    }
    this.companyDataService.deleteAnnouncement(announcement.id).subscribe();
  }

  markAnnouncementsRead(): void {
    const company = this.authService.selectedCompany;
    const user = this.authService.currentUser;
    if (!company || !user) {
      return;
    }
    const key = this.getAnnouncementKey(company.id, user.id);
    localStorage.setItem(key, new Date().toISOString());
    this.indicator$.next(false);
  }

  private evaluateAnnouncements(announcements: Announcement[]): void {
    const company = this.authService.selectedCompany;
    const user = this.authService.currentUser;
    if (!company || !user || !announcements?.length) {
      this.indicator$.next(false);
      return;
    }
    const latest = new Date(announcements[0].date).getTime();
    const lastSeenKey = this.getAnnouncementKey(company.id, user.id);
    const lastSeen = localStorage.getItem(lastSeenKey);
    if (!lastSeen) {
      this.indicator$.next(true);
      return;
    }
    const seenTime = new Date(lastSeen).getTime();
    this.indicator$.next(latest > seenTime);
  }

  private getAnnouncementKey(companyId: number, userId: number): string {
    return `announcements-${companyId}-${userId}`;
  }
}
