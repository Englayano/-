const path = require("node:path");
const fs = require("node:fs");
const Database = require("better-sqlite3");

const STATUSES = new Set(["new", "active", "done", "archived"]);
const PRIORITIES = new Set(["low", "medium", "high"]);

let db;

function now() {
  return new Date().toISOString();
}

function normalizeDate(value) {
  return value ? String(value) : null;
}

function ensureDb(app) {
  if (db) return db;

  const dir = path.join(app.getPath("userData"), "data");
  fs.mkdirSync(dir, { recursive: true });
  db = new Database(path.join(dir, "mudhakkirah.sqlite"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate();
  return db;
}

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      start_date TEXT,
      end_date TEXT,
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL,
      archived_at TEXT,
      is_focus_today INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT 'ملاحظة جديدة',
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

function archiveOldDoneTasks() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`
    UPDATE tasks
    SET status = 'archived', archived_at = COALESCE(archived_at, ?)
    WHERE status = 'done' AND archived_at IS NOT NULL AND archived_at <= ?
  `).run(cutoff, cutoff);
}

function mapTask(row) {
  return row
    ? {
        ...row,
        is_focus_today: Boolean(row.is_focus_today),
        attachments: listAttachments(row.id),
      }
    : null;
}

function listTasks({ includeArchived = false } = {}) {
  archiveOldDoneTasks();
  const rows = db
    .prepare(
      includeArchived
        ? "SELECT * FROM tasks ORDER BY created_at DESC"
        : "SELECT * FROM tasks WHERE status != 'archived' ORDER BY created_at DESC",
    )
    .all();
  return rows.map(mapTask);
}

function getTask(id) {
  return mapTask(db.prepare("SELECT * FROM tasks WHERE id = ?").get(id));
}

function createTask(input) {
  const created = now();
  const priority = PRIORITIES.has(input.priority) ? input.priority : "medium";
  const info = db
    .prepare(
      `INSERT INTO tasks
       (title, description, start_date, end_date, priority, status, created_at, archived_at, is_focus_today)
       VALUES (?, ?, ?, ?, ?, 'new', ?, NULL, 0)`,
    )
    .run(
      String(input.title || "").trim() || "مهمة جديدة",
      input.description || "",
      normalizeDate(input.start_date),
      normalizeDate(input.end_date),
      priority,
      created,
    );

  if (Array.isArray(input.attachments)) {
    const insertAttachment = db.prepare(
      "INSERT INTO attachments (task_id, file_name, file_path, file_size) VALUES (?, ?, ?, ?)",
    );
    for (const attachment of input.attachments) {
      insertAttachment.run(info.lastInsertRowid, attachment.file_name, attachment.file_path, attachment.file_size || 0);
    }
  }

  return getTask(info.lastInsertRowid);
}

function updateTask(id, input) {
  const current = getTask(id);
  if (!current) return null;

  const nextStatus = STATUSES.has(input.status) ? input.status : current.status;
  const archivedAt =
    nextStatus === "done" && current.status !== "done"
      ? now()
      : nextStatus === "archived"
        ? current.archived_at || now()
        : nextStatus !== "done"
          ? null
          : current.archived_at;

  db.prepare(
    `UPDATE tasks
     SET title = ?, description = ?, start_date = ?, end_date = ?, priority = ?, status = ?, archived_at = ?
     WHERE id = ?`,
  ).run(
    input.title ?? current.title,
    input.description ?? current.description,
    normalizeDate(input.start_date ?? current.start_date),
    normalizeDate(input.end_date ?? current.end_date),
    PRIORITIES.has(input.priority) ? input.priority : current.priority,
    nextStatus,
    archivedAt,
    id,
  );

  return getTask(id);
}

function deleteTask(id) {
  return db.prepare("DELETE FROM tasks WHERE id = ?").run(id).changes > 0;
}

function setFocusTask(id) {
  const task = id ? getTask(id) : null;
  const transaction = db.transaction(() => {
    db.prepare("UPDATE tasks SET is_focus_today = 0").run();
    if (task && task.status !== "archived") {
      db.prepare("UPDATE tasks SET is_focus_today = 1 WHERE id = ?").run(id);
    }
  });
  transaction();
  return id ? getTask(id) : null;
}

function dashboard() {
  archiveOldDoneTasks();
  const today = new Date();
  const max = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000);
  const soon = db
    .prepare(
      `SELECT * FROM tasks
       WHERE status != 'archived' AND status != 'done' AND end_date IS NOT NULL AND date(end_date) <= date(?)
       ORDER BY date(end_date) ASC, created_at DESC`,
    )
    .all(max.toISOString().slice(0, 10))
    .map(mapTask);
  const focus = mapTask(db.prepare("SELECT * FROM tasks WHERE is_focus_today = 1 AND status != 'archived' LIMIT 1").get());
  const notes = listNotes(5);
  return { focus, soon, notes };
}

function listAttachments(taskId) {
  return db.prepare("SELECT * FROM attachments WHERE task_id = ? ORDER BY id ASC").all(taskId);
}

function listNotes(limit = 100) {
  return db.prepare("SELECT * FROM notes ORDER BY updated_at DESC LIMIT ?").all(limit);
}

function getNote(id) {
  return db.prepare("SELECT * FROM notes WHERE id = ?").get(id) || null;
}

function createNote(input = {}) {
  const stamp = now();
  const title = String(input.title || "").trim() || "ملاحظة جديدة";
  const content = input.content || "";
  const info = db
    .prepare("INSERT INTO notes (title, content, created_at, updated_at) VALUES (?, ?, ?, ?)")
    .run(title, content, stamp, stamp);
  return getNote(info.lastInsertRowid);
}

function updateNote(id, input) {
  const current = getNote(id);
  if (!current) return null;
  const title = String(input.title ?? current.title).trim() || "بدون عنوان";
  db.prepare("UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ?").run(
    title,
    input.content ?? current.content,
    now(),
    id,
  );
  return getNote(id);
}

function deleteNote(id) {
  return db.prepare("DELETE FROM notes WHERE id = ?").run(id).changes > 0;
}

function getSettings() {
  const rows = db.prepare("SELECT key, value FROM settings").all();
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

function setSetting(key, value) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(
    key,
    value,
  );
  return { key, value };
}

function dueTasksForNotification() {
  const today = new Date().toISOString().slice(0, 10);
  return db
    .prepare(
      `SELECT * FROM tasks
       WHERE status NOT IN ('done', 'archived') AND end_date IS NOT NULL AND date(end_date) <= date(?, '+4 days')
       ORDER BY date(end_date) ASC`,
    )
    .all(today)
    .map(mapTask);
}

module.exports = {
  ensureDb,
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  setFocusTask,
  dashboard,
  listNotes,
  createNote,
  updateNote,
  deleteNote,
  getSettings,
  setSetting,
  dueTasksForNotification,
};
