import { IncomingMessage, ServerResponse } from 'http';
import { validate as validateUUID } from 'uuid';
import { InMemoryDb } from '../db/inMemoryDb';
import type { User } from '../models/user';
import { log } from '../utils/logger';

export const updateUser = async (
  userId: string,
  req: IncomingMessage,
  res: ServerResponse,
  db: InMemoryDb
) => {
  try {
    if (!validateUUID(userId)) {
      await log('PUT', `/api/users/${userId}`, `Failed to update user: invalid userId=${userId}`);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid userId' }));
      return;
    }

    const user = await db.getUserById(userId);
    if (!user) {
      await log(
        'PUT',
        `/api/users/${userId}`,
        `Failed to update user: user not found, id=${userId}`
      );
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'User not found' }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      let parsedBody: { username?: string; age?: number; hobbies?: string[] };
      try {
        parsedBody = JSON.parse(body);
      } catch (error) {
        await log(
          'PUT',
          `/api/users/${userId}`,
          `Failed to update user: invalid JSON format: ${error}`
        );
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: `Invalid JSON format: ${error}` }));
        return;
      }

      const { username, age, hobbies } = parsedBody;

      if (
        !username ||
        typeof username !== 'string' ||
        username.trim() === '' ||
        age === undefined ||
        typeof age !== 'number' ||
        !Number.isInteger(age) ||
        age < 0 ||
        !Array.isArray(hobbies)
      ) {
        await log('PUT', `/api/users/${userId}`, `Failed to update user: invalid data`);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            message:
              'Invalid user data: Username (string), age (integer), and hobbies (array) are required',
          })
        );
        return;
      }

      if (!hobbies.every((hobby) => typeof hobby === 'string')) {
        await log(
          'PUT',
          `/api/users/${userId}`,
          `Failed to update user: hobbies must be an array of strings`
        );
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Hobbies must be an array of strings' }));
        return;
      }

      const updatedUser: User = {
        id: userId,
        username: username.trim(),
        age,
        hobbies,
      };

      await db.updateUser(updatedUser);

      await log(
        req.method || 'PUT',
        req.url,
        `Updated user: id=${updatedUser.id}, username=${updatedUser.username}, age=${updatedUser.age}, hobbies=${updatedUser.hobbies.join(', ')}`
      );

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(updatedUser));
    });
  } catch (error) {
    await log('PUT', `/api/users/${userId}`, `Internal server error: ${error}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: `Internal server error` }));
  }
};
