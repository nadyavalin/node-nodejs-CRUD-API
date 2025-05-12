import http from 'http';
import { AddressInfo } from 'net';
import { availableParallelism } from 'os';
import { fork } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';
import { colorize } from './utils/colorize';

dotenv.config();

const BASE_PORT = parseInt(process.env.PORT || '4000', 10);
const NUM_WORKERS = availableParallelism() - 1;
const WORKER_PORTS = Array.from({ length: NUM_WORKERS }, (_, i) => BASE_PORT + i + 1);

if (!BASE_PORT || isNaN(BASE_PORT)) {
  console.error(`${colorize('PORT is not defined or invalid in .env', 'red', ['bold'])}`);
  process.exit(1);
}

let currentWorkerIndex = 0;

const server = http.createServer((req, res) => {
  const workerPort = WORKER_PORTS[currentWorkerIndex];
  currentWorkerIndex = (currentWorkerIndex + 1) % NUM_WORKERS;

  const options: http.RequestOptions = {
    hostname: 'localhost',
    port: workerPort,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (error) => {
    console.error(
      `${colorize(`Load balancer error forwarding to port ${workerPort}: ${error.message}`, 'red', ['bold'])}`
    );
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Service unavailable' }));
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(BASE_PORT, () => {
  const address = server.address() as AddressInfo;
  console.log(
    `${colorize('Load balancer is running on port ', 'green', ['bold'])}` +
      `${colorize(`http://localhost:${address.port}`, 'cyan', ['underline'])}`
  );
  console.log(
    `${colorize(`Forwarding to workers on ports: ${WORKER_PORTS.join(', ')}`, 'yellow')}`
  );

  if (process.env.NODE_ENV === 'production') {
    const indexPath = path.join(__dirname, 'index.js');
    const child = fork(indexPath, [], {
      env: {
        ...process.env,
        START_MULTI: 'true',
      },
    });

    child.on('error', (error) => {
      console.error(`${colorize(`Failed to start workers: ${error.message}`, 'red', ['bold'])}`);
    });

    child.on('exit', (code, signal) => {
      console.log(
        `${colorize(`Worker process exited with code ${code}, signal ${signal}`, 'red', ['bold'])}`
      );
    });
  }
});

server.on('error', (error: NodeJS.ErrnoException) => {
  console.error(
    `${colorize(`Load balancer error on port ${BASE_PORT}: ${error.message}`, 'red', ['bold'])}`
  );
  if (error.code === 'EADDRINUSE') {
    console.error(
      `${colorize(`Port ${BASE_PORT} is already in use, load balancer exiting`, 'red', ['bold'])}`
    );
  }
  process.exit(1);
});
