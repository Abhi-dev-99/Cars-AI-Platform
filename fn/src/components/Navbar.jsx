import { Link, NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="brand">
          <img src="/logo.png" alt="CarZ" className="brand-logo" />
          <span>CarZ</span>
        </Link>
        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Browse
          </NavLink>
          <NavLink to="/configure" className={({ isActive }) => (isActive ? 'active' : '')}>
            CONFIGURE
          </NavLink>
          <NavLink to="/ai" className={({ isActive }) => (isActive ? 'active' : '')}>
            AI Assistant
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
