import { useEffect, useState } from 'react';
import { api, formatINR } from '../api/client.js';

const STORAGE_KEY = 'kb-admin-password';

const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
const BODY_TYPES = ['Hatchback', 'SUV', 'Micro SUV', 'MPV', 'Crossover', 'Sedan', 'Coupe', 'Pickup Truck'];
const TRANSMISSIONS = ['Manual', 'Automatic'];

const EMPTY_CAR = {
  id: '', brand: '', model: '', year: new Date().getFullYear(),
  price_inr: '', fuel_type: 'Petrol', transmission: 'Manual',
  mileage_kmpl: '', range_km: '', seats: 5,
  body_type: 'SUV', color: '', location: '',
  image_url: '', description: '', features: '',
  available: true,
};

export default function KnowledgeBase() {
  const [password, setPassword] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [authed, setAuthed] = useState(false);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState(null);
  const [historyCar, setHistoryCar] = useState(null);

  const loadCars = async (pw = password) => {
    setLoading(true);
    setError(null);
    try {
      const { cars } = await api.admin.list(pw);
      setCars(cars);
      setAuthed(true);
      localStorage.setItem(STORAGE_KEY, pw);
    } catch (e) {
      setError(e.message);
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (password) loadCars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onUnlock = (e) => { e.preventDefault(); loadCars(); };

  const onLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPassword('');
    setAuthed(false);
    setCars([]);
  };

  const showToast = (type, title, body) => {
    setToast({ type, title, body });
    setTimeout(() => setToast(null), 6000);
  };

  const onSave = async (car) => {
    try {
      const payload = {
        ...car,
        year: car.year ? Number(car.year) : undefined,
        price_inr: car.price_inr ? Number(car.price_inr) : undefined,
        mileage_kmpl: car.mileage_kmpl === '' || car.mileage_kmpl == null ? null : Number(car.mileage_kmpl),
        range_km: car.range_km === '' || car.range_km == null ? null : Number(car.range_km),
        seats: Number(car.seats) || 5,
      };
      if (creating) {
        const res = await api.admin.create(password, payload);
        showToast('success', `Added ${res.car.brand} ${res.car.model}`, 'New car added to catalog.');
      } else {
        const res = await api.admin.update(password, editing.id, payload);
        const changes = Object.keys(res.diff || {});
        if (changes.length === 0) {
          showToast('info', 'No changes', 'Nothing to update — all fields match.');
        } else {
          showToast('success', `${changes.length} field${changes.length > 1 ? 's' : ''} updated`, <DiffList diff={res.diff} />);
        }
      }
      setEditing(null);
      setCreating(false);
      await loadCars();
    } catch (e) {
      showToast('error', 'Save failed', e.message);
    }
  };

  const onDelete = async (car) => {
    if (!confirm(`Delete ${car.brand} ${car.model}? This can't be undone.`)) return;
    try {
      await api.admin.remove(password, car.id);
      showToast('success', 'Car deleted', `${car.brand} ${car.model} removed.`);
      await loadCars();
    } catch (e) {
      showToast('error', 'Delete failed', e.message);
    }
  };

  if (!authed) {
    return (
      <form className="kb-unlock" onSubmit={onUnlock}>
        <h3>🔒 Configure — Admin Login</h3>
        <p className="muted small">Enter the admin password (set as <code>ADMIN_PASSWORD</code> on the backend).</p>
        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        <button type="submit" className="primary" disabled={loading || !password}>
          {loading ? 'Checking…' : 'Unlock'}
        </button>
        {error && <div className="error">⚠️ {error}</div>}
      </form>
    );
  }

  if (editing || creating) {
    return (
      <>
        <CarForm
          car={editing || EMPTY_CAR}
          creating={creating}
          onSave={onSave}
          onCancel={() => { setEditing(null); setCreating(false); }}
        />
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </>
    );
  }

  return (
    <div className="kb">
      <div className="kb-toolbar">
        <div>
          <strong>{cars.length} cars</strong> in catalog
          <span className="muted small"> · changes are live for the AI chat instantly</span>
        </div>
        <div className="kb-actions">
          <button className="primary" onClick={() => setCreating(true)}>+ Add Car</button>
          <button onClick={onLogout} className="ghost">Logout</button>
        </div>
      </div>

      {error && <div className="error">⚠️ {error}</div>}
      {loading && <div className="loading">Loading…</div>}

      <div className="kb-table-scroll">
        <table className="kb-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Brand / Model</th>
              <th>Price</th>
              <th>Fuel</th>
              <th>Body</th>
              <th>Available</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cars.map((c) => (
              <tr key={c.id}>
                <td>
                  {c.image_url
                    ? <img src={c.image_url} alt={c.model} className="kb-thumb" />
                    : <div className="kb-thumb kb-thumb-empty">—</div>}
                </td>
                <td>
                  <div><strong>{c.brand}</strong></div>
                  <div className="muted small">{c.model} · {c.year}</div>
                </td>
                <td>{formatINR(c.price_inr)}</td>
                <td>{c.fuel_type}</td>
                <td>{c.body_type}</td>
                <td>{c.available ? '✓' : '—'}</td>
                <td>
                  <button onClick={() => setEditing(c)}>Edit</button>
                  <button onClick={() => setHistoryCar(c)}>History</button>
                  <button onClick={() => onDelete(c)} className="danger">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {historyCar && (
        <HistoryModal car={historyCar} password={password} onClose={() => setHistoryCar(null)} />
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

function DiffList({ diff }) {
  return (
    <ul className="diff-list">
      {Object.entries(diff).map(([field, { before, after }]) => (
        <li key={field}>
          <code>{field}</code>: <s>{fmt(before)}</s> → <strong>{fmt(after)}</strong>
        </li>
      ))}
    </ul>
  );
}

function fmt(v) {
  if (v == null) return '—';
  if (Array.isArray(v)) return v.join(', ') || '—';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

function Toast({ type, title, body, onClose }) {
  return (
    <div className={`toast toast-${type}`} role="alert">
      <button className="toast-close" onClick={onClose} aria-label="Close">×</button>
      <div className="toast-title">{title}</div>
      <div className="toast-body">{body}</div>
    </div>
  );
}

function HistoryModal({ car, password, onClose }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.admin.history(password, car.id)
      .then(({ entries }) => setEntries(entries))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [car.id, password]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📜 History — {car.brand} {car.model}</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <div className="modal-body">
          {loading && <div className="loading">Loading…</div>}
          {error && <div className="error">⚠️ {error}</div>}
          {!loading && entries.length === 0 && (
            <div className="empty">No changes recorded yet. Edits made after this feature was added will show here.</div>
          )}
          <ul className="history-list">
            {entries.map((e) => (
              <li key={e.id} className={`history-entry history-${e.action}`}>
                <div className="history-header">
                  <span className="history-action">{actionLabel(e.action)}</span>
                  <span className="muted small">{new Date(e.created_at).toLocaleString()}</span>
                </div>
                {e.action === 'update' && Object.keys(e.diff || {}).length > 0 && (
                  <DiffList diff={e.diff} />
                )}
                {e.action === 'create' && e.snapshot && (
                  <div className="muted small">Added: {e.snapshot.brand} {e.snapshot.model} at {formatINR(e.snapshot.price_inr)}</div>
                )}
                {e.action === 'delete' && (
                  <div className="muted small">Removed from catalog</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function actionLabel(a) {
  if (a === 'create') return '➕ Created';
  if (a === 'update') return '✏️ Updated';
  if (a === 'delete') return '🗑️ Deleted';
  return a;
}

function CarForm({ car, creating, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({
    ...car,
    features: Array.isArray(car.features) ? car.features.join(', ') : (car.features || ''),
  }));
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form className="kb-form" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
      <h3>{creating ? '+ Add new car' : `Edit ${car.brand} ${car.model}`}</h3>

      <div className="kb-form-grid">
        {creating && (
          <Field label="ID (slug)" hint="Leave blank to auto-generate">
            <input value={form.id} onChange={(e) => set('id', e.target.value)} placeholder="auto-generated" />
          </Field>
        )}
        <Field label="Brand *" required>
          <input value={form.brand} onChange={(e) => set('brand', e.target.value)} required />
        </Field>
        <Field label="Model *" required>
          <input value={form.model} onChange={(e) => set('model', e.target.value)} required />
        </Field>
        <Field label="Year">
          <input type="number" value={form.year} onChange={(e) => set('year', e.target.value)} />
        </Field>
        <Field label="Price (INR) *" required>
          <input type="number" value={form.price_inr} onChange={(e) => set('price_inr', e.target.value)} required />
        </Field>
        <Field label="Fuel Type">
          <select value={form.fuel_type} onChange={(e) => set('fuel_type', e.target.value)}>
            {FUEL_TYPES.map((f) => <option key={f}>{f}</option>)}
          </select>
        </Field>
        <Field label="Transmission">
          <select value={form.transmission} onChange={(e) => set('transmission', e.target.value)}>
            {TRANSMISSIONS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Body Type">
          <select value={form.body_type} onChange={(e) => set('body_type', e.target.value)}>
            {BODY_TYPES.map((b) => <option key={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Seats">
          <input type="number" min="2" max="9" value={form.seats} onChange={(e) => set('seats', e.target.value)} />
        </Field>
        <Field label="Mileage (kmpl)">
          <input type="number" step="0.1" value={form.mileage_kmpl ?? ''} onChange={(e) => set('mileage_kmpl', e.target.value)} />
        </Field>
        <Field label="Electric range (km)">
          <input type="number" value={form.range_km ?? ''} onChange={(e) => set('range_km', e.target.value)} />
        </Field>
        <Field label="Color">
          <input value={form.color || ''} onChange={(e) => set('color', e.target.value)} />
        </Field>
        <Field label="Location">
          <input value={form.location || ''} onChange={(e) => set('location', e.target.value)} />
        </Field>
        <Field label="Image URL" wide>
          <input value={form.image_url || ''} onChange={(e) => set('image_url', e.target.value)} placeholder="https://…" />
        </Field>
        <Field label="Description" wide>
          <textarea rows="2" value={form.description || ''} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <Field label="Features (comma-separated)" wide>
          <input value={form.features} onChange={(e) => set('features', e.target.value)} placeholder="Sunroof, ADAS, 6 Airbags" />
        </Field>
        <Field label="Available">
          <label className="kb-checkbox">
            <input type="checkbox" checked={!!form.available} onChange={(e) => set('available', e.target.checked)} />
            In stock
          </label>
        </Field>
      </div>

      <div className="kb-form-actions">
        <button type="submit" className="primary">{creating ? 'Create car' : 'Save changes'}</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function Field({ label, hint, wide, children }) {
  return (
    <label className={`kb-field${wide ? ' kb-field-wide' : ''}`}>
      <span>{label}</span>
      {children}
      {hint && <span className="muted small">{hint}</span>}
    </label>
  );
}
