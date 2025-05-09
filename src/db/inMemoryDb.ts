import path from 'path';
import fs from 'fs/promises';
import { readFileSync } from 'fs';
import { type User } from '../models/user';

export class InMemoryDb {
  private users: User[] = [];
  private readonly filePath: string;

  constructor() {
    this.filePath = path.resolve(__dirname, '../data/users.json');
    this.users = this.loadUsersSync();
  }

  private loadUsersSync(): User[] {
    try {
      const data = readFileSync(this.filePath, 'utf8');
      return JSON.parse(data) as User[];
    } catch (error) {
      console.warn(`Failed to load users.json, initializing with empty array: ${error}`);
      return [];
    }
  }

  private async saveUsers(): Promise<void> {
    try {
      await fs.writeFile(this.filePath, JSON.stringify(this.users, null, 2));
    } catch (error) {
      console.error(`Failed to save users to file: ${error}`);
    }
  }

  async getAllUsers(): Promise<User[]> {
    return this.users;
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.find((user) => user.id === id);
  }

  async addUser(user: User): Promise<void> {
    this.users.push(user);
    await this.saveUsers();
  }

  async updateUser(user: User): Promise<void> {
    const index = this.users.findIndex((u) => u.id === user.id);
    if (index !== -1) {
      this.users[index] = user;
      await this.saveUsers();
    }
  }
}

export const db = new InMemoryDb();
