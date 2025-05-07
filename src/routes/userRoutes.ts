import { IncomingMessage, ServerResponse } from 'http';
import { getAllUsers, getUserById, createUser } from '../controllers/userController';

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
  if (userIdMatch && method === 'GET') {
    const userId = userIdMatch[1];
    await getUserById(userId, res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Not found' }));
};
