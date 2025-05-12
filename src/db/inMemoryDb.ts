import path from 'path';
import fs from 'fs/promises';
import { type User } from '../models/user';

export class InMemoryDb {
  private users: User[] = [];
  private readonly filePath: string;
  private readonly lockPath: string;

  constructor() {
    const nodeEnv = process.env.NODE_ENV || 'development';
    if (process.env.TEST_INVOCATION) {
      this.filePath = path.join(process.cwd(), 'tests', 'data', 'test-users.json');
    } else if (nodeEnv === 'production') {
      this.filePath = path.join(process.cwd(), 'dist', 'data', 'users.json');
    } else {
      this.filePath = path.join(process.cwd(), 'src', 'data', 'users.json');
    }
    this.lockPath = `${this.filePath}.lock`;
    this.loadUsers();
  }

  private async loadUsers(): Promise<void> {
    try {
      await fs.access(this.filePath);
      const data = await fs.readFile(this.filePath, 'utf-8');
      this.users = JSON.parse(data);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error(`Failed to load users.json: ${error}`);
      }
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

  private async withLock<T>(operation: () => Promise<T>): Promise<T> {
    const maxRetries = 10;
    const retryDelay = 100;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await fs.access(this.lockPath);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        continue;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.error(`Unexpected error checking lock file ${this.lockPath}: ${error}`);
        }
        try {
          await fs.writeFile(this.lockPath, '', { flag: 'wx' });
          try {
            return await operation();
          } finally {
            await fs.unlink(this.lockPath).catch((err) => {
              console.error(`Failed to remove lock file ${this.lockPath}: ${err}`);
            });
          }
        } catch (lockError) {
          if ((lockError as NodeJS.ErrnoException).code !== 'EEXIST') {
            console.error(`Failed to create lock file ${this.lockPath}: ${lockError}`);
          }
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }

    throw new Error(`Failed to acquire lock for ${this.lockPath} after ${maxRetries} attempts`);
  }

  async getAllUsers(): Promise<User[]> {
    return this.withLock(async () => {
      await this.loadUsers();
      return this.users;
    });
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.withLock(async () => {
      await this.loadUsers();
      return this.users.find((user) => user.id === id);
    });
  }

  async addUser(user: User): Promise<void> {
    return this.withLock(async () => {
      await this.loadUsers();
      this.users.push(user);
      await this.saveUsers();
    });
  }

  async updateUser(user: User): Promise<void> {
    return this.withLock(async () => {
      await this.loadUsers();
      const index = this.users.findIndex((u) => u.id === user.id);
      if (index !== -1) {
        this.users[index] = user;
        await this.saveUsers();
      }
    });
  }

  async deleteUser(id: string): Promise<void> {
    return this.withLock(async () => {
      await this.loadUsers();
      this.users = this.users.filter((user) => user.id !== id);
      await this.saveUsers();
    });
  }

  async resetUsers(): Promise<void> {
    return this.withLock(async () => {
      this.users = [];
      await this.saveUsers();
    });
  }
}

export const db = new InMemoryDb();
