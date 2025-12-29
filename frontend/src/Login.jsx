import { useState } from 'react';
import api from './api';
import { User, Lock, ArrowRight } from 'lucide-react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Send Username/Password to Django
      const response = await api.post('/token/', {
        username: username,
        password: password
      });

      // 2. If successful, save the "Access Card" (Token)
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      // 3. Tell App.jsx we are logged in
      onLogin();

    } catch (err) {
      console.error("Login Failed", err);
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-slate-800">Welcome Back</h1>
            <p className="text-slate-500 mt-2">Sign in to Atithi SaaS Cloud</p>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm font-bold text-center">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
            <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={20} />
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
            <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                <input 
                  type="password" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? 'Signing In...' : 'Sign In'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
}