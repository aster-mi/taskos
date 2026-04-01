import type { TaskAggregate } from '../types';

function renderText(value: string) {
  return value.trim() ? value : 'None';
}

export function TaskDetail({
  task,
  isLoading,
  onStart,
  onDone,
  onBlock,
}: {
  task: TaskAggregate;
  isLoading: boolean;
  onStart: () => void;
  onDone: () => void;
  onBlock: () => void;
}) {
  return (
    <section className="panel detail-panel">
      <div className="detail-header">
        <div>
          <p className="eyebrow">Task</p>
          <h2>{task.title}</h2>
        </div>
        <div className="detail-actions">
          <button className="secondary-button" onClick={onStart} disabled={isLoading}>
            Start
          </button>
          <button className="secondary-button" onClick={onBlock} disabled={isLoading}>
            Block
          </button>
          <button className="primary-button" onClick={onDone} disabled={isLoading}>
            Done
          </button>
        </div>
      </div>

      <div className="detail-meta">
        <span className={`status-badge status-${task.status}`}>{task.status}</span>
        <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
        {task.tags.map((tag) => (
          <span key={tag} className="tag-badge">{tag}</span>
        ))}
        <code>{task.id}</code>
      </div>

      <div className="detail-grid">
        <article>
          <h3>Summary</h3>
          <p>{renderText(task.summary)}</p>
        </article>
        <article>
          <h3>Acceptance Criteria</h3>
          <p>{renderText(task.acceptance_criteria)}</p>
        </article>
        <article>
          <h3>Dependencies</h3>
          <p>{task.dependencies.length > 0 ? task.dependencies.join(', ') : 'None'}</p>
        </article>
        <article>
          <h3>Notes</h3>
          <p>{renderText(task.notes)}</p>
        </article>
      </div>

      <article>
        <h3>References</h3>
        {task.references.length > 0 ? (
          <ul className="detail-list">
            {task.references.map((reference) => (
              <li key={reference}>
                <code>{reference}</code>
              </li>
            ))}
          </ul>
        ) : (
          <p>None</p>
        )}
      </article>

      <article>
        <h3>Recent Logs</h3>
        {task.recent_logs.length > 0 ? (
          <ul className="detail-list">
            {task.recent_logs.map((log) => (
              <li key={`${log.created_at}-${log.message}`}>
                <strong>{log.message}</strong>
                <span>{new Date(log.created_at).toLocaleString()}</span>
                {log.filepath ? <code>{log.filepath}</code> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>No logs yet.</p>
        )}
      </article>

      <div className="detail-footer">
        <span>
          Markdown file: <code>{task.markdown_file}</code>
        </span>
        <span>Updated {new Date(task.updated_at).toLocaleString()}</span>
      </div>
    </section>
  );
}
