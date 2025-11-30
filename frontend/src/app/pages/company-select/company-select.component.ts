import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CompanyOption } from '../../models/company.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-company-select',
  templateUrl: './company-select.component.html',
  styleUrls: ['./company-select.component.css']
})
export class CompanySelectComponent {
  companyOptions: CompanyOption[] = [
  ];
  selectedCompanyId: number | null = null;
  notice = '';

  constructor(private authService: AuthService, private router: Router) {} 

  ngOnInit() {const user = this.authService.currentUser;

    if (!user || !user.companies) {
      this.router.navigate(['/login']);
      return;
    }

    this.companyOptions = user.companies
      .filter(company => company != null) // Filter out null/undefined
      .map(companySummary => ({
        id: companySummary.id,
        name: companySummary.name
      }));

    if (this.companyOptions.length === 1) {
      this.selectedCompanyId = this.companyOptions[0].id;
    }} 

  selectCompany(id: string): void {
    this.selectedCompanyId = Number(id);
    this.notice = '';
  }

  continue(): void {
    const option = this.companyOptions.find((company) => company.id === this.selectedCompanyId);
    if (!option) {
      this.notice = 'Please choose a company before proceeding.';
      return;
    }
    this.notice = '';
    this.authService.setSelectedCompany(option);
    this.router.navigate(['/home']);
  }
}
