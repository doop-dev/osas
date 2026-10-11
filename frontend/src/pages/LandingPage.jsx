import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css';

const CapIcon = () => (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 9 12 4 2 9l10 5 10-5Z" />
        <path d="M6 11.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.5" />
        <path d="M22 9v6" />
    </svg>
);

const ShieldIcon = () => (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3 4.5 6v5.5c0 4.4 3.1 8 7.5 9.5 4.4-1.5 7.5-5.1 7.5-9.5V6L12 3Z" />
        <path d="m9 12 2.2 2.2L15.5 10" />
    </svg>
);

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-container">
            {/* Navigation Bar */}
            <header className="navbar">
                <div className="logo-section">
                    <span className="logo-well">
                        <img src="/cfcst.png" alt="CFCST Logo" className="nav-logo" />
                    </span>
                    <span className="nav-title">CFCST OSAS</span>
                </div>
            </header>

            {/* Main Hero Section */}
            <main className="hero-section">
                <div className="hero-inner">
                    <div className="hero-content">
                        <p className="school-name">Cotabato Foundation College of Science and Technology</p>
                        <h1>Online Scholarship Application System</h1>
                        <p className="subtitle">
                            Streamlined, secure, and accessible scholarship processing for the CFCST student community.
                        </p>
                    </div>

                    <div className="action-cards">
                        {/* Student Portal Card */}
                        <section className="portal-card">
                            <div className="card-head">
                                <span className="card-icon"><CapIcon /></span>
                                <h2>For Students</h2>
                            </div>
                            <p>Submit a new academic application or process your scholarship renewal.</p>
                            <button type="button" onClick={() => navigate('/apply')} className="btn-primary">
                                Apply for Scholarship
                            </button>
                        </section>

                        {/* Admin Portal Card */}
                        <section className="portal-card">
                            <div className="card-head">
                                <span className="card-icon"><ShieldIcon /></span>
                                <h2>For Administrators</h2>
                            </div>
                            <p>Manage student applications, review grades, and generate approval reports.</p>
                            <button type="button" onClick={() => navigate('/admin')} className="btn-secondary">
                                Admin Login
                            </button>
                        </section>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="landing-footer">
                <p>© 2026 Cotabato Foundation College of Science and Technology. All rights reserved.</p>
                <p>Barangay Doroluman, Arakan, Cotabato</p>
            </footer>
        </div>
    );
};

export default LandingPage;