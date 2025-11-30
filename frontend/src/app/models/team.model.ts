import { BasicUser } from './user.model';
import { Project } from './project.model';

export interface Team {
  id: number;
  name: string;
  description: string;
  teammates: BasicUser[];
  projects?: Project[];
}
