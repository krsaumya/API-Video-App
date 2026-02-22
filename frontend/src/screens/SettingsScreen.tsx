import { useState } from 'react';
import { FiUser, FiMail, FiCalendar, FiInfo, FiShield, FiFileText } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const SettingsScreen = () => {
    const { user, logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        if (!window.confirm('Are you sure you want to logout?')) return;

        setIsLoggingOut(true);
        try {
            await logout();
        } catch (error) {
            alert('Failed to logout. Please try again.');
        } finally {
            setIsLoggingOut(false);
        }
    };

    const getInitials = (name: string) => {
        return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
    };

    if (!user) return null;

    return (
        <div className="container animate-fade-in" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '600px' }}>

            {/* Profile Section */}
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem', marginBottom: '2rem' }}>
                <div style={{
                    width: '100px', height: '100px', background: 'var(--accent-gradient)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem', fontSize: '2.5rem', fontWeight: 'bold', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)'
                }}>
                    {getInitials(user.name)}
                </div>
                <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{user.name}</h2>
                <p style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
            </div>

            {/* Account Info */}
            <div className="settings-section">
                <h3 className="section-title">Account Information</h3>

                <div className="info-row">
                    <div className="info-icon"><FiUser /></div>
                    <div className="info-content">
                        <span className="info-label">Full Name</span>
                        <span className="info-value">{user.name}</span>
                    </div>
                </div>

                <div className="info-row">
                    <div className="info-icon"><FiMail /></div>
                    <div className="info-content">
                        <span className="info-label">Email Address</span>
                        <span className="info-value">{user.email}</span>
                    </div>
                </div>

                <div className="info-row">
                    <div className="info-icon"><FiCalendar /></div>
                    <div className="info-content">
                        <span className="info-label">Member Since</span>
                        <span className="info-value">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                    </div>
                </div>
            </div>

            {/* About App */}
            <div className="settings-section">
                <h3 className="section-title">About</h3>

                <div className="info-row">
                    <div className="info-icon"><FiInfo /></div>
                    <div className="info-content">
                        <span className="info-label">App Version</span>
                        <span className="info-value">1.1.0 (Web)</span>
                    </div>
                </div>

                <div className="info-row clickable">
                    <div className="info-icon"><FiShield /></div>
                    <div className="info-content">
                        <span className="info-value">Privacy Policy</span>
                    </div>
                    <div className="chevron">›</div>
                </div>

                <div className="info-row clickable">
                    <div className="info-icon"><FiFileText /></div>
                    <div className="info-content">
                        <span className="info-value">Terms of Service</span>
                    </div>
                    <div className="chevron">›</div>
                </div>
            </div>

            <div>
                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="btn-danger"
                    style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', marginTop: '1rem' }}
                >
                    {isLoggingOut ? <span className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto' }}></span> : 'Sign Out'}
                </button>
            </div>

            <style>{`
        .settings-section {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        .section-title {
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          margin-bottom: 1.25rem;
        }
        .info-row {
          display: flex;
          align-items: center;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .info-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .info-row.clickable {
          cursor: pointer;
          transition: background var(--transition-fast);
          margin: 0 -1.5rem;
          padding: 1rem 1.5rem;
        }
        .info-row.clickable:hover {
          background: rgba(255,255,255,0.02);
        }
        .info-icon {
          color: var(--text-secondary);
          font-size: 1.25rem;
          margin-right: 1.25rem;
        }
        .info-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .info-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
        }
        .info-value {
          color: var(--text-primary);
          font-weight: 500;
        }
        .chevron {
          color: var(--text-muted);
          font-size: 1.5rem;
        }
        .btn-danger {
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-md);
          font-weight: 600;
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-danger:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
        }
      `}</style>
        </div>
    );
};

export default SettingsScreen;
