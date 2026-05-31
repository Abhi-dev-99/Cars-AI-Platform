import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import CarCard from '../components/CarCard.jsx';

export default function Home() {
  const [cars, setCars] = useState([]);
  const [filters, setFilters] = useState({ brands: [], fuel_types: [], body_types: [] });
  const [query, setQuery] = useState({ search: '', brand: '', fuel_type: '', body_type: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getFilters().then(setFilters).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .listCars(query)
      .then(({ cars }) => setCars(cars))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [query]);

  const updateQuery = (key, value) => setQuery((q) => ({ ...q, [key]: value }));

  return (
    <div>
      <section className="hero">
        <h1>Find your next car, powered by AI</h1>
        <p>Browse the best Indian cars for sale. Hatchbacks, SUVs, EVs and more — all in one place.</p>
      </section>

      <section className="filters">
        <input
          type="search"
          placeholder="Search by brand or model…"
          value={query.search}
          onChange={(e) => updateQuery('search', e.target.value)}
          className="search-input"
        />
        <select value={query.brand} onChange={(e) => updateQuery('brand', e.target.value)}>
          <option value="">All Brands</option>
          {filters.brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={query.fuel_type} onChange={(e) => updateQuery('fuel_type', e.target.value)}>
          <option value="">All Fuel Types</option>
          {filters.fuel_types.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={query.body_type} onChange={(e) => updateQuery('body_type', e.target.value)}>
          <option value="">All Body Types</option>
          {filters.body_types.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </section>

      {error && <div className="error">⚠️ {error}</div>}
      {loading ? (
        <div className="loading">Loading cars…</div>
      ) : cars.length === 0 ? (
        <div className="empty">No cars match your filters.</div>
      ) : (
        <div className="car-grid">
          {cars.map((car) => <CarCard key={car.id} car={car} />)}
        </div>
      )}
    </div>
  );
}
