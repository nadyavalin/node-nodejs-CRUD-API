import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  username: string;
  age: number;
  hobbies: string[];
}

export const createUser = (username: string, age: number, hobbies: string[]): User => ({
  id: uuidv4(),
  username,
  age,
  hobbies,
});
