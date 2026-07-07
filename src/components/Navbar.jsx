import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-strong' : 'bg-transparent border-b border-transparent'
      }`}
    >
      <nav className="max-w-5xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-xl font-semibold tracking-tight flex items-center gap-2">
          <span className="text-signal">◆</span> Marginalia
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `hidden sm:block text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
                isActive ? 'text-signal' : 'text-parchment/70 hover:text-parchment'
              }`
            }
          >
            Home
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `hidden sm:block text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
                  isActive ? 'text-signal' : 'text-parchment/70 hover:text-parchment'
                }`
              }
            >
              Admin
            </NavLink>
          )}

          <button
            onClick={toggleTheme}
            aria-label="Toggle dark/light mode"
            className="w-9 h-9 rounded-full flex items-center justify-center border border-parchment/15 hover:border-signal/50 hover:bg-signal/10 transition-colors"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {user ? (
            <button onClick={logout} className="btn-ghost !py-1.5 !px-4 text-sm">
              Sign out
            </button>
          ) : (
            <Link to="/login" className="btn-signal !py-1.5 !px-4 text-sm">
              Admin
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
