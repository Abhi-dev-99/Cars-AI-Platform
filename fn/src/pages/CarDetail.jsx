import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, formatINR } from '../api/client.js';

export default function CarDetail() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBuy, setShowBuy] = useState(false);
  const [buyForm, setBuyForm] = useState({ buyer_name: '', buyer_email: '', buyer_phone: '' });
  const [buyResult, setBuyResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getCar(id)
      .then(({ car }) => setCar(car))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const submitBuy = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await api.buyCar(id, buyForm);
      setBuyResult(result);
    } catch (err) {
      setBuyResult({ error: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Loading car…</div>;
  if (error) return <div className="error">⚠️ {error} <Link to="/">← Back</Link></div>;
  if (!car) return null;

  return (
    <div className="detail">
      <Link to="/" className="back-link">← Back to cars</Link>

      <div className="detail-grid">
        <div className="detail-image">
          <img src={car.image_url} alt={`${car.brand} ${car.model}`} />
        </div>

        <div className="detail-info">
          <h1>{car.brand} {car.model}</h1>
          <p className="detail-sub">{car.year} • {car.body_type} • {car.color}</p>
          <p className="detail-price">{formatINR(car.price_inr)}</p>

          <div className="spec-grid">
            <Spec label="Fuel Type" value={car.fuel_type} />
            <Spec label="Transmission" value={car.transmission} />
            <Spec label="Seats" value={car.seats} />
            <Spec label="Mileage" value={car.mileage_kmpl ? `${car.mileage_kmpl} kmpl` : car.range_km ? `${car.range_km} km range` : '—'} />
            <Spec label="Location" value={car.location} />
            <Spec label="Availability" value={car.available ? 'In stock' : 'Sold'} />
          </div>

          <p className="detail-desc">{car.description}</p>

          {car.features?.length > 0 && (
            <>
              <h3>Key Features</h3>
              <ul className="features">
                {car.features.map((f) => <li key={f}>✓ {f}</li>)}
              </ul>
            </>
          )}

          {!showBuy && !buyResult && (
            <button className="primary" onClick={() => setShowBuy(true)} disabled={!car.available}>
              {car.available ? 'Buy Now' : 'Sold Out'}
            </button>
          )}

          {showBuy && !buyResult && (
            <form className="buy-form" onSubmit={submitBuy}>
              <h3>Reserve this car</h3>
              <input
                required
                placeholder="Your name"
                value={buyForm.buyer_name}
                onChange={(e) => setBuyForm({ ...buyForm, buyer_name: e.target.value })}
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={buyForm.buyer_email}
                onChange={(e) => setBuyForm({ ...buyForm, buyer_email: e.target.value })}
              />
              <input
                placeholder="Phone (optional)"
                value={buyForm.buyer_phone}
                onChange={(e) => setBuyForm({ ...buyForm, buyer_phone: e.target.value })}
              />
              <div className="buy-actions">
                <button type="submit" className="primary" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Confirm'}
                </button>
                <button type="button" onClick={() => setShowBuy(false)}>Cancel</button>
              </div>
            </form>
          )}

          {buyResult && (
            <div className={buyResult.error ? 'error' : 'success'}>
              {buyResult.error
                ? `⚠️ ${buyResult.error}`
                : `✅ ${buyResult.message} Order ID: ${buyResult.order.id}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value }) {
  return (
    <div className="spec">
      <span className="spec-label">{label}</span>
      <span className="spec-value">{value}</span>
    </div>
  );
}
