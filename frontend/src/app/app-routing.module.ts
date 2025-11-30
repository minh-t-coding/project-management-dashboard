import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { CompanySelectComponent } from './pages/company-select/company-select.component';
import { HomeComponent } from './pages/home/home.component';
import { TeamsComponent } from './pages/teams/teams.component';
import { TeamProjectsComponent } from './pages/team-projects/team-projects.component';
import { UsersComponent } from './pages/users/users.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { AuthGuard } from './guards/auth.guard';
import { CompanyGuard } from './guards/company.guard';
import { AdminGuard } from './guards/admin.guard';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  { path: 'select-company', component: CompanySelectComponent, canActivate: [AuthGuard] },
  { path: 'company', component: CompanySelectComponent, canActivate: [AuthGuard] },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard, CompanyGuard] },
  { path: 'teams', component: TeamsComponent, canActivate: [AuthGuard, CompanyGuard] },
  { path: 'teams/:id', component: TeamProjectsComponent, canActivate: [AuthGuard, CompanyGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'users', component: UsersComponent, canActivate: [AuthGuard, AdminGuard, CompanyGuard] },
  { path: '**', redirectTo: 'home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
