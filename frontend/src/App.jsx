import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NoteEditor from './pages/NoteEditor.jsx';
import SharedNotes from './pages/SharedNotes.jsx';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Shared notes route (public) - MUST come before protected routes */}
            <Route path="/shared/:token" element={<SharedNotes />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Add note editor route */}
            <Route path="/notes/:noteId" element={
              <ProtectedRoute>
                <Layout>
                  <NoteEditor />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Redirect to dashboard by default - MUST be last */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;