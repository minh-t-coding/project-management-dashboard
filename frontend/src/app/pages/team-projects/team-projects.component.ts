import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, filter, map, switchMap, tap, take } from 'rxjs';
import { Project } from '../../models/project.model';
import { Team } from '../../models/team.model';
import { AuthService } from '../../services/auth.service';
import { CompanyDataService } from '../../services/company-data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-team-projects',
  templateUrl: './team-projects.component.html',
  styleUrls: ['./team-projects.component.css']
})
export class TeamProjectsComponent {
  company$ = this.authService.selectedCompany$;
  teamId$ = this.route.paramMap.pipe(map((params) => Number(params.get('id'))));

  team$ = combineLatest([this.company$, this.teamId$]).pipe(
    filter(([company, teamId]) => !!company && !!teamId),
    switchMap(([company, teamId]) =>
      this.companyDataService.teams$(company!).pipe(
        map((teams: Team[]) => teams.find((team: Team) => team.id === teamId)),
        tap((team: Team | undefined) => {
          if (team) {
            this.selectedTeam = team;
            this.evaluateMembership();
          }
        })
      )
    )
  );

  latestProjects: Project[] = [];

  projects$ = combineLatest([this.company$, this.teamId$]).pipe(
    filter(([company, teamId]) => !!company && !!teamId),
    switchMap(([company, teamId]) => this.companyDataService.projects$(company!, teamId)),
    tap((projects: Project[]) => {
      this.latestProjects = projects;
      this.evaluateProjectIndicator(projects);
    })
  );

  isAdmin$ = this.authService.role$.pipe(map((role) => role === 'admin'));
  canEdit = false;
  showIndicator = false;
  selectedTeam?: Team;
  editingProject?: Project;
  showEditModal = false;
  showCreateModal = false;

  editForm = this.fb.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    active: ['true']
  });

  createForm = this.fb.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]]
  });

  constructor(
    public authService: AuthService,
    private companyDataService: CompanyDataService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {}

  openEdit(project: Project): void {
    if (!(this.canEdit || this.authService.role === 'admin')) {
      return;
    }
    this.editingProject = project;
    this.editForm.patchValue({
      name: project.name,
      description: project.description,
      active: String(project.active)
    });
    if (this.authService.role === 'admin') {
      this.editForm.get('active')?.enable();
    } else {
      this.editForm.get('active')?.disable();
    }
    this.showEditModal = true;
  }

  goBack(): void {
    this.router.navigate(['/teams']);
  }

  saveEdit(): void {
    if (!this.editingProject || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const company = this.authService.selectedCompany;
    const teamId = this.selectedTeam?.id;
    if (!company || !teamId) {
      return;
    }
    const { name, description, active } = this.editForm.getRawValue();
    if (!name || !description) {
      return;
    }
    this.companyDataService
      .updateProject(
        company,
        {
          name,
          description,
          active: active === 'true',
          teamId
        },
        this.editingProject.id
      )
      .subscribe(() => {
        this.showEditModal = false;
        this.editingProject = undefined;
      });
  }

  openCreate(): void {
    this.showCreateModal = true;
  }

  createProject(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    const company = this.authService.selectedCompany;
    const teamId = this.selectedTeam?.id;
    if (!company || !teamId) {
      return;
    }
    const { name, description } = this.createForm.value;
    if (!name || !description) {
      return;
    }
    this.companyDataService
      .createProject(company, { name, description, active: true, teamId })
      .subscribe(() => {
        this.createForm.reset();
        this.showCreateModal = false;
        this.storeProjectCount();
      });
  }

  deleteProject(project: Project): void {
    const company = this.authService.selectedCompany;
    const teamId = this.selectedTeam?.id;
    if (!company || !teamId) {
      return;
    }
    if (!confirm(`Delete project "${project.name}"?`)) {
      return;
    }
    this.companyDataService.deleteProject(company, teamId, project.id).subscribe(() => {
      this.latestProjects = this.latestProjects.filter((p) => p.id !== project.id);
    });
  }

  markIndicatorRead(): void {
    if (!this.selectedTeam || !this.authService.selectedCompany) {
      return;
    }
    const key = this.getProjectKey(this.authService.selectedCompany.id, this.selectedTeam.id);
    localStorage.setItem(key, String(this.latestProjects.length));
    this.showIndicator = false;
  }

  private evaluateMembership(): void {
    const user = this.authService.currentUser;
    if (!user || !this.selectedTeam) {
      this.canEdit = false;
      return;
    }
    this.canEdit =
      user.admin ||
      user.teams?.some((team) => team.id === this.selectedTeam?.id) ||
      false;
  }

  private evaluateProjectIndicator(projects: Project[]): void {
    if (!this.selectedTeam || !this.authService.selectedCompany) {
      this.showIndicator = false;
      return;
    }
    const key = this.getProjectKey(this.authService.selectedCompany.id, this.selectedTeam.id);
    const stored = localStorage.getItem(key);
    if (stored === null) {
      localStorage.setItem(key, String(projects.length));
      this.showIndicator = false;
      return;
    }
    this.showIndicator = Number(stored) < projects.length;
  }

  private storeProjectCount(): void {
    const company = this.authService.selectedCompany;
    const team = this.selectedTeam;
    if (!company || !team) {
      return;
    }
    const key = this.getProjectKey(company.id, team.id);
    this.companyDataService
      .projects$(company, team.id)
      .pipe(take(1))
      .subscribe((projects) => localStorage.setItem(key, String(projects.length)));
  }

  private getProjectKey(companyId: number, teamId: number): string {
    return `projects-${companyId}-${teamId}`;
  }
}
