import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // Combine base URL with login endpoint
    const LOGIN_ENDPOINT = `${API_URL}/api/token/`; 

    try {
      const response = await axios.post(LOGIN_ENDPOINT, {
        username: email,    // Sending input as 'username'
        password: password
      });

      console.log("Login Success!", response.data);
      
      // Save tokens
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      // Redirect to Dashboard
      window.location.href = '/'; 

    } catch (err) {
      console.error(err);
      setError("Invalid Username or Password. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96 border-t-4 border-blue-600">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Atithi HMS Login</h2>
        
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Username or Email</label>
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="admin"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input 
              type="password" 
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition duration-200"
          >
            Sign In to Dashboard
          </button>
        </form>
        <p className="mt-4 text-center text-gray-500 text-xs">
          Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}
