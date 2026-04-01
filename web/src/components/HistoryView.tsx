import { useEffect, useState } from 'react';
import { listHistory } from '../api';
import type { HistoryEvent } from '../types';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString();
}

export function HistoryView() {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    listHistory()
      .then((data) => setEvents(data))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="history-view">Loading history…</div>;
  }

  if (error) {
    return <div className="history-view error-banner">{error}</div>;
  }

  if (events.length === 0) {
    return <div className="history-view"><p>No history yet.</p></div>;
  }

  return (
    <div className="history-view">
      {events.map((event) => (
        <div key={event.id} className="history-event">
          <span className="history-event-time">{formatDate(event.changed_at)}</span>
          <span className="history-event-title">{event.task_title}</span>
          <span className="history-event-transition">
            <span className={`status-badge status-${event.status_from}`}>{event.status_from}</span>
            <span>→</span>
            <span className={`status-badge status-${event.status_to}`}>{event.status_to}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
