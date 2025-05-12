import { ServerResponse } from 'http';
import { validate as validateUUID } from 'uuid';
import { InMemoryDb } from '../db/inMemoryDb';
import { log } from '../utils/logger';

export const deleteUser = async (userId: string, res: ServerResponse, db: InMemoryDb) => {
  try {
    if (!validateUUID(userId)) {
      await log(
        'DELETE',
        `/api/users/${userId}`,
        `Failed to delete user: invalid userId=${userId}`
      );
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Invalid userId' }));
      return;
    }

    const user = await db.getUserById(userId);
    if (!user) {
      await log(
        'DELETE',
        `/api/users/${userId}`,
        `Failed to delete user: user not found, id=${userId}`
      );
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'User not found' }));
      return;
    }

    await db.deleteUser(userId);

    await log('DELETE', `/api/users/${userId}`, `Deleted user: id=${userId}`);

    res.writeHead(204, { 'Content-Type': 'application/json' });
    res.end();
  } catch (error) {
    await log('DELETE', `/api/users/${userId}`, `Internal server error: ${error}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: `Internal server error` }));
  }
};
