'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    setupKey: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [setupNeeded, setSetupNeeded] = useState(false);

  useEffect(() => {
    // Check if setup is needed (no admin exists)
    const checkSetupStatus = async () => {
      try {
        const res = await fetch('/api/setup/status');
        const data = await res.json();

        if (data.setupNeeded) {
          setSetupNeeded(true);
        } else {
          // Setup already completed, redirect to login
          router.push('/login');
        }
      } catch (error) {
        console.error('Failed to check setup status:', error);
        setError('Failed to check if setup is needed.');
      }
    };

    checkSetupStatus();
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!formData.setupKey) {
      setError('Setup key is required');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          setupKey: formData.setupKey
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to setup admin account');
      }

      // Setup successful, redirect to login
      router.push('/login?setup=success');

    } catch (error) {
      console.error('Setup error:', error);
      setError(error.message || 'Failed to setup admin account');
    } finally {
      setLoading(false);
    }
  };

  if (!setupNeeded && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <p className="text-center text-gray-500">Checking setup status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Initial Admin Setup</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Admin Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="setupKey">
              Setup Key
            </label>
            <input
              id="setupKey"
              name="setupKey"
              type="text"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={formData.setupKey}
              onChange={handleChange}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This is a secure key set in your environment variables.
            </p>
          </div>

          <button
            type="submit"
            className={`w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? 'Setting up...' : 'Create Admin Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
