# Lab 01 — Task Tracker API

> Module: **BEM30 — RESTful APIs with Express.js**
> Owner: Illona Addae (AmaliTech, Phase 2)
> Status: Planning complete, build pending

---

## 1. What we're building

A **Task Tracker REST API** in Node.js using Express.js. It exposes CRUD endpoints under `/api/tasks` for managing simple task records. Data lives in memory (an array on the running server) — no database in this lab. The lab is graded on routing, middleware, error handling, MVC structure, response format, and code quality.

Each task is shaped like:

```json
{ "id": 1, "title": "Buy groceries", "completed": false }
```

## 2. Learning objectives (what you should be able to explain after this lab)

1. How an Express app is constructed: `app.use`, `app.get/post/put/delete`, route order, and the request/response lifecycle.
2. What middleware is and why **order matters** (parser → logger → routes → 404 → error handler).
3. How `dotenv` injects environment variables into `process.env`.
4. Why we split code into **routes / controllers / models / middleware** (the MVC pattern) instead of one big file.
5. How to throw errors that flow into a single global error handler, instead of writing `try/catch` in every route.

## 3. Tech stack

| Tool        | Why                                                       |
| ----------- | --------------------------------------------------------- |
| Node.js LTS | Runtime                                                   |
| Express.js  | Web framework — routing + middleware                      |
| dotenv      | Load `.env` into `process.env`                            |
| nodemon     | Dev-only — auto-restarts the server on file save          |

CommonJS module system (`require` / `module.exports`). Do NOT use ESM (`import` / `export`) for this lab — keep the code style consistent with what the trainer is teaching.

## 4. Folder structure

