import { IncomingMessage, ServerResponse } from 'http';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController';
import { InMemoryDb } from '../db/inMemoryDb';
import { db } from '../db/inMemoryDb';
import { log } from '../utils/logger';

export const handleUserRoutes = async (
  req: IncomingMessage,
  res: ServerResponse,
  customDb: InMemoryDb = db
) => {
  const { url, method } = req;

  if (url === '/api/users' && method === 'GET') {
    await getAllUsers(res, customDb);
    return;
  }

  if (url === '/api/users' && method === 'POST') {
    await createUser(req, res, customDb);
    return;
  }

  const userIdMatch = url?.match(/^\/api\/users\/(.+)$/);
  if (userIdMatch) {
    const userId = userIdMatch[1];
    if (method === 'GET') {
      await getUserById(userId, res, customDb);
      return;
    }
    if (method === 'PUT') {
      await updateUser(userId, req, res, customDb);
      return;
    }
    if (method === 'DELETE') {
      await deleteUser(userId, res, customDb);
      return;
    }
  }

  await log(method || 'UNKNOWN', url || 'unknown', 'Requested non-existing resource');

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Resource not found' }));
};
