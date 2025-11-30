import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { combineLatest, filter, map, switchMap, takeUntil, Subject } from 'rxjs';
import { Team } from '../../models/team.model';
import { Project } from '../../models/project.model';
import { BasicUser } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { CompanyDataService } from '../../services/company-data.service';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.css']
})
export class TeamsComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  availableUsers: BasicUser[] = [];

  company$ = this.authService.selectedCompany$;
  isAdmin$ = this.authService.role$.pipe(map((role) => role === 'admin'));

  teams$ = combineLatest([this.company$, this.authService.currentUser$, this.authService.role$]).pipe(
    filter(([company, user]) => !!company && !!user),
    switchMap(([company, user, role]) =>
      this.companyDataService.teams$(company!).pipe(
        map((teams: Team[]) => {
          const sanitized = teams ?? [];
          if (role === 'worker') {
            return sanitized.filter((team) => team.teammates.some((member) => member.id === user!.id));
          }
          return sanitized;
        })
      )
    )
  );

  users$ = this.company$.pipe(
    filter((company): company is NonNullable<typeof company> => !!company),
    switchMap((company) => this.companyDataService.users$(company))
  );

  projectCounts = new Map<number, number>();
  modalOpen = false;
  editModalOpen = false;
  newTeamMembers: BasicUser[] = [];
  editMembers: BasicUser[] = [];
  editingTeam: Team | null = null;

  teamForm = this.fb.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    memberId: ['']
  });

  editForm = this.fb.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    memberId: ['']
  });

  constructor(
    private authService: AuthService,
    private companyDataService: CompanyDataService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.teams$.pipe(takeUntil(this.destroy$)).subscribe((teams: Team[]) => {
      teams.forEach((team: Team) => this.trackProjects(team));
    });

    this.users$.pipe(takeUntil(this.destroy$)).subscribe((users: BasicUser[]) => {
      this.availableUsers = users;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackProjects(team: Team): void {
    const company = this.authService.selectedCompany;
    if (!company || this.projectCounts.has(team.id)) {
      return;
    }
    this.companyDataService
      .projects$(company, team.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((projects: Project[]) => this.projectCounts.set(team.id, projects.length));
  }

  openModal(): void {
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.teamForm.reset();
    this.newTeamMembers = [];
  }

  handleMemberSelect(memberId: string): void {
    const id = Number(memberId);
    const member = this.availableUsers.find((user) => user.id === id);
    if (!member || this.newTeamMembers.some((m) => m.id === member.id)) {
      return;
    }
    this.newTeamMembers.push(member);
    this.teamForm.get('memberId')?.setValue('');
  }

  removeMember(memberId: number): void {
    this.newTeamMembers = this.newTeamMembers.filter((member) => member.id !== memberId);
  }

  createTeam(): void {
    if (this.teamForm.invalid) {
      this.teamForm.markAllAsTouched();
      return;
    }
    const company = this.authService.selectedCompany;
    if (!company) {
      return;
    }
    const { name, description } = this.teamForm.value;
    if (!name || !description) {
      return;
    }
    this.companyDataService
      .createTeam(company, { name, description, teammateIds: this.buildMemberIds(this.newTeamMembers) })
      .subscribe(() => this.closeModal());
  }

  startEdit(team: Team): void {
    this.editingTeam = team;
    this.editForm.patchValue({
      name: team.name,
      description: team.description,
      memberId: ''
    });
    this.editMembers = [...team.teammates];
    this.editModalOpen = true;
  }

  handleEditMemberSelect(memberId: string): void {
    const id = Number(memberId);
    const member = this.availableUsers.find((user) => user.id === id);
    if (!member || this.editMembers.some((m) => m.id === member.id)) {
      return;
    }
    this.editMembers.push(member);
    this.editForm.get('memberId')?.setValue('');
  }

  removeEditMember(memberId: number): void {
    this.editMembers = this.editMembers.filter((member) => member.id !== memberId);
  }

  closeEditModal(): void {
    this.editModalOpen = false;
    this.editingTeam = null;
    this.editMembers = [];
    this.editForm.reset();
  }

  saveTeamEdit(): void {
    if (this.editForm.invalid || !this.editingTeam) {
      this.editForm.markAllAsTouched();
      return;
    }
    const company = this.authService.selectedCompany;
    if (!company) {
      return;
    }
    const { name, description } = this.editForm.value;
    if (!name || !description) {
      return;
    }
    this.companyDataService
      .updateTeam(company, this.editingTeam.id, {
        name,
        description,
        teammateIds: this.buildMemberIds(this.editMembers)
      })
      .subscribe(() => this.closeEditModal());
  }

  deleteTeam(team: Team): void {
    if (!confirm(`Delete ${team.name}? This action cannot be undone.`)) {
      return;
    }
    const company = this.authService.selectedCompany;
    if (!company) {
      return;
    }
    this.companyDataService.deleteTeam(company, team.id).subscribe();
  }

  viewTeam(team: Team): void {
    this.router.navigate(['/teams', team.id]);
  }

  getMemberName(member: BasicUser): string {
    const lastInitial = member.profile.lastName ? `${member.profile.lastName.charAt(0)}.` : '';
    return `${member.profile.firstName} ${lastInitial}`.trim();
  }

  private buildMemberIds(members: BasicUser[]): number[] {
    return members.map((member) => member.id);
  }
}
