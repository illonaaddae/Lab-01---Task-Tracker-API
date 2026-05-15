const taskModel = require('../models/taskModel');
const ApiError = require('../utils/ApiError');

/**
 * Parses a raw :id param to a number, throws 400 if not numeric.
 * @param {string} raw
 * @returns {number}
 */
function parseId(raw) {
  const id = Number(raw);
  if (Number.isNaN(id)) {
    throw new ApiError(400, 'Invalid task id');
  }
  return id;
}

/**
 * GET /api/tasks — returns the full list of tasks.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function getAllTasks(req, res) {
  res.status(200).json(taskModel.findAll());
}

/**
 * GET /api/tasks/:id — returns a single task by id.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function getTaskById(req, res) {
  const id = parseId(req.params.id);
  const task = taskModel.findById(id);
  if (!task) throw new ApiError(404, 'Task not found');
  res.status(200).json(task);
}

/**
 * POST /api/tasks — creates a new task.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function createTask(req, res) {
  const { title, completed } = req.body || {};
  if (typeof title !== 'string' || title.trim() === '') {
    throw new ApiError(400, 'Title is required and must be a non-empty string');
  }
  if (completed !== undefined && typeof completed !== 'boolean') {
    throw new ApiError(400, 'completed must be a boolean');
  }
  const created = taskModel.insert({ title: title.trim(), completed: completed ?? false });
  res.status(201).json(created);
}

/**
 * PUT /api/tasks/:id — updates an existing task with partial fields.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function updateTask(req, res) {
  const id = parseId(req.params.id);
  const { title, completed } = req.body || {};
  const partial = {};
  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim() === '') {
      throw new ApiError(400, 'title must be a non-empty string');
    }
    partial.title = title.trim();
  }
  if (completed !== undefined) {
    if (typeof completed !== 'boolean') {
      throw new ApiError(400, 'completed must be a boolean');
    }
    partial.completed = completed;
  }
  if (Object.keys(partial).length === 0) {
    throw new ApiError(400, 'Provide at least one of: title, completed');
  }
  const updated = taskModel.update(id, partial);
  if (!updated) throw new ApiError(404, 'Task not found');
  res.status(200).json(updated);
}

/**
 * DELETE /api/tasks/:id — removes a task by id.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function deleteTask(req, res) {
  const id = parseId(req.params.id);
  const ok = taskModel.remove(id);
  if (!ok) throw new ApiError(404, 'Task not found');
  res.status(204).end();
}

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask };
