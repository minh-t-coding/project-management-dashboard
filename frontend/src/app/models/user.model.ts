export interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface BasicUser {
  id: number;
  profile: Profile;
  admin: boolean;
  active: boolean;
  status: 'PENDING' | 'JOINED' | string;
}

export interface CompanySummary {
  id: number;
  name: string;
  description: string;
}

export interface TeamSummary {
  id: number;
  name: string;
  description: string;
}

export interface FullUser extends BasicUser {
  username?: string;
  companies?: CompanySummary[];
  teams?: TeamSummary[];
}

export type UserRole = 'admin' | 'worker';
