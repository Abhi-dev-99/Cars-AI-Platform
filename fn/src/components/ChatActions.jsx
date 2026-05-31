import { Link } from 'react-router-dom';
import { formatINR } from '../api/client.js';

export default function ChatActions({ actions = [] }) {
  if (!actions.length) return null;
  return (
    <div className="chat-actions">
      {actions.map((a, i) => {
        if (a.type === 'comparison') return <ComparisonTable key={i} cars={a.cars} />;
        if (a.type === 'emi') return <EmiTable key={i} {...a} />;
        if (a.type === 'apply_filters') return <ApplyFiltersCard key={i} {...a} />;
        if (a.type === 'test_drive_booked') return <TestDriveCard key={i} {...a} />;
        return null;
      })}
    </div>
  );
}

function ComparisonTable({ cars }) {
  const rows = [
    ['Price', (c) => formatINR(c.price_inr)],
    ['Year', (c) => c.year],
    ['Fuel', (c) => c.fuel_type],
    ['Transmission', (c) => c.transmission],
    ['Body', (c) => c.body_type],
    ['Seats', (c) => c.seats],
    ['Mileage', (c) => (c.mileage_kmpl ? `${c.mileage_kmpl} kmpl` : c.range_km ? `${c.range_km} km range` : '—')],
    ['Location', (c) => c.location],
  ];
  return (
    <div className="action-card">
      <div className="action-header">⚖️ Side-by-side comparison</div>
      <div className="compare-scroll">
        <table className="compare-table">
          <thead>
            <tr>
              <th></th>
              {cars.map((c) => (
                <th key={c.id}>
                  <Link to={`/cars/${c.id}`}>{c.brand} {c.model}</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, fn]) => (
              <tr key={label}>
                <th>{label}</th>
                {cars.map((c) => <td key={c.id}>{fn(c)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmiTable({ car, price_inr, down_payment_inr, principal_inr, annual_rate_pct, years, monthly_emi_inr, total_payable_inr, total_interest_inr }) {
  const rows = [
    ['Car', car ? `${car.brand} ${car.model}` : '—'],
    ['On-road price', formatINR(price_inr)],
    ['Down payment', formatINR(down_payment_inr)],
    ['Loan principal', formatINR(principal_inr)],
    ['Interest rate', `${annual_rate_pct}% p.a.`],
    ['Tenure', `${years} years`],
    ['Monthly EMI', formatINR(monthly_emi_inr)],
    ['Total interest', formatINR(total_interest_inr)],
    ['Total payable', formatINR(total_payable_inr)],
  ];
  return (
    <div className="action-card">
      <div className="action-header">💰 EMI breakdown</div>
      <table className="emi-table">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}><th>{k}</th><td>{v}</td></tr>
          ))}
        </tbody>
      </table>
      {car && (
        <Link to={`/cars/${car.id}`} className="action-btn">View {car.brand} {car.model} →</Link>
      )}
    </div>
  );
}

function ApplyFiltersCard({ filters, url, match_count }) {
  const chips = Object.entries(filters).map(([k, v]) => (
    <span key={k} className="chip">{k.replace('_', ' ')}: <strong>{String(v)}</strong></span>
  ));
  return (
    <div className="action-card">
      <div className="action-header">🔍 Filters ready</div>
      <div className="chips">{chips}</div>
      <Link to={url} className="action-btn">View {match_count} matching cars →</Link>
    </div>
  );
}

function TestDriveCard({ car, order, buyer_name, buyer_email, preferred_date }) {
  return (
    <div className="action-card success-card">
      <div className="action-header">✅ Test drive booked</div>
      <p><strong>{car.brand} {car.model}</strong> reserved for <strong>{buyer_name}</strong></p>
      <p className="muted">Confirmation sent to {buyer_email}{preferred_date ? ` for ${preferred_date}` : ''}.</p>
      <p className="muted small">Order ID: {order.id}</p>
      <Link to={`/cars/${car.id}`} className="action-btn">View car details →</Link>
    </div>
  );
}
