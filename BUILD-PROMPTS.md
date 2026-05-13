# Build Playbook — Lab 01 Task Tracker API

This is **your** reference doc, Illona. It walks you through building the API in 10 ordered steps. Each step has:

- **Goal** — what this step accomplishes
- **Concepts** — what you should understand by the end (this is the learning part)
- **Prompt** — a copy-paste-ready prompt to feed Claude Code in VS Code
- **Verify** — how to check it actually works before moving on
- **Reflect** — a question or two to make sure you understand what just happened

> Workflow each step:
> 1. Open this folder in VS Code (`code .` from inside `lab-01-task-tracker-api/`).
> 2. Open the Claude Code panel.
> 3. Copy the **Prompt** block of the current step and paste it into Claude Code.
> 4. When Claude Code finishes, read the diff before accepting — don't just click accept.
> 5. Run the **Verify** check. If it fails, paste the failure back to me here in Cowork and we'll diagnose together.
> 6. Answer the **Reflect** question to yourself. If you can't, ask me to explain.

The full project spec lives in `CLAUDE.md` in this folder — Claude Code reads that automatically, so you don't need to paste it into every prompt.

---

## Step 1 — Initialize the project

**Goal:** Set up `package.json`, install dependencies, create empty folders, and write the env files.

**Concepts:**
- `npm init` and what `package.json` is for (dependencies, scripts, metadata).
- Difference between `dependencies` (needed at runtime) and `devDependencies` (needed only while developing, like `nodemon`).
- Why `.env` is gitignored but `.env.example` is committed.
- Why `node_modules/` is always gitignored.

**Prompt to paste into Claude Code:**

```
Initialize the Task Tracker API project according to CLAUDE.md.

Do exactly the following, in order:

1. Run `npm init -y` to create package.json.

2. Edit package.json:
   - Set "name" to "task-tracker-api".
   - Set "main" to "server.js".
   - Set "description" to "Lab 01 - RESTful Task Tracker API for BEM30".
   - Replace the default "scripts" object with:
       "start": "node server.js"
       "dev": "nodemon server.js"
       "test": "echo \"No tests yet\" && exit 0"

3. Install runtime dependencies:
   npm install express dotenv

4. Install dev dependencies:
   npm install --save-dev nodemon

5. Create these empty folders: routes, controllers, models, middleware, utils

6. Create .env at the project root with this content:
       PORT=3000

7. Create .env.example at the project root with the same content as .env.
   This is the template that gets committed; .env stays local.

8. Create .gitignore at the project root with:
       node_modules/
       .env
       .DS_Store
       *.log
       .vscode/
       .idea/

DO NOT write any source code yet — we are only scaffolding. Stop after this step.
```

**Verify:**
- `package.json` exists and has `express`, `dotenv` under dependencies and `nodemon` under devDependencies.
- `node_modules/` exists.
- `.env`, `.env.example`, `.gitignore` exist.
- The five empty folders exist.

**Reflect:** Why is `.env` in `.gitignore` but `.env.example` is not?

---

## Step 2 — Bootstrap the server

**Goal:** Get a minimal Express server running on the port from `.env`, with one healthcheck route to prove it's alive.

**Concepts:**
- `require('dotenv').config()` must run **before** you read `process.env.PORT`.
- `express()` creates the app instance.
- `app.get(path, handler)` registers a route.
- `app.listen(port, callback)` starts the HTTP server.

**Prompt to paste into Claude Code:**

```
Create server.js as the entry point for the Task Tracker API per CLAUDE.md.

The file must:

1. Load environment variables from .env at the very top:
       require('dotenv').config();

2. Import express and create the app:
       const express = require('express');
       const app = express();

3. Add a single GET /health route that responds with:
       res.status(200).json({ status: 'ok' });

4. Read the port from process.env.PORT, falling back to 3000.

5. Call app.listen(port, ...) and log:
       `Server running on http://localhost:${port}`

