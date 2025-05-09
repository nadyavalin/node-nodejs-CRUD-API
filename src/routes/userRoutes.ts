import { IncomingMessage, ServerResponse } from 'http';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController';
import { log } from '../utils/logger';

export const handleUserRoutes = async (req: IncomingMessage, res: ServerResponse) => {
  const { url, method } = req;

  if (url === '/api/users' && method === 'GET') {
    await getAllUsers(res);
    return;
  }

  if (url === '/api/users' && method === 'POST') {
    await createUser(req, res);
    return;
  }

  const userIdMatch = url?.match(/^\/api\/users\/(.+)$/);
  if (userIdMatch) {
    const userId = userIdMatch[1];
    if (method === 'GET') {
      await getUserById(userId, res);
      return;
    }
    if (method === 'PUT') {
      await updateUser(userId, req, res);
      return;
    }
    if (method === 'DELETE') {
      await deleteUser(userId, res);
      return;
    }
  }

  await log(method || 'UNKNOWN', url || 'unknown', 'Requested non-existing resource');

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Resource not found' }));
};
