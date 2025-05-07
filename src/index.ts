import http from 'http';
import dotenv from 'dotenv';
import { colorize } from './utils/colorize';
import { handleUserRoutes } from './routes/userRoutes';

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  await handleUserRoutes(req, res);
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(
    `${colorize('Server is running at ', 'green', ['bold'])}` +
      `${colorize(`http://localhost:${PORT}`, 'cyan', ['underline'])}`
  );
  console.log(
    `${colorize('Try GET ', 'yellow')}` +
      `${colorize(`http://localhost:${PORT}/api/users`, 'cyan', ['underline'])}` +
      `${colorize(' to fetch all users', 'yellow')}`
  );
});
