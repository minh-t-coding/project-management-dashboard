import { Announcement } from './announcement.model';
import { BasicUser } from './user.model';
import { Team } from './team.model';

export interface Company {
  id: number;
  name: string;
  description: string;
  teams?: Team[];
  employees?: BasicUser[];
  announcements?: Announcement[];
}

export interface CompanyOption {
  id: number;
  name: string;
}
