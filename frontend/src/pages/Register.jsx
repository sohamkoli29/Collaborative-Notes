import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      console.log('User is authenticated after registration, navigating to:', from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};

    if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.match(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/)) {
      errors.email = 'Please enter a valid email address';
    }

    if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    const result = await register(
      formData.username,
      formData.email,
      formData.password
    );
    
    if (result.success) {
      console.log('Registration successful, user should be redirected automatically');
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
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              sign in to existing account
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
              label="Username"
              name="username"
              type="text"
              autoComplete="username"
              required
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
              error={formErrors.username}
              disabled={loading}
            />

            <Input
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              error={formErrors.email}
              disabled={loading}
            />

            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Create a password (6+ characters)"
              value={formData.password}
              onChange={handleChange}
              error={formErrors.password}
              disabled={loading}
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={formErrors.confirmPassword}
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
              Create Account
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;