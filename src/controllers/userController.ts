import { ServerResponse } from 'http';
import { db } from '../db/inMemoryDb';
import { User } from '../models/user';

export const getAllUsers = async (res: ServerResponse) => {
  try {
    const users: User[] = await db.getAllUsers();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(users));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Internal server error' }));
  }
};
