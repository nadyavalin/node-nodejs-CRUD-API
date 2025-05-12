import { ServerResponse } from 'http';
import { validate as validateUUID } from 'uuid';
import { InMemoryDb } from '../db/inMemoryDb';
import { log } from '../utils/logger';

export const getUserById = async (userId: string, res: ServerResponse, db: InMemoryDb) => {
  try {
    if (!validateUUID(userId)) {
      await log('GET', `/api/users/${userId}`, `Failed to fetch user: invalid userId=${userId}`);

      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid userId' }));
      return;
    }

    const user = await db.getUserById(userId);
    if (!user) {
      await log(
        'GET',
        `/api/users/${userId}`,
        `Failed to fetch user: user not found, id=${userId}`
      );

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'User not found' }));
      return;
    }

    await log(
      'GET',
      `/api/users/${userId}`,
      `Fetched user: id=${userId}, username=${user.username}, age=${user.age}, hobbies=${user.hobbies.join(', ')}`
    );

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(user));
  } catch (error) {
    await log('GET', `/api/users/${userId}`, `Internal server error: ${error}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: `Internal server error` }));
  }
};
