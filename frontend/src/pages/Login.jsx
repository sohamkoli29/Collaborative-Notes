import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination or default to dashboard
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      console.log('User is authenticated, navigating to:', from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      console.log('Login successful, user should be redirected automatically');
      // Navigation is handled by the useEffect above
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">
            CollabNotes
          </h1>
          <h2 className="text-2xl font-semibold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              create a new account
            </Link>
          </p>
        </div>

        <Card className="animate-fade-in">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Input
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />

            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading}
              className="w-full"
            >
              Sign in
            </Button>
          </form>
        </Card>

        {/* Demo credentials hint */}
        <div className="text-center text-sm text-gray-500">
          <p>Demo: Try with any email and 6+ character password</p>
        </div>
      </div>
    </div>
  );
};

export default Login;