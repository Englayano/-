export type TaskStatus = "new" | "active" | "done" | "archived";
export type Priority = "low" | "medium" | "high";

export type Attachment = {
  id?: number;
  task_id?: number;
  file_name: string;
  file_path: string;
  file_size: number;
};

export type Task = {
  id: number;
  title: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
  priority: Priority;
  status: TaskStatus;
  created_at: string;
  archived_at: string | null;
  is_focus_today: boolean;
  attachments: Attachment[];
};

export type Note = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type Dashboard = {
  focus: Task | null;
  soon: Task[];
  notes: Note[];
};

export type ShortcutAction = "new-task" | "new-note" | "search" | "delete-selected";

declare global {
  interface Window {
    mudhakkirah?: {
      tasks: {
        list: () => Promise<Task[]>;
        create: (task: Partial<Task> & { attachments?: Attachment[] }) => Promise<Task>;
        update: (id: number, task: Partial<Task>) => Promise<Task | null>;
        delete: (id: number) => Promise<boolean>;
        setFocus: (id: number | null) => Promise<Task | null>;
      };
      notes: {
        list: () => Promise<Note[]>;
        create: (note?: Partial<Note>) => Promise<Note>;
        update: (id: number, note: Partial<Note>) => Promise<Note | null>;
        delete: (id: number) => Promise<boolean>;
      };
      settings: {
        get: () => Promise<Record<string, string>>;
        set: (key: string, value: string) => Promise<{ key: string; value: string }>;
      };
      dashboard: () => Promise<Dashboard>;
      attachments: {
        pick: () => Promise<Attachment[]>;
      };
      notifications: {
        checkDueTasks: () => Promise<Task[]>;
      };
      shortcuts: {
        on: (callback: (action: ShortcutAction) => void) => () => void;
      };
    };
  }
}
