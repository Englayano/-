import type { Attachment, Dashboard, Note, Task } from "@/types/electron";

const memory = {
  tasks: [] as Task[],
  notes: [] as Note[],
};

let taskId = 1;
let noteId = 1;

function stamp() {
  return new Date().toISOString();
}

function electron() {
  return typeof window !== "undefined" ? window.mudhakkirah : undefined;
}

export const api = {
  async listTasks() {
    const bridge = electron();
    if (bridge) return bridge.tasks.list();
    return memory.tasks;
  },
  async createTask(input: Partial<Task> & { attachments?: Attachment[] }) {
    const bridge = electron();
    if (bridge) return bridge.tasks.create(input);
    const task: Task = {
      id: taskId++,
      title: input.title || "مهمة جديدة",
      description: input.description || "",
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      priority: input.priority || "medium",
      status: "new",
      created_at: stamp(),
      archived_at: null,
      is_focus_today: false,
      attachments: input.attachments || [],
    };
    memory.tasks.unshift(task);
    return task;
  },
  async updateTask(id: number, input: Partial<Task>) {
    const bridge = electron();
    if (bridge) return bridge.tasks.update(id, input);
    memory.tasks = memory.tasks.map((task) => (task.id === id ? { ...task, ...input } : task));
    return memory.tasks.find((task) => task.id === id) || null;
  },
  async deleteTask(id: number) {
    const bridge = electron();
    if (bridge) return bridge.tasks.delete(id);
    memory.tasks = memory.tasks.filter((task) => task.id !== id);
    return true;
  },
  async setFocusTask(id: number | null) {
    const bridge = electron();
    if (bridge) return bridge.tasks.setFocus(id);
    memory.tasks = memory.tasks.map((task) => ({ ...task, is_focus_today: task.id === id }));
    return memory.tasks.find((task) => task.id === id) || null;
  },
  async dashboard(): Promise<Dashboard> {
    const bridge = electron();
    if (bridge) return bridge.dashboard();
    return {
      focus: memory.tasks.find((task) => task.is_focus_today) || null,
      soon: memory.tasks.slice(0, 4),
      notes: memory.notes.slice(0, 5),
    };
  },
  async pickAttachments() {
    const bridge = electron();
    if (bridge) return bridge.attachments.pick();
    return [];
  },
  async listNotes() {
    const bridge = electron();
    if (bridge) return bridge.notes.list();
    return memory.notes;
  },
  async createNote(input: Partial<Note> = {}) {
    const bridge = electron();
    if (bridge) return bridge.notes.create(input);
    const note: Note = {
      id: noteId++,
      title: input.title || "ملاحظة جديدة",
      content: input.content || "",
      created_at: stamp(),
      updated_at: stamp(),
    };
    memory.notes.unshift(note);
    return note;
  },
  async updateNote(id: number, input: Partial<Note>) {
    const bridge = electron();
    if (bridge) return bridge.notes.update(id, input);
    memory.notes = memory.notes.map((note) => (note.id === id ? { ...note, ...input, updated_at: stamp() } : note));
    return memory.notes.find((note) => note.id === id) || null;
  },
  async deleteNote(id: number) {
    const bridge = electron();
    if (bridge) return bridge.notes.delete(id);
    memory.notes = memory.notes.filter((note) => note.id !== id);
    return true;
  },
  async settings() {
    const bridge = electron();
    if (bridge) return bridge.settings.get();
    return {};
  },
  async setSetting(key: string, value: string) {
    const bridge = electron();
    if (bridge) return bridge.settings.set(key, value);
    return { key, value };
  },
  async checkNotifications() {
    const bridge = electron();
    if (bridge) return bridge.notifications.checkDueTasks();
    return [];
  },
};
