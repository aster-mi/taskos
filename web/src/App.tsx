import { useEffect, useMemo, useState } from 'react';
import { createTask, getTaskAggregate, listTasks, markDone, updateTask } from './api';
import { CreateTaskForm } from './components/CreateTaskForm';
import { HistoryView } from './components/HistoryView';
import { KanbanBoard } from './components/KanbanBoard';
import { TaskDetail } from './components/TaskDetail';
import { TaskList } from './components/TaskList';
import type { CreateTaskInput, Task, TaskAggregate, TaskStatus } from './types';

const FILTERS: Array<{ label: string; value: TaskStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Todo', value: 'todo' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Done', value: 'done' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Cancelled', value: 'cancelled' },
];

type ViewMode = 'list' | 'kanban' | 'history';

const VIEWS: Array<{ label: string; value: ViewMode }> = [
  { label: 'List', value: 'list' },
  { label: 'Kanban', value: 'kanban' },
  { label: 'History', value: 'history' },
];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskAggregate | null>(null);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [view, setView] = useState<ViewMode>('list');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshTasks(nextSelectedId?: string | null) {
    setLoadingList(true);
    try {
      const nextTasks = await listTasks({
        ...(filter === 'all' ? {} : { status: filter }),
      });
      setTasks(nextTasks);

      const candidateId = nextSelectedId ?? selectedTaskId ?? nextTasks[0]?.id ?? null;
      setSelectedTaskId(candidateId);
      if (!candidateId) {
        setSelectedTask(null);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setLoadingList(false);
    }
  }

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach((t) => t.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (selectedTags.length === 0) return tasks;
    return tasks.filter((task) => selectedTags.every((tag) => task.tags.includes(tag)));
  }, [tasks, selectedTags]);

  useEffect(() => {
    void refreshTasks();
  }, [filter]);

  useEffect(() => {
    if (!selectedTaskId) {
      setSelectedTask(null);
      return;
    }

    setLoadingDetail(true);
    setError(null);
    void getTaskAggregate(selectedTaskId)
      .then((task) => setSelectedTask(task))
      .catch((requestError) =>
        setError(requestError instanceof Error ? requestError.message : String(requestError)),
      )
      .finally(() => setLoadingDetail(false));
  }, [selectedTaskId]);

  const hasTasks = tasks.length > 0;
  const selectedTaskTitle =
    tasks.find((task) => task.id === selectedTaskId)?.title ?? 'No task selected';

  async function handleCreateTask(input: CreateTaskInput) {
    setSubmitting(true);
    setError(null);
    try {
      const task = await createTask(input);
      setShowCreateForm(false);
      await refreshTasks(task.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(status: TaskStatus) {
    if (!selectedTaskId) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (status === 'done') {
        await markDone(selectedTaskId);
      } else {
        await updateTask(selectedTaskId, { status });
      }
      await refreshTasks(selectedTaskId);
      const aggregate = await getTaskAggregate(selectedTaskId);
      setSelectedTask(aggregate);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  function handleFilterChange(value: TaskStatus | 'all') {
    setFilter(value);
    setSelectedTags([]);
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div>
            <p className="eyebrow">Local Task Hub</p>
            <h1>taskos</h1>
          </div>
          <button className="primary-button" onClick={() => setShowCreateForm((value) => !value)}>
            {showCreateForm ? 'Close Form' : 'New Task'}
          </button>
        </div>

        <div className="view-switcher">
          {VIEWS.map((v) => (
            <button
              key={v.value}
              className={v.value === view ? 'view-tab active' : 'view-tab'}
              onClick={() => setView(v.value)}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="sidebar-section">
          <p className="eyebrow">Status</p>
          <div className="filter-tabs" role="tablist" aria-label="Task status filters">
            {FILTERS.map((tab) => (
              <button
                key={tab.value}
                className={tab.value === filter ? 'filter-tab active' : 'filter-tab'}
                onClick={() => handleFilterChange(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="sidebar-section">
            <p className="eyebrow">Tags{selectedTags.length > 0 ? ` · ${selectedTags.length} active` : ''}</p>
            <div className="tag-filter-badges">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  className={selectedTags.includes(tag) ? 'tag-filter-badge active' : 'tag-filter-badge'}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        <TaskList
          tasks={filteredTasks}
          isLoading={loadingList}
          selectedTaskId={selectedTaskId}
          onSelectTask={setSelectedTaskId}
        />
      </aside>

      <main className="detail-pane">
        {error ? <div className="error-banner">{error}</div> : null}

        {view === 'history' ? (
          <HistoryView />
        ) : view === 'kanban' ? (
          <KanbanBoard
            tasks={filteredTasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={setSelectedTaskId}
          />
        ) : showCreateForm ? (
          <CreateTaskForm onSubmit={handleCreateTask} isSubmitting={submitting} />
        ) : hasTasks && selectedTask ? (
          <TaskDetail
            task={selectedTask}
            isLoading={loadingDetail || submitting}
            onStart={() => handleStatusChange('in-progress')}
            onDone={() => handleStatusChange('done')}
            onBlock={() => handleStatusChange('blocked')}
          />
        ) : hasTasks && loadingDetail ? (
          <section className="panel empty-state">Loading {selectedTaskTitle}…</section>
        ) : (
          <section className="panel empty-state">
            <h2>No task selected</h2>
            <p>Create a task or choose one from the list to inspect its details.</p>
          </section>
        )}
      </main>
    </div>
  );
}
