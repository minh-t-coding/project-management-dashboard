import { BasicUser } from './user.model';

export interface Announcement {
  id: number;
  date: string;
  title: string;
  message: string;
  author: BasicUser;
}
