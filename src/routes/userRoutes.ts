import { IncomingMessage, ServerResponse } from 'http';
import { getAllUsers, getUserById, createUser, updateUser } from '../controllers/userController';

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
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Not found' }));
};
