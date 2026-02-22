import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiSettings, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
    const { logout, user } = useAuth();
    const location = useLocation();

    const isActive = (path: string) => location.pathname.startsWith(path);

    return (
        <nav className="navbar glass-panel">
            <div className="navbar-container container">
                <div className="navbar-brand">
                    <Link to="/" className="navbar-logo text-gradient" style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                        VideoApp
                    </Link>
                </div>

                <div className="navbar-links" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <Link
                        to="/dashboard"
                        className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isActive('/dashboard') ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
                    >
                        <FiHome /> <span>Dashboard</span>
                    </Link>

                    <Link
                        to="/settings"
                        className={`nav-link ${isActive('/settings') ? 'active' : ''}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isActive('/settings') ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
                    >
                        <FiSettings /> <span>Settings</span>
                    </Link>

                    <div style={{ height: '24px', width: '1px', background: 'var(--border-light)', margin: '0 0.5rem' }}></div>

                    <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Hi, <strong style={{ color: 'var(--text-primary)' }}>{user?.name || 'User'}</strong>
                        </span>
                        <button onClick={logout} className="btn-secondary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FiLogOut /> Logout
                        </button>
                    </div>
                </div>
            </div>
            <style>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          border-bottom: 1px solid var(--border-light);
          padding: 1rem 0;
        }
        .navbar-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .nav-link {
          font-weight: 500;
          padding: 0.5rem;
          border-radius: var(--radius-sm);
        }
        .nav-link:hover {
          color: var(--text-primary) !important;
          background: rgba(255,255,255,0.05);
        }
        .nav-link.active {
          background: var(--accent-light);
        }
      `}</style>
        </nav>
    );
};

export default Navbar;