```
lab-01-task-tracker-api/
├── .env                   # local config (NOT committed)
├── .env.example           # template config (committed)
├── .gitignore
├── package.json
├── README.md
├── CLAUDE.md              # this file
├── BUILD-PROMPTS.md       # the step-by-step build playbook (planning doc)
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

> The lab brief lists `/controllers`, `/routes`, `/middleware` as required folders. We add `/models` because that's the **M** in MVC — it keeps data-access code out of controllers and prepares us for the next lab when we add a database. We add `/utils` for the small `ApiError` helper class.

## 5. File responsibilities (single responsibility per file)

**`server.js`** — Load `.env`, create the Express app, mount middleware **in the correct order**, mount routes, and start the server with `app.listen`. This file should be small (~25–35 lines).

**`routes/taskRoutes.js`** — Uses `express.Router()`. Imports the controller. Maps each verb+path to a controller function. **Zero business logic.**

**`controllers/taskController.js`** — One exported function per endpoint: `getAllTasks`, `getTaskById`, `createTask`, `updateTask`, `deleteTask`. Validates inputs, calls the model, sends the response. Throws `ApiError` for any failure case — never sends an error response directly.

**`models/taskModel.js`** — Owns the private `tasks` array and `nextId` counter. Exports `findAll`, `findById`, `insert`, `update`, `remove`. Controllers never touch the array directly — only via these helpers.

**`middleware/logger.js`** — Single function that logs `[ISO timestamp] METHOD path` and calls `next()`.

**`middleware/notFound.js`** — Final route catch-all. Forwards a 404 `ApiError` to the error handler via `next(err)`.

**`middleware/errorHandler.js`** — 4-argument signature `(err, req, res, next)`. Reads `err.statusCode` (default 500), logs the error, returns a JSON error envelope.

**`utils/ApiError.js`** — `class ApiError extends Error` with a `statusCode` property. Lets controllers do `throw new ApiError(404, 'Task not found')` and have it converted into the right HTTP response automatically.

## 6. Endpoint contract

Base path: `/api/tasks`

| # | Method | Path             | Body                            | Success         | Errors                                   |
| - | ------ | ---------------- | ------------------------------- | --------------- | ---------------------------------------- |
| 1 | GET    | `/api/tasks`     | —                               | `200` array     | —                                        |
| 2 | GET    | `/api/tasks/:id` | —                               | `200` task      | `400` invalid id · `404` not found       |
| 3 | POST   | `/api/tasks`     | `{ title, completed? }`         | `201` task      | `400` invalid body                       |
| 4 | PUT    | `/api/tasks/:id` | `{ title?, completed? }`        | `200` task      | `400` invalid id/body · `404` not found  |
| 5 | DELETE | `/api/tasks/:id` | —                               | `204` no body   | `400` invalid id · `404` not found       |

Plus a healthcheck:

| Method | Path     | Returns                       |
| ------ | -------- | ----------------------------- |
| GET    | `/health` | `200 { "status": "ok" }`     |

## 7. Conventions

### 7.1 Validation

- `:id` is parsed with `Number(req.params.id)`. If the result is `NaN` → `400 Invalid task id`.
- `POST` body **must** include a non-empty string `title`. `completed` is optional and must be boolean if provided. Invalid body → `400`.
- `PUT` body must include **at least one** of `title` (non-empty string) or `completed` (boolean). Otherwise → `400`.

### 7.2 Response format

| Outcome  | Shape                                                                |
| -------- | -------------------------------------------------------------------- |
| Success  | The resource directly (e.g. the task object, or an array of tasks)   |
| Error    | `{ "error": { "message": "...", "status": <number> } }`              |

`DELETE` success returns `204 No Content` with **no body** — that's the REST convention for successful deletes.

### 7.3 Status codes

- `200` — successful GET / PUT
- `201` — successful POST (resource created)
- `204` — successful DELETE
- `400` — validation failure (bad input)
- `404` — resource or route not found
- `500` — unexpected server error (caught by global handler)

### 7.4 Error flow (this is the elegant bit)

Controllers should never call `res.status(404).json(...)` directly. Instead:

```js
throw new ApiError(404, 'Task not found');
```

Express catches synchronous throws in route handlers and forwards them to the error-handling middleware, which inspects `err.statusCode` and produces the JSON response. This keeps controllers focused on the happy path.

### 7.5 Code style

- One responsibility per file.
- Exported functions get a JSDoc comment (`@param`, `@returns`).
- No `console.log` debugging left in committed code (the logger middleware is the only intentional logging).
- Use `const` by default; `let` only when reassignment is needed.

## 8. Middleware order in `server.js`

This order is **not negotiable** — Express middleware runs top-down:

```
1. express.json()      // parse JSON bodies into req.body
2. logger              // log every request
3. /health route       // simple healthcheck
4. /api/tasks routes   // the real API
5. notFound            // anything unmatched → 404
6. errorHandler        // last — catches errors thrown anywhere above
```

If you put `errorHandler` before the routes, it will never see their errors. If you put `notFound` before the routes, every request will return 404. Order matters.

## 9. Acceptance criteria (mapped to the rubric)

| Rubric item                  | Weight | What satisfies it                                                                                |
| ---------------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| Project Setup                | 10%    | `npm start` works; `PORT` comes from `.env` via `dotenv`                                         |
| Routing & Parameters         | 20%    | All 5 CRUD routes exist with correct verbs, paths, and status codes                              |
| Middleware Usage             | 15%    | Custom logger, JSON parser, custom error handler, and 404 handler all wired up in correct order  |
| Error Handling               | 15%    | Invalid ids, missing/invalid bodies, and unknown routes all return clean JSON errors             |
| MVC Structure                | 15%    | `routes/`, `controllers/`, `models/`, `middleware/` folders each contain only their concern      |
| Response Format              | 10%    | Every response is JSON (except `204` deletes); status codes match the contract                   |
| Code Quality & Clarity       | 15%    | Single-purpose files, JSDoc on exports, README with setup + endpoint table, clean .gitignore     |

## 10. Out of scope (do NOT add these)

- Persistence (SQLite/MongoDB/Postgres) — next module.
- Authentication / users.
- Rate limiting, helmet, CORS, morgan — the brief asks for **custom** middleware; bringing in third-party security libs is out of scope here.
- Tests (Jest/supertest) — not in the rubric for this lab.
- TypeScript.

If a future requirement ever needs these, we'll add them in a later lab.
