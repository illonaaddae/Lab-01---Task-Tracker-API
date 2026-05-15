# Task Tracker API

A small REST API built with Node.js and Express.js for **BEM30 Lab 01 — RESTful APIs with Express.js**. It exposes CRUD endpoints under `/api/tasks` for managing simple task records (id, title, completed). Data lives in memory on the running server — there is no database in this lab, so anything you create is lost when the server restarts.

## Tech Stack

- **Node.js (LTS)** — JavaScript runtime
- **Express.js** — web framework providing routing and the middleware pipeline
- **dotenv** — loads variables from `.env` into `process.env`
- **nodemon** *(dev only)* — auto-restarts the server on file save

## Setup

1. Clone the repo
   ```bash
   git clone https://github.com/illonaaddae/Lab-01---Task-Tracker-API.git
   ```
2. Move into the project folder
   ```bash
   cd Lab-01---Task-Tracker-API
   ```
3. Install dependencies
   ```bash
   npm install
   ```
4. Copy the env template
   ```bash
   cp .env.example .env
   ```
5. Start the server
   ```bash
   npm run dev    # development with auto-reload
   # or
   npm start      # plain node
   ```

The server listens on the port defined in `.env` (default `3000`).

## Project Structure

```
lab-01-task-tracker-api/
├── .env                   # local config (NOT committed)
├── .env.example           # template config (committed)
├── .gitignore
├── package.json
├── README.md
├── server.js              # entry point — wires everything together
├── routes/
│   └── taskRoutes.js      # maps HTTP verbs+paths to controller functions
├── controllers/
│   └── taskController.js  # request validation + calls into the model
├── models/
│   └── taskModel.js       # in-memory tasks array + data-access helpers
├── middleware/
│   ├── logger.js          # custom request logger
│   ├── notFound.js        # 404 catch-all
│   └── errorHandler.js    # global error handler (4-arg)
└── utils/
    └── ApiError.js        # custom Error subclass that carries an HTTP status
```

## API Endpoints

Base path: `/api/tasks`

| Method | Path             | Body                            | Success         | Errors                                   |
| ------ | ---------------- | ------------------------------- | --------------- | ---------------------------------------- |
| GET    | `/api/tasks`     | —                               | `200` array     | —                                        |
| GET    | `/api/tasks/:id` | —                               | `200` task      | `400` invalid id · `404` not found       |
| POST   | `/api/tasks`     | `{ title, completed? }`         | `201` task      | `400` invalid body                       |
| PUT    | `/api/tasks/:id` | `{ title?, completed? }`        | `200` task      | `400` invalid id/body · `404` not found  |
| DELETE | `/api/tasks/:id` | —                               | `204` no body   | `400` invalid id · `404` not found       |

Plus a healthcheck:

| Method | Path      | Returns                  |
| ------ | --------- | ------------------------ |
| GET    | `/health` | `200 { "status": "ok" }` |

## Example Requests

```bash
# Healthcheck
curl -i http://localhost:3000/health

# List tasks
curl -i http://localhost:3000/api/tasks

# Create a task
curl -i -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Express"}'

# Get one task
curl -i http://localhost:3000/api/tasks/1

# Update a task
curl -i -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# Delete a task
curl -i -X DELETE http://localhost:3000/api/tasks/1
```

## Error Format

Every error response uses a single JSON envelope:

```json
{
  "error": {
    "message": "Task not found",
    "status": 404
  }
}
```

`DELETE` success responses return `204 No Content` with no body — this is the REST convention for successful deletes.

## Notes

Tasks are kept in an in-memory array inside `models/taskModel.js`. Restarting the server (manually or via `nodemon`) clears all tasks and resets the id counter. Adding real persistence (SQLite, MongoDB, Postgres) is out of scope for this lab and will be covered in a later module.
