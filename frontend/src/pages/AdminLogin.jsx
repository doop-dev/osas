import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Admin.css';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // Hardcoded testing credentials
        if (username === 'admin' && password === 'Osas@2026') {
            navigate('/admin/dashboard');
        } else {
            setError('Invalid username or password');
        }
    };

    return (
        <div className="admin-layout login-layout">
            <div className="login-card">
                <span className="login-logo-well">
                    <img src="/cfcst.png" alt="Logo" className="login-logo" />
                </span>
                <h2>OSAS Admin Portal</h2>
                {error && <p className="login-error" role="alert">{error}</p>}

                <form onSubmit={handleLogin}>
                    <div className="login-field">
                        <label htmlFor="admin-username">Username</label>
                        <input
                            id="admin-username"
                            type="text"
                            autoComplete="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                        />
                    </div>
                    <div className="login-field">
                        <label htmlFor="admin-password">Password</label>
                        <input
                            id="admin-password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                        />
                    </div>
                    <button type="submit" className="login-btn">
                        Secure Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;