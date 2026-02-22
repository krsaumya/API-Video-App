import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiLock } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            setError('');
            setIsSubmitting(true);
            await login({ email, password });
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to login. Please check your credentials.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-container animate-fade-in" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
                {/* Decorative elements */}
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--accent-primary)', filter: 'blur(80px)', opacity: '0.4', zIndex: '0' }}></div>
                <div style={{ position: 'absolute', bottom: '-80px', left: '-50px', width: '200px', height: '200px', background: '#a855f7', filter: 'blur(90px)', opacity: '0.3', zIndex: '0' }}></div>

                <div style={{ position: 'relative', zIndex: '1' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome Back</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Sign in to continue your journey</p>
                    </div>

                    {error && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="input-group" style={{ position: 'relative' }}>
                            <FiMail style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                style={{ paddingLeft: '2.5rem' }}
                            />
                        </div>

                        <div className="input-group" style={{ position: 'relative' }}>
                            <FiLock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field"
                                style={{ paddingLeft: '2.5rem' }}
                            />
                        </div>

                        <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ marginTop: '0.5rem' }}>
                            {isSubmitting ? <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div> : 'Sign In'}
                        </button>
                    </form>

                    <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Don't have an account? <Link to="/signup" style={{ fontWeight: '600' }}>Sign up</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
