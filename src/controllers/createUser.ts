import { IncomingMessage, ServerResponse } from 'http';
import { InMemoryDb } from '../db/inMemoryDb';
import { createUser as createUserModel } from '../models/user';
import { log } from '../utils/logger';

export const createUser = async (req: IncomingMessage, res: ServerResponse, db: InMemoryDb) => {
  try {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      let parsedBody: { username?: string; age?: number; hobbies?: string[] };
      try {
        parsedBody = JSON.parse(body);
      } catch (error) {
        await log('POST', '/api/users', `Failed to create user: invalid JSON format: ${error}`);
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
        await log(
          'POST',
          '/api/users',
          `Invalid user data: Username (string), age (integer), and hobbies (array) are required`
        );
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
          'POST',
          '/api/users',
          `Failed to create user: hobbies must be an array of strings`
        );
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Hobbies must be an array of strings' }));
        return;
      }

      const newUser = createUserModel(username.trim(), age, hobbies);
      await db.addUser(newUser);

      await log(
        req.method || 'POST',
        req.url,
        `Created user: id=${newUser.id}, username=${newUser.username}, age=${newUser.age}, hobbies=${newUser.hobbies.join(', ')}`
      );

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newUser));
    });
  } catch (error) {
    await log('POST', '/api/users', `Internal server error: ${error}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: `Internal server error` }));
  }
};
