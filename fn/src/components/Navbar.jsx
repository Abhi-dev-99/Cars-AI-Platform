import { Link, NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="brand">
          <span className="brand-icon">🚗</span>
          <span>CarZ</span>
        </Link>
        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Browse
          </NavLink>
          <NavLink to="/knowledge-base" className={({ isActive }) => (isActive ? 'active' : '')}>
            Knowledge Base
          </NavLink>
          <NavLink to="/ai" className={({ isActive }) => (isActive ? 'active' : '')}>
            AI Assistant
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
