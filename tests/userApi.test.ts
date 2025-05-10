import http from 'http';
import { AddressInfo } from 'net';
import { handleUserRoutes } from '../src/routes/userRoutes';
import { InMemoryDb } from '../src/db/inMemoryDb';
import fs from 'fs/promises';
import path from 'path';
import { User } from '../src/models/user';

type ResponseBody = User | User[] | { message: string } | Record<string, never>;

interface HttpResponse {
  status: number;
  body: ResponseBody;
}

let server: http.Server;
let testDb: InMemoryDb;

async function makeRequest(method: string, path: string, body?: any): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const address = server.address();
    if (!address || typeof address === 'string') {
      reject(new Error('Server address is not available'));
      return;
    }

    const options: http.RequestOptions = {
      hostname: 'localhost',
      port: (address as AddressInfo).port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      } as http.OutgoingHttpHeaders,
    };

    if (body) {
      const bodyString = JSON.stringify(body);
      (options.headers as http.OutgoingHttpHeaders)['Content-Length'] =
        Buffer.byteLength(bodyString);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const response: HttpResponse = {
          status: res.statusCode || 500,
          body: data ? JSON.parse(data) : {},
        };
        resolve(response);
      });
    });

    req.on('error', (error) => reject(error));

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

describe('User API', () => {
  beforeAll(async () => {
    process.env.TEST_INVOCATION = 'true';
    process.env.TEST_DB_PATH = path.join(__dirname, 'data', 'test-users.json');
    await fs.mkdir(path.dirname(process.env.TEST_DB_PATH), { recursive: true });
    await fs.writeFile(process.env.TEST_DB_PATH, '[]');

    testDb = new InMemoryDb();

    server = http.createServer(async (req, res) => {
      await handleUserRoutes(req, res, testDb);
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => resolve());
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));

    if (process.env.TEST_DB_PATH) {
      await fs.unlink(process.env.TEST_DB_PATH).catch(() => {});
      delete process.env.TEST_DB_PATH;
      delete process.env.TEST_INVOCATION;
    }
  });

  beforeEach(async () => {
    await fs.writeFile(process.env.TEST_DB_PATH!, '[]');
    await testDb.resetUsers();
  });

  it('should return an empty array for GET /api/users when no users exist', async () => {
    const response = await makeRequest('GET', '/api/users');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should create a new user with POST /api/users', async () => {
    const newUser = {
      username: 'John Doe',
      age: 30,
      hobbies: ['reading', 'gaming'],
    };

    const response = await makeRequest('POST', '/api/users', newUser);
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      username: newUser.username,
      age: newUser.age,
      hobbies: newUser.hobbies,
    });
  });

  it('should get the created user by ID with GET /api/users/:id', async () => {
    const newUser = {
      username: 'Jane Doe',
      age: 25,
      hobbies: ['painting'],
    };

    const postResponse = await makeRequest('POST', '/api/users', newUser);
    const userId = (postResponse.body as User).id;

    const response = await makeRequest('GET', `/api/users/${userId}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: userId,
      username: newUser.username,
      age: newUser.age,
      hobbies: newUser.hobbies,
    });
  });

  it('should update the created user with PUT /api/users/:id', async () => {
    const newUser = {
      username: 'John Doe',
      age: 30,
      hobbies: ['reading'],
    };

    const postResponse = await makeRequest('POST', '/api/users', newUser);
    const userId = (postResponse.body as User).id;

    const updatedUser = {
      username: 'John Updated',
      age: 31,
      hobbies: ['reading', 'traveling'],
    };

    const response = await makeRequest('PUT', `/api/users/${userId}`, updatedUser); // Исправлен URL
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: userId,
      username: updatedUser.username,
      age: updatedUser.age,
      hobbies: updatedUser.hobbies,
    });
  });

  it('should delete the created user with DELETE /api/users/:id', async () => {
    const newUser = {
      username: 'John Doe',
      age: 30,
      hobbies: ['gaming'],
    };

    const postResponse = await makeRequest('POST', '/api/users', newUser);
    const userId = (postResponse.body as User).id;

    const response = await makeRequest('DELETE', `/api/users/${userId}`);
    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });

  it('should return 404 for GET /api/users/:id after user deletion', async () => {
    const newUser = {
      username: 'Jane Doe',
      age: 25,
      hobbies: ['painting'],
    };

    const postResponse = await makeRequest('POST', '/api/users', newUser);
    const userId = (postResponse.body as User).id;

    await makeRequest('DELETE', `/api/users/${userId}`);

    const response = await makeRequest('GET', `/api/users/${userId}`);
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'User not found' });
  });
});
