import path from 'path';
import fs from 'fs/promises';
import { type User } from '../models/user';

export class InMemoryDb {
  private users: User[] = [];
  private readonly filePath: string;

  constructor() {
    const nodeEnv = process.env.NODE_ENV || 'development';
    console.log(`InMemoryDb: NODE_ENV=${nodeEnv}`);
    const baseDir = nodeEnv === 'production' ? 'dist' : 'src';
    this.filePath = path.join(process.cwd(), baseDir, 'data', 'users.json');
    console.log(`InMemoryDb: filePath=${this.filePath}`);
    this.loadUsers();
  }

  private async loadUsers(): Promise<void> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      this.users = JSON.parse(data);
    } catch (error) {
      console.error(`Failed to load users.json, initializing with empty array: ${error}`);
      this.users = [];
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.writeFile(this.filePath, '[]');
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
    // throw new Error('Simulated database error');
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

  async deleteUser(id: string): Promise<void> {
    this.users = this.users.filter((user) => user.id !== id);
    await this.saveUsers();
  }
}

export const db = new InMemoryDb();
