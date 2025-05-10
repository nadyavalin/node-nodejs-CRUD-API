# Node.js CRUD API

This is a Node.js-based RESTful CRUD API for managing user records. The application supports creating, reading, updating, and deleting users, with data stored in a JSON file (`users.json`). It implements horizontal scaling using the Node.js Cluster API and a load balancer that distributes requests across multiple worker processes using the Round-robin algorithm.

## Features

- **CRUD Operations**: Create, read, update, and delete users via RESTful endpoints
- **Horizontal Scaling**: Runs multiple worker processes (based on `os.availableParallelism() - 1`) with a load balancer on `PORT` (default: 4000) and workers on `PORT + n` (e.g., 4001, 4002, ...)
- **Data Persistence**: Stores user data in `users.json` with synchronization across workers using a file-locking mechanism
- **Logging**: Shows requests and errors in the terminal in real time and logs them to `logs/app.log`
- **Testing**: Includes Jest tests for API endpoints

## Technical requirements due to the task assignment:

- Language: **TypeScript**
- **Node.js**: Version 22.x.x version (22.14.0 or upper)
- **Libraries / dependencies**: `nodemon`, `dotenv`, `cross-env`, `typescript`, `ts-node`, `ts-node-dev`, `eslint` and its plugins, `webpack-cli`, `webpack` and its plugins and loaders, `prettier`, `uuid`

## Other technical requirements:

- **npm**: Version 10.x or higher
- **Postman**: For testing API endpoints
- **Git**: For cloning the repository

## Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/nadyavalin/node-nodejs-CRUD-API.git
   ```

   ```bash
   cd node-nodejs-CRUD-API
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

   This installs all required dependencies listed in `package.json`.

3. **Set Up Environment Variables**:
   Create an `.env` file in the project root with the following content:

   ```plaintext
   PORT=4000
   NODE_ENV=development
   ```

   - `PORT`: The base port for the load balancer (default: 4000). Workers will use `PORT + 1`, `PORT + 2`, etc.
   - `NODE_ENV`: Set to `development` for local development or `production` for production.

4. **Initialize Data File**:
   The application automatically creates `src/data/users.json` (for development) and `dist/data/users.json` (for production) on first build if they don't exist.

## Running the Application

### Development Mode

Run the application in development mode with automatic restarts on code changes:

```bash
npm run start:dev
```

- The server runs on `http://localhost:4000` in single-process mode.
- Uses `ts-node-dev` for hot reloading.

### Production Mode (Single Process)

Build and run the application in production mode:

```bash
npm run start:prod
```

- Compiles TypeScript to JavaScript (`dist/`).
- Runs a single server instance on `http://localhost:4000`.

### Production Mode (Multi-Process with Load Balancer)

Run the application with horizontal scaling and load balancing:

```bash
npm run start:multi
```

- Compiles TypeScript to JavaScript.
- Starts a load balancer on `http://localhost:4000`.
- Forks worker processes (equal to `os.availableParallelism() - 1`) on ports `4001`, `4002`, etc.
- Example output (for 8 CPU cores):
  ```
  Load balancer is running on port http://localhost:4000
  Forwarding to workers on ports: 4001, 4002, 4003, 4004, 4005, 4006, 4007
  Primary process: Forking 7 workers
  Server is running on port 4001 in production mode
  ...
  Server is running on port 4007 in production mode
  ```

### Linting and Formatting

- Run linting:
  ```bash
  npm run lint
  npm run lint:fix
  ```
- Format code with Prettier:
  ```bash
  npm run format
  ```

### Running Tests

Run Jest tests to verify API functionality:

```bash
npm run test
```

- Tests use a separate `tests/data/test-users.json` file to avoid modifying production data.
- Expected output:
  ```
  PASS  tests/userApi.test.ts
  User API
    ✓ should return an empty array for GET /api/users when no users exist
    ✓ should create a new user with POST /api/users
    ✓ should get the created user by ID with GET /api/users/:id
    ✓ should update the created user with PUT /api/users/:id
    ✓ should delete the created user with DELETE /api/users/:id
    ✓ should return 404 for GET /api/users/:id after user deletion
  ```

