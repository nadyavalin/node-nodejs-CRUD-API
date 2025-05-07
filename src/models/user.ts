import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export const createUser = (name: string, email: string): User => ({
  id: uuidv4(),
  name,
  email,
  createdAt: new Date(),
});
