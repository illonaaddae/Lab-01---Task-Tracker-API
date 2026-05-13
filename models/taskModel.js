const tasks = [];
let nextId = 1;

/**
 * Returns a shallow copy of all tasks.
 * @returns {Array<{id: number, title: string, completed: boolean}>}
 */
function findAll() {
  return [...tasks];
}

/**
 * Returns the task with the given id, or undefined if not found.
 * @param {number} id
 * @returns {{id: number, title: string, completed: boolean} | undefined}
 */
function findById(id) {
  return tasks.find((task) => task.id === id);
}

/**
 * Creates a new task and returns it.
 * @param {{title: string, completed?: boolean}} param0
 * @returns {{id: number, title: string, completed: boolean}}
 */
function insert({ title, completed }) {
  const task = { id: nextId++, title, completed: !!completed };
  tasks.push(task);
  return task;
}

/**
 * Applies partial fields to an existing task and returns it, or null if not found.
 * @param {number} id
 * @param {{title?: string, completed?: boolean}} partial
 * @returns {{id: number, title: string, completed: boolean} | null}
 */
function update(id, partial) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return null;
  if (partial.title !== undefined) task.title = partial.title;
  if (partial.completed !== undefined) task.completed = partial.completed;
  return task;
}

/**
 * Removes the task with the given id. Returns true if removed, false if not found.
 * @param {number} id
 * @returns {boolean}
 */
function remove(id) {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return false;
  tasks.splice(index, 1);
  return true;
}

module.exports = { findAll, findById, insert, update, remove };