Use CommonJS (require / module.exports). Do NOT add any other middleware, routes, or imports yet — those come in later steps. Keep the file short (under 25 lines).
```

**Verify:**
```bash
npm run dev
# In another terminal:
curl -i http://localhost:3000/health
```
You should see `HTTP/1.1 200 OK` and the body `{"status":"ok"}`. Stop the server with Ctrl+C when done.

**Reflect:** What would happen if you put `require('dotenv').config()` AFTER `const port = process.env.PORT`? Try it and see.

---

## Step 3 — Add the JSON parser and the custom logger middleware

**Goal:** Every request should now be logged to the terminal, and `req.body` should be auto-parsed for JSON requests.

**Concepts:**
- Middleware is just a function `(req, res, next) => {}`. It can read or modify the request, then must call `next()` to pass control on (or `next(err)` to jump to the error handler).
- `express.json()` is built-in middleware that reads the request body, parses JSON, and attaches it to `req.body`.
- Middleware runs in the **order it's registered**.

**Prompt to paste into Claude Code:**

```
Add the JSON parser and a custom request logger middleware per CLAUDE.md.

1. Create middleware/logger.js. Export a single function:

   /**
    * Logs every incoming request as: [<ISO timestamp>] METHOD path
    * @param {import('express').Request} req
    * @param {import('express').Response} res
    * @param {import('express').NextFunction} next
    */
   function logger(req, res, next) {
     const timestamp = new Date().toISOString();
     console.log(`[${timestamp}] ${req.method} ${req.path}`);
     next();
   }

   module.exports = logger;

2. In server.js, BEFORE the /health route, add:

       const logger = require('./middleware/logger');
       app.use(express.json());
       app.use(logger);

   Order matters: parser first, then logger.

Do not add anything else.
```

**Verify:**
- Start the server, hit `GET /health`, and confirm a line like `[2026-05-10T...] GET /health` prints in the server terminal.
- Hit a missing route like `curl http://localhost:3000/anything` and confirm it's also logged.

**Reflect:** What's the difference between `app.use(logger)` and `app.get('/foo', logger)`? When does each one run?

---

## Step 4 — Build the in-memory task model

**Goal:** Create the data layer. The model owns the tasks array; controllers will only touch the array via these helper functions.

**Concepts:**
- **Encapsulation:** the array is module-scoped (declared inside the file, not exported), so other files can't mutate it directly.
- A self-contained model module is easy to swap out later when we replace it with a database — controllers won't have to change.

**Prompt to paste into Claude Code:**

```
Create the in-memory task model at models/taskModel.js per CLAUDE.md.

Requirements:

1. Inside the file (NOT exported), declare:
       const tasks = [];
       let nextId = 1;

2. Export these five functions with JSDoc comments:

   findAll() — returns a shallow copy of the tasks array.

   findById(id) — returns the task with that id, or undefined if not found.

   insert({ title, completed }) — assigns id = nextId++, pushes
   { id, title, completed: !!completed } onto tasks, returns the new task.

   update(id, partial) — finds the task; if not found, returns null;
   otherwise applies the partial fields (only title and/or completed)
   and returns the updated task.

   remove(id) — removes the task with that id; returns true if removed,
   false if not found.

3. Export with module.exports = { findAll, findById, insert, update, remove }.

Keep the file pure data-access — no Express, no req/res, no validation logic.
```

**Verify:** No runtime check yet — we'll exercise this through the controller in the next steps.

**Reflect:** Why do we return a *copy* of `tasks` from `findAll` instead of the array itself?

---

## Step 5 — Create the ApiError utility

**Goal:** A small custom Error class that carries an HTTP status code. This is the magic that lets controllers `throw` instead of writing response code for every failure.

**Concepts:**
- ES6 classes can extend `Error`.
- Custom error classes let downstream code (the global error handler) inspect and react to error types.

**Prompt to paste into Claude Code:**

```
Create utils/ApiError.js per CLAUDE.md.

Contents:

/**
 * Error class that carries an HTTP status code.
 * Throw inside controllers; the global error handler reads statusCode.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode HTTP status (e.g. 400, 404, 500)
   * @param {string} message    User-facing error message
   */
  constructor(statusCode, message) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

module.exports = ApiError;
```

**Verify:** No runtime check yet — used by the controller in Step 6.

**Reflect:** Why extend `Error` instead of just creating a plain object with `{ statusCode, message }`?

---

## Step 6 — Build the task controller

**Goal:** Write the five CRUD handler functions with input validation. They throw `ApiError` for any failure case.

**Concepts:**
- Controllers handle one thing each. They validate, call the model, send a response.
- Express catches synchronous `throw` inside route handlers and forwards to the error handler. (Async handlers need `next(err)` or wrappers — but our controllers are sync.)
- The validation rules come straight from CLAUDE.md §7.1.

**Prompt to paste into Claude Code:**

```
Create controllers/taskController.js per CLAUDE.md.

Imports:
  const taskModel = require('../models/taskModel');
  const ApiError = require('../utils/ApiError');

Helper (private to this file) for parsing :id:
  function parseId(raw) {
    const id = Number(raw);
    if (Number.isNaN(id)) {
      throw new ApiError(400, 'Invalid task id');
    }
    return id;
  }

Export these five handler functions, each with a JSDoc comment:

1. getAllTasks(req, res)
   - res.status(200).json(taskModel.findAll())

2. getTaskById(req, res)
   - const id = parseId(req.params.id)
   - const task = taskModel.findById(id)
   - if (!task) throw new ApiError(404, 'Task not found')
   - res.status(200).json(task)

3. createTask(req, res)
   - const { title, completed } = req.body || {}
   - if (typeof title !== 'string' || title.trim() === '') throw new ApiError(400, 'Title is required and must be a non-empty string')
   - if (completed !== undefined && typeof completed !== 'boolean') throw new ApiError(400, 'completed must be a boolean')
   - const created = taskModel.insert({ title: title.trim(), completed: completed ?? false })
   - res.status(201).json(created)

4. updateTask(req, res)
   - const id = parseId(req.params.id)
   - const { title, completed } = req.body || {}
   - const partial = {}
   - if (title !== undefined) {
       if (typeof title !== 'string' || title.trim() === '') throw new ApiError(400, 'title must be a non-empty string')
       partial.title = title.trim()
     }
   - if (completed !== undefined) {
       if (typeof completed !== 'boolean') throw new ApiError(400, 'completed must be a boolean')
       partial.completed = completed
     }
   - if (Object.keys(partial).length === 0) throw new ApiError(400, 'Provide at least one of: title, completed')
   - const updated = taskModel.update(id, partial)
   - if (!updated) throw new ApiError(404, 'Task not found')
   - res.status(200).json(updated)

5. deleteTask(req, res)
   - const id = parseId(req.params.id)
   - const ok = taskModel.remove(id)
   - if (!ok) throw new ApiError(404, 'Task not found')
   - res.status(204).end()

Export with module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask }.

Keep the controller free of res.status(4xx).json(...) calls — every failure path uses throw new ApiError(...).
```

**Verify:** No runtime check yet — we wire up routes next.

**Reflect:** Why throw `ApiError` instead of just calling `res.status(404).json(...)` inside the controller?

---

## Step 7 — Define the routes and mount them

**Goal:** Map HTTP verbs+paths to controller functions, then mount the router under `/api/tasks` in `server.js`.

**Concepts:**
- `express.Router()` is a mini Express app you mount under a base path.
- The router file is intentionally tiny — it's just a routing table.

**Prompt to paste into Claude Code:**

