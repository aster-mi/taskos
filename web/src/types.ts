export type TaskStatus = 'todo' | 'in-progress' | 'done' | 'blocked' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  summary: string;
  status: TaskStatus;
  priority: TaskPriority;
  dependencies: string[];
  references: string[];
  acceptance_criteria: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface TaskAggregate {
  id: string;
  title: string;
  summary: string;
  status: TaskStatus;
  priority: TaskPriority;
  acceptance_criteria: string;
  dependencies: string[];
  references: string[];
  recent_logs: Array<{
    message: string;
    filepath?: string;
    created_at: string;
  }>;
  notes: string;
  markdown_file: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  summary?: string;
  priority?: TaskPriority;
  acceptance_criteria?: string;
  dependencies?: string[];
  notes?: string;
}
