import { ServerResponse } from 'http';
import { InMemoryDb } from '../db/inMemoryDb';
import type { User } from '../models/user';
import { log } from '../utils/logger';

export const getAllUsers = async (res: ServerResponse, db: InMemoryDb) => {
  try {
    const users: User[] = await db.getAllUsers();

    await log('GET', '/api/users', `Fetched all users: count=${users.length}`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(users));
  } catch (error) {
    await log('GET', '/api/users', `Internal server error: ${error}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: `Internal server error` }));
  }
};