```
Create routes/taskRoutes.js and mount it in server.js per CLAUDE.md.

1. routes/taskRoutes.js:

   const express = require('express');
   const router = express.Router();
   const {
     getAllTasks,
     getTaskById,
     createTask,
     updateTask,
     deleteTask,
   } = require('../controllers/taskController');

   router.get('/', getAllTasks);
   router.get('/:id', getTaskById);
   router.post('/', createTask);
   router.put('/:id', updateTask);
   router.delete('/:id', deleteTask);

   module.exports = router;

2. In server.js, AFTER the logger middleware and BEFORE the /health route (order doesn't matter between /health and /api/tasks, but both must be before notFound):

       const taskRoutes = require('./routes/taskRoutes');
       app.use('/api/tasks', taskRoutes);

Do NOT add the 404 handler or error handler yet — that's Step 8.
```

**Verify:**
```bash
npm run dev
curl -i http://localhost:3000/api/tasks
# Expect 200 with body []
curl -i -X POST http://localhost:3000/api/tasks -H "Content-Type: application/json" -d '{"title":"Test"}'
# Expect 201 with body {"id":1,"title":"Test","completed":false}
```
At this point the happy paths work but errors will crash or return ugly stack traces — that's expected. We fix that in the next step.

**Reflect:** When you POST `{"title":"Test"}`, trace the path of the request through every file. Which file does it hit first, second, third?

---

## Step 8 — Add the 404 handler and the global error handler

**Goal:** Catch unmatched routes with a clean 404 JSON, and turn every thrown error into a clean JSON response.

**Concepts:**
- A middleware with **four** parameters `(err, req, res, next)` is recognised by Express as an error handler — that's how Express tells them apart from regular middleware.
- The 404 handler is a regular middleware placed AFTER all routes — anything that fell through gets caught here.
- The error handler must be the **last** `app.use()` in the chain.

**Prompt to paste into Claude Code:**

```
Add the 404 handler and the global error handler per CLAUDE.md.

1. Create middleware/notFound.js:

   const ApiError = require('../utils/ApiError');

   /**
    * Catches any request that didn't match a route above.
    */
   function notFound(req, res, next) {
     next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
   }

   module.exports = notFound;

2. Create middleware/errorHandler.js:

   /**
    * Global error handler. Reads err.statusCode (default 500) and returns a JSON envelope.
    * @param {Error & { statusCode?: number }} err
    */
   function errorHandler(err, req, res, next) {
     const status = typeof err.statusCode === 'number' ? err.statusCode : 500;
     const message = err.message || 'Internal Server Error';

     // Log on the server for debugging — never leak stack traces to clients in prod
     console.error(`[ERROR] ${status} ${message}`);
     if (status === 500) {
       console.error(err.stack);
     }

     res.status(status).json({
       error: {
         message,
         status,
       },
     });
   }

   module.exports = errorHandler;

3. In server.js, register them AFTER all routes (i.e. after app.use('/api/tasks', taskRoutes) and the /health route):

       const notFound = require('./middleware/notFound');
       const errorHandler = require('./middleware/errorHandler');

       app.use(notFound);
       app.use(errorHandler);  // MUST be the very last app.use

Verify the final middleware order in server.js is:
  express.json() -> logger -> /health -> /api/tasks routes -> notFound -> errorHandler
```

**Verify:** ready to do full end-to-end testing — see Step 9.

**Reflect:** Why does `notFound` use `next(new ApiError(...))` instead of sending a 404 response itself?

---

## Step 9 — End-to-end testing with curl

**Goal:** Hit every endpoint and confirm status codes and bodies match the contract in CLAUDE.md §6.

**Concepts:**
- `curl -i` shows response headers (so you can see the status code).
- `-X METHOD` sets the HTTP verb.
- `-H` sets a header. `-d` sets the request body.

