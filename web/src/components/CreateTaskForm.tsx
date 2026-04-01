import { useState } from 'react';
import type { CreateTaskInput, TaskPriority } from '../types';

const priorities: TaskPriority[] = ['medium', 'high', 'urgent', 'low'];

export function CreateTaskForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (data: CreateTaskInput) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const isSubmitDisabled = isSubmitting || title.trim() === '';

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      title,
      summary,
      priority,
      acceptance_criteria: acceptanceCriteria,
      notes,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setTitle('');
    setSummary('');
    setPriority('medium');
    setAcceptanceCriteria('');
    setNotes('');
    setTags('');
  }

  return (
    <section className="panel form-panel">
      <div>
        <p className="eyebrow">Create Task</p>
        <h2>New local task</h2>
      </div>
      <form className="task-form" onSubmit={handleSubmit}>
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>
        <label>
          Summary
          <textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={3} />
        </label>
        <label>
          Priority
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
          >
            {priorities.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Acceptance Criteria
          <textarea
            value={acceptanceCriteria}
            onChange={(event) => setAcceptanceCriteria(event.target.value)}
            rows={4}
          />
        </label>
        <label>
          Tags
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="feature, bug, frontend（カンマ区切り）"
          />
        </label>
        <label>
          Notes
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} />
        </label>
        <button className="primary-button" type="submit" disabled={isSubmitDisabled}>
          {isSubmitting ? 'Saving…' : 'Create Task'}
        </button>
      </form>
    </section>
  );
}
