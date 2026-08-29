import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Login from './components/Login';
import Register from './components/Register';
import StudentDashboard from './components/StudentDashboard';
import RecruiterDashboard from './components/RecruiterDashboard';
import './App.css';

// Guard component that enforces role access using reactive AuthContext
const RoleRoute = ({ allowedRole, children }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          border: '3px solid rgba(18, 20, 24, 0.12)',
          borderTopColor: '#111827',
          borderRadius: '50%',
          boxShadow: 'var(--neu-shadow-sm)',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
          Authenticating Placement System...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to={user.role === 'student' ? '/student-dashboard' : '/recruiter-dashboard'} replace />;
  }

  return children;
};

// Root redirect handler
const RootRedirect = () => {
  const { user, token, loading } = useAuth();

  if (loading) return null;

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user.role === 'student' ? '/student-dashboard' : '/recruiter-dashboard'} replace />;
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <div className="App">
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Student Protected Route */}
              <Route
                path="/student-dashboard"
                element={
                  <RoleRoute allowedRole="student">
                    <StudentDashboard />
                  </RoleRoute>
                }
              />

              {/* Recruiter Protected Route */}
              <Route
                path="/recruiter-dashboard"
                element={
                  <RoleRoute allowedRole="recruiter">
                    <RecruiterDashboard />
                  </RoleRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </div>
        </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
