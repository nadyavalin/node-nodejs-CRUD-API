import http from 'http';
import cluster from 'cluster';
import { availableParallelism } from 'os';
import dotenv from 'dotenv';
import { colorize } from './utils/colorize';
import { handleUserRoutes } from './routes/userRoutes';

dotenv.config();

const BASE_PORT = parseInt(process.env.PORT || '', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!BASE_PORT || isNaN(BASE_PORT)) {
  console.error(`${colorize('PORT is not defined or invalid in .env', 'red', ['bold'])}`);
  process.exit(1);
}

if (cluster.isPrimary && process.env.START_MULTI) {
  const NUM_WORKERS = availableParallelism() - 1;
  console.log(`${colorize(`Primary process: Forking ${NUM_WORKERS} workers`, 'yellow', ['bold'])}`);

  const workerPorts: Record<number, number> = {};

  for (let i = 0; i < NUM_WORKERS; i++) {
    const workerPort = BASE_PORT + i + 1;
    const worker = cluster.fork({ WORKER_PORT: workerPort.toString() });
    workerPorts[worker.process.pid!] = workerPort;
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(
      `${colorize(`Worker ${worker.process.pid} died with code ${code}, signal ${signal}`, 'red', ['bold'])}`
    );
    const workerPort = workerPorts[worker.process.pid!];
    if (workerPort) {
      console.log(`${colorize(`Forking new worker on port ${workerPort}`, 'yellow')}`);
      setTimeout(() => {
        const newWorker = cluster.fork({ WORKER_PORT: workerPort.toString() });
        workerPorts[newWorker.process.pid!] = workerPort;
        delete workerPorts[worker.process.pid!];
      }, 1000);
    } else {
      console.log(
        `${colorize(`Warning: No port found for worker ${worker.process.pid}`, 'yellow')}`
      );
    }
  });
} else {
  const PORT = process.env.START_MULTI ? parseInt(process.env.WORKER_PORT || '', 10) : BASE_PORT;

  if (!PORT || isNaN(PORT)) {
    console.error(
      `${colorize(`Invalid port for worker ${process.pid}: ${process.env.WORKER_PORT || process.env.PORT}`, 'red', ['bold'])}`
    );
    process.exit(1);
  }

  const server = http.createServer(async (req, res) => {
    await handleUserRoutes(req, res);
  });

  server.listen(PORT, () => {
    console.log(
      `${colorize(`Server is running on port ${PORT} in ${NODE_ENV} mode`, 'green', ['bold'])}`
    );
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

  server.on('error', (error: NodeJS.ErrnoException) => {
    console.error(
      `${colorize(`Worker ${process.pid} error on port ${PORT}: ${error.message}`, 'red', ['bold'])}`
    );
    if (error.code === 'EADDRINUSE') {
      console.error(
        `${colorize(`Port ${PORT} is already in use, worker ${process.pid} exiting`, 'red', ['bold'])}`
      );
      process.exit(1);
    }
  });
}
