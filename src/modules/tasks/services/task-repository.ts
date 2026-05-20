import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { selectRepository } from "@/lib/db/repository-mode";
import type { Task, TaskListFilters } from "@/modules/tasks/types";

type TaskStore = {
  tasks: Task[];
};

const emptyStore: TaskStore = {
  tasks: []
};

export type TaskRepository = {
  listTasks(filters?: TaskListFilters): Promise<Task[]>;
  getTask(taskId: string): Promise<Task | undefined>;
  createTask(task: Task): Promise<Task>;
  updateTask(taskId: string, patch: Partial<Task>): Promise<Task>;
};

export class JsonTaskRepository implements TaskRepository {
  constructor(private readonly filePath = path.join(process.cwd(), ".mock-data", "task-management.json")) {}

  async listTasks(filters: TaskListFilters = {}) {
    const store = await this.readStore();

    return store.tasks
      .filter((task) => !filters.projectId || filters.projectId === "all" || task.projectId === filters.projectId)
      .filter((task) => !filters.status || filters.status === "all" || task.status === filters.status)
      .filter((task) => !filters.priority || filters.priority === "all" || task.priority === filters.priority)
      .filter((task) => !filters.assigneeId || task.assigneeId === filters.assigneeId)
      .sort((a, b) => {
        const dueDateCompare = (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31");

        return dueDateCompare === 0 ? b.updatedAt.localeCompare(a.updatedAt) : dueDateCompare;
      });
  }

  async getTask(taskId: string) {
    const store = await this.readStore();

    return store.tasks.find((task) => task.id === taskId);
  }

  async createTask(task: Task) {
    const store = await this.readStore();
    await this.writeStore({
      tasks: [task, ...store.tasks]
    });

    return task;
  }

  async updateTask(taskId: string, patch: Partial<Task>) {
    const store = await this.readStore();
    const existingTask = store.tasks.find((task) => task.id === taskId);

    if (!existingTask) {
      throw new Error("Không tìm thấy công việc.");
    }

    const updatedTask = {
      ...existingTask,
      ...patch,
      id: existingTask.id,
      createdAt: existingTask.createdAt
    };

    await this.writeStore({
      tasks: store.tasks.map((task) => (task.id === taskId ? updatedTask : task))
    });

    return updatedTask;
  }

  private async readStore(): Promise<TaskStore> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<TaskStore>;

      return {
        tasks: parsed.tasks ?? []
      };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;

      if (code === "ENOENT") {
        return emptyStore;
      }

      throw error;
    }
  }

  private async writeStore(store: TaskStore) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  }
}

type TaskRow = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  due_date: string | null;
  status: Task["status"];
  priority: Task["priority"];
  category: string | null;
  created_at: string;
  updated_at: string;
};

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description ?? undefined,
    assigneeId: row.assignee_id ?? undefined,
    dueDate: row.due_date ?? undefined,
    status: row.status,
    priority: row.priority,
    category: row.category ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function taskToRow(task: Task) {
  return {
    id: task.id,
    project_id: task.projectId,
    title: task.title,
    description: task.description ?? null,
    assignee_id: task.assigneeId ?? null,
    due_date: task.dueDate ?? null,
    status: task.status,
    priority: task.priority,
    category: task.category ?? null,
    created_at: task.createdAt,
    updated_at: task.updatedAt
  };
}

function taskPatchToRow(patch: Partial<Task>) {
  return {
    ...(patch.projectId !== undefined ? { project_id: patch.projectId } : {}),
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.description !== undefined ? { description: patch.description ?? null } : {}),
    ...(patch.assigneeId !== undefined ? { assignee_id: patch.assigneeId ?? null } : {}),
    ...(patch.dueDate !== undefined ? { due_date: patch.dueDate ?? null } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
    ...(patch.category !== undefined ? { category: patch.category ?? null } : {}),
    ...(patch.updatedAt !== undefined ? { updated_at: patch.updatedAt } : {})
  };
}

export class SupabaseTaskRepository implements TaskRepository {
  async listTasks(filters: TaskListFilters = {}) {
    const supabase = await createSupabaseServerClient();
    let query = supabase.from("tasks").select("*").is("archived_at", null);

    if (filters.projectId && filters.projectId !== "all") {
      query = query.eq("project_id", filters.projectId);
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.priority && filters.priority !== "all") {
      query = query.eq("priority", filters.priority);
    }

    if (filters.assigneeId) {
      query = query.eq("assignee_id", filters.assigneeId);
    }

    const { data, error } = await query.order("due_date", { ascending: true, nullsFirst: false }).order("updated_at", {
      ascending: false
    });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as TaskRow[]).map(toTask);
  }

  async getTask(taskId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("tasks").select("*").eq("id", taskId).maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toTask(data as TaskRow) : undefined;
  }

  async createTask(task: Task) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("tasks").insert(taskToRow(task)).select("*").single();

    if (error) {
      throw new Error(error.message);
    }

    return toTask(data as TaskRow);
  }

  async updateTask(taskId: string, patch: Partial<Task>) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("tasks").update(taskPatchToRow(patch)).eq("id", taskId).select("*").single();

    if (error) {
      throw new Error(error.message);
    }

    return toTask(data as TaskRow);
  }
}

export const jsonTaskRepository = new JsonTaskRepository();
export const supabaseTaskRepository = new SupabaseTaskRepository();
export const taskRepository = selectRepository<TaskRepository>({
  mock: jsonTaskRepository,
  supabase: supabaseTaskRepository
});
