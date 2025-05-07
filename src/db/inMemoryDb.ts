import { User } from '../models/user';

export class InMemoryDb {
  private users: User[] = [];

  async getAllUsers(): Promise<User[]> {
    return this.users;
  }

  async addUser(user: User): Promise<void> {
    this.users.push(user);
  }
}

export const db = new InMemoryDb();