**Prompt to paste into Claude Code (optional — only if you'd rather not type the curls yourself):**

```
Create a tests/manual-tests.sh shell script that runs each curl command from CLAUDE.md §6 sequentially against http://localhost:3000, with a short echo before each so the output is readable. Make it executable. Don't actually run it — Illona will run it manually.
```

**Manual test commands** (run these one by one in a second terminal while `npm run dev` is running):

```bash
# 1. Healthcheck — expect 200
curl -i http://localhost:3000/health

# 2. List tasks (empty) — expect 200, []
curl -i http://localhost:3000/api/tasks

# 3. Create a task — expect 201
curl -i -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Express"}'

# 4. Create with missing title — expect 400
curl -i -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" -d '{}'

# 5. Get task 1 — expect 200
curl -i http://localhost:3000/api/tasks/1

# 6. Get unknown id — expect 404
curl -i http://localhost:3000/api/tasks/999

# 7. Get with non-numeric id — expect 400
curl -i http://localhost:3000/api/tasks/abc

# 8. Update task 1 — expect 200, completed: true
curl -i -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# 9. Update with empty body — expect 400
curl -i -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" -d '{}'

# 10. Delete task 1 — expect 204 no body
curl -i -X DELETE http://localhost:3000/api/tasks/1

# 11. Delete again — expect 404
curl -i -X DELETE http://localhost:3000/api/tasks/1

# 12. Hit unknown route — expect 404
curl -i http://localhost:3000/api/nope
```

**Verify:** Every response must match the expected status code in the comment. If any don't, paste the failing curl output back to me here in Cowork and we'll fix it.

**Reflect:** For any 400 or 404 response, look at the JSON body. Does it match the error envelope `{ error: { message, status } }` defined in CLAUDE.md §7.2? If not, that's a bug.

---

## Step 10 — Write the README

**Goal:** Document the project so a stranger (or your trainer) can clone it and run it. Covers the "Code Quality & Clarity (15%)" rubric line.

**Prompt to paste into Claude Code:**

```
Create README.md at the project root per CLAUDE.md, with these sections in this order:

1. # Task Tracker API
   One paragraph: what the project is, that it's for BEM30 Lab 01, and that data is in-memory (no DB).

2. ## Tech Stack
   Bullet list of Node, Express, dotenv, nodemon (with one-line purpose for each).

3. ## Setup
   Numbered steps:
   1. Clone the repo
   2. cd into the folder
   3. npm install
   4. cp .env.example .env
   5. npm run dev (or npm start)

4. ## Project Structure
   A code block with the folder tree from CLAUDE.md §4 (without the planning-doc files).

5. ## API Endpoints
   A markdown table copied from CLAUDE.md §6 (Method | Path | Body | Success | Errors).

6. ## Example Requests
   At least one curl command for each of the 5 CRUD endpoints, taken from BUILD-PROMPTS.md Step 9.

7. ## Error Format
   Show the JSON shape: { "error": { "message": "...", "status": 400 } }.

8. ## Notes
   One short paragraph mentioning that data is stored in memory and is lost when the server restarts; persistence is a future module.

Keep it concise and accurate. Do not include CLAUDE.md or BUILD-PROMPTS.md in the project tree — those are planning artifacts.
```

**Verify:** Open `README.md` in VS Code preview. Every section is present, every link/command is correct, and `npm install && npm run dev` actually works on a freshly cloned copy.

---

## After you finish

Come back to Cowork and tell me:

1. Did all 12 curl tests pass?
2. Anything in the rubric you're unsure your code covers? We can grade it together.
3. Anything that surprised you / clicked / confused you while building?

That last question is the most important — it tells us where to focus on the next lab.

## When something goes wrong

If Claude Code produces something that doesn't work, paste back into Cowork:

- The prompt step number you were on
- The command you ran
- The full error output (terminal log)

Don't try to patch it solo by re-prompting Claude Code repeatedly — that's how subtle bugs get baked in. Bring it here, we diagnose, then I'll give you a corrected prompt.
