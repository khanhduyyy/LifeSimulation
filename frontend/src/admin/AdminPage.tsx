import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Event as GameEvent, Choice, Outcome } from '../types';
import './admin.css';

/* ===== Toast ===== */
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return <div className={`admin-toast ${type === 'error' ? 'admin-toast--error' : ''}`}>{message}</div>;
}

/* ===== Validation helpers ===== */
function validateEvent(titleEn: string, descEn: string): string | null {
  if (!titleEn.trim()) return 'Title (EN) is required';
  if (!descEn.trim()) return 'Description (EN) is required';
  return null;
}

function validateChoice(contentEn: string): string | null {
  if (!contentEn.trim()) return 'Choice content (EN) is required';
  return null;
}

function validateOutcome(msgEn: string, prob: number): string | null {
  if (!msgEn.trim()) return 'Message (EN) is required';
  if (prob < 0 || prob > 100) return 'Probability must be 0-100';
  return null;
}

/* ===== Stat Changes Editor ===== */
function StatChangesEditor({
  value,
  onChange,
}: {
  value: Record<string, number> | null;
  onChange: (v: Record<string, number> | null) => void;
}) {
  const entries = Object.entries(value || {});
  const stats = ['health', 'money', 'happiness'];

  const addStat = () => {
    const available = stats.filter((s) => !entries.find(([k]) => k === s));
    if (available.length === 0) return;
    onChange({ ...(value || {}), [available[0]]: 0 });
  };

  const removeStat = (key: string) => {
    const next = { ...(value || {}) };
    delete next[key];
    onChange(Object.keys(next).length ? next : null);
  };

  const updateStat = (oldKey: string, newKey: string, val: number) => {
    const next: Record<string, number> = {};
    for (const [k, v] of entries) {
      if (k === oldKey) next[newKey] = val;
      else next[k] = v;
    }
    onChange(next);
  };

  return (
    <div>
      {entries.map(([key, val]) => (
        <div key={key} className="admin-stat-row">
          <select value={key} onChange={(e) => updateStat(key, e.target.value, val)}>
            {stats.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="number" className="admin-input admin-input--small" value={val} onChange={(e) => updateStat(key, key, Number(e.target.value))} />
          <button className="admin-btn admin-btn--danger admin-btn--small" onClick={() => removeStat(key)}>✕</button>
        </div>
      ))}
      {entries.length < stats.length && (
        <button className="admin-btn admin-btn--ghost admin-btn--small" onClick={addStat} style={{ marginTop: 4 }}>+ Stat</button>
      )}
    </div>
  );
}

/* ===== Outcome Editor (inline, compact) ===== */
function OutcomeEditor({
  outcome, index, eventId, choiceId, onSaved, showToast,
}: {
  outcome: Outcome; index: number; eventId: number; choiceId: number;
  onSaved: () => void; showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [msgEn, setMsgEn] = useState(outcome.message_en);
  const [msgVi, setMsgVi] = useState(outcome.message_vi || '');
  const [prob, setProb] = useState(outcome.probability);
  const [stats, setStats] = useState<Record<string, number> | null>(outcome.stat_changes);
  const [open, setOpen] = useState(false);

  const save = async () => {
    const err = validateOutcome(msgEn, prob);
    if (err) { showToast(err, 'error'); return; }
    try {
      await api.updateOutcome(eventId, choiceId, outcome.id, {
        message_en: msgEn, message_vi: msgVi, probability: prob, stat_changes: stats || {},
      });
      showToast('Outcome saved!', 'success');
      onSaved();
    } catch { showToast('Failed to save outcome', 'error'); }
  };

  const remove = async () => {
    if (!confirm('Delete this outcome?')) return;
    try {
      await api.deleteOutcome(eventId, choiceId, outcome.id);
      showToast('Outcome deleted', 'success');
      onSaved();
    } catch { showToast('Failed to delete', 'error'); }
  };

  return (
    <div className="admin-outcome">
      <div className="admin-collapsible-header" onClick={() => setOpen(!open)}>
        <span className="admin-collapsible-arrow">{open ? '▾' : '▸'}</span>
        <span className="admin-outcome__number">🎲 Outcome {index + 1}</span>
        <span className="admin-tag admin-tag--muted">{prob}%</span>
        <span className="admin-outcome__preview">{msgEn.slice(0, 40)}{msgEn.length > 40 ? '...' : ''}</span>
        <div className="admin-collapsible-actions" onClick={(e) => e.stopPropagation()}>
          <button className="admin-btn admin-btn--danger admin-btn--icon" onClick={remove} title="Delete">🗑</button>
        </div>
      </div>
      {open && (
        <div className="admin-collapsible-body">
          <div className="admin-field">
            <label className="admin-field__label">Probability (%) <span className="admin-required">*</span></label>
            <input type="number" className="admin-input admin-input--small" value={prob} onChange={(e) => setProb(Number(e.target.value))} min={0} max={100} />
          </div>
          <div className="admin-field">
            <label className="admin-field__label">Message <span className="admin-required">*</span></label>
            <div className="admin-field__row">
              <div><span className="admin-field__lang-tag admin-field__lang-tag--en">EN</span>
                <textarea className="admin-textarea" value={msgEn} onChange={(e) => setMsgEn(e.target.value)} placeholder="English message" /></div>
              <div><span className="admin-field__lang-tag admin-field__lang-tag--vi">VI</span>
                <textarea className="admin-textarea" value={msgVi} onChange={(e) => setMsgVi(e.target.value)} placeholder="Vietnamese message" /></div>
            </div>
          </div>
          <div className="admin-field">
            <label className="admin-field__label">Stat Changes</label>
            <StatChangesEditor value={stats} onChange={setStats} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <button className="admin-btn admin-btn--primary admin-btn--small" onClick={save}>💾 Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Choice Editor (collapsible) ===== */
function ChoiceEditor({
  choice, index, eventId, onSaved, showToast,
}: {
  choice: Choice; index: number; eventId: number;
  onSaved: () => void; showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [contentEn, setContentEn] = useState(choice.content_en);
  const [contentVi, setContentVi] = useState(choice.content_vi || '');
  const [open, setOpen] = useState(false);

  const save = async () => {
    const err = validateChoice(contentEn);
    if (err) { showToast(err, 'error'); return; }
    try {
      await api.updateChoice(eventId, choice.id, { content_en: contentEn, content_vi: contentVi });
      showToast('Choice saved!', 'success');
      onSaved();
    } catch { showToast('Failed to save choice', 'error'); }
  };

  const remove = async () => {
    if (!confirm('Delete this choice and all its outcomes?')) return;
    try {
      await api.deleteChoice(eventId, choice.id);
      showToast('Choice deleted', 'success');
      onSaved();
    } catch { showToast('Failed to delete', 'error'); }
  };

  const addOutcome = async () => {
    try {
      await api.createOutcome(eventId, choice.id, { message_en: 'New outcome', message_vi: '', probability: 50, stat_changes: {} });
      showToast('Outcome added!', 'success');
      onSaved();
    } catch { showToast('Failed to add outcome', 'error'); }
  };

  const totalProb = choice.outcomes.reduce((sum, o) => sum + o.probability, 0);

  return (
    <div className="admin-choice">
      <div className="admin-collapsible-header" onClick={() => setOpen(!open)}>
        <span className="admin-collapsible-arrow">{open ? '▾' : '▸'}</span>
        <span className="admin-choice__number">Choice {index + 1}</span>
        <span className="admin-choice__preview">{contentEn.slice(0, 50)}{contentEn.length > 50 ? '...' : ''}</span>
        <span className="admin-tag admin-tag--muted">{choice.outcomes.length} outcomes</span>
        {totalProb !== 100 && <span className="admin-tag admin-tag--warn">⚠ {totalProb}%</span>}
        <div className="admin-collapsible-actions" onClick={(e) => e.stopPropagation()}>
          <button className="admin-btn admin-btn--danger admin-btn--icon" onClick={remove} title="Delete">🗑</button>
        </div>
      </div>
      {open && (
        <div className="admin-collapsible-body">
          <div className="admin-field">
            <label className="admin-field__label">Content <span className="admin-required">*</span></label>
            <div className="admin-field__row">
              <div><span className="admin-field__lang-tag admin-field__lang-tag--en">EN</span>
                <input className="admin-input" value={contentEn} onChange={(e) => setContentEn(e.target.value)} placeholder="English text" /></div>
              <div><span className="admin-field__lang-tag admin-field__lang-tag--vi">VI</span>
                <input className="admin-input" value={contentVi} onChange={(e) => setContentVi(e.target.value)} placeholder="Vietnamese text" /></div>
            </div>
          </div>
          <div className="admin-action-bar" style={{ borderTop: 'none', marginTop: 0, paddingTop: 0 }}>
            <button className="admin-btn admin-btn--primary admin-btn--small" onClick={save}>💾 Save Choice</button>
          </div>

          {/* Outcomes */}
          <div className="admin-outcomes-section">
            <div className="admin-outcomes-header">
              <span className="admin-field__label" style={{ margin: 0 }}>
                Outcomes ({choice.outcomes.length})
                {totalProb !== 100 && <span className="admin-prob-warn"> — Total: {totalProb}% (should be 100%)</span>}
              </span>
              <button className="admin-btn admin-btn--ghost admin-btn--small" onClick={addOutcome}>+ Outcome</button>
            </div>
            {choice.outcomes.map((outcome, oi) => (
              <OutcomeEditor
                key={outcome.id} outcome={outcome} index={oi}
                eventId={eventId} choiceId={choice.id}
                onSaved={onSaved} showToast={showToast}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Event Detail ===== */
function EventDetail({
  event, onSaved, onDeleted, showToast,
}: {
  event: GameEvent; onSaved: () => void; onDeleted: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [titleEn, setTitleEn] = useState(event.title_en);
  const [titleVi, setTitleVi] = useState(event.title_vi || '');
  const [descEn, setDescEn] = useState(event.description_en);
  const [descVi, setDescVi] = useState(event.description_vi || '');
  const [minAge, setMinAge] = useState(Number(event.conditions?.min_age ?? 18));
  const [maxAge, setMaxAge] = useState(Number(event.conditions?.max_age ?? 22));

  useEffect(() => {
    setTitleEn(event.title_en);
    setTitleVi(event.title_vi || '');
    setDescEn(event.description_en);
    setDescVi(event.description_vi || '');
    setMinAge(Number(event.conditions?.min_age ?? 18));
    setMaxAge(Number(event.conditions?.max_age ?? 22));
  }, [event]);

  const saveEvent = async () => {
    const err = validateEvent(titleEn, descEn);
    if (err) { showToast(err, 'error'); return; }
    if (minAge > maxAge) { showToast('Min age must be ≤ Max age', 'error'); return; }
    try {
      await api.updateEvent(event.id, {
        title_en: titleEn, title_vi: titleVi,
        description_en: descEn, description_vi: descVi,
        conditions: { min_age: minAge, max_age: maxAge },
      });
      showToast('Event saved!', 'success');
      onSaved();
    } catch { showToast('Failed to save event', 'error'); }
  };

  const deleteEvent = async () => {
    if (!confirm(`Delete "${event.title_en}" and all its choices/outcomes?`)) return;
    try {
      await api.deleteEvent(event.id);
      showToast('Event deleted', 'success');
      onDeleted();
    } catch { showToast('Failed to delete', 'error'); }
  };

  const addChoice = async () => {
    try {
      await api.createChoice(event.id, { content_en: 'New choice', content_vi: '' });
      showToast('Choice added!', 'success');
      onSaved();
    } catch { showToast('Failed to add choice', 'error'); }
  };

  return (
    <>
      {/* Event Info */}
      <div className="admin-section">
        <div className="admin-section__header">
          <h2 className="admin-section__title">📋 Event Details</h2>
          <button className="admin-btn admin-btn--danger admin-btn--small" onClick={deleteEvent}>🗑 Delete</button>
        </div>

        <div className="admin-field">
          <label className="admin-field__label">Title <span className="admin-required">*</span></label>
          <div className="admin-field__row">
            <div><span className="admin-field__lang-tag admin-field__lang-tag--en">EN</span>
              <input className="admin-input" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="English title" /></div>
            <div><span className="admin-field__lang-tag admin-field__lang-tag--vi">VI</span>
              <input className="admin-input" value={titleVi} onChange={(e) => setTitleVi(e.target.value)} placeholder="Vietnamese title" /></div>
          </div>
        </div>

        <div className="admin-field">
          <label className="admin-field__label">Description <span className="admin-required">*</span></label>
          <div className="admin-field__row">
            <div><span className="admin-field__lang-tag admin-field__lang-tag--en">EN</span>
              <textarea className="admin-textarea" value={descEn} onChange={(e) => setDescEn(e.target.value)} placeholder="English description" /></div>
            <div><span className="admin-field__lang-tag admin-field__lang-tag--vi">VI</span>
              <textarea className="admin-textarea" value={descVi} onChange={(e) => setDescVi(e.target.value)} placeholder="Vietnamese description" /></div>
          </div>
        </div>

        <div className="admin-field">
          <label className="admin-field__label">Age Range <span className="admin-required">*</span></label>
          <div className="admin-field__inline">
            <span className="admin-field__hint">Min</span>
            <input type="number" className="admin-input admin-input--small" value={minAge} onChange={(e) => setMinAge(Number(e.target.value))} min={0} />
            <span className="admin-field__hint">→ Max</span>
            <input type="number" className="admin-input admin-input--small" value={maxAge} onChange={(e) => setMaxAge(Number(e.target.value))} min={0} />
          </div>
        </div>

        <div className="admin-action-bar">
          <button className="admin-btn admin-btn--primary" onClick={saveEvent}>💾 Save Event</button>
        </div>
      </div>

      {/* Choices - collapsible */}
      <div className="admin-section">
        <div className="admin-section__header">
          <h2 className="admin-section__title">🤔 Choices ({event.choices.length})</h2>
          <button className="admin-btn admin-btn--ghost admin-btn--small" onClick={addChoice}>+ Add Choice</button>
        </div>
        {event.choices.map((choice, ci) => (
          <ChoiceEditor
            key={choice.id} choice={choice} index={ci} eventId={event.id}
            onSaved={onSaved} showToast={showToast}
          />
        ))}
        {event.choices.length === 0 && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No choices yet. Add one above!</p>
        )}
      </div>
    </>
  );
}

/* ===== Main Admin Page ===== */
export default function AdminPage() {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      const data = await api.getEvents();
      setEvents(data);
    } catch {
      showToast('Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const selectedEvent = events.find((e) => e.id === selectedId) || null;

  const handleAddEvent = async () => {
    try {
      const newEvent = await api.createEvent({
        title_en: 'New Event',
        title_vi: '',
        description_en: 'Event description',
        description_vi: '',
        conditions: { min_age: 18, max_age: 22 },
      });
      await loadEvents();
      setSelectedId(newEvent.id);
      showToast('Event created!', 'success');
    } catch {
      showToast('Failed to create event', 'error');
    }
  };

  const getAgeRange = (event: GameEvent) => {
    const min = event.conditions?.min_age ?? '?';
    const max = event.conditions?.max_age ?? '?';
    return `${min}-${max}`;
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header__title">⚙️ Event Manager</div>
        <div className="admin-header__actions">
          <Link to="/" className="admin-back-btn">🎮 Back to Game</Link>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar__header">
            <span className="admin-sidebar__title">Events ({events.length})</span>
            <button className="admin-add-btn" onClick={handleAddEvent}>+ New</button>
          </div>
          <div className="admin-sidebar__list">
            {loading && <div className="admin-loading">Loading...</div>}
            {events.map((event) => (
              <div
                key={event.id}
                className={`admin-event-item ${selectedId === event.id ? 'admin-event-item--active' : ''}`}
                onClick={() => setSelectedId(event.id)}
              >
                <div className="admin-event-item__title">{event.title_en || 'Untitled'}</div>
                <div className="admin-event-item__meta">
                  <span>📅 {getAgeRange(event)}</span>
                  <span>🤔 {event.choices.length}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="admin-content">
          {selectedEvent ? (
            <EventDetail
              event={selectedEvent}
              onSaved={loadEvents}
              onDeleted={async () => { setSelectedId(null); await loadEvents(); }}
              showToast={showToast}
            />
          ) : (
            <div className="admin-empty">
              <div className="admin-empty__icon">📋</div>
              <p>Select an event to edit</p>
            </div>
          )}
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