## Using the API with Postman

The API provides endpoints for managing users. Below are instructions for testing **successful** and **unsuccessful** requests using Postman (for example). All requests should be sent to `http://localhost:4000/api` (the load balancer), which distributes them to worker processes.

### User Data Format

Users are stored in `users.json` with the following structure:

```json
{
  "id": "<uuid>",
  "username": "string",
  "age": number,
  "hobbies": ["string"]
}
```

### Endpoints

#### 1. GET /api/users

- **Description**: Retrieve all users.
- **Successful Request**:
  - **Method**: GET
  - **URL**: `http://localhost:4000/api/users`
  - **Headers**: None
  - **Expected Response**:
    - **Status**: 200 OK
    - **Body**:
      ```json
      [
        {
          "id": "<uuid>",
          "username": "Test User",
          "age": 25,
          "hobbies": ["reading"]
        }
      ]
      ```
- **Unsuccessful Request**:
  - Not applicable (endpoint always returns an array, empty if no users).

#### 2. GET /api/users/:id

- **Description**: Retrieve a user by ID.
- **Successful Request**:
  - **Method**: GET
  - **URL**: `http://localhost:4000/api/users/<valid-uuid>`
  - **Headers**: None
  - **Expected Response**:
    - **Status**: 200 OK
    - **Body**:
      ```json
      {
        "id": "<uuid>",
        "username": "Test User",
        "age": 25,
        "hobbies": ["reading"]
      }
      ```
- **Unsuccessful Request** (Invalid ID):
  - **URL**: `http://localhost:4000/api/users/invalid-id`
  - **Expected Response**:
    - **Status**: 400 Bad Request
    - **Body**:
      ```json
      {
        "message": "Invalid user ID"
      }
      ```
- **Unsuccessful Request** (Non-existent ID):
  - **URL**: `http://localhost:4000/api/users/<non-existent-uuid>`
  - **Expected Response**:
    - **Status**: 404 Not Found
    - **Body**:
      ```json
      {
        "message": "User not found"
      }
      ```

#### 3. POST /api/users

- **Description**: Create a new user.
- **Successful Request**:
  - **Method**: POST
  - **URL**: `http://localhost:4000/api/users`
  - **Headers**: `Content-Type: application/json`
  - **Body**:
    ```json
    {
      "username": "Test User",
      "age": 25,
      "hobbies": ["reading", "coding"]
    }
    ```
  - **Expected Response**:
    - **Status**: 201 Created
    - **Body**:
      ```json
      {
        "id": "<uuid>",
        "username": "Test User",
        "age": 25,
        "hobbies": ["reading", "coding"]
      }
      ```
- **Unsuccessful Request** (Invalid Data):
  - **Body**:
    ```json
    {
      "username": "",
      "age": "invalid",
      "hobbies": null
    }
    ```
  - **Expected Response**:
    - **Status**: 400 Bad Request
    - **Body**:
      ```json
      {
        "message": "Invalid user data"
      }
      ```

#### 4. PUT /api/users/:id

- **Description**: Update an existing user.
- **Successful Request**:
  - **Method**: PUT
  - **URL**: `http://localhost:4000/api/users/<valid-uuid>`
  - **Headers**: `Content-Type: application/json`
  - **Body**:
    ```json
    {
      "username": "Updated User",
      "age": 26,
      "hobbies": ["writing"]
    }
    ```
  - **Expected Response**:
    - **Status**: 200 OK
    - **Body**:
      ```json
      {
        "id": "<uuid>",
        "username": "Updated User",
        "age": 26,
        "hobbies": ["writing"]
      }
      ```
- **Unsuccessful Request** (Invalid ID):
  - **URL**: `http://localhost:4000/api/users/invalid-id`
  - **Expected Response**:
    - **Status**: 400 Bad Request
    - **Body**:
      ```json
      {
        "message": "Invalid user ID"
      }
      ```
