import { ServerResponse } from 'http';
import { validate as validateUUID } from 'uuid';
import { db } from '../db/inMemoryDb';
import { User } from '../models/user';

export const getAllUsers = async (res: ServerResponse) => {
  try {
    const users: User[] = await db.getAllUsers();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(users));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: `Internal server error: ${error}` }));
  }
};

export const getUserById = async (userId: string, res: ServerResponse) => {
  try {
    if (!validateUUID(userId)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid userId' }));
      return;
    }

    const user = await db.getUserById(userId);
    if (!user) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'User not found' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(user));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: `Internal server error: ${error}` }));
  }
};
