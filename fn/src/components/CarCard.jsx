import { Link } from 'react-router-dom';
import { formatINR } from '../api/client.js';

export default function CarCard({ car }) {
  return (
    <Link to={`/cars/${car.id}`} className="car-card">
      <div className="car-card-image">
        <img src={car.image_url} alt={`${car.brand} ${car.model}`} loading="lazy" />
        <span className="badge">{car.fuel_type}</span>
        {car.match_score != null && <span className="badge badge-match">{car.match_score}% match</span>}
      </div>
      <div className="car-card-body">
        <h3>{car.brand} {car.model}</h3>
        <p className="car-meta">
          {car.year} • {car.body_type} • {car.transmission}
        </p>
        <p className="car-meta">📍 {car.location}</p>
        <div className="car-card-footer">
          <span className="price">{formatINR(car.price_inr)}</span>
          <span className="view-btn">View →</span>
        </div>
      </div>
    </Link>
  );
}