- **Unsuccessful Request** (Non-existent ID):
  - **URL**: `http://localhost:4000/api/users/<non-existent-uuid>`
  - **Expected Response**:
    - **Status**: 404 Not Found
    - **Body**:
      ```json
      {
        "message": "User not found"
      }
      ```
- **Unsuccessful Request** (Invalid Data):
  - **Body**:
    ```json
    {
      "username": "",
      "age": "invalid",
      "hobbies": null
    }
    ```
  - **Expected Response**:
    - **Status**: 400 Bad Request
    - **Body**:
      ```json
      {
        "message": "Invalid user data"
      }
      ```

#### 5. DELETE /api/users/:id

- **Description**: Delete a user by ID.
- **Successful Request**:
  - **Method**: DELETE
  - **URL**: `http://localhost:4000/api/users/<valid-uuid>`
  - **Headers**: None
  - **Expected Response**:
    - **Status**: 204 No Content
    - **Body**: Empty
- **Unsuccessful Request** (Invalid ID):
  - **URL**: `http://localhost:4000/api/users/invalid-id`
  - **Expected Response**:
    - **Status**: 400 Bad Request
    - **Body**:
      ```json
      {
        "message": "Invalid user ID"
      }
      ```
- **Unsuccessful Request** (Non-existent ID):
  - **URL**: `http://localhost:4000/api/users/<non-existent-uuid>`
  - **Expected Response**:
    - **Status**: 404 Not Found
    - **Body**:
      ```json
      {
        "message": "User not found"
      }
      ```

### Simulating a Server Error

**Description:** To simulate an internal server error, you can temporarily modify the code to throw an unhandled error (for testing purposes only). For example, edit `src/controllers/userController.ts` to throw an error in createUser:

```ts
async createUser(req: IncomingMessage, res: ServerResponse): Promise<void> {
  throw new Error('Simulated server error');
}
```

1. **Rebuild the project**:

   ```bash
   npm run build
   ```

2. **Restart the server**:

   ```bash
   npm run start:multi
   ```

3. **Send a POST request**:

- **Method**: POST
- **URL**: `http://localhost:4000/api/users`
- **Body**:
  ```json
  {
    "username": "Test User",
    "age": 25,
    "hobbies": ["reading", "coding"]
  }
  ```
- **Expected Response**:
  - **Status**: 500 Internal Server Error
  - **Body**:
    ```json
    {
      "message": "Internal Server Error"
    }
    ```

### Testing Multi-Process Synchronization

To verify that user data is consistent across workers:

1. **Create a User**:
   - POST to `http://localhost:4000/api/users` (handled by, e.g., worker on port 4001).
2. **Retrieve the User**:
   - GET to `http://localhost:4000/api/users` (handled by, e.g., worker on port 4002).
   - The created user should appear.
3. **Delete the User**:
   - DELETE to `http://localhost:4000/api/users/<id>` (handled by, e.g., worker on port 4003).
4. **Verify Deletion**:
   - GET to `http://localhost:4000/api/users/<id>` (handled by, e.g., worker on port 4001).
   - Should return 404.

The load balancer uses Round-robin to distribute requests, and a file-locking mechanism ensures data consistency in `users.json`.

### Checking Logs

- **Application Logs**:
  ```bash
  cat logs/app.log
  ```
  Example:
  ```
  [2025-05-10TXX:XX:XX.XXXZ] [POST] /api/users Created user: id=..., username=Test User, age=25, hobbies=reading
  ```
- **Data File**:
  ```bash
  cat dist/data/users.json
  ```

## Project Structure

- `src/`: TypeScript source code.
  - `index.ts`: Main entry point for single-process mode.
  - `loadBalancer.ts`: Load balancer for multi-process mode.
  - `db/inMemoryDb.ts`: Manages user data in `users.json`.
  - `routes/userRoutes.ts`: Handles HTTP routes.
  - `controllers/userController.ts`: Business logic for CRUD operations.
  - `models/user.ts`: User data model.
- `dist/`: Compiled JavaScript output.
- `tests/`: Jest tests.
- `logs/`: Application logs.
- `src/data/` and `dist/data/`: Store `users.json`.
