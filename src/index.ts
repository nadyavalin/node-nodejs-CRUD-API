import http from 'http';
import dotenv from 'dotenv';
import { handleUserRoutes } from './routes/userRoutes';

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  await handleUserRoutes(req, res);
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`Try GET http://localhost:${PORT}/api/users to fetch all users`);
});
