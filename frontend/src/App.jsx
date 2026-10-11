import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import FormEntry from './pages/FormEntry';
import DocumentView from './pages/DocumentView';
// Import the two new components:
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminArchive from './pages/AdminArchive';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/apply" element={<FormEntry />} />
        <Route path="/document/:id" element={<DocumentView />} />
        
        {/* New Admin Routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/archive" element={<AdminArchive />} />
      </Routes>
    </Router>
  );
}

export default App;