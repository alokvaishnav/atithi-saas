import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Combine base URL with login endpoint
    const LOGIN_ENDPOINT = `${API_URL}/api/token/`; 

    try {
      const response = await axios.post(LOGIN_ENDPOINT, {
        username: email,    // Sending input as 'username' to match Django backend
        password: password
      });

      console.log("Login Success!");
      
      // 🛡️ PROFESSIONAL ROLE STORAGE
      // We store the access token, refresh token, and the user's role.
      // Note: Ensure your Backend 'token' view includes the user's role in the response.
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      // We assume your backend returns user info like: response.data.user_role
      // If your backend isn't sending role yet, we default to RECEPTIONIST for safety
      const role = response.data.user_role || 'RECEPTIONIST';
      localStorage.setItem('user_role', role);
      
      // Redirect to Dashboard
      window.location.href = '/'; 

    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setError(err.response.data.detail || "Invalid Username or Password.");
      } else {
        setError("Connection failed. Check if server is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-[400px] border-t-8 border-blue-600 animate-fade-in">
        <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-2xl mb-2 shadow-lg shadow-blue-200">A</div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Atithi HMS</h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Property Management</p>
        </div>
        
        {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 text-sm font-medium animate-shake">
                {error}
            </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-2">Username or Email</label>
            <input 
              type="text" 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-slate-700"
              placeholder="Enter your username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-slate-500 text-[10px] font-black uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password" 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-slate-700"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? "Verifying Credentials..." : "Sign In to HMS"}
          </button>
        </form>

        <div className="mt-8 text-center">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              Secure Cloud Access • 2025
            </p>
        </div>
      </div>
    </div>
  );
}