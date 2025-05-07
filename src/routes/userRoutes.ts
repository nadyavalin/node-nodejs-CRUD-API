import { IncomingMessage, ServerResponse } from 'http';
import { getAllUsers } from '../controllers/userController';

export const handleUserRoutes = async (req: IncomingMessage, res: ServerResponse) => {
  const { url, method } = req;

  if (url === '/api/users' && method === 'GET') {
    await getAllUsers(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Not found' }));
  }
};
