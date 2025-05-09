import http from 'http';
import dotenv from 'dotenv';
import { colorize } from './utils/colorize';
import { handleUserRoutes } from './routes/userRoutes';

dotenv.config();

const PORT = process.env.PORT;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!PORT || isNaN(parseInt(PORT, 10))) {
  console.error('PORT is not defined or invalid in .env');
  process.exit(1);
}

const portNumber = parseInt(PORT, 10);

const server = http.createServer(async (req, res) => {
  await handleUserRoutes(req, res);
});

server.listen(portNumber, () => {
  console.log(`Server is running on port ${portNumber} in ${NODE_ENV} mode`);
  console.log(
    `${colorize('Server is running at ', 'green', ['bold'])}` +
      `${colorize(`http://localhost:${portNumber}`, 'cyan', ['underline'])}`
  );
  console.log(
    `${colorize('Try GET ', 'yellow')}` +
      `${colorize(`http://localhost:${portNumber}/api/users`, 'cyan', ['underline'])}` +
      `${colorize(' to fetch all users', 'yellow')}`
  );
});
